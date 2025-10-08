const express = require('express');
const router = express.Router();
const db = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role === 'teacher') {
    db.get(`
      SELECT COUNT(*) as course_count FROM courses WHERE teacher_id = ?
    `, [req.user.id], (err, courseData) => {
      db.get(`
        SELECT COUNT(*) as student_count FROM enrollments 
        WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)
      `, [req.user.id], (err2, studentData) => {
        db.get(`
          SELECT COUNT(*) as lesson_count FROM course_lessons 
          WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)
        `, [req.user.id], (err3, lessonData) => {
          db.all(`
            SELECT courses.id, courses.title, COUNT(enrollments.id) as enrollment_count
            FROM courses
            LEFT JOIN enrollments ON courses.id = enrollments.course_id
            WHERE courses.teacher_id = ?
            GROUP BY courses.id
            ORDER BY enrollment_count DESC
            LIMIT 5
          `, [req.user.id], (err4, popularCourses) => {
            res.json({
              success: true,
              stats: {
                courses: courseData.course_count,
                students: studentData.student_count,
                lessons: lessonData.lesson_count
              },
              popularCourses: popularCourses || []
            });
          });
        });
      });
    });
  } else {
    db.get(`
      SELECT COUNT(*) as enrolled_count FROM enrollments WHERE student_id = ?
    `, [req.user.id], (err, enrollmentData) => {
      db.get(`
        SELECT COUNT(*) as completed_count FROM lesson_progress 
        WHERE student_id = ? AND completed = 1
      `, [req.user.id], (err2, progressData) => {
        db.all(`
          SELECT courses.*, users.full_name as teacher_name,
          (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count
          FROM courses 
          JOIN enrollments ON courses.id = enrollments.course_id
          JOIN users ON courses.teacher_id = users.id
          WHERE enrollments.student_id = ?
          ORDER BY enrollments.enrolled_at DESC
          LIMIT 5
        `, [req.user.id], (err3, recentCourses) => {
          res.json({
            success: true,
            stats: {
              enrolled: enrollmentData.enrolled_count,
              completed: progressData.completed_count
            },
            recentCourses: recentCourses || []
          });
        });
      });
    });
  }
});

module.exports = router;
