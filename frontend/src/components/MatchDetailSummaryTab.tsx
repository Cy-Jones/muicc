import React from 'react';
import { Calendar, TimeCircle, Location } from 'react-iconly';

interface MatchDetailSummaryTabProps {
  matchData: any;
  events: any[];
}

export const MatchDetailSummaryTab: React.FC<MatchDetailSummaryTabProps> = ({ matchData, events }) => {
  return (
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
                          <span className="text-sm font-bold text-dark-bg">{ev.player_name || ev.player_id}{ev.is_own_goal ? ' (OG)' : ''}</span>
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
                          <span className="text-sm font-bold text-dark-bg">{ev.player_name || ev.player_id}{ev.is_own_goal ? ' (OG)' : ''}</span>
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

      {/* Penalty Shootout Section (renders when a shootout occurred) */}
      {(matchData.penalty_a !== null && matchData.penalty_a !== undefined && matchData.penalty_b !== null && matchData.penalty_b !== undefined) && (() => {
        let shootoutList: any[] = [];
        try {
          if (matchData.penalty_details) {
            const parsed = typeof matchData.penalty_details === 'string' ? JSON.parse(matchData.penalty_details) : matchData.penalty_details;
            if (Array.isArray(parsed)) shootoutList = parsed;
            else if (Array.isArray(parsed?.rounds)) shootoutList = parsed.rounds;
            else if (Array.isArray(parsed?.kicks)) shootoutList = parsed.kicks;
          }
        } catch (e) {
          console.error('Error parsing penalty_details:', e);
        }

        return (
          <div className="bg-surface-bg rounded-xl overflow-hidden border border-surface-border shadow-sm">
            <div className="bg-surface-card py-2.5 px-4 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-heading text-xs font-black tracking-widest text-dark-muted uppercase flex items-center gap-2">
                <span>🎯 Penalty Shootout</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-dark-muted">{matchData.team_a_name}</span>
                <span className="font-heading text-sm font-black text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
                  {matchData.penalty_a} - {matchData.penalty_b}
                </span>
                <span className="text-[11px] font-bold text-dark-muted">{matchData.team_b_name}</span>
              </div>
            </div>

            {shootoutList.length > 0 ? (
              <div className="flex flex-col divide-y divide-surface-border">
                {shootoutList.map((item: any, idx: number) => {
                  const roundNum = item.round || idx + 1;
                  return (
                    <div key={idx} className="flex items-center gap-2 sm:gap-4 p-3 hover:bg-surface-card/40 transition-colors">
                      {/* Team A penalty kick */}
                      <div className="flex-1 flex items-center justify-end">
                        {item.team_a && (
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-xs sm:text-sm font-bold text-dark-bg">{item.team_a.player_name}</span>
                            {item.team_a.scored ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-black border border-emerald-500/30" title="Scored">⚽</span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center text-xs font-black border border-rose-500/30" title="Missed">✕</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Round badge */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-card border border-surface-border flex items-center justify-center font-black text-[11px] sm:text-xs text-dark-muted shrink-0">
                        {roundNum}
                      </div>

                      {/* Team B penalty kick */}
                      <div className="flex-1 flex items-center justify-start">
                        {item.team_b && (
                          <div className="flex items-center gap-2 text-left">
                            {item.team_b.scored ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-black border border-emerald-500/30" title="Scored">⚽</span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center text-xs font-black border border-rose-500/30" title="Missed">✕</span>
                            )}
                            <span className="text-xs sm:text-sm font-bold text-dark-bg">{item.team_b.player_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs sm:text-sm font-medium text-dark-muted">
                Match concluded with a penalty shootout: <strong className="text-dark-bg">{matchData.team_a_name}</strong> won <strong className="text-brand">{matchData.penalty_a} - {matchData.penalty_b}</strong> on penalties.
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
