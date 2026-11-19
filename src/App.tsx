import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/admin/AdminLayout';
import { PublicLayout } from './components/public/PublicLayout';
import { AdminProvider } from './context/AdminContext';
import { AdminActivity } from './pages/admin/AdminActivity';
import { AdminEducation } from './pages/admin/AdminEducation';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminMedia } from './pages/admin/AdminMedia';
import { AdminMessages } from './pages/admin/AdminMessages';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminProjects } from './pages/admin/AdminProjects';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminSkills } from './pages/admin/AdminSkills';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { HomePage } from './pages/public/HomePage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { ProjectDetailPage } from './pages/public/ProjectDetailPage';
import { ProjectsPage } from './pages/public/ProjectsPage';

function AdminRoutes() {
  return (
    <AdminProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="skills" element={<AdminSkills />} />
          <Route path="education" element={<AdminEducation />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="activity" element={<AdminActivity />} />
        </Route>
      </Routes>
    </AdminProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
