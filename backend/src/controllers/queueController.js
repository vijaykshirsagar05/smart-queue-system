import pool from '../config/db.js';
import { calculateWaitTime } from '../services/predictionService.js';

export const generateToken = async (req, res) => {
  const { user_id, department } = req.body;

  if (!user_id || !department) {
    return res.status(400).json({ message: 'Missing user_id or department from frontend' });
  }

  try {
    const waitData = await calculateWaitTime(department);
    const tokenNum = `TKN-${Math.floor(1000 + Math.random() * 9000)}`;

    const [result] = await pool.query(
      'INSERT INTO tokens (token_number, user_id, department, status) VALUES (?, ?, ?, "waiting")',
      [tokenNum, user_id, department]
    );

    const io = req.app.get('socket.io');
    if (io) {
      io.emit('queueUpdated');
    }

    return res.status(201).json({
      message: 'Token generated successfully.',
      tokenData: {
        id: result.insertId,
        token_number: tokenNum,
        position: waitData.peopleAhead + 1,
        department,
        estimatedWaitTime: `${waitData.estimatedWaitTime} mins`
      }
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getQueueStatus = async (req, res) => {
  try {
    const [tokens] = await pool.query(
      'SELECT id, token_number, department, status, created_at FROM tokens WHERE status IN ("waiting", "called") ORDER BY created_at ASC'
    );

    return res.json(tokens);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
