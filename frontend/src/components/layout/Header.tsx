import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Category, CloseSquare, Star, ChevronLeft, ChevronRight, TickSquare, TimeCircle } from 'react-iconly';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { getMatchLiveClock } from '../../lib/liveClock';

const SYSTEM_FLAGS: Record<string, string> = {
  liberia: '/images/flags/lbr.png',
  eswatini: '/images/flags/swz.png',
  tanzania: '/images/flags/tza.png',
  'south sudan': '/images/flags/ssd.png',
  zimbabwe: '/images/flags/zwe.png',
  india: '/images/flags/ind.png',
  mozambique: '/images/flags/moz.png',
  nigeria: '/images/flags/nga.png',
  uganda: '/images/flags/uga.png',
  zambia: '/images/flags/zmb.png'
};

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [systemNations, setSystemNations] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Matches', path: '/matches' },
    { label: 'Brackets', path: '/draw' },
    { label: 'Teams', path: '/teams' },
    { label: 'Players', path: '/players' },
  ];

  useEffect(() => {
    function calculateTimeLeft() {
      const tournamentDate = new Date('2026-09-26T09:00:00').getTime();
      const now = new Date().getTime();
      const difference = tournamentDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [matches, settingsData] = await Promise.all([
          api.getMatches(),
          api.getSettings()
        ]);
        if (settingsData?.nations) setSystemNations(settingsData.nations);

        if (Array.isArray(matches) && matches.length > 0) {
          const live = matches.filter((m: any) => m.status === 'LIVE' || m.status === 'HALF_TIME');
          const finished = matches.filter((m: any) => m.status === 'FULL_TIME');
          const upcoming = matches.filter((m: any) => m.status === 'SCHEDULED');
          setAllMatches([...live, ...finished, ...upcoming]);
        } else {
          setAllMatches([]);
        }
      } catch (err) {
        console.error('Error loading header data:', err);
      }
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allMatches.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allMatches.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [allMatches.length, isHovered]);

  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + allMatches.length) % allMatches.length);
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % allMatches.length);
  const currentMatch = allMatches[currentIndex] || allMatches[0];

  const renderTeamFlag = (teamName: string, countryName?: string, logoUrl?: string) => {
    let flagSrc = logoUrl;
    if (!flagSrc && systemNations.length > 0) {
      const dbNation = systemNations.find((n: any) => 
        (countryName && n.name.toLowerCase() === countryName.toLowerCase()) ||
        (teamName && teamName.toLowerCase().includes(n.name.toLowerCase()))
      );
      if (dbNation?.flag_image) flagSrc = dbNation.flag_image;
    }
    if (!flagSrc) {
      const matchedKey = Object.keys(SYSTEM_FLAGS).find(k => 
        (countryName && countryName.toLowerCase().includes(k)) ||
        (teamName && teamName.toLowerCase().includes(k))
      );
      if (matchedKey) flagSrc = SYSTEM_FLAGS[matchedKey];
    }

    if (flagSrc) {
      return (
        <div className="flex items-center justify-center p-0.5 rounded bg-surface-bg border border-surface-border shadow-sm" title={teamName}>
          <img src={flagSrc} alt={teamName} className="w-5 h-3.5 object-cover rounded-sm" />
        </div>
      );
    }
    return <span className="text-[10px] font-bold text-dark-muted uppercase truncate max-w-[40px]" title={teamName}>{teamName.substring(0,3)}</span>;
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-card border-b border-surface-border shadow-sm text-dark-bg">
      {/* Top Banner (Status Bar) */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full bg-surface-bg border-b border-surface-border h-10 flex items-center justify-center px-4"
      >
        <div className="w-full max-w-[96%] flex items-center justify-between mx-auto">
          {/* LEFT: Title */}
          <div className="flex items-center text-[9px] sm:text-xs font-black text-dark-bg tracking-widest uppercase shrink-0 whitespace-nowrap">
            <span>{allMatches.length > 0 ? "MUICC '26 MATCHDAY CENTER" : "MUICC '26 COUNTDOWN"}</span>
          </div>

          {/* RIGHT/CENTER: Match Ticker or Timer */}

          {/* RIGHT/CENTER: Match Ticker or Title */}
          <div className="flex-1 flex justify-end ml-4 overflow-hidden">
            {allMatches.length > 0 ? (
              <div className="flex items-center justify-end w-full max-w-4xl gap-6 sm:gap-10 overflow-x-auto scrollbar-hide hide-scrollbar">
                {allMatches.slice(0, 3).map((match, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {match.status === 'LIVE' || match.status === 'HALF_TIME' ? (
                      <span className="badge badge-live">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" /> {getMatchLiveClock(match).isHalftime ? 'HT' : 'LIVE'}
                      </span>
                    ) : match.status === 'FULL_TIME' ? (
                      <span className="badge badge-completed">
                        <TickSquare set="bold" className="w-3 h-3 mr-1" /> FT
                      </span>
                    ) : (
                      <span className="badge badge-upcoming">
                        <TimeCircle set="bold" className="w-3 h-3 mr-1" /> NEXT
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-dark-bg">
                      {renderTeamFlag(match.team_a_name, match.team_a_country, match.team_a_logo)}
                      <span className="truncate max-w-[50px] sm:max-w-[80px] hidden md:block">{match.team_a_name}</span>
                      <span className="text-brand font-black mx-1">
                        {match.status === 'SCHEDULED' ? 'vs' : `${match.score_a ?? 0} - ${match.score_b ?? 0}`}
                      </span>
                      <span className="truncate max-w-[50px] sm:max-w-[80px] hidden md:block text-right">{match.team_b_name}</span>
                      {renderTeamFlag(match.team_b_name, match.team_b_country, match.team_b_logo)}
                      
                      {match.status === 'LIVE' && (
                        <span className="text-status-live animate-pulse ml-1 sm:ml-2">
                          {getMatchLiveClock(match).display}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-dark-bg bg-surface-card px-3 py-1.5 rounded border border-surface-border">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-[96%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img 
              src="/logo.png" 
              alt="MIUCC Logo" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
            />
            <div className="hidden sm:flex flex-col">
              <span className="font-heading text-lg font-black text-dark-bg leading-none tracking-tight">MUICC '26</span>
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest mt-0.5">Champions Cup</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-bold uppercase tracking-wide transition-colors relative py-2 \${
                  isActive(item.path) ? 'text-brand' : 'text-dark-surface hover:text-brand'
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <motion.div 
                    layoutId="activeNavTab"
                    className="absolute -bottom-[22px] left-0 right-0 h-1 bg-brand rounded-t-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
          </div>

          {/* Mobile Category Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-dark-surface hover:text-dark-bg hover:bg-surface-hover rounded-md transition-colors"
          >
            {mobileMenuOpen ? <CloseSquare set="bold" className="w-6 h-6" /> : <Category set="bold" className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Category */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface-card border-b border-surface-border overflow-hidden shadow-lg absolute w-full"
          >
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wide \${
                    isActive(item.path)
                      ? 'bg-brand/10 text-brand border border-brand/20'
                      : 'text-dark-surface hover:bg-surface-hover hover:text-dark-bg'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
