import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';

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

export const BracketUI = ({ displayBracket, title, type = 'knockout' }: { displayBracket: any, title?: string, type?: 'knockout' | 'group' }) => (
  <motion.div variants={fadeUp} className="w-full bg-surface-bg rounded-xl overflow-hidden relative border border-surface-border shadow-lg mb-8">
    {title && (
      <div className="bg-surface-bg px-4 py-3 border-b border-surface-border flex justify-center items-center">
        <h3 className="font-heading text-lg font-black text-brand uppercase tracking-tight">{title}</h3>
      </div>
    )}
    <div className="relative p-4 md:p-10 flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]">
      
      {/* Labels Header */}
      {type === 'knockout' && (
        <div className="w-full flex justify-between px-4 md:px-12 absolute top-6">
          <div className="text-dark-muted font-bold tracking-widest text-[10px] md:text-xs border-b border-surface-border pb-1">SEMI-FINAL</div>
          <div className="text-dark-muted font-bold tracking-widest text-[10px] md:text-xs border-b border-surface-border pb-1">SEMI-FINAL</div>
        </div>
      )}

      <div className="flex h-[240px] md:h-[320px] w-full max-w-5xl mx-auto mt-8 md:mt-12">
        
        {/* LEFT SEMI-FINAL */}
        <div className="flex-1 flex">
          <div className="flex flex-col justify-between z-10 shrink-0">
            {/* Top Team */}
            <div className="flex flex-col items-start relative">
              <div className="flex items-center gap-2 md:gap-4 flex-row">
                <div className="w-[60px] h-10 md:w-24 md:h-16 flex items-center justify-center shrink-0 bg-surface-bg rounded-md border-[1.5px] md:border-2 border-surface-border shadow-sm overflow-hidden">
                  {getTeamFlag(displayBracket.semiFinals[0]?.team_a_name || 'TBD', displayBracket.semiFinals[0]?.team_a_country, displayBracket.semiFinals[0]?.team_a_logo, "w-full h-full object-cover")}
                </div>
                <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                  {displayBracket.semiFinals[0]?.score_a ?? '-'}
                </div>
              </div>
              <div className="w-[60px] md:w-24 relative h-3 md:h-4 mt-1">
                <div className="absolute left-1/2 -translate-x-1/2 w-[100px] md:w-[140px] text-center text-dark-bg text-[8px] md:text-xs font-bold uppercase tracking-widest truncate">
                  {displayBracket.semiFinals[0]?.team_a_name || 'TBD'}
                </div>
              </div>
            </div>
            
            {/* Bottom Team */}
            <div className="flex flex-col items-start relative">
              <div className="flex items-center gap-2 md:gap-4 flex-row">
                <div className="w-[60px] h-10 md:w-24 md:h-16 flex items-center justify-center shrink-0 bg-surface-bg rounded-md border-[1.5px] md:border-2 border-surface-border shadow-sm overflow-hidden">
                  {getTeamFlag(displayBracket.semiFinals[0]?.team_b_name || 'TBD', displayBracket.semiFinals[0]?.team_b_country, displayBracket.semiFinals[0]?.team_b_logo, "w-full h-full object-cover")}
                </div>
                <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                  {displayBracket.semiFinals[0]?.score_b ?? '-'}
                </div>
              </div>
              <div className="w-[60px] md:w-24 relative h-3 md:h-4 mt-1">
                <div className="absolute left-1/2 -translate-x-1/2 w-[100px] md:w-[140px] text-center text-dark-bg text-[8px] md:text-xs font-bold uppercase tracking-widest truncate">
                  {displayBracket.semiFinals[0]?.team_b_name || 'TBD'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bracket Lines Left */}
          <div className="flex-1 relative min-w-[20px] ml-2 md:ml-4 mr-[80px] md:mr-[140px]">
             <div className="absolute left-0 top-[20px] md:top-[32px] bottom-[36px] md:bottom-[52px] right-0 border-r-2 border-t-2 border-b-2 border-surface-border rounded-r-lg"></div>
             <div className="absolute right-[-20px] md:right-[-40px] top-1/2 w-[20px] md:w-[40px] border-t-2 border-surface-border"></div>
             
             {/* Finalist Logo Slot */}
             <div className="absolute right-[-20px] md:right-[-40px] translate-x-[100%] top-1/2 -translate-y-1/2 z-10">
               <div className="w-[60px] h-10 md:w-24 md:h-16 flex items-center justify-center shrink-0 bg-surface-bg rounded-md border-[1.5px] md:border-2 border-surface-border shadow-sm overflow-hidden relative">
                 {getTeamFlag(displayBracket.final?.team_a_name || 'TBD', displayBracket.final?.team_a_country, displayBracket.final?.team_a_logo, "w-full h-full object-cover")}
               </div>
               <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-1 text-dark-bg text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center w-24 truncate">
                 {displayBracket.final?.team_a_name || 'TBD'}
               </div>
             </div>
          </div>
        </div>

        {/* CENTER TROPHY */}
        <div className="w-[100px] md:w-[220px] flex flex-col items-center justify-center z-20 shrink-0">
          <img src="/logo.png" alt="Trophy" className="w-16 h-16 md:w-36 md:h-36 object-contain drop-shadow-md" />
          {type === 'knockout' ? (
            <>
              <h2 className="text-dark-bg font-black text-xl md:text-4xl mt-3 md:mt-4 tracking-tighter">FINAL</h2>
              <p className="text-dark-muted text-[7px] md:text-xs tracking-widest mt-1 md:mt-2 uppercase text-center font-bold">
                GRAND FINALE<br/>
                <span className="text-brand">TO BE DECIDED</span>
              </p>
            </>
          ) : (
            <h2 className="text-dark-bg font-black text-lg md:text-2xl mt-3 md:mt-4 tracking-tighter">{title}</h2>
          )}

        </div>

        {/* RIGHT SEMI-FINAL */}
        <div className="flex-1 flex flex-row-reverse">
          <div className="flex flex-col justify-between z-10 shrink-0">
            {/* Top Team */}
            <div className="flex flex-col items-end relative">
              <div className="flex items-center gap-2 md:gap-4 flex-row-reverse">
                <div className="w-[60px] h-10 md:w-24 md:h-16 flex items-center justify-center shrink-0 bg-surface-bg rounded-md border-[1.5px] md:border-2 border-surface-border shadow-sm overflow-hidden">
                  {getTeamFlag(displayBracket.semiFinals[1]?.team_a_name || 'TBD', displayBracket.semiFinals[1]?.team_a_country, displayBracket.semiFinals[1]?.team_a_logo, "w-full h-full object-cover")}
                </div>
                <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                  {displayBracket.semiFinals[1]?.score_a ?? '-'}
                </div>
              </div>
              <div className="w-[60px] md:w-24 relative h-3 md:h-4 mt-1">
                <div className="absolute left-1/2 -translate-x-1/2 w-[100px] md:w-[140px] text-center text-dark-bg text-[8px] md:text-xs font-bold uppercase tracking-widest truncate">
                  {displayBracket.semiFinals[1]?.team_a_name || 'TBD'}
                </div>
              </div>
            </div>
            
            {/* Bottom Team */}
            <div className="flex flex-col items-end relative">
              <div className="flex items-center gap-2 md:gap-4 flex-row-reverse">
                <div className="w-[60px] h-10 md:w-24 md:h-16 flex items-center justify-center shrink-0 bg-surface-bg rounded-md border-[1.5px] md:border-2 border-surface-border shadow-sm overflow-hidden">
                  {getTeamFlag(displayBracket.semiFinals[1]?.team_b_name || 'TBD', displayBracket.semiFinals[1]?.team_b_country, displayBracket.semiFinals[1]?.team_b_logo, "w-full h-full object-cover")}
                </div>
                <div className="bg-surface-bg text-dark-bg font-mono font-bold text-sm md:text-xl w-7 h-9 md:w-10 md:h-12 flex items-center justify-center rounded border border-surface-border shadow-inner">
                  {displayBracket.semiFinals[1]?.score_b ?? '-'}
                </div>
              </div>
              <div className="w-[60px] md:w-24 relative h-3 md:h-4 mt-1">
                <div className="absolute left-1/2 -translate-x-1/2 w-[100px] md:w-[140px] text-center text-dark-bg text-[8px] md:text-xs font-bold uppercase tracking-widest truncate">
                  {displayBracket.semiFinals[1]?.team_b_name || 'TBD'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bracket Lines Right */}
          <div className="flex-1 relative min-w-[20px] mr-2 md:mr-4 ml-[80px] md:ml-[140px]">
             <div className="absolute right-0 top-[20px] md:top-[32px] bottom-[36px] md:bottom-[52px] left-0 border-l-2 border-t-2 border-b-2 border-surface-border rounded-l-lg"></div>
             <div className="absolute left-[-20px] md:left-[-40px] top-1/2 w-[20px] md:w-[40px] border-t-2 border-surface-border"></div>
             
             <div className="absolute left-[-20px] md:left-[-40px] -translate-x-[100%] top-1/2 -translate-y-1/2 z-10">
               <div className="w-[60px] h-10 md:w-24 md:h-16 flex items-center justify-center shrink-0 bg-surface-bg rounded-md border-[1.5px] md:border-2 border-surface-border shadow-sm overflow-hidden relative">
                 {getTeamFlag(displayBracket.final?.team_b_name || 'TBD', displayBracket.final?.team_b_country, displayBracket.final?.team_b_logo, "w-full h-full object-cover")}
               </div>
               <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-1 text-dark-bg text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center w-24 truncate">
                 {displayBracket.final?.team_b_name || 'TBD'}
               </div>
             </div>
          </div>
        </div>
        
      </div>
    </div>
  </motion.div>
);
