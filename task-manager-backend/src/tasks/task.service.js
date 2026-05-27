import * as repository from './task.repository.js';

async function getAllTasks(userId) {
  return repository.findAll(userId);
}

async function getTaskById(id, userId) {
  return repository.findById(id, userId);
}

async function createTask(data, userId) {
  return repository.create({ ...data, userId });
}

async function updateTask(id, data, userId) {
  return repository.update(id, userId, data);
}

async function deleteTask(id, userId) {
  return repository.remove(id, userId);
}

export { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
