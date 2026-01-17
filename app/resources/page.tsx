'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import AuthGuard from '@/app/components/AuthGuard';
import { FileText, ExternalLink, Lock, Users } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string;
  category: 'Contract' | 'Guide' | 'Template' | 'Process';
  url: string;
  uploadDate: string;
  accessLevel: 'All Founders' | 'Core Team';
}

const categoryColors = {
  Contract: 'bg-red-100 text-red-700',
  Guide: 'bg-blue-100 text-blue-700',
  Template: 'bg-purple-100 text-purple-700',
  Process: 'bg-green-100 text-green-700',
};

export default function ResourcesPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  const filteredDocuments =
    filter === 'All' ? documents : documents.filter((d) => d.category === filter);

  const categories = ['All', 'Contract', 'Guide', 'Template', 'Process'];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-5xl mx-auto px-6 py-12 pt-32">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-8 h-8 text-gray-700" />
              <h1 className="text-4xl font-bold text-gray-900">Documents & Resources</h1>
            </div>
            <p className="text-lg text-gray-600">
              Zentrale Ablage für Verträge, Guides, Templates und Prozesse.
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
              Lade Dokumente...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Noch keine Dokumente vorhanden.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                          {doc.name}
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {new Date(doc.uploadDate).toLocaleDateString('de-DE')}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            {doc.accessLevel === 'Core Team' ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                            {doc.accessLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        categoryColors[doc.category]
                      }`}
                    >
                      {doc.category}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
