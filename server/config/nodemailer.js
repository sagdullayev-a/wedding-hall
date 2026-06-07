const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter using Gmail SMTP.
 * Returns null if required env variables are missing.
 */
function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

module.exports = {
  createTransporter,
};
