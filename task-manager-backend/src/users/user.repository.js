import prisma from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function create(data) {
  try {
    return await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: data.password,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
}

export { findByEmail, create };
