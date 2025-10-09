const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all courses with filtering
router.get('/', auth, catchAsync(async (req, res) => {
  const { stream_id, search } = req.query;
  
  let query = `
    SELECT c.course_id, c.course_name, c.course_code, c.stream_id,
           c.lecturer_id, c.created_at, c.updated_at,
           s.stream_name, s.stream_code,
           u.full_name as lecturer_name, u.email as lecturer_email
    FROM courses c
    JOIN streams s ON c.stream_id = s.stream_id
    LEFT JOIN users u ON c.lecturer_id = u.user_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramCount = 1;

  // Role-based filtering
  if (req.user.role === 'principal_lecturer' || req.user.role === 'lecturer') {
    query += ` AND c.stream_id = $${paramCount}`;
    params.push(req.user.stream_id);
    paramCount++;
  }

  // Lecturer sees only their courses
  if (req.user.role === 'lecturer') {
    query += ` AND c.lecturer_id = $${paramCount}`;
    params.push(req.user.user_id);
    paramCount++;
  }

  // Filter by stream
  if (stream_id && req.user.role === 'program_leader') {
    query += ` AND c.stream_id = $${paramCount}`;
    params.push(stream_id);
    paramCount++;
  }

  // Search functionality
  if (search) {
    query += ` AND (c.course_name ILIKE $${paramCount} OR c.course_code ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  query += ' ORDER BY s.stream_code, c.course_code';

  const result = await db.query(query, params);

  res.json({
    success: true,
    count: result.rows.length,
    courses: result.rows,
  });
}));

// Get single course by ID
router.get('/:id', auth, catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT c.course_id, c.course_name, c.course_code, c.stream_id,
            c.lecturer_id, c.created_at, c.updated_at,
            s.stream_name, s.stream_code,
            u.full_name as lecturer_name, u.email as lecturer_email
     FROM courses c
     JOIN streams s ON c.stream_id = s.stream_id
     LEFT JOIN users u ON c.lecturer_id = u.user_id
     WHERE c.course_id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Course not found', 404);
  }

  const course = result.rows[0];

  // Authorization check
  if (
    req.user.role === 'principal_lecturer' && req.user.stream_id !== course.stream_id ||
    req.user.role === 'lecturer' && req.user.user_id !== course.lecturer_id
  ) {
    throw new AppError('Not authorized to view this course', 403);
  }

  // Get classes for this course
  const classes = await db.query(
    `SELECT cl.class_id, cl.class_name, cl.total_students
     FROM class_courses cc
     JOIN classes cl ON cc.class_id = cl.class_id
     WHERE cc.course_id = $1
     ORDER BY cl.class_name`,
    [id]
  );

  res.json({
    success: true,
    course: {
      ...course,
      classes: classes.rows,
    },
  });
}));

// Create new course (Program Leader only)
router.post('/', auth, authorize(['program_leader']), catchAsync(async (req, res) => {
  const { course_name, course_code, stream_id, lecturer_id } = req.body;

  // Validation
  if (!course_name || !course_code || !stream_id) {
    throw new AppError('Please provide course name, code, and stream', 400);
  }

  // Check if course code exists
  const existingCourse = await db.query(
    'SELECT * FROM courses WHERE course_code = $1',
    [course_code]
  );
  if (existingCourse.rows.length > 0) {
    throw new AppError('Course code already exists', 400);
  }

  // Verify stream exists
  const streamCheck = await db.query('SELECT * FROM streams WHERE stream_id = $1', [stream_id]);
  if (streamCheck.rows.length === 0) {
    throw new AppError('Stream not found', 404);
  }

  // If lecturer assigned, verify they belong to the stream
  if (lecturer_id) {
    const lecturerCheck = await db.query(
      'SELECT * FROM users WHERE user_id = $1 AND role = $2 AND stream_id = $3',
      [lecturer_id, 'lecturer', stream_id]
    );
    if (lecturerCheck.rows.length === 0) {
      throw new AppError('Lecturer not found or not in the specified stream', 400);
    }
  }

  // Insert course
  const result = await db.query(
    `INSERT INTO courses (course_name, course_code, stream_id, lecturer_id)
     VALUES ($1, $2, $3, $4)
     RETURNING course_id, course_name, course_code, stream_id, lecturer_id, created_at`,
    [course_name, course_code, stream_id, lecturer_id || null]
  );

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course: result.rows[0],
  });
}));

// Update course (Program Leader only)
router.put('/:id', auth, authorize(['program_leader']), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { course_name, course_code, stream_id, lecturer_id } = req.body;

  // Check if course exists
  const courseCheck = await db.query('SELECT * FROM courses WHERE course_id = $1', [id]);
  if (courseCheck.rows.length === 0) {
    throw new AppError('Course not found', 404);
  }

  // If changing course code, check for duplicates
  if (course_code && course_code !== courseCheck.rows[0].course_code) {
    const codeCheck = await db.query(
      'SELECT * FROM courses WHERE course_code = $1 AND course_id != $2',
      [course_code, id]
    );
    if (codeCheck.rows.length > 0) {
      throw new AppError('Course code already in use', 400);
    }
  }

  // Build update query
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (course_name) {
    updates.push(`course_name = $${paramCount}`);
    params.push(course_name);
    paramCount++;
  }

  if (course_code) {
    updates.push(`course_code = $${paramCount}`);
    params.push(course_code);
    paramCount++;
  }

  if (stream_id) {
    updates.push(`stream_id = $${paramCount}`);
    params.push(stream_id);
    paramCount++;
  }

  if (lecturer_id !== undefined) {
    if (lecturer_id) {
      // Verify lecturer exists and belongs to stream
      const lecturerCheck = await db.query(
        'SELECT * FROM users WHERE user_id = $1 AND role = $2',
        [lecturer_id, 'lecturer']
      );
      if (lecturerCheck.rows.length === 0) {
        throw new AppError('Lecturer not found', 404);
      }
    }
    updates.push(`lecturer_id = $${paramCount}`);
    params.push(lecturer_id);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const query = `
    UPDATE courses 
    SET ${updates.join(', ')}
    WHERE course_id = $${paramCount}
    RETURNING course_id, course_name, course_code, stream_id, lecturer_id, updated_at
  `;

  const result = await db.query(query, params);

  res.json({
    success: true,
    message: 'Course updated successfully',
    course: result.rows[0],
  });
}));

// Assign lecturer to course (Program Leader only)
router.patch('/:id/assign-lecturer', auth, authorize(['program_leader']), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { lecturer_id } = req.body;

  if (!lecturer_id) {
    throw new AppError('Lecturer ID is required', 400);
  }

  // Get course
  const courseCheck = await db.query('SELECT * FROM courses WHERE course_id = $1', [id]);
  if (courseCheck.rows.length === 0) {
    throw new AppError('Course not found', 404);
  }

  const course = courseCheck.rows[0];

  // Verify lecturer exists and belongs to same stream
  const lecturerCheck = await db.query(
    'SELECT * FROM users WHERE user_id = $1 AND role = $2 AND stream_id = $3',
    [lecturer_id, 'lecturer', course.stream_id]
  );
  if (lecturerCheck.rows.length === 0) {
    throw new AppError('Lecturer not found or not in the same stream as the course', 400);
  }

  // Assign lecturer
  await db.query(
    'UPDATE courses SET lecturer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE course_id = $2',
    [lecturer_id, id]
  );

  res.json({
    success: true,
    message: 'Lecturer assigned successfully',
  });
}));

// Delete course (Program Leader only)
router.delete('/:id', auth, authorize(['program_leader']), catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if course exists
  const courseCheck = await db.query('SELECT * FROM courses WHERE course_id = $1', [id]);
  if (courseCheck.rows.length === 0) {
    throw new AppError('Course not found', 404);
  }

  // Check if course has reports
  const reportsCheck = await db.query('SELECT COUNT(*) FROM reports WHERE course_id = $1', [id]);
  if (parseInt(reportsCheck.rows[0].count) > 0) {
    throw new AppError('Cannot delete course with existing reports', 400);
  }

  await db.query('DELETE FROM courses WHERE course_id = $1', [id]);

  res.json({
    success: true,
    message: 'Course deleted successfully',
  });
}));

// Get courses by stream (for dropdown/selection)
router.get('/stream/:stream_id/list', auth, catchAsync(async (req, res) => {
  const { stream_id } = req.params;

  const result = await db.query(
    `SELECT course_id, course_name, course_code
     FROM courses
     WHERE stream_id = $1
     ORDER BY course_code`,
    [stream_id]
  );

  res.json({
    success: true,
    courses: result.rows,
  });
}));

// Get courses statistics (Program Leader and PRL)
router.get('/stats/overview', auth, authorize(['program_leader', 'principal_lecturer']), catchAsync(async (req, res) => {
  let query = `
    SELECT 
      s.stream_name,
      s.stream_code,
      COUNT(c.course_id) as total_courses,
      COUNT(c.lecturer_id) as assigned_courses,
      COUNT(c.course_id) - COUNT(c.lecturer_id) as unassigned_courses
    FROM streams s
    LEFT JOIN courses c ON s.stream_id = c.stream_id
  `;

  const params = [];
  if (req.user.role === 'principal_lecturer') {
    query += ' WHERE s.stream_id = $1';
    params.push(req.user.stream_id);
  }

  query += ' GROUP BY s.stream_id, s.stream_name, s.stream_code ORDER BY s.stream_code';

  const result = await db.query(query, params);

  res.json({
    success: true,
    statistics: result.rows,
  });
}));

module.exports = router;