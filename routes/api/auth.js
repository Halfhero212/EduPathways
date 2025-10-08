const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../../database/init-postgres');
const { JWT_SECRET } = require('../../middleware/auth');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').trim().notEmpty(),
  body('role').isIn(['teacher', 'student'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid input. Password must be at least 6 characters.' 
    });
  }

  const { email, password, full_name, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await query(
      'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4)',
      [email, hashedPassword, full_name, role]
    );
    
    res.json({ 
      success: true, 
      message: 'Account created successfully' 
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Error creating account' 
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token, 
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Error logging in' 
    });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
