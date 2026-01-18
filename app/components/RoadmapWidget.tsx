'use client';

import { useEffect, useState, useCallback } from 'react';
import { toggleVote, getRoadmapItems } from '@/app/actions';
import { Loader2, ArrowUp } from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  votes: number;
  hasVoted: boolean;
}

export function RoadmapWidget() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const data = await getRoadmapItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch roadmap", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleVote = async (id: string) => {
    // Optimistic Update
    setItems(current => 
      current.map(item => 
        item.id === id 
          ? { ...item, votes: item.hasVoted ? item.votes - 1 : item.votes + 1, hasVoted: !item.hasVoted }
          : item
      )
    );

    try {
      await toggleVote(id);
      // Optional: Refresh to sync with server state (karma, etc)
      // fetchItems(); 
    } catch (error) {
      console.error("Vote failed", error);
      // Revert on error
      setItems(current => 
        current.map(item => 
          item.id === id 
            ? { ...item, votes: item.hasVoted ? item.votes + 1 : item.votes - 1, hasVoted: !item.hasVoted }
            : item
        )
      );
    }
  };

  if (loading) return (
    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
      <Loader2 className="animate-spin text-zinc-400 w-8 h-8 mb-4" />
      <p className="text-zinc-500 text-sm animate-pulse">Initializing Roadmap...</p>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Squad Roadmap</h3>
          <p className="text-xs text-zinc-500 mt-1">Vote for the next priority</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded-md text-zinc-500">Live</span>
      </div>
      
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-zinc-100 rounded-2xl">
            <p className="text-zinc-400 text-sm">No roadmap items found for your squad.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="group flex items-start gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all">
              <button 
                onClick={() => handleVote(item.id)}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all ${
                  item.hasVoted 
                    ? 'bg-zinc-900 border-zinc-900 text-white' 
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
                }`}
              >
                <ArrowUp className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-bold">{item.votes}</span>
              </button>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-900 text-sm group-hover:text-[var(--accent)] transition-colors">{item.title}</h4>
                <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{item.description}</p>
              </div>
              <div className="ml-2">
                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                   item.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                   item.status === 'DONE' ? 'bg-green-100 text-green-700 border border-green-200' :
                   'bg-white text-zinc-400 border border-zinc-200'
                 }`}>
                   {item.status.replace('_', ' ')}
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
