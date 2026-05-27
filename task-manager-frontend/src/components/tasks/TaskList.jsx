import TaskCard from './TaskCard';
import Button from '../ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-1">
          <div className="w-7 h-7 bg-gray-200 rounded-lg" />
          <div className="w-7 h-7 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="mt-2 h-3 bg-gray-200 rounded w-full" />
      <div className="mt-1 h-3 bg-gray-200 rounded w-4/5" />
      <div className="mt-3 flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Sin tareas todavía</h3>
      <p className="text-sm text-gray-500 mb-6">Crea tu primera tarea para empezar a organizarte.</p>
      <Button onClick={onCreate} variant="primary">
        <PlusIcon className="w-4 h-4" />
        Crear tarea
      </Button>
    </div>
  );
}

export default function TaskList({ tasks, loading, onEdit, onDelete, onCreate }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState onCreate={onCreate} />;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
