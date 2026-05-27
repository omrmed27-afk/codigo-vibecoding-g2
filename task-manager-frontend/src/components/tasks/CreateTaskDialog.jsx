import { useState } from 'react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';

export default function CreateTaskDialog({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onCreated({ title: title.trim(), description: description.trim() });
      handleClose();
    } catch (err) {
      setError(err.message || 'Error al crear la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Nueva tarea">
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
            placeholder="Nombre de la tarea"
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
        {error && <p className="text-sm text-danger-500">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" type="submit" loading={loading}>Crear</Button>
        </div>
      </form>
    </Dialog>
  );
}
