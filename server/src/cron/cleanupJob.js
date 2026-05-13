const cron = require('node-cron');
const prisma = require('../utils/prisma');
const { deleteQRImage } = require('../services/qrService');
const { logger } = require('../utils/logger');

/**
 * Schedule cleanup job — runs daily at midnight
 * 1. Expire deliveries past their expiresAt
 * 2. Delete QR images and tracking data for delivered/expired deliveries older than 7 days
 */
function startCleanupJob() {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('🧹 Starting scheduled cleanup...');

    try {
      const now = new Date();

      // 1. Auto-expire deliveries past their expiry date
      const expired = await prisma.delivery.updateMany({
        where: {
          status: { in: ['GENERATED', 'IN_TRANSIT', 'NEAR_POST_OFFICE', 'OUT_FOR_DELIVERY'] },
          expiresAt: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });
      logger.info(`Expired ${expired.count} deliveries`);

      // 2. Clean up old delivered/expired records (7+ days)
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - 7);

      const oldDeliveries = await prisma.delivery.findMany({
        where: {
          status: { in: ['DELIVERED', 'EXPIRED'] },
          OR: [
            { deliveredAt: { lt: cleanupDate } },
            { expiresAt: { lt: cleanupDate } },
          ],
        },
        select: { id: true, qrImagePath: true },
      });

      for (const delivery of oldDeliveries) {
        // Delete QR image
        if (delivery.qrImagePath) {
          deleteQRImage(delivery.qrImagePath);
        }

        // Delete tracking logs
        await prisma.trackingLog.deleteMany({
          where: { deliveryId: delivery.id },
        });

        // Clear sensitive data but keep record
        await prisma.delivery.update({
          where: { id: delivery.id },
          data: {
            qrImagePath: null,
            encryptedQrToken: `archived_${delivery.id}`,
          },
        });
      }

      logger.info(`Cleaned up ${oldDeliveries.length} old delivery records`);
    } catch (err) {
      logger.error('Cleanup job error:', err.message);
    }
  });

  logger.info('✅ Cleanup cron job scheduled (daily at midnight)');
}

module.exports = { startCleanupJob };
