import * as service from './task.service.js';

function handleError(res, error) {
  const status = error.statusCode || 500;
  res.status(status).json({ error: error.message });
}

async function getAll(req, res) {
  try {
    const tasks = await service.getAllTasks(req.userId);
    res.status(200).json(tasks);
  } catch (error) {
    handleError(res, error);
  }
}

async function getOne(req, res) {
  try {
    const task = await service.getTaskById(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    handleError(res, error);
  }
}

async function create(req, res) {
  try {
    const task = await service.createTask(req.body, req.userId);
    res.status(201).json(task);
  } catch (error) {
    handleError(res, error);
  }
}

async function update(req, res) {
  try {
    const task = await service.updateTask(req.params.id, req.body, req.userId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    handleError(res, error);
  }
}

async function remove(req, res) {
  try {
    const deleted = await service.deleteTask(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export { getAll, getOne, create, update, remove };
