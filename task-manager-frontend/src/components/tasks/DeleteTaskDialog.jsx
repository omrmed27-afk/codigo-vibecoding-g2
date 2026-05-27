import { useState } from 'react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function DeleteTaskDialog({ isOpen, onClose, task, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await onDeleted(task.id);
      handleClose();
    } catch (err) {
      setError(err.message || 'Error al eliminar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Eliminar tarea" size="sm">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 bg-danger-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-danger-500" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            ¿Estás seguro de que quieres eliminar{' '}
            <span className="font-semibold text-gray-900">"{task?.title}"</span>?
            Esta acción no se puede deshacer.
          </p>
        </div>
        {error && <p className="text-sm text-danger-500">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>Eliminar</Button>
        </div>
      </div>
    </Dialog>
  );
}
