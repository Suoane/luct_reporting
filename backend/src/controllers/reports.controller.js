const db = require('../db');

const getReports = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id,
                r.date_of_lecture,
                r.topic,
                m.code as course_code,
                m.name as course_name,
                r.actual_students,
                r.total_students,
                r.status,
                r.submitted_at
            FROM reports r
            JOIN modules m ON r.module_id = m.id
            WHERE r.lecturer_id = $1
            ORDER BY r.date_of_lecture DESC`;

        const result = await db.query(query, [req.user.id]);

        res.json({
            success: true,
            reports: result.rows
        });
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
};

const getLecturerReports = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id,
                r.date_of_lecture,
                r.topic,
                m.code as course_code,
                m.name as course_name,
                r.actual_students,
                r.total_students,
                r.status,
                r.submitted_at
            FROM reports r
            JOIN modules m ON r.module_id = m.id
            JOIN lecturers l ON r.lecturer_id = l.id
            JOIN users u ON l.user_id = u.id
            WHERE u.id = $1
            ORDER BY r.date_of_lecture DESC`;

        const result = await db.query(query, [req.user.id]);

        res.json({
            success: true,
            reports: result.rows
        });
    } catch (err) {
        console.error('Error fetching lecturer reports:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
};

const createReport = async (req, res) => {
    try {
        const { moduleId, dateOfLecture, topic, actualStudents, totalStudents } = req.body;

        // Get lecturer ID from user ID
        const lecturerQuery = 'SELECT id FROM lecturers WHERE user_id = $1';
        const lecturerResult = await db.query(lecturerQuery, [req.user.id]);
        
        if (lecturerResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User is not a lecturer'
            });
        }

        const lecturerId = lecturerResult.rows[0].id;

        const query = `
            INSERT INTO reports (
                lecturer_id,
                module_id,
                date_of_lecture,
                topic,
                actual_students,
                total_students,
                status,
                submitted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
            RETURNING *`;

        const result = await db.query(query, [
            lecturerId,
            moduleId,
            dateOfLecture,
            topic,
            actualStudents,
            totalStudents
        ]);

        res.json({
            success: true,
            report: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating report:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create report'
        });
    }
};

module.exports = {
    getReports,
    getLecturerReports,
    createReport
};
