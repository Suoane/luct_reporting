// Get complaints/reports submitted by the logged-in student
router.get('/student/complaints', auth, async (req, res) => {
	try {
		const result = await req.db.query(
			`SELECT sc.*, u.name as lecturer_name
			 FROM student_complaints sc
			 LEFT JOIN users u ON sc.lecturer_id = u.id
			 WHERE sc.student_id = $1
			 ORDER BY sc.submitted_at DESC`,
			[req.user.id]
		);
		res.json({ success: true, complaints: result.rows });
	} catch (err) {
		console.error('Error fetching student complaints:', err);
		res.status(500).json({ success: false, complaints: [], message: 'Server error' });
	}
});
const express = require('express');
const router = express.Router();
const { getLecturerReports, createReport } = require('../controllers/reports.controller');
const auth = require('../middlewares/auth.middleware');

// Get all reports for the current lecturer
router.get('/lecturer/reports', auth, getLecturerReports);

// Create a new report
router.post('/', auth, createReport);

module.exports = router;
// Student complaint/report to Principal Lecturer
router.post('/student/complaint', auth, async (req, res) => {
	try {
		const { lecturer_id, subject, message } = req.body;
		if (!lecturer_id || !message) {
			return res.status(400).json({ success: false, message: 'Lecturer and message are required' });
		}
		// Assume principal lecturer has role 'prl' in users table
		const prlResult = await req.db.query("SELECT id FROM users WHERE role = 'prl' LIMIT 1");
		if (prlResult.rows.length === 0) {
			return res.status(400).json({ success: false, message: 'Principal Lecturer not found' });
		}
		const prl_id = prlResult.rows[0].id;
		await req.db.query(
			`INSERT INTO student_complaints (student_id, lecturer_id, prl_id, subject, message, status, submitted_at)
			 VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
			[req.user.id, lecturer_id, prl_id, subject, message]
		);
		res.json({ success: true, message: 'Complaint submitted' });
	} catch (err) {
		console.error('Error submitting complaint:', err);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});
