import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Plus, Delete, Play, TimeCircle, CloseSquare, Edit, TickSquare } from 'react-iconly';
import { getMatchLiveClock } from '../../lib/liveClock';
import { AdminCreateMatchModal } from './AdminCreateMatchModal';
import { AdminEditMatchModal } from './AdminEditMatchModal';
import { AdminExtraTimeModal } from './AdminExtraTimeModal';

interface AdminMatchesModuleProps {
  matches: any[];
  teams: any[];
  players: any[];
  onRefresh: () => void;
  setMessage: (msg: string) => void;
}

const FLAG_MAP: Record<string, string> = {
  liberia: '/images/flags/lbr.png',
  eswatini: '/images/flags/swz.png',
  tanzania: '/images/flags/tza.png',
  'south sudan': '/images/flags/ssd.png',
  zimbabwe: '/images/flags/zwe.png',
  india: '/images/flags/ind.png',
  nigeria: '/images/flags/nga.png',
  uganda: '/images/flags/uga.png',
  zambia: '/images/flags/zmb.png'
};

export const AdminMatchesModule: React.FC<AdminMatchesModuleProps> = ({ matches, teams, players, onRefresh, setMessage }) => {
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'FULL_TIME'>('ALL');
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);

  const [extraTimeMatch, setExtraTimeMatch] = useState<any>(null);

  const handleConfirmResult = async (matchId: string) => {
    if (!window.confirm('Confirm this match result? This will automatically recalculate group standings.')) return;
    try {
      await api.adminConfirmMatchResult(matchId);
      setMessage('Match result confirmed! Standings and statistics updated automatically.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleForceResetStandings = async () => {
    if (!window.confirm('Are you sure you want to FORCE RESET all standings? This will recalculate all points based on confirmed matches. Use only if standings are corrupted.')) return;
    try {
      await api.adminForceResetStandings();
      setMessage('Standings forcefully reset and recalculated.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };


  const handleDeleteMatch = async (matchId: string, matchCode: string) => {
    if (!window.confirm(`Delete match "${matchCode}"?`)) return;
    try {
      await api.adminDeleteMatch(matchId);
      setMessage(`Match ${matchCode} deleted successfully.`);
      onRefresh();
    } catch (err: any) { alert(err.message); }
  };

  const handleLiveClockControl = async (matchId: string, action: string, stoppageTime?: number) => {
    try {
      const res = await api.adminControlLiveClock(matchId, { action, stoppage_time: stoppageTime });
      setMessage(res.message);
      onRefresh();
    } catch (err: any) { alert(err.message); }
  };

  const getTeamFlag = (teamName: string, countryName?: string, logoUrl?: string) => {
    let src = logoUrl;
    if (!src) {
      const key = Object.keys(FLAG_MAP).find(k => 
        (countryName && countryName.toLowerCase().includes(k)) ||
        (teamName && teamName.toLowerCase().includes(k))
      );
      if (key) src = FLAG_MAP[key];
    }
    if (src) {
      return <img src={src} alt={teamName} className="w-5 h-3.5 object-cover rounded-sm border border-surface-border shadow-sm" />;
    }
    return <span className="text-[10px]">⚽</span>;
  };

  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'LIVE') return m.status === 'LIVE' || m.status === 'HALF_TIME';
    if (matchFilter === 'SCHEDULED') return m.status === 'SCHEDULED';
    if (matchFilter === 'FULL_TIME') return m.status === 'FULL_TIME';
    return true;
  });

  return (
    <>
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border bg-surface-bg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Match Centre</h2>
            <div className="flex bg-black/40 border border-surface-border rounded-lg p-1">
              <button onClick={() => setMatchFilter('ALL')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${matchFilter === 'ALL' ? 'bg-brand text-black' : 'text-dark-muted hover:text-dark-bg'}`}>All</button>
              <button onClick={() => setMatchFilter('LIVE')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${matchFilter === 'LIVE' ? 'bg-status-error text-dark-bg' : 'text-dark-muted hover:text-status-error'}`}><div className={`w-1.5 h-1.5 rounded-full ${matchFilter === 'LIVE' ? 'bg-dark-bg' : 'bg-status-error'} animate-pulse`} /> Live</button>
              <button onClick={() => setMatchFilter('SCHEDULED')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${matchFilter === 'SCHEDULED' ? 'bg-brand/20 text-brand' : 'text-dark-muted hover:text-brand'}`}>Fixtures</button>
              <button onClick={() => setMatchFilter('FULL_TIME')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${matchFilter === 'FULL_TIME' ? 'bg-status-completed/20 text-status-completed' : 'text-dark-muted hover:text-status-completed'}`}>Results</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleForceResetStandings} className="btn-outline px-4 py-2 text-xs flex items-center gap-2 text-status-error border-status-error hover:bg-status-error hover:text-black">
              Force Reset Standings
            </button>
            <button onClick={() => setShowCreateMatchModal(true)} className="btn-primary px-4 py-2 text-xs flex items-center gap-2"><Plus set="bold" className="w-4 h-4" /> Create Match</button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredMatches.length === 0 && <div className="p-8 text-center text-dark-muted text-xs font-bold uppercase tracking-widest bg-surface-card rounded-xl border border-surface-border border-dashed">No matches found.</div>}
          {filteredMatches.map(m => {
            const liveClock = getMatchLiveClock(m);
            const isLiveOrHt = m.status === 'LIVE' || m.status === 'HALF_TIME';

            return (
              <div key={m.id} className={`bg-surface-card rounded-xl border overflow-hidden shadow-sm transition-all ${
                isLiveOrHt ? 'border-status-error/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-surface-border'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest p-3 bg-surface-bg border-b border-surface-border">
                  <div className="flex items-center gap-3">
                    <span className="text-dark-muted">{m.match_code}</span>
                    <span className="text-dark-bg">{m.stage?.replace(/_/g, ' ')}</span>
                    {isLiveOrHt && (
                      <span className="px-2 py-0.5 rounded-sm bg-status-error/20 text-status-error border border-status-error/30 flex items-center gap-1 animate-pulse">
                        <TimeCircle set="bold" className="w-3 h-3" /> {liveClock.display}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-dark-muted">{m.date} • {m.time}</span>
                    <span className={`px-2 py-0.5 rounded-sm ${
                      m.status === 'FULL_TIME' ? 'bg-status-completed/10 text-status-completed border border-status-completed/30' :
                      m.status === 'LIVE' ? 'bg-status-error/10 text-status-error border border-status-error/30' :
                      m.status === 'HALF_TIME' ? 'bg-status-warning/10 text-status-warning border border-status-warning/30' : 'bg-surface-border text-dark-muted'
                    }`}>
                      {m.status === 'HALF_TIME' ? 'HT' : m.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-[1fr,auto,1fr] items-center gap-6">
                  <div className="flex flex-col items-end gap-1.5 text-right">
                    {getTeamFlag(m.team_a_name, m.team_a_country, m.team_a_logo)}
                    <span className="font-heading font-black text-dark-bg text-sm sm:text-base leading-tight">{m.team_a_name}</span>
                  </div>
                  <div className="font-heading text-3xl font-black text-brand px-4 py-2 bg-surface-bg rounded-lg border border-surface-border min-w-[100px] text-center ">
                    {m.score_a} - {m.score_b}
                  </div>
                  <div className="flex flex-col items-start gap-1.5 text-left">
                    {getTeamFlag(m.team_b_name, m.team_b_country, m.team_b_logo)}
                    <span className="font-heading font-black text-dark-bg text-sm sm:text-base leading-tight">{m.team_b_name}</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-bg border-t border-surface-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {m.confirmed_result !== 1 && (
                      <>
                        {liveClock.phase === 'PRE_MATCH' && <button onClick={() => handleLiveClockControl(m.id, 'START_1ST_HALF')} className="action-btn bg-status-completed/10 text-status-completed border-status-completed/30"><Play set="bold" className="w-3.5 h-3.5" /> Start 1st Half</button>}
                        
                        {liveClock.phase === 'FIRST_HALF' && (
                          <>
                            <button onClick={() => handleLiveClockControl(m.id, 'END_1ST_HALF')} className="action-btn bg-status-warning/10 text-status-warning border-status-warning/30"><CloseSquare set="bold" className="w-3.5 h-3.5" /> End 1st Half</button>
                            <button onClick={() => setExtraTimeMatch(m)} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                          </>
                        )}
                        
                        {liveClock.phase === 'HALF_TIME' && <button onClick={() => handleLiveClockControl(m.id, 'START_2ND_HALF')} className="action-btn bg-blue-500/10 text-blue-400 border-blue-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Start 2nd Half</button>}
                        
                        {liveClock.phase === 'SECOND_HALF' && (
                          <>
                            <button onClick={() => handleLiveClockControl(m.id, 'END_2ND_HALF')} className="action-btn bg-status-error/10 text-status-error border-status-error/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> Full Time</button>
                            <button onClick={() => setExtraTimeMatch(m)} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                          </>
                        )}
                        
                        {liveClock.phase === 'FULL_TIME' && (
                          <>
                            <button onClick={() => handleLiveClockControl(m.id, 'START_ET_1')} className="action-btn bg-orange-500/10 text-orange-400 border-orange-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Start ET1</button>
                          </>
                        )}
                        
                        {liveClock.phase === 'EXTRA_TIME_FIRST_HALF' && (
                          <>
                            <button onClick={() => handleLiveClockControl(m.id, 'END_ET_1')} className="action-btn bg-status-warning/10 text-status-warning border-status-warning/30"><CloseSquare set="bold" className="w-3.5 h-3.5" /> End ET1</button>
                            <button onClick={() => setExtraTimeMatch(m)} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                          </>
                        )}
                        
                        {liveClock.phase === 'EXTRA_TIME_HALF_TIME' && <button onClick={() => handleLiveClockControl(m.id, 'START_ET_2')} className="action-btn bg-blue-500/10 text-blue-400 border-blue-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Start ET2</button>}

                        {liveClock.phase === 'EXTRA_TIME_SECOND_HALF' && (
                          <>
                            <button onClick={() => handleLiveClockControl(m.id, 'START_PENALTIES')} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Pens</button>
                            <button onClick={() => handleLiveClockControl(m.id, 'END_MATCH')} className="action-btn bg-status-error/10 text-status-error border-status-error/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> End Match</button>
                            <button onClick={() => setExtraTimeMatch(m)} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                          </>
                        )}
                        
                        {liveClock.phase === 'PENALTY_SHOOTOUT' && (
                          <button onClick={() => handleLiveClockControl(m.id, 'END_MATCH')} className="action-btn bg-status-error/10 text-status-error border-status-error/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> End Match</button>
                        )}

                        {liveClock.phase !== 'COMPLETED' && (
                          <>
                            <button onClick={() => handleLiveClockControl(m.id, 'TOGGLE_TEST_MODE')} className={`action-btn ${m.is_test_mode ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                              {m.is_test_mode === 1 ? 'Test Mode: ON' : 'Test Mode: OFF'}
                            </button>
                            
                            {['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_FIRST_HALF', 'EXTRA_TIME_SECOND_HALF'].includes(liveClock.phase) && (
                              <button 
                                onClick={() => handleLiveClockControl(m.id, m.live_timer_is_paused === 1 ? 'RESUME_TIMER' : 'PAUSE_TIMER')} 
                                className={`action-btn ${m.live_timer_is_paused === 1 ? 'bg-status-completed/10 text-status-completed border-status-completed/30' : 'bg-status-warning/10 text-status-warning border-status-warning/30'}`}
                              >
                                {m.live_timer_is_paused === 1 ? <><Play set="bold" className="w-3.5 h-3.5" /> Resume Clock</> : <><CloseSquare set="bold" className="w-3.5 h-3.5" /> Pause Clock</>}
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={async () => {
                      try {
                        const details = await api.getMatchDetail(m.id);
                        setEditingMatch(details.match);
                      } catch (err: any) { alert(err.message); }
                    }} className="action-btn bg-surface-border text-dark-bg hover:bg-surface-border border-surface-border"><Edit set="bold" className="w-3.5 h-3.5" /> Edit</button>
                    
                    {m.status === 'FULL_TIME' && m.confirmed_result !== 1 && <button onClick={() => handleConfirmResult(m.id)} className="action-btn bg-status-completed/10 text-status-completed hover:bg-status-completed/20 border-status-completed/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> Confirm FT</button>}
                    
                    <button onClick={() => handleDeleteMatch(m.id, m.match_code)} className="action-btn bg-status-error/10 text-status-error hover:bg-status-error/20 border-status-error/30 px-2"><Delete set="bold" className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modals placed inside the component */}
        {showCreateMatchModal && (
          <AdminCreateMatchModal
            teams={teams}
            onClose={() => setShowCreateMatchModal(false)}
            onRefresh={onRefresh}
            setMessage={setMessage}
          />
        )}
      </div>
      
      {editingMatch && (
        <AdminEditMatchModal
          match={editingMatch}
          teams={teams}
          players={players}
          onClose={() => setEditingMatch(null)}
          onRefresh={onRefresh}
          setMessage={setMessage}
        />
      )}

      {extraTimeMatch && (
        <AdminExtraTimeModal
          extraTimeMatch={extraTimeMatch}
          onClose={() => setExtraTimeMatch(null)}
          handleLiveClockControl={handleLiveClockControl}
        />
      )}
    </>
  );
};
