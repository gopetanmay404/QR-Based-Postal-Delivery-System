const express = require('express');
const { generateDelivery, getMyDeliveries, getDeliveryStatus, getDeliveryQR, confirmDelivery } = require('../controllers/deliveryController');
const { generateDeliveryValidator, scanQrValidator } = require('../validators/deliveryValidator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { qrLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/generate', authenticate, authorize('USER'), qrLimiter, generateDeliveryValidator, validate, generateDelivery);
router.get('/my-deliveries', authenticate, authorize('USER'), getMyDeliveries);
router.get('/:id/qr', authenticate, authorize('USER', 'ADMIN'), getDeliveryQR);
router.get('/:id/status', authenticate, authorize('USER', 'ADMIN'), getDeliveryStatus);
router.post('/:id/confirm', authenticate, authorize('USER'), scanQrValidator, validate, confirmDelivery);

module.exports = router;

