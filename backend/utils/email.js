const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;

// Setup transporter
const setupTransporter = () => {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });
};

// Initialize transporter
setupTransporter();

/**
 * Send email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text body
 * @param {String} options.html - HTML body (optional)
 * @param {Array} options.attachments - Attachments (optional)
 */
exports.sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Project Manager" <${config.email.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
