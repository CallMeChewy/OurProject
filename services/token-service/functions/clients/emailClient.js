const {getSmtpConfig} = require('../config');
const nodemailer = require('nodemailer');

let cachedTransporter;

/**
 * Returns a cached nodemailer transporter.
 * @return {Object} Nodemailer transporter instance.
 */
function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }
  const {host, port, secure, user, pass} = getSmtpConfig();
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {user, pass},
  });
  return cachedTransporter;
}

/**
 * Sends an email using the configured transporter.
 * @param {{to: string, subject: string, text: string, html: string}} params Email payload.
 * @return {Promise<void>} Resolves when the email has been sent.
 */
async function sendEmail({to, subject, text, html}) {
  const transporter = getTransporter();
  const {from} = getSmtpConfig();
  await transporter.sendMail({from, to, subject, text, html});
}

module.exports = {
  sendEmail,
  getTransporter,
};
