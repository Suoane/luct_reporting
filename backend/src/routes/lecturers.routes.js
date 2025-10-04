const auth = require('../middlewares/auth.middleware');
// Get lecturers for the logged-in student's stream
router.get('/student/stream', auth, async (req, res) => {
  try {
    // Get student's faculty_id
    const studentResult = await db.query('SELECT faculty_id FROM students WHERE username = $1', [req.user.username]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, lecturers: [], message: 'Student not found' });
    }
    const facultyId = studentResult.rows[0].faculty_id;
    // Get lecturers for this stream
    const lecturersResult = await db.query('SELECT id, name, surname, username FROM lecturers WHERE stream_id = $1 ORDER BY name', [facultyId]);
    res.json({ success: true, lecturers: lecturersResult.rows });
  } catch (err) {
    console.error('Error fetching lecturers for student stream:', err);
    res.status(500).json({ success: false, lecturers: [], message: 'Server error' });
  }
});
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all lecturers (open to all roles)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, surname, username FROM lecturers ORDER BY name');
    res.json({ success: true, lecturers: result.rows });
  } catch (err) {
    console.error('Error fetching lecturers:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
