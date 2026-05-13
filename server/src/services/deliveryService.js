const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { notifyStatusChange } = require('./notificationService');

/**
 * Update delivery status with notification
 */
async function updateDeliveryStatus(deliveryId, newStatus, io) {
  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: newStatus,
      ...(newStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
    },
  });

  // Send notification to user
  await notifyStatusChange(delivery, newStatus, io);

  // Emit status update to delivery room
  if (io) {
    io.to(`delivery:${deliveryId}`).emit('delivery:statusUpdate', {
      deliveryId,
      status: newStatus,
      updatedAt: new Date(),
    });
  }

  logger.info(`Delivery ${deliveryId} status updated to ${newStatus}`);
  return delivery;
}

/**
 * Assign postman to delivery
 */
async function assignPostman(deliveryId, postmanId) {
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { postmanId },
  });
}

/**
 * Get delivery with full details
 */
async function getDeliveryById(deliveryId) {
  return prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      postman: { select: { id: true, name: true, employeeId: true } },
      trackingLogs: { orderBy: { updatedAt: 'desc' }, take: 1 },
    },
  });
}

module.exports = { updateDeliveryStatus, assignPostman, getDeliveryById };
