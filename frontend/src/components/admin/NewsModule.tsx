import React, { useState, useEffect } from 'react';
import { EditSquare, Delete, Plus, Show, Hide } from 'react-iconly';
import { api } from '../../lib/api';
import { AdminNewsModal } from './AdminNewsModal';

export const NewsModule: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any | null>(null);

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
    setEditingNews(newsItem || null);
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (item: any) => {
    try {
      await api.adminSaveNews({
        id: item.id,
        title: item.title,
        category: item.category,
        content: item.content,
        image_url: item.image_url || '',
        is_published: !item.is_published,
        publish_date: item.publish_date
      });
      fetchNews();
    } catch (err) {
      alert('Error updating news status');
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
                    <button 
                      onClick={() => handleTogglePublish(item)} 
                      className={`p-1.5 rounded transition-colors ${item.is_published ? 'text-status-warning hover:bg-status-warning/10' : 'text-status-completed hover:bg-status-completed/10'}`}
                      title={item.is_published ? 'Hide Article' : 'Publish Article'}
                    >
                      {item.is_published ? <Hide set="bold" className="w-4 h-4" /> : <Show set="bold" className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openModal(item)} className="p-1.5 text-brand hover:bg-brand/10 rounded transition-colors" title="Edit Article">
                      <EditSquare set="bold" className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-status-error hover:bg-status-error/10 rounded transition-colors" title="Delete Article">
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
        <AdminNewsModal 
          newsItem={editingNews} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={() => {
            setIsModalOpen(false);
            fetchNews();
          }} 
        />
      )}
    </div>
  );
};
