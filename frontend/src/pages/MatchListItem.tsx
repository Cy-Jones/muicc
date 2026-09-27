import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TickSquare, TimeCircle } from 'react-iconly';
import { getMatchLiveClock } from '../lib/liveClock';
import { getTeamFlagImage } from '../lib/flags';
import { fadeUp } from '../lib/animations';

interface MatchListItemProps {
  match: any;
  onClick: () => void;
}

export const MatchListItem: React.FC<MatchListItemProps> = ({ match: m, onClick }) => {
  const renderTeamFlag = (teamName: string, countryName?: string, logoUrl?: string, sizeClass: string = "w-8 h-8") => {
    let flagSrc = logoUrl;
    if (!flagSrc) {
      flagSrc = getTeamFlagImage(countryName, teamName) || undefined;
    }
    
    if (flagSrc) {
      return <img src={flagSrc} alt={teamName} className={`${sizeClass} object-contain`} />;
    }
    return (
      <div className={`${sizeClass} rounded bg-surface-bg border border-surface-border flex items-center justify-center`}>
        <span className="text-[10px] text-dark-muted font-bold">{teamName.substring(0,3).toUpperCase()}</span>
      </div>
    );
  };

  return (
    <motion.div variants={fadeUp} onClick={onClick} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-surface-hover transition-colors gap-4 cursor-pointer">
      {/* Date/Status Info */}
      <div className="flex sm:flex-col items-center sm:items-start justify-between sm:w-1/6 text-xs text-dark-muted font-bold">
        <span className="sm:hidden uppercase tracking-wider text-dark-bg bg-surface-bg px-2 py-1 rounded border border-surface-border">{m.stage ? m.stage.replace(/_/g, ' ') : 'Group'}</span>
        <div className="flex items-center gap-1.5">
          <Calendar set="bold" className="w-3.5 h-3.5" />
          <span>{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
        <span className="hidden sm:inline-block mt-1 uppercase tracking-wider">{m.stage ? m.stage.replace(/_/g, ' ') : 'Group Stage'}</span>
      </div>

      {/* Main Match Score Area */}
      <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8">
        {/* Home Team */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-end gap-2 sm:gap-3 text-center sm:text-right">
          <span className="text-sm font-bold text-dark-bg order-2 sm:order-1">{m.team_a_name}</span>
          <div className="order-1 sm:order-2">
            {renderTeamFlag(m.team_a_name, m.team_a_country, m.team_a_logo, "w-8 h-8")}
          </div>
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
                <span className="badge badge-live mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"/> {getMatchLiveClock(m).display}</span>
              ) : (
                <span className="badge badge-completed mt-1 flex items-center gap-1"><TickSquare set="bold" className="w-3 h-3"/> Full Time</span>
              )}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-start gap-2 sm:gap-3 text-center sm:text-left">
          {renderTeamFlag(m.team_b_name, m.team_b_country, m.team_b_logo, "w-8 h-8")}
          <span className="text-sm font-bold text-dark-bg">{m.team_b_name}</span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="hidden sm:flex sm:w-1/6 flex-col items-end justify-center text-xs text-dark-muted font-bold">
        {m.venue && <span>{m.venue}</span>}
        {m.group_name && <span className="uppercase tracking-wider mt-1">{m.group_name}</span>}
      </div>
    </motion.div>
  );
};
