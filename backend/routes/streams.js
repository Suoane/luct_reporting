const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// *** NEW: Public endpoint for streams (no authentication required) ***
// This allows registration page to fetch streams without being logged in
router.get('/public', catchAsync(async (req, res) => {
  const result = await db.query(
    `SELECT stream_id, stream_name, stream_code
     FROM streams
     ORDER BY stream_name`
  );

  res.json({ streams: result.rows });
}));

// Get all streams (authenticated)
router.get('/', auth, catchAsync(async (req, res) => {
  const result = await db.query(
    `SELECT s.*, 
            COUNT(DISTINCT u.user_id) as total_lecturers,
            COUNT(DISTINCT c.course_id) as total_courses,
            COUNT(DISTINCT cl.class_id) as total_classes
     FROM streams s
     LEFT JOIN users u ON s.stream_id = u.stream_id AND u.role = 'lecturer'
     LEFT JOIN courses c ON s.stream_id = c.stream_id
     LEFT JOIN classes cl ON s.stream_id = cl.stream_id
     GROUP BY s.stream_id
     ORDER BY s.stream_name`
  );

  res.json({ streams: result.rows });
}));

// Get stream by ID with details
router.get('/:id', auth, catchAsync(async (req, res) => {
  const { id } = req.params;

  // Get stream details
  const streamResult = await db.query(
    'SELECT * FROM streams WHERE stream_id = $1',
    [id]
  );

  if (streamResult.rows.length === 0) {
    throw new AppError('Stream not found', 404);
  }

  const stream = streamResult.rows[0];

  // Get Principal Lecturer for this stream
  const prlResult = await db.query(
    `SELECT user_id, full_name, email 
     FROM users 
     WHERE stream_id = $1 AND role = 'principal_lecturer'`,
    [id]
  );

  // Get all courses in this stream
  const coursesResult = await db.query(
    `SELECT c.*, u.full_name as lecturer_name 
     FROM courses c
     LEFT JOIN users u ON c.lecturer_id = u.user_id
     WHERE c.stream_id = $1
     ORDER BY c.course_code`,
    [id]
  );

  // Get all classes in this stream
  const classesResult = await db.query(
    `SELECT * FROM classes 
     WHERE stream_id = $1
     ORDER BY class_name`,
    [id]
  );

  // Get all lecturers in this stream
  const lecturersResult = await db.query(
    `SELECT user_id, full_name, email 
     FROM users 
     WHERE stream_id = $1 AND role = 'lecturer'
     ORDER BY full_name`,
    [id]
  );

  res.json({
    stream,
    principal_lecturer: prlResult.rows[0] || null,
    courses: coursesResult.rows,
    classes: classesResult.rows,
    lecturers: lecturersResult.rows,
  });
}));

// Get stream statistics (for dashboards)
router.get('/:id/statistics', auth, catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if stream exists
  const streamCheck = await db.query(
    'SELECT stream_id FROM streams WHERE stream_id = $1',
    [id]
  );

  if (streamCheck.rows.length === 0) {
    throw new AppError('Stream not found', 404);
  }

  // Get report statistics
  const statsResult = await db.query(
    `SELECT 
       COUNT(DISTINCT r.report_id) as total_reports,
       COUNT(DISTINCT CASE WHEN r.status = 'pending' THEN r.report_id END) as pending_reports,
       COUNT(DISTINCT CASE WHEN r.status = 'reviewed' THEN r.report_id END) as reviewed_reports,
       COUNT(DISTINCT CASE WHEN r.status = 'approved' THEN r.report_id END) as approved_reports,
       AVG(rf.rating) as average_rating,
       COUNT(DISTINCT r.lecturer_id) as active_lecturers,
       COUNT(DISTINCT r.course_id) as active_courses
     FROM reports r
     LEFT JOIN report_feedback rf ON r.report_id = rf.report_id
     JOIN courses c ON r.course_id = c.course_id
     WHERE c.stream_id = $1`,
    [id]
  );

  // Get attendance statistics
  const attendanceResult = await db.query(
    `SELECT 
       AVG(r.actual_students_present * 100.0 / NULLIF(r.total_registered_students, 0)) as avg_attendance_rate,
       SUM(r.actual_students_present) as total_present,
       SUM(r.total_registered_students) as total_registered
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     WHERE c.stream_id = $1`,
    [id]
  );

  res.json({
    report_statistics: statsResult.rows[0],
    attendance_statistics: attendanceResult.rows[0],
  });
}));

// Create new stream (Program Leader only)
router.post('/', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { stream_name, stream_code } = req.body;

  if (!stream_name || !stream_code) {
    throw new AppError('Stream name and code are required', 400);
  }

  // Check if stream already exists
  const exists = await db.query(
    'SELECT stream_id FROM streams WHERE stream_code = $1 OR stream_name = $2',
    [stream_code, stream_name]
  );

  if (exists.rows.length > 0) {
    throw new AppError('Stream with this name or code already exists', 400);
  }

  const result = await db.query(
    `INSERT INTO streams (stream_name, stream_code) 
     VALUES ($1, $2) 
     RETURNING *`,
    [stream_name, stream_code]
  );

  res.status(201).json({
    message: 'Stream created successfully',
    stream: result.rows[0],
  });
}));

// Update stream (Program Leader only)
router.patch('/:id', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { stream_name, stream_code } = req.body;

  if (!stream_name && !stream_code) {
    throw new AppError('At least one field is required to update', 400);
  }

  // Check if stream exists
  const streamCheck = await db.query(
    'SELECT stream_id FROM streams WHERE stream_id = $1',
    [id]
  );

  if (streamCheck.rows.length === 0) {
    throw new AppError('Stream not found', 404);
  }

  // Build update query
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (stream_name) {
    updates.push(`stream_name = $${paramCount}`);
    values.push(stream_name);
    paramCount++;
  }

  if (stream_code) {
    updates.push(`stream_code = $${paramCount}`);
    values.push(stream_code);
    paramCount++;
  }

  values.push(id);

  const result = await db.query(
    `UPDATE streams 
     SET ${updates.join(', ')} 
     WHERE stream_id = $${paramCount} 
     RETURNING *`,
    values
  );

  res.json({
    message: 'Stream updated successfully',
    stream: result.rows[0],
  });
}));

// Delete stream (Program Leader only) - This should be used carefully
router.delete('/:id', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if stream exists
  const streamCheck = await db.query(
    'SELECT stream_id FROM streams WHERE stream_id = $1',
    [id]
  );

  if (streamCheck.rows.length === 0) {
    throw new AppError('Stream not found', 404);
  }

  // Check if stream has any courses
  const coursesCheck = await db.query(
    'SELECT COUNT(*) as count FROM courses WHERE stream_id = $1',
    [id]
  );

  if (parseInt(coursesCheck.rows[0].count) > 0) {
    throw new AppError('Cannot delete stream with existing courses. Please reassign or delete courses first.', 400);
  }

  await db.query('DELETE FROM streams WHERE stream_id = $1', [id]);

  res.json({ message: 'Stream deleted successfully' });
}));

module.exports = router;