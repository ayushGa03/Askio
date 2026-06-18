// import { body } from "express-validator";

// // Register Validation Rules
// export const validateRegister = [
//   body("username")
//     .trim()
//     .notEmpty()
//     .withMessage("Username is required")
//     .isLength({ min: 3, max: 30 })
//     .withMessage("Username must be between 3 and 30 characters")
//     .matches(/^[a-zA-Z0-9_]+$/)
//     .withMessage("Username can only contain letters, numbers, and underscores"),

//   body("email")
//     .trim()
//     .notEmpty()
//     .withMessage("Email is required")
//     .isEmail()
//     .withMessage("Please provide a valid email address")
//     .normalizeEmail(),

//   body("password")
//     .notEmpty()
//     .withMessage("Password is required")
//     .isLength({ min: 8 })
//     .withMessage("Password must be at least 8 characters long")
//     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
//     .withMessage(
//       "Password must contain at least one uppercase letter, one lowercase letter, and one number"
//     ),

// ];
