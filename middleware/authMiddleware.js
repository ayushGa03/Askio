import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "../config/cache.js";


export const verifyToken = async (req, res, next) => {

  try {
        const token = req.cookies.token;
        console.log("Token:", req.cookies.token);
   console.log("Cookies:", req.cookies);
  //  const token = req.cookies.token;
  //  console.log("Cookies:", req.cookies);
// console.log("Token:", req.cookies.token);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please include a valid token in the Authorization header.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret_key"
      );
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please log in again.",
          expiredAt: jwtErr.expiredAt,
        });
      }

      // if (jwtErr.name === "JsonWebTokenError") {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Invalid or malformed token. Please log in again.",
      //   });
      // }

      // if (jwtErr.name === "NotBeforeError") {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Token is not yet valid. Please try again later.",
      //   });
      // }

      // throw jwtErr;
    }

    // Check if token is blacklisted
    const tokenBlacklisted = await isTokenBlacklisted(token);
    if (tokenBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Your session has been terminated. Please log in again.",
      });
    }

    // Attach user info to request
    // return res.status(200).json({
    //   success: true,
    //   message: "Token is valid.",
    //   user: decoded,
    // });
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    // If it's already a response, don't send another
   

  
  }
};
