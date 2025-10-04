const db = require('../db');

// Get all classes/modules for a lecturer
const getLecturerClasses = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id,
                m.code,
                m.name,
                f.name as faculty_name,
                (
                    SELECT COUNT(DISTINCT student_id) 
                    FROM student_attendance 
                    WHERE module_code = m.code
                ) as total_students,
                (
                    SELECT COUNT(DISTINCT student_id) 
                    FROM student_attendance 
                    WHERE module_code = m.code 
                    AND attended = true
                    AND date_of_class = CURRENT_DATE
                ) as present_today
            FROM modules m
            JOIN lecturer_modules lm ON m.id = lm.module_id
            JOIN faculties f ON m.faculty_id = f.id
            WHERE lm.lecturer_id = $1
            ORDER BY m.name`;

        const result = await db.query(query, [req.user.id]);
        res.json({
            success: true,
            classes: result.rows
        });
    } catch (err) {
        console.error('Error getting lecturer classes:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get detailed class information including attendance stats
const getClassDetails = async (req, res) => {
    try {
        const { moduleId } = req.params;
        
        // Get module details
        const moduleQuery = `
            SELECT 
                m.*,
                f.name as faculty_name,
                (
                    SELECT COUNT(DISTINCT student_id) 
                    FROM student_attendance 
                    WHERE module_code = m.code
                ) as total_students
            FROM modules m
            JOIN faculties f ON m.faculty_id = f.id
            WHERE m.id = $1`;

        const moduleResult = await db.query(moduleQuery, [moduleId]);
        
        if (moduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Get attendance statistics
        const attendanceQuery = `
            SELECT 
                date_of_class,
                COUNT(CASE WHEN attended = true THEN 1 END) as present,
                COUNT(*) as total
            FROM student_attendance
            WHERE module_code = $1
            GROUP BY date_of_class
            ORDER BY date_of_class DESC
            LIMIT 10`;

        const attendanceResult = await db.query(attendanceQuery, [moduleResult.rows[0].code]);

        res.json({
            success: true,
            class: {
                ...moduleResult.rows[0],
                attendance_history: attendanceResult.rows
            }
        });
    } catch (err) {
        console.error('Error getting class details:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getLecturerClasses,
    getClassDetails
};