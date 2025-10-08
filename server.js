require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init-postgres');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize PostgreSQL database
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// API Routes (PostgreSQL-based)
const apiAuthRoutes = require('./routes/api/auth');
const apiDashboardRoutes = require('./routes/api/dashboard');
const apiCourseRoutes = require('./routes/api/courses');
const apiMyCoursesRoutes = require('./routes/api/my-courses');

app.use('/api/auth', apiAuthRoutes);
app.use('/api/dashboard', apiDashboardRoutes);
app.use('/api/courses', apiCourseRoutes);
app.use('/api/my-courses', apiMyCoursesRoutes);

// Legacy EJS routes (only for local development, not deployed to Vercel)
if (process.env.NODE_ENV !== 'production') {
  const authRoutes = require('./routes/auth');
  const dashboardRoutes = require('./routes/dashboard');
  const courseRoutes = require('./routes/courses');
  const myCoursesRoutes = require('./routes/my-courses');

  app.use('/', authRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/courses', courseRoutes);
  app.use('/my-courses', myCoursesRoutes);
}

app.get('/', (req, res) => {
  res.redirect('/courses');
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
