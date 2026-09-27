import React from 'react';
import { Star } from 'react-iconly';

interface TeamRegistrationTeamInfoProps {
  formData: any;
  setFormData: (val: any) => void;
  errorMessage: string;
}

export const TeamRegistrationTeamInfo: React.FC<TeamRegistrationTeamInfoProps> = ({
  formData,
  setFormData,
  errorMessage
}) => {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-black text-dark-bg border-b border-dark-border pb-4 flex items-center gap-3 uppercase tracking-widest">
        <Star set="bold" className="w-5 h-5 text-gold" /> Official Team Information
      </h2>

      {errorMessage && <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/50 text-status-error text-xs font-bold uppercase tracking-wider">{errorMessage}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Team Name <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Liberia Eagles FC" className="input-field" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">University / Org <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} placeholder="Marwadi University" className="input-field" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Country <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <select 
            required
            disabled
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
            className="w-full input-field opacity-70 cursor-not-allowed"
          >  {['Liberia','Eswatini','Tanzania','South Sudan','Zimbabwe','Nigeria','Uganda'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Head Coach Name <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={formData.coach_name} onChange={(e) => setFormData({ ...formData, coach_name: e.target.value })} placeholder="George Weah Jr." className="input-field" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Team Manager Name <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="text" required value={formData.manager_name} onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })} placeholder="Samuel Kollie" className="input-field" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Manager Email <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input type="email" required value={formData.manager_email} onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })} placeholder="manager@university.edu" className="input-field" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Manager Phone <span className="text-status-error">*</span> <span className="text-[8px] font-medium normal-case">(Required)</span></label>
          <input 
            type="tel" 
            required 
            pattern="^\+91 [0-9]{10}$"
            maxLength={14}
            title="Must be a valid 10-digit Indian phone number"
            value={formData.manager_phone} 
            onChange={(e) => {
              let val = e.target.value;
              if (!val.startsWith('+91 ')) {
                val = '+91 ' + val.replace(/^\+?9?1?\s*/, '').replace(/\D/g, '').slice(0, 10);
              } else {
                val = '+91 ' + val.slice(4).replace(/\D/g, '').slice(0, 10);
              }
              setFormData({ ...formData, manager_phone: val });
            }} 
            placeholder="+91 9876543210" 
            className="input-field" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Team Logo URL <span className="text-[8px] font-medium normal-case text-dark-muted">(Optional)</span></label>
          <input type="url" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://..." className="input-field" />
        </div>
      </div>
    </div>
  );
};
