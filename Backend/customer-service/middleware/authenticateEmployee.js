const jwt = require("jsonwebtoken");

const authenticateEmployee = (allowedRoles = ["admin", "manager"]) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.substring(7)
          : null;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Employee access token required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.userId || !decoded.role) {
        return res.status(401).json({
          success: false,
          message: "Invalid employee token",
        });
      }

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      req.employeeId = decoded.userId;
      req.employeeRole = decoded.role;
      req.employeeEmail = decoded.email;
      req.employeeName = decoded.name || null; // Get name from token if available

      next();
    } catch (error) {
      console.error("Employee authentication error:", error);

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid employee token",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Employee token expired",
        });
      }

      res.status(500).json({
        success: false,
        message: "Employee authentication failed",
        error: error.message,
      });
    }
  };
};

module.exports = authenticateEmployee;
