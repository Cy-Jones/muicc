import React from 'react';
import { motion } from 'framer-motion';
import { CloseSquare, Camera, Upload } from 'react-iconly';
import { api } from '../../lib/api';

interface ManagerPlayerModalProps {
  mode: 'add' | 'edit';
  playerForm: any;
  setPlayerForm: React.Dispatch<React.SetStateAction<any>>;
  editingPlayerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const ManagerPlayerModal: React.FC<ManagerPlayerModalProps> = ({ 
  mode, 
  playerForm, 
  setPlayerForm, 
  editingPlayerId, 
  onClose, 
  onSaved 
}) => {
  const handlePhotoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Player photo file size must be less than 5MB.');
        return;
      }
      try {
        const res = await api.uploadImage(file);
        if (res && res.url) {
          setPlayerForm((prev: any) => ({ ...prev, photo_url: res.url }));
        }
      } catch (err: any) {
        alert(err.message || 'Failed to upload photo.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'add') {
        await api.managerAddPlayer(playerForm);
      } else if (editingPlayerId) {
        await api.managerUpdatePlayer(editingPlayerId, playerForm);
      }
      onSaved();
    } catch (err: any) {
      alert(err.message || `Failed to ${mode} player`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-card w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
          <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">{mode === 'edit' ? 'Edit Player' : 'Add Player'}</h2>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg transition-colors">
            <CloseSquare set="bold" className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Full Name</label>
              <input type="text" value={playerForm.full_name} onChange={e => setPlayerForm((prev: any) => ({ ...prev, full_name: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Jersey Number</label>
              <input type="number" value={playerForm.jersey_number} onChange={e => setPlayerForm((prev: any) => ({ ...prev, jersey_number: e.target.value }))} className="input-field" required min="1" max="99" />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Position</label>
              <select value={playerForm.position} onChange={e => setPlayerForm((prev: any) => ({ ...prev, position: e.target.value }))} className="input-field" required>
                <option value="Forward">Forward</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Defender">Defender</option>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Coach">Coach</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Nationality</label>
              <input type="text" value={playerForm.nationality} onChange={e => setPlayerForm((prev: any) => ({ ...prev, nationality: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Date of Birth</label>
              <input type="date" value={playerForm.dob} onChange={e => setPlayerForm((prev: any) => ({ ...prev, dob: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Course/Program</label>
              <input type="text" value={playerForm.course} onChange={e => setPlayerForm((prev: any) => ({ ...prev, course: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Student ID (GR#)</label>
              <input type="text" value={playerForm.student_id} onChange={e => setPlayerForm((prev: any) => ({ ...prev, student_id: e.target.value }))} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-bg border border-surface-border flex-shrink-0 flex items-center justify-center relative shadow-inner">
                  {playerForm.photo_url ? (
                    <img src={playerForm.photo_url} alt="Player" className="w-full h-full object-cover" />
                  ) : (
                    <Camera set="bold" className="w-4 h-4 text-dark-muted" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/40 rounded-md text-[10px] font-black tracking-widest uppercase cursor-pointer inline-flex items-center gap-2 transition-colors">
                    <Upload set="bold" className="w-3.5 h-3.5" /> Upload Photo
                    <input type="file" accept="image/*" onChange={handlePhotoFileUpload} className="hidden" />
                  </label>
                  {playerForm.photo_url && (
                    <button type="button" onClick={() => setPlayerForm((prev: any) => ({ ...prev, photo_url: '' }))} className="text-[10px] text-status-error/80 hover:text-status-error font-black uppercase tracking-widest transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-surface-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Medical Conditions / Allergies</label>
              <input type="text" value={playerForm.medical_conditions} onChange={e => setPlayerForm((prev: any) => ({ ...prev, medical_conditions: e.target.value }))} placeholder="None" className="input-field" />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Name</label>
              <input type="text" value={playerForm.emergency_contact_name} onChange={e => setPlayerForm((prev: any) => ({ ...prev, emergency_contact_name: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Phone</label>
              <input 
                type="tel" 
                required
                pattern="^\+91 [0-9]{10}$"
                maxLength={14}
                title="Must be a valid 10-digit Indian phone number"
                value={playerForm.emergency_contact_phone} 
                onChange={e => {
                  let val = e.target.value;
                  if (!val.startsWith('+91 ')) {
                    val = '+91 ' + val.replace(/^\+?9?1?\s*/, '').replace(/\D/g, '').slice(0, 10);
                  } else {
                    val = '+91 ' + val.slice(4).replace(/\D/g, '').slice(0, 10);
                  }
                  setPlayerForm((prev: any) => ({ ...prev, emergency_contact_phone: val }));
                }} 
                className="input-field" 
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-surface-border flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="btn-outline px-6 py-2">Cancel</button>
            <button type="submit" className="btn-primary px-6 py-2">{mode === 'edit' ? 'Save Changes' : 'Add Player'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
