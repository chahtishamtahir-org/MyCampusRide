/**
 * Email Templates for MyCampusRide
 */

const getVerificationEmailHtml = (verifyURL, name = '') => {
  const greeting = name ? `Welcome, ${name}!` : 'Welcome to MyCampusRide!';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F8FAFC;
      padding: 40px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
      border: 1px solid #E2E8F0;
    }
    .header {
      background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 36px;
      line-height: 1;
      margin-bottom: 8px;
    }
    .brand {
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .content {
      padding: 40px 32px;
      color: #334155;
    }
    h1 {
      color: #0F172A;
      font-size: 22px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 24px;
      color: #475569;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0EA5E9;
      color: #FFFFFF !important;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
    }
    .divider {
      height: 1px;
      background-color: #E2E8F0;
      margin: 32px 0 24px 0;
    }
    .fallback {
      font-size: 13px;
      color: #64748B;
      word-break: break-all;
    }
    .fallback a {
      color: #0EA5E9;
      text-decoration: none;
    }
    .footer {
      background-color: #F1F5F9;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
      border-top: 1px solid #E2E8F0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">🚌</div>
        <div class="brand">MyCampusRide</div>
      </div>
      <div class="content">
        <h1>${greeting}</h1>
        <p>Thank you for signing up for MyCampusRide! We are excited to welcome you to our campus ride-sharing and carpooling community.</p>
        <p>To verify your email address and activate your account, please click the button below:</p>
        <div class="btn-container">
          <a href="${verifyURL}" class="btn" style="color: #ffffff;">Verify Email Address</a>
        </div>
        <p>This verification link will expire in 24 hours.</p>
        <div class="divider"></div>
        <p class="fallback">If the button above does not work, copy and paste this URL into your browser:<br>
        <a href="${verifyURL}">${verifyURL}</a></p>
      </div>
      <div class="footer">
        This email was sent to you because you registered an account on MyCampusRide. If you did not register for this service, please ignore this email.
        <br><br>
        &copy; 2026 MyCampusRide. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  getVerificationEmailHtml
};
