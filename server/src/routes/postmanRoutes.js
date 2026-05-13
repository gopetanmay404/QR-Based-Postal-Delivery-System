const express = require('express');
const { getAssignedDeliveries, scanQR, startDelivery, updateLocation } = require('../controllers/postmanController');
const { scanQrValidator, updateLocationValidator } = require('../validators/deliveryValidator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { scanLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/assigned', authenticate, authorize('POSTMAN'), getAssignedDeliveries);
router.post('/scan', authenticate, authorize('POSTMAN'), scanLimiter, scanQrValidator, validate, scanQR);
router.post('/start-delivery/:id', authenticate, authorize('POSTMAN'), startDelivery);
router.post('/update-location', authenticate, authorize('POSTMAN'), updateLocationValidator, validate, updateLocation);

module.exports = router;
