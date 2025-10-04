import db from '../db.js';

const checkRole = (roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        try {
            // Get user's role from database
            const result = await db.query(
                'SELECT role FROM users WHERE id = $1',
                [req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userRole = result.rows[0].role;

            // Check if user's role is in the allowed roles array
            if (!roles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized'
                });
            }

            // Add role to req object for convenience
            req.userRole = userRole;
            next();
        } catch (err) {
            console.error('Role middleware error:', err);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    };
};

export default checkRole;
