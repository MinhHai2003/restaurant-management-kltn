const jwt = require("jsonwebtoken");

const authenticateCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
        error: "MISSING_TOKEN",
      });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
        error: "INVALID_TOKEN_FORMAT",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("🔐 [AUTH DEBUG] Token decoded successfully:");
    console.log("   - decoded.customerId:", decoded.customerId);
    console.log("   - decoded.userId:", decoded.userId);
    console.log("   - decoded.email:", decoded.email);
    console.log("   - Full decoded token:", decoded);

    // Add customer ID to request
    req.customerId = decoded.customerId;
    req.token = token;

    console.log("🔐 [AUTH DEBUG] Set req.customerId to:", req.customerId);

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token has expired",
        error: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        error: "INVALID_TOKEN",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: "AUTH_ERROR",
    });
  }
};

module.exports = authenticateCustomer;
