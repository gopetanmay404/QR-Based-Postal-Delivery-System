const prisma = require('../utils/prisma');
const { generateQR, validateQR, validateQRForConfirmation, getQRDataUrl } = require('../services/qrService');
const { logger } = require('../utils/logger');

/**
 * POST /api/deliveries/generate
 */
async function generateDelivery(req, res, next) {
  try {
    const { latitude, longitude, address, documentType } = req.body;
    const userId = req.user.id;

    const delivery = await generateQR({
      userId,
      latitude,
      longitude,
      address,
      documentType,
    });

    res.status(201).json({
      message: 'Delivery QR generated successfully',
      delivery,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/deliveries/my-deliveries
 */
async function getMyDeliveries(req, res, next) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where: { userId },
        select: {
          id: true,
          address: true,
          status: true,
          generatedAt: true,
          deliveredAt: true,
          expiresAt: true,
          latitude: true,
          longitude: true,
          postman: { select: { name: true, employeeId: true } },
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.delivery.count({ where: { userId } }),
    ]);

    res.json({
      deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/deliveries/:id/qr
 */
async function getDeliveryQR(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (delivery.status === 'DELIVERED') {
      return res.status(400).json({ error: 'Delivery already completed' });
    }

    if (delivery.status === 'EXPIRED') {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    const qrDataUrl = await getQRDataUrl(id);
    if (!qrDataUrl) {
      return res.status(404).json({ error: 'QR image not found' });
    }

    res.json({ qrDataUrl });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/deliveries/:id/status
 */
async function getDeliveryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      select: {
        id: true,
        address: true,
        status: true,
        generatedAt: true,
        deliveredAt: true,
        expiresAt: true,
        latitude: true,
        longitude: true,
        postman: { select: { name: true } },
        trackingLogs: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { latitude: true, longitude: true, updatedAt: true },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (req.user.role !== 'ADMIN') {
      const fullDelivery = await prisma.delivery.findUnique({ where: { id } });
      if (fullDelivery.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ delivery });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/deliveries/:id/confirm
 * User confirms delivery by scanning QR
 */
async function confirmDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const { qrData } = req.body;
    const userId = req.user.id;

    // Validate QR and ownership
    const result = await validateQRForConfirmation(qrData, userId);

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    // Ensure the scanned QR matches the delivery ID in the URL
    if (result.deliveryId !== id) {
      return res.status(400).json({ error: 'QR code does not match this delivery' });
    }

    // Mark as delivered
    const io = req.app.get('io');
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });

    // Notify via socket
    if (io) {
      io.to(`delivery:${id}`).emit('delivery:completed', {
        deliveryId: id,
        deliveredAt: updatedDelivery.deliveredAt,
      });
    }

    // Create notification
    const { createNotification } = require('../services/notificationService');
    await createNotification(userId, '✅ Parcel delivered successfully!', io);

    logger.info(`Delivery ${id} confirmed by user ${userId}`);

    res.json({
      message: 'Delivery confirmed successfully',
      delivery: {
        id: updatedDelivery.id,
        status: updatedDelivery.status,
        deliveredAt: updatedDelivery.deliveredAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateDelivery, getMyDeliveries, getDeliveryStatus, getDeliveryQR, confirmDelivery };
