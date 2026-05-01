import { Moon, Sun, Type } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { updateSettings } from '@/services/repository/profile';
import { notify } from '@/services/notifier';

export default function Settings() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  if (!profile) return null;
  const { darkMode, fontScale } = profile.settings;

  const apply = async (changes: Partial<typeof profile.settings>) => {
    const next = { ...profile, settings: { ...profile.settings, ...changes } };
    setProfile(next);
    try {
      await updateSettings(profile.uid, changes);
    } catch (err) {
      notify.error('Save failed', err instanceof Error ? err.message : 'Please try again.');
      setProfile(profile); // rollback
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
          Preferences are saved to your account and travel with you.
        </p>
      </header>

      <section className="card p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 mt-0.5 text-royal-500" />
            ) : (
              <Sun className="w-5 h-5 mt-0.5 text-amber-500" />
            )}
            <div>
              <h2 className="font-medium">Dark mode</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                Easier on the eyes for long reading sessions.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            onClick={() => void apply({ darkMode: !darkMode })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              darkMode ? 'bg-royal-600' : 'bg-ink-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                darkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-ink-100 dark:border-ink-800 pt-5">
          <div className="flex gap-3 mb-3">
            <Type className="w-5 h-5 mt-0.5 text-royal-500" />
            <div>
              <h2 className="font-medium">UI scale</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                Adjust the size of menus, drawers, and buttons. Independent of in-PDF zoom.
              </p>
            </div>
          </div>
          <input
            type="range"
            min={0.85}
            max={1.25}
            step={0.05}
            value={fontScale}
            onChange={(e) => void apply({ fontScale: Number(e.target.value) })}
            className="w-full accent-royal-600"
          />
          <div className="flex justify-between text-[11px] text-ink-400 mt-1">
            <span>Compact</span>
            <span>{Math.round(fontScale * 100)}%</span>
            <span>Comfortable</span>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-medium mb-2">Account</h2>
        <p className="text-sm text-ink-600 dark:text-ink-300">{profile.email ?? '—'}</p>
        <p className="text-xs text-ink-400 mt-1">UID: {profile.uid}</p>
      </section>
    </div>
  );
}
