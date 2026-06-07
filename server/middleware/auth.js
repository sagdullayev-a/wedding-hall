const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

/**
 * Authentication middleware — verifies JWT token from Authorization header.
 * Attaches decoded user payload (userId, role) to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure the token payload has the required fields
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ error: 'Yaroqsiz token tuzilmasi' });
    }

    // Validate role value
    if (!['admin', 'owner', 'customer'].includes(decoded.role)) {
      return res.status(401).json({ error: 'Yaroqsiz foydalanuvchi roli' });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token muddati tugagan. Qayta kiring.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Yaroqsiz token' });
    }
    return res.status(401).json({ error: 'Autentifikatsiya xatoligi' });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Returns a middleware that checks if the authenticated user has one of the allowed roles.
 *
 * Usage: router.get('/admin-only', authenticate, authorize('admin'), handler)
 *        router.get('/admin-or-owner', authenticate, authorize('admin', 'owner'), handler)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sizda bu amalni bajarish huquqi yo\'q' });
    }

    next();
  };
}

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.authorize = authorize;
