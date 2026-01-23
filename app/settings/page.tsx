'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { Shield, Bell, MessageSquare, Trash2, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { signOut } from 'next-auth/react';

const DEFAULT_PREFS = {
  forumComments: true,
  forumReplies: true,
  mentions: true,
  system: true
};

const DEFAULT_PRIVACY = {
  profileVisible: true,
  showFollowerCounts: true
};

type NotificationPrefs = typeof DEFAULT_PREFS;
type PrivacyPrefs = typeof DEFAULT_PRIVACY;

function ToggleRow({
  label,
  description,
  checked,
  onToggle
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/40">{description}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className={`relative h-8 w-14 rounded-full border border-white/10 transition ${
          checked ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-white'
        }`}
      >
        <span
          className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-black/80 transition ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [privacy, setPrivacy] = useState<PrivacyPrefs>(DEFAULT_PRIVACY);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const payload = await res.json();
        if (mounted && payload?.notifications) {
          setPrefs({
            forumComments: !!payload.notifications.forumComments,
            forumReplies: !!payload.notifications.forumReplies,
            mentions: !!payload.notifications.mentions,
            system: !!payload.notifications.system
          });
        }
        if (mounted && payload?.privacy) {
          setPrivacy({
            profileVisible: !!payload.privacy.profileVisible,
            showFollowerCounts: !!payload.privacy.showFollowerCounts
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    setErrorMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: prefs, privacy })
      });
      if (!res.ok) {
        throw new Error('Speichern fehlgeschlagen');
      }
      setSaveMessage('Einstellungen gespeichert');
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (error) {
      console.error(error);
      setErrorMessage('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const canDelete = deleteChecked && deleteConfirm === 'DELETE';

  const handleDeleteAccount = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: deleteConfirm })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Account konnte nicht geloescht werden');
      }
      await signOut({ callbackUrl: '/login?deleted=1' });
    } catch (error) {
      console.error(error);
      setDeleteError('Loeschung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <PageShell>
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Account Settings</div>
            <div className="mt-6 h-3 w-48 rounded-full bg-white/10" />
          </div>
        </PageShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <PageShell>
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em]">
              <Shield className="w-3 h-3" /> Account Settings
            </div>
            <h1 className="text-4xl md:text-5xl font-instrument-serif text-white">Einstellungen</h1>
            <p className="text-sm text-white/40">Kontrolliere deine Benachrichtigungen, Privacy und Account-Status.</p>
          </header>

          <section className="glass-card rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <Bell className="w-4 h-4 text-[var(--accent)]" />
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Benachrichtigungen</div>
            </div>
            <div className="p-6 space-y-5">
              <ToggleRow
                label="Kommentare auf deine Posts"
                description="Benachrichtigung bei neuen Antworten auf deine Beitraege."
                checked={prefs.forumComments}
                onToggle={() => setPrefs(prev => ({ ...prev, forumComments: !prev.forumComments }))}
              />
              <ToggleRow
                label="Antworten auf deine Kommentare"
                description="Benachrichtigung wenn jemand dir direkt antwortet."
                checked={prefs.forumReplies}
                onToggle={() => setPrefs(prev => ({ ...prev, forumReplies: !prev.forumReplies }))}
              />
              <ToggleRow
                label="@Mentions"
                description="Benachrichtigung wenn dich jemand erwaehnt."
                checked={prefs.mentions}
                onToggle={() => setPrefs(prev => ({ ...prev, mentions: !prev.mentions }))}
              />
              <ToggleRow
                label="System Updates"
                description="Wichtige Hinweise und System-Events."
                checked={prefs.system}
                onToggle={() => setPrefs(prev => ({ ...prev, system: !prev.system }))}
              />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-2xl bg-[var(--accent)] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition disabled:opacity-50"
                >
                  {saving ? 'Speichert...' : 'Aenderungen speichern'}
                </button>
                {saveMessage && (
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-green-400">
                    <CheckCircle className="h-3 w-3" /> {saveMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                    <AlertTriangle className="h-3 w-3" /> {errorMessage}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="glass-card rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <Eye className="w-4 h-4 text-[var(--accent)]" />
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Privacy</div>
            </div>
            <div className="p-6 space-y-5">
              <ToggleRow
                label="Profil sichtbar"
                description="Dein Profil ist im Founder-Netzwerk auffindbar."
                checked={privacy.profileVisible}
                onToggle={() => setPrivacy(prev => ({ ...prev, profileVisible: !prev.profileVisible }))}
              />
              <ToggleRow
                label="Follower-Zahlen anzeigen"
                description="Zeigt Follower- und Following-Counts im Profil."
                checked={privacy.showFollowerCounts}
                onToggle={() => setPrivacy(prev => ({ ...prev, showFollowerCounts: !prev.showFollowerCounts }))}
              />
            </div>
          </section>

          <section className="glass-card rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Messaging</div>
            </div>
            <div className="p-6 space-y-3 text-sm text-white/60">
              <div>DMs sind fuer alle Founder offen.</div>
              <div className="text-xs text-white/30">Spam- und Beleidigungsfilter werden serverseitig enforced.</div>
            </div>
          </section>

          <section className="rounded-3xl border border-red-500/30 bg-red-500/5 overflow-hidden">
            <div className="p-6 border-b border-red-500/20 flex items-center gap-3 text-red-200">
              <Trash2 className="w-4 h-4" />
              <div className="text-xs font-bold uppercase tracking-[0.3em]">Danger Zone</div>
            </div>
            <div className="p-6 space-y-4 text-sm text-red-100/80">
              <p>
                Account-Loeschung ist endgueltig. Dein Login wird deaktiviert, dein Profil wird entfernt.
                Nachrichten und Account-Infos werden aus Sicherheitsgruenden archiviert.
              </p>

              {!deleteOpen ? (
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="rounded-2xl border border-red-400/40 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-red-200 transition hover:bg-red-500/10"
                >
                  Account loeschen
                </button>
              ) : (
                <div className="space-y-4">
                  <label className="flex items-start gap-3 text-xs text-red-200/80">
                    <input
                      type="checkbox"
                      checked={deleteChecked}
                      onChange={(event) => setDeleteChecked(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-red-500/40 bg-transparent"
                    />
                    Ich bestaetige, dass mein Account sofort deaktiviert wird.
                  </label>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-200/60">
                      Tippe DELETE zur Bestaetigung
                    </label>
                    <input
                      value={deleteConfirm}
                      onChange={(event) => setDeleteConfirm(event.target.value)}
                      placeholder="DELETE"
                      className="w-full rounded-xl border border-red-500/30 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                  {deleteError && (
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">
                      {deleteError}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={!canDelete || deleting}
                      className="rounded-2xl bg-red-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition disabled:opacity-40"
                    >
                      {deleting ? 'Loescht...' : 'Endgueltig loeschen'}
                    </button>
                    <button
                      onClick={() => {
                        setDeleteOpen(false);
                        setDeleteConfirm('');
                        setDeleteChecked(false);
                      }}
                      className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </PageShell>
    </AuthGuard>
  );
}
