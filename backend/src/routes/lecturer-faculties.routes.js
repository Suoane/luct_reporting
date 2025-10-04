import express from 'express';
import auth from '../middlewares/auth.middleware.js';
import checkRole from '../middlewares/role.middleware.js';
import db from '../db.js';

const router = express.Router();

// Get lecturer's faculties
router.get('/', auth, checkRole(['lecturer']), async (req, res) => {
    try {
        // First get lecturer ID from user ID
        const lecturerQuery = 'SELECT id FROM lecturers WHERE user_id = $1';
        const lecturerResult = await db.query(lecturerQuery, [req.user.id]);
        
        if (lecturerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lecturer not found'
            });
        }

        const lecturerId = lecturerResult.rows[0].id;

        // Get faculties with their modules
        const query = `
            WITH lecturer_faculties AS (
                SELECT DISTINCT f.id, f.name, f.code
                FROM lecturer_faculties lf
                JOIN faculties f ON lf.faculty_id = f.id
                WHERE lf.lecturer_id = $1
            ),
            lecturer_modules AS (
                SELECT 
                    m.id,
                    m.code,
                    m.name,
                    m.faculty_id
                FROM lecturer_modules lm
                JOIN modules m ON lm.module_id = m.id
                WHERE lm.lecturer_id = $1
            )
            SELECT 
                lf.id,
                lf.name,
                lf.code,
                COALESCE(json_agg(
                    json_build_object(
                        'id', lm.id,
                        'code', lm.code,
                        'name', lm.name
                    ) ORDER BY lm.code
                ) FILTER (WHERE lm.id IS NOT NULL), '[]') as modules
            FROM lecturer_faculties lf
            LEFT JOIN lecturer_modules lm ON lf.id = lm.faculty_id
            GROUP BY lf.id, lf.name, lf.code
            ORDER BY lf.name`;

        const result = await db.query(query, [lecturerId]);

        res.json({
            success: true,
            faculties: result.rows
        });
    } catch (err) {
        console.error('Error getting lecturer faculties:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;