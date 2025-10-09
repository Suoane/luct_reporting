const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, authorize } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// Student Dashboard
router.get('/student', auth, authorize('student'), catchAsync(async (req, res) => {
  const studentId = req.user.user_id;
  
  // Get student's stream info
  const studentInfo = await db.query(
    `SELECT u.*, s.stream_name, s.stream_code 
     FROM users u 
     LEFT JOIN streams s ON u.stream_id = s.stream_id 
     WHERE u.user_id = $1`,
    [studentId]
  );
  
  // Get student's classes
  const classes = await db.query(
    `SELECT c.* FROM classes c 
     WHERE c.stream_id = $1 
     ORDER BY c.class_name`,
    [studentInfo.rows[0].stream_id]
  );
  
  // Get courses in student's stream
  const courses = await db.query(
    `SELECT c.*, u.full_name as lecturer_name 
     FROM courses c 
     LEFT JOIN users u ON c.lecturer_id = u.user_id 
     WHERE c.stream_id = $1 
     ORDER BY c.course_code`,
    [studentInfo.rows[0].stream_id]
  );
  
  // Get recent reports (for monitoring)
  const recentReports = await db.query(
    `SELECT r.*, c.course_name, c.course_code, u.full_name as lecturer_name,
            cl.class_name, r.actual_students_present, r.total_registered_students
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     JOIN users u ON r.lecturer_id = u.user_id
     JOIN classes cl ON r.class_id = cl.class_id
     WHERE c.stream_id = $1
     ORDER BY r.date_of_lecture DESC
     LIMIT 10`,
    [studentInfo.rows[0].stream_id]
  );
  
  res.json({
    student: studentInfo.rows[0],
    classes: classes.rows,
    courses: courses.rows,
    recentReports: recentReports.rows,
    stats: {
      totalCourses: courses.rows.length,
      totalClasses: classes.rows.length,
      recentReportsCount: recentReports.rows.length,
    },
  });
}));

// Lecturer Dashboard
router.get('/lecturer', auth, authorize('lecturer'), catchAsync(async (req, res) => {
  const lecturerId = req.user.user_id;
  
  // Get lecturer's courses
  const courses = await db.query(
    `SELECT c.*, s.stream_name, s.stream_code 
     FROM courses c 
     JOIN streams s ON c.stream_id = s.stream_id 
     WHERE c.lecturer_id = $1 
     ORDER BY c.course_code`,
    [lecturerId]
  );
  
  // Get classes for lecturer's courses
  const classes = await db.query(
    `SELECT DISTINCT cl.*, s.stream_name 
     FROM classes cl
     JOIN class_courses cc ON cl.class_id = cc.class_id
     JOIN courses c ON cc.course_id = c.course_id
     JOIN streams s ON cl.stream_id = s.stream_id
     WHERE c.lecturer_id = $1
     ORDER BY cl.class_name`,
    [lecturerId]
  );
  
  // Get lecturer's reports count by status
  const reportStats = await db.query(
    `SELECT 
       COUNT(*) as total_reports,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
       COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_reports,
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reports
     FROM reports 
     WHERE lecturer_id = $1`,
    [lecturerId]
  );
  
  // Get recent reports
  const recentReports = await db.query(
    `SELECT r.*, c.course_name, c.course_code, cl.class_name,
            (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id) as feedback_count
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     JOIN classes cl ON r.class_id = cl.class_id
     WHERE r.lecturer_id = $1
     ORDER BY r.date_of_lecture DESC
     LIMIT 10`,
    [lecturerId]
  );
  
  // Get attendance statistics
  const attendanceStats = await db.query(
    `SELECT 
       AVG(actual_students_present::float / NULLIF(total_registered_students, 0) * 100) as avg_attendance_rate,
       MIN(actual_students_present::float / NULLIF(total_registered_students, 0) * 100) as min_attendance_rate,
       MAX(actual_students_present::float / NULLIF(total_registered_students, 0) * 100) as max_attendance_rate
     FROM reports 
     WHERE lecturer_id = $1`,
    [lecturerId]
  );
  
  res.json({
    courses: courses.rows,
    classes: classes.rows,
    recentReports: recentReports.rows,
    stats: {
      totalCourses: courses.rows.length,
      totalClasses: classes.rows.length,
      ...reportStats.rows[0],
      avgAttendanceRate: parseFloat(attendanceStats.rows[0].avg_attendance_rate || 0).toFixed(2),
      minAttendanceRate: parseFloat(attendanceStats.rows[0].min_attendance_rate || 0).toFixed(2),
      maxAttendanceRate: parseFloat(attendanceStats.rows[0].max_attendance_rate || 0).toFixed(2),
    },
  });
}));

// Principal Lecturer Dashboard
router.get('/principal-lecturer', auth, authorize('principal_lecturer'), catchAsync(async (req, res) => {
  const prlId = req.user.user_id;
  const streamId = req.user.stream_id;
  
  if (!streamId) {
    throw new AppError('Principal Lecturer must be assigned to a stream', 400);
  }
  
  // Get stream info
  const streamInfo = await db.query(
    'SELECT * FROM streams WHERE stream_id = $1',
    [streamId]
  );
  
  // Get all courses in the stream
  const courses = await db.query(
    `SELECT c.*, u.full_name as lecturer_name, u.email as lecturer_email
     FROM courses c
     LEFT JOIN users u ON c.lecturer_id = u.user_id
     WHERE c.stream_id = $1
     ORDER BY c.course_code`,
    [streamId]
  );
  
  // Get all lecturers in the stream
  const lecturers = await db.query(
    `SELECT user_id, full_name, email 
     FROM users 
     WHERE role = 'lecturer' AND stream_id = $1
     ORDER BY full_name`,
    [streamId]
  );
  
  // Get classes in the stream
  const classes = await db.query(
    `SELECT * FROM classes 
     WHERE stream_id = $1 
     ORDER BY class_name`,
    [streamId]
  );
  
  // Get reports pending review in this stream
  const pendingReports = await db.query(
    `SELECT r.*, c.course_name, c.course_code, cl.class_name, u.full_name as lecturer_name,
            (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id AND prl_id = $1) as has_feedback
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     JOIN classes cl ON r.class_id = cl.class_id
     JOIN users u ON r.lecturer_id = u.user_id
     WHERE c.stream_id = $2 AND r.status = 'pending'
     ORDER BY r.date_of_lecture DESC
     LIMIT 20`,
    [prlId, streamId]
  );
  
  // Get feedback given by this PRL
  const myFeedbackCount = await db.query(
    `SELECT COUNT(*) as feedback_count 
     FROM report_feedback 
     WHERE prl_id = $1`,
    [prlId]
  );
  
  // Get stream statistics
  const streamStats = await db.query(
    `SELECT 
       COUNT(DISTINCT r.report_id) as total_reports,
       COUNT(DISTINCT CASE WHEN r.status = 'pending' THEN r.report_id END) as pending_reports,
       COUNT(DISTINCT CASE WHEN r.status = 'reviewed' THEN r.report_id END) as reviewed_reports,
       AVG(r.actual_students_present::float / NULLIF(r.total_registered_students, 0) * 100) as avg_attendance
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     WHERE c.stream_id = $1`,
    [streamId]
  );
  
  res.json({
    stream: streamInfo.rows[0],
    courses: courses.rows,
    lecturers: lecturers.rows,
    classes: classes.rows,
    pendingReports: pendingReports.rows,
    stats: {
      totalCourses: courses.rows.length,
      totalLecturers: lecturers.rows.length,
      totalClasses: classes.rows.length,
      myFeedbackCount: parseInt(myFeedbackCount.rows[0].feedback_count),
      ...streamStats.rows[0],
      avgAttendance: parseFloat(streamStats.rows[0].avg_attendance || 0).toFixed(2),
    },
  });
}));

// Program Leader Dashboard
router.get('/program-leader', auth, authorize('program_leader'), catchAsync(async (req, res) => {
  // Get all streams
  const streams = await db.query(
    `SELECT s.*, 
            COUNT(DISTINCT c.course_id) as course_count,
            COUNT(DISTINCT cl.class_id) as class_count,
            COUNT(DISTINCT u.user_id) FILTER (WHERE u.role = 'lecturer') as lecturer_count,
            COUNT(DISTINCT u2.user_id) FILTER (WHERE u2.role = 'principal_lecturer') as prl_count
     FROM streams s
     LEFT JOIN courses c ON s.stream_id = c.stream_id
     LEFT JOIN classes cl ON s.stream_id = cl.stream_id
     LEFT JOIN users u ON s.stream_id = u.stream_id AND u.role = 'lecturer'
     LEFT JOIN users u2 ON s.stream_id = u2.stream_id AND u2.role = 'principal_lecturer'
     GROUP BY s.stream_id
     ORDER BY s.stream_code`
  );
  
  // Get all courses
  const totalCourses = await db.query('SELECT COUNT(*) as count FROM courses');
  
  // Get all classes
  const totalClasses = await db.query('SELECT COUNT(*) as count FROM classes');
  
  // Get all users by role
  const userStats = await db.query(
    `SELECT role, COUNT(*) as count 
     FROM users 
     GROUP BY role`
  );
  
  // Get recent reports from all streams
  const recentReports = await db.query(
    `SELECT r.*, c.course_name, c.course_code, cl.class_name, 
            u.full_name as lecturer_name, s.stream_code, s.stream_name,
            (SELECT COUNT(*) FROM report_feedback WHERE report_id = r.report_id) as feedback_count
     FROM reports r
     JOIN courses c ON r.course_id = c.course_id
     JOIN classes cl ON r.class_id = cl.class_id
     JOIN users u ON r.lecturer_id = u.user_id
     JOIN streams s ON c.stream_id = s.stream_id
     ORDER BY r.created_at DESC
     LIMIT 20`
  );
  
  // Get overall report statistics
  const reportStats = await db.query(
    `SELECT 
       COUNT(*) as total_reports,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
       COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_reports,
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reports,
       AVG(actual_students_present::float / NULLIF(total_registered_students, 0) * 100) as avg_attendance
     FROM reports`
  );
  
  // Get feedback statistics
  const feedbackStats = await db.query(
    `SELECT COUNT(*) as total_feedback,
            AVG(rating) as avg_rating
     FROM report_feedback`
  );
  
  // Get reports by stream
  const reportsByStream = await db.query(
    `SELECT s.stream_name, s.stream_code, COUNT(r.report_id) as report_count
     FROM streams s
     LEFT JOIN courses c ON s.stream_id = c.stream_id
     LEFT JOIN reports r ON c.course_id = r.course_id
     GROUP BY s.stream_id, s.stream_name, s.stream_code
     ORDER BY s.stream_code`
  );
  
  res.json({
    streams: streams.rows,
    recentReports: recentReports.rows,
    reportsByStream: reportsByStream.rows,
    stats: {
      totalStreams: streams.rows.length,
      totalCourses: parseInt(totalCourses.rows[0].count),
      totalClasses: parseInt(totalClasses.rows[0].count),
      usersByRole: userStats.rows.reduce((acc, row) => {
        acc[row.role] = parseInt(row.count);
        return acc;
      }, {}),
      ...reportStats.rows[0],
      avgAttendance: parseFloat(reportStats.rows[0].avg_attendance || 0).toFixed(2),
      totalFeedback: parseInt(feedbackStats.rows[0].total_feedback || 0),
      avgRating: parseFloat(feedbackStats.rows[0].avg_rating || 0).toFixed(2),
    },
  });
}));

// Get dashboard data based on user role (auto-route)
router.get('/', auth, catchAsync(async (req, res) => {
  const role = req.user.role;
  
  // Redirect to appropriate dashboard based on role
  let endpoint = '';
  switch (role) {
    case 'student':
      endpoint = '/student';
      break;
    case 'lecturer':
      endpoint = '/lecturer';
      break;
    case 'principal_lecturer':
      endpoint = '/principal-lecturer';
      break;
    case 'program_leader':
      endpoint = '/program-leader';
      break;
    default:
      throw new AppError('Invalid user role', 400);
  }
  
  // Forward the request to the appropriate dashboard
  return req.app._router.handle(
    Object.assign(req, { url: `/api/dashboard${endpoint}` }),
    res,
    () => {}
  );
}));

module.exports = router;