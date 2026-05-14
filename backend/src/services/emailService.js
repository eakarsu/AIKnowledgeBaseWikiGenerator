const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendPasswordResetEmail(to, resetToken) {
  if (!process.env.SMTP_USER) {
    console.log('[EmailService] Email not configured, skipping password reset email');
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@wiki.com',
    to,
    subject: 'Password Reset',
    html: `<p>Reset your password: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}">Click here</a></p><p>This link expires in 1 hour.</p>`
  });
}

async function sendVerificationEmail(to, token) {
  if (!process.env.SMTP_USER) {
    console.log('[EmailService] Email not configured, skipping verification email');
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@wiki.com',
    to,
    subject: 'Verify Your Email',
    html: `<p>Verify your email: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}">Click here</a></p><p>This link expires in 24 hours.</p>`
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
