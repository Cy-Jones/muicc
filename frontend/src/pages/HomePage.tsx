import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { getMatchLiveClock } from '../lib/liveClock';
import { Star, ShieldDone, User, Calendar, Location, ChevronRight, TickSquare, Activity, Discovery } from 'react-iconly';

const heroImages = [
  '/images/hero.jpg?v=2',
  '/images/hero1.jpg'
];

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

export const HomePage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [systemNations, setSystemNations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'upcoming' | 'results'>('today');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
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
        if (setRes.nations) setSystemNations(setRes.nations);
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
        return matches.filter(m => m.status === 'FULL_TIME').slice(0, 5);
      default:
        return matches;
    }
  };

  const renderTeamFlag = (teamName: string, countryName?: string, logoUrl?: string) => {
    let flagSrc = logoUrl;
    if (!flagSrc && systemNations.length > 0) {
      const dbNation = systemNations.find((n: any) => 
        (countryName && n.name.toLowerCase() === countryName.toLowerCase()) ||
        (n.name.toLowerCase() === teamName.toLowerCase())
      );
      if (dbNation?.flag_url) flagSrc = dbNation.flag_url;
    }
    if (!flagSrc) {
      const fallbackKey = Object.keys(SYSTEM_FLAGS).find(k => teamName.toLowerCase().includes(k) || (countryName && countryName.toLowerCase().includes(k)));
      if (fallbackKey) flagSrc = SYSTEM_FLAGS[fallbackKey];
    }
    
    if (flagSrc) {
      return <img src={flagSrc} alt={teamName} className="w-6 h-6 object-contain hidden sm:block" />;
    }
    return (
      <div className="w-6 h-6 bg-surface-bg border border-surface-border rounded hidden sm:flex items-center justify-center text-[10px] font-bold text-dark-muted">
        {teamName.substring(0, 2)}
      </div>
    );
  };

  const filteredMatches = getFilteredMatches();

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* IMMERSIVE HERO SECTION */}
      {/* Spacer to push content down since the hero is absolutely positioned */}
      <div className="w-full h-[420px] sm:h-[550px] md:h-[650px] lg:h-[700px] -mt-8 pb-16 md:pb-0"></div>
      
      <section className="absolute left-0 right-0 top-16 sm:top-20 h-[420px] sm:h-[550px] md:h-[650px] lg:h-[700px] flex flex-col items-center justify-center pt-16 md:pt-24 pb-16 md:pb-0 overflow-hidden z-0">
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
      <div className="w-full max-w-[96%] px-4 z-20 relative -mt-10 md:-mt-16 mb-10 md:mb-16">
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
                          {renderTeamFlag(m.team_a_name, m.team_a_country, m.team_a_logo)}
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
                          <span className={`text-[9px] font-bold uppercase mt-1 tracking-wider ${m.status === 'LIVE' || m.status === 'HALF_TIME' ? 'text-status-live animate-pulse' : 'text-dark-muted'}`}>
                            {m.status === 'LIVE' || m.status === 'HALF_TIME' ? getMatchLiveClock(m).display : m.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-start gap-3 w-[40%]">
                          {renderTeamFlag(m.team_b_name, m.team_b_country, m.team_b_logo)}
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
      <section className="w-full max-w-[96%] mx-auto px-4 py-4 md:py-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

      {/* ABOUT THE TOURNAMENT SECTION */}
      <section className="w-full max-w-[96%] mx-auto px-4 py-8 md:py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="data-card p-6 space-y-2 border-t-2 border-brand text-center">
            <Location set="bold" className="w-8 h-8 text-brand mx-auto" />
            <h3 className="font-heading font-bold text-dark-bg text-base">HOST VENUE</h3>
            <p className="text-xs text-dark-muted">Marwadi University Campus</p>
          </div>

          <div className="data-card p-6 space-y-2 border-t-2 border-brand text-center">
            <Calendar set="bold" className="w-8 h-8 text-brand mx-auto" />
            <h3 className="font-heading font-bold text-dark-bg text-base">OFFICIAL DATES</h3>
            <p className="text-xs text-dark-muted">26 September – 10 October 2026</p>
          </div>

          <div className="data-card p-6 space-y-2 border-t-2 border-brand text-center">
            <Discovery set="bold" className="w-8 h-8 text-brand mx-auto" />
            <h3 className="font-heading font-bold text-dark-bg text-base">NATIONS</h3>
            <p className="text-xs text-dark-muted">10 Participating University Nations</p>
          </div>
        </div>

        <div className="data-card p-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl md:text-3xl font-black text-dark-bg tracking-tight uppercase">
              ABOUT <span className="text-brand">THE TOURNAMENT</span>
            </h2>
          </div>
          <div className="text-sm text-dark-surface space-y-4 leading-relaxed max-w-3xl mx-auto text-center">
            <p>
              The <strong>MUICC '26 Champions Cup</strong> represents the premier collegiate football tournament uniting student athletes across 10 nations: <strong>Liberia, Eswatini, Tanzania, South Sudan, Zimbabwe, India, Mozambique, Nigeria, Uganda, and Zambia</strong>.
            </p>
            <p>
              Hosted at the state-of-the-art facilities of <strong>Marwadi University Campus</strong>, the 14-day tournament showcases group stage competition, knockout rounds, and the championship grand final.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-surface-border">
            <h3 className="font-heading text-sm font-bold text-brand uppercase tracking-wider mb-6 text-center">Participating Nations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { name: 'Liberia', code: 'lbr' },
                { name: 'Eswatini', code: 'swz' },
                { name: 'Tanzania', code: 'tza' },
                { name: 'South Sudan', code: 'ssd' },
                { name: 'Zimbabwe', code: 'zwe' },
                { name: 'India', code: 'ind' },
                { name: 'Mozambique', code: 'moz' },
                { name: 'Nigeria', code: 'nga' },
                { name: 'Uganda', code: 'uga' },
                { name: 'Zambia', code: 'zmb' }
              ].map(nation => (
                <div key={nation.code} className="flex items-center gap-3 p-3 bg-surface-bg border border-surface-border rounded-lg hover:border-brand/50 transition shadow-sm">
                  <img 
                    src={`/images/flags/${nation.code}.png`} 
                    alt={`${nation.name} Flag`} 
                    className="w-7 h-5 object-contain rounded-sm shadow-sm" 
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span className="text-xs font-bold text-dark-bg leading-tight">{nation.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OFFICIAL SPONSORS SECTION */}
      {(() => {
        const validSponsors = Array.isArray(sponsors) ? sponsors.filter(s => s.name && s.name.trim() !== '' && s.logo_url && s.logo_url.trim() !== '') : [];
        if (validSponsors.length === 0) return null;

        let gridClass = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
        let containerClass = 'max-w-[96%]';
        
        if (validSponsors.length === 1) {
          gridClass = 'grid-cols-1';
          containerClass = 'max-w-xs';
        } else if (validSponsors.length === 2) {
          gridClass = 'grid-cols-2';
          containerClass = 'max-w-lg';
        } else if (validSponsors.length === 3) {
          gridClass = 'grid-cols-2 sm:grid-cols-3';
          containerClass = 'max-w-3xl';
        }

        return (
          <section className="w-full max-w-[96%] mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <h2 className="font-heading text-2xl md:text-3xl font-black uppercase text-dark-bg tracking-tight">
                OFFICIAL <span className="text-brand text-glow">SPONSORS & PARTNERS</span>
              </h2>
              <p className="text-xs text-dark-muted font-bold uppercase tracking-widest mt-1">
                Proudly supported by our official tournament partners
              </p>
            </div>

            <div className={`mx-auto ${containerClass}`}>
              <div className={`grid ${gridClass} gap-4 sm:gap-6 items-center`}>
                {validSponsors.map((s) => {
                  const CardContent = (
                    <div className="data-card relative flex flex-col justify-end overflow-hidden hover:border-brand/50 hover:-translate-y-1 transition-all duration-300 group aspect-[4/5] sm:aspect-[3/4]">
                      <img 
                        src={s.logo_url} 
                        alt={s.name} 
                        className="absolute inset-0 w-full h-full object-cover object-top filter group-hover:scale-105 transition-transform duration-300 z-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      
                      {/* Fading Gradient Overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-3/5 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent"></div>
                      
                      <div className="relative z-20 p-4 text-center flex flex-col items-center w-full">
                        <p className="font-heading text-sm font-bold text-white group-hover:text-brand transition-colors line-clamp-1 drop-shadow-md">{s.name}</p>
                        <span className="inline-block mt-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 shadow-sm">
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
            </div>
          </section>
        );
      })()}

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
