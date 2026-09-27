import React, { useState } from 'react';
import { Play, CloseSquare } from 'react-iconly';

interface AdminExtraTimeModalProps {
  extraTimeMatch: any;
  onClose: () => void;
  handleLiveClockControl: (matchId: string, action: string, value?: number) => void;
}

export const AdminExtraTimeModal: React.FC<AdminExtraTimeModalProps> = ({ extraTimeMatch, onClose, handleLiveClockControl }) => {
  const [extraMins, setExtraMins] = useState('3');

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-sm p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6">
        <div className="flex justify-between items-center border-b border-surface-border pb-3">
          <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-2">
            <Play set="bold" className="w-5 h-5 text-brand" /> Add Extra Time
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg">
            <CloseSquare set="bold" className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Minutes</label>
            <input type="number" min="1" className="admin-input" value={extraMins} onChange={e => setExtraMins(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-4 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold text-dark-muted hover:text-dark-bg transition-colors">Cancel</button>
          <button onClick={() => {
            let action = 'SET_STOPPAGE_1ST';
            if (extraTimeMatch.live_period === 'SECOND_HALF' || extraTimeMatch.live_period === '2ND_HALF') action = 'SET_STOPPAGE_2ND';
            if (extraTimeMatch.live_period === 'EXTRA_TIME_FIRST_HALF') action = 'SET_STOPPAGE_ET1';
            if (extraTimeMatch.live_period === 'EXTRA_TIME_SECOND_HALF') action = 'SET_STOPPAGE_ET2';
            handleLiveClockControl(extraTimeMatch.id, action, parseInt(extraMins));
            onClose();
          }} className="btn-primary py-2.5 px-6">Confirm</button>
        </div>
      </div>
    </div>
  );
};
