import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
  type ChartConfiguration,
} from 'chart.js';
import { supabase } from '../lib/supabase';
import '../styles/course_explore.css';
import '../styles/footer.css';
import logo from '../assets/logo.png';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Title);

type CourseInfo = {
  term: string;
  title: string;
  description: string;
  prerequisite: string;
  creditHours?: string;
};

type GradeRow = {
  subject: string;
  number: number;
  course_title: string;
  a_plus: number;
  a: number;
  a_minus: number;
  b_plus: number;
  b: number;
  b_minus: number;
  c_plus: number;
  c: number;
  c_minus: number;
  d_plus: number;
  d: number;
  d_minus: number;
  f: number;
  w: number;
  total_students: number;
  gpa: number;
};

const DEFAULT_YEAR = '2024';
const DEFAULT_SEMESTER = 'fall';

const gradeOrder = [
  { key: 'a_plus', label: 'A+' },
  { key: 'a', label: 'A' },
  { key: 'a_minus', label: 'A-' },
  { key: 'b_plus', label: 'B+' },
  { key: 'b', label: 'B' },
  { key: 'b_minus', label: 'B-' },
  { key: 'c_plus', label: 'C+' },
  { key: 'c', label: 'C' },
  { key: 'c_minus', label: 'C-' },
  { key: 'd_plus', label: 'D+' },
  { key: 'd', label: 'D' },
  { key: 'd_minus', label: 'D-' },
  { key: 'f', label: 'F' },
  { key: 'w', label: 'W' },
] as const;

type GradeKey = (typeof gradeOrder)[number]['key'];

type GradeChartData = {
  labels: string[];
  counts: number[];
  totalStudents: number;
  gpa: number;
};

function getGradeColor(grade: string) {
  if (grade.startsWith('A')) return 'rgba(75, 192, 75, 0.7)';
  if (grade.startsWith('B')) return 'rgba(54, 162, 235, 0.7)';
  if (grade.startsWith('C')) return 'rgba(255, 206, 86, 0.7)';
  if (grade.startsWith('D')) return 'rgba(255, 159, 64, 0.7)';
  if (grade === 'F') return 'rgba(255, 99, 132, 0.7)';
  return 'rgba(201, 203, 207, 0.7)';
}

export default function CourseExplorer() {
  const [department, setDepartment] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [gradeData, setGradeData] = useState<GradeChartData | null>(null);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!gradeData || !chartRef.current) return;

    const backgroundColors = gradeData.labels.map(getGradeColor);
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: gradeData.labels,
        datasets: [
          {
            label: 'Number of Students',
            data: gradeData.counts,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map((color) => color.replace('0.7', '1')),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Students',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Grade',
            },
          },
        },
        plugins: {
          title: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y as number;
                const percentage = gradeData.totalStudents
                  ? ((value / gradeData.totalStudents) * 100).toFixed(1)
                  : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, config);

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [gradeData]);

  const fetchCourseInfo = async (dept: string, number: string) => {
    const { data, error: functionError } = await supabase.functions.invoke('uiuc-course', {
      body: {
        year: DEFAULT_YEAR,
        semester: DEFAULT_SEMESTER,
        department: dept,
        courseNumber: number,
      },
    });

    if (functionError) {
      throw new Error(functionError.message);
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Course not found or API error');
    }

    return data as CourseInfo;
  };

  const fetchGradeDistribution = async (dept: string, number: string) => {
    const numberValue = Number(number);
    const query = Number.isNaN(numberValue) ? number : numberValue;

    const { data, error: supaError } = await supabase
      .from('gpa_raw_public')
      .select('*')
      .eq('subject', dept)
      .eq('number', query)
      .limit(1)
      .maybeSingle();

    if (supaError) {
      throw new Error(supaError.message);
    }

    if (!data) {
      return null;
    }

    const gradeRow = data as GradeRow;

    const labels = gradeOrder.map((grade) => grade.label);
    const counts = gradeOrder.map((grade) => gradeRow[grade.key as GradeKey] || 0);

    return {
      labels,
      counts,
      totalStudents: gradeRow.total_students,
      gpa: gradeRow.gpa,
    } satisfies GradeChartData;
  };

  const searchCourse = async () => {
    const dept = department.trim().toUpperCase();
    const number = courseNumber.trim();

    if (!dept || !number) {
      setError('Please enter both department and course number');
      return;
    }

    setError('');
    setCourseInfo(null);
    setGradeData(null);
    setLoading(true);

    try {
      const [course, grades] = await Promise.all([
        fetchCourseInfo(dept, number),
        fetchGradeDistribution(dept, number).catch(() => null),
      ]);

      setCourseInfo(course);
      setGradeData(grades);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
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
          <a href="/">Course Planner</a>
          <a href="/course-explorer">Course Explorer</a>
        </nav>
      </header>

      <main className="container">
        <h1 className="main-title">Course Search</h1>

        <label htmlFor="course">What course are you looking for?</label>
        <input
          type="text"
          id="course"
          placeholder="Type in your course (e.g. ECE)"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') searchCourse();
          }}
        />

        <label htmlFor="course-number">What is the course number?</label>
        <input
          type="text"
          id="course-number"
          placeholder="Type in your course number (e.g. 101)"
          value={courseNumber}
          onChange={(event) => setCourseNumber(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') searchCourse();
          }}
        />

        <div className="selection">
          <button className="search-btn" type="button" onClick={searchCourse}>
            Find Course
          </button>
        </div>

        {loading && <div className="loading">Searching for course information...</div>}

        {error && <div className="error-message">{error}</div>}

        {courseInfo && (
          <div className="course-result">
            <h2>
              {department.toUpperCase()} {courseNumber.toUpperCase()}: {courseInfo.title}
            </h2>
            <p>
              <span className="label">Term:</span> {courseInfo.term}
            </p>
            <p>
              <span className="label">Description:</span> {courseInfo.description}
            </p>
            <p>
              <span className="label">Prerequisites:</span> {courseInfo.prerequisite}
            </p>
            <div className="gpa-highlight">
              <p>
                <span className="label">Average GPA:</span> {gradeData ? gradeData.gpa : 'Not available'}
              </p>
            </div>

            {gradeData && (
              <div className="chart-container">
                <h3 className="chart-title">
                  Grade Distribution for {department.toUpperCase()} {courseNumber.toUpperCase()}
                </h3>
                <canvas id="grade-chart" ref={chartRef}></canvas>
                <p className="chart-info">
                  Total Students: {gradeData.totalStudents} | Average GPA: {gradeData.gpa}
                </p>
              </div>
            )}
          </div>
        )}
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
                <li><a href="/">Course Planner</a></li>
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
