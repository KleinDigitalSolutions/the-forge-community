'use client';

import { useEffect, useState, type FormEvent, useRef } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import {
  MessageSquare, Send, ArrowUp, ArrowDown, Users,
  Quote, Reply, MessageCircle, Edit2, Trash2, Image as ImageIcon, Eye, Code, X, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MicroExpander } from '@/app/components/ui/MicroExpander';

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

      if (!response.ok) throw new Error('Failed to submit post');

      setContent('');
      setEditingPost(null);
      setStatusMessage('Post shared!');
      fetchPosts();
    } catch (error) {
      setStatusMessage('Error posting.');
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

  const filteredPosts = filterCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === filterCategory);

  return (
    <AuthGuard>
      <PageShell>

        <div className="max-w-6xl mx-auto px-4 pt-24 pb-12 flex flex-col md:flex-row gap-6">
          
          <main className="flex-1 space-y-6">
            
            {/* Reddit-style Create Post Trigger */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 px-4 flex items-center gap-3 shadow-sm glass-card">
              <div className="w-10 h-10 bg-[var(--surface-muted)] border border-[var(--border)] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[var(--accent)] text-sm">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <input
                type="text"
                placeholder="Share an idea or ask a question..."
                onClick={() => { setEditingPost('NEW'); setIsPreview(false); }}
                readOnly
                className="flex-1 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg px-4 py-2.5 text-sm outline-none transition-all cursor-pointer text-[var(--foreground)]"
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
                          <Edit2 className="w-3.5 h-3.5" /> Post
                        </button>
                        <button 
                          onClick={() => setIsPreview(true)}
                          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${isPreview ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
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
                          </div>
                          <textarea
                            autoFocus
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Markdown supported: **bold**, *italic*, # header..."
                            className="w-full min-h-[300px] p-4 text-sm font-mono bg-[var(--surface)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all resize-none text-[var(--foreground)]"
                          />
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
                          Cancel
                        </button>
                        <button 
                          onClick={handleSubmit} disabled={isSubmitting || !content.trim()}
                          className="bg-[var(--accent)] hover:brightness-110 text-[var(--accent-foreground)] px-10 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                        >
                          {isSubmitting ? 'Posting...' : 'Post Now'}
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
                <div key={post.id} className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)]/30 transition-all shadow-sm overflow-hidden glass-card group">
                  
                  {/* Voting Sidebar */}
                  <div className="w-12 bg-[var(--surface-muted)]/50 flex flex-col items-center pt-4 gap-2 border-r border-[var(--border)]">
                    <button onClick={() => handleVote(post.id, 1)} className="p-1.5 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded-lg text-[var(--muted-foreground)] transition-all">
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-black text-[var(--foreground)] leading-none">{post.likes}</span>
                    <button onClick={() => handleVote(post.id, -1)} className="p-1.5 hover:bg-blue-600 hover:text-white rounded-lg text-[var(--muted-foreground)] transition-all">
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-3 text-[10px] mb-4 text-[var(--muted-foreground)] font-bold uppercase tracking-widest">
                      <span className="text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded tracking-tighter border border-[var(--accent)]/20">{post.category}</span>
                      <span className="opacity-30">•</span>
                      <span>Posted by <span className="text-[var(--foreground)] hover:underline cursor-pointer">u/{post.author.replace(/\s+/g, '').toLowerCase()}</span></span>
                      <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded border border-[var(--accent)]/20">KARMA: {getUserKarma(post.author)}</span>
                      <span className="opacity-30">•</span>
                      <span className="opacity-60">{new Date(post.createdTime).toLocaleDateString()}</span>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] mb-6 prose-img:rounded-xl prose-img:shadow-2xl">
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <MicroExpander 
                        text={`${post.comments?.length || 0} Comments`}
                        icon={<MessageSquare className="w-4 h-4" />}
                        variant="ghost"
                        onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                        className={replyTo === post.id ? 'bg-[var(--accent)]/20 border-[var(--accent)]/30' : ''}
                      />
                      
                      <button onClick={() => handleQuote(post)} className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-[var(--surface-muted)] transition-all">
                        <Quote className="w-3.5 h-3.5" /> Quote
                      </button>

                      {user?.name === post.author && (
                        <div className="flex items-center gap-2 ml-auto">
                          <button onClick={() => { setEditingPost(post.id); setEditContent(post.content); }} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--accent)] rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(post.id)} className="p-2 text-[var(--muted-foreground)] hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>

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

          <aside className="w-full md:w-[312px] space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden glass-card">
              <div className="h-16 bg-gradient-to-r from-[var(--accent)] to-[var(--color-forge-ember)] opacity-80" />
              <div className="p-6 pt-0 -mt-8 text-center md:text-left">
                <div className="w-20 h-20 bg-[var(--surface)] rounded-2xl border-4 border-[var(--background)] shadow-2xl flex items-center justify-center font-black text-[var(--accent)] text-3xl mb-4 mx-auto md:mx-0">
                  {user?.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <h3 className="font-display font-bold text-[var(--foreground)] text-xl mb-1">{user?.name || 'Founder'}</h3>
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
                    Create New Post
                  </button>
                </div>
              </div>
            </div>

            {/* Guidelines Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 glass-card">
               <h4 className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.3em] mb-4">Forum Guidelines</h4>
               <ul className="space-y-3">
                  {['Be Respectful', 'Add Value', 'Keep it Professional', 'Share Knowledge'].map((g, i) => (
                    <li key={i} className="flex items-center gap-3 text-[11px] font-medium text-[var(--foreground)]">
                       <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                       {g}
                    </li>
                  ))}
               </ul>
            </div>
          </aside>

        </div>
      </PageShell>
    </AuthGuard>
  );
}