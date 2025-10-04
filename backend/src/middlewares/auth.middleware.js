import jwt from 'jsonwebtoken';
import db from '../db.js';
import config from '../config/config.js';

export default async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret);
        
        // Get user from database
        const userResult = await db.query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid'
            });
        }

        // Add user info to request
        req.user = userResult.rows[0];
        console.log('Authenticated user:', {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        });
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};
