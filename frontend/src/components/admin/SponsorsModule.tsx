import React, { useState, useEffect } from 'react';
import { EditSquare, Delete, Plus } from 'react-iconly';
import { api } from '../../lib/api';

export const SponsorsModule: React.FC = () => {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tier, setTier] = useState('GOLD');
  const [website, setWebsite] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      setLogoUrl(res.url);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Error uploading file'));
    } finally {
      setIsUploading(false);
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setLogoUrl(item.logo_url);
      setTier(item.tier || 'GOLD');
      setWebsite(item.website || '');
      setDisplayOrder(item.display_order || 0);
    } else {
      setEditingItem(null);
      setName('');
      setLogoUrl('');
      setTier('GOLD');
      setWebsite('');
      setDisplayOrder(0);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminSaveSponsor({
        id: editingItem?.id,
        name: name.trim(),
        logo_url: logoUrl.trim(),
        tier,
        website: website.trim(),
        display_order: displayOrder
      });
      setIsModalOpen(false);
      fetchSponsors();
    } catch (err) {
      alert('Error saving sponsor');
    }
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-md rounded-xl border border-surface-border overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-surface-border bg-surface-bg flex justify-between items-center shrink-0">
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">
                {editingItem ? 'Edit Sponsor' : 'New Sponsor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark-muted hover:text-dark-bg text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <form id="sponsor-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="admin-label">Sponsor Name *</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="admin-input" placeholder="Name" />
                </div>
                <div>
                  <label className="admin-label">Sponsor Logo *</label>
                  <div className="flex gap-2">
                    <input 
                      required 
                      type="text" 
                      value={logoUrl} 
                      onChange={e => setLogoUrl(e.target.value)} 
                      className="admin-input flex-1" 
                      placeholder="Paste logo URL or upload from device..." 
                    />
                    <label className="btn-outline text-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <span>{isUploading ? 'Uploading...' : '📁 Upload Logo'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {logoUrl.trim() && (
                    <div className="mt-2 flex items-center gap-3 bg-surface-bg p-2 rounded border border-surface-border">
                      <span className="text-[10px] text-dark-muted font-bold uppercase">Preview:</span>
                      <div className="h-10 w-24 flex items-center justify-center overflow-hidden">
                        <img 
                          src={logoUrl.trim()} 
                          alt="Logo Preview" 
                          className="max-h-full max-w-[96%] object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Tier *</label>
                    <select value={tier} onChange={e => setTier(e.target.value)} className="admin-input">
                      <option value="TITLE">Title Sponsor</option>
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="PARTNER">Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Display Order</label>
                    <input type="number" value={displayOrder} onChange={e => setDisplayOrder(parseInt(e.target.value))} className="admin-input" />
                  </div>
                </div>
                <div>
                  <label className="admin-label">Website</label>
                  <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className="admin-input" placeholder="https://..." />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-surface-border bg-surface-bg flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="btn-outline text-xs">Cancel</button>
              <button form="sponsor-form" type="submit" className="btn-primary text-xs">Save Sponsor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
