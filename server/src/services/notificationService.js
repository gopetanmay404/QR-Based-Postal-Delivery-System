const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');

/**
 * Create a notification and emit via Socket.IO
 */
async function createNotification(userId, message, io) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, message },
    });

    // Emit real-time notification if io is available
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        id: notification.id,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    }

    logger.info(`Notification sent to user ${userId}: ${message}`);
    return notification;
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
}

/**
 * Get unread notification count for a user
 */
async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Send delivery status notification
 */
async function notifyStatusChange(delivery, newStatus, io) {
  const statusMessages = {
    IN_TRANSIT: '📦 Your parcel is now in transit.',
    NEAR_POST_OFFICE: '🏤 Your parcel has reached the nearest post office.',
    OUT_FOR_DELIVERY: '🚴 Postman is on the way with your parcel.',
    DELIVERED: '✅ Parcel delivered successfully!',
    EXPIRED: '⚠️ Your delivery QR code has expired.',
  };

  const message = statusMessages[newStatus];
  if (message) {
    await createNotification(delivery.userId, message, io);
  }
}

module.exports = { createNotification, getUnreadCount, notifyStatusChange };
