import crypto from 'crypto';
import pool from '../config/db.js';

const HASH_PREFIX = 'scrypt';

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${HASH_PREFIX}:${salt}:${hash}`;
};

const isPasswordMatch = (password, storedPassword) => {
  if (!storedPassword) {
    return false;
  }

  if (!storedPassword.startsWith(`${HASH_PREFIX}:`)) {
    return password === storedPassword;
  }

  const [, salt, expectedHash] = storedPassword.split(':');
  const actualHash = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  return expectedBuffer.length === actualHash.length && crypto.timingSafeEqual(expectedBuffer, actualHash);
};

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const registerUser = async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  try {
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name.trim(), email.trim().toLowerCase(), hashPassword(password)]
    );

    return res.status(201).json({ message: 'User created successfully.', userId: result.insertId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);

    if (users.length === 0 || !isPasswordMatch(password, users[0].password)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({ message: 'Welcome back.', user: sanitizeUser(users[0]) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
