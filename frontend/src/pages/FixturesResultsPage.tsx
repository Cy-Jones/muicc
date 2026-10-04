import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { staggerContainer } from '../lib/animations';
import { MatchListItem } from './MatchListItem';
import { StandingsTable } from './StandingsTable';

export const FixturesResultsPage: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topAssists, setTopAssists] = useState<any[]>([]);
  const [systemNations, setSystemNations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'STANDINGS'>('MATCHES');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'LIVE' | 'TODAY' | 'UPCOMING' | 'RESULTS'>('ALL');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesData, standingsData, settingsData] = await Promise.allSettled([
          api.getMatches(),
          api.getStandings(),
          api.getSettings()
        ]);
        if (matchesData.status === 'fulfilled') setMatches(matchesData.value || []);
        if (standingsData.status === 'fulfilled') {
          setStandings(standingsData.value?.standings || []);
          setTopScorers(standingsData.value?.topScorers || []);
          setTopAssists(standingsData.value?.topAssists || []);
        }
        if (settingsData.status === 'fulfilled' && settingsData.value?.nations) setSystemNations(settingsData.value.nations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getFilteredMatches = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    switch (matchFilter) {
      case 'LIVE':
        return matches.filter(m => m.status === 'LIVE' || m.status === 'HALF_TIME');
      case 'TODAY':
        return matches.filter(m => m.date === todayStr);
      case 'UPCOMING':
        return matches.filter(m => m.status === 'SCHEDULED');
      case 'RESULTS':
        return matches.filter(m => m.status === 'FULL_TIME').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      default:
        return matches;
    }
  };

  const filteredMatches = getFilteredMatches();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-dark-bg uppercase tracking-tight">
            Matches & Standings
          </h1>
          <p className="text-dark-muted text-sm mt-1 font-medium">Live scores, fixtures, results, and current group rankings.</p>
        </div>

        {/* Primary Tabs */}
        <div className="flex bg-surface-bg p-1 rounded border border-surface-border w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('MATCHES')} 
            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${activeTab === 'MATCHES' ? 'bg-brand text-black shadow-sm' : 'text-dark-muted hover:text-dark-bg'}`}
          >
            Matches
          </button>
          <button 
            onClick={() => setActiveTab('STANDINGS')} 
            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${activeTab === 'STANDINGS' ? 'bg-brand text-black shadow-sm' : 'text-dark-muted hover:text-dark-bg'}`}
          >
            Standings
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'MATCHES' ? (
          <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* Match Filters */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
              {['ALL', 'LIVE', 'TODAY', 'UPCOMING', 'RESULTS'].map((f) => (
                <button
                  key={f}
                  onClick={() => setMatchFilter(f as any)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full whitespace-nowrap transition-colors ${matchFilter === f ? 'bg-brand text-black' : 'bg-surface-card border border-surface-border text-dark-surface hover:text-brand hover:bg-surface-hover'}`}
                >
                  {f === 'LIVE' && <span className="inline-block w-2 h-2 rounded-full bg-status-live animate-ping mr-2 align-middle"></span>}
                  {f}
                </button>
              ))}
            </div>

            {/* Match List */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="data-card divide-y divide-surface-border"
            >
              {loading ? (
                <div className="p-12 text-center text-dark-muted">Loading matches...</div>
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map(m => (
                  <MatchListItem key={m.id} match={m} onClick={() => setSelectedMatchId(m.id)} />
                ))
              ) : (
                <div className="p-12 text-center text-dark-muted border-dashed border-surface-border border m-4 rounded">No matches found for the selected filter.</div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="standings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-8">
              {loading ? (
                <div className="p-12 text-center text-dark-muted data-card border-dashed">Loading standings...</div>
              ) : standings.length === 0 ? (
                <div className="p-12 text-center text-dark-muted data-card border-dashed">No standings available.</div>
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {standings.map((groupData) => (
                    <StandingsTable key={groupData.group.id} groupData={groupData} />
                  ))}
                </motion.div>
              )}
            </div>

            <div className="xl:col-span-1">
              <div className="data-card sticky top-6 overflow-hidden">
                <div className="bg-surface-bg px-4 py-3 border-b border-surface-border">
                  <h3 className="font-heading text-lg font-black text-brand uppercase tracking-tight">
                    Top Scorers
                  </h3>
                </div>
                <div className="bg-surface-card">
                  {loading ? (
                    <div className="p-8 text-center text-dark-muted">Loading...</div>
                  ) : topScorers.length === 0 ? (
                    <div className="p-8 text-center text-dark-muted text-sm">No goals scored yet.</div>
                  ) : (
                    <div className="flex flex-col">
                      {topScorers.map((scorer, index) => (
                        <div key={scorer.id} className="flex items-center gap-3 p-3 border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                          <div className="w-6 text-center flex-shrink-0 text-xs font-bold text-dark-muted">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-dark-bg truncate">{scorer.full_name}</p>
                            <p className="text-xs text-dark-muted truncate">{scorer.team_name}</p>
                          </div>
                          <div className="font-black text-base text-brand w-8 text-right pr-2">
                            {scorer.goals}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="data-card sticky top-[450px] overflow-hidden mt-6">
                <div className="bg-surface-bg px-4 py-3 border-b border-surface-border">
                  <h3 className="font-heading text-lg font-black text-brand uppercase tracking-tight">
                    Top Assists
                  </h3>
                </div>
                <div className="bg-surface-card">
                  {loading ? (
                    <div className="p-8 text-center text-dark-muted">Loading...</div>
                  ) : topAssists.length === 0 ? (
                    <div className="p-8 text-center text-dark-muted text-sm">No assists yet.</div>
                  ) : (
                    <div className="flex flex-col">
                      {topAssists.map((player, index) => (
                        <div key={player.id} className="flex items-center gap-3 p-3 border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                          <div className="w-6 text-center flex-shrink-0 text-xs font-bold text-dark-muted">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-dark-bg truncate">{player.full_name}</p>
                            <p className="text-xs text-dark-muted truncate">{player.team_name}</p>
                          </div>
                          <div className="font-black text-base text-brand w-8 text-right pr-2">
                            {player.assists}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMatchId && (
          <MatchDetailModal 
            matchId={selectedMatchId} 
            onClose={() => setSelectedMatchId(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
