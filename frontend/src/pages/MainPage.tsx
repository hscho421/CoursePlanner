import '../styles/mainpage.css';
import '../styles/footer.css';
import logo from '../assets/logo.png';

export default function MainPage() {
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
        <h1 className="main-title">Navigate Your College Course Planning Efficiently</h1>
        <p className="description">
          Plan for your 4-year schedule with ease. CoursePilot helps you fulfill your major requirements and
          pick your technical electives without any stress.
        </p>
        <div className="buttons">
          <button className="button planner-btn" onClick={() => window.location.assign('/course-planner')}>
            Course Planner
          </button>

          <button className="button explorer-btn" onClick={() => window.location.assign('/course-explorer')}>
            Course Explorer
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
