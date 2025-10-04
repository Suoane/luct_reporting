import express from 'express';
import db from '../db.js';
import auth from '../middlewares/auth.middleware.js';
import checkRole from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', auth, checkRole(['lecturer']), async (req, res) => {
    try {
        // Get lecturer's full name
        const lecturerResult = await db.query(
            'SELECT id, CONCAT(name, \' \', surname) as full_name FROM lecturers WHERE user_id = $1',
            [req.user.id]
        );

        if (lecturerResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Lecturer not found' 
            });
        }

        const result = await db.query(
            'SELECT * FROM reports WHERE lecturer_name = $1 ORDER BY submitted_at DESC',
            [lecturerResult.rows[0].full_name]
        );

        res.json({ 
            success: true, 
            reports: result.rows 
        });
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching reports' 
        });
    }
});

export default router;