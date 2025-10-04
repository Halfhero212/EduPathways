const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT lessons.*, users.full_name as teacher_name FROM lessons JOIN users ON lessons.teacher_id = users.id ORDER BY lessons.created_at DESC', [], (err, lessons) => {
    if (err) {
      return res.status(500).send('Error fetching lessons');
    }
    res.render('lessons', { user: req.user, lessons });
  });
});

router.get('/create', authenticateToken, requireRole('teacher'), (req, res) => {
  res.render('create-lesson', { user: req.user, error: null });
});

router.post('/create', authenticateToken, requireRole('teacher'), (req, res) => {
  const { title, youtube_url, description } = req.body;

  if (!title || !youtube_url) {
    return res.render('create-lesson', { user: req.user, error: 'Title and YouTube URL are required' });
  }

  db.run(
    'INSERT INTO lessons (teacher_id, title, youtube_url, description) VALUES (?, ?, ?, ?)',
    [req.user.id, title, youtube_url, description],
    function(err) {
      if (err) {
        return res.render('create-lesson', { user: req.user, error: 'Error creating lesson' });
      }
      res.redirect('/lessons');
    }
  );
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT lessons.*, users.full_name as teacher_name FROM lessons JOIN users ON lessons.teacher_id = users.id WHERE lessons.id = ?', [req.params.id], (err, lesson) => {
    if (err || !lesson) {
      return res.status(404).send('Lesson not found');
    }
    res.render('lesson-view', { user: req.user, lesson });
  });
});

module.exports = router;
