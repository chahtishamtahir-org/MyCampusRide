const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // If no SMTP credentials are provided, just log the email to the console instead of timing out
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n======================================================');
    console.log('⚠️ NO SMTP CREDENTIALS FOUND - EMAIL NOT SENT');
    console.log('======================================================');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log('------------------------------------------------------');
    console.log(options.message);
    console.log('======================================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `MyCampusRide <${process.env.EMAIL_FROM || 'noreply@mycampusride.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
};

module.exports = sendEmail;
