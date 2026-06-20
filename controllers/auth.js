import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { blacklistToken } from "../config/cache.js";
import { sendVerificationEmail } from "../services/Mail.js";
import { verifyGoogleToken } from "../services/googleAuth.js";

// Register Controller
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered. Please use a different email.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "Username is already taken. Please choose a different username.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      verified: false, // Initially not verified
    });

    await newUser.save();

    // Generate verification token (expires in 24 hours)
    const verificationToken = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "24h" }
    );

    // Send verification email
    console.log(`📧 Sending verification email to ${email}...`);
    const emailResult = await sendVerificationEmail(email, username, verificationToken);

    if (!emailResult.success) {
      console.warn(`⚠ Verification email failed to send for ${username}`);
    }

    return res.status(201).json({
      success: true,
      message: emailResult.success 
        ? "User registered successfully! A verification email has been sent to your email address. Please check your email and click the verification link to activate your account." 
        : "User registered successfully, but verification email could not be sent. Please contact support.",
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Register error:", error.message);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} is already in use.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred during registration.",
    });
  }
};

// Email Verification Controller
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is missing.",
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key"
    );

    // Find user and update verified status
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. You can log in now.",
      });
    }

    // Update verified status
    user.verified = true;
    await user.save();

    console.log(`✓ Email verified for user: ${user.username}`);

    // return res.status(200).json({
    //   success: true,
    //   message: "✓ Email verified successfully! Your account is now active. You can log in now.",
    //   user: {
    //     id: user._id,
    //     username: user.username,
    //     email: user.email,
    //     verified: user.verified,
    //   },
    // });

    return res.status(200).type('html').send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
          }
          h1 {
            color: #28a745;
            margin-bottom: 20px;
          }
          p {
            color: #333;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background-color: #007BFF;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: background-color 0.3s;
          }
          a:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Email Verified Successfully! 🎉</h1>
          <p>Your account is now active. You can log in to your account and start using our services.</p>
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login">Go to Login</a>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    console.error("Email verification error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or tampered verification token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Verification token has expired. Please register again or request a new verification email.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred during email verification.",
    });
  }
};

// Google OAuth Controller - handles both registration and login
export const googleAuth = async (req, res) => {
  try {
    const { idToken, mode } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required.",
      });
    }

    // Verify the Google token
    const googleUser = await verifyGoogleToken(idToken);

    // Check if user already exists with this Google ID or email
    let user = await User.findOne({
      $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
    });

    // LOGIN mode — user must already exist
    if (mode === "login" && !user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this Google email. Please register first.",
        needsRegister: true,
      });
    }

    // REGISTER mode — user must NOT already exist
    if (mode === "register" && user) {
      return res.status(409).json({
        success: false,
        message: "This Google account is already registered. Please sign in instead.",
        alreadyExists: true,
      });
    }

    if (user) {
      // User exists — link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.avatar = googleUser.avatar || user.avatar;
        user.verified = true;
        await user.save();
        console.log(`✓ Linked Google account for existing user: ${user.username}`);
      }
    } else {
      // New user — create account (Google-verified, no password needed)
      // Generate a unique username from Google name
      let baseUsername = googleUser.name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 20);

      // Ensure unique username
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = new User({
        username,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.avatar,
        verified: true, // Google already verified the email
      });

      await user.save();
      console.log(`✓ New Google user created: ${user.username} (${user.email})`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: user.createdAt === user.updatedAt
        ? "Account created successfully with Google!"
        : "Signed in successfully with Google!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error.message);

    if (error.message === 'Invalid Google token') {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google token. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred during Google authentication.",
    });
  }
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if user has a password (e.g. they might have registered with Google)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account was created using Google Sign-In. Please log in with Google.",
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Block unverified users
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in. Check your inbox.",
        notVerified: true,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An error occurred during login.",
    });
  }
};

// Get Current User
export const getCurrentUser = async (req, res) => {
  try {
    // Verify that user info exists in request
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in first.",
      });
    }

    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found. Your account may have been deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user profile. Please try again.",
    });
  }
};

// Logout Controller
export const logout = async (req, res) => {
  try {
    // Verify that user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "No active session found. Please log in first.",
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        // Decode token to get expiration time
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
          // Calculate TTL (Time To Live) in seconds
          const currentTime = Math.floor(Date.now() / 1000);
          const ttl = decoded.exp - currentTime;

          // Add token to blacklist if TTL is positive
          if (ttl > 0) {
            await blacklistToken(token, ttl);
          }
        }
      } catch (error) {
        console.error("Error processing token for blacklist:", error.message);
        // Continue with logout even if blacklisting fails
      }
    }

    // ✅ Clear the httpOnly cookie so the old session cannot leak to another user
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });

    return res.status(200).json({
      success: true,
      message: "Logout successful. Your session has been terminated.",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during logout. Please try again.",
    });
  }
};
