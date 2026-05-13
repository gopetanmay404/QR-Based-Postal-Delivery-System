const express = require('express');
const { getAnalytics, getUsers, getDeliveries, updateDelivery, deleteDelivery, getPostmen } = require('../controllers/adminController');
const { updateDeliveryValidator, paginationValidator } = require('../validators/adminValidator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/analytics', authenticate, authorize('ADMIN'), getAnalytics);
router.get('/users', authenticate, authorize('ADMIN'), paginationValidator, validate, getUsers);
router.get('/deliveries', authenticate, authorize('ADMIN'), paginationValidator, validate, getDeliveries);
router.patch('/deliveries/:id', authenticate, authorize('ADMIN'), updateDeliveryValidator, validate, updateDelivery);
router.delete('/deliveries/:id', authenticate, authorize('ADMIN'), deleteDelivery);
router.get('/postmen', authenticate, authorize('ADMIN'), getPostmen);

module.exports = router;
