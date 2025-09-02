const express = require('express');
const db = require('../../database/connection');
const router = express.Router();

// Get student leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const connection = await db.promise();
        
        const [students] = await connection.query(`
            SELECT 
                u.first_name,
                u.last_name,
                s.total_points,
                s.current_level,
                s.grade_level
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.is_active = TRUE
            ORDER BY s.total_points DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard'
        });
    }
});

// Get student progress
router.get('/progress', async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = await db.promise();
        
        const [progress] = await connection.query(`
            SELECT 
                s.name as subject_name,
                AVG(sp.completion_percentage) as avg_progress,
                COUNT(sp.id) as topics_completed
            FROM student_progress sp
            JOIN topics t ON sp.topic_id = t.id
            JOIN subjects s ON t.subject_id = s.id
            WHERE sp.student_id = (
                SELECT id FROM students WHERE user_id = ?
            )
            GROUP BY s.id, s.name
        `, [userId]);

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching progress'
        });
    }
});

// Update student progress
router.post('/progress', async (req, res) => {
    try {
        const userId = req.user.id;
        const { topicId, completionPercentage, timeSpent, questionsCorrect, questionsAttempted } = req.body;
        const connection = await db.promise();

        // Get student ID
        const [students] = await connection.query(
            'SELECT id FROM students WHERE user_id = ?',
            [userId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const studentId = students[0].id;

        // Update or insert progress
        await connection.query(`
            INSERT INTO student_progress 
            (student_id, topic_id, completion_percentage, time_spent, questions_attempted, questions_correct, last_accessed)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            completion_percentage = VALUES(completion_percentage),
            time_spent = time_spent + VALUES(time_spent),
            questions_attempted = questions_attempted + VALUES(questions_attempted),
            questions_correct = questions_correct + VALUES(questions_correct),
            last_accessed = NOW()
        `, [studentId, topicId, completionPercentage, timeSpent, questionsAttempted, questionsCorrect]);

        // Update student points and level
        const pointsEarned = Math.floor(completionPercentage * 10); // 10 points per 1% completion
        await connection.query(`
            UPDATE students 
            SET total_points = total_points + ?,
                daily_points = daily_points + ?,
                current_level = FLOOR((total_points + ?) / 100) + 1
            WHERE id = ?
        `, [pointsEarned, pointsEarned, pointsEarned, studentId]);

        res.json({
            success: true,
            message: 'Progress updated successfully',
            data: {
                pointsEarned,
                newLevel: Math.floor((req.user.totalPoints + pointsEarned) / 100) + 1
            }
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating progress'
        });
    }
});

// Get student achievements
router.get('/achievements', async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = await db.promise();
        
        const [achievements] = await connection.query(`
            SELECT 
                a.name,
                a.description,
                a.icon_url,
                a.points_reward,
                sa.earned_at,
                sa.points_earned
            FROM student_achievements sa
            JOIN achievements a ON sa.achievement_id = a.id
            WHERE sa.student_id = (
                SELECT id FROM students WHERE user_id = ?
            )
            ORDER BY sa.earned_at DESC
        `, [userId]);

        res.json({
            success: true,
            data: achievements
        });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching achievements'
        });
    }
});

module.exports = router;
