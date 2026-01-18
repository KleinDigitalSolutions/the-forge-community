'use client';

import { useEffect, useState, type FormEvent, useRef } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import {
  MessageSquare, Send, ArrowUp, ArrowDown, Users,
  Quote, Reply, MessageCircle, Edit2, Trash2, Image as ImageIcon, Eye, Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        // Karma fetch logic (simplified: sum from current posts)
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

  // Calculate user karma based on posts (real-time for the UI)
  const getUserKarma = (
    name: string
  ) => {
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
          
          <main className="flex-1 space-y-4">
            
            {/* Reddit-style Create Post Trigger */}
            <div className="bg-white border border-gray-300 rounded-md p-2 px-3 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-500 text-sm">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <input
                type="text"
                placeholder="Create Post"
                onClick={() => { setEditingPost('NEW'); setIsPreview(false); }}
                readOnly
                className="flex-1 bg-gray-100 hover:bg-white border border-gray-200 hover:border-blue-500 rounded px-4 py-2 text-sm outline-none transition-all cursor-pointer"
              />
              <button 
                onClick={() => { setEditingPost('NEW'); setIsPreview(false); }}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded transition-all"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Posting Modal */}
            <AnimatePresence>
              {editingPost === 'NEW' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
                  >
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setIsPreview(false)}
                          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${!isPreview ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Post
                        </button>
                        <button 
                          onClick={() => setIsPreview(true)}
                          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isPreview ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                      </div>
                      <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-gray-900 text-xl font-light">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {!isPreview ? (
                        <>
                          <div className="flex gap-4">
                            <select
                              value={postCategory}
                              onChange={e => setPostCategory(e.target.value)}
                              className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                            >
                              {categories.filter(c => c !== 'All').map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-blue-600 border border-gray-200 px-3 py-2 rounded bg-gray-50 transition-all"
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
                            className="w-full min-h-[300px] p-4 text-sm font-mono bg-gray-50/30 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                          />
                        </>
                      ) : (
                        <div className="prose prose-sm max-w-none p-4 bg-gray-50/50 rounded-lg min-h-[300px]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing to preview*'}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t flex justify-between items-center bg-gray-50/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{statusMessage}</span>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setEditingPost(null)}
                          className="px-6 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSubmit} disabled={isSubmitting || !content.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all shadow-lg active:scale-95"
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
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white p-20 text-center rounded-md border border-gray-300 shadow-sm">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Gathering intelligence...</p>
                </div>
              ) : filteredPosts.map((post) => (
                <div key={post.id} className="flex bg-white border border-gray-300 rounded-md hover:border-gray-400 transition-all shadow-sm overflow-hidden">
                  
                  {/* Voting Sidebar */}
                  <div className="w-10 bg-[#F8F9FA] flex flex-col items-center pt-2 gap-1 border-r border-gray-100">
                    <button onClick={() => handleVote(post.id, 1)} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-orange-600">
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-black text-gray-900 leading-none">{post.likes}</span>
                    <button onClick={() => handleVote(post.id, -1)} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-blue-600">
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3">
                    <div className="flex items-center gap-2 text-[10px] mb-3 text-gray-400 font-medium">
                      <span className="font-black text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded tracking-tighter">f/{post.category.toLowerCase()}</span>
                      <span>•</span>
                      <span className="text-gray-500">Posted by <span className="font-bold text-gray-900 hover:underline cursor-pointer">u/{post.author.replace(/\s+/g, '').toLowerCase()}</span></span>
                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black">KARMA: {getUserKarma(post.author)}</span>
                      <span>•</span>
                      <span>{new Date(post.createdTime).toLocaleDateString()}</span>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-800 mb-4 prose-img:rounded-xl prose-img:shadow-lg">
                      {editingPost === post.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full p-4 border border-blue-500 rounded-lg outline-none text-sm min-h-[200px] font-mono"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingPost(null)} className="text-xs font-bold text-gray-500">Cancel</button>
                            <button onClick={() => handleEdit(post.id)} className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold">Save Changes</button>
                          </div>
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <button onClick={() => setReplyTo(replyTo === post.id ? null : post.id)} className="flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1.5 rounded transition-all">
                        <MessageSquare className="w-4 h-4" /> {post.comments?.length || 0} Comments
                      </button>
                      <button onClick={() => handleQuote(post)} className="flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1.5 rounded transition-all">
                        <Quote className="w-4 h-4" /> Quote
                      </button>
                      {user?.name === post.author && (
                        <>
                          <button onClick={() => { setEditingPost(post.id); setEditContent(post.content); }} className="hover:bg-gray-100 px-2 py-1.5 rounded transition-all">Edit</button>
                          <button onClick={() => handleDelete(post.id)} className="hover:bg-red-50 hover:text-red-500 px-2 py-1.5 rounded transition-all text-red-400">Delete</button>
                        </>
                      )}
                    </div>

                    {/* Replies */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-4 space-y-3 border-l-2 border-gray-100 pl-4">
                        {post.comments.map((comment, i) => (
                          <div key={i} className="text-xs bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                            <div className="flex items-center gap-2 mb-1 opacity-60">
                              <span className="font-bold">u/{comment.author.toLowerCase()}</span>
                              <span className="text-[9px]">{new Date(comment.time).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <AnimatePresence>
                      {replyTo === post.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden">
                          <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/20">
                            <textarea
                              autoFocus
                              value={replyContent}
                              onChange={e => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs outline-none focus:border-blue-500 min-h-[100px]"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setReplyTo(null)} className="text-xs font-bold text-gray-400">Cancel</button>
                              <button 
                                onClick={() => handleReply(post.id)} 
                                disabled={isReplying === post.id || !replyContent.trim()}
                                className="bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold disabled:opacity-50"
                              >
                                {isReplying === post.id ? 'Sending...' : 'Reply'}
                              </button>
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

          <aside className="w-full md:w-[312px] space-y-4">
            <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
              <div className="h-12 bg-blue-600 bg-gradient-to-r from-blue-700 to-blue-500" />
              <div className="p-4 pt-0 -mt-6 text-center md:text-left">
                <div className="w-16 h-16 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center font-black text-blue-600 text-2xl mb-3 mx-auto md:mx-0">
                  {user?.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-1">{user?.name || 'Founder'}</h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-4">Total Karma: {getUserKarma(user?.name || '')}</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold py-2 border-y border-gray-100">
                    <span className="text-gray-400">FOUNDER ID</span>
                    <span className="text-gray-900">#{user?.founderNumber || '???'}</span>
                  </div>
                  <button onClick={() => setEditingPost('NEW')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-black text-xs transition-all shadow-md">Create Post</button>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </PageShell>
    </AuthGuard>
  );
}
