const express = require('express');
const router = express.Router();
const { getProgramDetails, getAllPrograms, getLecturerPrograms } = require('../controllers/programs.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');
const db = require('../db');

// Get all programs with basic info
router.get('/', getAllPrograms);

// Get programs by faculty
router.get('/by-faculty/:facultyId', async (req, res) => {
    try {
        const { facultyId } = req.params;
        console.log(`GET /api/programs/by-faculty/${facultyId} - Fetching programs for faculty`);
        const query = `
            SELECT DISTINCT ON (p.id)
                p.id,
                p.name as program_name,
                p.type as program_type,
                f.name as faculty_name,
                f.code as faculty_code,
                (
                    SELECT COUNT(*)
                    FROM program_modules
                    WHERE program_id = p.id
                ) as module_count
            FROM programs p
            JOIN faculties f ON p.faculty_id = f.id
            WHERE p.faculty_id = $1
            ORDER BY p.id, p.name`;

        const result = await db.query(query, [facultyId]);
        res.json({
            success: true,
            programs: result.rows
        });
    } catch (err) {
        console.error('Error getting programs by faculty:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all programs for a lecturer (includes modules they teach)
router.get('/lecturer/programs', auth, checkRole(['lecturer']), getLecturerPrograms);

// Get program details including modules
router.get('/:programId', auth, getProgramDetails);

module.exports = router;