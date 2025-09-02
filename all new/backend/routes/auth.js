const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../../database/connection');
const router = express.Router();

// Register endpoint
router.post('/register', [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('grade').isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, grade, password } = req.body;
        const connection = await db.promise();

        // Check if user already exists
        const [existingUsers] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate username
        const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Date.now()}`;

        // Start transaction
        await connection.query('START TRANSACTION');

        try {
            // Insert user
            const [userResult] = await connection.query(
                `INSERT INTO users (username, email, password_hash, user_type, first_name, last_name, is_active, email_verified) 
                 VALUES (?, ?, ?, 'student', ?, ?, TRUE, FALSE)`,
                [username, email, passwordHash, firstName, lastName]
            );

            const userId = userResult.insertId;

            // Insert student record
            await connection.query(
                `INSERT INTO students (user_id, grade_level, current_level, total_points, daily_points, streak_days) 
                 VALUES (?, ?, 1, 0, 0, 0)`,
                [userId, grade]
            );

            // Commit transaction
            await connection.query('COMMIT');

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: userId, 
                    email: email, 
                    userType: 'student',
                    grade: grade
                },
                process.env.JWT_SECRET || 'fallback-secret',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    token,
                    user: {
                        id: userId,
                        firstName,
                        lastName,
                        email,
                        grade,
                        userType: 'student'
                    }
                }
            });

        } catch (error) {
            // Rollback transaction
            await connection.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// Login endpoint
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        const connection = await db.promise();

        // Find user with student data
        const [users] = await connection.query(
            `SELECT u.id, u.username, u.email, u.password_hash, u.user_type, u.first_name, u.last_name, u.is_active,
                    s.grade_level, s.current_level, s.total_points, s.daily_points, s.streak_days
             FROM users u 
             LEFT JOIN students s ON u.id = s.user_id 
             WHERE u.email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await connection.query(
            'UPDATE students SET last_login = NOW() WHERE user_id = ?',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                userType: user.user_type,
                grade: user.grade_level
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    grade: user.grade_level,
                    userType: user.user_type,
                    currentLevel: user.current_level,
                    totalPoints: user.total_points,
                    dailyPoints: user.daily_points,
                    streakDays: user.streak_days
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const connection = await db.promise();

        // Get user data
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
                message: 'Invalid or expired token'
            });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    grade: user.grade_level,
                    userType: user.user_type,
                    currentLevel: user.current_level,
                    totalPoints: user.total_points,
                    dailyPoints: user.daily_points,
                    streakDays: user.streak_days
                }
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});

module.exports = router;
