const express = require('express');
const router = express.Router();
const { query } = require('../../database/init-postgres');
const { authenticateToken } = require('../../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const result = await query(`
        SELECT courses.*, 
        (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as student_count
        FROM courses 
        WHERE teacher_id = $1
        ORDER BY created_at DESC
      `, [req.user.id]);
      
      res.json({ success: true, courses: result.rows });
    } else {
      const result = await query(`
        SELECT courses.*, users.full_name as teacher_name,
        (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
        (SELECT COUNT(*) FROM lesson_progress WHERE lesson_id IN 
          (SELECT id FROM course_lessons WHERE course_id = courses.id) 
          AND student_id = $1 AND completed = TRUE) as completed_lessons
        FROM courses 
        JOIN enrollments ON courses.id = enrollments.course_id
        JOIN users ON courses.teacher_id = users.id
        WHERE enrollments.student_id = $1
        ORDER BY enrollments.enrolled_at DESC
      `, [req.user.id]);
      
      res.json({ success: true, courses: result.rows });
    }
  } catch (err) {
    console.error('Error fetching my courses:', err);
    res.status(500).json({ success: false, error: 'Error fetching courses' });
  }
});

module.exports = router;
