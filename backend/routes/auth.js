const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Validate JWT_SECRET on module load
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
  throw new Error('JWT_SECRET must be configured');
}

// Helper function to generate token
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Register route
router.post('/register', registerLimiter, validateRegistration, catchAsync(async (req, res) => {
  const { full_name, email, password, role, stream_id } = req.body;

  console.log('Registration attempt for:', email);

  // Check if user already exists
  const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userExists.rows.length > 0) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert user
  const result = await db.query(
    `INSERT INTO users (full_name, email, password, role, stream_id) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING user_id, full_name, email, role, stream_id`,
    [full_name, email, hashedPassword, role, stream_id || null]
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = generateToken({ user_id: user.user_id, role: user.role });

  console.log('User registered successfully:', user.email);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      stream_id: user.stream_id,
    },
  });
}));

// Login route
router.post('/login', authLimiter, validateLogin, catchAsync(async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for:', email);

  // Find user
  const result = await db.query(
    `SELECT u.*, s.stream_name, s.stream_code 
     FROM users u 
     LEFT JOIN streams s ON u.stream_id = s.stream_id 
     WHERE u.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    console.log('User not found:', email);
    throw new AppError('Invalid credentials', 401);
  }

  const user = result.rows[0];
  console.log('User found:', email);

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log('Password mismatch for:', email);
    throw new AppError('Invalid credentials', 401);
  }

  console.log('Password matched, generating token...');

  // Generate JWT token
  const token = generateToken({ user_id: user.user_id, role: user.role });

  console.log('Login successful for:', email);

  res.json({
    message: 'Login successful',
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      stream_id: user.stream_id,
      stream_name: user.stream_name,
      stream_code: user.stream_code,
    },
  });
}));

// Get current user profile
router.get('/profile', auth, catchAsync(async (req, res) => {
  const result = await db.query(
    `SELECT u.user_id, u.full_name, u.email, u.role, u.stream_id, 
            s.stream_name, s.stream_code 
     FROM users u 
     LEFT JOIN streams s ON u.stream_id = s.stream_id 
     WHERE u.user_id = $1`,
    [req.user.user_id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({ user: result.rows[0] });
}));

// Update password
router.patch('/change-password', auth, catchAsync(async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (new_password.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  // Get user with password
  const result = await db.query(
    'SELECT password FROM users WHERE user_id = $1',
    [req.user.user_id]
  );

  const user = result.rows[0];

  // Verify current password
  const isMatch = await bcrypt.compare(current_password, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(new_password, salt);

  // Update password
  await db.query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [hashedPassword, req.user.user_id]
  );

  res.json({ message: 'Password updated successfully' });
}));

// Logout (client-side token removal, but we can blacklist tokens if needed)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
