import { Link } from 'react-router-dom';

const tones = {
  slate: 'text-slate-900 bg-white',
  amber: 'text-slate-900 bg-white',
  blue: 'text-blue-700 bg-white',
  green: 'text-green-700 bg-white',
  red: 'text-red-700 bg-white',
};
const dots = { slate: 'bg-slate-400', amber: 'bg-slate-400', blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500' };

export default function StatCard({ label, value, tone = 'slate', to }) {
  return (
    <Link to={to} className={`block rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:shadow-sm ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span className={`h-2 w-2 rounded-full ${dots[tone]}`} aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
    </Link>
  );
}
