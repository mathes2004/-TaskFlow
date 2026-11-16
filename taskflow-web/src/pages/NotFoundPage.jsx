import { Link } from 'react-router-dom';
import usePageTitle from '../utils/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-1 text-slate-600">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">Go to Dashboard</Link>
    </div>
  );
}
