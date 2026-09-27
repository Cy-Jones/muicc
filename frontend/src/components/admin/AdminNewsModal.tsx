import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface AdminNewsModalProps {
  newsItem?: any;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminNewsModal: React.FC<AdminNewsModalProps> = ({ newsItem, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (newsItem) {
      setTitle(newsItem.title);
      setCategory(newsItem.category);
      setContent(newsItem.content);
      setImageUrl(newsItem.image_url || '');
      setIsPublished(newsItem.is_published === 1);
      setPublishDate(newsItem.publish_date);
    } else {
      setTitle('');
      setCategory('ANNOUNCEMENT');
      setContent('');
      setImageUrl('');
      setIsPublished(true);
      setPublishDate(new Date().toISOString().split('T')[0]);
    }
  }, [newsItem]);

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
      await api.adminSaveNews({
        id: newsItem?.id,
        title,
        category,
        content,
        image_url: imageUrl.trim(),
        is_published: isPublished,
        publish_date: publishDate
      });
      onSaved();
    } catch (err) {
      alert('Error saving news');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-2xl rounded-xl border border-surface-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-surface-border bg-surface-bg flex justify-between items-center shrink-0">
          <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">
            {newsItem ? 'Edit Article' : 'New Article'}
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <form id="news-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="admin-label">Title *</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="admin-input" placeholder="Article Title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="admin-input">
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="MATCH_REPORT">Match Report</option>
                  <option value="PRESS_RELEASE">Press Release</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Publish Date *</label>
                <input required type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} className="admin-input" />
              </div>
            </div>
            <div>
              <label className="admin-label">Article Image</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  className="admin-input flex-1" 
                  placeholder="Paste image URL or choose file from device..." 
                />
                <label className="btn-outline text-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <span>{isUploading ? 'Uploading...' : '📁 Upload Image'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    disabled={isUploading}
                    className="hidden" 
                  />
                </label>
              </div>
              {imageUrl.trim() && (
                <div className="mt-2.5">
                  <p className="text-[10px] text-dark-muted font-bold uppercase tracking-wider mb-1">Image Preview</p>
                  <div className="w-full h-36 rounded-lg overflow-hidden border border-surface-border bg-surface-bg relative">
                    <img 
                      src={imageUrl.trim()} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="admin-label">Content *</label>
              <textarea required value={content} onChange={e => setContent(e.target.value)} className="admin-input min-h-[150px]" placeholder="Article content..."></textarea>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="published" className="text-xs font-bold text-dark-bg uppercase tracking-widest">Publish Immediately</label>
            </div>
          </form>
        </div>
        
        <div className="p-4 border-t border-surface-border bg-surface-bg flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-outline text-xs">Cancel</button>
          <button form="news-form" type="submit" className="btn-primary text-xs">Save Article</button>
        </div>
      </div>
    </div>
  );
};
