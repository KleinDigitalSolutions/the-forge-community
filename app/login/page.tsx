'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      // Use NextAuth signIn
      // Note: In client components we usually use signIn from 'next-auth/react' 
      // but for simple magic link we can verify redirect behavior.
      // Actually, for "magic link" with Resend provider, standard is calling signIn('resend', { email })
      
      // Since we are not wrapping everything in SessionProvider yet, we use a server action or direct API call.
      // But 'next-auth/react' is the standard way. Let's assume we can import it. 
      // Wait, 'next-auth/react' needs SessionProvider.
      // Simplest way for App Router without Context hell: use the server action provided by auth() or standard API POST.
      // We will use standard form submission to /api/auth/signin/resend for now or import signIn dynamically.
      
      // Let's use the dynamic import to avoid large bundles if possible, or just standard import.
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
          setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email prüfen</h2>
        <p className="text-gray-600 mb-6">
          Wir haben dir einen Magic Link an <strong>{email}</strong> gesendet.
          <br />Klicke auf den Link in der Email, um dich anzumelden.
        </p>
        <p className="text-xs text-gray-400">
          (Check auch deinen Spam-Ordner)
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-xs tracking-widest group-hover:bg-red-600 transition-colors">
            TF
          </div>
          <span className="font-bold text-gray-900">THE FORGE</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Founder Login</h1>
        <p className="text-gray-600">
          Nur für registrierte Founder. Gib deine Email ein, um deinen Magic Link zu erhalten.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Deine Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
              disabled={status === 'loading'}
            />
          </div>

          {(errorMessage || urlError) && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {urlError === 'AccessDenied' 
                  ? 'Zugriff verweigert. Diese Email ist nicht in der Founder-Datenbank.' 
                  : errorMessage || 'Ein Fehler ist aufgetreten.'}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sende Link...
              </>
            ) : (
              <>
                Magic Link senden
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Noch kein Founder?{' '}
            <Link href="/#join" className="text-black font-semibold hover:underline">
              Jetzt bewerben
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="w-3 h-3" />
        <span>Gesichert durch Passwordless Auth</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-center">Lade...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
