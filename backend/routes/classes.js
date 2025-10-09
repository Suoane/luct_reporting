const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Get all classes (accessible by all authenticated users)
router.get('/', auth, catchAsync(async (req, res) => {
  const { stream_id } = req.query;
  
  let query = `
    SELECT c.*, s.stream_name, s.stream_code,
           COUNT(DISTINCT cc.course_id) as course_count
    FROM classes c
    JOIN streams s ON c.stream_id = s.stream_id
    LEFT JOIN class_courses cc ON c.class_id = cc.class_id
  `;
  
  const queryParams = [];
  
  if (stream_id) {
    query += ' WHERE c.stream_id = $1';
    queryParams.push(stream_id);
  }
  
  // Filter by user's stream if lecturer or PRL
  if ((req.user.role === 'lecturer' || req.user.role === 'principal_lecturer') && req.user.stream_id) {
    if (queryParams.length > 0) {
      query += ' AND c.stream_id = $2';
      queryParams.push(req.user.stream_id);
    } else {
      query += ' WHERE c.stream_id = $1';
      queryParams.push(req.user.stream_id);
    }
  }
  
  query += ' GROUP BY c.class_id, s.stream_name, s.stream_code ORDER BY s.stream_code, c.class_name';
  
  const result = await db.query(query, queryParams);
  res.json({ classes: result.rows });
}));

// Get single class by ID
router.get('/:id', auth, catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = await db.query(
    `SELECT c.*, s.stream_name, s.stream_code
     FROM classes c
     JOIN streams s ON c.stream_id = s.stream_id
     WHERE c.class_id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }
  
  // Get courses for this class
  const coursesResult = await db.query(
    `SELECT co.*, u.full_name as lecturer_name
     FROM class_courses cc
     JOIN courses co ON cc.course_id = co.course_id
     LEFT JOIN users u ON co.lecturer_id = u.user_id
     WHERE cc.class_id = $1
     ORDER BY co.course_code`,
    [id]
  );
  
  const classData = {
    ...result.rows[0],
    courses: coursesResult.rows,
  };
  
  res.json({ class: classData });
}));

// Create new class (Program Leader only)
router.post('/', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { class_name, stream_id, total_students } = req.body;
  
  if (!class_name || !stream_id) {
    throw new AppError('Class name and stream ID are required', 400);
  }
  
  const result = await db.query(
    `INSERT INTO classes (class_name, stream_id, total_students)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [class_name, stream_id, total_students || 0]
  );
  
  res.status(201).json({
    message: 'Class created successfully',
    class: result.rows[0],
  });
}));

// Update class (Program Leader only)
router.patch('/:id', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { class_name, stream_id, total_students } = req.body;
  
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (class_name) {
    updates.push(`class_name = $${paramCount}`);
    values.push(class_name);
    paramCount++;
  }
  
  if (stream_id) {
    updates.push(`stream_id = $${paramCount}`);
    values.push(stream_id);
    paramCount++;
  }
  
  if (total_students !== undefined) {
    updates.push(`total_students = $${paramCount}`);
    values.push(total_students);
    paramCount++;
  }
  
  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }
  
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const result = await db.query(
    `UPDATE classes SET ${updates.join(', ')} WHERE class_id = $${paramCount} RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }
  
  res.json({
    message: 'Class updated successfully',
    class: result.rows[0],
  });
}));

// Delete class (Program Leader only)
router.delete('/:id', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = await db.query('DELETE FROM classes WHERE class_id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }
  
  res.json({ message: 'Class deleted successfully' });
}));

// Assign course to class (Program Leader only)
router.post('/:id/courses', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { course_id } = req.body;
  
  if (!course_id) {
    throw new AppError('Course ID is required', 400);
  }
  
  // Check if class exists
  const classExists = await db.query('SELECT * FROM classes WHERE class_id = $1', [id]);
  if (classExists.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }
  
  // Check if course exists
  const courseExists = await db.query('SELECT * FROM courses WHERE course_id = $1', [course_id]);
  if (courseExists.rows.length === 0) {
    throw new AppError('Course not found', 404);
  }
  
  // Check if already assigned
  const alreadyAssigned = await db.query(
    'SELECT * FROM class_courses WHERE class_id = $1 AND course_id = $2',
    [id, course_id]
  );
  
  if (alreadyAssigned.rows.length > 0) {
    throw new AppError('Course already assigned to this class', 400);
  }
  
  await db.query(
    'INSERT INTO class_courses (class_id, course_id) VALUES ($1, $2)',
    [id, course_id]
  );
  
  res.status(201).json({ message: 'Course assigned to class successfully' });
}));

// Remove course from class (Program Leader only)
router.delete('/:id/courses/:course_id', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const { id, course_id } = req.params;
  
  const result = await db.query(
    'DELETE FROM class_courses WHERE class_id = $1 AND course_id = $2 RETURNING *',
    [id, course_id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Course assignment not found', 404);
  }
  
  res.json({ message: 'Course removed from class successfully' });
}));

module.exports = router;