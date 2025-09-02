const mysql = require('mysql2');
require('dotenv').config({ path: '../config.env' });

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gamified_learning_db',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};

// Create connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Create promise wrapper
const promisePool = pool.promise();

// Test database connection
async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1 as test');
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create database if not exists
        await promisePool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await promisePool.query(`USE ${dbConfig.database}`);
        
        console.log('📊 Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
}

// Export both pool and promise pool
module.exports = pool;
module.exports.promise = () => promisePool;
module.exports.testConnection = testConnection;
module.exports.initializeDatabase = initializeDatabase;



