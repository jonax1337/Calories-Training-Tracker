const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  getUserEmailConfigurations,
  createEmailConfiguration,
  updateEmailConfiguration,
  deleteEmailConfiguration,
  setOutboundEmail,
  getOutboundEmailConfiguration
} = require('../controllers/emailConfigController');

// All routes require authentication
router.use(authenticate);

// GET /api/email-config/outbound - Get the current outbound email configuration (must come before /:id routes)
router.get('/outbound', getOutboundEmailConfiguration);

// GET /api/email-config - Get all email configurations for the authenticated user
router.get('/', getUserEmailConfigurations);

// POST /api/email-config - Create a new email configuration
router.post('/', createEmailConfiguration);

// PUT /api/email-config/:id - Update an email configuration
router.put('/:id', updateEmailConfiguration);

// DELETE /api/email-config/:id - Delete an email configuration
router.delete('/:id', deleteEmailConfiguration);

// PUT /api/email-config/:id/outbound - Set an email configuration as outbound
router.put('/:id/outbound', setOutboundEmail);

module.exports = router;