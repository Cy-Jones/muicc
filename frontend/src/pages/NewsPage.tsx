import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Calendar, ArrowRight, CloseSquare } from 'react-iconly';

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop';

export const NewsPage: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    async function loadNews() {
      try {
        const data = await api.getNews();
        setNews(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadNews();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-[96%] px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      <motion.div variants={itemVariants} className="border-b border-surface-border pb-6">
        <h1 className="font-heading text-4xl sm:text-5xl font-black text-dark-bg uppercase tracking-tight">
          NEWS & <span className="text-brand text-glow">ANNOUNCEMENTS</span>
        </h1>
        <p className="text-sm text-dark-muted mt-2 font-medium">Official tournament updates, press releases, and match reports for MIUCC 2026.</p>
      </motion.div>

      {news.length === 0 ? (
        <motion.div variants={itemVariants} className="data-card p-16 text-center text-dark-muted font-bold uppercase tracking-widest text-sm">No published news available yet.</motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {news.map((item) => {
            const articleImage = item.image_url && item.image_url.trim() ? item.image_url.trim() : DEFAULT_NEWS_IMAGE;
            return (
              <motion.div variants={itemVariants} key={item.id} onClick={() => setSelectedArticle(item)} className="data-card overflow-hidden hover:-translate-y-2 hover:border-brand/40 cursor-pointer transition-all duration-300 flex flex-col justify-between group p-0">
                <div className="aspect-[16/10] bg-surface-bg overflow-hidden relative">
                  <img 
                    src={articleImage} 
                    alt={item.title} 
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_NEWS_IMAGE) {
                        target.src = DEFAULT_NEWS_IMAGE;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card to-transparent opacity-60"></div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between bg-surface-card z-10 -mt-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[10px] text-dark-muted font-bold uppercase tracking-widest">
                      <span className="px-2.5 py-1 rounded bg-brand/10 text-brand border border-brand/30">{item.category}</span>
                      <span className="flex items-center gap-1.5"><Calendar set="bold" className="w-3.5 h-3.5 text-brand" /> {item.publish_date}</span>
                    </div>

                    <h3 className="font-heading text-xl font-black text-dark-bg group-hover:text-brand transition-colors line-clamp-2 leading-snug">{item.title}</h3>
                    <p className="text-xs text-dark-muted line-clamp-3 leading-relaxed font-medium">{item.content}</p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-surface-border text-[10px] font-black uppercase tracking-widest text-brand flex items-center gap-1.5 group-hover:text-dark-bg transition-colors">
                    Read Full Article <ArrowRight set="bold" className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedArticle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="data-card max-w-3xl w-full p-0 space-y-0 relative border-brand/40 my-8">
              <button onClick={() => setSelectedArticle(null)} className="absolute top-5 right-5 text-dark-muted hover:text-dark-bg text-xl font-bold z-20 bg-surface-bg/80 backdrop-blur p-2 rounded-full transition-colors">
                <CloseSquare set="bold" className="w-5 h-5" />
              </button>
              
              <div className="w-full h-64 sm:h-80 relative">
                <img 
                  src={selectedArticle.image_url && selectedArticle.image_url.trim() ? selectedArticle.image_url.trim() : DEFAULT_NEWS_IMAGE} 
                  alt={selectedArticle.title} 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_NEWS_IMAGE) {
                      target.src = DEFAULT_NEWS_IMAGE;
                    }
                  }}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-card to-transparent"></div>
              </div>
              
              <div className="p-8 sm:p-10 space-y-6 relative z-10 bg-surface-card">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-dark-muted">
                    <span className="px-3 py-1 rounded bg-brand/10 text-brand border border-brand/30">{selectedArticle.category}</span>
                    <span className="flex items-center gap-1.5"><Calendar set="bold" className="w-3.5 h-3.5 text-brand" /> {selectedArticle.publish_date}</span>
                  </div>
                  <h2 className="font-heading text-3xl sm:text-4xl font-black text-dark-bg leading-tight">{selectedArticle.title}</h2>
                </div>
                
                <div className="text-sm text-slate-200 leading-loose whitespace-pre-line border-t border-surface-border pt-6 font-medium">
                  {selectedArticle.content}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
