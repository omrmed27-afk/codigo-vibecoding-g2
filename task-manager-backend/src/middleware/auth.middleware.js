import jwt from 'jsonwebtoken';

export default function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
