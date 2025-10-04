// Get modules for the logged-in student's stream
const auth = require('../middlewares/auth.middleware');
router.get('/student/modules/stream', auth, async (req, res) => {
    try {
        // Get student's faculty_id
        const studentResult = await db.query('SELECT faculty_id FROM students WHERE username = $1', [req.user.username]);
        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, modules: [], message: 'Student not found' });
        }
        const facultyId = studentResult.rows[0].faculty_id;
        // Get modules for this stream
        const modulesResult = await db.query('SELECT id, code, name FROM modules WHERE stream_id = $1 ORDER BY name', [facultyId]);
        res.json({ success: true, modules: modulesResult.rows });
    } catch (err) {
        console.error('Error fetching modules for student stream:', err);
        res.status(500).json({ success: false, modules: [], message: 'Server error' });
    }
});
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth.middleware');

// Get lecturer's modules for a specific faculty
router.get('/lecturer/modules/:facultyId', auth, async (req, res) => {
    try {
        const { facultyId } = req.params;
        
        const query = `
            SELECT DISTINCT
                m.id,
                m.code,
                m.name
            FROM modules m
            JOIN lecturer_modules lm ON m.id = lm.module_id
            WHERE lm.lecturer_id = $1 AND m.faculty_id = $2
            ORDER BY m.code`;

        const result = await db.query(query, [req.user.id, facultyId]);

        res.json({
            success: true,
            modules: result.rows
        });
    } catch (err) {
        console.error('Error getting lecturer modules:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
// Get modules for a student's stream/program
router.get('/student/modules/:programId', auth, async (req, res) => {
    try {
        const { programId } = req.params;
        const query = `
            SELECT DISTINCT
                m.id,
                m.code,
                m.name
            FROM modules m
            JOIN program_modules pm ON m.id = pm.module_id
            WHERE pm.program_id = $1
            ORDER BY m.code`;

        const result = await db.query(query, [programId]);

        res.json({ success: true, modules: result.rows });
    } catch (err) {
        console.error('Error getting modules for student stream:', err);
        res.status(500).json({ success: false, modules: [], message: 'Server error' });
    }
});