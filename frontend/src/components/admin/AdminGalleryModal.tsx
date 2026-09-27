import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface AdminGalleryModalProps {
  editingItem?: any;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminGalleryModal: React.FC<AdminGalleryModalProps> = ({ editingItem, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');
  const [albumName, setAlbumName] = useState('General');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setImageUrl(editingItem.image_url);
      setMediaType(editingItem.media_type || 'IMAGE');
      setAlbumName(editingItem.album_name || 'General');
      setCaption(editingItem.caption || '');
    } else {
      setTitle('');
      setImageUrl('');
      setMediaType('IMAGE');
      setAlbumName('General');
      setCaption('');
    }
  }, [editingItem]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      setImageUrl(res.url);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Error uploading file'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminSaveGallery({
        id: editingItem?.id,
        title,
        image_url: imageUrl,
        media_type: mediaType,
        album_name: albumName,
        caption
      });
      onSaved();
    } catch (err) {
      alert('Error saving gallery item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-md rounded-xl border border-surface-border overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-surface-border bg-surface-bg flex justify-between items-center shrink-0">
          <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">
            {editingItem ? 'Edit Media' : 'New Media'}
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <form id="gallery-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="admin-label">Title *</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="admin-input" placeholder="Media Title" />
            </div>
            <div>
              <label className="admin-label">Media Asset *</label>
              <div className="flex gap-2">
                <input 
                  required 
                  type="text" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  className="admin-input flex-1" 
                  placeholder="Paste media URL or upload from device..." 
                />
                <label className="btn-outline text-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <span>{isUploading ? 'Uploading...' : '📁 Upload File'}</span>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={handleFileUpload} 
                    disabled={isUploading}
                    className="hidden" 
                  />
                </label>
              </div>
              {imageUrl.trim() && mediaType === 'IMAGE' && (
                <div className="mt-2 flex items-center gap-3 bg-surface-bg p-2 rounded border border-surface-border">
                  <span className="text-[10px] text-dark-muted font-bold uppercase">Preview:</span>
                  <div className="h-16 w-28 flex items-center justify-center overflow-hidden rounded bg-black">
                    <img 
                      src={imageUrl.trim()} 
                      alt="Preview" 
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
                <label className="admin-label">Type *</label>
                <select value={mediaType} onChange={e => setMediaType(e.target.value)} className="admin-input">
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Album *</label>
                <input required type="text" value={albumName} onChange={e => setAlbumName(e.target.value)} className="admin-input" placeholder="e.g. General" />
              </div>
            </div>
            <div>
              <label className="admin-label">Caption</label>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} className="admin-input min-h-[80px]" placeholder="Optional caption..."></textarea>
            </div>
          </form>
        </div>
        
        <div className="p-4 border-t border-surface-border bg-surface-bg flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-outline text-xs">Cancel</button>
          <button form="gallery-form" type="submit" className="btn-primary text-xs">Save Media</button>
        </div>
      </div>
    </div>
  );
};
