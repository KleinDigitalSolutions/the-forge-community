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
import Link from 'next/link';
import { MicroExpander } from '@/app/components/ui/MicroExpander';
import { LinkPreview, extractUrls } from '@/app/components/LinkPreview';
import { RelatedPosts } from '@/app/components/RelatedPosts';
import { VoiceInput } from '@/app/components/VoiceInput';
import { TrendingTopics } from '@/app/components/TrendingTopics';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Comment {
  id: string;
  authorId?: string | null;
  author: string;
  content: string;
  time: string;
}

export interface ForumPost {
  id: string;
  authorId?: string | null;
  author: string;
  authorImage?: string | null;
  authorSlug?: string | null;
  founderNumber: number;
  content: string;
  createdTime: string;
  likes: number;
  category: string;
  userVote?: number;
  comments?: Comment[];
}

export interface UserProfile {
  id?: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: string;
  founderNumber?: number;
  karmaScore?: number;
  credits?: number;
  _count?: {
    ventures: number;
    squadMemberships: number;
  };
}

interface ForumClientProps {
  initialPosts: ForumPost[];
  initialUser: UserProfile | null;
}

export default function Forum({ initialPosts, initialUser }: ForumClientProps) {
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [content, setContent] = useState('');
  const [activeChannel, setActiveChannel] = useState('All');
  const [sortMode, setSortMode] = useState('Hot');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<string | null>(null);
  const [commentStatus, setCommentStatus] = useState<Record<string, string>>({});
  const [commentEditingId, setCommentEditingId] = useState<string | null>(null);
  const [commentEditDrafts, setCommentEditDrafts] = useState<Record<string, string>>({});
  const [commentEditSubmitting, setCommentEditSubmitting] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiMenuOpen, setAiMenuOpen] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{postId: string; content: string; action: string} | null>(null);
  const [moderationWarning, setModerationWarning] = useState<{number: number; message: string; banned: boolean} | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

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

  const AI_ACTIONS = [
    { id: 'summarize', label: 'Kurzfassung' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'expand', label: 'Weiter ausführen' },
    { id: 'factCheck', label: 'Faktencheck' },
    { id: 'nextSteps', label: 'Nächste Schritte' },
  ];

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) setUser(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async (options: { silent?: boolean } = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) setLoading(true);
      const response = await fetch('/api/forum');
      if (response.ok) setPosts(await response.json());
    } catch (error) { console.error(error); }
    finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialUser) fetchUser();
    if (initialPosts.length === 0) fetchPosts();
  }, [initialPosts.length, initialUser]);

  const handleChannelClick = (id: string) => {
    setActiveChannel(id);
    if (id === 'Popular') {
      setSortMode('Top');
    }
  };

  const resolvePostCategory = () => {
    return CHANNELS.some(c => c.id === activeChannel) ? activeChannel : 'General';
  };

  const sortPosts = (list: ForumPost[], mode: string) => {
    const now = Date.now();
    const hotScore = (post: ForumPost) => {
      const created = new Date(post.createdTime || Date.now()).getTime();
      const ageHours = Math.max(1, (now - created) / 3_600_000);
      const engagement = (post.likes || 0) + (post.comments?.length || 0) + 1;
      return engagement / Math.pow(ageHours + 2, 1.3);
    };

    const clone = [...list];
    switch (mode) {
      case 'New':
        return clone.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
      case 'Top':
        return clone.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'Hot':
      default:
        return clone.sort((a, b) => hotScore(b) - hotScore(a));
    }
  };

  const filteredPosts = (activeChannel === 'All' || activeChannel === 'Popular')
    ? posts
    : posts.filter(p => p.category === activeChannel);

  const postsToRender = sortPosts(filteredPosts, activeChannel === 'Popular' ? 'Top' : sortMode);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('🚀 Übertrage Bild...');
    try {
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const response = await fetch(`/api/forum/upload?filename=${encodeURIComponent(safeName)}`, {
        method: 'POST',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });

      const data = await response.json();
      
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      const markdownImage = `\n![${file.name}](${data.url})\n`;
      
      if (editingPost && editingPost !== 'NEW') {
        setEditContent(prev => prev + markdownImage);
      } else {
        setContent(prev => prev + markdownImage);
      }
      setStatusMessage('✅ Bild bereit!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setStatusMessage(`❌ Fehler: ${error.message}`);
    }
  };

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
      const response = await fetch('/api/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta }),
      });
      if (!response.ok) throw new Error('Vote failed');
      const data = await response.json();
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: data.likes, userVote: data.userVote } : p));
    } catch (e) { fetchPosts({ silent: true }); }
  };

  const toggleComments = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = async (postId: string) => {
    const draft = (commentDrafts[postId] || '').trim();
    if (!draft || commentSubmitting) return;
    setCommentSubmitting(postId);
    try {
      const response = await fetch('/api/forum/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: draft }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Comment failed');
      }
      setPosts(prev => prev.map(post => post.id === postId ? {
        ...post,
        comments: [...(post.comments || []), data],
      } : post));
      setCommentStatus(prev => ({ ...prev, [postId]: '' }));
      setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Comment error:', error);
      setCommentStatus(prev => ({ ...prev, [postId]: 'Kommentar fehlgeschlagen. Bitte erneut.' }));
    } finally {
      setCommentSubmitting(null);
    }
  };

  const startCommentEdit = (comment: Comment) => {
    setCommentEditingId(comment.id);
    setCommentEditDrafts(prev => ({ ...prev, [comment.id]: comment.content }));
  };

  const cancelCommentEdit = () => {
    setCommentEditingId(null);
  };

  const handleCommentEdit = async (postId: string, commentId: string) => {
    const draft = (commentEditDrafts[commentId] || '').trim();
    if (!draft || commentEditSubmitting) return;
    setCommentEditSubmitting(commentId);
    try {
      const response = await fetch('/api/forum/comment/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId, content: draft }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Edit failed');
      }
      setPosts(prev => prev.map(post => post.id === postId ? {
        ...post,
        comments: (post.comments || []).map(comment =>
          comment.id === commentId ? { ...comment, content: data.content } : comment
        ),
      } : post));
      setCommentEditingId(null);
    } catch (error) {
      console.error('Comment edit error:', error);
      setCommentStatus(prev => ({ ...prev, [postId]: 'Kommentar-Update fehlgeschlagen. Bitte erneut.' }));
    } finally {
      setCommentEditSubmitting(null);
    }
  };

  const handleCommentDelete = async (postId: string, commentId: string) => {
    const confirmed = window.confirm('Kommentar wirklich löschen?');
    if (!confirmed) return;
    try {
      const response = await fetch('/api/forum/comment/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId }),
      });
      if (!response.ok) throw new Error('Delete failed');
      setPosts(prev => prev.map(post => post.id === postId ? {
        ...post,
        comments: (post.comments || []).filter(comment => comment.id !== commentId),
      } : post));
    } catch (error) {
      console.error('Comment delete error:', error);
      setCommentStatus(prev => ({ ...prev, [postId]: 'Kommentar konnte nicht gelöscht werden.' }));
    }
  };

  const startEdit = (post: ForumPost) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    setIsPreview(false);
    setModerationWarning(null);
  };

  const startNewPost = () => {
    setEditingPost('NEW');
    setModerationWarning(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Beitrag wirklich loeschen?');
    if (!confirmed) return;
    try {
      const response = await fetch('/api/forum/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Delete failed');
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      fetchPosts({ silent: true });
    }
  };

  const handleAIAction = async (post: ForumPost, action: string) => {
    setAiLoading(true);
    setAiResult(null);
    setAiMenuOpen(post.id);
    try {
      const res = await fetch('/api/forum/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, postContent: post.content, category: post.category })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI fehlgeschlagen');
      setAiResult({ postId: post.id, content: data.content, action: data.action });
    } catch (error) {
      console.error('AI action error:', error);
      setAiResult({ postId: post.id, content: 'AI konnte keine Antwort liefern.', action });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const isEditing = editingPost && editingPost !== 'NEW';
    const draft = (isEditing ? editContent : content).trim();
    if (!draft) return;
    setIsSubmitting(true);
    setModerationWarning(null);
    try {
      if (isEditing && editingPost) {
        const response = await fetch('/api/forum/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost, content: draft }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Edit failed');
        setPosts(prev => prev.map(post => post.id === editingPost ? {
          ...post,
          content: data.content,
          createdTime: post.createdTime,
        } : post));
        setEditContent('');
        setEditingPost(null);
      } else {
        const category = resolvePostCategory();
        const response = await fetch('/api/forum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: draft, category }),
        });
        const data = await response.json();
        if (!response.ok) {
          if (data?.warning) {
            setModerationWarning(data.warning);
            return;
          }
          throw new Error(data?.error || 'Post failed');
        }
        setContent('');
        setEditingPost(null);
        fetchPosts({ silent: true });
      }
    } catch (error) {
      console.error(error);
      setStatusMessage('❌ Beitrag fehlgeschlagen');
      setTimeout(() => setStatusMessage(''), 3000);
    }
    finally { setIsSubmitting(false); }
  };

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
              {FEEDS.map(f => <NavItem key={f.id} item={f} active={activeChannel === f.id} onClick={handleChannelClick} />)}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 mb-2">Topics</p>
              {CHANNELS.map(c => <NavItem key={c.id} item={c} active={activeChannel === c.id} onClick={handleChannelClick} />)}
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
                onClick={startNewPost}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-4 py-2.5 text-sm text-left text-white/40 transition-all"
              >
                Was brennt dir auf der Seele?
              </button>
              <div className="flex gap-1">
                <button onClick={startNewPost} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"><ImageIcon className="w-5 h-5" /></button>
                <button onClick={startNewPost} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"><Plus className="w-5 h-5" /></button>
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
              ) : postsToRender.map(post => {
                const profileHref = post.authorSlug || post.authorId ? `/profile/${post.authorSlug || post.authorId}` : null;

                return (
                <div key={post.id} id={post.id} className="bg-[#121212] border border-white/10 rounded-xl flex hover:border-white/20 transition-all group overflow-hidden">
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
                      {profileHref ? (
                        <Link href={profileHref} className="flex items-center gap-2 hover:text-white transition-colors">
                          <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[8px] text-[#D4AF37] font-bold overflow-hidden">
                            {post.authorImage ? (
                              <img src={post.authorImage} alt={post.author} className="w-full h-full object-cover" />
                            ) : (
                              post.author.charAt(0)
                            )}
                          </div>
                          <span className="font-bold text-white/80">u/{post.author.replace(/\s/g, '').toLowerCase()}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[8px] text-[#D4AF37] font-bold overflow-hidden">
                            {post.authorImage ? (
                              <img src={post.authorImage} alt={post.author} className="w-full h-full object-cover" />
                            ) : (
                              post.author.charAt(0)
                            )}
                          </div>
                          <span className="font-bold text-white/80">u/{post.author.replace(/\s/g, '').toLowerCase()}</span>
                        </div>
                      )}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(post.createdTime), { addSuffix: true, locale: de })}</span>
                      <span className="ml-auto bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{post.category}</span>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none mb-4 group-hover:text-white transition-colors">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          expandedPosts[post.id] ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> {post.comments?.length || 0} Comments
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setAiMenuOpen(aiMenuOpen === post.id ? null : post.id)}
                          className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> {aiLoading && aiMenuOpen === post.id ? 'Lädt...' : 'AI Insight'}
                        </button>
                        {aiMenuOpen === post.id && (
                          <div className="absolute left-0 bottom-full mb-2 w-48 rounded-xl border border-white/10 bg-[#0d0d0d] shadow-2xl z-20">
                            {AI_ACTIONS.map(action => (
                              <button
                                key={action.id}
                                onClick={() => handleAIAction(post, action.id)}
                                className="w-full text-left px-4 py-2 text-[11px] text-white/70 hover:bg-white/5 transition-colors"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {user && user.id && post.authorId === user.id && (
                        <button
                          onClick={() => startEdit(post)}
                          className="p-1.5 text-white/20 hover:text-white transition-all"
                          aria-label="Beitrag bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {user && (user.role === 'ADMIN' || (user.id && post.authorId === user.id)) && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="ml-auto p-1.5 text-white/20 hover:text-white transition-all"
                          aria-label="Beitrag loeschen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {aiResult?.postId === post.id && (
                      <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                          AI · {AI_ACTIONS.find(a => a.id === aiResult.action)?.label || aiResult.action}
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none 
                          prose-headings:text-white prose-headings:font-bold prose-headings:text-sm prose-headings:mb-2 prose-headings:mt-4
                          prose-p:text-white/80 prose-p:my-2
                          prose-strong:text-[#D4AF37] prose-strong:font-bold
                          prose-ul:list-disc prose-ul:pl-4 prose-ul:my-2
                          prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-2
                          prose-li:text-white/70 prose-li:my-1
                          prose-a:text-[#D4AF37] prose-a:underline hover:prose-a:text-white transition-colors
                        ">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {aiResult.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {expandedPosts[post.id] && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
                        <div className="space-y-3">
                          {(post.comments || []).length === 0 ? (
                            <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Noch keine Kommentare.</p>
                          ) : (
                            (post.comments || []).map((comment, idx) => {
                              const isAI = comment.author === '@forge-ai';
                              const canManage = user && (user.role === 'ADMIN' || (user.id && comment.authorId === user.id));
                              const isEditing = commentEditingId === comment.id;
                              return (
                                <div
                                  key={`${post.id}-comment-${idx}`}
                                  className={`rounded-xl border px-4 py-3 ${
                                    isAI
                                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30'
                                      : 'bg-white/5 border-white/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 mb-2">
                                    <span className="font-bold text-white/70">{comment.author}</span>
                                    {isAI && (
                                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold tracking-widest">
                                        AI
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(comment.time), { addSuffix: true, locale: de })}</span>
                                    {canManage && (
                                      <span className="ml-auto flex items-center gap-2">
                                        <button
                                          onClick={() => startCommentEdit(comment)}
                                          className="p-1 text-white/30 hover:text-white transition-all"
                                          aria-label="Kommentar bearbeiten"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleCommentDelete(post.id, comment.id)}
                                          className="p-1 text-white/30 hover:text-white transition-all"
                                          aria-label="Kommentar löschen"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </span>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={commentEditDrafts[comment.id] || ''}
                                        onChange={(e) => setCommentEditDrafts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                        className="w-full min-h-[90px] bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37] transition-all"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={cancelCommentEdit}
                                          className="px-4 py-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all"
                                        >
                                          Abbrechen
                                        </button>
                                        <button
                                          onClick={() => handleCommentEdit(post.id, comment.id)}
                                          disabled={commentEditSubmitting === comment.id || !(commentEditDrafts[comment.id] || '').trim()}
                                          className="bg-[#D4AF37] text-black px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-20 hover:brightness-110 transition-all"
                                        >
                                          {commentEditSubmitting === comment.id ? 'Speichert...' : 'Speichern'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="prose prose-invert prose-sm max-w-none text-white/80">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="pt-3 border-t border-white/10 space-y-3">
                          {commentStatus[post.id] && (
                            <div className="text-[10px] uppercase tracking-widest text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                              {commentStatus[post.id]}
                            </div>
                          )}
                          <textarea
                            value={commentDrafts[post.id] || ''}
                            onChange={(e) => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Antworte oder ergänze den Thread..."
                            className="w-full min-h-[90px] bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37] transition-all"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={commentSubmitting === post.id || !(commentDrafts[post.id] || '').trim()}
                              className="bg-[#D4AF37] text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-20 hover:brightness-110 transition-all"
                            >
                              {commentSubmitting === post.id ? 'Sendet...' : 'Kommentar senden'}
                            </button>
                          </div>
                        </div>

                        <RelatedPosts postId={post.id} content={post.content} category={post.category} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden xl:block sticky top-8 h-fit space-y-6">
            {/* User Profile Widget - PRO REDESIGN */}
            <div className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl group">
              <div className="h-20 bg-gradient-to-br from-[#D4AF37] via-amber-600 to-black relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              </div>
              <div className="px-6 pb-6 -mt-10 relative z-10">
                <div className="flex justify-between items-end mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#121212] border-4 border-[#050505] flex items-center justify-center text-3xl font-black text-[#D4AF37] shadow-xl overflow-hidden">
                    {user?.image ? (
                      <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0)
                    )}
                  </div>
                  <div className="pb-1">
                    <span className="px-2 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] font-bold uppercase tracking-widest border border-[#D4AF37]/20">
                      {user?.role || 'FOUNDER'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors">{user?.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    <span>Founder #{user?.founderNumber?.toString().padStart(3, '0')}</span>
                    <span>•</span>
                    <span className="text-white/50">{user?.email}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1">Karma</p>
                    <p className="text-lg font-bold text-[#D4AF37]">{user?.karmaScore || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1">Ventures</p>
                    <p className="text-lg font-bold text-white">{(user as any)?._count?.ventures || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1">Squads</p>
                    <p className="text-lg font-bold text-white">{(user as any)?._count?.squadMemberships || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1">Credits</p>
                    <p className="text-lg font-bold text-blue-400">{(user as any)?.credits || 0}</p>
                  </div>
                </div>

                <button 
                  onClick={startNewPost}
                  className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#D4AF37]/10"
                >
                  Neuen Beitrag erstellen
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
              <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Community-Regeln</h4>
              <ul className="space-y-3">
                {['Mehrwert liefern', 'Respektvoll bleiben', 'Kein Spam', 'Wissen teilen'].map((rule, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-white/60">
                    <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>

        {/* POSTING MODAL - PRO RESTORATION */}
        <AnimatePresence>
          {editingPost && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-[#121212] border border-white/10 rounded-[2.5rem] w-full max-w-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {editingPost === 'NEW' ? 'Beitrag schmieden' : 'Beitrag bearbeiten'}
                    </h2>
                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold">
                      {editingPost === 'NEW' ? 'Wissen teilen • Community stärken' : 'Schärfe deinen Beitrag'}
                    </p>
                  </div>
                  <button onClick={() => setEditingPost(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">✕</button>
                </div>

                {moderationWarning && (
                  <div className="mx-8 mt-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-200 uppercase tracking-widest">
                    <div className="font-bold text-red-300 mb-1">Moderation • Hinweis #{moderationWarning.number}</div>
                    <div className="text-red-200/90 normal-case tracking-normal">{moderationWarning.message}</div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Category & Tools Bar */}
                  <div className="flex flex-wrap items-center gap-4">
                    {editingPost === 'NEW' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Channel wählen</label>
                        <select
                          value={activeChannel === 'All' || activeChannel === 'Popular' ? 'General' : activeChannel}
                          onChange={e => setActiveChannel(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                        >
                          {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Editor Tools */}
                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-[#D4AF37] transition-all title-tooltip" title="Bild hochladen"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                      
                      <div className="w-px h-4 bg-white/10 mx-1" />
                      
                      <VoiceInput
                        onTranscript={(text) => {
                          if (editingPost === 'NEW') {
                            setContent(prev => prev + (prev ? '\n' : '') + text);
                          } else {
                            setEditContent(prev => prev + (prev ? '\n' : '') + text);
                          }
                        }}
                      />
                      
                      <div className="w-px h-4 bg-white/10 mx-1" />
                      
                      <button 
                        onClick={() => setIsPreview(!isPreview)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                          isPreview ? 'bg-[#D4AF37] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {isPreview ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
                        {isPreview ? 'Editor' : 'Vorschau'}
                      </button>
                    </div>
                  </div>

                  {/* Main Input Area */}
                  <div className="relative min-h-[350px]">
                    {isPreview ? (
                      <div className="prose prose-invert prose-lg max-w-none p-8 bg-white/[0.02] border border-white/5 rounded-3xl min-h-[350px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {(editingPost === 'NEW' ? content : editContent) || '*Schreibe etwas, um die Vorschau zu sehen...*'}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        autoFocus
                        value={editingPost === 'NEW' ? content : editContent}
                        onChange={e => editingPost === 'NEW' ? setContent(e.target.value) : setEditContent(e.target.value)}
                        placeholder="Was gibt es neues im Netzwerk? Teile deine Gedanken, Updates oder Fragen..."
                        className="w-full min-h-[350px] bg-transparent border-none outline-none text-xl text-white placeholder:text-white/10 resize-none leading-relaxed"
                      />
                    )}
                  </div>

                  {/* Formatting Tips */}
                  {!isPreview && (
                    <div className="flex items-center gap-6 text-[10px] font-mono text-white/20 border-t border-white/5 pt-6">
                      <span className="flex items-center gap-1.5"><code className="bg-white/5 px-1 rounded text-white/40">**fett**</code></span>
                      <span className="flex items-center gap-1.5"><code className="bg-white/5 px-1 rounded text-white/40"># Titel</code></span>
                      <span className="flex items-center gap-1.5"><code className="bg-white/5 px-1 rounded text-white/40">![]() Bild</code></span>
                      <span className="ml-auto text-[#D4AF37]/40 uppercase tracking-widest font-black">Markdown aktiv</span>
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${(editingPost === 'NEW' ? content : editContent).length > 0 ? 'bg-green-500 animate-pulse' : 'bg-white/10'}`} />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                      {statusMessage || ((editingPost === 'NEW' ? content : editContent).length > 0 ? `${(editingPost === 'NEW' ? content : editContent).length} Zeichen` : 'System bereit')}
                    </span>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setEditingPost(null)}
                      className="px-8 py-3 text-xs font-bold text-white/20 hover:text-white uppercase tracking-widest transition-all"
                    >
                      Verwerfen
                    </button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting || !(editingPost === 'NEW' ? content : editContent).trim()}
                      className="bg-[#D4AF37] text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(212,175,55,0.2)] disabled:opacity-20 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          Übertrage...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> {editingPost === 'NEW' ? 'Beitrag posten' : 'Update speichern'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageShell>
    </AuthGuard>
  );
}
