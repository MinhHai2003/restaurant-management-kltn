const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided - use guest account
      req.isGuest = true;
      req.customerId = process.env.GUEST_CUSTOMER_ID;
      console.log(
        "🔓 [OPTIONAL AUTH] No token provided - using guest account:",
        req.customerId
      );
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      // Invalid token format - use guest account
      req.isGuest = true;
      req.customerId = process.env.GUEST_CUSTOMER_ID;
      console.log(
        "🔓 [OPTIONAL AUTH] Invalid token format - using guest account:",
        req.customerId
      );
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("🔐 [OPTIONAL AUTH] Token decoded successfully:");
      console.log("   - decoded.customerId:", decoded.customerId);
      console.log("   - decoded.email:", decoded.email);

      // Valid token - proceed as authenticated user
      req.isGuest = false;
      req.customerId = decoded.customerId;
      req.token = token;
      req.customerEmail = decoded.email;

      console.log(
        "🔐 [OPTIONAL AUTH] Authenticated user - customerId:",
        req.customerId
      );
    } catch (tokenError) {
      // Invalid or expired token - use guest account
      req.isGuest = true;
      req.customerId = process.env.GUEST_CUSTOMER_ID;
      console.log(
        "🔓 [OPTIONAL AUTH] Token invalid/expired - using guest account:",
        req.customerId
      );
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    // On any error, use guest account
    req.isGuest = true;
    req.customerId = process.env.GUEST_CUSTOMER_ID;
    next();
  }
};

module.exports = optionalAuth;
