import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, setAuthToken } from '../lib/api';
import { Lock, ShieldDone, Message, Show, Hide } from 'react-iconly';

const heroImages = [
  '/images/hero.jpg?v=2',
  '/images/hero1.jpg'
];

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.token) {
        setAuthToken(res.token);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid admin email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center overflow-hidden bg-surface-bg">
      {/* Background Carousel */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <AnimatePresence>
          <motion.img
            key={currentHeroIndex}
            src={heroImages[currentHeroIndex]}
            alt="Tournament Background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </AnimatePresence>
      </div>
      
      {/* Overlay to darken background */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {/* Login Container (Left side floating card) */}
      <div className="relative z-10 w-full flex min-h-screen items-center justify-start px-4 sm:px-12 lg:px-32">
        
        <motion.div 
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] bg-surface-card/95 backdrop-blur-2xl border border-surface-border rounded-[3rem] rounded-tr-[1rem] rounded-bl-[1rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-center"
        >
          <div className="text-center space-y-3 mb-10">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="MIUCC Logo" className="h-20 w-auto object-contain" />
            </div>
            <h1 className="font-heading text-3xl font-black text-dark-bg uppercase tracking-wide">ADMIN PORTAL</h1>
            <p className="text-xs text-dark-muted uppercase font-bold">Authorized Personnel Only • MULSU ICC '26</p>
          </div>

          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 mb-6 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs font-bold uppercase text-center flex items-center justify-center gap-2"
            >
              <ShieldDone set="bold" className="w-4 h-4" /> {errorMessage}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-dark-muted mb-2">
                <Message set="bold" className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-bg border border-surface-border rounded-lg px-4 py-3 text-sm text-dark-bg font-bold focus:border-brand focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-dark-muted mb-2">
                <Lock set="bold" className="w-4 h-4" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-bg border border-surface-border rounded-lg px-4 py-3 pr-12 text-sm text-dark-bg font-bold focus:border-brand focus:outline-none transition-colors"
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-slate-200 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <Hide size={20} /> : <Show size={20} />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary !rounded-full px-12 py-3 disabled:opacity-50 shadow-md"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </div>
          </form>

          {/* Social Links */}
          <div className="mt-10 flex justify-center">
            <a 
              href="https://www.instagram.com/mulsu_icc?stkn=aTd4anppZ3I4M3p3" 
              target="_blank" 
              rel="noreferrer" 
              className="text-dark-muted hover:text-gold transition-colors flex items-center justify-center p-3 rounded-full bg-surface-bg border border-surface-border hover:border-gold/50 shadow-sm hover:scale-110 transform duration-200"
              title="Follow us on Instagram"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
