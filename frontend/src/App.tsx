import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AcademicCalendar from './pages/AcademicCalendar';
import CourseExplorer from './pages/CourseExplorer';
import CoursePlanner from './pages/CoursePlanner';
import Faq from './pages/Faq';
import MainPage from './pages/MainPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/course-explorer" element={<CourseExplorer />} />
        <Route path="/course-planner" element={<CoursePlanner />} />
        <Route path="/academic-calendar" element={<AcademicCalendar />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  );
}
