const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role === 'teacher') {
    db.all(`
      SELECT courses.*, 
      (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as student_count
      FROM courses 
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `, [req.user.id], (err, courses) => {
      if (err) {
        return res.status(500).send('Error fetching courses');
      }
      res.render('my-courses-teacher', { user: req.user, courses });
    });
  } else {
    db.all(`
      SELECT courses.*, users.full_name as teacher_name,
      (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
      (SELECT COUNT(*) FROM lesson_progress WHERE lesson_id IN 
        (SELECT id FROM course_lessons WHERE course_id = courses.id) 
        AND student_id = ? AND completed = 1) as completed_lessons
      FROM courses 
      JOIN enrollments ON courses.id = enrollments.course_id
      JOIN users ON courses.teacher_id = users.id
      WHERE enrollments.student_id = ?
      ORDER BY enrollments.enrolled_at DESC
    `, [req.user.id, req.user.id], (err, courses) => {
      if (err) {
        return res.status(500).send('Error fetching courses');
      }
      res.render('my-courses-student', { user: req.user, courses });
    });
  }
});

module.exports = router;
