'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import AuthGuard from '@/app/components/AuthGuard';
import { Bell, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Milestone' | 'Deadline' | 'Decision' | 'General';
  priority: 'High' | 'Medium' | 'Low';
  publishedDate: string;
  author: string;
}

const categoryIcons = {
  Milestone: CheckCircle,
  Deadline: Calendar,
  Decision: AlertCircle,
  General: Bell,
};

const categoryColors = {
  Milestone: 'bg-green-100 text-green-700',
  Deadline: 'bg-red-100 text-red-700',
  Decision: 'bg-purple-100 text-purple-700',
  General: 'bg-blue-100 text-blue-700',
};

const priorityColors = {
  High: 'border-l-4 border-red-500',
  Medium: 'border-l-4 border-yellow-500',
  Low: 'border-l-4 border-gray-300',
};

export default function UpdatesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        const response = await fetch('/api/announcements');
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data = await response.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, []);

  const filteredAnnouncements =
    filter === 'All'
      ? announcements
      : announcements.filter((a) => a.category === filter);

  const categories = ['All', 'Milestone', 'Deadline', 'Decision', 'General'];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-5xl mx-auto px-6 py-12 pt-32">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-8 h-8 text-gray-700" />
              <h1 className="text-4xl font-bold text-gray-900">Updates & Announcements</h1>
            </div>
            <p className="text-lg text-gray-600">
              Wichtige Updates vom Core Team zu Milestones, Deadlines und Entscheidungen.
            </p>
          </div>

          <div className="mb-6 flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === category
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Lade Updates...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Noch keine Updates vorhanden.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => {
                const Icon = categoryIcons[announcement.category];
                return (
                  <div
                    key={announcement.id}
                    className={`bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors ${
                      priorityColors[announcement.priority]
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            categoryColors[announcement.category]
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {announcement.title}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">
                              {new Date(announcement.publishedDate).toLocaleDateString('de-DE')}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{announcement.author}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                            categoryColors[announcement.category]
                          }`}
                        >
                          {announcement.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                            announcement.priority === 'High'
                              ? 'bg-red-100 text-red-700'
                              : announcement.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {announcement.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
