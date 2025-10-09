const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// *** NEW: Get recent reports (for students and monitoring) ***
router.get('/recent', auth, catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  
  let query = `
    SELECT r.*, 
           c.course_name, c.course_code,
           cl.class_name,
           u.full_name as lecturer_name,
           s.stream_name, s.stream_code,
           (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id) as feedback_count
    FROM reports r
    JOIN courses c ON r.course_id = c.course_id
    JOIN classes cl ON r.class_id = cl.class_id
    JOIN users u ON r.lecturer_id = u.user_id
    JOIN streams s ON c.stream_id = s.stream_id
  `;
  
  const queryParams = [];
  let paramCount = 1;
  
  // Filter by user's stream if student, lecturer, or PRL
  if (req.user.role === 'student' || req.user.role === 'lecturer' || req.user.role === 'principal_lecturer') {
    if (req.user.stream_id) {
      query += ' WHERE c.stream_id = $1';
      queryParams.push(req.user.stream_id);
      paramCount++;
    }
  }
  
  // If lecturer, only show their reports
  if (req.user.role === 'lecturer') {
    if (queryParams.length > 0) {
      query += ' AND r.lecturer_id = $2';
    } else {
      query += ' WHERE r.lecturer_id = $1';
    }
    queryParams.push(req.user.user_id);
    paramCount++;
  }
  
  query += ` ORDER BY r.date_of_lecture DESC, r.created_at DESC LIMIT $${paramCount}`;
  queryParams.push(parseInt(limit));
  
  const result = await db.query(query, queryParams);
  res.json({ reports: result.rows });
}));

// Get all reports (filtered by role)
router.get('/', auth, catchAsync(async (req, res) => {
  const { stream_id, course_id, class_id, status, week } = req.query;
  
  let query = `
    SELECT r.*, 
           c.course_name, c.course_code,
           cl.class_name,
           u.full_name as lecturer_name,
           s.stream_name, s.stream_code,
           (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id) as feedback_count
    FROM reports r
    JOIN courses c ON r.course_id = c.course_id
    JOIN classes cl ON r.class_id = cl.class_id
    JOIN users u ON r.lecturer_id = u.user_id
    JOIN streams s ON c.stream_id = s.stream_id
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramCount = 1;
  
  // Filter by stream
  if (stream_id) {
    query += ` AND c.stream_id = $${paramCount}`;
    queryParams.push(stream_id);
    paramCount++;
  }
  
  // Filter by course
  if (course_id) {
    query += ` AND r.course_id = $${paramCount}`;
    queryParams.push(course_id);
    paramCount++;
  }
  
  // Filter by class
  if (class_id) {
    query += ` AND r.class_id = $${paramCount}`;
    queryParams.push(class_id);
    paramCount++;
  }
  
  // Filter by status
  if (status) {
    query += ` AND r.status = $${paramCount}`;
    queryParams.push(status);
    paramCount++;
  }
  
  // Filter by week
  if (week) {
    query += ` AND r.week_of_reporting = $${paramCount}`;
    queryParams.push(week);
    paramCount++;
  }
  
  // Role-based filtering
  if (req.user.role === 'lecturer') {
    query += ` AND r.lecturer_id = $${paramCount}`;
    queryParams.push(req.user.user_id);
    paramCount++;
  } else if (req.user.role === 'principal_lecturer' && req.user.stream_id) {
    query += ` AND c.stream_id = $${paramCount}`;
    queryParams.push(req.user.stream_id);
    paramCount++;
  }
  
  query += ' ORDER BY r.date_of_lecture DESC, r.created_at DESC';
  
  const result = await db.query(query, queryParams);
  res.json({ reports: result.rows });
}));

// Get single report with feedback
router.get('/:id', auth, catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = await db.query(
    `SELECT r.*, 
            c.course_name, c.course_code,
            cl.class_name, cl.total_students,
            u.full_name as lecturer_name, u.email as lecturer_email,
            s.stream_name, s.stream_code
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     JOIN classes cl ON r.class_id = cl.class_id
     JOIN users u ON r.lecturer_id = u.user_id
     JOIN streams s ON c.stream_id = s.stream_id
     WHERE r.report_id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Report not found', 404);
  }
  
  // Get feedback for this report
  const feedbackResult = await db.query(
    `SELECT rf.*, u.full_name as prl_name, u.email as prl_email
     FROM report_feedback rf
     JOIN users u ON rf.prl_id = u.user_id
     WHERE rf.report_id = $1
     ORDER BY rf.created_at DESC`,
    [id]
  );
  
  const report = {
    ...result.rows[0],
    feedback: feedbackResult.rows,
  };
  
  res.json({ report });
}));

// Create new report (Lecturer only)
router.post('/', auth, authorize('lecturer'), catchAsync(async (req, res) => {
  const {
    course_id,
    class_id,
    week_of_reporting,
    date_of_lecture,
    venue,
    scheduled_time,
    topic_taught,
    learning_outcomes,
    actual_students_present,
    total_registered_students,
    recommendations,
  } = req.body;
  
  // Validation
  if (!course_id || !class_id || !week_of_reporting || !date_of_lecture || 
      !venue || !scheduled_time || !topic_taught || !learning_outcomes ||
      actual_students_present === undefined || !total_registered_students) {
    throw new AppError('All required fields must be provided', 400);
  }
  
  // Verify the lecturer is assigned to this course
  const courseCheck = await db.query(
    'SELECT * FROM courses WHERE course_id = $1 AND lecturer_id = $2',
    [course_id, req.user.user_id]
  );
  
  if (courseCheck.rows.length === 0) {
    throw new AppError('You are not assigned to this course', 403);
  }
  
  // Verify the class exists
  const classCheck = await db.query(
    'SELECT * FROM classes WHERE class_id = $1',
    [class_id]
  );
  
  if (classCheck.rows.length === 0) {
    throw new AppError('Class not found', 404);
  }
  
  const result = await db.query(
    `INSERT INTO reports (
      lecturer_id, course_id, class_id, week_of_reporting, date_of_lecture,
      venue, scheduled_time, topic_taught, learning_outcomes,
      actual_students_present, total_registered_students, recommendations
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      req.user.user_id,
      course_id,
      class_id,
      week_of_reporting,
      date_of_lecture,
      venue,
      scheduled_time,
      topic_taught,
      learning_outcomes,
      actual_students_present,
      total_registered_students,
      recommendations || null,
    ]
  );
  
  res.status(201).json({
    message: 'Report created successfully',
    report: result.rows[0],
  });
}));

// Update report (Lecturer only - own reports)
router.patch('/:id', auth, authorize('lecturer'), catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if report belongs to lecturer
  const reportCheck = await db.query(
    'SELECT * FROM reports WHERE report_id = $1 AND lecturer_id = $2',
    [id, req.user.user_id]
  );
  
  if (reportCheck.rows.length === 0) {
    throw new AppError('Report not found or you do not have permission to update it', 403);
  }
  
  const {
    week_of_reporting,
    date_of_lecture,
    venue,
    scheduled_time,
    topic_taught,
    learning_outcomes,
    actual_students_present,
    total_registered_students,
    recommendations,
  } = req.body;
  
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (week_of_reporting !== undefined) {
    updates.push(`week_of_reporting = $${paramCount}`);
    values.push(week_of_reporting);
    paramCount++;
  }
  
  if (date_of_lecture) {
    updates.push(`date_of_lecture = $${paramCount}`);
    values.push(date_of_lecture);
    paramCount++;
  }
  
  if (venue) {
    updates.push(`venue = $${paramCount}`);
    values.push(venue);
    paramCount++;
  }
  
  if (scheduled_time) {
    updates.push(`scheduled_time = $${paramCount}`);
    values.push(scheduled_time);
    paramCount++;
  }
  
  if (topic_taught) {
    updates.push(`topic_taught = $${paramCount}`);
    values.push(topic_taught);
    paramCount++;
  }
  
  if (learning_outcomes) {
    updates.push(`learning_outcomes = $${paramCount}`);
    values.push(learning_outcomes);
    paramCount++;
  }
  
  if (actual_students_present !== undefined) {
    updates.push(`actual_students_present = $${paramCount}`);
    values.push(actual_students_present);
    paramCount++;
  }
  
  if (total_registered_students !== undefined) {
    updates.push(`total_registered_students = $${paramCount}`);
    values.push(total_registered_students);
    paramCount++;
  }
  
  if (recommendations !== undefined) {
    updates.push(`recommendations = $${paramCount}`);
    values.push(recommendations);
    paramCount++;
  }
  
  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }
  
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const result = await db.query(
    `UPDATE reports SET ${updates.join(', ')} WHERE report_id = $${paramCount} RETURNING *`,
    values
  );
  
  res.json({
    message: 'Report updated successfully',
    report: result.rows[0],
  });
}));

// Delete report (Lecturer only - own reports)
router.delete('/:id', auth, authorize('lecturer'), catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = await db.query(
    'DELETE FROM reports WHERE report_id = $1 AND lecturer_id = $2 RETURNING *',
    [id, req.user.user_id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Report not found or you do not have permission to delete it', 403);
  }
  
  res.json({ message: 'Report deleted successfully' });
}));

// Get current lecturer's reports
// Add this route to your reports.js file, BEFORE the '/my/reports' route
// This should go around line 270, after the delete route

// Get reports based on user role (unified endpoint)
router.get('/my/reports', auth, catchAsync(async (req, res) => {
  let query = `
    SELECT r.*, 
           c.course_name, c.course_code,
           cl.class_name,
           u.full_name as lecturer_name,
           s.stream_name, s.stream_code,
           (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id) as feedback_count
    FROM reports r
    JOIN courses c ON r.course_id = c.course_id
    JOIN classes cl ON r.class_id = cl.class_id
    JOIN users u ON r.lecturer_id = u.user_id
    JOIN streams s ON c.stream_id = s.stream_id
  `;
  
  const queryParams = [];
  let paramCount = 1;
  
  // Filter based on user role
  if (req.user.role === 'lecturer') {
    query += ' WHERE r.lecturer_id = $1';
    queryParams.push(req.user.user_id);
    paramCount++;
  } else if (req.user.role === 'principal_lecturer' && req.user.stream_id) {
    query += ' WHERE c.stream_id = $1';
    queryParams.push(req.user.stream_id);
    paramCount++;
  }
  // Program leader can see all reports (no WHERE clause needed)
  
  query += ' ORDER BY r.date_of_lecture DESC';
  
  const result = await db.query(query, queryParams);
  
  res.json({ reports: result.rows });
}));
// Get reports by stream (PRL only)
router.get('/stream/:stream_id', auth, authorize('principal_lecturer'), catchAsync(async (req, res) => {
  const { stream_id } = req.params;
  
  // Verify PRL has access to this stream
  if (req.user.stream_id && req.user.stream_id !== parseInt(stream_id)) {
    throw new AppError('You do not have access to this stream', 403);
  }
  
  const result = await db.query(
    `SELECT r.*, 
            c.course_name, c.course_code,
            cl.class_name,
            u.full_name as lecturer_name,
            (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id) as feedback_count
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     JOIN classes cl ON r.class_id = cl.class_id
     JOIN users u ON r.lecturer_id = u.user_id
     WHERE c.stream_id = $1
     ORDER BY r.date_of_lecture DESC`,
    [stream_id]
  );
  
  res.json({ reports: result.rows });
}));

// Add feedback to report (PRL only)
router.post('/:id/feedback', auth, authorize('principal_lecturer'), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { feedback_text, rating } = req.body;
  
  if (!feedback_text) {
    throw new AppError('Feedback text is required', 400);
  }
  
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }
  
  // Verify report exists and is in PRL's stream
  const reportCheck = await db.query(
    `SELECT r.* FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     WHERE r.report_id = $1 AND c.stream_id = $2`,
    [id, req.user.stream_id]
  );
  
  if (reportCheck.rows.length === 0) {
    throw new AppError('Report not found or you do not have access to it', 403);
  }
  
  const result = await db.query(
    `INSERT INTO report_feedback (report_id, prl_id, feedback_text, rating)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, req.user.user_id, feedback_text, rating || null]
  );
  
  // Update report status to 'reviewed'
  await db.query(
    `UPDATE reports SET status = 'reviewed', updated_at = CURRENT_TIMESTAMP 
     WHERE report_id = $1`,
    [id]
  );
  
  res.status(201).json({
    message: 'Feedback added successfully',
    feedback: result.rows[0],
  });
}));

// Update report status (PRL and Program Leader)
router.patch('/:id/status', auth, authorize('principal_lecturer', 'program_leader'), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['pending', 'reviewed', 'approved'].includes(status)) {
    throw new AppError('Invalid status. Must be: pending, reviewed, or approved', 400);
  }
  
  // If PRL, verify report is in their stream
  if (req.user.role === 'principal_lecturer') {
    const reportCheck = await db.query(
      `SELECT r.* FROM reports r
       JOIN courses c ON r.course_id = c.course_id
       WHERE r.report_id = $1 AND c.stream_id = $2`,
      [id, req.user.stream_id]
    );
    
    if (reportCheck.rows.length === 0) {
      throw new AppError('Report not found or you do not have access to it', 403);
    }
  }
  
  const result = await db.query(
    `UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE report_id = $2 
     RETURNING *`,
    [status, id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Report not found', 404);
  }
  
  res.json({
    message: 'Report status updated successfully',
    report: result.rows[0],
  });
}));

// Get all reports (Program Leader only)
router.get('/all/reports', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const result = await db.query(
    `SELECT r.*, 
            c.course_name, c.course_code,
            cl.class_name,
            u.full_name as lecturer_name,
            s.stream_name, s.stream_code,
            (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id) as feedback_count
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     JOIN classes cl ON r.class_id = cl.class_id
     JOIN users u ON r.lecturer_id = u.user_id
     JOIN streams s ON c.stream_id = s.stream_id
     ORDER BY r.created_at DESC`
  );
  
  res.json({ reports: result.rows });
}));

// Get statistics (Program Leader only)
router.get('/statistics/overview', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  const stats = await db.query(`
    SELECT 
      COUNT(*) as total_reports,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
      COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_reports,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reports,
      AVG(actual_students_present::float / NULLIF(total_registered_students, 0) * 100) as avg_attendance_rate,
      COUNT(DISTINCT lecturer_id) as active_lecturers,
      COUNT(DISTINCT course_id) as courses_taught,
      COUNT(DISTINCT class_id) as classes_covered
    FROM reports
  `);
  
  const byStream = await db.query(`
    SELECT s.stream_name, s.stream_code, 
           COUNT(r.report_id) as report_count,
           AVG(r.actual_students_present::float / NULLIF(r.total_registered_students, 0) * 100) as avg_attendance
    FROM streams s
    LEFT JOIN courses c ON s.stream_id = c.stream_id
    LEFT JOIN reports r ON c.course_id = r.course_id
    GROUP BY s.stream_id, s.stream_name, s.stream_code
    ORDER BY s.stream_code
  `);
  
  res.json({
    overall: {
      ...stats.rows[0],
      avg_attendance_rate: parseFloat(stats.rows[0].avg_attendance_rate || 0).toFixed(2),
    },
    by_stream: byStream.rows.map(row => ({
      ...row,
      avg_attendance: parseFloat(row.avg_attendance || 0).toFixed(2),
    })),
  });
}));

// Export reports to Excel (Extra credit feature)
router.get('/export/excel', auth, authorize('program_leader', 'principal_lecturer'), catchAsync(async (req, res) => {
  const ExcelJS = require('exceljs');
  
  let query = `
    SELECT r.*, 
           c.course_name, c.course_code,
           cl.class_name,
           u.full_name as lecturer_name,
           s.stream_name, s.stream_code
    FROM reports r
    JOIN courses c ON r.course_id = c.course_id
    JOIN classes cl ON r.class_id = cl.class_id
    JOIN users u ON r.lecturer_id = u.user_id
    JOIN streams s ON c.stream_id = s.stream_id
  `;
  
  const queryParams = [];
  
  // If PRL, only export their stream
  if (req.user.role === 'principal_lecturer' && req.user.stream_id) {
    query += ' WHERE c.stream_id = $1';
    queryParams.push(req.user.stream_id);
  }
  
  query += ' ORDER BY r.date_of_lecture DESC';
  
  const result = await db.query(query, queryParams);
  
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reports');
  
  // Add headers
  worksheet.columns = [
    { header: 'Report ID', key: 'report_id', width: 10 },
    { header: 'Stream', key: 'stream_name', width: 20 },
    { header: 'Course Code', key: 'course_code', width: 12 },
    { header: 'Course Name', key: 'course_name', width: 30 },
    { header: 'Class', key: 'class_name', width: 12 },
    { header: 'Lecturer', key: 'lecturer_name', width: 25 },
    { header: 'Week', key: 'week_of_reporting', width: 8 },
    { header: 'Date', key: 'date_of_lecture', width: 12 },
    { header: 'Venue', key: 'venue', width: 15 },
    { header: 'Time', key: 'scheduled_time', width: 10 },
    { header: 'Topic', key: 'topic_taught', width: 35 },
    { header: 'Present', key: 'actual_students_present', width: 10 },
    { header: 'Total', key: 'total_registered_students', width: 10 },
    { header: 'Attendance %', key: 'attendance_rate', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  
  // Add data
  result.rows.forEach(row => {
    const attendanceRate = (row.actual_students_present / row.total_registered_students * 100).toFixed(2);
    worksheet.addRow({
      ...row,
      attendance_rate: `${attendanceRate}%`,
    });
  });
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=reports.xlsx');
  
  // Write to response
  await workbook.xlsx.write(res);
  res.end();
}));

module.exports = router;