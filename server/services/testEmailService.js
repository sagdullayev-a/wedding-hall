const { createTransporter } = require('../config/nodemailer');

/**
 * Verifies SMTP settings and sends a test email to borzy.editolog@gmail.com.
 * Includes detailed logs and environment checks.
 */
async function sendTestEmail() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log(`[SMTP Test] Verification - EMAIL_USER: "${emailUser || 'not set'}"`);

  if (!emailUser || !emailPass) {
    console.warn('[SMTP Test] Verification Failed: EMAIL_USER or EMAIL_PASS is missing.');
    return {
      success: false,
      reason: 'Missing environment variables',
    };
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[SMTP Test] Verification Failed: Transporter could not be created.');
    return {
      success: false,
      reason: 'Missing environment variables',
    };
  }

  // 1. SMTP Connection Verification
  console.log('[SMTP Test] SMTP connection status: Verifying connection...');
  try {
    await transporter.verify();
    console.log('[SMTP Test] SMTP connection status: Success (transporter.verify() passed)');
  } catch (error) {
    console.error('[SMTP Test] SMTP connection status: Failed');
    console.error('[SMTP Test] Full error details during connection verification:');
    console.error(error);
    console.error('[SMTP Test] Error stack:', error.stack);
    return {
      success: false,
      error: error.stack || error.message || 'SMTP connection verification failed',
    };
  }

  // 2. Send the actual test email
  const mailOptions = {
    from: `"Wedding Hall Platform Test" <${emailUser}>`,
    to: 'borzy.editolog@gmail.com',
    subject: 'Wedding Hall OTP Email Test',
    html: `<h1>Email Test Successful</h1>
<p>If you received this email, Gmail SMTP is configured correctly.</p>`,
  };

  console.log(`[SMTP Test] Email send started. Sending test email from ${emailUser} to borzy.editolog@gmail.com...`);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP Test] Email send success! Message ID:', info.messageId);
    return {
      success: true,
      message: 'Test email sent successfully',
    };
  } catch (error) {
    console.error('[SMTP Test] Email send failure.');
    console.error('[SMTP Test] Full error details during sendMail():');
    console.error(error);
    console.error('[SMTP Test] Error stack:', error.stack);
    return {
      success: false,
      error: error.stack || error.message || 'Email delivery failed',
    };
  }
}

module.exports = {
  sendTestEmail,
};
