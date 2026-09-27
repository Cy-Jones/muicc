import React from 'react';
import { Search, TwoUsers, ShieldDone } from 'react-iconly';
import { PlayerDraft } from './TeamRegistrationPage';

interface TeamRegistrationSidebarProps {
  players: PlayerDraft[];
  searchRef: string;
  setSearchRef: (val: string) => void;
  handleLookup: (e: React.FormEvent) => void;
  searching: boolean;
  lookupError: string;
  lookupResult: any;
}

export const TeamRegistrationSidebar: React.FC<TeamRegistrationSidebarProps> = ({
  players,
  searchRef,
  setSearchRef,
  handleLookup,
  searching,
  lookupError,
  lookupResult
}) => {
  return (
    <>
      <div className="glass-card p-6 border-gold/30 space-y-5">
        <h3 className="font-heading text-lg font-black text-dark-bg flex items-center gap-2 uppercase tracking-widest border-b border-dark-border pb-3">
          <Search set="bold" className="w-5 h-5 text-gold" /> Status Check
        </h3>
        <p className="text-xs text-dark-muted font-medium">Enter your reference code to check review progress.</p>

        <form onSubmit={handleLookup} className="space-y-4">
          <input type="text" required value={searchRef} onChange={(e) => setSearchRef(e.target.value)} placeholder="MIUCC-..." className="input-field font-mono uppercase tracking-widest text-center" />
          <button type="submit" disabled={searching} className="btn-outline w-full text-xs py-3">
            {searching ? 'Checking...' : 'Check Status'}
          </button>
        </form>

        {lookupError && <p className="text-[10px] text-status-error font-black uppercase tracking-widest bg-status-error/10 p-3 rounded-lg border border-status-error/30 text-center">{lookupError}</p>}

        {lookupResult && (
          <div className="p-4 rounded-lg bg-surface-bg border border-surface-border space-y-3 shadow-inner">
            <div className="flex justify-between items-center border-b border-surface-border pb-2">
              <span className="text-dark-muted font-mono text-[10px]">{lookupResult.registration_ref}</span>
              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                lookupResult.status === 'APPROVED' ? 'bg-status-completed/10 text-status-completed border border-status-completed/30' : 'bg-status-warning/10 text-status-warning border border-status-warning/30'
              }`}>
                {lookupResult.status}
              </span>
            </div>
            <div>
              <p className="font-black text-dark-bg text-xs uppercase tracking-wider">{lookupResult.name}</p>
              <p className="text-[10px] text-dark-muted uppercase tracking-widest mt-0.5">{lookupResult.university} • {lookupResult.country}</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6 border-gold/30 space-y-4">
          <h3 className="font-heading text-lg font-black text-dark-bg flex items-center gap-2 uppercase tracking-widest border-b border-dark-border pb-3">
            <TwoUsers set="bold" className="w-5 h-5 text-gold" /> Squad Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
              <span>Total Players</span>
              <span className="text-brand bg-surface-bg px-2 py-0.5 rounded border border-surface-border">{players.filter(p => p.full_name.trim()).length} / 26</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
              <span>Forwards</span>
              <span className="text-dark-bg">{players.filter(p => p.position === 'Forward').length}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
              <span>Midfielders</span>
              <span className="text-dark-bg">{players.filter(p => p.position === 'Midfielder').length}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
              <span>Defenders</span>
              <span className="text-dark-bg">{players.filter(p => p.position === 'Defender').length}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
              <span>Goalkeepers</span>
              <span className="text-dark-bg">{players.filter(p => p.position === 'Goalkeeper').length}</span>
            </div>
          </div>
      </div>

      <div className="glass-card p-6 border-gold/30 space-y-4 hidden sm:block">
          <h3 className="font-heading text-lg font-black text-dark-bg flex items-center gap-2 uppercase tracking-widest border-b border-dark-border pb-3">
            <ShieldDone set="bold" className="w-5 h-5 text-gold" /> Guidelines
          </h3>
          <ul className="text-[10px] text-dark-muted space-y-3 font-bold uppercase tracking-wider list-disc pl-4 marker:text-gold/50">
            <li>All athletes must be enrolled students.</li>
            <li>Valid Student ID is required.</li>
            <li>Squad size limited to 26 players (FIFA Rules).</li>
            <li>Teams must bring own training kits.</li>
          </ul>
      </div>
    </>
  );
};
