import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

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

const academicYearOptions = [
  { value: 'freshman', label: 'Freshman' },
  { value: 'sophomore', label: 'Sophomore' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
];

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
  const [showProfileEdit, setShowProfileEdit] = useState(false);
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
        { id: `Y${yearNumber}-Spring`, yearLabel, term: 'Spring', yearIndex: yearNumber }
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
              (item) => `${item.subject}-${item.number}` !== courseKey
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
        (item) => `${item.subject}-${item.number}` !== `${course.subject}-${course.number}`
      ),
    }));
  };

  const refreshCredits = async () => {
    const allCourses = Object.entries(plan).flatMap(([semesterId, courses]) =>
      courses.map((course) => ({ semesterId, course }))
    );

    if (!allCourses.length) return;

    const updatedEntries = await Promise.all(
      allCourses.map(async ({ semesterId, course }) => {
        const credits = await resolveCredits(course, true);
        return { semesterId, course: { ...course, credits } };
      })
    );

    setPlan((prev) => {
      const next: Record<string, CourseResult[]> = { ...prev };
      updatedEntries.forEach(({ semesterId, course }) => {
        next[semesterId] = (next[semesterId] || []).map((item) =>
          `${item.subject}-${item.number}` === `${course.subject}-${course.number}` ? course : item
        );
      });
      return next;
    });
  };

  const resetPlan = () => {
    setPlan({});
    localStorage.removeItem('coursePlan');
  };

  const majorOptions = majors.map((m) => ({ value: m, label: m }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Course Planner</h1>
            <p className="text-slate-600 mt-1">
              Drag and drop courses to build your schedule
            </p>
          </div>

          {/* Profile Summary Bar */}
          <Card className="mb-6" padding="sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Major:</span>{' '}
                  <span className="font-medium text-slate-800">
                    {selectedMajor || 'Not selected'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Year:</span>{' '}
                  <span className="font-medium text-slate-800 capitalize">
                    {academicYear || 'Not selected'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Graduation:</span>{' '}
                  <span className="font-medium text-slate-800">
                    {graduationYear || 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Transfer:</span>{' '}
                  <span className="font-medium text-slate-800">
                    {transferCreditsValue} hrs
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileEdit(!showProfileEdit)}
              >
                {showProfileEdit ? 'Close' : 'Edit Profile'}
              </Button>
            </div>

            {/* Expandable Profile Edit */}
            {showProfileEdit && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Major
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={loadMajors}
                    value={selectedMajor}
                    onChange={(e) => {
                      setSelectedMajor(e.target.value);
                      localStorage.setItem('selectedMajor', e.target.value);
                    }}
                  >
                    <option value="">
                      {majorsLoading ? 'Loading...' : 'Select major'}
                    </option>
                    {majorOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {majorsError && (
                    <p className="text-xs text-red-600 mt-1">{majorsError}</p>
                  )}
                </div>

                <Select
                  label="Academic Year"
                  options={academicYearOptions}
                  placeholder="Select year"
                  value={academicYear}
                  onChange={(e) => {
                    setAcademicYear(e.target.value);
                    localStorage.setItem('academicYear', e.target.value);
                  }}
                />

                <Input
                  label="Graduation Year"
                  placeholder="e.g., 2028"
                  value={graduationYear}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                    setGraduationYear(value);
                    localStorage.setItem('graduationYear', value);
                  }}
                />

                <Input
                  label="Transfer Credits"
                  placeholder="0"
                  value={transferCredits}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3) || '0';
                    setTransferCredits(value);
                    localStorage.setItem('transferCredits', value);
                  }}
                />
              </div>
            )}
          </Card>

          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Left Sidebar - Requirements */}
            <aside className="space-y-4">
              <Card>
                <h2 className="font-semibold text-slate-800 mb-4">
                  Degree Progress
                </h2>
                <ProgressBar
                  value={totalCredits}
                  max={totalRequiredCredits}
                  label="Total Credits"
                  size="lg"
                />
                <p className="text-center text-sm text-slate-500 mt-2">
                  {totalRequiredCredits - totalCredits > 0
                    ? `${totalRequiredCredits - totalCredits} credits remaining`
                    : 'Requirement met!'}
                </p>
              </Card>

              <Card>
                <h3 className="font-semibold text-slate-800 mb-3">
                  Major Requirements
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Major Courses</span>
                    <Badge variant="outline">0 courses</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">
                      Technical Electives
                    </span>
                    <Badge variant="outline">0 courses</Badge>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-slate-800 mb-3">
                  General Education
                </h3>
                <div className="space-y-2">
                  {['Humanities', 'Social Sciences', 'Natural Sciences', 'Other'].map(
                    (cat) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-sm text-slate-600">{cat}</span>
                        <Badge variant="outline">0 courses</Badge>
                      </div>
                    )
                  )}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" onClick={refreshCredits}>
                  Refresh Credits
                </Button>
                <Button variant="ghost" size="sm" onClick={resetPlan}>
                  Reset Plan
                </Button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="space-y-6">
              {/* Course Search */}
              <Card>
                <h2 className="font-semibold text-slate-800 mb-4">
                  Search Courses
                </h2>
                <div className="flex gap-3">
                  <Input
                    placeholder="Search by course code or title (e.g., CS 225)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') searchCourses();
                    }}
                    className="flex-1"
                  />
                  <Button onClick={searchCourses} isLoading={loading}>
                    Search
                  </Button>
                </div>

                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}

                {/* Search Results */}
                {results.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {results.map((course) => (
                      <div
                        key={`${course.subject}-${course.number}`}
                        draggable
                        onDragStart={handleDragStart(course)}
                        className="p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-grab hover:shadow-sm hover:border-blue-200 transition-all active:cursor-grabbing"
                      >
                        <div className="font-medium text-blue-900 text-sm">
                          {course.subject} {course.number}
                        </div>
                        <p className="text-xs text-blue-700 truncate mt-0.5">
                          {course.title}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!loading && results.length === 0 && !error && (
                  <p className="text-sm text-slate-500 mt-4 text-center">
                    Search for courses to add to your plan
                  </p>
                )}
              </Card>

              {/* Semester Grid */}
              {semestersByYear.map(([yearIndex, yearSemesters]) => {
                const yearLabel = yearSemesters[0]?.yearLabel ?? `${yearIndex}th`;
                const yearCredits = yearSemesters.reduce(
                  (acc, semester) => acc + (semesterCredits.get(semester.id) ?? 0),
                  0
                );
                return (
                  <div
                    key={yearIndex}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                  >
                    {/* Year Header */}
                    <div className="bg-blue-950 text-white px-5 py-3 flex justify-between items-center">
                      <h3 className="font-semibold">{yearLabel} Year</h3>
                      <span className="text-blue-200 text-sm">
                        {yearCredits} credits
                      </span>
                    </div>

                    {/* Semesters */}
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                      {yearSemesters.map((semester) => (
                        <div
                          key={semester.id}
                          className={`p-4 min-h-[200px] transition-colors ${
                            dragOverId === semester.id
                              ? 'bg-blue-50 ring-2 ring-inset ring-blue-300'
                              : ''
                          }`}
                          onDrop={handleDrop(semester.id)}
                          onDragOver={handleDragOver(semester.id)}
                          onDragLeave={handleDragLeave}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-slate-700">
                              {semester.term}
                            </h4>
                            <span className="text-xs text-slate-500">
                              {semesterCredits.get(semester.id) ?? 0} hrs
                            </span>
                          </div>

                          <div className="space-y-2">
                            {(plan[semester.id] || []).length === 0 && (
                              <p className="text-sm text-slate-400 text-center py-8">
                                Drop courses here
                              </p>
                            )}
                            {(plan[semester.id] || []).map((course) => (
                              <div
                                key={`${semester.id}-${course.subject}-${course.number}`}
                                className="group relative p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={handleDragStart(course, semester.id)}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-medium text-slate-800 text-sm">
                                      {course.subject} {course.number}
                                    </span>
                                    <p className="text-xs text-slate-600 truncate">
                                      {course.title}
                                    </p>
                                  </div>
                                  <Badge variant="primary" className="shrink-0">
                                    {course.credits ?? 3} hrs
                                  </Badge>
                                </div>

                                <button
                                  type="button"
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                                  onClick={() =>
                                    removeCourseFromSemester(semester.id, course)
                                  }
                                  aria-label={`Remove ${course.subject} ${course.number}`}
                                >
                                  &times;
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
