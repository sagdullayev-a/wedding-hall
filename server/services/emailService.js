const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

let transporter;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn('⚠️ WARNING: EMAIL_USER and EMAIL_PASS are not set. OTP emails will be logged to console only.');
}

async function sendOTPEmail({ email, name, otp }) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #1f2937; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #e11d48, #db2777); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .otp-box { background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #be123c; margin: 0; }
    .warning { color: #dc2626; font-weight: 500; margin-top: 16px; }
    .notice { font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 16px; margin-top: 32px; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Wedding Hall Booking Platform</h1>
    </div>
    <div class="content">
      <div class="greeting">Assalomu alaykum, ${name}!</div>
      <p>Tizimga kirish yoki emailni tasdiqlash uchun vaqtinchalik bir martalik tasdiqlash kodini (OTP) taqdim etamiz:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p class="warning">⚠️ Kod 5 daqiqa davomida faol bo'ladi. Uni hech kimga bermang.</p>
      <p class="notice">Xavfsizlik eslatmasi: Agar siz ushbu kodni so'ramagan bo'lsangiz, ushbu xatga e'tibor bermang.</p>
    </div>
    <div class="footer">
      &copy; 2026 Wedding Hall Booking Platform.
    </div>
  </div>
</body>
</html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Wedding Hall Platform" <${EMAIL_USER}>`,
        to: email,
        subject: 'Wedding Hall Platform OTP Verification',
        html: htmlContent,
      });
      console.log(`[Email] OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error(`[Email] Failed to send OTP email to ${email}:`, error);
      throw new Error('Email yuborishda xatolik yuz berdi');
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[OTP CONSOLE LOG] Code for ${email} (${name}): ${otp}`);
    console.log(`======================================================\n`);
  }
}

module.exports = {
  sendOTPEmail,
};
