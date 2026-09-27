import React from 'react';
import { motion } from 'framer-motion';
import { CloseSquare, Upload } from 'react-iconly';
import { api } from '../../lib/api';

interface ManagerEditTeamModalProps {
  teamForm: any;
  setTeamForm: (form: any) => void;
  onClose: () => void;
  onSaved: () => void;
}

export const ManagerEditTeamModal: React.FC<ManagerEditTeamModalProps> = ({ teamForm, setTeamForm, onClose, onSaved }) => {
  const handleTeamLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Team logo file size must be less than 5MB.');
        return;
      }
      try {
        const res = await api.uploadImage(file);
        if (res && res.url) {
          setTeamForm((prev: any) => ({ ...prev, logo_url: res.url }));
        }
      } catch (err: any) {
        alert(err.message || 'Failed to upload logo.');
      }
    }
  };

  const handleTeamUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.managerUpdateTeam(teamForm);
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to update team details');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-card w-full max-w-lg rounded-2xl border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
          <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Edit Team Details</h2>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg transition-colors">
            <CloseSquare set="bold" className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleTeamUpdateSubmit} className="p-6 space-y-4 overflow-y-auto no-scrollbar">
          <div>
            <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Team Name <span className="text-status-error">*</span></label>
            <input required type="text" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">University <span className="text-status-error">*</span></label>
            <input required type="text" value={teamForm.university} onChange={e => setTeamForm({...teamForm, university: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Head Coach Name <span className="text-status-error">*</span></label>
            <input required type="text" value={teamForm.coach_name} onChange={e => setTeamForm({...teamForm, coach_name: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Manager Name <span className="text-status-error">*</span></label>
            <input required type="text" value={teamForm.manager_name} onChange={e => setTeamForm({...teamForm, manager_name: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Manager Email <span className="text-status-error">*</span></label>
            <input required type="email" value={teamForm.manager_email} onChange={e => setTeamForm({...teamForm, manager_email: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Manager Phone <span className="text-status-error">*</span></label>
            <input required type="tel" value={teamForm.manager_phone} onChange={e => {
              let val = e.target.value;
              if (!val.startsWith('+91 ')) val = '+91 ';
              if (val.length > 14) val = val.substring(0, 14);
              setTeamForm({...teamForm, manager_phone: val});
            }} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Team Logo (Optional)</label>
            <div className="flex items-center gap-4">
              {teamForm.logo_url && (
                <img src={teamForm.logo_url} alt="Logo Preview" className="w-12 h-12 rounded object-contain bg-surface-bg border border-surface-border p-1" />
              )}
              <label className="btn-outline px-4 py-2 text-xs cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Logo
                <input type="file" accept="image/*" onChange={handleTeamLogoUpload} className="hidden" />
              </label>
              {teamForm.logo_url && (
                <button type="button" onClick={() => setTeamForm({...teamForm, logo_url: ''})} className="text-xs text-status-error hover:underline">Remove</button>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-surface-border flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-outline px-6 py-2 text-xs">Cancel</button>
            <button type="submit" className="btn-primary px-6 py-2 text-xs">Save Changes</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
