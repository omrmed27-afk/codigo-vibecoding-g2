import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTask } from '../hooks/useTask';
import Header from '../components/layout/Header';
import PageWrapper from '../components/layout/PageWrapper';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EditTaskDialog from '../components/tasks/EditTaskDialog';
import DeleteTaskDialog from '../components/tasks/DeleteTaskDialog';
import { formatDate } from '../utils/dateUtils';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { task, loading, error, updateTask, deleteTask } = useTask(id);
  const [dialog, setDialog] = useState(null);

  const handleDeleted = async (taskId) => {
    await deleteTask(taskId);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PageWrapper>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="flex gap-3 mt-4">
              <div className="h-6 bg-gray-200 rounded-full w-24" />
              <div className="h-6 bg-gray-200 rounded w-28" />
            </div>
          </div>
        </PageWrapper>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PageWrapper>
          <div className="text-center py-16">
            <p className="text-gray-500">{error || 'Tarea no encontrada.'}</p>
            <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
              Volver a la lista
            </Button>
          </div>
        </PageWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className={`text-xl font-bold text-gray-900 leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDialog('edit')}
                className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                aria-label="Editar"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDialog('delete')}
                className="p-2 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-100 transition-colors cursor-pointer"
                aria-label="Eliminar"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {task.description ? (
            <p className="text-gray-600 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
              {task.description}
            </p>
          ) : (
            <p className="text-gray-400 text-sm italic mb-5">Sin descripción</p>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
            <Badge status={task.status} />
            <span className="text-xs text-gray-400">Creada el {formatDate(task.created_at)}</span>
          </div>
        </div>
      </PageWrapper>

      <EditTaskDialog
        isOpen={dialog === 'edit'}
        onClose={() => setDialog(null)}
        task={task}
        onUpdated={updateTask}
      />
      <DeleteTaskDialog
        isOpen={dialog === 'delete'}
        onClose={() => setDialog(null)}
        task={task}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
