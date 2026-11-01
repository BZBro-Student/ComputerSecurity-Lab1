const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15-minute lockout

// Pre-computed bcrypt hash used to maintain constant-time comparisons when a user doesn't exist
const DUMMY_HASH = '$2b$10$e84.vO.d04N/L.N4uWvG3.6J8W/qZ1l9T3Gz3J.L6k4N7N2/L6m/S';

// Clear existing database file on startup
const dbPath = path.join(__dirname, 'user.db');
const database = new DatabaseSync(dbPath);

// Ensure database table schema exists on server startup
database.exec(`
  CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    questionOne TEXT NOT NULL,
    questionTwo TEXT NOT NULL,
    questionThree TEXT NOT NULL,
    answerOne TEXT NOT NULL,
    answerTwo TEXT NOT NULL,
    answerThree TEXT NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    lockout_until INTEGER DEFAULT 0
  )
`);

// Middleware setup
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Secure Session Cookie Configuration
app.use(session({
  secret: 'lab1-local-development-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,       // Prevents client-side JS (XSS) from accessing session cookie
    secure: false,        // Required for plain HTTP / localhost testing
    sameSite: 'lax',      // Basic CSRF mitigation for local HTTP navigation
    maxAge: 1000 * 60 * 60 // 1-hour session duration
  }
}));

// Helper Functions
function getUserByUsername(username) {
  if (!username) return null;
  const stmt = database.prepare(`SELECT * FROM data WHERE LOWER(username) = LOWER(?)`);
  return stmt.get(username.trim()) || null;
}

function incrementFailedAttempts(userId, currentAttempts) {
  const newAttempts = currentAttempts + 1;
  let lockoutUntil = 0;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  const stmt = database.prepare(`
    UPDATE data 
    SET failed_attempts = ?, lockout_until = ? 
    WHERE id = ?
  `);
  stmt.run(newAttempts, lockoutUntil, userId);
}

function resetFailedAttempts(userId) {
  const stmt = database.prepare(`
    UPDATE data 
    SET failed_attempts = 0, lockout_until = 0 
    WHERE id = ?
  `);
  stmt.run(userId);
}

// 1. Registration Endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, questions, answers } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Valid username required' });
    }
    if (!password || typeof password !== 'string' || password.length < 15) {
      return res.status(400).json({ error: 'Password must be at least 15 characters long' });
    }
    if (!questions || !Array.isArray(questions) || questions.length !== 3 ||
      !answers || !Array.isArray(answers) || answers.length !== 3) {
      return res.status(400).json({ error: 'All 3 security questions and answers are required' });
    }

    const trimmedUser = username.trim();
    if (getUserByUsername(trimmedUser)) {
      return res.status(400).json({ error: 'Registration failed. Username is unavailable.' });
    }

    const passHash = await bcrypt.hash(password, SALT_ROUNDS);
    const a1Hash = await bcrypt.hash(answers[0].trim().toLowerCase(), SALT_ROUNDS);
    const a2Hash = await bcrypt.hash(answers[1].trim().toLowerCase(), SALT_ROUNDS);
    const a3Hash = await bcrypt.hash(answers[2].trim().toLowerCase(), SALT_ROUNDS);

    const stmt = database.prepare(`
      INSERT INTO data (username, password, questionOne, questionTwo, questionThree, answerOne, answerTwo, answerThree)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      trimmedUser,
      passHash,
      questions[0].trim(),
      questions[1].trim(),
      questions[2].trim(),
      a1Hash,
      a2Hash,
      a3Hash
    );

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = getUserByUsername(username.trim());

    if (user) {
      if (user.lockout_until > Date.now()) {
        const remainingMinutes = Math.ceil((user.lockout_until - Date.now()) / 60000);
        return res.status(429).json({
          error: `Account is temporarily locked due to failed attempts. Try again in ${remainingMinutes} minute(s).`
        });
      }
      
      if (user.lockout_until > 0 && user.lockout_until <= Date.now()) {
        resetFailedAttempts(user.id);
        user.failed_attempts = 0;
      }
    }

    const targetHash = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, targetHash);

    if (user && isMatch) {
      resetFailedAttempts(user.id);

      req.session.userId = user.id;
      req.session.username = user.username;
      return res.status(200).json({ message: 'Login successful' });
    }

    if (user) {
      incrementFailedAttempts(user.id, user.failed_attempts || 0);
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Session Guard Endpoint
app.get('/api/verify-session', (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({ authenticated: true, username: req.session.username });
  }
  return res.status(401).json({ authenticated: false, error: 'Unauthorized' });
});

// 4. Logout Endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

// 5. Fetch Security Questions
app.post('/api/get-security-questions', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const user = getUserByUsername(username.trim());

    if (!user) {
      return res.status(404).json({ error: 'Unable to retrieve questions' });
    }

    return res.status(200).json({
      questionOne: user.questionOne,
      questionTwo: user.questionTwo,
      questionThree: user.questionThree
    });
  } catch (error) {
    console.error('Question Fetch Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Password Reset Endpoint
app.post('/api/password-reset', async (req, res) => {
  try {
    const { username, newPassword, answers } = req.body;

    if (!username || !newPassword || !answers || !Array.isArray(answers) || answers.length !== 3) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    if (newPassword.length < 15) {
      return res.status(400).json({ error: 'Password must be at least 15 characters long' });
    }

    const user = getUserByUsername(username.trim());

    if (!user) {
      return res.status(401).json({ error: 'Verification failed. Password reset denied.' });
    }

    const isMatch1 = await bcrypt.compare(answers[0].trim().toLowerCase(), user.answerOne);
    const isMatch2 = await bcrypt.compare(answers[1].trim().toLowerCase(), user.answerTwo);
    const isMatch3 = await bcrypt.compare(answers[2].trim().toLowerCase(), user.answerThree);

    if (isMatch1 && isMatch2 && isMatch3) {
      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      const stmt = database.prepare(`
        UPDATE data 
        SET password = ?, failed_attempts = 0, lockout_until = 0 
        WHERE id = ?
      `);
      stmt.run(newHash, user.id);

      return res.status(200).json({ message: 'Password reset successful' });
    }

    return res.status(401).json({ error: 'Verification failed. Password reset denied.' });
  } catch (error) {
    console.error('Password Reset Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nhttp://localhost:${PORT}`);
});