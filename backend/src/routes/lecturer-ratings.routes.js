import express from 'express';
import auth from '../middlewares/auth.middleware.js';
import checkRole from '../middlewares/role.middleware.js';
import db from '../db.js';

const router = express.Router();

// Get lecturer's ratings
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

        // Get all ratings for the lecturer
        const query = `
            WITH rating_stats AS (
                SELECT 
                    course,
                    COUNT(*) as total_ratings,
                    ROUND(AVG(rating)::numeric, 2) as average_rating,
                    json_agg(json_build_object(
                        'rating', rating,
                        'comments', comments,
                        'submitted_at', submitted_at
                    ) ORDER BY submitted_at DESC) as recent_ratings
                FROM ratings
                WHERE lecturer_id = $1
                GROUP BY course
            )
            SELECT
                rs.*,
                f.name as faculty_name
            FROM rating_stats rs
            LEFT JOIN modules m ON m.name = rs.course
            LEFT JOIN faculties f ON m.faculty_id = f.id
            ORDER BY rs.average_rating DESC`;

        const result = await db.query(query, [lecturerId]);

        // Calculate overall stats
        const overallStats = result.rows.reduce((acc, curr) => {
            acc.total_ratings += curr.total_ratings;
            acc.total_courses += 1;
            acc.total_rating += curr.average_rating;
            return acc;
        }, { total_ratings: 0, total_courses: 0, total_rating: 0 });

        if (overallStats.total_courses > 0) {
            overallStats.average_rating = +(overallStats.total_rating / overallStats.total_courses).toFixed(2);
        }

        res.json({
            success: true,
            ratings: result.rows,
            stats: {
                total_ratings: overallStats.total_ratings,
                total_rated_courses: overallStats.total_courses,
                overall_average: overallStats.average_rating || 0
            }
        });
    } catch (err) {
        console.error('Error getting lecturer ratings:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;