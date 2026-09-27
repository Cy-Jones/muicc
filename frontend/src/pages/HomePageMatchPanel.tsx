import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Calendar } from 'react-iconly';
import { getMatchLiveClock } from '../lib/liveClock';
import { getTeamFlagImage } from '../lib/flags';

interface HomePageMatchPanelProps {
  matches: any[];
}

export const HomePageMatchPanel: React.FC<HomePageMatchPanelProps> = ({ matches }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'upcoming' | 'results'>('today');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (!flagSrc) {
      flagSrc = getTeamFlagImage(countryName, teamName) || undefined;
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
                        {m.status === 'LIVE' || m.status === 'HALF_TIME' ? getMatchLiveClock(m).display : m.status.replace(/_/g, ' ')}
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
  );
};
