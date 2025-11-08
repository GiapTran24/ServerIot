const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Debug kết nối ngay khi server start
async function testConnection() {
    try {
        console.log("");
        console.log('✅ MySQL connected successfully!');
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
    }
}

testConnection();

module.exports = pool;
