const jwt = require('jsonwebtoken');
const db = require('../db');

// Basic authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await db.query(
      `SELECT user_id, full_name, email, role, stream_id 
       FROM users 
       WHERE user_id = $1`,
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = result.rows[0];
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions',
        required_roles: roles,
        your_role: req.user.role
      });
    }

    next();
  };
};

// Check if user is a lecturer
const isLecturer = (req, res, next) => {
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Access denied. Lecturers only' });
  }
  next();
};

// Check if user is a principal lecturer
const isPrincipalLecturer = (req, res, next) => {
  if (req.user.role !== 'principal_lecturer') {
    return res.status(403).json({ error: 'Access denied. Principal Lecturers only' });
  }
  next();
};

// Check if user is program leader
const isProgramLeader = (req, res, next) => {
  if (req.user.role !== 'program_leader') {
    return res.status(403).json({ error: 'Access denied. Program Leader only' });
  }
  next();
};

// Check if user is student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only' });
  }
  next();
};

// Check if user is PRL or Program Leader (for viewing reports)
const isPRLOrAbove = (req, res, next) => {
  if (!['principal_lecturer', 'program_leader'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Principal Lecturer or Program Leader access required' 
    });
  }
  next();
};

// Verify lecturer owns the resource (for updating/deleting reports)
const verifyLecturerOwnership = async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const lecturerId = req.user.user_id;

    // Check if the report belongs to this lecturer
    const result = await db.query(
      'SELECT lecturer_id FROM reports WHERE report_id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (result.rows[0].lecturer_id !== lecturerId) {
      return res.status(403).json({ error: 'Access denied. You can only modify your own reports' });
    }

    next();
  } catch (error) {
    console.error('Ownership verification error:', error);
    res.status(500).json({ error: 'Error verifying ownership' });
  }
};

// Verify PRL has access to the stream
const verifyPRLStreamAccess = async (req, res, next) => {
  try {
    const prlId = req.user.user_id;
    const { stream_id } = req.body || req.query || req.params;

    if (!stream_id) {
      return next(); // If no stream_id provided, let the route handler deal with it
    }

    // Get PRL's stream
    const result = await db.query(
      'SELECT stream_id FROM users WHERE user_id = $1',
      [prlId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (result.rows[0].stream_id !== parseInt(stream_id)) {
      return res.status(403).json({ 
        error: 'Access denied. You can only access resources in your assigned stream' 
      });
    }

    next();
  } catch (error) {
    console.error('Stream access verification error:', error);
    res.status(500).json({ error: 'Error verifying stream access' });
  }
};

// Optional authentication (allows both authenticated and unauthenticated access)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next(); // No token, continue without user
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      `SELECT user_id, full_name, email, role, stream_id 
       FROM users 
       WHERE user_id = $1`,
      [decoded.user_id]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
      req.token = token;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = {
  auth,
  authorize,
  isLecturer,
  isPrincipalLecturer,
  isProgramLeader,
  isStudent,
  isPRLOrAbove,
  verifyLecturerOwnership,
  verifyPRLStreamAccess,
  optionalAuth,
};