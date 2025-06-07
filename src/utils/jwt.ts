import jwt, { SignOptions } from "jsonwebtoken";
import logger from "./logger";

export const generateToken = (payload: object): string => {
  // Verify secret exists
  if (!process.env.JWT_SECRET) {
    logger.error("JWT secret is not configured");
    throw new Error("JWT secret is not configured");
  }

  try {
    const options: SignOptions = {
      expiresIn: "30d",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, options);

    // Log token generation (first few characters only)
    logger.debug("Token generated successfully:", {
      payload,
      tokenPrefix: token.substring(0, 10) + "...",
    });

    return token;
  } catch (error) {
    logger.error("Token generation failed:", error);
    throw new Error("Failed to generate authentication token");
  }
};

export const verifyToken = (token: string): jwt.JwtPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
};
