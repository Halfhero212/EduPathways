const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/init-postgres');
const { JWT_SECRET } = require('../middleware/auth');

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').trim().notEmpty(),
  body('role').isIn(['teacher', 'student'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('register', { error: 'Invalid input. Password must be at least 6 characters.' });
  }

  const { email, password, full_name, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await query(
      'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4)',
      [email, hashedPassword, full_name, role]
    );
    
    res.redirect('/login');
  } catch (err) {
    if (err.code === '23505') {
      return res.render('register', { error: 'Email already exists' });
    }
    res.render('register', { error: 'Error creating account' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.render('login', { error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render('login', { error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { error: 'Error logging in' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
