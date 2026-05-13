const rateLimit = require('express-rate-limit');

/** Auth endpoints: 15 requests per 15 minutes */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** QR generation: 10 requests per hour */
const qrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many QR generation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** QR scanning: 20 requests per 15 minutes */
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many scan attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API: 100 requests per 15 minutes */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, qrLimiter, scanLimiter, apiLimiter };
