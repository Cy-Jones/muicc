import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloseSquare, Calendar, TimeCircle, Location } from 'react-iconly';
import { api } from '../lib/api';

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
  if (!teamName) return null;
  const fallbackKey = Object.keys(SYSTEM_FLAGS).find(k => teamName.toLowerCase().includes(k) || (countryName && countryName.toLowerCase().includes(k)));
  if (fallbackKey) return SYSTEM_FLAGS[fallbackKey];
  return null;
};

interface MatchDetailModalProps {
  matchId: string;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ matchId, onClose }) => {
  const [matchData, setMatchData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineupA, setLineupA] = useState<any>(null);
  const [lineupB, setLineupB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'LINEUPS'>('SUMMARY');

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const data = await api.getMatchDetail(matchId);
        setMatchData(data.match);
        setEvents(data.events || []);
        
        const la = data.lineups?.find((l: any) => l.team_id === data.match.team_a_id);
        const lb = data.lineups?.find((l: any) => l.team_id === data.match.team_b_id);
        setLineupA(la);
        setLineupB(lb);
      } catch (err) {
        console.error("Failed to fetch match details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="animate-pulse bg-surface-card w-full max-w-3xl h-[60vh] rounded-2xl border border-surface-border" />
      </div>
    );
  }

  if (!matchData) return null;

  const renderPlayerRow = (p: any, reverse = false) => (
    <div key={p.player_id} className={`flex items-center gap-3 py-2 ${reverse ? 'flex-row-reverse text-right' : ''}`}>
      <div className="w-6 h-6 rounded-full bg-surface-bg border border-surface-border flex items-center justify-center text-[10px] font-mono font-bold text-dark-muted shrink-0">
        {p.jersey_number}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-dark-bg">{p.full_name}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-brand">{p.position}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-surface-border shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header - Match Scoreboard */}
        <div className="relative p-6 sm:p-10 shrink-0 bg-surface-bg border-b border-surface-border">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-[#7A8794] hover:text-[#0A1A24] transition-colors z-10"
          >
            <CloseSquare set="bold" className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <div className="flex flex-col items-center gap-6">
            <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-dark-muted flex items-center justify-center gap-2 pt-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{new Date(matchData.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              {matchData.venue && (
                <>
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-surface-border mx-1 sm:mx-2" />
                  <Location className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{matchData.venue}</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-center w-full gap-4 sm:gap-16">
              {/* Team A */}
              <div className="flex-1 flex flex-col items-center justify-end gap-4">
                <div className="h-16 sm:h-20 flex items-center justify-center shrink-0">
                  <img 
                    src={getFlagUrl(matchData.team_a_name, matchData.team_a_country, matchData.team_a_logo) || 'https://ui-avatars.com/api/?name=' + matchData.team_a_name + '&background=f4f4f5&color=0A1A24'} 
                    alt={matchData.team_a_name} 
                    className="h-full w-auto rounded-md shadow-sm border border-surface-border object-contain bg-surface-bg" 
                  />
                </div>
                <div className="text-center font-bold text-sm sm:text-lg text-dark-bg">{matchData.team_a_name}</div>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center justify-center -mt-4 sm:-mt-6">
                {matchData.status === 'SCHEDULED' ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-heading text-4xl sm:text-6xl font-black text-dark-bg">
                      {matchData.time}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-dark-muted">Upcoming</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center gap-3 sm:gap-4 font-heading text-4xl sm:text-6xl font-black text-dark-bg">
                      <span>{matchData.score_a ?? 0}</span>
                      <span className="text-dark-muted text-3xl sm:text-5xl">:</span>
                      <span>{matchData.score_b ?? 0}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-dark-muted">
                      {matchData.status === 'LIVE' ? 'Live Now' : matchData.status?.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Team B */}
              <div className="flex-1 flex flex-col items-center justify-end gap-4">
                <div className="h-16 sm:h-20 flex items-center justify-center shrink-0">
                  <img 
                    src={getFlagUrl(matchData.team_b_name, matchData.team_b_country, matchData.team_b_logo) || 'https://ui-avatars.com/api/?name=' + matchData.team_b_name + '&background=f4f4f5&color=0A1A24'} 
                    alt={matchData.team_b_name} 
                    className="h-full w-auto rounded-md shadow-sm border border-surface-border object-contain bg-surface-bg" 
                  />
                </div>
                <div className="text-center font-bold text-sm sm:text-lg text-dark-bg">{matchData.team_b_name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 pt-4 border-b border-surface-border shrink-0 bg-surface-card gap-6">
          <button 
            onClick={() => setActiveTab('SUMMARY')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'SUMMARY' ? 'text-brand' : 'text-dark-muted hover:text-dark-bg'}`}
          >
            Summary
            {activeTab === 'SUMMARY' && <motion.div layoutId="matchTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
          </button>
          <button 
            onClick={() => setActiveTab('LINEUPS')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'LINEUPS' ? 'text-brand' : 'text-dark-muted hover:text-dark-bg'}`}
          >
            Lineups
            {activeTab === 'LINEUPS' && <motion.div layoutId="matchTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-card">
          
          {activeTab === 'SUMMARY' && (
            <div className="space-y-6 animate-fade-in">
              {/* Match Information */}
              <div className="bg-surface-bg rounded-xl p-4 border border-surface-border">
                <h3 className="font-heading text-xs font-black tracking-widest text-dark-muted uppercase mb-4 border-b border-surface-border pb-2">Match Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand" />
                    <span className="font-semibold text-dark-bg">{new Date(matchData.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TimeCircle className="w-4 h-4 text-brand" />
                    <span className="font-semibold text-dark-bg">{matchData.time}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Location className="w-4 h-4 text-brand" />
                    <span className="font-semibold text-dark-bg">{matchData.venue}</span>
                  </div>
                  {matchData.match_day_name && (
                    <div className="flex items-center gap-2 col-span-2 border-t border-surface-border pt-3 mt-1">
                      <span className="font-black uppercase tracking-widest text-xs text-dark-muted">MATCHDAY:</span>
                      <span className="font-bold text-dark-bg">{matchData.match_day_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match Events */}
              <div className="bg-surface-bg rounded-xl overflow-hidden border border-surface-border">
                <div className="bg-surface-card py-2 px-4 border-b border-surface-border">
                  <h3 className="font-heading text-xs font-black tracking-widest text-dark-muted uppercase">Match Events</h3>
                </div>
                
                {(!events || events.length === 0) ? (
                  <div className="text-center text-dark-muted text-sm font-bold py-12">
                    {matchData.status === 'SCHEDULED' 
                      ? "Match events will appear here once the match begins."
                      : "No events recorded for this match yet."}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {events.map((ev: any, idx: number) => {
                      const isTeamA = ev.team_id === matchData.team_a_id;
                      
                      const renderEventIcon = (type: string) => {
                        switch (type) {
                          case 'GOAL':
                            return <div className="w-4 h-4 rounded-full bg-dark-bg flex items-center justify-center text-white text-[9px] shadow-sm">⚽</div>;
                          case 'YELLOW_CARD':
                            return <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm"></div>;
                          case 'RED_CARD':
                            return <div className="w-2.5 h-3.5 bg-red-500 rounded-sm border border-red-700 shadow-sm"></div>;
                          case 'SUBSTITUTION':
                            return <div className="text-green-500 font-black text-sm leading-none">↑↓</div>;
                          default:
                            return <div className="w-1.5 h-1.5 rounded-full bg-dark-muted"></div>;
                        }
                      };

                      return (
                        <div key={ev.id || idx} className="flex items-center gap-2 sm:gap-4 p-3 border-b border-surface-border last:border-b-0 hover:bg-surface-card/50 transition-colors">
                          <div className={`flex-1 flex items-center ${isTeamA ? 'justify-end' : 'justify-end invisible'}`}>
                            {isTeamA && (
                              <div className="flex items-center gap-2 sm:gap-3 text-right">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-dark-bg">{ev.player_name}</span>
                                  {ev.secondary_player_name && <span className="text-[10px] sm:text-xs text-dark-muted">{ev.event_type === 'SUBSTITUTION' ? 'in for ' : 'assisted by '}{ev.secondary_player_name}</span>}
                                </div>
                                {renderEventIcon(ev.event_type)}
                              </div>
                            )}
                          </div>
                          
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-card border border-surface-border flex items-center justify-center font-black text-brand text-xs sm:text-sm shrink-0">
                            {ev.minute}'
                          </div>

                          <div className={`flex-1 flex items-center ${!isTeamA ? 'justify-start' : 'justify-start invisible'}`}>
                            {!isTeamA && (
                              <div className="flex items-center gap-2 sm:gap-3 text-left">
                                {renderEventIcon(ev.event_type)}
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-dark-bg">{ev.player_name}</span>
                                  {ev.secondary_player_name && <span className="text-[10px] sm:text-xs text-dark-muted">{ev.event_type === 'SUBSTITUTION' ? 'in for ' : 'assisted by '}{ev.secondary_player_name}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'LINEUPS' && (
            <div className="animate-fade-in">
              {!lineupA && !lineupB ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-bg border border-surface-border mb-4">
                    <TimeCircle className="w-6 h-6 text-dark-muted" />
                  </div>
                  <h3 className="font-heading text-lg font-black uppercase tracking-widest mb-1">Lineups Not Available</h3>
                  <p className="text-dark-muted text-sm">The starting lineups will be announced closer to kickoff.</p>
                </div>
              ) : (
                <div className="flex flex-col rounded-xl overflow-hidden bg-surface-bg border border-surface-border">
                  {/* Formation Header */}
                  {(lineupA?.formation || lineupB?.formation) && (
                    <div className="flex justify-between items-center py-2 px-4 bg-surface-bg border-b border-surface-border text-xs font-bold tracking-wider">
                      <span>{lineupA?.formation || '-'}</span>
                      <span className="text-dark-muted">FORMATION</span>
                      <span>{lineupB?.formation || '-'}</span>
                    </div>
                  )}

                  {/* Pitch Graphic */}
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-[#1a3826] overflow-hidden rounded-t-xl border-b border-surface-border">
                    {/* Pitch lines */}
                    <div className="absolute inset-0 border border-white/20 m-2 sm:m-4"></div>
                    {/* Center line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0 border-l border-white/20 -translate-x-1/2"></div>
                    {/* Center circle */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 sm:w-28 sm:h-28 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    {/* Penalty areas */}
                    <div className="absolute top-[20%] bottom-[20%] left-2 sm:left-4 w-12 sm:w-24 border border-white/20 border-l-0"></div>
                    <div className="absolute top-[20%] bottom-[20%] right-2 sm:right-4 w-12 sm:w-24 border border-white/20 border-r-0"></div>
                    <div className="absolute top-[35%] bottom-[35%] left-2 sm:left-4 w-4 sm:w-8 border border-white/20 border-l-0"></div>
                    <div className="absolute top-[35%] bottom-[35%] right-2 sm:right-4 w-4 sm:w-8 border border-white/20 border-r-0"></div>

                    {/* Render Players */}
                    {[
                      { lineup: lineupA, isAway: false },
                      { lineup: lineupB, isAway: true }
                    ].map(({ lineup, isAway }) => {
                      if (!lineup || !lineup.players) return null;
                      
                      const startingPlayers = lineup.players.filter((p: any) => p.is_starting);
                      if (startingPlayers.length === 0) return null;

                      // Parse formation
                      const formationParts = (lineup.formation || "4-3-3").split('-').map(Number).filter((n: any) => !isNaN(n));
                      const layers: any[][] = [];
                      
                      // Layer 0: GK
                      layers.push([startingPlayers[0]]);
                      
                      let playerIdx = 1;
                      for (const count of formationParts) {
                        const layerPlayers = [];
                        for (let i = 0; i < count; i++) {
                          if (playerIdx < startingPlayers.length) {
                            layerPlayers.push(startingPlayers[playerIdx]);
                            playerIdx++;
                          }
                        }
                        layers.push(layerPlayers);
                      }
                      
                      // Any leftover players
                      while (playerIdx < startingPlayers.length) {
                        layers[layers.length - 1].push(startingPlayers[playerIdx]);
                        playerIdx++;
                      }

                      return layers.map((layerPlayers, colIdx) => {
                        const totalLayers = layers.length;
                        const minX = 8;
                        const maxX = 45;
                        const fraction = colIdx / Math.max(1, totalLayers - 1);
                        const x = minX + fraction * (maxX - minX);
                        const finalX = isAway ? 100 - x : x;

                        return layerPlayers.map((p, rowIdx) => {
                          const y = ((rowIdx + 1) * 100) / (layerPlayers.length + 1);
                          return (
                            <div key={p.player_id} className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${finalX}%`, top: `${y}%` }}>
                              {p.photo_url ? (
                                <img src={p.photo_url} alt={p.full_name} className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-full drop-shadow-md" />
                              ) : (
                                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-end justify-center overflow-hidden pt-2 text-white/50 bg-[#0A1620] border border-[#1A2D3C]">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8 mb-[-4px]">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                                  </svg>
                                </div>
                              )}
                              <div className="mt-[-4px] z-20 flex items-center bg-[#111111] rounded-full px-1.5 py-[1px] shadow border border-[#222222]">
                                <span className="text-[#888888] text-[9px] sm:text-[10px] font-mono mr-1.5 font-bold">{p.jersey_number}</span>
                                <span className="text-white text-[9px] sm:text-[10px] font-bold whitespace-nowrap overflow-hidden max-w-[45px] sm:max-w-[60px] text-ellipsis leading-tight">{p.full_name.split(' ').pop()}</span>
                              </div>
                            </div>
                          );
                        });
                      });
                    })}
                  </div>

                  {/* Starting XI Header */}
                  <div className="bg-surface-card border-y border-surface-border py-2 text-center text-xs font-black tracking-widest text-dark-muted uppercase">
                    STARTING LINEUPS
                  </div>

                  <div className="flex flex-col">
                    {Array.from({ length: Math.max(
                      (lineupA?.players?.filter((p: any) => p.is_starting) || []).length,
                      (lineupB?.players?.filter((p: any) => p.is_starting) || []).length
                    )}).map((_, i) => {
                      const pA = lineupA?.players?.filter((p: any) => p.is_starting)[i];
                      const pB = lineupB?.players?.filter((p: any) => p.is_starting)[i];
                      return (
                        <div key={`start-${i}`} className={`flex justify-between items-center py-2.5 px-4 ${i % 2 === 0 ? 'bg-surface-bg' : 'bg-surface-card'}`}>
                          {/* Home Player */}
                          <div className="flex-1 flex items-center justify-start gap-3">
                            {pA ? (
                              <>
                                <span className="w-5 text-center font-mono font-semibold text-sm">{pA.jersey_number}</span>
                                <span className="font-semibold text-sm truncate text-dark-bg">
                                  {pA.full_name} {pA.position === 'GK' && <span className="text-dark-muted font-normal text-xs ml-1">(G)</span>}
                                </span>
                              </>
                            ) : <div className="flex-1" />}
                          </div>
                          {/* Away Player */}
                          <div className="flex-1 flex items-center justify-end gap-3">
                            {pB ? (
                              <>
                                <span className="font-semibold text-sm text-right truncate text-dark-bg">
                                  {pB.position === 'GK' && <span className="text-dark-muted font-normal text-xs mr-1">(G)</span>} {pB.full_name}
                                </span>
                                <span className="w-5 text-center font-mono font-semibold text-sm">{pB.jersey_number}</span>
                              </>
                            ) : <div className="flex-1" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Substitutes Header */}
                  <div className="bg-surface-card border-y border-surface-border py-2 text-center text-xs font-black tracking-widest text-dark-muted uppercase">
                    SUBSTITUTES
                  </div>

                  <div className="flex flex-col">
                    {Array.from({ length: Math.max(
                      (lineupA?.players?.filter((p: any) => !p.is_starting) || []).length,
                      (lineupB?.players?.filter((p: any) => !p.is_starting) || []).length
                    )}).map((_, i) => {
                      const pA = lineupA?.players?.filter((p: any) => !p.is_starting)[i];
                      const pB = lineupB?.players?.filter((p: any) => !p.is_starting)[i];
                      return (
                        <div key={`sub-${i}`} className={`flex justify-between items-center py-2.5 px-4 ${i % 2 === 0 ? 'bg-surface-bg' : 'bg-surface-card'}`}>
                          {/* Home Player */}
                          <div className="flex-1 flex items-center justify-start gap-3">
                            {pA ? (
                              <>
                                <span className="w-5 text-center font-mono font-semibold text-sm">{pA.jersey_number}</span>
                                <span className="font-semibold text-sm truncate text-dark-muted">
                                  {pA.full_name} {pA.position === 'GK' && <span className="text-dark-muted/70 font-normal text-xs ml-1">(G)</span>}
                                </span>
                              </>
                            ) : <div className="flex-1" />}
                          </div>
                          {/* Away Player */}
                          <div className="flex-1 flex items-center justify-end gap-3">
                            {pB ? (
                              <>
                                <span className="font-semibold text-sm text-right truncate text-dark-muted">
                                  {pB.position === 'GK' && <span className="text-dark-muted/70 font-normal text-xs mr-1">(G)</span>} {pB.full_name}
                                </span>
                                <span className="w-5 text-center font-mono font-semibold text-sm">{pB.jersey_number}</span>
                              </>
                            ) : <div className="flex-1" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
