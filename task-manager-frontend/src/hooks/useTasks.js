import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getAll();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = useCallback(async (data) => {
    const created = await taskService.create(data);
    setTasks((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateTask = useCallback(async (id, data) => {
    const updated = await taskService.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await taskService.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask };
}
