import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, getAuthToken } from '../lib/api';
import { Plus, Lock, Discovery } from 'react-iconly';
import { pageVariants, staggerContainer, fadeUp } from '../lib/animations';
import { BracketUI } from './BracketUI';

export const DrawBracketPage: React.FC = () => {
  const [draw, setDraw] = useState<any[]>([]);
  const [bracket, setBracket] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const token = getAuthToken();



  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8 pb-12">
      
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
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-12">
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
                  { id: '2', name: 'TANZANIA', country: 'Tanzania', logo_url: null, pot: 'POT_2' },
                  { id: '1', name: 'MULSU', country: 'Liberia', logo_url: null, pot: 'POT_1' },
                  { id: '3', name: 'SOUTH SUDAN', country: 'South Sudan', logo_url: null, pot: 'POT_3' },
                  { id: '4', name: 'NIGERIA', country: 'Nigeria', logo_url: null, pot: 'POT_4' },
                ]
              },
              {
                groupName: 'GROUP B',
                teams: [
                  { id: '6', name: 'ESWATINI', country: 'Eswatini', logo_url: null, pot: 'POT_2' },
                  { id: '5', name: 'ZIMBABWE', country: 'Zimbabwe', logo_url: null, pot: 'POT_1' },
                  { id: '7', name: 'UGANDA', country: 'Uganda', logo_url: null, pot: 'POT_3' },
                ]
              }
            ];

            return (
              <div className="grid grid-cols-1 gap-12">
                {displayDraw.map((group) => {
                  let t1 = group.teams[0] || {};
                  let t2 = group.teams[1] || {};
                  let t3 = group.teams[2] || {};
                  let t4 = group.teams[3] || {};

                  const groupTitle = group.group?.name || group.groupName;

                  if (groupTitle === 'Group A') {
                    const findTeam = (str: string) => group.teams.find((t: any) => t?.name?.toLowerCase().includes(str.toLowerCase()));
                    t1 = findTeam('ssd') || findTeam('south sudan') || t1;
                    t2 = findTeam('tanzania') || t2;
                    t3 = findTeam('eagle') || findTeam('nigeria') || t3;
                    t4 = findTeam('mulsu') || t4;
                  } else if (groupTitle === 'Group B') {
                    const findTeam = (str: string) => group.teams.find((t: any) => t?.name?.toLowerCase().includes(str.toLowerCase()));
                    t1 = findTeam('usamu') || t1;
                    t2 = findTeam('eswatini') || t2;
                    t3 = findTeam('zimbabwe') || t3;
                    t4 = group.teams[3] || {};
                  }

                  const groupBracket = {
                    semiFinals: [
                      { team_a_name: t1.name, team_a_country: t1.country, team_a_logo: t1.logo_url, team_b_name: t2.name, team_b_country: t2.country, team_b_logo: t2.logo_url },
                      { team_a_name: t3.name, team_a_country: t3.country, team_a_logo: t3.logo_url, team_b_name: t4.name, team_b_country: t4.country, team_b_logo: t4.logo_url }
                    ],
                    final: {}
                  };

                  return (
                    <BracketUI key={groupTitle} displayBracket={groupBracket} title={groupTitle} type="group" />
                  );
                })}
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

            return <BracketUI displayBracket={displayBracket} />;
          })()}
        </div>
      </motion.div>
      )}
    </motion.div>
  );
};
