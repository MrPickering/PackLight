import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Package, BookOpen, Users, Map, RefreshCw, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Package, label: 'Pack' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/agents', icon: Users, label: 'Agents' },
  { to: '/trail', icon: Map, label: 'Trail' },
  { to: '/repack', icon: RefreshCw, label: 'Repack' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-56 bg-slate-900 border-r border-slate-800 p-4 gap-1 shrink-0">
        <div className="mb-6 px-3">
          <h1 className="text-lg font-semibold text-white tracking-tight">PackLight</h1>
          <p className="text-xs text-slate-500 mt-0.5">Lighten your load</p>
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around px-2 py-1 z-50">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
