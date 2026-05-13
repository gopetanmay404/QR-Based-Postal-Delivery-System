const { body, param, query } = require('express-validator');

const updateDeliveryValidator = [
  param('id').isUUID().withMessage('Invalid delivery ID'),
  body('status')
    .optional()
    .isIn(['GENERATED', 'IN_TRANSIT', 'NEAR_POST_OFFICE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXPIRED'])
    .withMessage('Invalid status'),
  body('postmanId')
    .optional()
    .isUUID().withMessage('Invalid postman ID'),
];

const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
];

module.exports = { updateDeliveryValidator, paginationValidator };
