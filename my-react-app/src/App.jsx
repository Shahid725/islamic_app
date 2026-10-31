import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useAppStore from './store/appStore';
import AppShell from './layouts/AppShell';
import { PageLoader } from './components/ui';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PrayerPage from './pages/PrayerPage';
import QuranPage from './pages/QuranPage';
import LearnPage from './pages/LearnPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Auth Route wrapper (redirect to home if already logged in)
function AuthRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { initialize } = useAuthStore();
  const { theme } = useAppStore();

  useEffect(() => {
    // Initialize auth (check stored token)
    initialize();
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { background: '#064e3b', color: '#fff', borderRadius: '12px', fontSize: '14px' },
          success: { style: { background: '#064e3b' } },
          error: { style: { background: '#991b1b' } },
        }}
      />

      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/prayer/*" element={<PrayerPage />} />
          <Route path="/quran/*" element={<QuranPage />} />
          <Route path="/learn/*" element={<LearnPage />} />
          <Route path="/profile/*" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
