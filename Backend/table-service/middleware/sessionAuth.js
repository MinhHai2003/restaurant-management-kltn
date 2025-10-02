const jwt = require("jsonwebtoken");

const sessionAuth = (req, res, next) => {
  try {
    // Get token and session ID from headers
    const authHeader = req.headers.authorization;
    const sessionId = req.headers["x-session-id"];

    // Try authentication with JWT token first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.customerId = decoded.customerId;
        req.token = token;
        console.log("✅ [AUTH] Authenticated user:", decoded.customerId);
        return next();
      } catch (jwtError) {
        console.log("❌ [AUTH] Invalid token:", jwtError.message);
        // Don't return error, try session ID instead
      }
    }

    // If no valid token, try session ID for guest users
    if (sessionId && sessionId.trim() !== "") {
      req.sessionId = sessionId.trim();
      console.log("✅ [AUTH] Guest session:", sessionId);
      return next();
    }

    // No valid authentication found
    console.log("❌ [AUTH] No valid authentication provided");
    return res.status(401).json({
      success: false,
      message:
        "Authentication required - provide either valid token or session ID",
      error: "MISSING_AUTH",
    });
  } catch (error) {
    console.error("❌ [AUTH] Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
      error: "AUTH_ERROR",
    });
  }
};

module.exports = sessionAuth;
