const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * This creates a secure token that proves a user is logged in
 * @param {string} userId - The MongoDB _id of the user
 * @returns {string} Signed JWT token string
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. Cannot generate token.');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: '7d'
  });
};

/**
 * Send Token Response
 * Generates token, sets secure HTTP-only cookie, and sends JSON response
 * @param {object} user - The user mongoose document
 * @param {number} statusCode - HTTP status code
 * @param {object} res - Express response object
 * @param {string} message - Response message
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: user.toJSON ? user.toJSON() : user
    }
  });
};

/**
 * Clear Token Cookie
 * Clears the authentication token cookie on logout
 * @param {object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
};

module.exports = {
  generateToken,
  sendTokenResponse,
  clearTokenCookie
};
