import db from '../db.js';

// Get all programs that a lecturer teaches modules in
const getLecturerPrograms = async (req, res) => {
    try {
        // First get lecturer ID from user ID
        const lecturerQuery = 'SELECT id FROM lecturers WHERE user_id = $1';
        console.log('Looking for lecturer with user_id:', req.user.id);
        const lecturerResult = await db.query(lecturerQuery, [req.user.id]);
        console.log('Lecturer lookup result:', lecturerResult.rows);
        
        if (lecturerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lecturer not found'
            });
        }

        const lecturerId = lecturerResult.rows[0].id;
        console.log('Found lecturer ID:', lecturerId);

        // Get module and program information for lecturer
        const query = `
            WITH lecturer_modules AS (
                SELECT DISTINCT 
                    m.id as module_id,
                    m.code as module_code,
                    m.name as module_name,
                    m.faculty_id
                FROM lecturer_modules lm
                JOIN modules m ON lm.module_id = m.id
                WHERE lm.lecturer_id = $1
            ),
            faculty_programs AS (
                SELECT DISTINCT
                    p.id,
                    p.name as program_name,
                    p.type as program_type,
                    f.id as faculty_id,
                    f.name as faculty_name,
                    f.code as faculty_code
                FROM lecturer_modules lm
                JOIN modules m ON lm.module_id = m.id
                JOIN faculties f ON m.faculty_id = f.id
                JOIN programs p ON f.id = p.faculty_id
                WHERE lm.lecturer_id = $1
            )
            SELECT 
                fp.id,
                fp.program_name,
                fp.program_type,
                fp.faculty_name,
                fp.faculty_code,
                (
                    SELECT COUNT(DISTINCT s.id)
                    FROM students s
                    WHERE s.program_id = fp.id
                ) as enrolled_students,
                array_agg(DISTINCT lm.module_code) as module_codes,
                array_agg(DISTINCT lm.module_name) as module_names
            FROM faculty_programs fp
            JOIN lecturer_modules lm ON fp.faculty_id = lm.faculty_id
            GROUP BY fp.id, fp.program_name, fp.program_type, fp.faculty_name, fp.faculty_code
            ORDER BY fp.faculty_name, fp.program_name`;
        
        console.log('Executing query with lecturer_id:', lecturerId);

        const result = await db.query(query, [lecturerId]);
        
        console.log('Found programs:', result.rows);
        
        res.json({
            success: true,
            programs: result.rows
        });
    } catch (err) {
        console.error('Error getting lecturer programs:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get program details including all modules
const getProgramDetails = async (req, res) => {
    try {
        const { programId } = req.params;

        // Get program details with modules
        // Get lecturer ID from user ID
        const lecturerQuery = 'SELECT id FROM lecturers WHERE user_id = $1';
        const lecturerResult = await db.query(lecturerQuery, [req.user.id]);
        const lecturerId = lecturerResult.rows[0]?.id;

        const query = `
            WITH program_info AS (
                SELECT 
                    p.id,
                    p.name as program_name,
                    p.type as program_type,
                    f.name as faculty_name,
                    f.code as faculty_code
                FROM programs p
                JOIN faculties f ON p.faculty_id = f.id
                WHERE p.id = $1
            ),
            module_info AS (
                SELECT 
                    m.*,
                    CASE WHEN lm.module_id IS NOT NULL THEN true ELSE false END as is_teaching
                FROM program_modules pm
                JOIN modules m ON pm.module_id = m.id
                LEFT JOIN lecturer_modules lm ON m.id = lm.module_id
                WHERE pm.program_id = $1
            )
            SELECT 
                pi.*,
                COALESCE(json_agg(
                    json_build_object(
                        'id', mi.id,
                        'code', mi.code,
                        'name', mi.name,
                        'description', mi.description,
                        'credits', mi.credits,
                        'year_level', mi.year_level,
                        'semester', mi.semester,
                        'is_teaching', mi.is_teaching
                    ) ORDER BY mi.year_level, mi.semester, mi.code
                ) FILTER (WHERE mi.id IS NOT NULL), '[]') as modules
            FROM program_info pi
            LEFT JOIN module_info mi ON true
            GROUP BY pi.id, pi.program_name, pi.program_type, pi.faculty_name, pi.faculty_code`;

        console.log('Fetching program details for ID:', programId);
        const result = await db.query(query, [programId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Program not found'
            });
        }

        res.json({
            success: true,
            program: result.rows[0]
        });
    } catch (err) {
        console.error('Error getting program details:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get all programs with basic details
const getAllPrograms = async (req, res) => {
    try {
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
            ORDER BY p.id, p.name`;

        const result = await db.query(query);

        res.json({
            success: true,
            programs: result.rows
        });
    } catch (err) {
        console.error('Error getting programs:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export {
    getProgramDetails,
    getAllPrograms,
    getLecturerPrograms
};