const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role === 'teacher') {
    db.all('SELECT COUNT(*) as lesson_count FROM lessons WHERE teacher_id = ?', [req.user.id], (err, lessonData) => {
      db.all('SELECT COUNT(*) as task_count FROM tasks WHERE teacher_id = ?', [req.user.id], (err2, taskData) => {
        res.render('dashboard-teacher', {
          user: req.user,
          lesson_count: lessonData[0].lesson_count,
          task_count: taskData[0].task_count
        });
      });
    });
  } else {
    db.all('SELECT COUNT(*) as lesson_count FROM lessons', [], (err, lessonData) => {
      db.all('SELECT COUNT(*) as task_count FROM tasks', [], (err2, taskData) => {
        db.all('SELECT COUNT(*) as submission_count FROM submissions WHERE student_id = ?', [req.user.id], (err3, submissionData) => {
          res.render('dashboard-student', {
            user: req.user,
            lesson_count: lessonData[0].lesson_count,
            task_count: taskData[0].task_count,
            submission_count: submissionData[0].submission_count
          });
        });
      });
    });
  }
});

module.exports = router;
