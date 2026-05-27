import * as service from './user.service.js';

function handleError(res, error) {
  const status = error.statusCode || 500;
  res.status(status).json({ error: error.message });
}

async function register(req, res) {
  try {
    const user = await service.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    handleError(res, error);
  }
}

async function login(req, res) {
  try {
    const result = await service.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export { register, login };
