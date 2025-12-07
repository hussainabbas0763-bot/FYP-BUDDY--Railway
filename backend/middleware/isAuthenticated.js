import jwt from "jsonwebtoken";

// ✅ Middleware: Verify JWT & attach user role
export const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    // Decode and verify JWT
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role, // extracted from JWT
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired. Please log in again.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid or malformed token",
    });
  }
};

// ✅ Middleware: Check role against the one(s) allowed
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${userRole || "unknown"} not allowed`,
      });
    }

    next();
  };
};
