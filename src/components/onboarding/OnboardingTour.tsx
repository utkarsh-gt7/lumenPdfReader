import { useState } from 'react';
import {
  Hand,
  ZoomIn,
  Bookmark,
  ArrowLeftRight,
  Keyboard,
  ChevronRight,
  X,
} from 'lucide-react';
import type { DeviceType } from '@/types';
import { cn } from '@/utils/cn';

interface OnboardingTourProps {
  device: DeviceType;
  onClose: () => void;
}

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
}

function stepsFor(device: DeviceType): Step[] {
  if (device === 'desktop') {
    return [
      {
        icon: <Hand className="w-6 h-6" />,
        title: 'Click & drag to select',
        body: 'Highlight any text by clicking and dragging — a small toolbar pops up with color, note, and dictionary actions.',
      },
      {
        icon: <ZoomIn className="w-6 h-6" />,
        title: 'Ctrl/Cmd + scroll to zoom',
        body: 'Hold ⌘/Ctrl while scrolling to zoom in or out. Use 0 to reset.',
      },
      {
        icon: <Bookmark className="w-6 h-6" />,
        title: 'Press B to bookmark',
        body: 'Bookmark the current page anytime — Lumen syncs the position to all your devices.',
      },
      {
        icon: <Keyboard className="w-6 h-6" />,
        title: 'Arrow keys to turn pages',
        body: '← / → moves between pages. Esc closes any drawer or selection menu.',
      },
    ];
  }
  return [
    {
      icon: <Hand className="w-6 h-6" />,
      title: 'Long-press text to select',
      body: 'Press and hold any word to start a selection — drag the handles to extend, then choose a color or note.',
    },
    {
      icon: <ZoomIn className="w-6 h-6" />,
      title: 'Pinch to zoom',
      body: 'Use two fingers to zoom in or out. Tap the % badge in the toolbar to reset.',
    },
    {
      icon: <ArrowLeftRight className="w-6 h-6" />,
      title: 'Swipe to turn pages',
      body: 'Swipe left for the next page, right to go back — like a real book.',
    },
    {
      icon: <Bookmark className="w-6 h-6" />,
      title: 'Double-tap to bookmark',
      body: 'Double-tap an empty area on the page to drop a bookmark you can return to from any device.',
    },
  ];
}

export default function OnboardingTour({ device, onClose }: OnboardingTourProps) {
  const steps = stepsFor(device);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 animate-fade-in"
      role="dialog"
      aria-label="Gesture tour"
    >
      <div className="w-full max-w-md card overflow-hidden bg-ink-900 text-ink-50 border-ink-800">
        <div className="bg-hero-library px-5 py-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip tour"
            className="absolute top-3 right-3 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-white/15 text-white">
            {step.icon}
          </div>
          <h2 className="font-display text-2xl mt-3">{step.title}</h2>
          <p className="text-sm text-white/80 mt-1">{step.body}</p>
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t border-ink-800">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  i === index ? 'bg-royal-400' : 'bg-ink-700',
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-ink-400 hover:text-ink-100"
            >
              {isLast ? 'Done' : 'Skip'}
            </button>
            {!isLast && (
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="btn-primary px-3 py-1.5 text-sm"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={onClose}
                className="btn-primary px-3 py-1.5 text-sm"
              >
                Start reading
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
