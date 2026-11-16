import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/tasks', label: 'My Tasks', icon: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01', end: true },
  { to: '/tasks/new', label: 'New Task', icon: 'M12 5v14M5 12h14' },
  { to: '/profile', label: 'Profile', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <>
      {open && <div className="fixed inset-0 top-14 z-20 bg-slate-900/40 lg:hidden" onClick={onNavigate} aria-hidden="true" />}
      <aside
        id="app-sidebar"
        className={`fixed bottom-0 left-0 top-14 z-20 w-60 border-r border-slate-200 bg-white p-3 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav aria-label="Main">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to} end={l.end ?? false} onClick={onNavigate}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={l.icon} /></svg>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
