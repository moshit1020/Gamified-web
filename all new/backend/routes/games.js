const express = require('express');
const db = require('../../database/connection');
const router = express.Router();

// Get all available games
router.get('/', async (req, res) => {
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
                g.difficulty_level,
                s.name as subject_name,
                s.color_code as subject_color
            FROM games g
            LEFT JOIN subjects s ON g.subject_id = s.id
            WHERE g.is_active = TRUE
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

// Get game by ID
router.get('/:id', async (req, res) => {
    try {
        const gameId = req.params.id;
        const connection = await db.promise();
        
        const [games] = await connection.query(`
            SELECT 
                g.*,
                s.name as subject_name,
                s.color_code as subject_color
            FROM games g
            LEFT JOIN subjects s ON g.subject_id = s.id
            WHERE g.id = ? AND g.is_active = TRUE
        `, [gameId]);

        if (games.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }

        res.json({
            success: true,
            data: games[0]
        });
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching game'
        });
    }
});

// Start a game session
router.post('/:id/start', async (req, res) => {
    try {
        const gameId = req.params.id;
        const userId = req.user.id;
        const connection = await db.promise();

        // Get game details
        const [games] = await connection.query(
            'SELECT * FROM games WHERE id = ? AND is_active = TRUE',
            [gameId]
        );

        if (games.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }

        const game = games[0];

        // Generate session code
        const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create game session
        const [sessionResult] = await connection.query(
            `INSERT INTO game_sessions 
             (game_id, session_code, status, created_by, time_remaining, total_questions)
             VALUES (?, ?, 'active', ?, ?, 10)`,
            [gameId, sessionCode, userId, game.time_limit]
        );

        const sessionId = sessionResult.insertId;

        // Add user as participant
        await connection.query(
            `INSERT INTO game_participants 
             (session_id, user_id, score, correct_answers, total_answers, time_taken)
             VALUES (?, ?, 0, 0, 0, 0)`,
            [sessionId, userId]
        );

        res.json({
            success: true,
            message: 'Game session started',
            data: {
                sessionId,
                sessionCode,
                game: game,
                timeRemaining: game.time_limit
            }
        });
    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting game'
        });
    }
});

// Submit game results
router.post('/:id/submit', async (req, res) => {
    try {
        const gameId = req.params.id;
        const userId = req.user.id;
        const { sessionId, score, correctAnswers, totalAnswers, timeTaken } = req.body;
        const connection = await db.promise();

        // Update participant results
        await connection.query(
            `UPDATE game_participants 
             SET score = ?, correct_answers = ?, total_answers = ?, time_taken = ?
             WHERE session_id = ? AND user_id = ?`,
            [score, correctAnswers, totalAnswers, timeTaken, sessionId, userId]
        );

        // Get game points reward
        const [games] = await connection.query(
            'SELECT points_reward FROM games WHERE id = ?',
            [gameId]
        );

        if (games.length > 0) {
            const pointsEarned = Math.floor((correctAnswers / totalAnswers) * games[0].points_reward);
            
            // Update student points
            await connection.query(
                `UPDATE students 
                 SET total_points = total_points + ?, daily_points = daily_points + ?
                 WHERE user_id = ?`,
                [pointsEarned, pointsEarned, userId]
            );

            // Update student level
            await connection.query(
                `UPDATE students 
                 SET current_level = FLOOR(total_points / 100) + 1
                 WHERE user_id = ?`,
                [userId]
            );
        }

        // End game session
        await connection.query(
            'UPDATE game_sessions SET status = "completed", ended_at = NOW() WHERE id = ?',
            [sessionId]
        );

        res.json({
            success: true,
            message: 'Game results submitted',
            data: {
                score,
                pointsEarned: games.length > 0 ? Math.floor((correctAnswers / totalAnswers) * games[0].points_reward) : 0
            }
        });
    } catch (error) {
        console.error('Error submitting game results:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting game results'
        });
    }
});

// Get game leaderboard
router.get('/:id/leaderboard', async (req, res) => {
    try {
        const gameId = req.params.id;
        const connection = await db.promise();
        
        const [leaderboard] = await connection.query(`
            SELECT 
                u.first_name,
                u.last_name,
                gp.score,
                gp.correct_answers,
                gp.total_answers,
                gp.time_taken,
                ROUND((gp.correct_answers / gp.total_answers) * 100, 2) as accuracy
            FROM game_participants gp
            JOIN game_sessions gs ON gp.session_id = gs.id
            JOIN users u ON gp.user_id = u.id
            WHERE gs.game_id = ? AND gs.status = 'completed'
            ORDER BY gp.score DESC, gp.time_taken ASC
            LIMIT 10
        `, [gameId]);

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error fetching game leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching game leaderboard'
        });
    }
});

module.exports = router;
