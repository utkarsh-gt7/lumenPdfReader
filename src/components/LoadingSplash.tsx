import { BookOpen } from 'lucide-react';

/** Full-screen branded loader, used during auth initialization. */
export default function LoadingSplash({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-950 text-ink-100">
      <div className="relative">
        <BookOpen className="w-10 h-10 text-royal-400 animate-pulse-slow" aria-hidden />
        <div className="absolute -inset-3 rounded-full bg-royal-500/15 blur-xl -z-10" />
      </div>
      <p className="font-display tracking-wide text-sm text-ink-400">{label}</p>
    </div>
  );
}
