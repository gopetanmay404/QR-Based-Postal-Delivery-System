const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

/**
 * JWT authentication middleware
 * Verifies Bearer token and attaches user/postman to req
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (decoded.role === 'POSTMAN') {
      const postman = await prisma.postman.findUnique({
        where: { id: decoded.id },
      });
      if (!postman) {
        return res.status(401).json({ error: 'Postman not found' });
      }
      req.user = {
        id: postman.id,
        name: postman.name,
        employeeId: postman.employeeId,
        role: 'POSTMAN',
      };
    } else {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = authenticate;
