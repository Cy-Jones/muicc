import React, { useState, useEffect } from 'react';
import { EditSquare, Delete, Plus, Image } from 'react-iconly';
import { api } from '../../lib/api';
import { AdminGalleryModal } from './AdminGalleryModal';

export const GalleryModule: React.FC = () => {
  const [gallery, setGallery] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

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

  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
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
                    <div className="text-dark-bg"><Image set="bold" className="w-8 h-8 opacity-50" /></div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(item)} className="p-1.5 bg-dark-bg/80 text-dark-bg rounded hover:bg-brand">
                      <EditSquare set="bold" className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-dark-bg/80 text-dark-bg rounded hover:bg-status-error">
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
        <AdminGalleryModal 
          editingItem={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchGallery();
          }}
        />
      )}
    </div>
  );
};
