import { useEffect, useMemo } from 'react';
import faqHtml from '../content/faq.html?raw';
import '../styles/mainpage.css';
import '../styles/footer.css';
import '../styles/faq.css';
import logo from '../assets/logo.png';

const extractMain = (raw: string) => {
  const match = raw.match(/<main[\s\S]*?<\/main>/i);
  return match ? match[0] : '';
};

export default function Faq() {
  const mainHtml = useMemo(() => extractMain(faqHtml).replace(/\.\.\/html\//g, '/'), []);

  useEffect(() => {
    const faqQuestions = document.querySelectorAll<HTMLDivElement>('.faq-question');
    faqQuestions.forEach((question) => {
      question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        faqItem?.classList.toggle('active');
      });
    });

    const categoryButtons = document.querySelectorAll<HTMLButtonElement>('.category-btn');
    const faqSections = document.querySelectorAll<HTMLElement>('.faq-section');

    categoryButtons.forEach((button) => {
      button.addEventListener('click', () => {
        categoryButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        const category = button.getAttribute('data-category');

        if (category === 'all') {
          faqSections.forEach((section) => {
            section.style.display = 'block';
          });
        } else {
          faqSections.forEach((section) => {
            section.style.display =
              section.getAttribute('data-category') === category ? 'block' : 'none';
          });
        }

        const searchInput = document.getElementById('faq-search') as HTMLInputElement | null;
        const noResults = document.getElementById('no-results') as HTMLElement | null;
        if (searchInput) searchInput.value = '';
        if (noResults) noResults.style.display = 'none';
      });
    });

    const searchInput = document.getElementById('faq-search') as HTMLInputElement | null;
    const noResults = document.getElementById('no-results') as HTMLElement | null;

    const handleSearch = () => {
      if (!searchInput) return;
      const searchTerm = searchInput.value.toLowerCase().trim();
      const faqItems = document.querySelectorAll<HTMLElement>('.faq-item');

      if (searchTerm === '') {
        const activeCategory = document
          .querySelector('.category-btn.active')
          ?.getAttribute('data-category');

        if (activeCategory === 'all') {
          faqSections.forEach((section) => {
            section.style.display = 'block';
            section.querySelectorAll<HTMLElement>('.faq-item').forEach((item) => {
              item.style.display = 'block';
            });
          });
        } else {
          faqSections.forEach((section) => {
            if (section.getAttribute('data-category') === activeCategory) {
              section.style.display = 'block';
              section.querySelectorAll<HTMLElement>('.faq-item').forEach((item) => {
                item.style.display = 'block';
              });
            } else {
              section.style.display = 'none';
            }
          });
        }

        if (noResults) noResults.style.display = 'none';
        return;
      }

      faqSections.forEach((section) => {
        section.style.display = 'block';
      });

      let matchFound = false;
      faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question')?.textContent?.toLowerCase() ?? '';
        const answer = item.querySelector('.faq-answer')?.textContent?.toLowerCase() ?? '';

        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
          item.style.display = 'block';
          matchFound = true;
        } else {
          item.style.display = 'none';
        }
      });

      faqSections.forEach((section) => {
        const visibleItems = Array.from(section.querySelectorAll('.faq-item')).filter(
          (item) => (item as HTMLElement).style.display !== 'none',
        );
        section.style.display = visibleItems.length > 0 ? 'block' : 'none';
      });

      if (noResults) noResults.style.display = matchFound ? 'none' : 'block';
    };

    searchInput?.addEventListener('input', handleSearch);

    return () => {
      searchInput?.removeEventListener('input', handleSearch);
    };
  }, []);

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
