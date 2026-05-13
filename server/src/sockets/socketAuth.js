const { verifyAccessToken } = require('../utils/jwt');
const { logger } = require('../utils/logger');

/**
 * Authenticate Socket.IO connections using JWT
 */
function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyAccessToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    logger.error('Socket auth failed:', err.message);
    next(new Error('Invalid authentication token'));
  }
}

module.exports = socketAuth;
