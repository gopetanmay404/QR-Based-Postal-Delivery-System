const express = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, authorize('USER'), getNotifications);
router.patch('/:id/read', authenticate, authorize('USER'), markAsRead);
router.patch('/read-all', authenticate, authorize('USER'), markAllAsRead);

module.exports = router;
