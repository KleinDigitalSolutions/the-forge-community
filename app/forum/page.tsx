'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MessageSquare, Send, ThumbsUp, Users } from 'lucide-react';

interface ForumPost {
  id: string;
  author: string;
  founderNumber: number;
  content: string;
  createdTime: string;
  likes: number;
  category: string;
}

const categories = ['All', 'Product Ideas', 'Strategy', 'Collaboration', 'Questions', 'General'];

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState('');
  const [founderNumber, setFounderNumber] = useState('');
  const [content, setContent] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [postCategory, setPostCategory] = useState('General');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const response = await fetch('/api/forum');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const filteredPosts = filterCategory === 'All'
    ? posts
    : posts.filter(post => post.category === filterCategory);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatusMessage('');

    if (!author.trim() || !content.trim()) {
      setStatusMessage('Bitte Name und Inhalt ausfuellen.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFounderNumber = Number(founderNumber);
      const payload = {
        author: author.trim(),
        founderNumber: Number.isNaN(parsedFounderNumber) ? undefined : parsedFounderNumber,
        content: content.trim(),
        category: postCategory,
      };

      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit post');
      }

      setAuthor('');
      setFounderNumber('');
      setContent('');
      setPostCategory('General');
      setStatusMessage('Post wurde eingereicht.');

      const refreshed = await fetch('/api/forum');
      if (refreshed.ok) {
        const data = await refreshed.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      setStatusMessage('Post konnte nicht gesendet werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    setPosts(prevPosts => prevPosts.map(post => (
      post.id === id ? { ...post, likes: post.likes + 1 } : post
    )));

    try {
      await fetch('/api/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta: 1 }),
      });
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl font-semibold text-gray-900">THE FORGE</div>
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/transparency" className="text-sm text-gray-600 hover:text-gray-900">
              Transparency
            </Link>
            <Link href="/forum" className="text-sm text-gray-900 font-medium">
              Forum
            </Link>
            <Link href="/updates" className="text-sm text-gray-600 hover:text-gray-900">
              Updates
            </Link>
            <Link href="/tasks" className="text-sm text-gray-600 hover:text-gray-900">
              Tasks
            </Link>
            <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">
              Resources
            </Link>
            <Link href="/calendar" className="text-sm text-gray-600 hover:text-gray-900">
              Calendar
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-8 h-8 text-gray-700" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Community Forum</h1>
            <p className="text-gray-600">Teile Ideen, Feedback und Fragen rund um SmartStore.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="text-sm font-semibold text-gray-900">Kategorien</h2>
              </div>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filterCategory === category
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
              Jede Stimme hilft. Bleib sachlich, klar und respektvoll.
            </div>
          </aside>

          {/* Main */}
          <div className="space-y-6">
            {/* New Post */}
            <form
              id="new-post"
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Neuen Beitrag erstellen</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={author}
                  onChange={event => setAuthor(event.target.value)}
                  placeholder="Dein Name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                />
                <input
                  type="number"
                  value={founderNumber}
                  onChange={event => setFounderNumber(event.target.value)}
                  placeholder="Founder-Nummer (optional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <select
                value={postCategory}
                onChange={event => setPostCategory(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none mb-4"
              >
                {categories.filter(category => category !== 'All').map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <textarea
                value={content}
                onChange={event => setContent(event.target.value)}
                placeholder="Teile deine Idee oder Frage..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none min-h-[120px]"
              />

              {statusMessage && (
                <p className="text-sm text-gray-500 mt-3">{statusMessage}</p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sende...' : 'Beitrag senden'}
                </button>
              </div>
            </form>

            {/* Posts */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Beitraege</h2>

              {loading ? (
                <div className="text-sm text-gray-500">Lade Beitraege...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-sm text-gray-500">Noch keine Beitraege in dieser Kategorie.</div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map(post => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">{post.author}</span>
                          {post.founderNumber > 0 && (
                            <span className="text-gray-500"> · #{post.founderNumber}</span>
                          )}
                        </div>
                        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {post.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {post.createdTime
                            ? new Date(post.createdTime).toLocaleDateString('de-DE')
                            : '—'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLike(post.id)}
                          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {post.likes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
