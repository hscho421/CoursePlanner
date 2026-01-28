import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card } from '../components/ui/Card';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing and using CoursePilot, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.

These terms apply to all users of the platform, including students, educators, and visitors.`,
  },
  {
    title: '2. Description of Service',
    content: `CoursePilot is an academic planning tool that helps students:

- Plan their course schedule across multiple semesters
- Explore course offerings and view detailed information
- Track progress toward graduation requirements
- View historical grade distributions

Our service is designed specifically for students at the University of Illinois Urbana-Champaign.`,
  },
  {
    title: '3. Use of the Service',
    content: `You agree to use CoursePilot only for lawful purposes and in accordance with these Terms. You agree not to:

- Use the service in any way that violates applicable laws
- Attempt to gain unauthorized access to our systems
- Interfere with or disrupt the service
- Use automated systems to access the service without permission
- Misrepresent your identity or affiliation`,
  },
  {
    title: '4. Academic Information Disclaimer',
    content: `While we strive for accuracy, CoursePilot is an unofficial planning tool and should not be used as your sole source of academic information.

IMPORTANT: Always verify course requirements, prerequisites, and availability with your academic advisor and official university resources before registration.

We are not responsible for any academic decisions made based solely on information provided by our platform.`,
  },
  {
    title: '5. Intellectual Property',
    content: `The CoursePilot platform, including its design, features, and content (excluding user-generated content and university course data), is owned by CoursePilot and protected by intellectual property laws.

Course information and grade data are sourced from publicly available university resources and remain the property of the University of Illinois.`,
  },
  {
    title: '6. User Data',
    content: `Your course plans and preferences are stored locally in your browser. You are responsible for backing up any important data.

We are not responsible for data loss due to:
- Clearing your browser data
- Browser or device failures
- Technical issues beyond our control`,
  },
  {
    title: '7. Limitation of Liability',
    content: `CoursePilot is provided "as is" without warranties of any kind. We do not guarantee:

- The accuracy or completeness of course information
- Uninterrupted or error-free service
- That the service will meet your specific requirements

To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.`,
  },
  {
    title: '8. Changes to Terms',
    content: `We reserve the right to modify these terms at any time. We will notify users of significant changes by posting a notice on our platform.

Continued use of the service after changes constitutes acceptance of the new terms.`,
  },
  {
    title: '9. Termination',
    content: `We reserve the right to terminate or suspend access to our service at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users or the service.`,
  },
  {
    title: '10. Contact Information',
    content: `For questions about these Terms of Service, please contact us at:

Email: support@coursepilot.com`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Terms of Service</h1>
            <p className="mt-2 text-slate-600">
              Last updated: January 2025
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-6">
            <p className="text-slate-700 leading-relaxed">
              Welcome to CoursePilot. These Terms of Service govern your use of
              our course planning platform. By using CoursePilot, you agree to
              these terms.
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
