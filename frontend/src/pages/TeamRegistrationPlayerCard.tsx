import React from 'react';
import { Camera, Upload, Delete } from 'react-iconly';
import { PlayerDraft } from './TeamRegistrationPage';

interface TeamRegistrationPlayerCardProps {
  player: PlayerDraft;
  index: number;
  totalPlayers: number;
  onPlayerChange: (index: number, field: keyof PlayerDraft, value: string) => void;
  onRemovePlayer: (index: number) => void;
  onPhotoUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TeamRegistrationPlayerCard: React.FC<TeamRegistrationPlayerCardProps> = ({
  player,
  index,
  totalPlayers,
  onPlayerChange,
  onRemovePlayer,
  onPhotoUpload
}) => {
  return (
    <div className="p-6 bg-surface-card rounded-xl border border-surface-border space-y-5 relative hover:border-gold/50 transition-colors group">
      <div className="flex justify-between items-center border-b border-dark-border pb-3">
        <span className="font-heading text-sm font-black text-gold tracking-widest">PLAYER #{index + 1}</span>
        {totalPlayers > 1 && (
          <button type="button" onClick={() => onRemovePlayer(index)} className="text-[10px] text-status-error/80 hover:text-status-error flex items-center gap-1 font-black uppercase tracking-widest transition-colors">
            <Delete set="bold" className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Full Athlete Name <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={player.full_name} onChange={(e) => onPlayerChange(index, 'full_name', e.target.value)} placeholder="Emmanuel Flomo" className="input-field" />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Jersey # <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="number" required value={player.jersey_number} onChange={(e) => onPlayerChange(index, 'jersey_number', e.target.value)} placeholder="10" className="input-field" />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Position <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <select value={player.position} onChange={(e) => onPlayerChange(index, 'position', e.target.value)} className="input-field">
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
            <option value="Coach">Coach</option>
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Nationality <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={player.nationality} onChange={(e) => onPlayerChange(index, 'nationality', e.target.value)} placeholder="Liberia" className="input-field" />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Student ID (GR#) <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={player.student_id} onChange={(e) => onPlayerChange(index, 'student_id', e.target.value)} placeholder="GR-2026-001" className="input-field" />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Date of Birth <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="date" required value={player.dob} onChange={(e) => onPlayerChange(index, 'dob', e.target.value)} className="input-field" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Course / Program <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={player.course} onChange={(e) => onPlayerChange(index, 'course', e.target.value)} placeholder="BSc Computer Science" className="input-field" />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Medical Conditions / Allergies <span className="text-[8px] font-medium normal-case text-dark-muted">(Optional)</span></label>
          <input type="text" value={player.medical_conditions} onChange={(e) => onPlayerChange(index, 'medical_conditions', e.target.value)} placeholder="None" className="input-field" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Name <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={player.emergency_contact_name} onChange={(e) => onPlayerChange(index, 'emergency_contact_name', e.target.value)} placeholder="Jane Doe" className="input-field" />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Phone <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input 
            type="tel" 
            required 
            pattern="^\+91 [0-9]{10}$"
            maxLength={14}
            title="Must be a valid 10-digit Indian phone number"
            value={player.emergency_contact_phone} 
            onChange={(e) => {
              let val = e.target.value;
              if (!val.startsWith('+91 ')) {
                val = '+91 ' + val.replace(/^\+?9?1?\s*/, '').replace(/\D/g, '').slice(0, 10);
              } else {
                val = '+91 ' + val.slice(4).replace(/\D/g, '').slice(0, 10);
              }
              onPlayerChange(index, 'emergency_contact_phone', val);
            }} 
            placeholder="+91 9876543210" 
            className="input-field" 
          />
        </div>
      </div>

      <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface-bg p-4 rounded-lg border">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-bg border border-gold/40 flex-shrink-0 flex items-center justify-center relative shadow-inner">
          {player.photo_url ? (
            <img src={player.photo_url} alt="Player" className="w-full h-full object-cover" />
          ) : (
            <Camera set="bold" className="w-5 h-5 text-gold/40" />
          )}
        </div>
        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <label className="px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/40 rounded-md text-[10px] font-black tracking-widest uppercase cursor-pointer inline-flex items-center gap-2 transition-colors">
                <Upload set="bold" className="w-3.5 h-3.5" /> Upload Photo
                <input type="file" accept="image/*" onChange={(e) => onPhotoUpload(index, e)} className="hidden" />
              </label>
              {player.photo_url && (
                <button type="button" onClick={() => onPlayerChange(index, 'photo_url', '')} className="text-[10px] text-status-error/80 hover:text-status-error font-black uppercase tracking-widest transition-colors">
                  Clear
                </button>
              )}
            </div>
            {totalPlayers > 1 && (
              <button type="button" onClick={() => onRemovePlayer(index)} className="p-1.5 text-status-error hover:bg-status-error/10 rounded transition-colors" title="Delete Player">
                <Delete set="bold" className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
