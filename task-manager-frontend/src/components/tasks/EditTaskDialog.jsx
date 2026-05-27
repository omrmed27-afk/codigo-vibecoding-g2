import { useState, useEffect } from 'react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';

export default function EditTaskDialog({ isOpen, onClose, task, onUpdated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status || 'pending');
      setError('');
    }
  }, [task]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onUpdated(task.id, { title: title.trim(), description: description.trim(), status });
      handleClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Editar tarea">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Descripción opcional…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            <option value="pending">Pendiente</option>
            <option value="in-progress">En progreso</option>
            <option value="done">Completada</option>
          </select>
        </div>
        {error && <p className="text-sm text-danger-500">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" type="submit" loading={loading}>Guardar</Button>
        </div>
      </form>
    </Dialog>
  );
}
