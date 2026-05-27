import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';

export function useTask(id) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    taskService
      .getById(id)
      .then(setTask)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateTask = async (data) => {
    const updated = await taskService.update(id, data);
    setTask(updated);
    return updated;
  };

  const deleteTask = async () => {
    await taskService.delete(id);
  };

  return { task, loading, error, updateTask, deleteTask };
}
