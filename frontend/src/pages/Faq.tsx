import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

const faqData: FaqSection[] = [
  {
    id: 'general',
    title: 'General Questions',
    items: [
      {
        question: 'What is CoursePilot and how does it help me?',
        answer:
          'CoursePilot is a comprehensive course planning and exploration tool designed specifically for college students. It helps you create a personalized 4-year academic plan, track your progress toward degree requirements, explore course offerings, and make informed decisions about which courses to take each semester.',
      },
      {
        question: 'Is CoursePilot officially affiliated with my university?',
        answer:
          'CoursePilot is currently focused on serving students at the University of Illinois Urbana-Champaign (UIUC), particularly within the Grainger College of Engineering. While we use official course data from the university, CoursePilot is an independent platform. We recommend confirming your course choices with your academic advisor.',
      },
      {
        question: 'Do I need to create an account to use CoursePilot?',
        answer:
          'No, you don\'t need an account to use the basic features. You can access the Course Explorer and create a course plan without logging in. Your plan is saved locally in your browser.',
      },
      {
        question: 'Is CoursePilot free to use?',
        answer:
          'Yes, CoursePilot is completely free for all students. We believe in making educational planning tools accessible to everyone.',
      },
    ],
  },
  {
    id: 'planner',
    title: 'Course Planner',
    items: [
      {
        question: 'How do I create a 4-year plan?',
        answer:
          'Go to the Course Planner page, select your major, choose your current academic year and expected graduation year, then enter any transfer credits. You can then search for courses and drag them into your semester plan.',
      },
      {
        question: 'How do I know if I\'m meeting all my graduation requirements?',
        answer:
          'The Course Planner automatically tracks your progress toward graduation requirements in the sidebar. This includes total credit hours (showing progress toward the 128-hour requirement), major courses, technical electives, and general education requirements.',
      },
      {
        question: 'How do I add transfer credits to my plan?',
        answer:
          'Click "Edit Profile" in the Course Planner and enter the number of transfer credit hours. These credits will automatically be applied to your total credit count.',
      },
      {
        question: 'Can I share my course plan with my academic advisor?',
        answer:
          'Currently, your plan is saved locally in your browser. You can take screenshots or manually share your plan. We\'re working on export features for future updates.',
      },
    ],
  },
  {
    id: 'explorer',
    title: 'Course Explorer',
    items: [
      {
        question: 'How do I search for courses?',
        answer:
          'Enter the department code (e.g., CS, ECE) in the first field and the course number (e.g., 101, 225) in the second field, then click "Search Course" to see detailed information including description, prerequisites, and grade distribution.',
      },
      {
        question: 'What information can I see about each course?',
        answer:
          'You can see the course title, description, prerequisites, term availability, credit hours, average GPA, and a visual grade distribution chart showing how past students performed.',
      },
      {
        question: 'How accurate is the grade information?',
        answer:
          'The grade distribution and average GPA information is based on historical data from previous academic years. While this provides valuable insights, remember that your individual performance may vary based on instructor, study habits, and circumstances.',
      },
    ],
  },
];

const categories = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'General' },
  { id: 'planner', label: 'Course Planner' },
  { id: 'explorer', label: 'Course Explorer' },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        className="w-full flex items-center justify-between py-4 text-left font-medium text-slate-800 hover:text-blue-600 transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="pr-4">{item.question}</span>
        <svg
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        <p className="text-slate-600 text-sm leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    setOpenItems(newOpenItems);
  };

  const filteredSections = faqData
    .filter((section) => activeCategory === 'all' || section.id === activeCategory)
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !searchQuery ||
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  const hasResults = filteredSections.some((section) => section.items.length > 0);

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help Center
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 text-slate-600">
              Find answers to common questions about using CoursePilot
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-8">
            <Input
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchQuery('');
                }}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* FAQ Sections */}
          {hasResults ? (
            <div className="space-y-6">
              {filteredSections.map((section) => (
                <Card key={section.id}>
                  <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">
                    {section.title}
                  </h2>
                  <div>
                    {section.items.map((item, index) => {
                      const key = `${section.id}-${index}`;
                      return (
                        <AccordionItem
                          key={key}
                          item={item}
                          isOpen={openItems.has(key)}
                          onToggle={() => toggleItem(key)}
                        />
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">
                No matching questions found. Try a different search term.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
