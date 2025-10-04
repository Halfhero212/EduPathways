const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role === 'teacher') {
    db.get('SELECT COUNT(*) as course_count FROM courses WHERE teacher_id = ?', [req.user.id], (err, courseData) => {
      db.get(`
        SELECT COUNT(*) as student_count FROM enrollments 
        WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)
      `, [req.user.id], (err2, studentData) => {
        db.get(`
          SELECT COUNT(*) as lesson_count FROM course_lessons 
          WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)
        `, [req.user.id], (err3, lessonData) => {
          res.render('dashboard-teacher', {
            user: req.user,
            course_count: courseData.course_count,
            student_count: studentData.student_count,
            lesson_count: lessonData.lesson_count
          });
        });
      });
    });
  } else {
    db.get('SELECT COUNT(*) as enrolled_count FROM enrollments WHERE student_id = ?', [req.user.id], (err, enrollData) => {
      db.get(`
        SELECT COUNT(*) as completed_count FROM lesson_progress 
        WHERE student_id = ? AND completed = 1
      `, [req.user.id], (err2, progressData) => {
        db.get(`
          SELECT COUNT(*) as total_lessons FROM course_lessons 
          WHERE course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)
        `, [req.user.id], (err3, lessonData) => {
          res.render('dashboard-student', {
            user: req.user,
            enrolled_count: enrollData.enrolled_count,
            completed_lessons: progressData.completed_count,
            total_lessons: lessonData.total_lessons
          });
        });
      });
    });
  }
});

module.exports = router;
