'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import AuthGuard from '@/app/components/AuthGuard';
import { User, Mail, Phone, Hash, Calendar, Shield, Award, Briefcase } from 'lucide-react';

interface Founder {
  founderNumber: number;
  name: string;
  email: string;
  joinedDate: string;
  status: string;
  role?: string;
  skill?: string;
  capital?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<Founder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f4f0] flex items-center justify-center">
        <div className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--secondary)]">
          Lade Profil...
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f8f4f0]">
        <Header />
        
        <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
          <div className="mb-12">
            <h1 className="text-4xl font-display text-[var(--foreground)] mb-2">Mein Profil</h1>
            <p className="text-lg text-[var(--secondary)]">
              Deine Identität im Inner Circle.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm">
            {/* Cover / Header */}
            <div className="h-32 bg-[var(--surface-muted)] relative border-b border-[var(--border)]">
              <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
                  <User className="w-10 h-10 text-[var(--secondary)]" />
                </div>
              </div>
            </div>

            <div className="pt-14 px-8 pb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-display text-[var(--foreground)]">
                    {user?.name || 'Unbekannter Founder'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-glow)] text-[var(--accent)]">
                      {user?.status || 'Pending'}
                    </span>
                    <span className="text-sm text-[var(--secondary)]">
                      Founder #{user?.founderNumber}
                    </span>
                  </div>
                </div>
                {/* <button className="text-sm text-[var(--accent)] border border-[var(--accent)] px-4 py-2 rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors uppercase tracking-wider text-xs">
                  Bearbeiten
                </button> */}
              </div>

              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="space-y-6">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-[var(--secondary)] font-medium border-b border-[var(--border)] pb-2">
                    Kontaktdaten
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[var(--secondary)]" />
                      <span className="text-sm text-[var(--foreground)]">{user?.email}</span>
                    </div>
                    {/* Add Phone if available in API */}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-[var(--secondary)] font-medium border-b border-[var(--border)] pb-2">
                    Membership Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[var(--secondary)]" />
                      <div>
                        <div className="text-xs text-[var(--secondary)]">Dabei seit</div>
                        <div className="text-sm text-[var(--foreground)]">
                          {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('de-DE') : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-[var(--secondary)]" />
                      <div>
                        <div className="text-xs text-[var(--secondary)]">Rolle</div>
                        <div className="text-sm text-[var(--foreground)] capitalize">{user?.role || 'Founder'}</div>
                      </div>
                    </div>
                    
                    {user?.skill && (
                        <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-[var(--secondary)]" />
                        <div>
                            <div className="text-xs text-[var(--secondary)]">Expertise</div>
                            <div className="text-sm text-[var(--foreground)]">{user.skill}</div>
                        </div>
                        </div>
                    )}
                    
                     {user?.capital && (
                        <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-[var(--secondary)]" />
                        <div>
                            <div className="text-xs text-[var(--secondary)]">Kapital-Commitment</div>
                            <div className="text-sm text-[var(--foreground)]">{user.capital}</div>
                        </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
