import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const features = [
  {
    title: 'Course Explorer',
    description:
      'Search any course by department and number. View term offerings, prerequisites, descriptions, and GPA distributions.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Course Planner',
    description:
      'Drag-and-drop interface to organize your 4-year schedule. Track progress toward graduation requirements in real-time.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: 'Academic Calendar',
    description:
      'Stay on top of important dates. View registration deadlines, academic events, and holidays all in one place.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

export default function MainPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with gradient background */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100/50" />

          {/* Decorative blobs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Made for UIUC Students
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              <span className="text-slate-800">Navigate Your Academic</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Journey with Confidence
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Plan your 4-year schedule with ease. CoursePilot helps you fulfill
              major requirements and pick technical electives without stress.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button as="link" to="/course-planner" size="lg" className="shadow-lg shadow-blue-500/25">
                Start Planning
              </Button>
              <Button as="link" to="/course-explorer" variant="secondary" size="lg">
                Explore Courses
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-16">
              {[
                { value: '10,000+', label: 'Courses' },
                { value: '200+', label: 'Majors' },
                { value: 'Free', label: 'Forever' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-white to-blue-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Everything you need to{' '}
                <span className="text-blue-600">succeed</span>
              </h2>
              <p className="mt-3 text-slate-600 max-w-xl mx-auto">
                Built specifically for UIUC students to streamline course
                planning and graduation tracking.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <Card key={feature.title} hover variant="gradient" className="text-center group">
                  <div className={`
                    inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4
                    transition-transform group-hover:scale-110
                    ${index === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : ''}
                    ${index === 1 ? 'bg-gradient-to-br from-blue-600 to-blue-700' : ''}
                    ${index === 2 ? 'bg-gradient-to-br from-blue-700 to-blue-800' : ''}
                    text-white shadow-lg
                  `}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to start planning?
            </h2>
            <p className="text-blue-200 mb-8 max-w-xl mx-auto">
              Join thousands of students who use CoursePilot to navigate their
              academic journey.
            </p>
            <Button
              as="link"
              to="/course-planner"
              size="lg"
              className="bg-white text-blue-950 hover:bg-blue-50 shadow-xl"
            >
              Get Started Free
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
