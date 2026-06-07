const { sendTestEmail } = require('../services/testEmailService');

/**
 * Controller for testing email sending capability.
 */
async function handleTestEmail(req, res) {
  try {
    const result = await sendTestEmail();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      if (result.reason === 'Missing environment variables') {
        return res.status(400).json({
          success: false,
          reason: result.reason,
        });
      }

      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[SMTP Controller] Unhandled exception:', error);
    return res.status(500).json({
      success: false,
      error: error.stack || error.message || 'Internal server error',
    });
  }
}

module.exports = {
  handleTestEmail,
};
