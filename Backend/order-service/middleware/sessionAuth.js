const jwt = require("jsonwebtoken");

const sessionAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers["x-session-id"];

    console.log("🔍 [SESSION AUTH] Headers:", {
      authorization: authHeader ? "Present" : "Missing",
      sessionId: sessionId ? sessionId : "Missing",
    });

    // If user has auth token, use normal authentication
    if (authHeader) {
      const token = authHeader.split(" ")[1];

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.customerId = decoded.customerId;
          req.isAuthenticated = true;
          req.sessionId = null;
          console.log("🔐 [SESSION AUTH] Authenticated user:", req.customerId);
          return next();
        } catch (tokenError) {
          console.log(
            "🔓 [SESSION AUTH] Invalid token, falling back to session"
          );
        }
      }
    }

    // If no valid token, use session-based authentication
    if (sessionId) {
      req.customerId = null;
      req.isAuthenticated = false;
      req.sessionId = sessionId;
      console.log("🆔 [SESSION AUTH] Using session ID:", sessionId);
      return next();
    }

    // No auth token and no session ID - reject
    return res.status(401).json({
      success: false,
      message:
        "Authentication required - provide either valid token or session ID",
      error: "MISSING_AUTH",
    });
  } catch (error) {
    console.error("Session authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: "AUTH_ERROR",
    });
  }
};

module.exports = sessionAuth;
