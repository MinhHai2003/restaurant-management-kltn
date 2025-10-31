const rateLimit = require("express-rate-limit");

// 🔐 Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// 📝 Register rate limiting
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    message: "Too many accounts created, please try again later",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔑 Password change rate limiting
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password changes per hour
  message: {
    success: false,
    message: "Too many password change attempts, please try again later",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔄 Refresh token rate limiting
const refreshTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 refresh attempts per 5 minutes
  message: {
    success: false,
    message: "Too many token refresh attempts, please try again later",
    retryAfter: "5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🌐 General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  message: {
    success: false,
    message: "Too many requests, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false, // Disable trust proxy validation warning
  },
});

// 👥 Employee management rate limiting
const employeeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 employee operations per 15 minutes
  message: {
    success: false,
    message: "Too many employee management requests, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 📅 Shift management rate limiting
const shiftLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 shift operations per 15 minutes
  message: {
    success: false,
    message: "Too many shift management requests, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordChangeLimiter,
  refreshTokenLimiter,
  generalLimiter,
  employeeLimiter,
  shiftLimiter,
};
