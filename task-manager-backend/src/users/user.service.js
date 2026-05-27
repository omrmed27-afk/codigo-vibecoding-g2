import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as repository from './user.repository.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(data) {
  const { name, lastname, email, password } = data;

  if (!name?.trim() || !lastname?.trim() || !email?.trim() || !password?.trim()) {
    const err = new Error('Todos los campos son requeridos');
    err.statusCode = 400;
    throw err;
  }
  if (!EMAIL_RE.test(email)) {
    const err = new Error('Correo electrónico inválido');
    err.statusCode = 400;
    throw err;
  }
  if (password.length < 6) {
    const err = new Error('La contraseña debe tener al menos 6 caracteres');
    err.statusCode = 400;
    throw err;
  }

  const existing = await repository.findByEmail(email);
  if (existing) {
    const err = new Error('El correo ya está en uso');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await repository.create({ ...data, password: hashedPassword });

  const { password: _, ...userWithoutPassword } = user;
  const token = generateToken(user.id);
  return { token, user: userWithoutPassword };
}

async function login(data) {
  const { email, password } = data;

  if (!email?.trim() || !password?.trim()) {
    const err = new Error('Correo y contraseña son requeridos');
    err.statusCode = 400;
    throw err;
  }

  const user = await repository.findByEmail(email);
  if (!user) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    throw err;
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = generateToken(user.id);
  return { token, user: userWithoutPassword };
}

export { register, login };
