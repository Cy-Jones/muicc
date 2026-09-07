import React, { useState, useEffect } from 'react';
import { EditSquare, Delete, Plus } from 'react-iconly';
import { api } from '../../lib/api';

export const NewsModule: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      // Need an admin endpoint or we can use public. Wait, public getNews only gets published news!
      // I should update the backend or use a workaround. Wait, let me check the api again. 
      const data = await api.adminGetNews(); 
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const openModal = (newsItem?: any) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setTitle(newsItem.title);
      setCategory(newsItem.category);
      setContent(newsItem.content);
      setImageUrl(newsItem.image_url || '');
      setIsPublished(newsItem.is_published === 1);
      setPublishDate(newsItem.publish_date);
    } else {
      setEditingNews(null);
      setTitle('');
      setCategory('ANNOUNCEMENT');
      setContent('');
      setImageUrl('');
      setIsPublished(true);
      setPublishDate(new Date().toISOString().split('T')[0]);
    }
    setIsModalOpen(true);
  };

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
        id: editingNews?.id,
        title,
        category,
        content,
        image_url: imageUrl.trim(),
        is_published: isPublished,
        publish_date: publishDate
      });
      setIsModalOpen(false);
      fetchNews();
    } catch (err) {
      alert('Error saving news');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this news article?')) return;
    try {
      await api.adminDeleteNews(id);
      fetchNews();
    } catch (err) {
      alert('Error deleting news');
    }
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-bg flex items-center justify-between">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">News Management</h2>
        <button onClick={() => openModal()} className="btn-primary text-xs flex items-center gap-2">
          <Plus set="bold" className="w-4 h-4" /> Add Article
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-dark-bg">
          <thead className="bg-surface-bg text-dark-muted border-b border-surface-border">
            <tr>
              <th className="p-4 w-16">Cover</th>
              <th className="p-4">Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-dark-muted">Loading...</td></tr>
            ) : news.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-dark-muted">No news articles found.</td></tr>
            ) : (
              news.map((item) => (
                <tr key={item.id} className="hover:bg-surface-bg transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-8 rounded overflow-hidden bg-surface-bg border border-surface-border relative">
                      <img 
                        src={item.image_url && item.image_url.trim() ? item.image_url.trim() : 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop'} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop';
                        }}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-dark-bg">{item.title}</div>
                    <div className="text-brand font-mono text-[9px] lowercase">{item.slug}</div>
                  </td>
                  <td className="p-4 text-dark-muted">{item.category}</td>
                  <td className="p-4">{item.publish_date}</td>
                  <td className="p-4">
                    <span className={`status-badge ${item.is_published ? 'status-completed' : 'status-warning'}`}>
                      {item.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
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
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-2xl rounded-xl border border-surface-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-surface-border bg-surface-bg flex justify-between items-center shrink-0">
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">
                {editingNews ? 'Edit Article' : 'New Article'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark-muted hover:text-dark-bg text-2xl leading-none">&times;</button>
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
              <button onClick={() => setIsModalOpen(false)} className="btn-outline text-xs">Cancel</button>
              <button form="news-form" type="submit" className="btn-primary text-xs">Save Article</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
