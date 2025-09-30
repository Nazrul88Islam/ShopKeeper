const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
  verifyEmail
} = require('../controllers/authController');

const { protect, authorize, sensitiveOperation, auditLog } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'sales', 'inventory', 'accountant', 'customer_service'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

// Public routes
router.post('/register', 
  registerValidation, 
  handleValidationErrors,
  auditLog('register', 'user'),
  register
);

router.post('/login', 
  loginValidation, 
  handleValidationErrors,
  auditLog('login', 'user'),
  login
);

router.post('/forgot-password', 
  forgotPasswordValidation, 
  handleValidationErrors,
  auditLog('forgot_password', 'user'),
  forgotPassword
);

router.put('/reset-password/:resettoken', 
  resetPasswordValidation, 
  handleValidationErrors,
  auditLog('reset_password', 'user'),
  resetPassword
);

router.get('/verify-email/:token', 
  auditLog('verify_email', 'user'),
  verifyEmail
);

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/me', 
  auditLog('get_profile', 'user'),
  getMe
);

router.put('/profile', 
  updateProfileValidation, 
  handleValidationErrors,
  auditLog('update_profile', 'user'),
  updateProfile
);

router.put('/change-password', 
  changePasswordValidation, 
  handleValidationErrors,
  sensitiveOperation,
  auditLog('change_password', 'user'),
  changePassword
);

router.post('/logout', 
  auditLog('logout', 'user'),
  logout
);

router.post('/refresh', 
  auditLog('refresh_token', 'user'),
  refreshToken
);

module.exports = router;