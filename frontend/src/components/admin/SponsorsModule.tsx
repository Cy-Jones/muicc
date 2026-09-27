import React, { useState, useEffect } from 'react';
import { EditSquare, Delete, Plus } from 'react-iconly';
import { api } from '../../lib/api';
import { AdminSponsorModal } from './AdminSponsorModal';

export const SponsorsModule: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchSponsors = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSponsors(); 
      setSponsors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sponsor?')) return;
    try {
      await api.adminDeleteSponsor(id);
      fetchSponsors();
    } catch (err) {
      alert('Error deleting sponsor');
    }
  };

  const tierColors: Record<string, string> = {
    'TITLE': 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    'GOLD': 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    'SILVER': 'text-slate-400 bg-slate-400/10 border-slate-400/30',
    'PARTNER': 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-bg flex items-center justify-between">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Sponsors Management</h2>
        <button onClick={() => openModal()} className="btn-primary text-xs flex items-center gap-2">
          <Plus set="bold" className="w-4 h-4" /> Add Sponsor
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-dark-bg">
          <thead className="bg-surface-bg text-dark-muted border-b border-surface-border">
            <tr>
              <th className="p-4">Logo</th>
              <th className="p-4">Name</th>
              <th className="p-4">Tier</th>
              <th className="p-4">Website</th>
              <th className="p-4">Order</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-dark-muted">Loading...</td></tr>
            ) : sponsors.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-dark-muted">No sponsors added yet.</td></tr>
            ) : (
              sponsors.map((item) => (
                <tr key={item.id} className="hover:bg-surface-bg transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-surface-bg rounded flex items-center justify-center p-1 border border-surface-border">
                      <img src={item.logo_url} alt={item.name} className="max-w-[96%] max-h-full object-contain" />
                    </div>
                  </td>
                  <td className="p-4 font-bold text-dark-bg">{item.name}</td>
                  <td className="p-4">
                    <span className={`status-badge ${tierColors[item.tier] || tierColors['PARTNER']}`}>
                      {item.tier}
                    </span>
                  </td>
                  <td className="p-4 text-brand lowercase">{item.website || '-'}</td>
                  <td className="p-4 font-mono">{item.display_order}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openModal(item)} className="p-1.5 text-brand hover:bg-brand/10 rounded transition-colors">
                      <EditSquare set="bold" className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-status-error hover:bg-status-error/10 rounded transition-colors">
                      <Delete set="bold" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AdminSponsorModal 
          editingItem={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchSponsors();
          }}
        />
      )}
    </div>
  );
};
