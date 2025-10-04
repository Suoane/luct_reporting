const db = require('../db');

const getLecturerAttendance = async (req, res) => {
    try {
        const { moduleCode, startDate, endDate } = req.query;

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

        // Build query conditions
        const conditions = [`l.id = $1`];
        const params = [lecturerId];
        let paramCount = 1;

        if (moduleCode) {
            paramCount++;
            conditions.push(`m.code = $${paramCount}`);
            params.push(moduleCode);
        }
        
        if (startDate) {
            paramCount++;
            conditions.push(`a.date_of_class >= $${paramCount}`);
            params.push(startDate);
        }
        
        if (endDate) {
            paramCount++;
            conditions.push(`a.date_of_class <= $${paramCount}`);
            params.push(endDate);
        }

        // Query for attendance details
        const attendanceQuery = `
            SELECT 
                a.date_of_class,
                m.code as module_code,
                m.name as module_name,
                s.student_number,
                s.name as student_name,
                s.surname as student_surname,
                p.name as program_name,
                u.username,
                l.name as lecturer_name,
                l.surname as lecturer_surname,
                a.attended
            FROM attendance a
            JOIN modules m ON a.module_id = m.id
            JOIN lecturer_modules lm ON m.id = lm.module_id
            JOIN lecturers l ON lm.lecturer_id = l.id
            JOIN users u ON l.user_id = u.id
            JOIN students s ON a.student_id = s.id
            JOIN programs p ON s.program_id = p.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY a.date_of_class DESC, m.code, s.student_number`;

        // Query for summary
        const summaryQuery = `
            WITH attendance_stats AS (
                SELECT 
                    m.id as module_id,
                    m.code as module_code,
                    m.name as module_name,
                    COUNT(DISTINCT a.date_of_class) as total_classes,
                    COUNT(DISTINCT s.id) as total_students,
                    SUM(CASE WHEN a.attended THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as attendance_rate
                FROM attendance a
                JOIN modules m ON a.module_id = m.id
                JOIN lecturer_modules lm ON m.id = lm.module_id
                JOIN lecturers l ON lm.lecturer_id = l.id
                JOIN students s ON a.student_id = s.id
                JOIN users u ON l.user_id = u.id
                WHERE ${conditions.join(' AND ')}
                GROUP BY m.id, m.code, m.name
            )
            SELECT 
                module_code,
                module_name,
                total_classes,
                total_students,
                ROUND(attendance_rate::numeric, 2) as attendance_rate
            FROM attendance_stats
            ORDER BY module_code`;

        const [attendanceResult, summaryResult] = await Promise.all([
            db.query(attendanceQuery, params),
            db.query(summaryQuery, params)
        ]);

        res.json({
            success: true,
            attendance: attendanceResult.rows,
            summary: summaryResult.rows
        });
    } catch (err) {
        console.error('Error getting lecturer attendance:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance data'
        });
    }
};

module.exports = {
    getLecturerAttendance
};