import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Library, NotebookPen, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';

/**
 * App shell — header on all viewports + bottom nav on mobile / side nav on
 * larger screens. The reader page hides the chrome to maximize page area.
 */
export default function AppLayout() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const location = useLocation();

  const isReader = location.pathname.startsWith('/read/');

  return (
    <div className="min-h-screen flex flex-col bg-parchment-50 dark:bg-ink-950">
      {!isReader && (
        <header className="sticky top-0 z-30 border-b border-ink-100 dark:border-ink-900
                           bg-white/80 dark:bg-ink-950/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <BookOpen className="w-5 h-5 text-royal-600 dark:text-royal-400 group-hover:scale-110 transition-transform" />
              <span className="font-display text-xl tracking-wide">Lumen</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavItem to="/" icon={<Library className="w-4 h-4" />} label="Library" />
              <NavItem to="/notes" icon={<NotebookPen className="w-4 h-4" />} label="Notes" />
              <NavItem to="/settings" icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-ink-500 dark:text-ink-400">Signed in as</p>
                <p className="text-sm font-medium leading-tight truncate max-w-[10rem]">
                  {profile?.displayName ?? profile?.email ?? '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="btn-ghost p-2"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isReader && (
        <nav
          className="md:hidden sticky bottom-0 z-30 border-t border-ink-100 dark:border-ink-900
                     bg-white/95 dark:bg-ink-950/95 backdrop-blur"
        >
          <div className="grid grid-cols-3 max-w-md mx-auto">
            <BottomNavItem to="/" icon={<Library />} label="Library" />
            <BottomNavItem to="/notes" icon={<NotebookPen />} label="Notes" />
            <BottomNavItem to="/settings" icon={<SettingsIcon />} label="Settings" />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium',
          'transition-colors',
          isActive
            ? 'text-royal-700 bg-royal-50 dark:text-royal-300 dark:bg-royal-900/30'
            : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-900',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function BottomNavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 py-2 text-xs',
          isActive ? 'text-royal-700 dark:text-royal-300' : 'text-ink-500 dark:text-ink-400',
        )
      }
    >
      <span className="w-5 h-5">{icon}</span>
      {label}
    </NavLink>
  );
}
