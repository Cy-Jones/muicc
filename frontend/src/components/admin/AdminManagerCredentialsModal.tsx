import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AdminManagerCredentialsModalProps {
  initialData: { nation_id: string; email: string; password: any };
  isEditMode: boolean;
  nations: any[];
  onClose: () => void;
  onSave: (data: { nation_id: string; email: string; password: any }) => void;
}

export const AdminManagerCredentialsModal: React.FC<AdminManagerCredentialsModalProps> = ({
  initialData, isEditMode, nations, onClose, onSave
}) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-surface-card w-full max-w-md p-6 relative rounded-xl border border-surface-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-dark-bg">&times;</button>
        <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest mb-4">
          {isEditMode ? 'Reset Password' : 'Create Manager Account'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1.5">Nation</label>
            <select required value={formData.nation_id} onChange={e => setFormData({...formData, nation_id: e.target.value})} className="input-field w-full">
              <option value="">Select Nation</option>
              {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1.5">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field w-full" placeholder="manager@nation.com" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1.5">Password</label>
            <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field w-full" placeholder="Secure password" />
          </div>
          <button type="submit" className="btn-primary w-full py-3 mt-2">Save Credentials</button>
        </form>
      </motion.div>
    </motion.div>
  );
};
