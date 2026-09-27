import React from 'react';
import { motion } from 'framer-motion';
import { CloseSquare, ShieldDone } from 'react-iconly';

interface AdminViewTeamModalProps {
  selectedTeam: any;
  players: any[];
  onClose: () => void;
}

export const AdminViewTeamModal: React.FC<AdminViewTeamModalProps> = ({ selectedTeam, players, onClose }) => {
  const teamPlayers = players.filter(p => p.team_id === selectedTeam.id);
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-surface-card w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
          <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Team Details: {selectedTeam.name}</h2>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg transition-colors">
            <CloseSquare set="bold" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-6">
            {selectedTeam.logo_url ? (
              <img src={selectedTeam.logo_url} alt="" className="w-24 h-24 rounded-lg object-contain bg-surface-bg p-2 border border-surface-border shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-center shrink-0">
                <ShieldDone set="bold" className="w-12 h-12 text-dark-muted" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 w-full">
              <div>
                <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">University</div>
                <div className="text-sm text-dark-bg font-bold">{selectedTeam.university}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Country</div>
                <div className="text-sm text-dark-bg font-bold">{selectedTeam.country}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Head Coach</div>
                <div className="text-sm text-dark-bg font-bold">{selectedTeam.coach_name}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Manager Contact</div>
                <div className="text-sm text-dark-bg font-bold truncate">{selectedTeam.manager_email}</div>
                <div className="text-xs text-dark-muted">{selectedTeam.manager_phone}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-black text-dark-bg uppercase tracking-widest border-b border-surface-border pb-2 mb-4">Roster ({teamPlayers.length} Players)</h3>
            {teamPlayers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamPlayers.map((p: any) => (
                  <div key={p.id} className="p-3 rounded bg-surface-bg border border-surface-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-dark-bg">{p.full_name}</div>
                      <div className="text-[10px] text-dark-muted font-black uppercase">{p.position}</div>
                    </div>
                    <div className="text-sm font-mono font-bold text-brand">#{p.jersey_number}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-dark-muted">No players submitted.</div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
