const express = require('express');
const router = express.Router();
const { query } = require('../../database/init-postgres');
const { authenticateToken } = require('../../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const courseResult = await query(
        'SELECT COUNT(*) as course_count FROM courses WHERE teacher_id = $1',
        [req.user.id]
      );

      const studentResult = await query(
        `SELECT COUNT(*) as student_count FROM enrollments 
         WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1)`,
        [req.user.id]
      );

      const lessonResult = await query(
        `SELECT COUNT(*) as lesson_count FROM course_lessons 
         WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1)`,
        [req.user.id]
      );

      const popularResult = await query(
        `SELECT courses.id, courses.title, COUNT(enrollments.id) as enrollment_count
         FROM courses
         LEFT JOIN enrollments ON courses.id = enrollments.course_id
         WHERE courses.teacher_id = $1
         GROUP BY courses.id
         ORDER BY enrollment_count DESC
         LIMIT 5`,
        [req.user.id]
      );

      res.json({
        success: true,
        stats: {
          courses: parseInt(courseResult.rows[0].course_count),
          students: parseInt(studentResult.rows[0].student_count),
          lessons: parseInt(lessonResult.rows[0].lesson_count)
        },
        popularCourses: popularResult.rows || []
      });
    } else {
      const enrollmentResult = await query(
        'SELECT COUNT(*) as enrolled_count FROM enrollments WHERE student_id = $1',
        [req.user.id]
      );

      const progressResult = await query(
        `SELECT COUNT(*) as completed_count FROM lesson_progress 
         WHERE student_id = $1 AND completed = TRUE`,
        [req.user.id]
      );

      const recentResult = await query(
        `SELECT courses.*, users.full_name as teacher_name,
         (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count
         FROM courses 
         JOIN enrollments ON courses.id = enrollments.course_id
         JOIN users ON courses.teacher_id = users.id
         WHERE enrollments.student_id = $1
         ORDER BY enrollments.enrolled_at DESC
         LIMIT 5`,
        [req.user.id]
      );

      res.json({
        success: true,
        stats: {
          enrolled: parseInt(enrollmentResult.rows[0].enrolled_count),
          completed: parseInt(progressResult.rows[0].completed_count)
        },
        recentCourses: recentResult.rows || []
      });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error loading dashboard' 
    });
  }
});

module.exports = router;
