import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { getMatchLiveClock } from '../lib/liveClock';
import { Star, ShieldDone, User, Calendar, Location, ChevronRight, TickSquare, Activity, Discovery } from 'react-iconly';
import { staggerContainer, fadeUp, scaleIn } from '../lib/animations';

import { HomePageHero } from './HomePageHero';
import { HomePageMatchPanel } from './HomePageMatchPanel';
import { HomePageSponsors } from './HomePageSponsors';

export const HomePage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [systemNations, setSystemNations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'upcoming' | 'results'>('today');

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

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* IMMERSIVE HERO SECTION */}
      <HomePageHero />

      {/* FLOATING INTERACTIVE MATCH PANEL */}
      <HomePageMatchPanel matches={matches} />

      {/* QUICK STATS SECTION */}
      <motion.section 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        className="w-full max-w-[96%] mx-auto px-4 py-4 md:py-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
      >
        <motion.div variants={scaleIn} className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <ShieldDone set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">{summary?.teamsCount || 0}</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Teams</p>
        </motion.div>
        <motion.div variants={scaleIn} className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <User set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">{summary?.playersCount || 0}</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Players</p>
        </motion.div>
        <motion.div variants={scaleIn} className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <Calendar set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">{summary?.matchesCount || 0}</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Matches</p>
        </motion.div>
        <motion.div variants={scaleIn} className="data-card p-4 sm:p-5 flex flex-col items-center text-center">
          <Location set="bold" className="w-6 h-6 text-brand mb-2 opacity-80" />
          <h3 className="text-2xl font-heading text-dark-bg">1</h3>
          <p className="text-xs text-dark-muted font-bold uppercase tracking-wider">Venue</p>
        </motion.div>
      </motion.section>

      {/* ABOUT THE TOURNAMENT SECTION */}
      <motion.section 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.1 }}
        className="w-full max-w-[96%] mx-auto px-4 py-8 md:py-12 space-y-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={fadeUp} className="data-card p-6 space-y-2 border-t-2 border-brand text-center">
            <Location set="bold" className="w-8 h-8 text-brand mx-auto" />
            <h3 className="font-heading font-bold text-dark-bg text-base">HOST VENUE</h3>
            <p className="text-xs text-dark-muted">Railway Pitch, Madhapar, Rajkot</p>
          </motion.div>

          <motion.div variants={fadeUp} className="data-card p-6 space-y-2 border-t-2 border-brand text-center">
            <Calendar set="bold" className="w-8 h-8 text-brand mx-auto" />
            <h3 className="font-heading font-bold text-dark-bg text-base">OFFICIAL DATES</h3>
            <p className="text-xs text-dark-muted">26 September – 10 October 2026</p>
          </motion.div>

          <motion.div variants={fadeUp} className="data-card p-6 space-y-2 border-t-2 border-brand text-center">
            <Discovery set="bold" className="w-8 h-8 text-brand mx-auto" />
            <h3 className="font-heading font-bold text-dark-bg text-base">NATIONS</h3>
            <p className="text-xs text-dark-muted">7 Participating University Nations</p>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="data-card p-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl md:text-3xl font-black text-dark-bg tracking-tight uppercase">
              ABOUT <span className="text-brand">THE TOURNAMENT</span>
            </h2>
          </div>
          <div className="text-sm text-dark-surface space-y-4 leading-relaxed max-w-3xl mx-auto text-center">
            <p>
              The <strong>MULSU ICC '26 Champions Cup</strong> represents the premier collegiate football tournament uniting student athletes across 7 nations: <strong>Liberia, Eswatini, Tanzania, South Sudan, Zimbabwe, Nigeria, and Uganda</strong>.
            </p>
            <p>
              Hosted at the state-of-the-art facilities of <strong>Railway Pitch, Madhapar, Rajkot</strong>, the 9-day tournament showcases group stage competition, knockout rounds, and the championship grand final.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-surface-border">
            <h3 className="font-heading text-sm font-bold text-brand uppercase tracking-wider mb-6 text-center">Participating Nations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Liberia', code: 'lbr' },
                { name: 'Eswatini', code: 'swz' },
                { name: 'Tanzania', code: 'tza' },
                { name: 'South Sudan', code: 'ssd' },
                { name: 'Zimbabwe', code: 'zwe' },
                { name: 'Nigeria', code: 'nga' },
                { name: 'Uganda', code: 'uga' }
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
        </motion.div>
      </motion.section>

      {/* OFFICIAL SPONSORS SECTION */}
      <HomePageSponsors sponsors={sponsors} />

      {/* CALL TO ACTION */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
        className="w-full max-w-4xl mx-auto px-4 py-12 text-center"
      >
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
      </motion.section>
    </div>
  );
};
