import { verifyToken } from "./auth.js";

export const authenticate = (req, res, next) => {
  // Get token from Header (CLI) or Cookie (Web Portal)
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.cookies?.accessToken;

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", message: "Unauthorized: No token provided" });
  }

  // Verify the token using auth.js
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: Invalid or expired token",
    });
  }

  // Attach user info to the request for the next step
  req.user = decoded;
  next();
};

// Role-Based Access Control (RBAC) Guard
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Higher privilege required",
      });
    }
    next();
  };
};

export const validateVersion = (req, res, next) => {
  const version = req.headers["x-api-version"];
  if (version !== "1") {
    return res.status(400).json({
      status: "error",
      message: "API version header required",
    });
  }
  next();
};
