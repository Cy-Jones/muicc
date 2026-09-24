import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Calendar, InfoSquare, ArrowRight, TickSquare, CloseSquare, Edit, Plus } from 'react-iconly';
import { motion } from 'framer-motion';

const SYSTEM_FLAGS: Record<string, string> = {
  liberia: '/images/flags/lbr.png',
  eswatini: '/images/flags/swz.png',
  tanzania: '/images/flags/tza.png',
  tazania: '/images/flags/tza.png',
  'south sudan': '/images/flags/ssd.png',
  zimbabwe: '/images/flags/zwe.png',
  india: '/images/flags/ind.png',
  nigeria: '/images/flags/nga.png',
  uganda: '/images/flags/uga.png',
  zambia: '/images/flags/zmb.png'
};

const getFlagUrl = (teamName: string, countryName?: string, logoUrl?: string) => {
  if (logoUrl) return logoUrl;
  const fallbackKey = Object.keys(SYSTEM_FLAGS).find(k => teamName.toLowerCase().includes(k) || (countryName && countryName.toLowerCase().includes(k)));
  if (fallbackKey) return SYSTEM_FLAGS[fallbackKey];
  return null;
};

export const ManagerMatchesSection: React.FC<{ team: any, players: any[] }> = ({ team, players }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  
  // Lineup Form State
  const [formation, setFormation] = useState('4-4-2');
  const [lineupPlayers, setLineupPlayers] = useState<any[]>([]);

  const fetchMatches = async () => {
    try {
      const res = await api.getManagerMatches();
      setMatches(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleOpenLineupModal = async (match: any) => {
    setSelectedMatch(match);
    try {
      const res = await api.getManagerMatchLineup(match.id);
      if (res && res.players && res.players.length > 0) {
        setFormation(res.lineup.formation || '4-4-2');
        setLineupPlayers(res.players);
      } else {
        // Initialize with default empty lineup based on current squad
        setFormation('4-4-2');
        const initialLineup = players.map(p => ({
          player_id: p.id,
          full_name: p.full_name,
          jersey_number: p.jersey_number,
          registered_position: p.position,
          is_starting: false,
          position: p.position,
          display_order: 0
        }));
        setLineupPlayers(initialLineup);
      }
    } catch (err) {
      console.error("Failed to load lineup", err);
    }
  };

  const handleToggleStarter = (playerId: string) => {
    setLineupPlayers(prev => {
      const currentStarters = prev.filter(p => p.is_starting).length;
      return prev.map(p => {
        if (p.player_id === playerId) {
          if (!p.is_starting && currentStarters >= 11) {
            alert('You can only select 11 starting players.');
            return p;
          }
          return { ...p, is_starting: !p.is_starting };
        }
        return p;
      });
    });
  };

  const handlePositionChange = (playerId: string, newPos: string) => {
    setLineupPlayers(prev => prev.map(p => p.player_id === playerId ? { ...p, position: newPos } : p));
  };

  const handleSubmitLineup = async () => {
    const starters = lineupPlayers.filter(p => p.is_starting);
    if (starters.length !== 11) {
      alert('You must select exactly 11 starting players.');
      return;
    }

    try {
      await api.submitManagerMatchLineup(selectedMatch.id, {
        formation,
        players: lineupPlayers
      });
      alert('Lineup submitted successfully!');
      setSelectedMatch(null);
      fetchMatches();
    } catch (err: any) {
      alert(err.message || 'Failed to submit lineup');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-surface-card rounded-xl border border-surface-border mt-8"></div>;
  }

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Upcoming Matches & Lineups</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map(m => (
          <div key={m.id} className="bg-surface-bg border border-surface-border rounded-xl overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-surface-border">
              <span className="text-[13px] font-bold text-dark-muted">{m.match_code} • {m.date} {m.time}</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-brand-gold/10 text-brand-gold px-3 py-1.5 rounded-md">
                {m.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex-1 flex items-center gap-4">
                <div className="h-8 flex items-center justify-center shrink-0">
                  <img 
                    src={getFlagUrl(m.team_a_name, m.team_a_country, m.team_a_logo) || 'https://ui-avatars.com/api/?name=' + m.team_a_name + '&background=f4f4f5&color=0A1A24'} 
                    alt={m.team_a_name} 
                    className="h-full w-auto rounded-sm border border-surface-border object-contain bg-surface-bg" 
                  />
                </div>
                <span className="font-bold text-[15px] text-dark-bg truncate max-w-[150px]">{m.team_a_name}</span>
              </div>
              <div className="px-4 font-black text-xl text-dark-muted">VS</div>
              <div className="flex-1 flex items-center gap-4 justify-end">
                <span className="font-bold text-[15px] text-dark-bg text-right truncate max-w-[150px]">{m.team_b_name}</span>
                <div className="h-8 flex items-center justify-center shrink-0">
                  <img 
                    src={getFlagUrl(m.team_b_name, m.team_b_country, m.team_b_logo) || 'https://ui-avatars.com/api/?name=' + m.team_b_name + '&background=f4f4f5&color=0A1A24'} 
                    alt={m.team_b_name} 
                    className="h-full w-auto rounded-sm border border-surface-border object-contain bg-surface-bg" 
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-border flex justify-between items-center bg-surface-bg">
              <div className="text-[11px] font-bold uppercase tracking-widest text-dark-bg">
                LINEUP: <span className={
                  !m.lineup_status ? 'text-dark-bg ml-2' :
                  m.lineup_status === 'APPROVED' ? 'text-status-completed ml-2' :
                  m.lineup_status === 'PENDING' ? 'text-dark-bg ml-2' : 'text-status-failed ml-2'
                }>{m.lineup_status || 'NOT SUBMITTED'}</span>
              </div>
              
              <button 
                onClick={() => handleOpenLineupModal(m)}
                className="bg-surface-bg border border-surface-border hover:bg-surface-hover text-dark-bg rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                {m.lineup_status ? <Edit className="w-3.5 h-3.5 text-dark-muted" /> : <Plus className="w-3.5 h-3.5 text-dark-muted" />}
                {m.lineup_status ? 'Edit Lineup' : 'Submit Lineup'}
              </button>
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <div className="col-span-full text-center py-8 text-dark-muted text-sm border border-dashed border-surface-border rounded-xl">
            No matches found for your team.
          </div>
        )}
      </div>

      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card w-full max-w-4xl max-h-[90vh] rounded-xl border border-surface-border shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-surface-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-heading text-xl font-black uppercase tracking-widest text-dark-bg">Submit Lineup</h3>
                <p className="text-xs text-dark-muted mt-1">{selectedMatch.match_code} • {selectedMatch.team_a_name} vs {selectedMatch.team_b_name}</p>
              </div>
              <button onClick={() => setSelectedMatch(null)} className="text-dark-muted hover:text-dark-bg transition-colors">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold uppercase tracking-widest text-dark-muted">Formation</label>
                <select 
                  className="input-field max-w-[200px]"
                  value={formation}
                  onChange={e => setFormation(e.target.value)}
                >
                  <option value="4-4-2">4-4-2</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="4-1-4-1">4-1-4-1</option>
                  <option value="4-4-1-1">4-4-1-1</option>
                  <option value="4-3-2-1">4-3-2-1</option>
                  <option value="4-5-1">4-5-1</option>
                  <option value="3-5-2">3-5-2</option>
                  <option value="3-4-3">3-4-3</option>
                  <option value="3-4-2-1">3-4-2-1</option>
                  <option value="3-4-1-2">3-4-1-2</option>
                  <option value="5-3-2">5-3-2</option>
                  <option value="5-4-1">5-4-1</option>
                </select>
                <div className="ml-auto text-sm font-bold">
                  Starters Selected: <span className={lineupPlayers.filter(p => p.is_starting).length === 11 ? 'text-status-completed' : 'text-status-pending'}>
                    {lineupPlayers.filter(p => p.is_starting).length}/11
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-surface-bg rounded text-[10px] font-black uppercase tracking-widest text-dark-muted">
                  <div className="col-span-1">No.</div>
                  <div className="col-span-4">Player Name</div>
                  <div className="col-span-2">Reg. Pos</div>
                  <div className="col-span-3">Match Pos</div>
                  <div className="col-span-2 text-center">Starting XI</div>
                </div>
                {lineupPlayers.map((p, index) => (
                  <div key={p.player_id} className="grid grid-cols-12 gap-2 items-center px-4 py-2 border border-surface-border rounded-lg bg-surface-bg">
                    <div className="col-span-1 font-mono font-bold text-dark-muted">{p.jersey_number}</div>
                    <div className="col-span-4 font-bold text-sm text-dark-bg truncate">{p.full_name}</div>
                    <div className="col-span-2 text-xs text-dark-muted">{p.registered_position}</div>
                    <div className="col-span-3">
                      <select 
                        className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs outline-none focus:border-brand transition-colors"
                        value={p.position}
                        onChange={e => handlePositionChange(p.player_id, e.target.value)}
                      >
                        <option value="GK">Goalkeeper (GK)</option>
                        <option value="DEF">Defender (DEF)</option>
                        <option value="MID">Midfielder (MID)</option>
                        <option value="FWD">Forward (FWD)</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={p.is_starting}
                          onChange={() => handleToggleStarter(p.player_id)}
                        />
                        <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-surface-border flex justify-end gap-3 bg-surface-bg shrink-0">
              <button onClick={() => setSelectedMatch(null)} className="btn-outline px-6 py-2 text-xs">Cancel</button>
              <button 
                onClick={handleSubmitLineup}
                className="btn-primary px-6 py-2 text-xs"
                disabled={lineupPlayers.filter(p => p.is_starting).length !== 11}
              >
                Submit Lineup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
