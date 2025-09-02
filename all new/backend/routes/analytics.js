const express = require('express');
const db = require('../../database/connection');
const router = express.Router();

// Get platform analytics
router.get('/platform', async (req, res) => {
    try {
        const connection = await db.promise();
        
        // Get basic platform stats
        const [totalUsers] = await connection.query(
            'SELECT COUNT(*) as count FROM users WHERE is_active = TRUE'
        );
        
        const [totalStudents] = await connection.query(
            'SELECT COUNT(*) as count FROM users WHERE user_type = "student" AND is_active = TRUE'
        );
        
        const [totalGames] = await connection.query(
            'SELECT COUNT(*) as count FROM games WHERE is_active = TRUE'
        );
        
        const [totalSessions] = await connection.query(
            'SELECT COUNT(*) as count FROM game_sessions WHERE status = "completed"'
        );

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers[0].count,
                totalStudents: totalStudents[0].count,
                totalGames: totalGames[0].count,
                totalSessions: totalSessions[0].count
            }
        });
    } catch (error) {
        console.error('Error fetching platform analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching platform analytics'
        });
    }
});

// Get student performance analytics
router.get('/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const connection = await db.promise();
        
        // Get student performance data
        const [performance] = await connection.query(`
            SELECT 
                s.name as subject_name,
                AVG(sp.completion_percentage) as avg_completion,
                SUM(sp.time_spent) as total_time,
                COUNT(sp.id) as topics_attempted
            FROM student_progress sp
            JOIN topics t ON sp.topic_id = t.id
            JOIN subjects s ON t.subject_id = s.id
            WHERE sp.student_id = ?
            GROUP BY s.id, s.name
        `, [studentId]);

        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student analytics'
        });
    }
});

// Get game analytics
router.get('/games', async (req, res) => {
    try {
        const connection = await db.promise();
        
        // Get game popularity and performance
        const [gameStats] = await connection.query(`
            SELECT 
                g.name as game_name,
                g.game_type,
                COUNT(gs.id) as total_sessions,
                AVG(gp.score) as avg_score,
                COUNT(DISTINCT gp.user_id) as unique_players
            FROM games g
            LEFT JOIN game_sessions gs ON g.id = gs.game_id
            LEFT JOIN game_participants gp ON gs.id = gp.session_id
            WHERE g.is_active = TRUE
            GROUP BY g.id, g.name, g.game_type
            ORDER BY total_sessions DESC
        `);

        res.json({
            success: true,
            data: gameStats
        });
    } catch (error) {
        console.error('Error fetching game analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching game analytics'
        });
    }
});

module.exports = router;
