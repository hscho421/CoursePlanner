import { useMemo } from 'react';
import calendarHtml from '../content/academic_calendar.html?raw';
import '../styles/mainpage.css';
import '../styles/footer.css';
import '../styles/academic_calendar.css';
import logo from '../assets/logo.png';

const extractMain = (raw: string) => {
  const match = raw.match(/<main[\s\S]*?<\/main>/i);
  return match ? match[0] : '';
};

export default function AcademicCalendar() {
  const mainHtml = useMemo(
    () => extractMain(calendarHtml).replace(/\.\.\/html\//g, '/'),
    [],
  );

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

      <div dangerouslySetInnerHTML={{ __html: mainHtml }} />

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
