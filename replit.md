# Learning Platform - Course Platform for Iraqi Students

## Overview
A Udemy-style course platform built with Node.js, Express, SQLite, and EJS. The platform allows teachers to create comprehensive courses with multiple lessons, and students can browse, enroll, and track their learning progress.

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Authentication**: JWT with bcrypt password hashing
- **Frontend**: EJS templates with Bootstrap 5
- **Session Management**: Cookie-based JWT tokens

## Features Implemented

### Course System
- **Course Catalog**: Browse all available courses with category filtering (Programming, Mathematics, Science, Languages, Business, Design)
- **Course Details**: View course information, lessons list, teacher info, and enrollment stats
- **Course Creation**: Teachers can create courses with title, description, category, and learning objectives
- **Course Management**: Teachers can add multiple lessons to their courses

### User Roles
- **Teachers**: Create courses, add lessons, manage course content, view enrolled students
- **Students**: Browse courses, enroll in courses, watch lessons, track progress

### Enrollment & Progress
- **One-Click Enrollment**: Students can enroll in courses for free
- **Progress Tracking**: Track lesson completion per student
- **My Courses Dashboard**: 
  - Teachers see their created courses with student count
  - Students see enrolled courses with progress bars

### Lesson System
- **YouTube Integration**: Embed YouTube videos for lessons
- **Course Navigation**: Sidebar showing all course lessons
- **Progress Marking**: Students can mark lessons as complete
- **Video Protection**: Basic right-click and dev tools protection

### Navigation & UI
- **Course Catalog**: Public page accessible to all users
- **My Courses**: Personalized view for enrolled courses (students) or created courses (teachers)
- **Dashboard**: Role-based metrics and quick actions
- **Responsive Design**: Bootstrap 5 with card-based layouts

## Project Structure
```
├── server.js                    # Main Express server
├── database/
│   ├── init.js                 # SQLite database schema
│   └── courses.db              # SQLite database (auto-generated)
├── middleware/
│   └── auth.js                 # JWT authentication middleware
├── routes/
│   ├── auth.js                 # Login/Register routes
│   ├── dashboard.js            # Dashboard routes
│   ├── courses.js              # Course catalog, details, management
│   └── my-courses.js           # My enrolled/created courses
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard-teacher.ejs
│   ├── dashboard-student.ejs
│   ├── course-catalog.ejs      # Browse all courses
│   ├── course-detail.ejs       # Single course page
│   ├── create-course.ejs       # Teacher creates course
│   ├── manage-course.ejs       # Teacher adds lessons
│   ├── my-courses-teacher.ejs  # Teacher's courses
│   ├── my-courses-student.ejs  # Student's enrolled courses
│   └── lesson-player.ejs       # Watch lesson with navigation
└── public/
    └── css/
        └── style.css
```

## Database Schema

### users
- id, email, password (bcrypt hashed), full_name, role (teacher/student), created_at

### course_categories
- id, name, description
- Pre-populated with: Programming, Mathematics, Science, Languages, Business, Design

### courses
- id, teacher_id, category_id, title, description, what_you_will_learn, thumbnail_url, created_at

### course_lessons
- id, course_id, title, youtube_url, lesson_order, duration_minutes, created_at

### enrollments
- id, student_id, course_id, enrolled_at
- Tracks which students are enrolled in which courses

### lesson_progress
- id, student_id, lesson_id, completed (boolean), completed_at
- Tracks individual lesson completion per student

## Environment Variables
- `SESSION_SECRET`: JWT signing secret (stored in Replit Secrets)
- `PORT`: Server port (defaults to 5000)

## How to Use

### For Teachers
1. Register as a Teacher
2. Create a course from Dashboard or My Courses page
3. Add lessons to your course (YouTube URLs)
4. Students can now enroll and learn
5. View student enrollments and manage content

### For Students
1. Register as a Student
2. Browse the Course Catalog (filter by category)
3. Click on a course to view details
4. Click "Enroll Now" to join the course
5. Start learning - click "Start Learning" to watch first lesson
6. Mark lessons as complete as you progress
7. View your enrolled courses and progress in "My Courses"

## Key Features

### Course Catalog
- Category-based filtering
- Course cards showing title, description, teacher, lesson count, student count
- Public access (login required to enroll)

### Course Management (Teachers)
- Create unlimited courses
- Add lessons in specific order
- Paste YouTube URLs for video content
- View enrollment statistics

### Learning Experience (Students)
- Enroll in multiple courses
- Track progress with completion percentage
- Navigate between lessons in sidebar
- Mark lessons as complete
- Continue where you left off

### Progress Tracking
- Lesson-level completion tracking
- Progress bars on My Courses page
- Dashboard shows total completed lessons
- Course-specific progress visible

## Security Features
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens stored in httpOnly cookies
- Role-based access control middleware
- Input validation on registration
- Protected video content (basic right-click and keyboard protection)
- Teachers can only manage their own courses
- Students must be enrolled to access lessons

## Email Notifications
**Note**: Email notification integration (Resend/SendGrid) was proposed but not set up. To add email notifications in the future:
1. Set up Resend or SendGrid integration via Replit connectors
2. Add notification logic when:
   - Teacher creates a new course
   - Teacher adds lessons to enrolled students' courses
   - Student completes a course

## Future Enhancements
- Course pricing and payment integration
- Course reviews and ratings
- Certificate generation on course completion
- Course completion badges
- Discussion forums per course
- Quizzes and assessments
- Course preview videos
- Teacher profiles and bios
- Advanced search and filtering
- Course recommendations
- Mobile app
