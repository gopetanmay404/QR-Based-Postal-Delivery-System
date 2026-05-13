const prisma = require('../utils/prisma');
const { validateQR } = require('../services/qrService');
const { updateDeliveryStatus, assignPostman } = require('../services/deliveryService');
const { recordLocation } = require('../services/trackingService');
const { createNotification } = require('../services/notificationService');
const { logger } = require('../utils/logger');

/**
 * GET /api/postman/assigned
 * Get assigned deliveries for this postman
 */
async function getAssignedDeliveries(req, res, next) {
  try {
    const postmanId = req.user.id;

    const deliveries = await prisma.delivery.findMany({
      where: {
        postmanId,
        status: { in: ['IN_TRANSIT', 'NEAR_POST_OFFICE', 'OUT_FOR_DELIVERY'] },
      },
      select: {
        id: true,
        address: true,
        latitude: true,
        longitude: true,
        status: true,
        generatedAt: true,
        user: { select: { name: true, phone: true } },
      },
      orderBy: { generatedAt: 'desc' },
    });

    res.json({ deliveries });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/postman/scan
 * Scan and validate a QR code
 */
async function scanQR(req, res, next) {
  try {
    const { qrData } = req.body;
    const postmanId = req.user.id;

    const result = await validateQR(qrData);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    // Assign postman to delivery if not already assigned
    const delivery = await prisma.delivery.findUnique({
      where: { id: result.delivery.id },
    });

    if (delivery.postmanId && delivery.postmanId !== postmanId) {
      return res.status(403).json({ error: 'This delivery is assigned to another postman' });
    }

    if (!delivery.postmanId) {
      await assignPostman(delivery.id, postmanId);
    }

    logger.info(`Postman ${postmanId} scanned delivery ${delivery.id}`);

    res.json({
      message: 'QR validated successfully',
      delivery: result.delivery,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/postman/start-delivery/:id
 * Start delivery tracking
 */
async function startDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const postmanId = req.user.id;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.postmanId !== postmanId) {
      return res.status(403).json({ error: 'Not assigned to this delivery' });
    }

    if (delivery.status === 'DELIVERED') {
      return res.status(400).json({ error: 'Delivery already completed' });
    }

    const io = req.app.get('io');
    await updateDeliveryStatus(id, 'OUT_FOR_DELIVERY', io);

    // Notify user
    await createNotification(delivery.userId, '🚴 Postman is on the way with your parcel.', io);

    if (io) {
      io.to(`delivery:${id}`).emit('delivery:started', {
        deliveryId: id,
        postmanId,
      });
    }

    logger.info(`Delivery ${id} started by postman ${postmanId}`);

    res.json({ message: 'Delivery started', deliveryId: id });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/postman/update-location
 * Update postman location during delivery
 */
async function updateLocation(req, res, next) {
  try {
    const { deliveryId, latitude, longitude } = req.body;
    const postmanId = req.user.id;

    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.postmanId !== postmanId) {
      return res.status(403).json({ error: 'Not authorized for this delivery' });
    }

    // Record location
    await recordLocation(deliveryId, latitude, longitude);

    // Emit live location via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`delivery:${deliveryId}`).emit('postman:location', {
        deliveryId,
        latitude,
        longitude,
        updatedAt: new Date(),
      });
    }

    // Check proximity (within ~500m)
    const distance = calculateDistance(
      latitude, longitude,
      delivery.latitude, delivery.longitude
    );

    if (distance < 0.5 && delivery.status !== 'NEAR_POST_OFFICE') {
      // Postman is near delivery location
      if (io) {
        io.to(`delivery:${deliveryId}`).emit('delivery:near', { deliveryId, distance });
      }
    }

    res.json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula) in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { getAssignedDeliveries, scanQR, startDelivery, updateLocation };
