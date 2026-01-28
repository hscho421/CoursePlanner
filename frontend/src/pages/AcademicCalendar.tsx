import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

type EventType = 'registration' | 'deadline' | 'academic' | 'holiday';
type FilterType = 'all' | EventType;

type CalendarEvent = {
  date: string;
  type: EventType;
  description: string;
};

type Semester = {
  name: string;
  dates: string;
  events: CalendarEvent[];
};

const eventTypeConfig: Record<EventType, { label: string; variant: 'primary' | 'warning' | 'default' | 'success' }> = {
  registration: { label: 'Registration', variant: 'primary' },
  deadline: { label: 'Deadline', variant: 'warning' },
  academic: { label: 'Academic', variant: 'default' },
  holiday: { label: 'Holiday', variant: 'success' },
};

const semesters: Semester[] = [
  {
    name: 'Fall Semester 2024',
    dates: 'August 26, 2024 - December 18, 2024',
    events: [
      { date: 'Aug 5-23', type: 'registration', description: 'Fall Registration Period' },
      { date: 'Aug 26', type: 'academic', description: 'Instruction Begins' },
      { date: 'Sep 2', type: 'holiday', description: 'Labor Day (no classes)' },
      { date: 'Sep 9', type: 'deadline', description: 'Last day to add a course without department approval' },
      { date: 'Oct 14-15', type: 'academic', description: 'Fall Break (no classes)' },
      { date: 'Oct 18', type: 'deadline', description: 'Last day to drop a course without a "W" grade' },
      { date: 'Oct 28-Nov 15', type: 'registration', description: 'Spring Registration Period' },
      { date: 'Nov 1', type: 'deadline', description: 'Last day to drop a course with a "W" grade' },
      { date: 'Nov 23-Dec 1', type: 'holiday', description: 'Thanksgiving Break (no classes)' },
      { date: 'Dec 11', type: 'academic', description: 'Last day of instruction' },
      { date: 'Dec 13-20', type: 'academic', description: 'Final Examinations' },
    ],
  },
  {
    name: 'Spring Semester 2025',
    dates: 'January 21, 2025 - May 14, 2025',
    events: [
      { date: 'Jan 20', type: 'holiday', description: 'Martin Luther King Jr. Day (no classes)' },
      { date: 'Jan 21', type: 'academic', description: 'Instruction Begins' },
      { date: 'Feb 3', type: 'deadline', description: 'Last day to add a course without department approval' },
      { date: 'Mar 15-23', type: 'holiday', description: 'Spring Break (no classes)' },
      { date: 'Mar 28', type: 'deadline', description: 'Last day to drop a course with a "W" grade' },
      { date: 'Apr 1-19', type: 'registration', description: 'Summer/Fall Registration Period' },
      { date: 'May 7', type: 'academic', description: 'Last day of instruction' },
      { date: 'May 9-16', type: 'academic', description: 'Final Examinations' },
      { date: 'May 18', type: 'academic', description: 'Commencement' },
    ],
  },
  {
    name: 'Summer Semester 2025',
    dates: 'May 26, 2025 - August 8, 2025',
    events: [
      { date: 'May 26', type: 'holiday', description: 'Memorial Day (no classes)' },
      { date: 'May 27', type: 'academic', description: 'First 4-week and 8-week sessions begin' },
      { date: 'May 30', type: 'deadline', description: 'Last day to add/drop first 4-week courses' },
      { date: 'Jun 23', type: 'academic', description: 'Second 4-week session begins' },
      { date: 'Jul 4', type: 'holiday', description: 'Independence Day (no classes)' },
      { date: 'Jul 21', type: 'academic', description: 'Third 4-week session begins' },
      { date: 'Aug 8', type: 'academic', description: 'Summer session ends' },
    ],
  },
];

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'registration', label: 'Registration' },
  { value: 'deadline', label: 'Deadlines' },
  { value: 'academic', label: 'Academic' },
  { value: 'holiday', label: 'Holidays' },
];

export default function AcademicCalendar() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filterEvents = (events: CalendarEvent[]) => {
    if (activeFilter === 'all') return events;
    return events.filter((event) => event.type === activeFilter);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        {/* Background gradient */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100/30" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              2024-2025 Academic Year
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Academic Calendar
            </h1>
            <p className="mt-2 text-slate-600">
              Important dates and deadlines for UIUC students
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${
                    activeFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Semester Sections */}
          <div className="space-y-6">
            {semesters.map((semester) => {
              const filteredEvents = filterEvents(semester.events);
              if (filteredEvents.length === 0) return null;

              return (
                <Card key={semester.name} padding="none">
                  {/* Semester Header */}
                  <div className="bg-blue-950 text-white px-5 py-4">
                    <h2 className="font-semibold text-lg">{semester.name}</h2>
                    <p className="text-blue-200 text-sm mt-0.5">{semester.dates}</p>
                  </div>

                  {/* Events Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700 w-32">
                            Date
                          </th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700 w-36">
                            Type
                          </th>
                          <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEvents.map((event, index) => {
                          const config = eventTypeConfig[event.type];
                          return (
                            <tr
                              key={index}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-5 py-3 text-sm text-slate-600">
                                {event.date}
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant={config.variant}>
                                  {config.label}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-sm text-slate-800">
                                {event.description}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
