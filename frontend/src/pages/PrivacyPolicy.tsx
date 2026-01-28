import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card } from '../components/ui/Card';

const sections = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, use our course planning features, or contact us for support. This may include:

- Academic information (major, graduation year, courses)
- Usage data (how you interact with our platform)
- Device information (browser type, operating system)

We use this information solely to improve your experience and provide our services.`,
  },
  {
    title: 'How We Use Your Information',
    content: `Your information is used to:

- Provide and maintain our course planning services
- Save your course plans and preferences locally
- Improve and personalize your experience
- Communicate with you about updates or support
- Analyze usage patterns to improve our platform

We do not sell your personal information to third parties.`,
  },
  {
    title: 'Data Storage',
    content: `Your course plans and preferences are stored locally in your browser using localStorage. This means:

- Your data stays on your device
- Clearing your browser data will remove your saved plans
- We do not have access to your locally stored data

If you create an account in the future, your data will be securely stored on our servers with encryption.`,
  },
  {
    title: 'Cookies and Tracking',
    content: `We use minimal cookies necessary for the functioning of our website. These include:

- Session cookies to maintain your browsing session
- Preference cookies to remember your settings

We do not use cookies for advertising purposes.`,
  },
  {
    title: 'Third-Party Services',
    content: `We use the following third-party services:

- Supabase for database and authentication services
- UIUC Course API for course information

These services have their own privacy policies governing the use of your information.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to:

- Access the personal information we hold about you
- Request correction of inaccurate information
- Request deletion of your data
- Opt out of marketing communications

To exercise these rights, contact us at support@coursepilot.com.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.`,
  },
  {
    title: 'Contact Us',
    content: `If you have questions about this privacy policy or our practices, please contact us at:

Email: support@coursepilot.com`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Privacy Policy</h1>
            <p className="mt-2 text-slate-600">
              Last updated: January 2025
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-6">
            <p className="text-slate-700 leading-relaxed">
              At CoursePilot, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our course planning platform. Please read
              this policy carefully.
            </p>
          </Card>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  {section.title}
                </h2>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
