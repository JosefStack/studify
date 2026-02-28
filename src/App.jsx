import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { queryClient } from './lib/queryClient';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { AppShell } from './components/layout/AppShell/AppShell';

// Pages
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import DashboardPage from './features/dashboard/DashboardPage';
import TasksPage from './features/tasks/TasksPage';
import NotesPage from './features/notes/NotesPage';
import SchedulePage from './features/schedule/SchedulePage';
import FocusPage from './features/focus/FocusPage';
import SettingsPage from './features/settings/SettingsPage';

import './styles/global.css';

// Auth guard — redirects to /login when not authenticated
const AuthGuard = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--color-bg-primary)',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'spin 0.8s linear infinite' }}
        >
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="var(--color-border)"
            strokeWidth="3"
          />
          <path
            d="M16 2 A14 14 0 0 1 30 16"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public gate — redirects to dashboard if already authenticated
const PublicOnlyRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return null;
  return user ? <Navigate to="/" replace /> : <Outlet />;
};

function App() {
  const { setUser, setSession, setLoading, setProfile } = useAuthStore();
  const { theme } = useThemeStore();

  // Apply theme to <html> on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen for Supabase auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading, setProfile]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/focus" element={<FocusPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
