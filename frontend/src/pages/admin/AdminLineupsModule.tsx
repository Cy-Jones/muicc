import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { motion } from 'framer-motion';
import { TickSquare, CloseSquare, Edit, Delete } from 'react-iconly';

export const AdminLineupsModule = () => {
  const [lineups, setLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLineup, setSelectedLineup] = useState<any>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);

  const fetchLineups = async () => {
    try {
      const data = await api.adminGetLineups();
      setLineups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineups();
  }, []);

  const handleViewLineup = async (id: string) => {
    try {
      const data = await api.adminGetLineup(id);
      setSelectedLineup(data.lineup);
      setSelectedPlayers(data.players);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.adminUpdateLineupStatus(id, status);
      alert(`Lineup marked as ${status}`);
      setSelectedLineup(null);
      fetchLineups();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-surface-card rounded-xl border border-surface-border"></div>;

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border">
          <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Match Lineups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border text-[10px] font-black text-dark-muted uppercase tracking-widest">
                <th className="p-4">Match</th>
                <th className="p-4">Team</th>
                <th className="p-4">Formation</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lineups.map(l => (
                <tr key={l.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="p-4 text-sm font-bold">{l.match_code} • {l.date}</td>
                  <td className="p-4 text-sm font-bold flex items-center gap-2">
                    {l.team_logo && <img src={l.team_logo} alt={l.team_name} className="w-6 h-6 object-contain" />}
                    {l.team_name}
                  </td>
                  <td className="p-4 text-xs font-mono">{l.formation}</td>
                  <td className={`p-4 text-xs font-black uppercase tracking-widest ${
                    l.approval_status === 'APPROVED' ? 'text-status-completed' :
                    l.approval_status === 'PENDING' ? 'text-status-pending' : 'text-status-failed'
                  }`}>
                    {l.approval_status}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleViewLineup(l.id)}
                      className="btn-outline px-3 py-1.5 text-xs"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {lineups.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-dark-muted text-sm border-dashed">No lineups submitted.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLineup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card w-full max-w-4xl max-h-[90vh] rounded-xl border border-surface-border shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-surface-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-heading text-xl font-black uppercase tracking-widest text-dark-bg">Review Lineup</h3>
                <p className="text-xs text-dark-muted mt-1">{selectedLineup.match_code} • {selectedLineup.team_name}</p>
              </div>
              <button onClick={() => setSelectedLineup(null)} className="text-dark-muted hover:text-dark-bg transition-colors">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold uppercase tracking-widest text-dark-muted">Formation: <span className="text-dark-bg">{selectedLineup.formation}</span></div>
                <div className={`text-sm font-black uppercase tracking-widest ${
                  selectedLineup.approval_status === 'APPROVED' ? 'text-status-completed' :
                  selectedLineup.approval_status === 'PENDING' ? 'text-status-pending' : 'text-status-failed'
                }`}>
                  Status: {selectedLineup.approval_status}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-3">Starting XI</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-surface-bg rounded text-[10px] font-black uppercase tracking-widest text-dark-muted">
                    <div className="col-span-2">No.</div>
                    <div className="col-span-6">Player Name</div>
                    <div className="col-span-4">Match Position</div>
                  </div>
                  {selectedPlayers.filter(p => p.is_starting).map((p, index) => (
                    <div key={p.player_id} className="grid grid-cols-12 gap-2 items-center px-4 py-2 border border-surface-border rounded-lg bg-surface-bg/50">
                      <div className="col-span-2 font-mono font-bold text-dark-muted">{p.jersey_number}</div>
                      <div className="col-span-6 font-bold text-sm text-dark-bg">{p.full_name}</div>
                      <div className="col-span-4 text-xs font-bold text-brand">{p.position}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-3">Substitutes</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedPlayers.filter(p => !p.is_starting).map((p, index) => (
                    <div key={p.player_id} className="grid grid-cols-12 gap-2 items-center px-4 py-2 border border-surface-border rounded-lg bg-surface-bg/50">
                      <div className="col-span-2 font-mono font-bold text-dark-muted">{p.jersey_number}</div>
                      <div className="col-span-6 font-bold text-sm text-dark-bg">{p.full_name}</div>
                      <div className="col-span-4 text-xs font-bold text-dark-muted">{p.position}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-surface-border flex justify-end gap-3 bg-surface-bg shrink-0">
              <button onClick={() => setSelectedLineup(null)} className="btn-outline px-6 py-2 text-xs">Close</button>
              {selectedLineup.approval_status !== 'REJECTED' && (
                <button onClick={() => handleUpdateStatus(selectedLineup.id, 'REJECTED')} className="btn-outline text-status-failed border-status-failed/50 hover:bg-status-failed/10 px-6 py-2 text-xs">Reject</button>
              )}
              {selectedLineup.approval_status !== 'APPROVED' && (
                <button onClick={() => handleUpdateStatus(selectedLineup.id, 'APPROVED')} className="bg-status-completed text-black font-bold uppercase tracking-widest px-6 py-2 text-xs rounded-lg hover:bg-status-completed/90">Approve</button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
