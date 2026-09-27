import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface AdminPredictionStatusModalProps {
  predictionId: string;
  initialStatus: string;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminPredictionStatusModal: React.FC<AdminPredictionStatusModalProps> = ({ 
  predictionId, 
  initialStatus, 
  onClose, 
  onSaved 
}) => {
  const [predictionStatus, setPredictionStatus] = useState(initialStatus || 'PENDING');

  useEffect(() => {
    setPredictionStatus(initialStatus || 'PENDING');
  }, [initialStatus]);

  const handlePredictionStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (predictionId) {
      try {
        await api.adminUpdatePredictionStatus(predictionId, predictionStatus);
        onSaved();
      } catch (err) {
        alert('Failed to update prediction status');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-sm rounded-xl border border-surface-border overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-surface-border bg-surface-bg flex justify-between items-center shrink-0">
          <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">
            Update Status
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-4">
          <form id="status-form" onSubmit={handlePredictionStatusUpdate} className="space-y-4">
            <div>
              <label className="admin-label">Prediction Status</label>
              <select 
                value={predictionStatus} 
                onChange={e => setPredictionStatus(e.target.value)} 
                className="admin-input"
              >
                <option value="PENDING">Pending</option>
                <option value="WINNER">Winner</option>
                <option value="LOSER">Loser</option>
              </select>
            </div>
          </form>
        </div>
        
        <div className="p-4 border-t border-surface-border bg-surface-bg flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-outline text-xs">Cancel</button>
          <button form="status-form" type="submit" className="btn-primary text-xs">Save Changes</button>
        </div>
      </div>
    </div>
  );
};
