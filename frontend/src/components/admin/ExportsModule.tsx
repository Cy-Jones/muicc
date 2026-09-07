import React from 'react';
import { Document, Download } from 'react-iconly';
import { api } from '../../lib/api';

export const ExportsModule: React.FC = () => {
  
  const exportCards = [
    { title: 'Teams Roster', description: 'Export all approved teams and their players into an official PDF report.', type: 'teams', color: 'text-brand' },
    { title: 'Players Directory', description: 'Generate a master list of all players and their statuses.', type: 'players', color: 'text-amber-500' },
    { title: 'Matches Schedule', description: 'Download the full tournament fixture and results.', type: 'matches', color: 'text-green-500' },
    { title: 'Fan Predictions', description: 'Export all public fan predictions and submissions.', type: 'predictions', color: 'text-purple-500' }
  ];

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-bg flex items-center justify-between">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Data Exports</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {exportCards.map((card) => (
            <div key={card.type} className="bg-surface-bg border border-surface-border rounded-xl p-6 text-center hover:shadow-card-hover transition-all flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full bg-surface-card border border-surface-border flex items-center justify-center mb-4 ${card.color}`}>
                <Document set="bold" className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">{card.title}</h3>
              <p className="text-xs text-dark-muted mt-2 font-medium leading-relaxed flex-1">{card.description}</p>
              
              <a 
                href={api.getExportPdfUrl(card.type)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 w-full btn-primary text-xs flex items-center justify-center gap-2"
              >
                <Download set="bold" className="w-4 h-4" /> Download PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
