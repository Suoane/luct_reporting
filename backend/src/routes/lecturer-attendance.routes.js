import express from 'express';
import db from '../db.js';
import auth from '../middlewares/auth.middleware.js';
import checkRole from '../middlewares/role.middleware.js';

const router = express.Router();

// Get lecturer's attendance data
router.get('/', auth, checkRole(['lecturer']), async (req, res) => {
    const { moduleCode, startDate, endDate } = req.query;
    
    try {
        // Get lecturer's modules
        const lecturerResult = await db.query(`
            SELECT l.id, array_agg(DISTINCT m.code) as module_codes
            FROM lecturers l
            JOIN lecturer_modules lm ON l.id = lm.lecturer_id
            JOIN modules m ON m.id = lm.module_id
            WHERE l.user_id = $1
            GROUP BY l.id
        `, [req.user.id]);

        if (lecturerResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Lecturer not found" 
            });
        }

        const lecturer = lecturerResult.rows[0];
        const moduleCodes = moduleCode ? [moduleCode] : lecturer.module_codes;

        // Get attendance data with student details
        const result = await db.query(`
            SELECT 
                sa.date_of_class,
                sa.module_code,
                m.name as module_name,
                s.name as student_name,
                s.surname as student_surname,
                s.student_number,
                sa.attended,
                p.name as program_name,
                f.name as faculty_name
            FROM student_attendance sa
            JOIN students s ON sa.student_id = s.id
            JOIN modules m ON sa.module_code = m.code
            JOIN programs p ON s.program_id = p.id
            JOIN faculties f ON p.faculty_id = f.id
            WHERE sa.module_code = ANY($1)
                AND ($2::date IS NULL OR sa.date_of_class >= $2)
                AND ($3::date IS NULL OR sa.date_of_class <= $3)
            ORDER BY sa.date_of_class DESC, sa.module_code, s.name
        `, [moduleCodes, startDate, endDate]);

        // Get attendance summary
        const summaryResult = await db.query(`
            SELECT 
                sa.module_code,
                m.name as module_name,
                COUNT(DISTINCT sa.student_id) as total_students,
                COUNT(DISTINCT sa.date_of_class) as total_classes,
                ROUND(AVG(CASE WHEN sa.attended THEN 1 ELSE 0 END) * 100, 2) as attendance_rate
            FROM student_attendance sa
            JOIN modules m ON sa.module_code = m.code
            WHERE sa.module_code = ANY($1)
                AND ($2::date IS NULL OR sa.date_of_class >= $2)
                AND ($3::date IS NULL OR sa.date_of_class <= $3)
            GROUP BY sa.module_code, m.name
        `, [moduleCodes, startDate, endDate]);

        res.json({
            success: true,
            attendance: result.rows,
            summary: summaryResult.rows
        });
    } catch (err) {
        console.error("Error fetching attendance:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching attendance data" 
        });
    }
});

export default router;