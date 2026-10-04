import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Search, Delete, CloseSquare } from 'react-iconly';

interface AdminPlayersModuleProps {
  players: any[];
  onRefresh: () => void;
  setMessage: (msg: string) => void;
}

export default function AdminPlayersModule({ players, onRefresh, setMessage }: AdminPlayersModuleProps) {
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [viewingPlayer, setViewingPlayer] = useState<any>(null);

  const handleUpdatePlayerStatus = async (id: string, status: string) => {
    try {
      const res = await api.adminUpdatePlayerStatus(id, status);
      setMessage(`Player updated to ${status}. ${res.player_id ? 'Generated Player ID: ' + res.player_id : ''}`);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this player? This is irreversible!')) return;
    try {
      await api.adminDeletePlayer(id);
      setMessage('Player deleted successfully.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredPlayers = players.filter(p => {
    if (p.position === 'Coach') return false; // Exclude coaches

    const q = playerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    
    return (
      (p.full_name || '').toLowerCase().includes(q) || 
      (p.team_name || '').toLowerCase().includes(q) || 
      (p.university || '').toLowerCase().includes(q) ||
      (
        (p.player_id || '').toLowerCase().includes(q) && 
        !['mulsu', 'mulsu-', 'mulsu-ply', 'mulsu-ply-'].includes(q)
      )
    );
  });

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-bg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Player Approvals ({filteredPlayers.length})</h2>
        <div className="relative w-full md:w-auto">
          <Search set="light" className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, ID, team..."
            value={playerSearchQuery}
            onChange={(e) => setPlayerSearchQuery(e.target.value)}
            className="admin-input !pl-10 text-xs w-full md:w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-dark-bg">
          <thead className="bg-surface-bg text-dark-muted border-b border-surface-border">
            <tr><th className="p-4">Player ID</th><th className="p-4">Athlete Name</th><th className="p-4">Team</th><th className="p-4">Pos</th><th className="p-4">Jersey</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filteredPlayers.map((p) => (
              <tr key={p.id} className="hover:bg-surface-bg transition-colors">
                <td className="p-4 text-brand font-mono">{p.player_id || 'PENDING'}</td>
                <td className="p-4 text-dark-bg flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-surface-bg border border-surface-border overflow-hidden flex-shrink-0">
                    {p.photo_url && <img src={p.photo_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  {p.full_name}
                </td>
                <td className="p-4 text-dark-muted">{p.team_name}</td>
                <td className="p-4">{p.position}</td>
                <td className="p-4 text-brand">#{p.jersey_number}</td>
                <td className="p-4"><span className={`status-badge ${p.status === 'APPROVED' ? 'status-completed' : p.status === 'REJECTED' ? 'status-error' : 'status-warning'}`}>{p.status}</span></td>
                <td className="p-4 text-right space-x-2 flex items-center justify-end">
                  <button onClick={() => setViewingPlayer(p)} className="action-btn bg-brand/10 text-brand border-brand/30 hover:bg-brand/20" title="View Details">Details</button>
                  {p.status !== 'APPROVED' && <button onClick={() => handleUpdatePlayerStatus(p.id, 'APPROVED')} className="action-btn bg-status-completed/10 text-status-completed border-status-completed/30 hover:bg-status-completed/20">Approve</button>}
                  {p.status !== 'REJECTED' && <button onClick={() => handleUpdatePlayerStatus(p.id, 'REJECTED')} className="action-btn bg-status-error/10 text-status-error border-status-error/30 hover:bg-status-error/20">Reject</button>}
                  <button onClick={() => handleDeletePlayer(p.id)} className="p-1.5 rounded bg-status-error/10 text-status-error hover:bg-status-error hover:text-dark-bg transition-colors" title="Delete Player">
                    <Delete set="bold" className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredPlayers.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-dark-muted">No players found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingPlayer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-2xl p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-bg border border-surface-border overflow-hidden flex-shrink-0 shadow-md">
                  {viewingPlayer.photo_url && <img src={viewingPlayer.photo_url} alt="" className="w-full h-full object-cover" />}
                </div>
                Player Details: {viewingPlayer.full_name}
              </h3>
              <button onClick={() => setViewingPlayer(null)} className="text-dark-muted hover:text-dark-bg self-start mt-2">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Registration Information</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Player ID:</span> <span className="font-mono text-brand">{viewingPlayer.player_id || 'PENDING'}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Team:</span> <span className="font-bold">{viewingPlayer.team_name}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Status:</span> <span className="font-bold">{viewingPlayer.status}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Registration Date:</span> <span>{new Date(viewingPlayer.created_at).toLocaleDateString()}</span></p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Personal Details</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Date of Birth:</span> <span>{new Date(viewingPlayer.dob).toLocaleDateString()}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Nationality:</span> <span>{viewingPlayer.nationality}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Emergency Contact:</span> <span>{viewingPlayer.emergency_contact || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Athletic Profile</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Position:</span> <span>{viewingPlayer.position}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Jersey Number:</span> <span>#{viewingPlayer.jersey_number}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Preferred Foot:</span> <span>{viewingPlayer.preferred_foot}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Medical Conditions:</span> <span>{viewingPlayer.medical_conditions || 'None'}</span></p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Academic Information</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Student ID:</span> <span className="font-mono text-brand">{viewingPlayer.student_id}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">University:</span> <span>{viewingPlayer.university}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Field of Study:</span> <span>{viewingPlayer.field_of_study}</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            {viewingPlayer.front_id_card_url && (
              <div className="mt-4 border-t border-surface-border pt-4">
                <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2">ID Verification</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-[1.58] bg-surface-bg border border-surface-border rounded-lg overflow-hidden relative group">
                    <img src={viewingPlayer.front_id_card_url} alt="ID Front" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Front</span>
                    </div>
                  </div>
                  {viewingPlayer.back_id_card_url && (
                    <div className="aspect-[1.58] bg-surface-bg border border-surface-border rounded-lg overflow-hidden relative group">
                      <img src={viewingPlayer.back_id_card_url} alt="ID Back" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Back</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
