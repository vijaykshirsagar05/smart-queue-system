import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_queue',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0
});

try {
  const connection = await pool.getConnection();
  console.log('Connected to MySQL database.');
  connection.release();
} catch (err) {
  console.error('Database connection failed:', err.message);
}

export default pool;
