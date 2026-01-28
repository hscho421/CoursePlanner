import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

const navItems = [
  { href: '/course-planner', label: 'Course Planner', icon: '📋' },
  { href: '/course-explorer', label: 'Course Explorer', icon: '🔍' },
  { href: '/academic-calendar', label: 'Calendar', icon: '📅' },
  { href: '/faq', label: 'FAQ', icon: '❓' },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 shadow-lg">
      {/* Decorative top accent line */}
      <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md group-hover:bg-blue-400/30 transition-colors" />
              <img src={logo} alt="" className="h-9 w-auto relative" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-lg tracking-tight">
                CoursePilot
              </span>
              <span className="text-[10px] text-blue-300 -mt-1 hidden sm:block">
                Navigate Your Journey
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    relative px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 group
                    ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flex items-center gap-2">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* CTA Button */}
            <Link
              to="/course-planner"
              className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-blue-800/50">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`
                      px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3
                      transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/course-planner"
                className="mt-2 mx-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
