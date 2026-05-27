import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useTasks } from '../hooks/useTasks';
import Header from '../components/layout/Header';
import PageWrapper from '../components/layout/PageWrapper';
import TaskList from '../components/tasks/TaskList';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';
import EditTaskDialog from '../components/tasks/EditTaskDialog';
import DeleteTaskDialog from '../components/tasks/DeleteTaskDialog';

export default function TaskListPage() {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks();
  const [dialog, setDialog] = useState({ type: null, task: null });

  const openCreate = () => setDialog({ type: 'create', task: null });
  const openEdit = (task) => setDialog({ type: 'edit', task });
  const openDelete = (task) => setDialog({ type: 'delete', task });
  const closeDialog = () => setDialog({ type: null, task: null });

  const pending = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis tareas</h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">
                {tasks.length === 0
                  ? 'Sin tareas'
                  : `${pending} pendiente${pending !== 1 ? 's' : ''} · ${tasks.length} total`}
              </p>
            )}
          </div>
          <button
            onClick={openCreate}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva tarea
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-100 text-danger-500 text-sm rounded-lg">
            {error}
          </div>
        )}

        <TaskList
          tasks={tasks}
          loading={loading}
          onEdit={openEdit}
          onDelete={openDelete}
          onCreate={openCreate}
        />
      </PageWrapper>

      {/* FAB mobile */}
      <button
        onClick={openCreate}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        aria-label="Nueva tarea"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      <CreateTaskDialog
        isOpen={dialog.type === 'create'}
        onClose={closeDialog}
        onCreated={createTask}
      />
      <EditTaskDialog
        isOpen={dialog.type === 'edit'}
        onClose={closeDialog}
        task={dialog.task}
        onUpdated={updateTask}
      />
      <DeleteTaskDialog
        isOpen={dialog.type === 'delete'}
        onClose={closeDialog}
        task={dialog.task}
        onDeleted={deleteTask}
      />
    </div>
  );
}
