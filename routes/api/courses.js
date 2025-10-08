const express = require('express');
const router = express.Router();
const db = require('../../database/init');
const { authenticateToken, optionalAuth, requireRole } = require('../../middleware/auth');

router.get('/', (req, res) => {
  const category = req.query.category;
  let query = `
    SELECT courses.*, users.full_name as teacher_name, course_categories.name as category_name,
    (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as student_count
    FROM courses 
    JOIN users ON courses.teacher_id = users.id
    LEFT JOIN course_categories ON courses.category_id = course_categories.id
  `;
  
  const params = [];
  if (category) {
    query += ' WHERE course_categories.id = ?';
    params.push(category);
  }
  
  query += ' ORDER BY courses.created_at DESC';

  db.all(query, params, (err, courses) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Error fetching courses' });
    }
    
    db.all('SELECT * FROM course_categories', [], (err2, categories) => {
      res.json({ success: true, courses, categories });
    });
  });
});

router.get('/categories', (req, res) => {
  db.all('SELECT * FROM course_categories', [], (err, categories) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Error fetching categories' });
    }
    res.json({ success: true, categories });
  });
});

router.post('/create', authenticateToken, requireRole('teacher'), (req, res) => {
  const { title, description, what_you_will_learn, category_id } = req.body;

  if (!title || !description) {
    return res.status(400).json({ 
      success: false, 
      error: 'Title and description are required' 
    });
  }

  db.run(
    'INSERT INTO courses (teacher_id, title, description, what_you_will_learn, category_id) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, description, what_you_will_learn, category_id || null],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Error creating course' 
        });
      }
      res.json({ 
        success: true, 
        courseId: this.lastID,
        message: 'Course created successfully' 
      });
    }
  );
});

router.get('/:id', optionalAuth, (req, res) => {
  db.get(`
    SELECT courses.*, users.full_name as teacher_name, course_categories.name as category_name,
    (SELECT COUNT(*) FROM course_lessons WHERE course_id = courses.id) as lesson_count,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as student_count
    FROM courses 
    JOIN users ON courses.teacher_id = users.id
    LEFT JOIN course_categories ON courses.category_id = course_categories.id
    WHERE courses.id = ?
  `, [req.params.id], (err, course) => {
    if (err || !course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    db.all('SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order', [req.params.id], (err2, lessons) => {
      let isEnrolled = false;
      
      if (req.user && req.user.role === 'student') {
        db.get('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, req.params.id], (err3, enrollment) => {
          isEnrolled = !!enrollment;
          res.json({ success: true, course, lessons, isEnrolled });
        });
      } else {
        res.json({ success: true, course, lessons, isEnrolled });
      }
    });
  });
});

router.post('/:id/enroll', authenticateToken, requireRole('student'), (req, res) => {
  db.run(
    'INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
    [req.user.id, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Error enrolling in course' });
      }
      res.json({ success: true, message: 'Enrolled successfully' });
    }
  );
});

router.get('/:id/manage', authenticateToken, requireRole('teacher'), (req, res) => {
  db.get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.id], (err, course) => {
    if (err || !course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    db.all('SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order', [req.params.id], (err2, lessons) => {
      res.json({ success: true, course, lessons });
    });
  });
});

router.post('/:id/lessons', authenticateToken, requireRole('teacher'), (req, res) => {
  const { title, youtube_url, lesson_order } = req.body;

  db.run(
    'INSERT INTO course_lessons (course_id, title, youtube_url, lesson_order) VALUES (?, ?, ?, ?)',
    [req.params.id, title, youtube_url, lesson_order || 1],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Error adding lesson' });
      }
      res.json({ success: true, lessonId: this.lastID, message: 'Lesson added successfully' });
    }
  );
});

router.get('/:courseId/lessons/:lessonId', authenticateToken, (req, res) => {
  db.get('SELECT * FROM course_lessons WHERE id = ? AND course_id = ?', [req.params.lessonId, req.params.courseId], (err, lesson) => {
    if (err || !lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    db.get('SELECT * FROM courses WHERE id = ?', [req.params.courseId], (err2, course) => {
      db.all('SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order', [req.params.courseId], (err3, allLessons) => {
        
        if (req.user.role === 'student') {
          db.get('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, req.params.courseId], (err4, enrollment) => {
            if (!enrollment) {
              return res.status(403).json({ success: false, error: 'Not enrolled in this course' });
            }
            
            db.get('SELECT * FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', [req.user.id, req.params.lessonId], (err5, progress) => {
              res.json({ success: true, lesson, course, allLessons, progress });
            });
          });
        } else {
          res.json({ success: true, lesson, course, allLessons, progress: null });
        }
      });
    });
  });
});

router.post('/:courseId/lessons/:lessonId/complete', authenticateToken, requireRole('student'), (req, res) => {
  db.run(
    'INSERT OR REPLACE INTO lesson_progress (student_id, lesson_id, completed, completed_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP)',
    [req.user.id, req.params.lessonId],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Error marking lesson complete' });
      }
      res.json({ success: true, message: 'Lesson marked as complete' });
    }
  );
});

module.exports = router;
