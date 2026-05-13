const { body } = require('express-validator');

const generateDeliveryValidator = [
  body('latitude')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5-500 characters'),
  body('documentType')
    .trim()
    .notEmpty().withMessage('Document type is required')
    .isIn(['PAN_CARD', 'PASSPORT', 'AADHAAR', 'VOTER_ID', 'CERTIFICATE', 'OTHER'])
    .withMessage('Invalid document type'),
];

const updateStatusValidator = [
  body('status')
    .isIn(['GENERATED', 'IN_TRANSIT', 'NEAR_POST_OFFICE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXPIRED'])
    .withMessage('Invalid delivery status'),
];

const scanQrValidator = [
  body('qrData')
    .notEmpty().withMessage('QR data is required'),
];

const updateLocationValidator = [
  body('deliveryId')
    .notEmpty().withMessage('Delivery ID is required')
    .isUUID().withMessage('Invalid delivery ID format'),
  body('latitude')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

module.exports = {
  generateDeliveryValidator,
  updateStatusValidator,
  scanQrValidator,
  updateLocationValidator,
};
