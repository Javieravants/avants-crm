const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  let token = null;

  // Bearer header (principal)
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  // Query param fallback (para descargas directas)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = authMiddleware;
