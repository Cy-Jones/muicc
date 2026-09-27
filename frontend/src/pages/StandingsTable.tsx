import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';
import { getTeamFlagImage } from '../lib/flags';

interface StandingsTableProps {
  groupData: any;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ groupData }) => {
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
    <motion.div variants={fadeUp} className="data-card overflow-hidden">
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
          <div key={team.team_id} className={`grid grid-cols-12 gap-2 p-3 items-center border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors ${idx < 2 ? 'border-l-4 border-l-status-completed' : 'border-l-4 border-l-transparent'}`}>
            <div className="col-span-1 text-center text-xs font-bold text-dark-muted">{idx + 1}</div>
            <div className="col-span-5 flex items-center gap-2">
              {renderTeamFlag(team.team_name, team.team_country, team.team_logo, "w-5 h-5")}
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
    </motion.div>
  );
};
