import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
      </span>
      TaskFlow
    </span>
  );
}

export default function Navbar({ menuOpen, onToggleMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleLogout() {
    try { await logout(); } catch { /* local state is cleared anyway */ }
    toast.info('You have been logged out.');
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMenu} aria-label="Toggle navigation menu" aria-expanded={menuOpen} aria-controls="app-sidebar"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
          </button>
          <Link to="/dashboard" aria-label="TaskFlow home"><Logo /></Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="hidden items-center gap-2 text-sm text-slate-700 hover:text-indigo-700 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700" aria-hidden="true">
              {user?.name?.trim()?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span className="max-w-40 truncate">{user?.name}</span>
          </Link>
          <Button variant="secondary" size="sm" onClick={handleLogout}>Log out</Button>
        </div>
      </div>
    </header>
  );
}
