const express = require('express');
const router = express.Router();
const { handleTestEmail } = require('../controllers/testEmailController');

// POST /api/test-email
router.post('/test-email', handleTestEmail);

module.exports = router;
