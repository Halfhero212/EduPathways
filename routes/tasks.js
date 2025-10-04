const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role === 'teacher') {
    db.all('SELECT * FROM tasks WHERE teacher_id = ? ORDER BY created_at DESC', [req.user.id], (err, tasks) => {
      if (err) {
        return res.status(500).send('Error fetching tasks');
      }
      res.render('tasks-teacher', { user: req.user, tasks });
    });
  } else {
    db.all(`
      SELECT tasks.*, users.full_name as teacher_name,
      (SELECT COUNT(*) FROM submissions WHERE task_id = tasks.id AND student_id = ?) as is_submitted
      FROM tasks 
      JOIN users ON tasks.teacher_id = users.id 
      ORDER BY tasks.created_at DESC
    `, [req.user.id], (err, tasks) => {
      if (err) {
        return res.status(500).send('Error fetching tasks');
      }
      res.render('tasks-student', { user: req.user, tasks });
    });
  }
});

router.get('/create', authenticateToken, requireRole('teacher'), (req, res) => {
  res.render('create-task', { user: req.user, error: null });
});

router.post('/create', authenticateToken, requireRole('teacher'), (req, res) => {
  const { title, description, deadline } = req.body;

  if (!title || !description || !deadline) {
    return res.render('create-task', { user: req.user, error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO tasks (teacher_id, title, description, deadline) VALUES (?, ?, ?, ?)',
    [req.user.id, title, description, deadline],
    function(err) {
      if (err) {
        return res.render('create-task', { user: req.user, error: 'Error creating task' });
      }
      res.redirect('/tasks');
    }
  );
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT tasks.*, users.full_name as teacher_name FROM tasks JOIN users ON tasks.teacher_id = users.id WHERE tasks.id = ?', [req.params.id], (err, task) => {
    if (err || !task) {
      return res.status(404).send('Task not found');
    }

    if (req.user.role === 'student') {
      db.get('SELECT * FROM submissions WHERE task_id = ? AND student_id = ?', [req.params.id, req.user.id], (err2, submission) => {
        res.render('task-view', { user: req.user, task, submission });
      });
    } else {
      db.all('SELECT submissions.*, users.full_name as student_name FROM submissions JOIN users ON submissions.student_id = users.id WHERE task_id = ?', [req.params.id], (err2, submissions) => {
        res.render('task-view', { user: req.user, task, submissions });
      });
    }
  });
});

router.post('/:id/submit', authenticateToken, requireRole('student'), (req, res) => {
  const { response } = req.body;

  if (!response) {
    return res.redirect(`/tasks/${req.params.id}`);
  }

  db.run(
    'INSERT OR REPLACE INTO submissions (task_id, student_id, response) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, response],
    function(err) {
      if (err) {
        return res.status(500).send('Error submitting response');
      }
      res.redirect(`/tasks/${req.params.id}`);
    }
  );
});

module.exports = router;
