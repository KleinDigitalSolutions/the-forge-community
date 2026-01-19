'use client';

import { useEffect, useState, type FormEvent, useRef } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import {
  MessageSquare, Send, ArrowUp, ArrowDown, Users,
  Quote, Reply, MessageCircle, Edit2, Trash2, Image as ImageIcon, Eye, Code, X, Menu,
  Sparkles, Lightbulb, CheckCircle, Search, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MicroExpander } from '@/app/components/ui/MicroExpander';
import { LinkPreview, extractUrls } from '@/app/components/LinkPreview';
import { RelatedPosts } from '@/app/components/RelatedPosts';
import { VoiceInput } from '@/app/components/VoiceInput';
import { TrendingTopics } from '@/app/components/TrendingTopics';

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
  comments?: Comment[];
}

interface UserProfile {
  name: string;
  founderNumber: number;
  email: string;
  karma?: number;
}

const categories = ['All', 'Ideas', 'Support', 'General'];

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [content, setContent] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [postCategory, setPostCategory] = useState('General');
  const [statusMessage, setStatusMessage] = useState('');
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

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (e) { console.error('Failed to fetch user', e); }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forum');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  const getUserKarma = (name: string) => {
    return posts.filter(p => p.author === name).reduce((sum, p) => sum + p.likes, 0);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('Uploading image...');
    try {
      const response = await fetch(`/api/forum/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      const newBlob = await response.json();
      const markdownImage = `\n![${file.name}](${newBlob.url})\n`;
      
      if (editingPost && editingPost !== 'NEW') {
        setEditContent(prev => prev + markdownImage);
      } else {
        setContent(prev => prev + markdownImage);
      }
      setStatusMessage('Image uploaded!');
    } catch (error) {
      setStatusMessage('Upload failed.');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          category: postCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a moderation warning
        if (data.warning) {
          setModerationWarning(data.warning);
          setEditingPost(null);
          setContent('');
          return;
        }
        throw new Error(data.error || 'Failed to submit post');
      }

      setContent('');
      setEditingPost(null);
      setStatusMessage('Post shared!');
      fetchPosts();
    } catch (error: any) {
      setStatusMessage(error.message || 'Error posting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (id: string, delta: number) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + delta } : p));
    try {
      await fetch('/api/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta }),
      });
    } catch (e) { console.error(e); }
  };

  const [isReplying, setIsReplying] = useState<string | null>(null);

  const handleReply = async (postId: string) => {
    if (!replyContent.trim()) return;
    setIsReplying(postId);
    try {
      const response = await fetch('/api/forum/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: replyContent.trim() }),
      });
      if (response.ok) {
        setReplyTo(null);
        setReplyContent('');
        fetchPosts();
      }
    } catch (e) { console.error(e); }
    finally { setIsReplying(null); }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch('/api/forum/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editContent.trim() }),
      });
      if (response.ok) {
        setEditingPost(null);
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      const response = await fetch('/api/forum/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  const handleQuote = (post: ForumPost) => {
    setContent(`> **${post.author} wrote:**\n> ${post.content.replace(/\n/g, '\n> ')}\n\n`);
    setEditingPost('NEW');
  };

  const handleAIAction = async (postId: string, postContent: string, category: string, action: string) => {
    setAiLoading(true);
    setAiMenuOpen(null);
    try {
      const response = await fetch('/api/forum/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, postContent, category })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResult({ postId, content: data.content, action });
      } else {
        alert('AI Action failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('AI Action failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredPosts = filterCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === filterCategory);

  return (
    <AuthGuard>
      <PageShell>

        <div className="max-w-[1800px] mx-auto px-4 md:px-6 pt-24 pb-12 flex flex-col lg:flex-row gap-8 items-start">
          
          <main className="flex-1 space-y-4 min-w-0">
            
            {/* Reddit-style Create Post Trigger */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 flex items-center gap-3 shadow-sm glass-card mb-6">
              <div className="w-10 h-10 bg-[var(--surface-muted)] border border-[var(--border)] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[var(--accent)] text-sm">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <input
                type="text"
                placeholder="Teile eine Idee oder stelle eine Frage..."
                onClick={() => { setEditingPost('NEW'); setIsPreview(false); }}
                readOnly
                className="flex-1 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] rounded-md px-4 py-2.5 text-sm outline-none transition-all cursor-pointer text-[var(--foreground)]"
              />
              <button 
                onClick={() => { setEditingPost('NEW'); setIsPreview(false); }}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded transition-all"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Posting Modal */}
            <AnimatePresence>
              {editingPost === 'NEW' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                  >
                    <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-muted)]/50">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setIsPreview(false)}
                          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${!isPreview ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Beitrag
                        </button>
                        <button 
                          onClick={() => setIsPreview(true)}
                          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${isPreview ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Vorschau
                        </button>
                      </div>
                      <button onClick={() => setEditingPost(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xl font-light">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--background)]">
                      {!isPreview ? (
                        <>
                          <div className="flex gap-4">
                            <select
                              value={postCategory}
                              onChange={e => setPostCategory(e.target.value)}
                              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-xs font-bold text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                            >
                              {categories.filter(c => c !== 'All').map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--accent)] border border-[var(--border)] px-4 py-2 rounded-lg bg-[var(--surface)] transition-all"
                            >
                              <ImageIcon className="w-4 h-4" /> Add Image
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />

                            <VoiceInput
                              onTranscript={(text) => setContent((prev) => prev + (prev ? '\n\n' : '') + text)}
                            />
                          </div>
                          <textarea
                            autoFocus
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Markdown unterstützt: **fett**, *kursiv*, # Überschrift...&#10;&#10;💡 Tipp: Nutze @forge-ai um die AI zu fragen!"
                            className="w-full min-h-[300px] p-4 text-sm font-mono bg-[var(--surface)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all resize-none text-[var(--foreground)]"
                          />
                          <div className="flex items-center gap-2 text-[10px] text-purple-400 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20">
                            <Sparkles className="w-3 h-3" />
                            <span className="font-bold">Pro-Tipp: Schreib <code className="bg-purple-500/20 px-1.5 py-0.5 rounded">@forge-ai [deine Frage]</code> für eine direkte AI-Antwort!</span>
                          </div>
                        </>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl min-h-[300px]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing to preview*'}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-[var(--border)] flex justify-between items-center bg-[var(--surface-muted)]/50">
                      <span className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest">{statusMessage}</span>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setEditingPost(null)}
                          className="px-6 py-2 text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                        >
                          Abbrechen
                        </button>
                        <button 
                          onClick={handleSubmit} disabled={isSubmitting || !content.trim()}
                          className="bg-[var(--accent)] hover:brightness-110 text-[var(--accent-foreground)] px-10 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                        >
                          {isSubmitting ? 'Poste...' : 'Jetzt posten'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts List */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-[var(--surface)] p-20 text-center rounded-xl border border-[var(--border)] shadow-sm glass-card">
                  <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Gathering intelligence...</p>
                </div>
              ) : filteredPosts.map((post) => (
                <div key={post.id} className="flex bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)]/30 transition-all shadow-sm glass-card group relative">
                  
                  {/* Voting Sidebar */}
                  <div className="w-10 bg-[var(--surface-muted)]/30 flex flex-col items-center pt-3 gap-1 border-r border-[var(--border)] rounded-l-lg overflow-hidden">
                    <button onClick={() => handleVote(post.id, 1)} className="p-1 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded text-[var(--muted-foreground)] transition-all">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[var(--foreground)] leading-none my-1">{post.likes}</span>
                    <button onClick={() => handleVote(post.id, -1)} className="p-1 hover:bg-blue-600 hover:text-white rounded text-[var(--muted-foreground)] transition-all">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 text-[10px] mb-3 text-[var(--muted-foreground)] font-bold uppercase tracking-widest">
                      <span className="text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded border border-[var(--accent)]/20">{post.category}</span>
                      <span className="opacity-30">•</span>
                      <span>u/{post.author.replace(/\s+/g, '').toLowerCase()}</span>
                      <span className="opacity-30">•</span>
                      <span className="opacity-60">{new Date(post.createdTime).toLocaleDateString()}</span>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] mb-4 prose-p:leading-relaxed prose-img:rounded-lg">
                      {editingPost === post.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full p-4 bg-[var(--background)] border border-[var(--accent)] rounded-xl outline-none text-sm min-h-[200px] font-mono text-[var(--foreground)]"
                          />
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setEditingPost(null)} className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
                            <button onClick={() => handleEdit(post.id)} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all">Save Changes</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                          {/* Smart Link Previews */}
                          {extractUrls(post.content).map((url, idx) => (
                            <LinkPreview key={idx} url={url} />
                          ))}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <MicroExpander
                        text={`${post.comments?.length || 0} Kommentare`}
                        icon={<MessageSquare className="w-4 h-4" />}
                        variant="ghost"
                        onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                        className={replyTo === post.id ? 'bg-[var(--accent)]/20 border-[var(--accent)]/30' : ''}
                      />

                      <button onClick={() => handleQuote(post)} className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-[var(--surface-muted)] transition-all">
                        <Quote className="w-3.5 h-3.5" /> Zitieren
                      </button>

                      {/* AI Actions */}
                      <div className="relative">
                        <button
                          onClick={() => setAiMenuOpen(aiMenuOpen === post.id ? null : post.id)}
                          disabled={aiLoading}
                          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all ${
                            aiMenuOpen === post.id
                              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                              : 'text-[var(--muted-foreground)] hover:text-purple-400 hover:bg-purple-500/10'
                          } disabled:opacity-50`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {aiLoading ? 'AI denkt...' : 'AI Actions'}
                        </button>

                        <AnimatePresence>
                          {aiMenuOpen === post.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden min-w-[220px]"
                              style={{ zIndex: 1000 }}
                            >
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={() => handleAIAction(post.id, post.content, post.category, 'summarize')}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-left hover:bg-[var(--accent)]/10 rounded-lg transition-all text-[var(--foreground)]"
                                >
                                  <Sparkles className="w-4 h-4 text-blue-400" />
                                  <div>
                                    <div>Zusammenfassen</div>
                                    <div className="text-[9px] text-[var(--muted-foreground)] font-normal">TL;DR generieren</div>
                                  </div>
                                </button>

                                <button
                                  onClick={() => handleAIAction(post.id, post.content, post.category, 'feedback')}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-left hover:bg-[var(--accent)]/10 rounded-lg transition-all text-[var(--foreground)]"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <div>
                                    <div>Feedback geben</div>
                                    <div className="text-[9px] text-[var(--muted-foreground)] font-normal">Konstruktive Kritik</div>
                                  </div>
                                </button>

                                <button
                                  onClick={() => handleAIAction(post.id, post.content, post.category, 'expand')}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-left hover:bg-[var(--accent)]/10 rounded-lg transition-all text-[var(--foreground)]"
                                >
                                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                                  <div>
                                    <div>Ideen erweitern</div>
                                    <div className="text-[9px] text-[var(--muted-foreground)] font-normal">Brainstorming</div>
                                  </div>
                                </button>

                                <button
                                  onClick={() => handleAIAction(post.id, post.content, post.category, 'factCheck')}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-left hover:bg-[var(--accent)]/10 rounded-lg transition-all text-[var(--foreground)]"
                                >
                                  <Search className="w-4 h-4 text-purple-400" />
                                  <div>
                                    <div>Fact-Check</div>
                                    <div className="text-[9px] text-[var(--muted-foreground)] font-normal">Infos verifizieren</div>
                                  </div>
                                </button>

                                <button
                                  onClick={() => handleAIAction(post.id, post.content, post.category, 'nextSteps')}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-left hover:bg-[var(--accent)]/10 rounded-lg transition-all text-[var(--foreground)]"
                                >
                                  <Target className="w-4 h-4 text-orange-400" />
                                  <div>
                                    <div>Nächste Schritte</div>
                                    <div className="text-[9px] text-[var(--muted-foreground)] font-normal">Action Items</div>
                                  </div>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {user?.name === post.author && (
                        <div className="flex items-center gap-2 ml-auto">
                          <button onClick={() => { setEditingPost(post.id); setEditContent(post.content); }} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--accent)] rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(post.id)} className="p-2 text-[var(--muted-foreground)] hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>

                    {/* Related Posts */}
                    <RelatedPosts
                      postId={post.id}
                      content={post.content}
                      category={post.category}
                    />

                    {/* AI Result Display */}
                    {aiResult && aiResult.postId === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                            {aiResult.action === 'summarize' && 'AI Zusammenfassung'}
                            {aiResult.action === 'feedback' && 'AI Feedback'}
                            {aiResult.action === 'expand' && 'AI Ideen'}
                            {aiResult.action === 'factCheck' && 'AI Fact-Check'}
                            {aiResult.action === 'nextSteps' && 'AI Nächste Schritte'}
                          </span>
                          <button
                            onClick={() => setAiResult(null)}
                            className="ml-auto p-1 hover:bg-white/10 rounded transition-all"
                          >
                            <X className="w-3 h-3 text-white/40" />
                          </button>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{aiResult.content}</p>
                      </motion.div>
                    )}

                    {/* Replies */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-6 space-y-4 border-l border-[var(--border)] ml-2 pl-6">
                        {post.comments.map((comment, i) => (
                          <div key={i} className="text-xs bg-[var(--surface-muted)]/30 p-4 rounded-xl border border-[var(--border)] glass-card">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 opacity-60 font-bold uppercase tracking-widest text-[9px]">
                                <span className="text-[var(--foreground)]">u/{comment.author.toLowerCase()}</span>
                                <span className="opacity-30">•</span>
                                <span>{new Date(comment.time).toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <p className="text-[var(--muted-foreground)] leading-relaxed">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <AnimatePresence>
                      {replyTo === post.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6 overflow-hidden">
                          <div className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-muted)]/20 glass-card">
                            <textarea
                              autoFocus
                              value={replyContent}
                              onChange={e => setReplyContent(e.target.value)}
                              placeholder="Type your reply here..."
                              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 text-xs outline-none focus:border-[var(--accent)] min-h-[120px] text-[var(--foreground)] transition-all"
                            />
                            <div className="flex justify-end gap-4 mt-4 items-center">
                              <button onClick={() => setReplyTo(null)} className="text-[10px] font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] uppercase tracking-widest transition-colors">Cancel</button>
                              
                              <MicroExpander 
                                text={isReplying === post.id ? 'Sending...' : 'Post Reply'}
                                icon={<Send className="w-4 h-4" />}
                                isLoading={isReplying === post.id}
                                disabled={!replyContent.trim()}
                                onClick={() => handleReply(post.id)}
                                variant="default"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </main>

          <aside className="w-full lg:w-[360px] space-y-6 flex-shrink-0 sticky top-24">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden glass-card">
              <div className="h-16 bg-gradient-to-r from-[var(--accent)] to-[var(--color-forge-ember)] opacity-80" />
              <div className="p-5 pt-0 -mt-8 text-center md:text-left">
                <div className="w-16 h-16 bg-[var(--surface)] rounded-xl border-4 border-[var(--background)] shadow-2xl flex items-center justify-center font-black text-[var(--accent)] text-2xl mb-3 mx-auto md:mx-0">
                  {user?.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <h3 className="font-display font-bold text-[var(--foreground)] text-lg mb-1">{user?.name || 'Founder'}</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  <span className="text-[9px] text-[var(--accent)] font-bold uppercase tracking-widest">KARMA: {user?.name ? getUserKarma(user.name) : 0}</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold py-3 border-y border-[var(--border)] uppercase tracking-widest">
                    <span className="text-[var(--muted-foreground)]">Founder ID</span>
                    <span className="text-[var(--foreground)]">#{user?.founderNumber || '000'}</span>
                  </div>
                  
                  <button 
                    onClick={() => setEditingPost('NEW')} 
                    className="w-full btn-shimmer bg-[var(--foreground)] text-[var(--background)] py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]"
                  >
                    Neuen Beitrag erstellen
                  </button>
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <TrendingTopics />

            {/* Guidelines Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 glass-card">
               <h4 className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.3em] mb-4">Forum Richtlinien</h4>
               <ul className="space-y-3">
                  {['Respektvoll sein', 'Mehrwert bieten', 'Professionell bleiben', 'Wissen teilen'].map((g, i) => (
                    <li key={i} className="flex items-center gap-3 text-[11px] font-medium text-[var(--foreground)]">
                       <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                       {g}
                    </li>
                  ))}
               </ul>
            </div>
          </aside>

        </div>

        {/* Moderation Warning Modal */}
        <AnimatePresence>
          {moderationWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !moderationWarning.banned && setModerationWarning(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md rounded-2xl border p-8 glass-card ${
                  moderationWarning.number >= 3
                    ? 'bg-red-950/50 border-red-500/30'
                    : moderationWarning.number === 2
                    ? 'bg-orange-950/50 border-orange-500/30'
                    : 'bg-yellow-950/50 border-yellow-500/30'
                }`}
              >
                <div className="text-center mb-6">
                  <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${
                    moderationWarning.number >= 3 ? 'bg-red-500/20' : moderationWarning.number === 2 ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                  }`}>
                    {moderationWarning.banned ? '🔒' : '⚠️'}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {moderationWarning.banned ? 'Account Gesperrt' : `Warnung ${moderationWarning.number}/3`}
                  </h2>
                </div>

                <div className="prose prose-invert prose-sm mb-8">
                  <div className="bg-black/30 rounded-xl p-4 text-sm text-white/90 whitespace-pre-wrap">
                    {moderationWarning.message}
                  </div>
                </div>

                {!moderationWarning.banned && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full ${
                            i < moderationWarning.number
                              ? moderationWarning.number >= 3
                                ? 'bg-red-500'
                                : moderationWarning.number === 2
                                ? 'bg-orange-500'
                                : 'bg-yellow-500'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-center text-white/60">
                      {moderationWarning.number === 1 && 'Noch 2 Warnungen übrig'}
                      {moderationWarning.number === 2 && 'Noch 1 Warnung übrig'}
                      {moderationWarning.number === 3 && 'Letzte Warnung - beim nächsten Verstoß erfolgt die Sperrung'}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setModerationWarning(null)}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                    moderationWarning.banned
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {moderationWarning.banned ? 'Verstanden' : 'Ich verstehe'}
                </button>

                <p className="text-[10px] text-center text-white/40 mt-4 uppercase tracking-widest">
                  Bei Fragen kontaktiere support@stakeandscale.de
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageShell>
    </AuthGuard>
  );
}