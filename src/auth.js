import jwt from "jsonwebtoken";

// The Chef's secret recipes
export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
  };

  // TRD Requirement: Short expiry for access tokens
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Refresh token lasts longer (7 days)
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null; // Token is fake or expired
  }
};
