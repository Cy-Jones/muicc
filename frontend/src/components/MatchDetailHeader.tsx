import React from 'react';
import { CloseSquare, Calendar, Location } from 'react-iconly';

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

interface MatchDetailHeaderProps {
  matchData: any;
  onClose: () => void;
}

export const MatchDetailHeader: React.FC<MatchDetailHeaderProps> = ({ matchData, onClose }) => {
  return (
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
  );
};
