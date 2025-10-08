const express = require('express');
const router = express.Router();
const { query } = require('../../database/init-postgres');
const { authenticateToken, optionalAuth, requireRole } = require('../../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    let sqlQuery = `
      SELECT courses.*, users.full_name as teacher_name, course_categories.name as category_name,
      (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as student_count
      FROM courses 
      JOIN users ON courses.teacher_id = users.id
      LEFT JOIN course_categories ON courses.category_id = course_categories.id
    `;
    
    const params = [];
    if (category) {
      sqlQuery += ' WHERE course_categories.id = $1';
      params.push(category);
    }
    
    sqlQuery += ' ORDER BY courses.created_at DESC';

    const coursesResult = await query(sqlQuery, params);
    const categoriesResult = await query('SELECT * FROM course_categories', []);
    
    res.json({ 
      success: true, 
      courses: coursesResult.rows, 
      categories: categoriesResult.rows 
    });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ success: false, error: 'Error fetching courses' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM course_categories', []);
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching categories' });
  }
});

router.post('/create', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { title, description, what_you_will_learn, category_id } = req.body;

  if (!title || !description) {
    return res.status(400).json({ 
      success: false, 
      error: 'Title and description are required' 
    });
  }

  try {
    const result = await query(
      'INSERT INTO courses (teacher_id, title, description, what_you_will_learn, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, title, description, what_you_will_learn, category_id || null]
    );
    
    res.json({ 
      success: true, 
      courseId: result.rows[0].id,
      message: 'Course created successfully' 
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error creating course' 
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const courseResult = await query(`
      SELECT courses.*, users.full_name as teacher_name, course_categories.name as category_name,
      (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as student_count
      FROM courses 
      JOIN users ON courses.teacher_id = users.id
      LEFT JOIN course_categories ON courses.category_id = course_categories.id
      WHERE courses.id = $1
    `, [req.params.id]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const course = courseResult.rows[0];
    const lessonsResult = await query(
      'SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY lesson_order',
      [req.params.id]
    );

    let isEnrolled = false;
    
    if (req.user && req.user.role === 'student') {
      const enrollmentResult = await query(
        'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [req.user.id, req.params.id]
      );
      isEnrolled = enrollmentResult.rows.length > 0;
    }

    res.json({ 
      success: true, 
      course, 
      lessons: lessonsResult.rows, 
      isEnrolled 
    });
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ success: false, error: 'Error fetching course' });
  }
});

router.post('/:id/enroll', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    await query(
      'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT (student_id, course_id) DO NOTHING',
      [req.user.id, req.params.id]
    );
    
    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    console.error('Error enrolling:', err);
    res.status(500).json({ success: false, error: 'Error enrolling in course' });
  }
});

router.get('/:id/manage', authenticateToken, requireRole('teacher'), async (req, res) => {
  try {
    const courseResult = await query(
      'SELECT * FROM courses WHERE id = $1 AND teacher_id = $2',
      [req.params.id, req.user.id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const lessonsResult = await query(
      'SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY lesson_order',
      [req.params.id]
    );

    res.json({ 
      success: true, 
      course: courseResult.rows[0], 
      lessons: lessonsResult.rows 
    });
  } catch (err) {
    console.error('Error managing course:', err);
    res.status(500).json({ success: false, error: 'Error loading course' });
  }
});

router.post('/:id/lessons', authenticateToken, requireRole('teacher'), async (req, res) => {
  const { title, youtube_url, lesson_order } = req.body;

  try {
    const result = await query(
      'INSERT INTO course_lessons (course_id, title, youtube_url, lesson_order) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.params.id, title, youtube_url, lesson_order || 1]
    );
    
    res.json({ 
      success: true, 
      lessonId: result.rows[0].id, 
      message: 'Lesson added successfully' 
    });
  } catch (err) {
    console.error('Error adding lesson:', err);
    res.status(500).json({ success: false, error: 'Error adding lesson' });
  }
});

router.get('/:courseId/lessons/:lessonId', authenticateToken, async (req, res) => {
  try {
    const lessonResult = await query(
      'SELECT * FROM course_lessons WHERE id = $1 AND course_id = $2',
      [req.params.lessonId, req.params.courseId]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    const courseResult = await query(
      'SELECT * FROM courses WHERE id = $1',
      [req.params.courseId]
    );

    const allLessonsResult = await query(
      'SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY lesson_order',
      [req.params.courseId]
    );

    let progress = null;

    if (req.user.role === 'student') {
      const enrollmentResult = await query(
        'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [req.user.id, req.params.courseId]
      );

      if (enrollmentResult.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Not enrolled in this course' });
      }

      const progressResult = await query(
        'SELECT * FROM lesson_progress WHERE student_id = $1 AND lesson_id = $2',
        [req.user.id, req.params.lessonId]
      );

      progress = progressResult.rows[0] || null;
    }

    res.json({ 
      success: true, 
      lesson: lessonResult.rows[0], 
      course: courseResult.rows[0], 
      allLessons: allLessonsResult.rows, 
      progress 
    });
  } catch (err) {
    console.error('Error fetching lesson:', err);
    res.status(500).json({ success: false, error: 'Error loading lesson' });
  }
});

router.post('/:courseId/lessons/:lessonId/complete', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    await query(
      `INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at) 
       VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP) 
       ON CONFLICT (student_id, lesson_id) 
       DO UPDATE SET completed = TRUE, completed_at = CURRENT_TIMESTAMP`,
      [req.user.id, req.params.lessonId]
    );
    
    res.json({ success: true, message: 'Lesson marked as complete' });
  } catch (err) {
    console.error('Error marking lesson complete:', err);
    res.status(500).json({ success: false, error: 'Error marking lesson complete' });
  }
});

module.exports = router;
