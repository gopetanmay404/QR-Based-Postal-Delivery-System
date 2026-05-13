const { logger } = require('../utils/logger');
const { recordLocation } = require('../services/trackingService');

/**
 * Handle Socket.IO events
 */
function socketHandler(io) {
  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    logger.info(`Socket connected: ${id} (${role})`);

    // Join user-specific room for notifications
    if (role === 'USER' || role === 'ADMIN') {
      socket.join(`user:${id}`);
    }

    // Join delivery room
    socket.on('delivery:join', (deliveryId) => {
      socket.join(`delivery:${deliveryId}`);
      logger.debug(`${id} joined delivery room: ${deliveryId}`);
    });

    // Leave delivery room
    socket.on('delivery:leave', (deliveryId) => {
      socket.leave(`delivery:${deliveryId}`);
      logger.debug(`${id} left delivery room: ${deliveryId}`);
    });

    // Postman location updates (high-frequency)
    socket.on('postman:locationUpdate', async (data) => {
      if (role !== 'POSTMAN') return;

      const { deliveryId, latitude, longitude } = data;

      try {
        // Record in database (throttled — every 10th update)
        if (!socket._locationCounter) socket._locationCounter = 0;
        socket._locationCounter++;

        if (socket._locationCounter % 10 === 0) {
          await recordLocation(deliveryId, latitude, longitude);
        }

        // Always broadcast to delivery room
        io.to(`delivery:${deliveryId}`).emit('postman:location', {
          deliveryId,
          latitude,
          longitude,
          updatedAt: new Date(),
        });
      } catch (err) {
        logger.error('Location update error:', err.message);
      }
    });

    // Delivery started
    socket.on('delivery:start', (data) => {
      if (role !== 'POSTMAN') return;
      io.to(`delivery:${data.deliveryId}`).emit('delivery:started', {
        deliveryId: data.deliveryId,
        postmanId: id,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${id}`);
    });
  });
}

module.exports = socketHandler;
