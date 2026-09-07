import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Play, Image, Video, CloseSquare } from 'react-iconly';

export const GalleryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        const data = await api.getGallery();
        setItems(data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadGallery();
  }, []);

  const isVideo = (item: any) => {
    if (item.media_type === 'VIDEO') return true;
    if (typeof item.image_url === 'string' && (
      item.image_url.endsWith('.mp4') ||
      item.image_url.endsWith('.webm') ||
      item.image_url.includes('youtube.com') ||
      item.image_url.includes('vimeo.com')
    )) {
      return true;
    }
    return false;
  };

  const filteredItems = items.filter(item => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'VIDEO') return isVideo(item);
    if (activeFilter === 'IMAGE') return !isVideo(item);
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d3748] pb-6">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            TOURNAMENT <span className="text-gold">GALLERY</span>
          </h1>
          <p className="text-xs sm:text-sm text-dark-muted">Official photo & video highlights from the MULSU_ICC 2026 Champions Cup.</p>
        </div>

        {/* Media Filters */}
        <div className="flex items-center gap-2 bg-[#0f1115] p-1.5 rounded-lg border border-gray-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition ${
              activeFilter === 'ALL' ? 'bg-gold text-black' : 'text-dark-muted hover:text-white'
            }`}
          >
            All Media ({items.length})
          </button>
          <button
            onClick={() => setActiveFilter('IMAGE')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition flex items-center gap-1.5 ${
              activeFilter === 'IMAGE' ? 'bg-gold text-black' : 'text-dark-muted hover:text-white'
            }`}
          >
            <Image set="bold" className="w-3.5 h-3.5" />
            Photos ({items.filter(i => !isVideo(i)).length})
          </button>
          <button
            onClick={() => setActiveFilter('VIDEO')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition flex items-center gap-1.5 ${
              activeFilter === 'VIDEO' ? 'bg-gold text-black' : 'text-dark-muted hover:text-white'
            }`}
          >
            <Video set="bold" className="w-3.5 h-3.5" />
            Videos ({items.filter(i => isVideo(i)).length})
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card-dark p-12 text-center text-dark-muted">No media items uploaded in this section yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const itemIsVideo = isVideo(item);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="card-dark overflow-hidden hover:border-gold cursor-pointer transition group aspect-video sm:aspect-square relative bg-[#0f1115]"
              >
                {itemIsVideo ? (
                  <div className="w-full h-full relative bg-black flex items-center justify-center">
                    <video src={item.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gold/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition glow-gold">
                        <Play set="bold" className="w-6 h-6 fill-black ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 text-gold text-[10px] font-extrabold flex items-center gap-1 uppercase border border-gold/40">
                      <Video set="bold" className="w-3 h-3" /> Video
                    </span>
                  </div>
                ) : (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition p-4 flex flex-col justify-end">
                  <p className="font-heading font-bold text-white text-xs">{item.title}</p>
                  <p className="text-[10px] text-gold">{item.album_name || 'General'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#0f1115] border border-gray-800 rounded-xl overflow-hidden shadow-2xl space-y-4 p-4">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:text-gold hover:bg-black transition"
            >
              <CloseSquare set="bold" className="w-6 h-6" />
            </button>

            <div className="flex items-center justify-center min-h-[300px] max-h-[75vh] bg-black rounded-lg overflow-hidden">
              {isVideo(selectedItem) ? (
                <video
                  src={selectedItem.image_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              ) : (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-800 pt-3 px-2">
              <div>
                <h3 className="font-heading font-bold text-white text-base">{selectedItem.title}</h3>
                {selectedItem.caption && <p className="text-xs text-dark-muted mt-1">{selectedItem.caption}</p>}
              </div>
              <span className="px-3 py-1 rounded bg-gold/10 border border-gold/30 text-gold text-xs font-bold">
                {selectedItem.album_name || 'General'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
