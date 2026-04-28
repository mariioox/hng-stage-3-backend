import { verifyToken } from "./auth.js";

export const authenticate = (req, res, next) => {
  // 1. Get token from Header (CLI) or Cookie (Web Portal)
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.cookies?.accessToken;

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", message: "Unauthorized: No token provided" });
  }

  // 2. Verify the token using our Chef (auth.js)
  const decoded = verifyToken(token);

  if (!decoded) {
    return res
      .status(401)
      .json({
        status: "error",
        message: "Unauthorized: Invalid or expired token",
      });
  }

  // 3. Attach user info to the request for the next step
  req.user = decoded;
  next();
};

// Role-Based Access Control (RBAC) Guard
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          status: "error",
          message: "Forbidden: Higher privilege required",
        });
    }
    next();
  };
};
