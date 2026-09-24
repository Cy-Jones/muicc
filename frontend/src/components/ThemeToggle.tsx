import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLight(true);
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    try {
      if (isLight) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
        setIsLight(false);
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
        setIsLight(true);
      }
    } catch (error) {
      console.error("Theme toggle error:", error);
      // Still toggle state even if localStorage fails
      setIsLight(!isLight);
      if (!isLight) {
         document.documentElement.classList.add('light');
      } else {
         document.documentElement.classList.remove('light');
      }
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="text-dark-bg hover:text-gold transition-colors flex items-center justify-center p-1 rounded-full"
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {isLight ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )}
    </button>
  );
};
