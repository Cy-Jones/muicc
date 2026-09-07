import React, { useState, useEffect } from 'react';
import { EditSquare, Delete, Plus, Image } from 'react-iconly';
import { api } from '../../lib/api';

export const GalleryModule: React.FC = () => {
  const [gallery, setGallery] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');
  const [albumName, setAlbumName] = useState('General');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGallery(); 
      setGallery(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

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

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setImageUrl(item.image_url);
      setMediaType(item.media_type || 'IMAGE');
      setAlbumName(item.album_name || 'General');
      setCaption(item.caption || '');
    } else {
      setEditingItem(null);
      setTitle('');
      setImageUrl('');
      setMediaType('IMAGE');
      setAlbumName('General');
      setCaption('');
    }
    setIsModalOpen(true);
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
      setIsModalOpen(false);
      fetchGallery();
    } catch (err) {
      alert('Error saving gallery item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media item?')) return;
    try {
      await api.adminDeleteGallery(id);
      fetchGallery();
    } catch (err) {
      alert('Error deleting gallery item');
    }
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-bg flex items-center justify-between">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Gallery Management</h2>
        <button onClick={() => openModal()} className="btn-primary text-xs flex items-center gap-2">
          <Plus set="bold" className="w-4 h-4" /> Add Media
        </button>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="text-center text-dark-muted py-8 font-bold uppercase tracking-widest text-xs">Loading...</div>
        ) : gallery.length === 0 ? (
          <div className="text-center text-dark-muted py-8 font-bold uppercase tracking-widest text-xs">No media uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {gallery.map((item) => (
              <div key={item.id} className="bg-surface-bg border border-surface-border rounded-lg overflow-hidden group relative">
                <div className="aspect-square relative overflow-hidden bg-black flex items-center justify-center">
                  {item.media_type === 'IMAGE' ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="text-white"><Image set="bold" className="w-8 h-8 opacity-50" /></div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(item)} className="p-1.5 bg-dark-bg/80 text-white rounded hover:bg-brand">
                      <EditSquare set="bold" className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-dark-bg/80 text-white rounded hover:bg-status-error">
                      <Delete set="bold" className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-black text-dark-bg truncate">{item.title}</div>
                  <div className="text-[9px] font-bold text-dark-muted uppercase tracking-widest">{item.album_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-md rounded-xl border border-surface-border overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-surface-border bg-surface-bg flex justify-between items-center shrink-0">
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">
                {editingItem ? 'Edit Media' : 'New Media'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark-muted hover:text-dark-bg text-2xl leading-none">&times;</button>
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
              <button onClick={() => setIsModalOpen(false)} className="btn-outline text-xs">Cancel</button>
              <button form="gallery-form" type="submit" className="btn-primary text-xs">Save Media</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
