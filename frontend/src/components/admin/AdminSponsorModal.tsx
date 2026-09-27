import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface AdminSponsorModalProps {
  editingItem?: any;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminSponsorModal: React.FC<AdminSponsorModalProps> = ({ editingItem, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tier, setTier] = useState('GOLD');
  const [website, setWebsite] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setLogoUrl(editingItem.logo_url);
      setTier(editingItem.tier || 'GOLD');
      setWebsite(editingItem.website || '');
      setDisplayOrder(editingItem.display_order || 0);
    } else {
      setName('');
      setLogoUrl('');
      setTier('GOLD');
      setWebsite('');
      setDisplayOrder(0);
    }
  }, [editingItem]);

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
      onSaved();
    } catch (err) {
      alert('Error saving sponsor');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-md rounded-xl border border-surface-border overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-surface-border bg-surface-bg flex justify-between items-center shrink-0">
          <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">
            {editingItem ? 'Edit Sponsor' : 'New Sponsor'}
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg text-2xl leading-none">&times;</button>
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
          <button onClick={onClose} className="btn-outline text-xs">Cancel</button>
          <button form="sponsor-form" type="submit" className="btn-primary text-xs">Save Sponsor</button>
        </div>
      </div>
    </div>
  );
};
