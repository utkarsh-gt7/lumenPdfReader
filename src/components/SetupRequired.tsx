import { ShieldAlert } from 'lucide-react';

/** Rendered when the Firebase env vars are missing. Provides a copy-paste fix. */
export default function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ink-950 text-ink-50">
      <div className="max-w-lg w-full card p-8 space-y-5 bg-ink-900 border-ink-800">
        <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl">Firebase configuration required</h1>
          <p className="text-sm text-ink-400 mt-2">
            Lumen runs entirely in the cloud. Add your Firebase Web config to
            <code className="mx-1 px-1.5 py-0.5 rounded bg-ink-800">.env.local</code>
            and restart the dev server.
          </p>
        </div>
        <div className="text-xs font-mono bg-black/30 rounded-md p-3 border border-ink-800 text-ink-200">
          {missing.length > 0 ? (
            <>
              <p className="text-amber-400 mb-1.5">Missing variables:</p>
              <ul className="space-y-0.5">
                {missing.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>All required variables are present, but initialization failed.</p>
          )}
        </div>
        <p className="text-xs text-ink-500">
          See <code className="px-1 rounded bg-ink-800">README.md</code> &rarr; <em>Setup</em>
          &nbsp;for the complete walkthrough.
        </p>
      </div>
    </div>
  );
}
