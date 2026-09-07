import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Star, ShieldDone, User, Calendar, Location, ChevronRight, TickSquare, Activity, Discovery } from 'react-iconly';

const heroImages = [
  '/images/hero.jpg?v=2',
  '/images/hero1.jpg'
];

export const HomePage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'upcoming' | 'results'>('today');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(heroInterval);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, setRes, matchesRes, sponRes] = await Promise.all([
          api.getSummary(),
          api.getSettings(),
          api.getMatches(),
          api.getSponsors()
        ]);
        setSummary(sumRes);
        setSettings(setRes.settings);
        setMatches(matchesRes || []);
        setSponsors(sponRes || []);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      }
    }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter matches based on active tab
  const getFilteredMatches = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    switch (activeTab) {
      case 'live':
        return matches.filter(m => m.status === 'LIVE' || m.status === 'HALF_TIME');
      case 'today':
        return matches.filter(m => m.date === todayStr);
      case 'upcoming':
        return matches.filter(m => m.status === 'SCHEDULED' && m.date >= todayStr).slice(0, 5);
      case 'results':
        return matches.filter(m => m.status === 'FULL_TIME').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
      default:
        return [];
    }
  };

  const filteredMatches = getFilteredMatches();

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* IMMERSIVE HERO SECTION */}
      <section className="relative w-full h-[320px] sm:h-[450px] md:h-[550px] flex flex-col items-center justify-center -mt-8 pb-16 md:pb-0">
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-bg via-transparent to-transparent z-0"></div>
        
        <div className="relative z-10 w-full max-w-4xl px-4 text-center space-y-5">

          <h1 className="font-heading font-black uppercase text-3xl sm:text-4xl md:text-6xl lg:text-[5rem] text-dark-bg tracking-tight leading-none flex flex-col items-center gap-1 sm:gap-2">
            <span className="drop-shadow-lg">BEYOND BORDERS</span>
            <span className="text-brand drop-shadow-[0_0_30px_rgba(253,224,71,0.7)]">UNITED BY FOOTBALL</span>
          </h1>

          <p className="text-slate-200 text-[10px] sm:text-xs md:text-sm lg:text-base max-w-3xl mx-auto font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mt-6 drop-shadow">
            ONE CAMPUS. MANY NATIONS. ONE CHAMPION.
          </p>
        </div>
      </section>

      {/* FLOATING INTERACTIVE MATCH PANEL */}
      <div className="w-full max-w-5xl px-4 z-20 relative -mt-20 md:-mt-24 mb-10 md:mb-16">
          <div className="data-card shadow-card-hover overflow-hidden">
            {/* Panel Tabs */}
            <div className="flex items-center border-b border-surface-border bg-surface-bg overflow-x-auto no-scrollbar">
              {['live', 'today', 'upcoming', 'results'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 min-w-[100px] py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                    activeTab === tab 
                      ? 'text-black border-b-2 border-brand bg-brand' 
                      : 'text-dark-muted hover:text-dark-bg'
                  }`}
                >
                  {tab === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-live animate-ping mr-1.5 align-middle"></span>}
                  {tab}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="p-0 bg-surface-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="divide-y divide-surface-border"
                >
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map(m => (
                      <Link to={`/matches`} key={m.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-surface-hover transition-colors">
                        <div className="flex items-center justify-end gap-2 sm:gap-3 w-[40%]">
                          <span className="text-[11px] sm:text-sm font-bold text-dark-bg text-right truncate">{m.team_a_name}</span>
                          {m.team_a_logo ? (
                            <img src={m.team_a_logo} alt="" className="w-6 h-6 object-contain hidden sm:block" />
                          ) : (
                            <div className="w-6 h-6 bg-surface-bg border border-surface-border rounded hidden sm:flex items-center justify-center text-[10px] font-bold text-dark-muted">{m.team_a_name.substring(0,2)}</div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-center justify-center w-[20%] px-2">
                          {m.status === 'SCHEDULED' ? (
                            <span className="font-heading text-sm text-dark-muted bg-surface-bg px-2 py-1 rounded border border-surface-border">{m.time}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-xl font-bold text-dark-bg">{m.score_a ?? 0}</span>
                              <span className="text-surface-border font-bold">-</span>
                              <span className="font-heading text-xl font-bold text-dark-bg">{m.score_b ?? 0}</span>
                            </div>
                          )}
                          <span className={`text-[9px] font-bold uppercase mt-1 tracking-wider \${m.status === 'LIVE' ? 'text-status-live' : 'text-dark-muted'}`}>
                            {m.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-start gap-3 w-[40%]">
                          {m.team_b_logo ? (
                            <img src={m.team_b_logo} alt="" className="w-6 h-6 object-contain hidden sm:block" />
                          ) : (
                            <div className="w-6 h-6 bg-surface-bg border border-surface-border rounded hidden sm:flex items-center justify-center text-[10px] font-bold text-dark-muted">{m.team_b_name.substring(0,2)}</div>
                          )}
                          <span className="text-[11px] sm:text-sm font-bold text-dark-bg text-left truncate">{m.team_b_name}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-10 text-center text-dark-muted flex flex-col items-center">
                      <Calendar set="bold" className="w-8 h-8 mb-2 opacity-30" />
                      <p className="font-medium text-sm">No matches found for this view.</p>
                      {activeTab === 'live' && <p className="text-xs mt-1">Check today's upcoming fixtures.</p>}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Panel Footer */}
            <div className="bg-surface-bg p-3 border-t border-surface-border text-center">
              <Link to="/matches" className="text-xs font-bold text-brand hover:text-brand-dark transition-colors flex items-center justify-center gap-1 uppercase tracking-wider">
                View Full Schedule <ChevronRight set="bold" className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      {/* QUICK STATS SECTION */}
      <section className="w-full max-w-6xl mx-auto px-4 py-4 md:py-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <ShieldDone set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">{summary?.teamsCount || 0}</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Teams</p>
        </div>
        <div className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <User set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">{summary?.playersCount || 0}</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Players</p>
        </div>
        <div className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <Calendar set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">{summary?.matchesCount || 0}</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Matches</p>
        </div>
        <div className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <Location set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">1</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Venue</p>
        </div>
      </section>

      {/* OFFICIAL SPONSORS SECTION */}
      {Array.isArray(sponsors) && sponsors.filter(s => s.name && s.name.trim() !== '' && s.logo_url && s.logo_url.trim() !== '').length > 0 && (
        <section className="w-full max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl md:text-3xl font-black uppercase text-dark-bg tracking-tight">
              OFFICIAL <span className="text-brand text-glow">SPONSORS & PARTNERS</span>
            </h2>
            <p className="text-xs text-dark-muted font-bold uppercase tracking-widest mt-1">
              Proudly supported by our official tournament partners
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 items-center">
            {sponsors.filter(s => s.name && s.name.trim() !== '' && s.logo_url && s.logo_url.trim() !== '').map((s) => {
              const CardContent = (
                <div className="data-card p-6 flex flex-col items-center justify-center gap-3 hover:border-brand/50 hover:-translate-y-1 transition-all duration-300 group h-full">
                  <div className="h-16 w-full flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={s.logo_url} 
                      alt={s.name} 
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-sm font-bold text-dark-bg group-hover:text-brand transition-colors">{s.name}</p>
                    <span className="inline-block mt-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                      {s.tier || 'PARTNER'}
                    </span>
                  </div>
                </div>
              );

              return s.website ? (
                <a key={s.id} href={s.website} target="_blank" rel="noreferrer" className="block h-full">
                  {CardContent}
                </a>
              ) : (
                <div key={s.id} className="h-full">
                  {CardContent}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CALL TO ACTION */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="data-card p-8 sm:p-12 bg-surface-card flex flex-col items-center">
          <Discovery set="bold" className="w-10 h-10 text-brand mb-4" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-dark-bg mb-2">Explore the Tournament</h2>
          <p className="text-dark-surface text-sm max-w-xl mb-6">
            Dive into the full fixtures list, check the current group standings, or view the knockout bracket to see who will be crowned the champions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/matches" className="btn-primary flex items-center gap-2 text-sm shadow-sm">
              <Calendar set="bold" className="w-4 h-4" /> View Matches
            </Link>
            <Link to="/draw" className="btn-outline flex items-center gap-2 text-sm bg-surface-bg shadow-sm">
              <Star set="bold" className="w-4 h-4" /> View Bracket
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
