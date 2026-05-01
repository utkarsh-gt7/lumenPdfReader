import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { notify } from '@/services/notifier';

type Mode = 'sign-in' | 'sign-up';

interface LocationState {
  from?: string;
}

export default function Login() {
  const status = useAuthStore((s) => s.status);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);

  // Auto-redirect once authenticated.
  useEffect(() => {
    if (status === 'authenticated') {
      navigate(from, { replace: true });
    }
  }, [status, navigate, from]);

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy('email');
    try {
      if (mode === 'sign-in') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName || undefined);
      }
    } catch (err) {
      notify.error(
        mode === 'sign-in' ? 'Sign-in failed' : 'Sign-up failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (err) {
      notify.error(
        'Google sign-in failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-parchment-50 dark:bg-ink-950">
      {/* Brand panel — hidden on small screens */}
      <div className="hidden lg:flex relative overflow-hidden bg-hero-library text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 bg-paper-grain opacity-50 [background-size:24px_24px]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <BookOpen className="w-7 h-7" />
            <span className="font-display text-3xl tracking-wide">Lumen</span>
          </div>
          <h1 className="font-display text-5xl leading-tight max-w-md">
            Your books.
            <br />
            On every screen.
            <br />
            <span className="opacity-70">Right where you left off.</span>
          </h1>
          <p className="mt-6 text-white/70 max-w-md">
            A beautifully designed PDF reader that keeps your reading position,
            highlights, and notes in perfect sync — phone, tablet, laptop.
          </p>
        </div>
        <ul className="relative space-y-2 text-white/80 text-sm">
          <li>· Pick up exactly where you left off, on any device</li>
          <li>· Highlight in six colors, take rich notes, look up words</li>
          <li>· Tap-to-bookmark, pinch-to-zoom, swipe-to-turn</li>
        </ul>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <BookOpen className="w-6 h-6 text-royal-600 dark:text-royal-400" />
            <span className="font-display text-2xl">Lumen</span>
          </div>

          <h2 className="font-display text-3xl mb-1">
            {mode === 'sign-in' ? 'Welcome back.' : 'Start reading.'}
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
            {mode === 'sign-in'
              ? 'Sign in to access your library.'
              : 'Create an account — your library follows you everywhere.'}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy !== null}
            className="btn-secondary w-full py-2.5"
          >
            {busy === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-400">
            <div className="flex-1 h-px bg-ink-200 dark:bg-ink-800" />
            or use email
            <div className="flex-1 h-px bg-ink-200 dark:bg-ink-800" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === 'sign-up' && (
              <FieldRow icon={<User2 className="w-4 h-4" />}>
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </FieldRow>
            )}
            <FieldRow icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                required
                className="input pl-9"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </FieldRow>
            <FieldRow icon={<Lock className="w-4 h-4" />}>
              <input
                type="password"
                required
                minLength={6}
                className="input pl-9"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              />
            </FieldRow>

            <button
              type="submit"
              disabled={busy !== null}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {busy === 'email' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-sm text-center text-ink-500 dark:text-ink-400">
            {mode === 'sign-in' ? "Don't have an account?" : 'Already have one?'}{' '}
            <button
              type="button"
              className="text-royal-600 dark:text-royal-400 hover:underline font-medium"
              onClick={() => setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'))}
            >
              {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
        {icon}
      </span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.81-.073-1.589-.21-2.34H12v4.43h5.387a4.6 4.6 0 0 1-2 3.018v2.51h3.234c1.892-1.744 2.98-4.31 2.98-7.618z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.62-2.426l-3.234-2.51c-.896.6-2.04.957-3.386.957-2.604 0-4.81-1.76-5.598-4.124H3.064v2.59A9.997 9.997 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.402 13.897A6.005 6.005 0 0 1 6.084 12c0-.66.114-1.302.318-1.897V7.513H3.064A9.997 9.997 0 0 0 2 12c0 1.617.388 3.143 1.064 4.487l3.338-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.467 0 2.785.504 3.823 1.494l2.866-2.866C16.96 3.024 14.696 2 12 2 8.116 2 4.756 4.232 3.064 7.513l3.338 2.59C7.19 7.736 9.396 5.977 12 5.977z"
      />
    </svg>
  );
}
