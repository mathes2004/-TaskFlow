import { useAuth } from '../../context/AuthContext';
import { isDueSoon } from '../../utils/dates';

/** Red "Overdue" (from the server's is_overdue) or amber "Due soon" (today / tomorrow). */
export default function OverdueBadge({ task }) {
  const { user } = useAuth();
  if (task.is_overdue) {
    return <span className="inline-flex items-center rounded-full border border-red-500 px-2.5 py-0.5 text-xs font-semibold text-red-700">Overdue</span>;
  }
  if (isDueSoon(task, user?.timezone)) {
    return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Due soon</span>;
  }
  return null;
}
