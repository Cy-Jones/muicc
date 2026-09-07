import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Logout } from 'react-iconly';
import { removeAuthToken } from '../../lib/api';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-dark-bg font-sans selection:bg-brand/30">
      {/* Unified Top Bar */}
      <header className="w-full bg-surface-card border-b border-surface-border shadow-sm flex items-center justify-between px-4 sm:px-8 h-16 sm:h-20 shrink-0 z-50">
        <Link to="/admin" className="flex items-center gap-3 group">
          <img 
            src="/logo.png" 
            alt="MIUCC Logo" 
            className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
          />
          <div className="flex flex-col">
            <span className="font-heading font-black text-dark-bg text-lg sm:text-xl uppercase tracking-wide leading-none">MIUCC '26</span>
            <span className="text-[10px] text-dark-muted font-bold uppercase tracking-widest leading-none mt-1">Operations Portal</span>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-status-error hover:bg-status-error/10 rounded transition-colors text-sm font-bold"
        >
          <Logout set="bold" className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* Main Admin Content Area */}
      <main className="flex-1 w-full overflow-y-auto relative">
        <div className="relative z-10 p-4 sm:p-8 animate-fade-in max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

