const jwt = require('jsonwebtoken');
const db = require('../../database/connection');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        // Get user data from database
        const connection = await db.promise();
        const [users] = await connection.query(
            `SELECT u.id, u.username, u.email, u.user_type, u.first_name, u.last_name, u.is_active,
                    s.grade_level, s.current_level, s.total_points, s.daily_points, s.streak_days
             FROM users u 
             LEFT JOIN students s ON u.id = s.user_id 
             WHERE u.id = ?`,
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user not found'
            });
        }

        const user = users[0];
        
        // Add user data to request object
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            userType: user.user_type,
            firstName: user.first_name,
            lastName: user.last_name,
            grade: user.grade_level,
            currentLevel: user.current_level,
            totalPoints: user.total_points,
            dailyPoints: user.daily_points,
            streakDays: user.streak_days
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Student middleware
const studentMiddleware = (req, res, next) => {
    if (req.user.userType !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student privileges required.'
        });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    studentMiddleware
};
