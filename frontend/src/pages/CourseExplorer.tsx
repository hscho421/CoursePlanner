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
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

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
  if (grade.startsWith('A')) return 'rgba(91, 124, 245, 0.8)'; // blue-500
  if (grade.startsWith('B')) return 'rgba(74, 99, 224, 0.8)'; // blue-600
  if (grade.startsWith('C')) return 'rgba(59, 79, 199, 0.7)'; // blue-700
  if (grade.startsWith('D')) return 'rgba(148, 163, 184, 0.7)'; // slate-400
  if (grade === 'F') return 'rgba(239, 68, 68, 0.7)'; // red
  return 'rgba(203, 213, 225, 0.7)'; // slate-300
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
            borderColor: backgroundColors.map((color) => color.replace('0.7', '1').replace('0.8', '1')),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(226, 232, 240, 0.5)',
            },
            ticks: {
              color: '#64748b',
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
            },
          },
        },
        plugins: {
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            padding: 12,
            cornerRadius: 8,
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') searchCourse();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        {/* Background gradient */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100/30" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              10,000+ Courses
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Course Explorer</h1>
            <p className="mt-2 text-slate-600">
              Find detailed information about any UIUC course
            </p>
          </div>

          {/* Search Card */}
          <Card className="mb-8">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Input
                label="Department"
                placeholder="e.g., CS, ECE, MATH"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Input
                label="Course Number"
                placeholder="e.g., 101, 225, 374"
                value={courseNumber}
                onChange={(e) => setCourseNumber(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button
              onClick={searchCourse}
              disabled={loading}
              isLoading={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Searching...' : 'Search Course'}
            </Button>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600">Searching for course information...</p>
            </Card>
          )}

          {/* Course Results */}
          {courseInfo && !loading && (
            <Card hover>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-xl">
                    {department.toUpperCase()} {courseNumber.toUpperCase()}:{' '}
                    {courseInfo.title}
                  </CardTitle>
                  {gradeData && (
                    <Badge variant="primary" className="text-sm px-3 py-1">
                      GPA: {gradeData.gpa.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Term</h4>
                  <p className="text-slate-800">{courseInfo.term}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">
                    Description
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    {courseInfo.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">
                    Prerequisites
                  </h4>
                  <p className="text-slate-700">
                    {courseInfo.prerequisite || 'None'}
                  </p>
                </div>

                {/* Grade Distribution Chart */}
                {gradeData && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-medium text-slate-800 mb-4">
                      Grade Distribution
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <canvas ref={chartRef} />
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-sm text-slate-600">
                      <span>
                        Total Students:{' '}
                        <strong className="text-slate-800">
                          {gradeData.totalStudents.toLocaleString()}
                        </strong>
                      </span>
                      <span>
                        Average GPA:{' '}
                        <strong className="text-slate-800">
                          {gradeData.gpa.toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!courseInfo && !loading && !error && (
            <div className="text-center py-12 text-slate-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p>Enter a department and course number to search</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
