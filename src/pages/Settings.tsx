import { useState } from 'react';
import {
  Sun,
  BookOpen,
  Moon,
  Type,
  SunDim,
  Focus,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { updateSettings } from '@/services/repository/profile';
import { notify } from '@/services/notifier';
import { cn } from '@/utils/cn';
import {
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  type ReadingFont,
  type Theme,
  type UserSettings,
} from '@/types';

interface ThemeChoice {
  value: Theme;
  label: string;
  description: string;
  icon: typeof Sun;
  /** Inline preview swatch — gives the user a real glimpse of each mode. */
  swatch: { background: string; foreground: string; accent: string };
}

const THEMES: ThemeChoice[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright daylight reading. Crisp contrast.',
    icon: Sun,
    swatch: { background: '#fdfaf3', foreground: '#16171c', accent: '#4a5bf3' },
  },
  {
    value: 'paper',
    label: 'Paper',
    description: 'Kindle-like cream page with a fine grain texture.',
    icon: BookOpen,
    swatch: { background: '#f5ecd2', foreground: '#2e261c', accent: '#7d6240' },
  },
  {
    value: 'dark',
    label: 'Night',
    description: 'Soft warm-grey for after-dark sessions.',
    icon: Moon,
    swatch: { background: '#0b0c10', foreground: '#f6f6f7', accent: '#96a9ff' },
  },
];

const FONT_FAMILIES: Array<{ value: ReadingFont; label: string; sample: string }> = [
  { value: 'serif', label: 'Serif (Lora)', sample: 'Aa' },
  { value: 'sans', label: 'Sans (Inter)', sample: 'Aa' },
];

export default function Settings() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  // Local snapshot of in-flight slider values so React doesn't re-render
  // a write-on-every-frame storm while the user drags. Persisted on commit.
  const [pendingBrightness, setPendingBrightness] = useState<number | null>(null);
  const [pendingScale, setPendingScale] = useState<number | null>(null);

  if (!profile) return null;
  const settings = profile.settings;

  /**
   * Optimistically patch the in-memory profile, then write through to
   * Firestore. If the write fails we roll back and surface a toast.
   */
  const apply = async (changes: Partial<UserSettings>) => {
    const previous = profile;
    setProfile({ ...profile, settings: { ...profile.settings, ...changes } });
    try {
      await updateSettings(profile.uid, changes);
    } catch (err) {
      notify.error('Save failed', err instanceof Error ? err.message : 'Please try again.');
      setProfile(previous);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 font-reading">
      <header>
        <h1 className="font-display text-3xl tracking-tight">Settings</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 paper:text-sepia-500 mt-1">
          Preferences are saved to your account and travel with you.
        </p>
      </header>

      {/* Theme picker — three-way radio with live previews. */}
      <section className="card p-5 space-y-4">
        <div className="flex gap-3">
          <BookOpen className="w-5 h-5 mt-0.5 text-royal-500" />
          <div>
            <h2 className="font-medium">Reading theme</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 paper:text-sepia-500 mt-0.5">
              Pick the surface that feels most like a page to you.
            </p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Reading theme"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {THEMES.map((choice) => {
            const Icon = choice.icon;
            const active = settings.theme === choice.value;
            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => void apply({ theme: choice.value })}
                className={cn(
                  'group relative text-left rounded-xl border p-3 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500',
                  active
                    ? 'border-royal-500 ring-2 ring-royal-500/30'
                    : 'border-ink-100 dark:border-ink-800 hover:border-ink-200 dark:hover:border-ink-700',
                )}
              >
                <div
                  className="h-12 rounded-md mb-2 flex items-center justify-end px-2"
                  style={{
                    background: choice.swatch.background,
                    color: choice.swatch.foreground,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: choice.swatch.accent }} />
                </div>
                <div className="font-medium text-sm flex items-center gap-1.5">
                  {choice.label}
                  {active && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-royal-500" />
                  )}
                </div>
                <p className="text-[11px] text-ink-500 dark:text-ink-400 paper:text-sepia-500 mt-0.5 leading-snug">
                  {choice.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Font family + scale */}
      <section className="card p-5 space-y-5">
        <div className="flex gap-3">
          <Type className="w-5 h-5 mt-0.5 text-royal-500" />
          <div>
            <h2 className="font-medium">Typography</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 paper:text-sepia-500 mt-0.5">
              Pick a reading face and how comfortable you want the UI scale.
            </p>
          </div>
        </div>

        <div role="radiogroup" aria-label="Reading font" className="grid grid-cols-2 gap-3">
          {FONT_FAMILIES.map((font) => {
            const active = settings.fontFamily === font.value;
            return (
              <button
                key={font.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => void apply({ fontFamily: font.value })}
                className={cn(
                  'rounded-xl border p-3 transition-all text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500',
                  active
                    ? 'border-royal-500 ring-2 ring-royal-500/30'
                    : 'border-ink-100 dark:border-ink-800 hover:border-ink-200 dark:hover:border-ink-700',
                )}
              >
                <span
                  className={cn(
                    'block text-3xl mb-1',
                    font.value === 'serif' ? 'font-serif' : 'font-sans',
                  )}
                >
                  {font.sample}
                </span>
                <span className="text-xs">{font.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-ink-100 dark:border-ink-800 paper:border-paper-300 pt-5">
          <label htmlFor="ui-scale" className="block text-sm font-medium mb-1">
            UI scale
          </label>
          <p className="text-xs text-ink-500 dark:text-ink-400 paper:text-sepia-500 mb-3">
            Adjusts menus, drawers, and buttons. Independent of the in-PDF zoom.
          </p>
          <input
            id="ui-scale"
            type="range"
            min={FONT_SCALE_MIN}
            max={FONT_SCALE_MAX}
            step={0.05}
            value={pendingScale ?? settings.fontScale}
            onChange={(e) => setPendingScale(Number(e.target.value))}
            onMouseUp={() => {
              if (pendingScale !== null) {
                void apply({ fontScale: pendingScale });
                setPendingScale(null);
              }
            }}
            onTouchEnd={() => {
              if (pendingScale !== null) {
                void apply({ fontScale: pendingScale });
                setPendingScale(null);
              }
            }}
            className="w-full accent-royal-600"
          />
          <div className="flex justify-between text-[11px] text-ink-400 mt-1">
            <span>Compact</span>
            <span>{Math.round((pendingScale ?? settings.fontScale) * 100)}%</span>
            <span>Comfortable</span>
          </div>
        </div>
      </section>

      {/* Brightness slider — same overlay the right-edge gesture controls. */}
      <section className="card p-5 space-y-3">
        <div className="flex gap-3">
          <SunDim className="w-5 h-5 mt-0.5 text-royal-500" />
          <div className="flex-1">
            <h2 className="font-medium">Brightness</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 paper:text-sepia-500 mt-0.5">
              Soften the screen for low-light reading. Drag along the right
              edge of the screen, hold Alt + scroll, or use the [ and ] keys.
            </p>
          </div>
        </div>
        <input
          aria-label="Brightness"
          type="range"
          min={BRIGHTNESS_MIN}
          max={BRIGHTNESS_MAX}
          step={0.05}
          value={pendingBrightness ?? settings.brightness}
          onChange={(e) => setPendingBrightness(Number(e.target.value))}
          onMouseUp={() => {
            if (pendingBrightness !== null) {
              void apply({ brightness: pendingBrightness });
              setPendingBrightness(null);
            }
          }}
          onTouchEnd={() => {
            if (pendingBrightness !== null) {
              void apply({ brightness: pendingBrightness });
              setPendingBrightness(null);
            }
          }}
          className="w-full accent-royal-600"
        />
        <div className="flex justify-between text-[11px] text-ink-400">
          <span>Dim</span>
          <span>{Math.round((pendingBrightness ?? settings.brightness) * 100)}%</span>
          <span>Bright</span>
        </div>
      </section>

      {/* Focus mode toggle */}
      <section className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <Focus className="w-5 h-5 mt-0.5 text-royal-500" />
            <div>
              <h2 className="font-medium">Focus mode</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400 paper:text-sepia-500 mt-0.5 max-w-md">
                Mutes in-app sounds and toast notifications, and asks the
                browser to keep the screen awake. Notifications from other
                apps stay outside our reach — silence those at the OS level.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.focusMode}
            aria-label="Focus mode"
            onClick={() => void apply({ focusMode: !settings.focusMode })}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              settings.focusMode ? 'bg-royal-600' : 'bg-ink-300 dark:bg-ink-700',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                settings.focusMode ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {settings.focusMode && (
          <p className="mt-3 flex gap-2 text-xs text-ink-500 dark:text-ink-400 paper:text-sepia-500">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Critical errors will still surface — only routine notifications
              are silenced so you don't miss anything important.
            </span>
          </p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-medium mb-2">Account</h2>
        <p className="text-sm text-ink-600 dark:text-ink-300 paper:text-sepia-600">
          {profile.email ?? '—'}
        </p>
        <p className="text-xs text-ink-400 mt-1">UID: {profile.uid}</p>
      </section>
    </div>
  );
}
