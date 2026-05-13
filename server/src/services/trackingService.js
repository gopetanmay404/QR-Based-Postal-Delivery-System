const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');

/**
 * Record a postman location update for a delivery
 */
async function recordLocation(deliveryId, latitude, longitude) {
  return prisma.trackingLog.create({
    data: { deliveryId, latitude, longitude },
  });
}

/**
 * Get tracking history for a delivery
 */
async function getTrackingHistory(deliveryId) {
  return prisma.trackingLog.findMany({
    where: { deliveryId },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

/**
 * Get latest location for a delivery
 */
async function getLatestLocation(deliveryId) {
  return prisma.trackingLog.findFirst({
    where: { deliveryId },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Delete tracking data for a delivery
 */
async function deleteTrackingData(deliveryId) {
  const result = await prisma.trackingLog.deleteMany({
    where: { deliveryId },
  });
  logger.info(`Deleted ${result.count} tracking logs for delivery ${deliveryId}`);
  return result;
}

module.exports = { recordLocation, getTrackingHistory, getLatestLocation, deleteTrackingData };
