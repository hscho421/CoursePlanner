import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/course_planner.css';
import '../styles/footer.css';
import logo from '../assets/logo.png';

type CourseResult = {
  subject: string;
  number: number;
  title: string;
  credits?: number;
};

type Semester = {
  id: string;
  yearLabel: string;
  term: 'Fall' | 'Spring';
  yearIndex: number;
};

type DragPayload = {
  course: CourseResult;
  sourceSemesterId?: string;
};

export default function CoursePlanner() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [majorsError, setMajorsError] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [transferCredits, setTransferCredits] = useState('0');
  const [plan, setPlan] = useState<Record<string, CourseResult[]>>({});
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const creditsCacheRef = useRef(new Map<string, number>());

  const totalRequiredCredits = 128;
  const transferCreditsValue = Number(transferCredits) || 0;

  const semesterCredits = useMemo(() => {
    const map = new Map<string, number>();
    Object.entries(plan).forEach(([semesterId, courses]) => {
      const sum = courses.reduce((acc, course) => acc + (course.credits ?? 3), 0);
      map.set(semesterId, sum);
    });
    return map;
  }, [plan]);

  const plannedCredits = useMemo(() => {
    return Array.from(semesterCredits.values()).reduce((acc, value) => acc + value, 0);
  }, [semesterCredits]);

  const totalCredits = transferCreditsValue + plannedCredits;
  const progressPercent = Math.min(100, (totalCredits / totalRequiredCredits) * 100);

  const semesters = useMemo<Semester[]>(() => {
    const yearNames = ['First', 'Second', 'Third', 'Fourth'];
    const yearIndexMap: Record<string, number> = {
      freshman: 0,
      sophomore: 1,
      junior: 2,
      senior: 3,
    };

    const startIndex = academicYear ? yearIndexMap[academicYear] ?? 0 : 0;
    const yearsRemaining = Math.max(1, 4 - startIndex);
    const list: Semester[] = [];

    for (let i = 0; i < yearsRemaining; i += 1) {
      const yearIndex = startIndex + i;
      const yearLabel = yearNames[yearIndex] ?? `${yearIndex + 1}th`;
      const yearNumber = yearIndex + 1;
      list.push(
        { id: `Y${yearNumber}-Fall`, yearLabel, term: 'Fall', yearIndex: yearNumber },
        { id: `Y${yearNumber}-Spring`, yearLabel, term: 'Spring', yearIndex: yearNumber },
      );
    }

    return list;
  }, [academicYear]);

  const semestersByYear = useMemo(() => {
    const map = new Map<number, Semester[]>();
    semesters.forEach((semester) => {
      const list = map.get(semester.yearIndex) ?? [];
      list.push(semester);
      map.set(semester.yearIndex, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [semesters]);

  useEffect(() => {
    const storedPlan = localStorage.getItem('coursePlan');
    if (storedPlan) {
      try {
        const parsed = JSON.parse(storedPlan) as Record<string, CourseResult[]>;
        setPlan(parsed);
      } catch {
        setPlan({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('coursePlan', JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    const validIds = new Set(semesters.map((semester) => semester.id));
    setPlan((prev) => {
      const next: Record<string, CourseResult[]> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (validIds.has(key)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [semesters]);

  const parseCredits = (creditHours: string | undefined) => {
    if (!creditHours) return 3;
    const match = creditHours.match(/\d+(\.\d+)?/);
    if (!match) return 3;
    return Number(match[0]);
  };

  const resolveCredits = async (course: CourseResult, force = false) => {
    if (course.credits && !force) return course.credits;
    const key = `${course.subject}-${course.number}`;
    if (!force) {
      const cached = creditsCacheRef.current.get(key);
      if (cached) return cached;
    }

    const { data, error } = await supabase.functions.invoke('uiuc-course', {
      body: {
        year: '2024',
        semester: 'fall',
        department: course.subject,
        courseNumber: String(course.number),
      },
    });

    if (error || !data) {
      return 3;
    }

    const credits = parseCredits(data.creditHours);
    creditsCacheRef.current.set(key, credits);
    return credits;
  };

  useEffect(() => {
    const storedMajor = localStorage.getItem('selectedMajor');
    if (storedMajor) {
      setSelectedMajor(storedMajor);
    }
    const storedYear = localStorage.getItem('academicYear');
    if (storedYear) {
      setAcademicYear(storedYear);
    }
    const storedGrad = localStorage.getItem('graduationYear');
    if (storedGrad) {
      setGraduationYear(storedGrad);
    }
    const storedTransfer = localStorage.getItem('transferCredits');
    if (storedTransfer) {
      setTransferCredits(storedTransfer);
    }
  }, []);

  const searchCourses = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setError('Search query must be at least 2 characters');
      setResults([]);
      return;
    }

    setError('');
    setLoading(true);
    setResults([]);

    const normalized = trimmed.toUpperCase();
    const codeMatch = normalized.match(/^([A-Z]{2,4})\s*([0-9]{3})$/);
    const subjectCode = codeMatch?.[1];
    const numberCode = codeMatch?.[2];
    const pattern = `%${normalized}%`;
    const [{ data: subjectMatches, error: subjectError }, { data: titleMatches, error: titleError }] =
      await Promise.all([
        supabase.from('courses').select('subject, number, title').ilike('subject', pattern).limit(20),
        supabase.from('courses').select('subject, number, title').ilike('title', pattern).limit(20),
      ]);

    if (subjectError || titleError) {
      setError(subjectError?.message || titleError?.message || 'Search failed');
      setLoading(false);
      return;
    }

    let combined = ([] as CourseResult[]).concat(subjectMatches ?? [], titleMatches ?? []);

    if (subjectCode && numberCode) {
      const numeric = Number(numberCode);
      const { data: exactMatches, error: exactError } = await supabase
        .from('courses')
        .select('subject, number, title')
        .eq('subject', subjectCode)
        .eq('number', numeric)
        .limit(10);

      if (!exactError && exactMatches) {
        combined = combined.concat(exactMatches);
      }
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      const { data: numberMatches, error: numberError } = await supabase
        .from('courses')
        .select('subject, number, title')
        .eq('number', numeric)
        .limit(20);

      if (!numberError && numberMatches) {
        const map = new Map<string, CourseResult>();
        combined.concat(numberMatches).forEach((row) => {
          map.set(`${row.subject}-${row.number}`, row);
        });
        combined = Array.from(map.values());
      }
    }

    setResults(combined);
    setLoading(false);
  };

  const loadMajors = async () => {
    if (majors.length) return;
    setMajorsLoading(true);
    setMajorsError('');

    const { data, error: majorsErrorResponse } = await supabase
      .from('Majors')
      .select('major_name')
      .order('major_name', { ascending: true });

    if (majorsErrorResponse) {
      setMajorsError(majorsErrorResponse.message);
      setMajorsLoading(false);
      return;
    }

    setMajors((data ?? []).map((row) => row.major_name as string));
    setMajorsLoading(false);
  };

  const handleDragStart =
    (course: CourseResult, sourceSemesterId?: string) =>
    (event: DragEvent<HTMLDivElement>) => {
      const payload: DragPayload = { course, sourceSemesterId };
      event.dataTransfer.setData('application/json', JSON.stringify(payload));
      event.dataTransfer.effectAllowed = 'move';
    };

  const handleDrop =
    (semesterId: string) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOverId(null);
      const data = event.dataTransfer.getData('application/json');
      if (!data) return;

      let payload: DragPayload;
      try {
        payload = JSON.parse(data) as DragPayload;
      } catch {
        return;
      }

      const applyCourseToSemester = (course: CourseResult) => {
        setPlan((prev) => {
          const next = { ...prev };
          const courseKey = `${course.subject}-${course.number}`;

          Object.keys(next).forEach((key) => {
            next[key] = (next[key] || []).filter(
              (item) => `${item.subject}-${item.number}` !== courseKey,
            );
          });

          const updated = next[semesterId] ? [...next[semesterId]] : [];
          updated.push(course);
          next[semesterId] = updated;

          return next;
        });
      };

      if (payload.course.credits) {
        applyCourseToSemester(payload.course);
        return;
      }

      resolveCredits(payload.course)
        .then((credits) => {
          applyCourseToSemester({ ...payload.course, credits });
        })
        .catch(() => {
          applyCourseToSemester({ ...payload.course, credits: 3 });
        });
    };

  const handleDragOver =
    (semesterId: string) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOverId(semesterId);
    };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const removeCourseFromSemester = (semesterId: string, course: CourseResult) => {
    setPlan((prev) => ({
      ...prev,
      [semesterId]: (prev[semesterId] || []).filter(
        (item) => `${item.subject}-${item.number}` !== `${course.subject}-${course.number}`,
      ),
    }));
  };

  const refreshCredits = async () => {
    const allCourses = Object.entries(plan).flatMap(([semesterId, courses]) =>
      courses.map((course) => ({ semesterId, course })),
    );

    if (!allCourses.length) return;

    const updatedEntries = await Promise.all(
      allCourses.map(async ({ semesterId, course }) => {
        const credits = await resolveCredits(course, true);
        return { semesterId, course: { ...course, credits } };
      }),
    );

    setPlan((prev) => {
      const next: Record<string, CourseResult[]> = { ...prev };
      updatedEntries.forEach(({ semesterId, course }) => {
        next[semesterId] = (next[semesterId] || []).map((item) =>
          `${item.subject}-${item.number}` === `${course.subject}-${course.number}` ? course : item,
        );
      });
      return next;
    });
  };

  const resetPlan = () => {
    setPlan({});
    localStorage.removeItem('coursePlan');
  };

  return (
    <div>
      <header>
        <div className="logo">
          <a href="/">
            <img src={logo} alt="CoursePilot Logo" />
          </a>
        </div>
        <nav className="navbar">
          <a href="/course-planner">Course Planner</a>
          <a href="/course-explorer">Course Explorer</a>
        </nav>
      </header>

      <main className="container">
        <h1 className="main-title">Your Personalized Course Plan</h1>

        <div className="user-info">
          <h2>Your Academic Profile</h2>
          <p>
            <span className="info-label">Major:</span> <span>{selectedMajor || 'Not selected'}</span>
          </p>
          <p>
            <span className="info-label">Academic Year:</span> <span>{academicYear || 'Not selected'}</span>
          </p>
          <p>
            <span className="info-label">Expected Graduation:</span> <span>{graduationYear || 'Not set'}</span>
          </p>
          <p>
            <span className="info-label">Transfer Credits:</span> <span>{transferCreditsValue}</span> hours
          </p>

          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#0D1B40' }}>Edit Profile</summary>
            <div style={{ margin: '12px 0' }}>
              <span className="info-label">Select Major:</span>
              <div style={{ marginTop: '8px' }}>
                <select
                  className="search-input"
                  onFocus={loadMajors}
                  onClick={loadMajors}
                  value={selectedMajor}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedMajor(value);
                    localStorage.setItem('selectedMajor', value);
                  }}
                >
                  <option value="" disabled>
                    {majorsLoading ? 'Loading majors...' : 'Choose a major'}
                  </option>
                  {majors.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
                {majorsError && <div className="error">{majorsError}</div>}
              </div>
            </div>
            <div style={{ margin: '10px 0' }}>
            <span className="info-label">Academic Year:</span>
            <div style={{ marginTop: '8px' }}>
              <select
                className="search-input"
                value={academicYear}
                onChange={(event) => {
                  const value = event.target.value;
                  setAcademicYear(value);
                  localStorage.setItem('academicYear', value);
                }}
              >
                <option value="" disabled>
                  Select academic year
                </option>
                <option value="freshman">Freshman</option>
                <option value="sophomore">Sophomore</option>
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            </div>
            <div style={{ margin: '10px 0' }}>
            <span className="info-label">Expected Graduation:</span>
            <div style={{ marginTop: '8px' }}>
              <input
                className="search-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2028"
                value={graduationYear}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                  setGraduationYear(value);
                  localStorage.setItem('graduationYear', value);
                }}
              />
            </div>
            </div>
            <div style={{ margin: '10px 0' }}>
            <span className="info-label">Transfer Credits:</span>
            <div style={{ marginTop: '8px' }}>
              <input
                className="search-input"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={transferCredits}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 3) || '0';
                  setTransferCredits(value);
                  localStorage.setItem('transferCredits', value);
                }}
              />
            </div>
            </div>
          </details>
        </div>

        <div className="course-pool">
          <h2>Add Courses to Your Plan</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for a course (e.g., CS 101)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') searchCourses();
              }}
            />
            <button type="button" onClick={searchCourses}>
              Search
            </button>
          </div>

          {loading && <div className="loading-indicator">Searching for courses...</div>}
          {error && <div className="error-message">{error}</div>}

          {!loading && !error && results.length === 0 && (
            <div className="empty-message">Search for courses above.</div>
          )}

          <div className="pool-courses" style={{ display: results.length ? 'flex' : 'none' }}>
            {results.map((course) => (
              <div
                className="pool-course"
                key={`${course.subject}-${course.number}`}
                draggable
                onDragStart={handleDragStart(course)}
              >
                <h4>
                  {course.subject} {course.number}
                </h4>
                <p>{course.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="planner-container">
          <div className="requirements-panel">
            <h2>Degree Requirements</h2>

            <div className="requirement-category">
              <h3>Total Credits</h3>
              <div
                className="progress-bar-container"
                style={{
                  backgroundColor: '#f0f0f0',
                  borderRadius: '10px',
                  height: '20px',
                  width: '100%',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    backgroundColor: progressPercent >= 90 ? '#4CAF50' : '#E35D0D',
                    borderRadius: '10px',
                    height: '20px',
                    width: `${progressPercent}%`,
                  }}
                ></div>
              </div>
              <p style={{ fontSize: '18px', textAlign: 'center' }}>
                {totalCredits} / {totalRequiredCredits} hours
              </p>
            </div>

            <div className="requirement-category">
              <h3>Major Requirements</h3>
              <div className="requirement-list">
                <div className="requirement-item">
                  <div className="requirement-name">Major Courses</div>
                  <div className="requirement-status pending">0 courses</div>
                </div>
                <div className="requirement-item">
                  <div className="requirement-name">Technical Electives</div>
                  <div className="requirement-status pending">0 courses</div>
                </div>
              </div>
            </div>

            <div className="requirement-category">
              <h3>General Education</h3>
              <div className="requirement-list">
                <div className="requirement-item">
                  <div className="requirement-name">Humanities</div>
                  <div className="requirement-status pending">0 courses</div>
                </div>
                <div className="requirement-item">
                  <div className="requirement-name">Social Sciences</div>
                  <div className="requirement-status pending">0 courses</div>
                </div>
                <div className="requirement-item">
                  <div className="requirement-name">Natural Sciences</div>
                  <div className="requirement-status pending">0 courses</div>
                </div>
                <div className="requirement-item">
                  <div className="requirement-name">Other GenEd</div>
                  <div className="requirement-status pending">0 courses</div>
                </div>
              </div>
            </div>
          </div>

          <div className="semester-container">
            {semestersByYear.map(([yearIndex, yearSemesters]) => {
              const yearLabel = yearSemesters[0]?.yearLabel ?? `${yearIndex}th`;
              const yearCredits = yearSemesters.reduce(
                (acc, semester) => acc + (semesterCredits.get(semester.id) ?? 0),
                0,
              );
              return (
                <div className="academic-year" data-year={yearIndex} key={yearIndex}>
                  <div className="year-header">
                    <h2>{yearLabel} Year</h2>
                    <span className="credits">{yearCredits} credits</span>
                  </div>
                  <div className="semesters">
                    {yearSemesters.map((semester) => (
                      <div className="semester" data-term={semester.term} key={semester.id}>
                        <h3>{semester.term} Semester</h3>
                        <div
                          className={`course-list ${dragOverId === semester.id ? 'drag-over' : ''}`}
                          onDrop={handleDrop(semester.id)}
                          onDragOver={handleDragOver(semester.id)}
                          onDragLeave={handleDragLeave}
                        >
                          {(plan[semester.id] || []).map((course) => (
                            <div
                              className="added-course"
                              key={`${semester.id}-${course.subject}-${course.number}`}
                              draggable
                              onDragStart={handleDragStart(course, semester.id)}
                            >
                              <h4>
                                {course.subject} {course.number}
                              </h4>
                              <p>
                                {course.title}
                                <span className="credits-badge">{course.credits ?? 3} hrs</span>
                              </p>
                              <button
                                className="remove-course"
                                type="button"
                                onClick={() => removeCourseFromSemester(semester.id, course)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="action-buttons">
          <button className="save-plan-btn" disabled>
            Save My Course Plan
          </button>
          <button className="export-pdf-btn" disabled>
            Export as PDF
          </button>
          <button className="save-plan-btn" type="button" onClick={refreshCredits}>
            Refresh Credits
          </button>
          <button className="reset-plan-btn" type="button" onClick={resetPlan}>
            Reset Plan
          </button>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src={logo} alt="CoursePilot Logo" />
            <p>Navigating your academic journey</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Features</h4>
              <ul>
                <li><a href="/course-explorer">Course Explorer</a></li>
                <li><a href="/course-planner">Course Planner</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a href="/academic-calendar">Academic Calendar</a></li>
                <li><a href="/faq">FAQ</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>About</h4>
              <ul>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-social">
            <h4>Connect With Us</h4>
            <div className="social-icons">
              <a href="#" className="social-icon" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 CoursePilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
