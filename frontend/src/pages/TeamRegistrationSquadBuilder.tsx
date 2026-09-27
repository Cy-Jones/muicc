import React from 'react';
import { TwoUsers, Plus } from 'react-iconly';
import { TeamRegistrationPlayerCard } from './TeamRegistrationPlayerCard';
import { PlayerDraft } from './TeamRegistrationPage';

interface TeamRegistrationSquadBuilderProps {
  players: PlayerDraft[];
  handleAddPlayer: () => void;
  handlePlayerChange: (index: number, field: keyof PlayerDraft, value: string) => void;
  handleRemovePlayer: (index: number) => void;
  handlePhotoFileUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  submitting: boolean;
}

export const TeamRegistrationSquadBuilder: React.FC<TeamRegistrationSquadBuilderProps> = ({
  players,
  handleAddPlayer,
  handlePlayerChange,
  handleRemovePlayer,
  handlePhotoFileUpload,
  submitting,
}) => {
  return (
    <div className="space-y-6 pt-6 border-t border-dark-border">
      <div className="flex items-end justify-between border-b border-dark-border pb-4">
        <div>
          <h2 className="font-heading text-xl font-black text-dark-bg flex items-center gap-3 uppercase tracking-widest">
            <TwoUsers set="bold" className="w-5 h-5 text-gold" /> Squad Roster
          </h2>
          <p className="text-[10px] text-dark-muted mt-1 uppercase tracking-widest font-bold">Register all athletes ({players.length} Players)</p>
        </div>
        <button type="button" onClick={handleAddPlayer} className="btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1 shadow-glow-gold">
          <Plus set="bold" className="w-3 h-3" /> Add Player
        </button>
      </div>

      <div className="space-y-6">
        {players.map((p, idx) => (
          <TeamRegistrationPlayerCard
            key={idx}
            player={p}
            index={idx}
            totalPlayers={players.length}
            onPlayerChange={handlePlayerChange}
            onRemovePlayer={handleRemovePlayer}
            onPhotoUpload={handlePhotoFileUpload}
          />
        ))}
      </div>

      <button type="button" onClick={handleAddPlayer} className="w-full py-4 bg-surface-card border border-dashed border-surface-border hover:border-gold hover:text-gold text-dark-muted rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        <Plus set="bold" className="w-4 h-4" /> Create new player
      </button>

      <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-xl text-sm shadow-glow-gold disabled:opacity-50 mt-8">
        {submitting ? 'Submitting...' : `Submit Team & ${players.filter(p => p.full_name.trim()).length} Players`}
      </button>
    </div>
  );
};
