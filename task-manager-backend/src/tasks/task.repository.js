import prisma from '../lib/prisma.js';

async function findAll(userId) {
  return prisma.task.findMany({ where: { userId } });
}

async function findById(id, userId) {
  return prisma.task.findFirst({ where: { id, userId } });
}

async function create(data) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? '',
      status: data.status ?? 'pending',
      userId: data.userId,
    },
  });
}

async function update(id, userId, data) {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.task.update({ where: { id }, data });
}

async function remove(id, userId) {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.task.delete({ where: { id } });
  return true;
}

export { findAll, findById, create, update, remove };
