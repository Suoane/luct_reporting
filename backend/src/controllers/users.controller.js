const db = require('../db');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.id,
                u.username,
                u.role,
                s.name,
                s.surname,
                s.email,
                s.student_number,
                s.faculty_id,
                s.program_id,
                CASE 
                    WHEN u.role = 'student' THEN f.name 
                    ELSE NULL 
                END as faculty_name,
                CASE 
                    WHEN u.role = 'student' THEN p.name 
                    ELSE NULL 
                END as program_name
            FROM users u
            LEFT JOIN students s ON s.username = u.username
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN programs p ON s.program_id = p.id
            ORDER BY u.role, COALESCE(s.name, u.username);
        `);

        res.json({ users: result.rows });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error retrieving users',
            error: err.message 
        });
    }
};

exports.createUser = async (req, res) => {
    const { username, password, name, surname, email, role, faculty_id, program_id, student_number } = req.body;

    try {
        // Validate required fields
        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Username, password and role are required'
            });
        }

        // Additional validation for students
        if (role === 'student' && (!student_number || !name || !surname || !email || !faculty_id || !program_id)) {
            return res.status(400).json({
                success: false,
                message: 'For students, all fields (name, surname, email, student number, faculty and program) are required'
            });
        }

        // Additional validation for students
        if (role === 'student') {
            if (!name || !surname || !email || !student_number || !faculty_id || !program_id) {
                return res.status(400).json({
                    success: false,
                    message: 'For students, name, surname, email, student number, faculty and program are required'
                });
            }
        }

        // Check if username already exists
        const existingUser = await db.query('SELECT username FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Start a transaction
        await db.query('BEGIN');

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // First create the user
        const userResult = await db.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *',
            [username, hashedPassword, role]
        );

        let studentResult = null;
        // If it's a student, create student record
        if (role === 'student') {
            studentResult = await db.query(
                'INSERT INTO students (username, name, surname, email, student_number, faculty_id, program_id, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [username, name, surname, email, student_number, faculty_id, program_id, hashedPassword]
            );
        }

        // If it's a student, also create a student record
        if (role === 'student') {
            await db.query(
                'INSERT INTO students (username, password, name, surname, email, student_number, faculty_id, program_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [username, hashedPassword, name, surname, email, student_number, faculty_id, program_id]
            );
        }

        await db.query('COMMIT');
        
        const user = {
            ...userResult.rows[0],
            ...(studentResult ? {
                name: studentResult.rows[0].name,
                surname: studentResult.rows[0].surname,
                email: studentResult.rows[0].email,
                student_number: studentResult.rows[0].student_number,
                faculty_id: studentResult.rows[0].faculty_id,
                program_id: studentResult.rows[0].program_id
            } : {})
        };
        delete user.password; // Don't send password back
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error creating user:', err);
        res.status(500).json({ 
            success: false,
            message: 'Error creating user',
            error: err.message
        });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, name, surname, email, role, faculty_id, program_id, student_number } = req.body;

    try {
        // Start a transaction
        await db.query('BEGIN');

        // Update the user record
        const updateFields = ['username', 'role'];
        const updateValues = [username, role];

        // Only hash and update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password');
            updateValues.push(hashedPassword);
        }

        const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        updateValues.push(id);

        const userResult = await db.query(
            `UPDATE users SET ${setClause} WHERE id = $${updateValues.length} RETURNING *`,
            updateValues
        );

        // If it's a student, update the student record
        if (role === 'student') {
            // Check if student record exists
            const studentExists = await db.query(
                'SELECT username FROM students WHERE username = $1',
                [username]
            );

            if (studentExists.rows.length === 0) {
                // Create new student record if it doesn't exist
                await db.query(
                    'INSERT INTO students (username, password, name, surname, email, student_number, faculty_id, program_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [username, password ? await bcrypt.hash(password, 10) : null, name, surname, email, student_number, faculty_id, program_id]
                );
            } else {
                // Update existing student record
                const studentUpdateFields = ['name', 'surname', 'email', 'faculty_id', 'program_id', 'student_number'];
                const studentUpdateValues = [name, surname, email, faculty_id, program_id, student_number];
                
                if (password) {
                    studentUpdateFields.push('password');
                    studentUpdateValues.push(await bcrypt.hash(password, 10));
                }

                const studentSetClause = studentUpdateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
                await db.query(
                    `UPDATE students SET ${studentSetClause} WHERE username = $1`,
                    [username, ...studentUpdateValues]
                );
            }
        }

        await db.query('COMMIT');
        
        const user = userResult.rows[0];
        delete user.password; // Don't send password back
        
        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error updating user:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: err.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('BEGIN');

        // Get the user's username first
        const userResult = await db.query('SELECT username, role FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { username, role } = userResult.rows[0];

        // If it's a student, delete from students table first
        if (role === 'student') {
            await db.query('DELETE FROM students WHERE username = $1', [username]);
        }

        // Delete from users table
        await db.query('DELETE FROM users WHERE id = $1', [id]);

        await db.query('COMMIT');
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error deleting user:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: err.message
        });
    }
};
