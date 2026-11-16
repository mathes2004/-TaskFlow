import { priorityLabel } from '../../utils/labels';

const styles = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-700',
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[priority] ?? styles.low}`}>
      {priorityLabel(priority)}
    </span>
  );
}
