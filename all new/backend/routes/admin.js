const express = require('express');
const db = require('../../database/connection');
const router = express.Router();

// Get all students
router.get('/students', async (req, res) => {
    try {
        const connection = await db.promise();
        
        const [students] = await connection.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.is_active,
                s.grade_level,
                s.current_level,
                s.total_points,
                s.daily_points,
                s.streak_days,
                s.last_login
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.user_type = 'student'
            ORDER BY s.total_points DESC
        `);

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students'
        });
    }
});

// Add new student
router.post('/students', async (req, res) => {
    try {
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
        const bcrypt = require('bcryptjs');
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
                 VALUES (?, ?, ?, 'student', ?, ?, TRUE, TRUE)`,
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

            res.status(201).json({
                success: true,
                message: 'Student added successfully',
                data: {
                    id: userId,
                    firstName,
                    lastName,
                    email,
                    grade
                }
            });

        } catch (error) {
            // Rollback transaction
            await connection.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding student'
        });
    }
});

// Get all games
router.get('/games', async (req, res) => {
    try {
        const connection = await db.promise();
        
        const [games] = await connection.query(`
            SELECT 
                g.id,
                g.name,
                g.description,
                g.game_type,
                g.points_reward,
                g.time_limit,
                g.is_active,
                s.name as subject_name
            FROM games g
            LEFT JOIN subjects s ON g.subject_id = s.id
            ORDER BY g.created_at DESC
        `);

        res.json({
            success: true,
            data: games
        });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching games'
        });
    }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
    try {
        const connection = await db.promise();
        
        // Get total students
        const [studentCount] = await connection.query(
            'SELECT COUNT(*) as count FROM users WHERE user_type = "student" AND is_active = TRUE'
        );

        // Get total games
        const [gameCount] = await connection.query(
            'SELECT COUNT(*) as count FROM games WHERE is_active = TRUE'
        );

        // Get total subjects
        const [subjectCount] = await connection.query(
            'SELECT COUNT(*) as count FROM subjects WHERE is_active = TRUE'
        );

        // Get average progress
        const [avgProgress] = await connection.query(`
            SELECT AVG(completion_percentage) as avg_progress 
            FROM student_progress 
            WHERE completion_percentage > 0
        `);

        res.json({
            success: true,
            data: {
                totalStudents: studentCount[0].count,
                totalGames: gameCount[0].count,
                totalSubjects: subjectCount[0].count,
                avgProgress: Math.round(avgProgress[0].avg_progress || 0)
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// Get recent activity
router.get('/activity', async (req, res) => {
    try {
        const connection = await db.promise();
        
        // Get recent student registrations
        const [recentStudents] = await connection.query(`
            SELECT 
                u.first_name,
                u.last_name,
                u.created_at,
                'student_registered' as activity_type
            FROM users u
            WHERE u.user_type = 'student'
            ORDER BY u.created_at DESC
            LIMIT 5
        `);

        // Get recent game completions
        const [recentGames] = await connection.query(`
            SELECT 
                u.first_name,
                u.last_name,
                g.name as game_name,
                gp.score,
                gp.joined_at as created_at,
                'game_completed' as activity_type
            FROM game_participants gp
            JOIN users u ON gp.user_id = u.id
            JOIN game_sessions gs ON gp.session_id = gs.id
            JOIN games g ON gs.game_id = g.id
            ORDER BY gp.joined_at DESC
            LIMIT 5
        `);

        // Combine and sort activities
        const activities = [...recentStudents, ...recentGames]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent activity'
        });
    }
});

module.exports = router;
