import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import config from '../config/config.js';

// Login controller
export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Login attempt:', { username, passwordLength: password.length });

        // Check if user exists
        const userResult = await db.query(
            `SELECT u.*, l.first_name, l.last_name 
             FROM users u 
             LEFT JOIN lecturers l ON u.id = l.user_id 
             WHERE u.username = $1`,
            [username]
        );

        console.log('User found:', userResult.rows.length > 0);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = userResult.rows[0];
        console.log('User role:', user.role);
        console.log('Stored password hash length:', user.password.length);
        console.log('Attempting password comparison...');

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create and sign JWT token
        const token = jwt.sign(
            { userId: user.id },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
        );

        // Return user info and token
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
                lecturer_info: user.role === 'lecturer' ? {
                    first_name: user.first_name,
                    last_name: user.last_name
                } : null
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
