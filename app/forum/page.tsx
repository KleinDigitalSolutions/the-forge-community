'use client';

import { useEffect, useState, type FormEvent, useRef } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import {
  MessageSquare, Send, ArrowUp, ArrowDown, Users,
  Quote, Reply, MessageCircle, Edit2, Trash2, Image as ImageIcon, Eye, Code, X,
  Sparkles, Lightbulb, CheckCircle, Search, Target,
  TrendingUp, Trophy, Home, Hash, Zap, Bell, Info, Filter, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MicroExpander } from '@/app/components/ui/MicroExpander';
import { LinkPreview, extractUrls } from '@/app/components/LinkPreview';
import { VoiceInput } from '@/app/components/VoiceInput';
import { TrendingTopics } from '@/app/components/TrendingTopics';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Comment {
  author: string;
  content: string;
  time: string;
}

interface ForumPost {
  id: string;
  author: string;
  founderNumber: number;
  content: string;
  createdTime: string;
  likes: number;
  category: string;
  userVote?: number;
  comments?: Comment[];
}

interface UserProfile {
  name: string;
  founderNumber: number;
  email: string;
  karma?: number;
}

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [content, setContent] = useState('');
  const [activeChannel, setActiveChannel] = useState('All');
  const [sortMode, setSortMode] = useState('Hot');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiMenuOpen, setAiMenuOpen] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{postId: string; content: string; action: string} | null>(null);
  const [moderationWarning, setModerationWarning] = useState<{number: number; message: string; banned: boolean} | null>(null);

  const FEEDS = [
    { id: 'All', name: 'Home Feed', icon: Home },
    { id: 'Popular', name: 'Popular', icon: Zap },
  ];

  const CHANNELS = [
    { id: 'General', name: 'General', icon: MessageSquare },
    { id: 'Ideas', name: 'Ideen & Feedback', icon: Lightbulb },
    { id: 'Growth', name: 'Growth & Marketing', icon: TrendingUp },
    { id: 'Tech', name: 'Tech & Tools', icon: Code },
    { id: 'Wins', name: 'Wins & Success', icon: Trophy },
    { id: 'Support', name: 'Hilfe & Support', icon: Users },
  ];

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) setUser(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forum');
      if (response.ok) setPosts(await response.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  const handleVote = async (id: string, delta: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const currentVote = p.userVote || 0;
      let newLikes = p.likes;
      let newUserVote = 0;
      if (currentVote === delta) { newLikes -= delta; newUserVote = 0; }
      else if (currentVote === 0) { newLikes += delta; newUserVote = delta; }
      else { newLikes += (delta * 2); newUserVote = delta; }
      return { ...p, likes: newLikes, userVote: newUserVote };
    }));
    try {
      await fetch('/api/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta }),
      });
    } catch (e) { fetchPosts(); }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), category: activeChannel === 'All' ? 'General' : activeChannel }),
      });
      if (response.ok) {
        setContent('');
        setEditingPost(null);
        fetchPosts();
      }
    } catch (error) { console.error(error); }
    finally { setIsSubmitting(false); }
  };

  const filteredPosts = activeChannel === 'All' || activeChannel === 'Popular'
    ? posts 
    : posts.filter(p => p.category === activeChannel);

  const NavItem = ({ item, active, onClick }: any) => {
    const Icon = item.icon;
    return (
      <button
        onClick={() => onClick(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
          active 
            ? 'bg-white/10 text-white font-bold' 
            : 'text-white/50 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className={`w-4 h-4 ${active ? 'text-[#D4AF37]' : ''}`} />
        {item.name}
      </button>
    );
  };

  return (
    <AuthGuard>
      <PageShell>
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] gap-8">
          
          {/* LEFT SIDEBAR - Reddit Style Navigation */}
          <aside className="hidden lg:block sticky top-8 h-fit space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 mb-2">Feeds</p>
              {FEEDS.map(f => <NavItem key={f.id} item={f} active={activeChannel === f.id} onClick={setActiveChannel} />)}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 mb-2">Topics</p>
              {CHANNELS.map(c => <NavItem key={c.id} item={c} active={activeChannel === c.id} onClick={setActiveChannel} />)}
            </div>

            <div className="pt-6 border-t border-white/5">
               <button className="w-full flex items-center gap-3 px-3 py-2 text-white/40 hover:text-white transition-all text-xs">
                  <Bell className="w-4 h-4" /> Notifications
               </button>
               <button className="w-full flex items-center gap-3 px-3 py-2 text-white/40 hover:text-white transition-all text-xs">
                  <Info className="w-4 h-4" /> Help Center
               </button>
            </div>
          </aside>

          {/* MAIN FEED */}
          <main className="space-y-4">
            {/* Post Creation Trigger */}
            <div className="bg-[#121212] border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-700 flex items-center justify-center text-black font-black text-sm">
                {user?.name?.charAt(0)}
              </div>
              <button 
                onClick={() => setEditingPost('NEW')}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-4 py-2.5 text-sm text-left text-white/40 transition-all"
              >
                Was brennt dir auf der Seele?
              </button>
              <div className="flex gap-1">
                <button onClick={() => setEditingPost('NEW')} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"><ImageIcon className="w-5 h-5" /></button>
                <button onClick={() => setEditingPost('NEW')} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"><Plus className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Sort Bar */}
            <div className="bg-[#121212] border border-white/10 rounded-xl p-2 flex items-center gap-2">
              {['Hot', 'New', 'Top'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    sortMode === mode ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {mode === 'Hot' && <Zap className="w-3.5 h-3.5" />}
                  {mode === 'New' && <Plus className="w-3.5 h-3.5" />}
                  {mode === 'Top' && <TrendingUp className="w-3.5 h-3.5" />}
                  {mode}
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="space-y-3">
              {loading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Loading Intelligence...</p>
                </div>
              ) : filteredPosts.map(post => (
                <div key={post.id} className="bg-[#121212] border border-white/10 rounded-xl flex hover:border-white/20 transition-all group overflow-hidden">
                  {/* Vote Sidebar */}
                  <div className="w-12 bg-black/20 flex flex-col items-center py-4 gap-1 shrink-0">
                    <button 
                      onClick={() => handleVote(post.id, 1)}
                      className={`p-1.5 rounded-md transition-all ${post.userVote === 1 ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className={`text-xs font-bold ${post.userVote === 1 ? 'text-[#D4AF37]' : post.userVote === -1 ? 'text-blue-400' : 'text-white/60'}`}>
                      {post.likes}
                    </span>
                    <button 
                      onClick={() => handleVote(post.id, -1)}
                      className={`p-1.5 rounded-md transition-all ${post.userVote === -1 ? 'text-blue-400 bg-blue-400/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-white/40 mb-3">
                      <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[8px] text-[#D4AF37] font-bold">
                        {post.author.charAt(0)}
                      </div>
                      <span className="font-bold text-white/80">u/{post.author.replace(/\s/g, '').toLowerCase()}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(post.createdTime), { addSuffix: true, locale: de })}</span>
                      <span className="ml-auto bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{post.category}</span>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none mb-4 group-hover:text-white transition-colors">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                      <button className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.comments?.length || 0} Comments
                      </button>
                      <button className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all">
                        <Sparkles className="w-3.5 h-3.5" /> AI Insight
                      </button>
                      <button className="ml-auto p-1.5 text-white/20 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden xl:block sticky top-8 h-fit space-y-6">
            {/* User Profile Widget */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="h-16 bg-gradient-to-r from-[#D4AF37] to-amber-900 opacity-50" />
              <div className="px-6 pb-6 -mt-8">
                <div className="w-16 h-16 rounded-2xl bg-[#121212] border-4 border-[#050505] flex items-center justify-center text-2xl font-black text-[#D4AF37] mb-4">
                  {user?.name?.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{user?.name}</h3>
                <p className="text-xs text-white/40 mb-4">Founder ID #{user?.founderNumber}</p>
                <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/40">Karma</span>
                  <span className="text-[#D4AF37]">{user?.karma || 0}</span>
                </div>
                <button 
                  onClick={() => setEditingPost('NEW')}
                  className="w-full mt-6 bg-[#D4AF37] text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all"
                >
                  Beitrag erstellen
                </button>
              </div>
            </div>

            {/* Trending Widget */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
              <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" /> Trending Topics
              </h4>
              <TrendingTopics />
            </div>

            {/* Guidelines Widget */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
              <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Community Rules</h4>
              <ul className="space-y-3">
                {['Add Value', 'Be Respectful', 'No Spam', 'Share Knowledge'].map((rule, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-white/60">
                    <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>

        {/* POSTING MODAL (Keep as is but style slightly cleaner) */}
        <AnimatePresence>
          {editingPost === 'NEW' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h2 className="text-xl font-bold text-white">Neuer Beitrag</h2>
                  <button onClick={() => setEditingPost(null)} className="text-white/20 hover:text-white text-xl">✕</button>
                </div>
                <div className="p-8 space-y-6 overflow-y-auto">
                  <textarea
                    autoFocus
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Erzähl uns was neues..."
                    className="w-full min-h-[300px] bg-transparent border-none outline-none text-lg text-white placeholder:text-white/10 resize-none"
                  />
                </div>
                <div className="p-6 border-t border-white/5 flex justify-end gap-4 bg-white/[0.02]">
                  <button onClick={() => setEditingPost(null)} className="px-6 py-2 text-xs font-bold text-white/20 hover:text-white uppercase tracking-widest">Cancel</button>
                  <button 
                    onClick={handleSubmit} disabled={isSubmitting || !content.trim()}
                    className="bg-[#D4AF37] text-black px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10 disabled:opacity-20 transition-all"
                  >
                    Posten
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageShell>
    </AuthGuard>
  );
}