import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../../lib/animations';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-dark-bg">
      <Header />
      <main className="flex-1 w-full max-w-[96%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
