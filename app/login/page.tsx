'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'loading'>('idle');

  const turnstileBypass = process.env.NEXT_PUBLIC_TURNSTILE_BYPASS === '1';
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === '1';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      setIsLocalhost(host === 'localhost' || host === '127.0.0.1');
    }
  }, []);

  useEffect(() => {
    if (turnstileBypass || isLocalhost) {
      setToken('local-bypass');
    }
  }, [turnstileBypass, isLocalhost]);
  
  const isVerify = searchParams.get('verify') === 'true';
  const urlError = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token && !(turnstileBypass || isLocalhost)) {
       setErrorMessage('Bitte bestätige, dass du kein Bot bist.');
       setStatus('error');
       return;
    }

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
        setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
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

  const handleGoogleLogin = async () => {
    setGoogleStatus('loading');
    try {
      const { signIn } = await import('next-auth/react');
      await signIn('google', { callbackUrl: '/dashboard' });
    } finally {
      setGoogleStatus('idle');
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

      <div className="glass-card p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
        {/* Animated Video Background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[1px] scale-110"
            style={{ filter: 'brightness(0.4) saturate(1.5)' }}
          >
            <source src="/login-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70 backdrop-blur-[2px]" />

          {/* Pulsating Glow Effect (Lightning Flash) */}
          <div className="absolute inset-0 bg-gradient-radial from-[#D4AF37]/10 via-transparent to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse" />
        </div>

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
              placeholder="founder@stakeandscale.de"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[#D4AF37] focus:ring-0 outline-none transition-all placeholder:text-white/10"
              disabled={status === 'loading'}
            />
          </div>

          {(errorMessage || urlError) && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs text-red-400 leading-relaxed uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {errorMessage || (urlError === 'Verification' 
                  ? 'Der Link ist abgelaufen oder wurde bereits genutzt. Bitte fordere einen neuen an.' 
                  : 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.')}
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

          {!turnstileBypass && !isLocalhost && (
            <div className="flex justify-center py-2 scale-90">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} 
                onSuccess={(token: string) => setToken(token)}
                onError={() => setStatus('error')}
                options={{ theme: 'dark' }}
              />
            </div>
          )}
        </form>

        {googleEnabled && (
          <div className="mt-8 space-y-4 relative z-10">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
              <div className="h-px flex-1 bg-white/5" />
              <span>oder</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleStatus === 'loading'}
              className="w-full border border-white/10 bg-white/5 text-white/80 font-bold py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em] disabled:opacity-40"
            >
              {googleStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verbinde...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.9 32.657 29.393 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.327 4.327-17.694 10.691z" />
                    <path fill="#4CAF50" d="M24 44c5.314 0 10.02-1.986 13.576-5.219l-6.271-5.307C29.41 35.092 26.82 36 24 36c-5.372 0-9.92-3.356-11.522-8.043l-6.522 5.025C9.276 39.556 16.19 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.067 2.884-3.12 5.183-5.998 6.474l6.271 5.307C33.76 41.602 44 36.5 44 24c0-1.341-.138-2.651-.389-3.917z" />
                  </svg>
                  Mit Google fortfahren
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-10 text-center relative z-10 border-t border-white/5 pt-8">
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold">
            Noch kein Founder?{' '}
            <Link href="/#apply" className="text-[#D4AF37] hover:underline ml-2 whitespace-nowrap">
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
