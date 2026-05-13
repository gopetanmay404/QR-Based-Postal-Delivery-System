const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { encrypt } = require('../utils/encryption');
const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');

// QR Code prefix for identification
const QR_PREFIX = 'GOVDEL';

// Secure QR storage directory
const QR_DIR = path.join(__dirname, '..', '..', 'secure-qr');
if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

/**
 * Build the short QR payload string
 * Only ~42 characters → easy to scan from any device
 */
function buildQRPayload(deliveryId) {
  return `${QR_PREFIX}:${deliveryId}`;
}

/**
 * Parse a scanned QR string → extract delivery ID
 */
function parseQRPayload(scannedText) {
  if (!scannedText || typeof scannedText !== 'string') return null;
  const trimmed = scannedText.trim();

  // Format: GOVDEL:<uuid>
  if (trimmed.startsWith(`${QR_PREFIX}:`)) {
    return trimmed.substring(QR_PREFIX.length + 1);
  }

  // Also accept raw UUID for backwards compatibility
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Generate QR code for a delivery
 * QR contains a SHORT payload (just prefix + ID) for reliable scanning
 * Full encrypted data is stored in DB for security audit
 */
async function generateQR(deliveryData) {
  const { userId, latitude, longitude, address, documentType } = deliveryData;
  const deliveryId = uuidv4();

  // Build the SHORT QR payload (~42 chars — scans perfectly on any device)
  const qrPayload = buildQRPayload(deliveryId);

  // Also create encrypted audit token (stored in DB, NOT in QR)
  const auditPayload = {
    deliveryId,
    userId,
    latitude,
    longitude,
    address,
    documentType,
    timestamp: new Date().toISOString(),
    nonce: uuidv4(),
  };
  const encryptedToken = encrypt(auditPayload);

  // Generate QR image file
  const qrFileName = `${deliveryId}.png`;
  const qrFilePath = path.join(QR_DIR, qrFileName);

  const qrOptions = {
    errorCorrectionLevel: 'H', // High — 30% damage tolerance
    type: 'png',
    width: 400,
    margin: 3,
    color: {
      dark: '#000000',  // Pure black for best scan contrast
      light: '#ffffff', // Pure white background
    },
  };

  await QRCode.toFile(qrFilePath, qrPayload, qrOptions);

  // Generate base64 data URL to send to client
  const qrDataUrl = await QRCode.toDataURL(qrPayload, qrOptions);

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (parseInt(process.env.DELIVERY_EXPIRY_DAYS) || 7));

  // Store in database
  const delivery = await prisma.delivery.create({
    data: {
      id: deliveryId,
      userId,
      latitude,
      longitude,
      address,
      encryptedQrToken: encryptedToken, // Full encrypted data for audit
      qrImagePath: qrFilePath,
      expiresAt,
    },
  });

  logger.info(`QR generated for delivery ${deliveryId} (payload: ${qrPayload.length} chars)`);

  return {
    id: delivery.id,
    status: delivery.status,
    address: delivery.address,
    generatedAt: delivery.generatedAt,
    expiresAt: delivery.expiresAt,
    qrDataUrl,
  };
}

/**
 * Get QR image as base64 for an existing delivery
 */
async function getQRDataUrl(deliveryId) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: { status: true },
  });

  if (!delivery || delivery.status === 'EXPIRED') return null;

  // Regenerate from the short payload (always consistent)
  const qrPayload = buildQRPayload(deliveryId);
  return await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 3,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

/**
 * Validate a scanned QR code — looks up delivery by ID
 */
async function validateQR(scannedText) {
  const deliveryId = parseQRPayload(scannedText);

  if (!deliveryId) {
    return { valid: false, error: 'Invalid QR code format' };
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  if (!delivery) {
    return { valid: false, error: 'Invalid QR code — delivery not found' };
  }

  if (delivery.status === 'DELIVERED') {
    return { valid: false, error: 'This delivery has already been completed' };
  }

  if (delivery.status === 'EXPIRED' || new Date() > delivery.expiresAt) {
    if (delivery.status !== 'EXPIRED') {
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'EXPIRED' },
      });
    }
    return { valid: false, error: 'This QR code has expired' };
  }

  return {
    valid: true,
    delivery: {
      id: delivery.id,
      latitude: delivery.latitude,
      longitude: delivery.longitude,
      address: delivery.address,
      status: delivery.status,
      userName: delivery.user.name,
      userPhone: delivery.user.phone,
    },
  };
}

/**
 * Validate QR for user delivery confirmation
 * Checks both QR content AND user ownership
 */
async function validateQRForConfirmation(scannedText, userId) {
  const deliveryId = parseQRPayload(scannedText);

  if (!deliveryId) {
    return { valid: false, error: 'Invalid QR code format' };
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery) {
    return { valid: false, error: 'Delivery not found' };
  }

  if (delivery.userId !== userId) {
    return { valid: false, error: 'This QR does not belong to your account' };
  }

  if (delivery.status === 'DELIVERED') {
    return { valid: false, error: 'Delivery already confirmed' };
  }

  if (delivery.status === 'EXPIRED' || new Date() > delivery.expiresAt) {
    return { valid: false, error: 'Delivery has expired' };
  }

  return { valid: true, deliveryId: delivery.id };
}

/**
 * Delete QR image file from filesystem
 */
function deleteQRImage(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`QR image deleted: ${filePath}`);
    }
  } catch (err) {
    logger.error(`Failed to delete QR image: ${filePath}`, err.message);
  }
}

module.exports = { generateQR, getQRDataUrl, validateQR, validateQRForConfirmation, deleteQRImage, parseQRPayload };
