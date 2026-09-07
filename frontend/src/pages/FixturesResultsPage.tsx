import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Calendar, TickSquare, TimeCircle } from 'react-iconly';

export const FixturesResultsPage: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'STANDINGS'>('MATCHES');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'LIVE' | 'TODAY' | 'UPCOMING' | 'RESULTS'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [matchesData, standingsData] = await Promise.all([
          api.getMatches(),
          api.getStandings()
        ]);
        setMatches(matchesData || []);
        setStandings(standingsData?.standings || []);
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
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full whitespace-nowrap transition-colors \${matchFilter === f ? 'bg-brand text-black' : 'bg-surface-card border border-surface-border text-dark-surface hover:text-brand hover:bg-surface-hover'}`}
                >
                  {f === 'LIVE' && <span className="inline-block w-2 h-2 rounded-full bg-status-live animate-ping mr-2 align-middle"></span>}
                  {f}
                </button>
              ))}
            </div>

            {/* Match List */}
            <div className="data-card divide-y divide-surface-border">
              {loading ? (
                <div className="p-12 text-center text-dark-muted">Loading matches...</div>
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map(m => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-surface-hover transition-colors gap-4">
                    
                    {/* Date/Status Info */}
                    <div className="flex sm:flex-col items-center sm:items-start justify-between sm:w-1/6 text-xs text-dark-muted font-bold">
                      <span className="sm:hidden uppercase tracking-wider text-dark-bg bg-surface-bg px-2 py-1 rounded border border-surface-border">{m.stage || 'Group'}</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar set="bold" className="w-3.5 h-3.5" />
                        <span>{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className="hidden sm:inline-block mt-1 uppercase tracking-wider">{m.stage || 'Group Stage'}</span>
                    </div>

                    {/* Main Match Score Area */}
                    <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8">
                      {/* Home Team */}
                      <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-end gap-2 sm:gap-3 text-center sm:text-right">
                        <span className="text-sm font-bold text-dark-bg order-2 sm:order-1">{m.team_a_name}</span>
                        {m.team_a_logo ? (
                          <img src={m.team_a_logo} alt={m.team_a_name} className="w-8 h-8 object-contain order-1 sm:order-2" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-surface-bg border border-surface-border flex items-center justify-center order-1 sm:order-2">
                            <span className="text-[10px] text-dark-muted font-bold">{m.team_a_name.substring(0,3).toUpperCase()}</span>
                          </div>
                        )}
                      </div>

                      {/* Score/Time */}
                      <div className="flex flex-col items-center justify-center min-w-[80px]">
                        {m.status === 'SCHEDULED' ? (
                          <div className="flex flex-col items-center">
                            <span className="font-heading text-lg font-bold text-dark-surface bg-surface-bg px-2 py-0.5 rounded border border-surface-border">{m.time}</span>
                            <span className="badge badge-upcoming mt-1 flex items-center gap-1"><TimeCircle set="bold" className="w-3 h-3"/> Scheduled</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-2xl font-black text-dark-bg">{m.score_a ?? 0}</span>
                              <span className="text-surface-border">-</span>
                              <span className="font-heading text-2xl font-black text-dark-bg">{m.score_b ?? 0}</span>
                            </div>
                            {m.status === 'LIVE' || m.status === 'HALF_TIME' ? (
                              <span className="badge badge-live mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"/> Live</span>
                            ) : (
                              <span className="badge badge-completed mt-1 flex items-center gap-1"><TickSquare set="bold" className="w-3 h-3"/> Full Time</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex flex-col sm:flex-row items-center justify-start gap-2 sm:gap-3 text-center sm:text-left">
                        {m.team_b_logo ? (
                          <img src={m.team_b_logo} alt={m.team_b_name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-surface-bg border border-surface-border flex items-center justify-center">
                            <span className="text-[10px] text-dark-muted font-bold">{m.team_b_name.substring(0,3).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="text-sm font-bold text-dark-bg">{m.team_b_name}</span>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="hidden sm:flex sm:w-1/6 flex-col items-end justify-center text-xs text-dark-muted font-bold">
                      {m.venue && <span>{m.venue}</span>}
                      {m.group_name && <span className="uppercase tracking-wider mt-1">{m.group_name}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-dark-muted border-dashed border-surface-border border m-4 rounded">No matches found for the selected filter.</div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="standings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            {loading ? (
              <div className="p-12 text-center text-dark-muted data-card border-dashed">Loading standings...</div>
            ) : standings.length === 0 ? (
              <div className="p-12 text-center text-dark-muted data-card border-dashed">No standings available.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {standings.map((groupData) => (
                  <div key={groupData.group.id} className="data-card overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-surface-bg px-4 py-3 border-b border-surface-border flex justify-between items-center">
                      <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-tight">{groupData.group.name}</h3>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 p-3 border-b border-surface-border bg-surface-bg text-[10px] font-bold text-dark-muted uppercase tracking-wider">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-5">Team</div>
                      <div className="col-span-1 text-center" title="Played">P</div>
                      <div className="col-span-1 text-center" title="Won">W</div>
                      <div className="col-span-1 text-center" title="Drawn">D</div>
                      <div className="col-span-1 text-center" title="Lost">L</div>
                      <div className="col-span-1 text-center" title="Goal Difference">GD</div>
                      <div className="col-span-1 text-center text-dark-bg">PTS</div>
                    </div>

                    {/* Table Rows */}
                    <div className="bg-surface-card">
                      {groupData.table.map((team: any, idx: number) => (
                        <div key={team.team_id} className={`grid grid-cols-12 gap-2 p-3 items-center border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors \${idx < 2 ? 'border-l-4 border-l-status-completed' : 'border-l-4 border-l-transparent'}`}>
                          <div className="col-span-1 text-center text-xs font-bold text-dark-muted">{idx + 1}</div>
                          <div className="col-span-5 flex items-center gap-2">
                            {team.team_logo ? (
                              <img src={team.team_logo} alt="" className="w-5 h-5 object-contain" />
                            ) : (
                              <div className="w-5 h-5 bg-surface-bg border border-surface-border rounded flex items-center justify-center text-[8px] font-bold text-dark-muted">
                                {team.team_name.substring(0,2)}
                              </div>
                            )}
                            <span className="text-xs font-bold text-dark-bg truncate">{team.team_name}</span>
                          </div>
                          <div className="col-span-1 text-center text-xs text-dark-surface font-medium">{team.played}</div>
                          <div className="col-span-1 text-center text-xs text-dark-surface font-medium">{team.won}</div>
                          <div className="col-span-1 text-center text-xs text-dark-surface font-medium">{team.drawn}</div>
                          <div className="col-span-1 text-center text-xs text-dark-surface font-medium">{team.lost}</div>
                          <div className="col-span-1 text-center text-xs text-dark-surface font-medium">{team.goals_for - team.goals_against}</div>
                          <div className="col-span-1 text-center text-xs font-black text-brand">{team.points}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
