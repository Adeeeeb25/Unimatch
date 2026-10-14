import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import MatchesPage from '../features/matches/MatchesPage';
import SupportPage from '../features/support/SupportPage';
import HomePage from '../features/home/HomePage';
import MainPage from '../features/main/MainPage';
import AboutPage from '../features/about/AboutPage';
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../features/auth/SignupPage';
import ProfileSetupPage from '../features/auth/ProfileSetupPage';
import ProfileViewPage from '../features/auth/ProfileViewPage';
import AdminLoginPage, { ADMIN_TOKEN_KEY } from '../features/admin/AdminLoginPage';
import AdminDashboard from '../features/admin/AdminDashboard';
import styles from './AppRouter.module.css';
import { AUTH_EVENT, isAuthenticated } from '../features/auth/authStorage';

const StudentLayout = ({ children }) => (
  <div className={styles.pageWrapper}>
    <Navbar />
    <main className={styles.mainContent}>{children}</main>
    <Footer />
  </div>
);

const AppRouter = () => {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      if (typeof window === 'undefined') return;
      setAuthenticated(isAuthenticated());
    };

    window.addEventListener(AUTH_EVENT, refresh);
    window.addEventListener('storage', refresh);
    refresh();
    return () => {
      window.removeEventListener(AUTH_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    const refreshAdmin = () => {
      if (typeof window === 'undefined') return;
      setIsAdminAuthenticated(Boolean(window.localStorage.getItem(ADMIN_TOKEN_KEY)));
    };

    window.addEventListener('unimatch-admin-change', refreshAdmin);
    window.addEventListener('storage', refreshAdmin);
    refreshAdmin();
    return () => {
      window.removeEventListener('unimatch-admin-change', refreshAdmin);
      window.removeEventListener('storage', refreshAdmin);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Student Pages with unified Navbar & Footer */}
        <Route path="/" element={<StudentLayout><HomePage /></StudentLayout>} />
        <Route
          path="/main"
          element={
            authenticated ? (
              <StudentLayout><MainPage /></StudentLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/matches"
          element={
            authenticated ? (
              <StudentLayout><MatchesPage /></StudentLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/cafe"
          element={<Navigate to="/main" replace />}
        />
        <Route
          path="/support"
          element={<StudentLayout><SupportPage /></StudentLayout>}
        />
        <Route
          path="/mainpage.html"
          element={
            authenticated ? (
              <StudentLayout><MainPage /></StudentLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/about" element={<StudentLayout><AboutPage /></StudentLayout>} />
        <Route path="/login" element={<StudentLayout><LoginPage /></StudentLayout>} />
        <Route path="/signup" element={<StudentLayout><SignupPage /></StudentLayout>} />
        <Route path="/profile-setup" element={<StudentLayout><ProfileSetupPage /></StudentLayout>} />
        <Route path="/profile" element={<StudentLayout><ProfileViewPage /></StudentLayout>} />
        <Route path="/profile/:id" element={<StudentLayout><ProfileViewPage /></StudentLayout>} />

        {/* Administration Routes */}
        <Route
          path="/admin"
          element={
            isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            isAdminAuthenticated ? <AdminDashboard /> : <Navigate to="/admin" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
