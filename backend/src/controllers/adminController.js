import pool from '../config/db.js';

export const callNextToken = async (req, res) => {
  const { department } = req.body;

  if (!department) {
    return res.status(400).json({ message: 'Missing department from admin request' });
  }

  try {
    await pool.query(
      'UPDATE tokens SET status = "completed" WHERE status = "called" AND department = ?',
      [department]
    );

    const [nextInLine] = await pool.query(
      'SELECT * FROM tokens WHERE status = "waiting" AND department = ? ORDER BY created_at ASC LIMIT 1',
      [department]
    );

    if (nextInLine.length === 0) {
      return res.status(404).json({ message: 'Queue is empty. No one is waiting in this department.' });
    }

    const nextTokenId = nextInLine[0].id;
    await pool.query('UPDATE tokens SET status = "called" WHERE id = ?', [nextTokenId]);

    const io = req.app.get('socket.io');
    if (io) {
      io.emit('queueUpdated');
    }

    return res.status(200).json({
      message: 'Next token called successfully.',
      token: nextInLine[0].token_number
    });
  } catch (error) {
    console.error('Error calling next token:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const completeService = async (req, res) => {
  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ message: 'Missing tokenId from request' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE tokens SET status = "completed" WHERE id = ? AND status = "called"',
      [tokenId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Token not found or not currently being called.' });
    }

    const io = req.app.get('socket.io');
    if (io) {
      io.emit('queueUpdated');
    }

    return res.status(200).json({ message: 'Service completed. Queue updated.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
