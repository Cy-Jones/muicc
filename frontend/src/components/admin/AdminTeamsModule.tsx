import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Message, Delete, CloseSquare } from 'react-iconly';

interface AdminTeamsModuleProps {
  teams: any[];
  onRefresh: () => void;
  setMessage: (msg: string) => void;
}

export default function AdminTeamsModule({ teams, onRefresh, setMessage }: AdminTeamsModuleProps) {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageModalTeam, setMessageModalTeam] = useState<any>(null);
  const [adminMessageInput, setAdminMessageInput] = useState('');

  const handleUpdateTeamStatus = async (id: string, status: string) => {
    try {
      await api.adminUpdateTeamStatus(id, status);
      setMessage(`Team status updated to ${status}.`);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team? This is irreversible!')) return;
    try {
      await api.adminDeleteTeam(id);
      setMessage('Team deleted successfully.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openMessageModal = (team: any) => {
    setMessageModalTeam(team);
    setAdminMessageInput(team.admin_message || '');
    setIsMessageModalOpen(true);
  };

  const handleSaveMessage = async () => {
    if (!messageModalTeam) return;
    try {
      await api.adminTeamMessage(messageModalTeam.id, adminMessageInput);
      setMessage('Message saved successfully.');
      setIsMessageModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-bg">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Teams Roster ({teams.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-dark-bg">
          <thead className="bg-surface-bg text-dark-muted border-b border-surface-border">
            <tr><th className="p-4">Ref ID</th><th className="p-4">Team Name</th><th className="p-4">University</th><th className="p-4">Country</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {teams.map((t) => (
              <tr key={t.id} className="hover:bg-surface-bg transition-colors">
                <td className="p-4 text-brand font-mono">{t.registration_ref}</td>
                <td className="p-4 text-dark-bg">{t.name}</td>
                <td className="p-4 text-dark-muted">{t.university}</td>
                <td className="p-4">{t.country}</td>
                <td className="p-4"><span className={`status-badge ${t.status === 'APPROVED' ? 'status-completed' : t.status === 'REJECTED' ? 'status-error' : 'status-warning'}`}>{t.status}</span></td>
                <td className="p-4 text-right space-x-2 flex items-center justify-end">
                  {t.status !== 'APPROVED' && <button onClick={() => handleUpdateTeamStatus(t.id, 'APPROVED')} className="action-btn bg-status-completed/10 text-status-completed border-status-completed/30 hover:bg-status-completed/20">Approve</button>}
                  {t.status !== 'REJECTED' && <button onClick={() => handleUpdateTeamStatus(t.id, 'REJECTED')} className="action-btn bg-status-error/10 text-status-error border-status-error/30 hover:bg-status-error/20">Reject</button>}
                  <button onClick={() => openMessageModal(t)} className="p-1.5 rounded bg-brand/10 text-brand hover:bg-brand hover:text-black transition-colors" title="Send Message">
                    <Message set="bold" className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteTeam(t.id)} className="p-1.5 rounded bg-status-error/10 text-status-error hover:bg-status-error hover:text-dark-bg transition-colors" title="Delete Team">
                    <Delete set="bold" className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isMessageModalOpen && messageModalTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-md rounded-2xl border border-surface-border p-6 shadow-2xl relative">
            <button onClick={() => setIsMessageModalOpen(false)} className="absolute top-4 right-4 text-dark-muted hover:text-brand">
              <CloseSquare set="bold" className="w-6 h-6" />
            </button>
            <h2 className="font-heading text-xl font-black text-dark-bg uppercase tracking-widest mb-2">Message {messageModalTeam.name}</h2>
            <p className="text-xs text-dark-muted mb-4 font-medium">This message will appear on the manager's dashboard.</p>
            <textarea
              value={adminMessageInput}
              onChange={(e) => setAdminMessageInput(e.target.value)}
              placeholder="Enter message here (leave blank to clear)..."
              className="w-full h-32 input-field mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setIsMessageModalOpen(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleSaveMessage} className="btn-primary flex-1">Save Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
