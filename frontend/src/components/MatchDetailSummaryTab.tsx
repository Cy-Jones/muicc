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
                          <span className="text-sm font-bold text-dark-bg">{ev.player_name || ev.player_id}</span>
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
                          <span className="text-sm font-bold text-dark-bg">{ev.player_name || ev.player_id}</span>
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
  );
};
