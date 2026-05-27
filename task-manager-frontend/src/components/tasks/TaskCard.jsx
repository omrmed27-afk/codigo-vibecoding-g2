import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/dateUtils';

export default function TaskCard({ task, onEdit, onDelete }) {
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(task);
  };

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={`font-medium text-gray-900 leading-snug flex-1 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
            aria-label="Editar tarea"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-100 transition-colors cursor-pointer"
            aria-label="Eliminar tarea"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge status={task.status} />
        <span className="text-xs text-gray-400">{formatDate(task.created_at)}</span>
      </div>
    </Link>
  );
}
