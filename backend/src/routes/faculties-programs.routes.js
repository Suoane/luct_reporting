const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all faculties with their programs
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                f.id as faculty_id,
                f.name as faculty_name,
                f.code as faculty_code,
                CASE 
                    WHEN COUNT(p.id) = 0 THEN '[]'::json[]
                    ELSE array_agg(DISTINCT json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'type', p.type,
                        'faculty_id', p.faculty_id
                    ))
                END as programs
            FROM faculties f
            LEFT JOIN programs p ON f.id = p.faculty_id
            GROUP BY f.id, f.name, f.code
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error getting faculties and programs:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;