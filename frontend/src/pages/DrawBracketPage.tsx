import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, getAuthToken } from '../lib/api';
import { Plus, Lock, Discovery } from 'react-iconly';

export const DrawBracketPage: React.FC = () => {
  const [draw, setDraw] = useState<any[]>([]);
  const [bracket, setBracket] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const token = getAuthToken();

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

  async function loadDraw() {
    setLoading(true);
    try {
      const res = await api.getDraw();
      setDraw(res.draw || []);
      setBracket(res.knockoutBracket || null);
      setIsLocked(res.isLocked || false);
    } catch (err) {
      console.error('Error loading tournament draw:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDraw();
  }, []);

  async function handleGenerateRegionalDraw() {
    if (!token) {
      alert('Please log into Admin Portal to generate official regional tournament draw.');
      return;
    }

    setGenerating(true);
    setMessage(null);
    try {
      const res = await api.adminGenerateDraw('REGIONAL_SEEDED');
      setMessage(res.message || 'Regional seeded draw generated successfully!');
      await loadDraw();
    } catch (err: any) {
      setMessage(err.message || 'Error generating draw.');
    } finally {
      setGenerating(false);
    }
  }

  const getTeamFlag = (teamName: string, countryName?: string, logoUrl?: string, customClassName?: string) => {
    let src = logoUrl;
    if (!src) {
      const key = Object.keys(FLAG_MAP).find(k => 
        (countryName && countryName.toLowerCase().includes(k)) ||
        (teamName && teamName.toLowerCase().includes(k))
      );
      if (key) src = FLAG_MAP[key];
    }
    if (src) {
      return <img src={src} alt={teamName} className={customClassName || "w-5 h-3.5 object-cover rounded-sm border border-surface-border shadow-sm"} />;
    }
    return <span className="text-[10px] uppercase font-bold text-dark-muted">{teamName.substring(0,3)}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-border">
        <div className="space-y-3">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-dark-bg uppercase tracking-tight">
              Tournament Bracket
            </h1>
            <p className="text-sm text-dark-surface max-w-3xl font-medium mt-1">
              Official group draw and knockout bracket progression.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-dark-muted border border-surface-border bg-dark-bg/50 px-3 py-1.5 rounded-md w-fit">
            <Discovery set="bold" className="w-4 h-4 text-brand" />
            7 NATIONS • 2 GROUPS • 4-TEAM KNOCKOUT
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 shrink-0">


          {isLocked && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-bg border border-surface-border text-dark-muted text-xs font-bold uppercase tracking-widest">
              <Lock set="bold" className="w-3.5 h-3.5" /> OFFICIAL DRAW LOCKED
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-brand/10 border border-brand/20 text-brand-dark text-sm font-bold text-center">
          {message}
        </div>
      )}

          {loading ? (
        <div className="py-20 text-center text-dark-muted font-bold">Loading Draw Data...</div>
      ) : (
        <div className="space-y-12">
          {/* GROUPS */}
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-black text-dark-bg uppercase">
              Group Stage
            </h2>
            
            {(() => {
              const displayDraw = draw.length > 0 ? draw : [
                {
                  groupName: 'GROUP A',
                  teams: [
                    { id: '1', name: 'LIBERIA', country: 'Liberia', logo_url: null, pot: 'POT_1' },
                    { id: '2', name: 'TANZANIA', country: 'Tanzania', logo_url: null, pot: 'POT_2' },
                    { id: '3', name: 'SOUTH SUDAN', country: 'South Sudan', logo_url: null, pot: 'POT_3' },
                    { id: '4', name: 'NIGERIA', country: 'Nigeria', logo_url: null, pot: 'POT_4' },
                  ]
                },
                {
                  groupName: 'GROUP B',
                  teams: [
                    { id: '5', name: 'ZIMBABWE', country: 'Zimbabwe', logo_url: null, pot: 'POT_1' },
                    { id: '6', name: 'ESWATINI', country: 'Eswatini', logo_url: null, pot: 'POT_2' },
                    { id: '7', name: 'UGANDA', country: 'Uganda', logo_url: null, pot: 'POT_3' },
                  ]
                }
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayDraw.map((group) => (
                    <div key={group.groupName} className="data-card overflow-hidden">
                      <div className="bg-surface-bg px-4 py-3 border-b border-surface-border flex justify-between items-center">
                        <h3 className="font-heading text-lg font-black text-brand uppercase tracking-tight">{group.groupName}</h3>
                        <span className="text-[10px] font-bold text-dark-muted uppercase tracking-widest">{group.teams.length} TEAMS</span>
                      </div>
                      <div className="p-0 bg-surface-card">
                        {group.teams.map((t: any, index: number) => (
                          <div key={t.id} className="flex items-center gap-3 p-3 border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors">
                            <span className="text-xs font-bold text-dark-muted w-4">{index + 1}</span>
                            {getTeamFlag(t.name, t.country, t.logo_url)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-dark-bg truncate">{t.name}</p>
                              <p className="text-[10px] text-dark-surface uppercase font-bold">{t.country || 'Unknown'}</p>
                            </div>
                            {t.pot && (
                              <span className="text-[10px] font-bold bg-surface-bg px-2 py-0.5 rounded text-dark-muted border border-surface-border">
                                {t.pot.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* KNOCKOUT BRACKET */}
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-black text-dark-bg uppercase">
              Knockout Stage
            </h2>
            
            {(() => {
              const displayBracket = bracket || {
                semiFinals: [{}, {}],
                final: {}
              };

              return (
                <div className="w-full bg-surface-bg rounded-xl overflow-hidden relative border border-surface-border shadow-lg">
                  <div className="relative p-4 md:p-10 flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]">
                    
                    {/* Labels Header */}
                    <div className="w-full flex justify-between px-4 md:px-12 absolute top-6">
                      <div className="text-dark-muted font-bold tracking-widest text-[10px] md:text-xs border-b border-surface-border pb-1">SEMI-FINAL</div>
                      <div className="text-dark-muted font-bold tracking-widest text-[10px] md:text-xs border-b border-surface-border pb-1">SEMI-FINAL</div>
                    </div>

                    <div className="flex h-[240px] md:h-[320px] w-full max-w-5xl mx-auto mt-8 md:mt-12">
                      
                      {/* LEFT SEMI-FINAL */}
                      <div className="flex-1 flex">
                        <div className="flex flex-col justify-between z-10 shrink-0">
                          {/* Top Team */}
                          <div className="flex flex-col items-start relative">
                            <div className="flex items-center gap-2 md:gap-4 flex-row">
                              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden border-[1.5px] md:border-2 border-surface-border shadow-sm bg-surface-bg shrink-0">
                                {getTeamFlag(displayBracket.semiFinals[0]?.team_a_name || 'TBD', displayBracket.semiFinals[0]?.team_a_country, undefined, "w-full h-full object-cover")}
                              </div>
                              <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                                {displayBracket.semiFinals[0]?.score_a ?? '-'}
                              </div>
                            </div>
                            <div className="text-dark-bg text-[8px] md:text-xs font-bold uppercase mt-1 tracking-widest ml-1 max-w-[70px] md:max-w-[120px] truncate">
                              {displayBracket.semiFinals[0]?.team_a_name || 'TBD'}
                            </div>
                          </div>
                          
                          {/* Bottom Team */}
                          <div className="flex flex-col items-start relative">
                            <div className="flex items-center gap-2 md:gap-4 flex-row">
                              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden border-[1.5px] md:border-2 border-surface-border shadow-sm bg-surface-bg shrink-0">
                                {getTeamFlag(displayBracket.semiFinals[0]?.team_b_name || 'TBD', displayBracket.semiFinals[0]?.team_b_country, undefined, "w-full h-full object-cover")}
                              </div>
                              <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                                {displayBracket.semiFinals[0]?.score_b ?? '-'}
                              </div>
                            </div>
                            <div className="text-dark-bg text-[8px] md:text-xs font-bold uppercase mt-1 tracking-widest ml-1 max-w-[70px] md:max-w-[120px] truncate">
                              {displayBracket.semiFinals[0]?.team_b_name || 'TBD'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bracket Lines Left */}
                        <div className="flex-1 relative min-w-[20px] mx-2 md:mx-4">
                           <div className="absolute left-0 top-[20px] md:top-[32px] bottom-[20px] md:bottom-[32px] right-0 border-r-2 border-t-2 border-b-2 border-surface-border rounded-r-lg"></div>
                           <div className="absolute right-[-10px] md:right-[-20px] top-1/2 w-[10px] md:w-[20px] border-t-2 border-surface-border"></div>
                           
                           {/* Finalist Logo Slot */}
                           <div className="absolute right-[-20px] md:right-[-28px] top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                             <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-[1.5px] md:border-2 border-surface-border bg-surface-bg flex items-center justify-center overflow-hidden shadow-sm">
                               {getTeamFlag(displayBracket.final?.team_a_name || 'TBD', displayBracket.final?.team_a_country, undefined, "w-full h-full object-cover")}
                             </div>
                             <div className="absolute top-[100%] pt-1 text-dark-bg text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center w-24 truncate">
                               {displayBracket.final?.team_a_name || 'TBD'}
                             </div>
                           </div>
                        </div>
                      </div>

                      {/* CENTER TROPHY */}
                      <div className="w-[100px] md:w-[220px] flex flex-col items-center justify-center z-20 shrink-0">
                        <img src="/logo.png" alt="Trophy" className="w-16 h-16 md:w-36 md:h-36 object-contain drop-shadow-md" />
                        <h2 className="text-dark-bg font-black text-xl md:text-4xl mt-3 md:mt-4 tracking-tighter">FINAL</h2>
                        <p className="text-dark-muted text-[7px] md:text-xs tracking-widest mt-1 md:mt-2 uppercase text-center font-bold">
                          GRAND FINALE<br/>
                          <span className="text-brand">TO BE DECIDED</span>
                        </p>
                      </div>

                      {/* RIGHT SEMI-FINAL */}
                      <div className="flex-1 flex flex-row-reverse">
                        <div className="flex flex-col justify-between z-10 shrink-0">
                          {/* Top Team */}
                          <div className="flex flex-col items-end relative">
                            <div className="flex items-center gap-2 md:gap-4 flex-row-reverse">
                              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden border-[1.5px] md:border-2 border-surface-border shadow-sm bg-surface-bg shrink-0">
                                {getTeamFlag(displayBracket.semiFinals[1]?.team_a_name || 'TBD', displayBracket.semiFinals[1]?.team_a_country, undefined, "w-full h-full object-cover")}
                              </div>
                              <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                                {displayBracket.semiFinals[1]?.score_a ?? '-'}
                              </div>
                            </div>
                            <div className="text-dark-bg text-[8px] md:text-xs font-bold uppercase mt-1 tracking-widest mr-1 max-w-[70px] md:max-w-[120px] text-right truncate">
                              {displayBracket.semiFinals[1]?.team_a_name || 'TBD'}
                            </div>
                          </div>
                          
                          {/* Bottom Team */}
                          <div className="flex flex-col items-end relative">
                            <div className="flex items-center gap-2 md:gap-4 flex-row-reverse">
                              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden border-[1.5px] md:border-2 border-surface-border shadow-sm bg-surface-bg shrink-0">
                                {getTeamFlag(displayBracket.semiFinals[1]?.team_b_name || 'TBD', displayBracket.semiFinals[1]?.team_b_country, undefined, "w-full h-full object-cover")}
                              </div>
                              <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                                {displayBracket.semiFinals[1]?.score_b ?? '-'}
                              </div>
                            </div>
                            <div className="text-dark-bg text-[8px] md:text-xs font-bold uppercase mt-1 tracking-widest mr-1 max-w-[70px] md:max-w-[120px] text-right truncate">
                              {displayBracket.semiFinals[1]?.team_b_name || 'TBD'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bracket Lines Right */}
                        <div className="flex-1 relative min-w-[20px] mx-2 md:mx-4">
                           <div className="absolute right-0 top-[20px] md:top-[32px] bottom-[20px] md:bottom-[32px] left-0 border-l-2 border-t-2 border-b-2 border-surface-border rounded-l-lg"></div>
                           <div className="absolute left-[-10px] md:left-[-20px] top-1/2 w-[10px] md:w-[20px] border-t-2 border-surface-border"></div>
                           
                           <div className="absolute left-[-20px] md:left-[-28px] top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                             <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-[1.5px] md:border-2 border-surface-border bg-surface-bg flex items-center justify-center overflow-hidden shadow-sm">
                               {getTeamFlag(displayBracket.final?.team_b_name || 'TBD', displayBracket.final?.team_b_country, undefined, "w-full h-full object-cover")}
                             </div>
                             <div className="absolute top-[100%] pt-1 text-dark-bg text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center w-24 truncate">
                               {displayBracket.final?.team_b_name || 'TBD'}
                             </div>
                           </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </motion.div>
  );
};
