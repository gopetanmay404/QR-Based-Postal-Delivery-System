const express = require('express');
const { register, login, postmanLogin, refresh, logout, getMe } = require('../controllers/authController');
const { registerValidator, loginValidator, postmanLoginValidator } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/postman-login', authLimiter, postmanLoginValidator, validate, postmanLogin);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
