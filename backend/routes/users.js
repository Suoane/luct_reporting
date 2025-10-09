const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all users (Program Leader and PRL only)
router.get('/', auth, authorize(['program_leader', 'principal_lecturer']), catchAsync(async (req, res) => {
  const { role, stream_id, search } = req.query;
  
  let query = `
    SELECT u.user_id, u.full_name, u.email, u.role, u.stream_id, 
           s.stream_name, s.stream_code, u.created_at
    FROM users u
    LEFT JOIN streams s ON u.stream_id = s.stream_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramCount = 1;

  // Filter by role
  if (role) {
    query += ` AND u.role = $${paramCount}`;
    params.push(role);
    paramCount++;
  }

  // Filter by stream (PRL can only see their stream)
  if (req.user.role === 'principal_lecturer') {
    query += ` AND u.stream_id = $${paramCount}`;
    params.push(req.user.stream_id);
    paramCount++;
  } else if (stream_id) {
    query += ` AND u.stream_id = $${paramCount}`;
    params.push(stream_id);
    paramCount++;
  }

  // Search functionality
  if (search) {
    query += ` AND (u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  query += ' ORDER BY u.role, u.full_name';

  const result = await db.query(query, params);

  res.json({
    success: true,
    count: result.rows.length,
    users: result.rows,
  });
}));

// Get single user by ID
router.get('/:id', auth, catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT u.user_id, u.full_name, u.email, u.role, u.stream_id,
            s.stream_name, s.stream_code, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN streams s ON u.stream_id = s.stream_id
     WHERE u.user_id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Authorization check: Users can view their own profile, PRL can view users in their stream
  const user = result.rows[0];
  if (
    req.user.user_id !== parseInt(id) &&
    req.user.role !== 'program_leader' &&
    (req.user.role !== 'principal_lecturer' || req.user.stream_id !== user.stream_id)
  ) {
    throw new AppError('Not authorized to view this user', 403);
  }

  res.json({ success: true, user });
}));

// Create new user (Program Leader only)
router.post('/', auth, authorize(['program_leader']), catchAsync(async (req, res) => {
  const { full_name, email, password, role, stream_id } = req.body;

  // Validation
  if (!full_name || !email || !password || !role) {
    throw new AppError('Please provide all required fields', 400);
  }

  // Check if user exists
  const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email already exists', 400);
  }

  // Validate role-specific requirements
  if (['lecturer', 'principal_lecturer', 'student'].includes(role) && !stream_id) {
    throw new AppError(`Stream ID is required for ${role} role`, 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert user
  const result = await db.query(
    `INSERT INTO users (full_name, email, password, role, stream_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, full_name, email, role, stream_id, created_at`,
    [full_name, email, hashedPassword, role, stream_id || null]
  );

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: result.rows[0],
  });
}));

// Update user (Program Leader or user themselves)
router.put('/:id', auth, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, stream_id } = req.body;

  // Authorization check
  if (
    req.user.user_id !== parseInt(id) &&
    req.user.role !== 'program_leader'
  ) {
    throw new AppError('Not authorized to update this user', 403);
  }

  // Check if user exists
  const userCheck = await db.query('SELECT * FROM users WHERE user_id = $1', [id]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // If changing email, check for duplicates
  if (email && email !== userCheck.rows[0].email) {
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1 AND user_id != $2', [email, id]);
    if (emailCheck.rows.length > 0) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Build update query
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (full_name) {
    updates.push(`full_name = $${paramCount}`);
    params.push(full_name);
    paramCount++;
  }

  if (email) {
    updates.push(`email = $${paramCount}`);
    params.push(email);
    paramCount++;
  }

  // Only program leader can change role and stream
  if (req.user.role === 'program_leader') {
    if (role) {
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (stream_id !== undefined) {
      updates.push(`stream_id = $${paramCount}`);
      params.push(stream_id);
      paramCount++;
    }
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const query = `
    UPDATE users 
    SET ${updates.join(', ')}
    WHERE user_id = $${paramCount}
    RETURNING user_id, full_name, email, role, stream_id, updated_at
  `;

  const result = await db.query(query, params);

  res.json({
    success: true,
    message: 'User updated successfully',
    user: result.rows[0],
  });
}));

// Delete user (Program Leader only)
router.delete('/:id', auth, authorize(['program_leader']), catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const userCheck = await db.query('SELECT * FROM users WHERE user_id = $1', [id]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting yourself
  if (req.user.user_id === parseInt(id)) {
    throw new AppError('You cannot delete your own account', 400);
  }

  await db.query('DELETE FROM users WHERE user_id = $1', [id]);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
}));

// Get lecturers by stream (for course assignment)
router.get('/stream/:stream_id/lecturers', auth, authorize(['program_leader', 'principal_lecturer']), catchAsync(async (req, res) => {
  const { stream_id } = req.params;

  const result = await db.query(
    `SELECT user_id, full_name, email
     FROM users
     WHERE role = 'lecturer' AND stream_id = $1
     ORDER BY full_name`,
    [stream_id]
  );

  res.json({
    success: true,
    lecturers: result.rows,
  });
}));

// Get user statistics (Program Leader only)
router.get('/stats/overview', auth, authorize(['program_leader']), catchAsync(async (req, res) => {
  const stats = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE role = 'student') as total_students,
      COUNT(*) FILTER (WHERE role = 'lecturer') as total_lecturers,
      COUNT(*) FILTER (WHERE role = 'principal_lecturer') as total_prls,
      COUNT(*) FILTER (WHERE role = 'program_leader') as total_pls,
      COUNT(*) as total_users
    FROM users
  `);

  const streamStats = await db.query(`
    SELECT 
      s.stream_name,
      s.stream_code,
      COUNT(u.user_id) FILTER (WHERE u.role = 'student') as students,
      COUNT(u.user_id) FILTER (WHERE u.role = 'lecturer') as lecturers
    FROM streams s
    LEFT JOIN users u ON s.stream_id = u.stream_id
    GROUP BY s.stream_id, s.stream_name, s.stream_code
    ORDER BY s.stream_code
  `);

  res.json({
    success: true,
    overview: stats.rows[0],
    by_stream: streamStats.rows,
  });
}));

module.exports = router;