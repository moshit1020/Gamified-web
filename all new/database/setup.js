const db = require('./connection');
require('dotenv').config({ path: '../config.env' });

async function createTables() {
    try {
        const connection = await db.promise();
        
        console.log('🚀 Creating database tables...');
        
        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                user_type ENUM('student', 'teacher', 'admin') DEFAULT 'student',
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                avatar_url VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Students table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
                class_name VARCHAR(20),
                school_name VARCHAR(100),
                parent_email VARCHAR(100),
                emergency_contact VARCHAR(20),
                learning_style ENUM('visual', 'auditory', 'kinesthetic', 'reading') DEFAULT 'visual',
                current_level INT DEFAULT 1,
                total_points INT DEFAULT 0,
                daily_points INT DEFAULT 0,
                streak_days INT DEFAULT 0,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Subjects table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
                description TEXT,
                icon_url VARCHAR(255),
                color_code VARCHAR(7) DEFAULT '#3B82F6',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Topics table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS topics (
                id INT PRIMARY KEY AUTO_INCREMENT,
                subject_id INT NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
                estimated_duration INT DEFAULT 30,
                prerequisites TEXT,
                learning_objectives TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Questions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                topic_id INT NOT NULL,
                question_text TEXT NOT NULL,
                question_type ENUM('multiple_choice', 'true_false', 'fill_blank', 'matching', 'essay') NOT NULL,
                difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
                points_value INT DEFAULT 10,
                time_limit INT DEFAULT 60,
                explanation TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Question options table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS question_options (
                id INT PRIMARY KEY AUTO_INCREMENT,
                question_id INT NOT NULL,
                option_text TEXT NOT NULL,
                is_correct BOOLEAN DEFAULT FALSE,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Games table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS games (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                game_type ENUM('quiz', 'puzzle', 'simulation', 'adventure', 'strategy') NOT NULL,
                subject_id INT,
                topic_id INT,
                min_players INT DEFAULT 1,
                max_players INT DEFAULT 1,
                difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
                points_reward INT DEFAULT 50,
                time_limit INT DEFAULT 300,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Game sessions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                game_id INT NOT NULL,
                session_code VARCHAR(20) UNIQUE NOT NULL,
                status ENUM('waiting', 'active', 'completed', 'cancelled') DEFAULT 'waiting',
                current_question INT DEFAULT 0,
                total_questions INT DEFAULT 0,
                time_remaining INT DEFAULT 0,
                created_by INT NOT NULL,
                started_at TIMESTAMP NULL,
                ended_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Game participants table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS game_participants (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id INT NOT NULL,
                user_id INT NOT NULL,
                score INT DEFAULT 0,
                correct_answers INT DEFAULT 0,
                total_answers INT DEFAULT 0,
                time_taken INT DEFAULT 0,
                rank_position INT DEFAULT 0,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Student progress table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS student_progress (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                topic_id INT NOT NULL,
                completion_percentage DECIMAL(5,2) DEFAULT 0.00,
                time_spent INT DEFAULT 0,
                questions_attempted INT DEFAULT 0,
                questions_correct INT DEFAULT 0,
                last_accessed TIMESTAMP NULL,
                mastery_level ENUM('not_started', 'beginner', 'intermediate', 'advanced', 'mastered') DEFAULT 'not_started',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_topic (student_id, topic_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Performance analytics table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS performance_analytics (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                subject_id INT,
                topic_id INT,
                game_id INT,
                performance_score DECIMAL(5,2) DEFAULT 0.00,
                time_spent INT DEFAULT 0,
                accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
                speed_score DECIMAL(5,2) DEFAULT 0.00,
                engagement_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
                learning_pattern JSON,
                ai_recommendations TEXT,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Achievements table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon_url VARCHAR(255),
                points_reward INT DEFAULT 0,
                criteria_type ENUM('points', 'streak', 'accuracy', 'completion', 'social') NOT NULL,
                criteria_value INT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Student achievements table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS student_achievements (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                achievement_id INT NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                points_earned INT DEFAULT 0,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_achievement (student_id, achievement_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Study groups table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS study_groups (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                subject_id INT,
                max_members INT DEFAULT 10,
                is_public BOOLEAN DEFAULT TRUE,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Group members table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS group_members (
                id INT PRIMARY KEY AUTO_INCREMENT,
                group_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_group_member (group_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Tasks table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                subject_id INT,
                topic_id INT,
                assigned_by INT NOT NULL,
                assigned_to INT,
                group_id INT,
                due_date TIMESTAMP NULL,
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
                points_reward INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
                FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Chat messages table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT NOT NULL,
                group_id INT,
                session_id INT,
                message_text TEXT NOT NULL,
                message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
                file_url VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // AI recommendations table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ai_recommendations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                recommendation_type ENUM('topic', 'game', 'study_time', 'difficulty', 'social') NOT NULL,
                recommendation_text TEXT NOT NULL,
                confidence_score DECIMAL(3,2) DEFAULT 0.00,
                is_implemented BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ All tables created successfully!');
        
        // Insert sample data
        await insertSampleData(connection);
        
        console.log('🎉 Database setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
}

async function insertSampleData(connection) {
    try {
        console.log('📝 Inserting sample data...');
        
        // Insert sample subjects
        const subjects = [
            { name: 'Mathematics', grade_level: 1, description: 'Basic math concepts for grade 1', color_code: '#EF4444' },
            { name: 'Science', grade_level: 1, description: 'Introduction to science for grade 1', color_code: '#10B981' },
            { name: 'English', grade_level: 1, description: 'English language and literature', color_code: '#3B82F6' },
            { name: 'Mathematics', grade_level: 2, description: 'Advanced math concepts for grade 2', color_code: '#F59E0B' },
            { name: 'Science', grade_level: 2, description: 'Science exploration for grade 2', color_code: '#8B5CF6' }
        ];
        
        for (const subject of subjects) {
            await connection.query(
                'INSERT IGNORE INTO subjects (name, grade_level, description, color_code) VALUES (?, ?, ?, ?)',
                [subject.name, subject.grade_level, subject.description, subject.color_code]
            );
        }
        
        // Insert sample achievements
        const achievements = [
            { name: 'First Steps', description: 'Complete your first lesson', points_reward: 50, criteria_type: 'completion', criteria_value: 1 },
            { name: 'Streak Master', description: 'Maintain a 7-day learning streak', points_reward: 100, criteria_type: 'streak', criteria_value: 7 },
            { name: 'Perfect Score', description: 'Get 100% accuracy on a quiz', points_reward: 200, criteria_type: 'accuracy', criteria_value: 100 },
            { name: 'Social Butterfly', description: 'Join 3 study groups', points_reward: 150, criteria_type: 'social', criteria_value: 3 }
        ];
        
        for (const achievement of achievements) {
            await connection.query(
                'INSERT IGNORE INTO achievements (name, description, points_reward, criteria_type, criteria_value) VALUES (?, ?, ?, ?, ?)',
                [achievement.name, achievement.description, achievement.points_reward, achievement.criteria_type, achievement.criteria_value]
            );
        }
        
        // Insert sample games
        const games = [
            { name: 'Math Quiz Adventure', description: 'Fun math quiz with adventure elements', game_type: 'quiz', points_reward: 100, time_limit: 300 },
            { name: 'Science Puzzle Lab', description: 'Interactive science puzzles', game_type: 'puzzle', points_reward: 80, time_limit: 240 },
            { name: 'Word Building Challenge', description: 'Build words and learn vocabulary', game_type: 'strategy', points_reward: 90, time_limit: 180 }
        ];
        
        for (const game of games) {
            await connection.query(
                'INSERT IGNORE INTO games (name, description, game_type, points_reward, time_limit) VALUES (?, ?, ?, ?, ?)',
                [game.name, game.description, game.game_type, game.points_reward, game.time_limit]
            );
        }
        
        console.log('✅ Sample data inserted successfully!');
        
    } catch (error) {
        console.error('❌ Error inserting sample data:', error);
        throw error;
    }
}

// Run setup if called directly
if (require.main === module) {
    createTables()
        .then(() => {
            console.log('🎯 Database setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = { createTables, insertSampleData };



