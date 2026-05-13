const prisma = require('../utils/prisma');
const { deleteQRImage } = require('../services/qrService');
const { logger } = require('../utils/logger');

/**
 * GET /api/admin/analytics
 * Dashboard analytics
 */
async function getAnalytics(req, res, next) {
  try {
    const [
      totalUsers,
      totalDeliveries,
      activeDeliveries,
      deliveredCount,
      expiredCount,
      totalPostmen,
      recentDeliveries,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.delivery.count(),
      prisma.delivery.count({
        where: { status: { in: ['GENERATED', 'IN_TRANSIT', 'NEAR_POST_OFFICE', 'OUT_FOR_DELIVERY'] } },
      }),
      prisma.delivery.count({ where: { status: 'DELIVERED' } }),
      prisma.delivery.count({ where: { status: 'EXPIRED' } }),
      prisma.postman.count(),
      prisma.delivery.findMany({
        orderBy: { generatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          address: true,
          status: true,
          generatedAt: true,
          deliveredAt: true,
          user: { select: { name: true } },
          postman: { select: { name: true } },
        },
      }),
    ]);

    // Get daily stats for the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyDeliveries = await prisma.delivery.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { generatedAt: { gte: sevenDaysAgo } },
    });

    res.json({
      analytics: {
        totalUsers,
        totalDeliveries,
        activeDeliveries,
        deliveredCount,
        expiredCount,
        totalPostmen,
        successRate: totalDeliveries > 0
          ? Math.round((deliveredCount / totalDeliveries) * 100)
          : 0,
      },
      dailyDeliveries,
      recentDeliveries,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users
 * List all users with pagination
 */
async function getUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: { select: { deliveries: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/deliveries
 * List all deliveries with pagination and filters
 */
async function getDeliveries(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const where = status ? { status } : {};

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        select: {
          id: true,
          address: true,
          status: true,
          generatedAt: true,
          deliveredAt: true,
          expiresAt: true,
          user: { select: { name: true, email: true } },
          postman: { select: { name: true, employeeId: true } },
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.delivery.count({ where }),
    ]);

    res.json({
      deliveries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/deliveries/:id
 * Update delivery (status, assign postman)
 */
async function updateDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const { status, postmanId } = req.body;

    const data = {};
    if (status) data.status = status;
    if (postmanId) data.postmanId = postmanId;
    if (status === 'DELIVERED') data.deliveredAt = new Date();

    const delivery = await prisma.delivery.update({
      where: { id },
      data,
      select: {
        id: true,
        status: true,
        address: true,
        deliveredAt: true,
      },
    });

    // Notify status change
    const io = req.app.get('io');
    if (io && status) {
      io.to(`delivery:${id}`).emit('delivery:statusUpdate', {
        deliveryId: id,
        status,
        updatedAt: new Date(),
      });
    }

    logger.info(`Admin updated delivery ${id}: ${JSON.stringify(data)}`);

    res.json({ message: 'Delivery updated', delivery });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/deliveries/:id
 * Delete delivery and its QR
 */
async function deleteDelivery(req, res, next) {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Delete QR image
    if (delivery.qrImagePath) {
      deleteQRImage(delivery.qrImagePath);
    }

    // Delete tracking logs first (cascade should handle this, but be explicit)
    await prisma.trackingLog.deleteMany({ where: { deliveryId: id } });

    // Delete delivery
    await prisma.delivery.delete({ where: { id } });

    logger.info(`Admin deleted delivery ${id}`);

    res.json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/postmen
 * List all postmen
 */
async function getPostmen(req, res, next) {
  try {
    const postmen = await prisma.postman.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        createdAt: true,
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ postmen });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics, getUsers, getDeliveries, updateDelivery, deleteDelivery, getPostmen };
