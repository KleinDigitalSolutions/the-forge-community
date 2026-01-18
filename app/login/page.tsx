'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const isVerify = searchParams.get('verify') === 'true';
  const urlError = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const { signIn } = await import('next-auth/react');
      
      const result = await signIn('resend', {
        email,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        if (result.error === 'AccessDenied') {
          setErrorMessage('Diese Email ist nicht als Founder registriert.');
        } else {
          setErrorMessage('Ein fitte Fehler ist aufgetreten. Bitte versuche es erneut.');
        }
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Verbindungsfehler. Bitte prüfe deine Internetverbindung.');
      setStatus('error');
    }
  };

  if (isVerify || status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-instrument-serif text-white mb-4">Posteingang prüfen</h2>
        <p className="text-white/50 mb-8 max-w-sm mx-auto leading-relaxed">
          Wir haben dir einen Magic Link an <strong className="text-white">{email}</strong> gesendet.
          Klicke auf den Link in der Email, um dich anzumelden.
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
          (Check auch deinen Spam-Ordner)
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-12">
        <Link href="/" className="inline-flex flex-col mb-8 group">
          <span className="font-caveat text-4xl tracking-normal text-white group-hover:text-[#D4AF37] transition-colors lowercase">stake & scale</span>
        </Link>
        <h1 className="text-4xl font-instrument-serif text-white mb-3">Founder Login</h1>
        <p className="text-white/40 text-sm uppercase tracking-widest font-bold">
          Exklusiver Zugang für Operatoren.
        </p>
      </div>

      <div className="glass-card p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">
              Identitäts-Token (Email)
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@theforge.community"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[#D4AF37] focus:ring-0 outline-none transition-all placeholder:text-white/10"
              disabled={status === 'loading'}
            />
          </div>

          {(errorMessage || urlError) && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs text-red-400 leading-relaxed uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {urlError === 'AccessDenied' 
                  ? 'Zugriff verweigert. Diese Email ist nicht in der Datenbank.' 
                  : errorMessage || 'Ein Fehler ist aufgetreten.'}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#D4AF37] text-black font-black py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-[#D4AF37]/20"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Übertrage...
              </>
            ) : (
              <>
                Magic Link anfordern
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center relative z-10 border-t border-white/5 pt-8">
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold">
            Noch kein Founder?{' '}
            <Link href="/#apply" className="text-[#D4AF37] hover:underline ml-2">
              Jetzt bewerben
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-12 text-center flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">
        <Shield className="w-3.5 h-3.5" />
        <span>Verschlüsselte Authentifizierung</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />
      <Suspense fallback={<div className="text-white/20 text-[10px] font-bold uppercase tracking-widest animate-pulse">Lade System...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}