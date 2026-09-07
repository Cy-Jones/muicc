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
    mozambique: '/images/flags/moz.png',
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-bg border border-surface-border text-dark-muted text-[10px] font-bold uppercase tracking-widest">
            <Discovery set="bold" className="w-3.5 h-3.5 text-brand" />
            10 NATIONS • 3 GROUPS • 8-TEAM KNOCKOUT
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

      {/* QUALIFICATION RULE BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="data-card p-4 space-y-1">
          <p className="font-bold text-dark-bg text-sm uppercase tracking-wide">Top 2 Qualifiers</p>
          <p className="text-dark-surface text-xs font-medium">1st and 2nd highest placed teams in Group A, B, and C automatically advance.</p>
        </div>
        <div className="data-card p-4 space-y-1">
          <p className="font-bold text-dark-bg text-sm uppercase tracking-wide">2 Best Losers</p>
          <p className="text-dark-surface text-xs font-medium">The 2 highest ranked 3rd-place teams (WC1 & WC2) fill the remaining 2 Quarter-Final spots.</p>
        </div>
        <div className="data-card p-4 space-y-1">
          <p className="font-bold text-dark-bg text-sm uppercase tracking-wide">8-Team Knockout</p>
          <p className="text-dark-surface text-xs font-medium">8 Teams battle in Quarter-Finals ➔ Semi-Finals ➔ Championship Final.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-dark-muted font-bold">Loading Draw Data...</div>
      ) : (
        <div className="space-y-12">
          
          {/* GROUPS */}
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-black text-dark-bg uppercase">
              Group Stage
            </h2>
            
            {draw.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {draw.map((group) => (
                  <div key={group.groupName} className="data-card overflow-hidden">
                    <div className="bg-surface-bg px-4 py-3 border-b border-surface-border flex justify-between items-center">
                      <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-tight">{group.groupName}</h3>
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
                              {t.pot.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="data-card p-12 text-center text-dark-muted font-medium border-dashed border-surface-border">
                Official draw has not been conducted yet.
              </div>
            )}
          </div>

          {/* KNOCKOUT BRACKET */}
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-black text-dark-bg uppercase">
              Knockout Stage
            </h2>
            
            {bracket && bracket.quarterFinals?.length > 0 ? (
              <div className="data-card p-6 overflow-x-auto bg-surface-bg/50">
                <div className="min-w-[800px] flex justify-between items-stretch">
                  
                  {/* QF */}
                  <div className="flex flex-col justify-around w-64 gap-8">
                    <div className="text-center text-xs font-bold text-dark-muted uppercase tracking-widest mb-4">Quarter-Finals</div>
                    {bracket.quarterFinals.map((match: any, i: number) => (
                      <div key={`qf-${i}`} className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center px-3 py-1 bg-surface-bg border-b border-surface-border text-[10px] font-bold text-dark-muted uppercase">
                          <span>Match {i + 1}</span>
                        </div>
                        <div className="p-2 space-y-1">
                          <div className="flex justify-between items-center text-sm font-bold text-dark-bg">
                            <span className="truncate pr-2">{match.team_a_name || 'TBD'}</span>
                            <span className="text-brand">{match.score_a ?? '-'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-dark-bg">
                            <span className="truncate pr-2">{match.team_b_name || 'TBD'}</span>
                            <span className="text-brand">{match.score_b ?? '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Connectors (Simplified) */}
                  <div className="flex flex-col justify-around w-16 text-center items-center">
                    <div className="w-full h-[2px] bg-surface-border mt-12" />
                    <div className="w-full h-[2px] bg-surface-border mt-24" />
                  </div>

                  {/* SF */}
                  <div className="flex flex-col justify-around w-64 gap-16">
                    <div className="text-center text-xs font-bold text-dark-muted uppercase tracking-widest mb-4">Semi-Finals</div>
                    {bracket.semiFinals.map((match: any, i: number) => (
                      <div key={`sf-${i}`} className="bg-surface-card rounded border border-surface-border shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center px-3 py-1 bg-surface-bg border-b border-surface-border text-[10px] font-bold text-dark-muted uppercase">
                          <span>Semi {i + 1}</span>
                        </div>
                        <div className="p-2 space-y-1">
                          <div className="flex justify-between items-center text-sm font-bold text-dark-bg">
                            <span className="truncate pr-2">{match.team_a_name || 'TBD'}</span>
                            <span className="text-brand">{match.score_a ?? '-'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-dark-bg">
                            <span className="truncate pr-2">{match.team_b_name || 'TBD'}</span>
                            <span className="text-brand">{match.score_b ?? '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Connectors (Simplified) */}
                  <div className="flex flex-col justify-around w-16 text-center items-center">
                    <div className="w-full h-[2px] bg-surface-border mt-32" />
                  </div>

                  {/* Final */}
                  <div className="flex flex-col justify-center w-72">
                    <div className="text-center text-xs font-bold text-dark-muted uppercase tracking-widest mb-4">Championship Final</div>
                    <div className="bg-surface-card rounded border border-brand shadow-md overflow-hidden relative">
                      <div className="flex justify-between items-center px-3 py-1 bg-brand/5 border-b border-brand/20 text-[10px] font-bold text-brand-dark uppercase">
                        <span>Grand Final</span>
                      </div>
                      <div className="p-3 space-y-2 relative z-10">
                        <div className="flex justify-between items-center text-base font-black text-dark-bg">
                          <span className="truncate pr-2">{bracket.final?.team_a_name || 'TBD'}</span>
                          <span className="text-brand">{bracket.final?.score_a ?? '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-base font-black text-dark-bg">
                          <span className="truncate pr-2">{bracket.final?.team_b_name || 'TBD'}</span>
                          <span className="text-brand">{bracket.final?.score_b ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="data-card p-12 text-center text-dark-muted font-medium border-dashed border-surface-border">
                Knockout bracket will be generated automatically once the Group Stage concludes.
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
