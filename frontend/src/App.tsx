import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ManagerLayout } from './components/layout/ManagerLayout';

// Public Pages
import { HomePage } from './pages/HomePage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamRegistrationPage } from './pages/TeamRegistrationPage';
import { PlayersPage } from './pages/PlayersPage';
import { PlayerVerificationPage } from './pages/PlayerVerificationPage';
import { FixturesResultsPage } from './pages/FixturesResultsPage';
import { DrawBracketPage } from './pages/DrawBracketPage';
import { PredictWinPage } from './pages/PredictWinPage';
import { NewsPage } from './pages/NewsPage';
import { GalleryPage } from './pages/GalleryPage';
import { AboutPage } from './pages/AboutPage';

// Admin Pages
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { getAuthToken, getManagerToken } from './lib/api';

// Manager Pages
import { ManagerLoginPage } from './pages/manager/ManagerLoginPage';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getManagerToken();
  if (!token) {
    return <Navigate to="/manager/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes with Public Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/matches" element={<FixturesResultsPage />} />
        <Route path="/live" element={<Navigate to="/matches" replace />} />
        <Route path="/draw" element={<DrawBracketPage />} />
        <Route path="/predict" element={<PredictWinPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
      </Route>

      {/* Standalone Admin Login (No Layout) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected Admin Routes with Admin Layout */}
      <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        {/* Placeholder for future admin routes to be added */}
      </Route>

      {/* Manager Portal */}
      <Route path="/manager/login" element={<ManagerLoginPage />} />
      <Route path="/manager" element={<ProtectedManagerRoute><ManagerLayout /></ProtectedManagerRoute>}>
        <Route index element={<ManagerDashboardPage />} />
        <Route path="register-team" element={<TeamRegistrationPage />} />
        <Route path="verify-player/:playerId" element={<PlayerVerificationPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
