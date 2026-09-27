import React from 'react';
import { api } from '../../lib/api';
import { Star, Lock } from 'react-iconly';

interface AdminDrawModuleProps {
  draw: any[];
  isDrawLocked: boolean;
  onRefresh: () => void;
  setMessage: (msg: string) => void;
}

export default function AdminDrawModule({ draw, isDrawLocked, onRefresh, setMessage }: AdminDrawModuleProps) {
  
  const handleGenerateDraw = async () => {
    try {
      const res = await api.adminGenerateDraw('REGIONAL_SEEDED');
      setMessage(res.message || 'Regional Seeded 3-Group Draw generated successfully!');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmDraw = async () => {
    if (!window.confirm('Are you sure you want to lock the draw? This will make it official and visible to the public.')) return;
    try {
      await api.adminConfirmDraw();
      setMessage('Draw confirmed and locked successfully.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnlockDraw = async () => {
    if (!window.confirm('Are you sure you want to unlock the draw? This will allow you to generate a new draw.')) return;
    try {
      await api.adminUnlockDraw();
      setMessage('Draw unlocked successfully.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-surface-card p-6 rounded-xl border border-surface-border space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <div>
          <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Tournament Draw Manager</h2>
          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-1">Regional Seeded format strictly enforced.</p>
        </div>
        <div className="flex items-center gap-3">
          {!isDrawLocked ? (
            <>
              <button onClick={handleGenerateDraw} className="btn-outline px-4 py-2 text-[10px] flex items-center gap-1.5"><Star set="bold" className="w-3.5 h-3.5" /> Generate Draw</button>
              <button onClick={handleConfirmDraw} className="btn-primary bg-status-completed text-dark-bg px-4 py-2 text-[10px] flex items-center gap-1.5 shadow-none"><Lock set="bold" className="w-3.5 h-3.5" /> Confirm & Lock</button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-status-completed/10 text-status-completed border border-status-completed/30 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Lock set="bold" className="w-3 h-3" /> Draw Locked</span>
              <button onClick={handleUnlockDraw} className="btn-outline px-4 py-2 text-[10px] flex items-center gap-1.5 text-status-error hover:border-status-error hover:bg-status-error/10">Unlock Draw</button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {draw.map((gData: any, idx: number) => (
          <div key={idx} className="bg-surface-bg border border-surface-border p-4 rounded-xl shadow-inner">
            <div className="flex justify-between items-center border-b border-surface-border pb-2">
              <h3 className="font-heading font-black text-brand uppercase tracking-widest">{gData.group.name}</h3>
              <span className="text-[10px] text-dark-muted font-black tracking-widest uppercase">{gData.teams?.length || 0} Teams</span>
            </div>
            <div className="space-y-1.5">
              {!gData.teams || gData.teams.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">No teams assigned.</p>
              ) : (
                gData.teams.map((t: any, idx: number) => (
                  <div key={t.id} className="bg-surface-card p-2 rounded-md border border-surface-border flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <span className="text-dark-muted w-3">{idx + 1}</span>
                      <span className="text-dark-bg truncate max-w-[120px]">{t.name}</span>
                    </div>
                    <span className="text-slate-400 truncate max-w-[80px]">{t.country}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
