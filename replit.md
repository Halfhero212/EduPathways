# School Learning Platform

## Overview
A prototype school learning platform built with Node.js, Express, SQLite, and EJS. The platform supports role-based access for Teachers and Students with lesson management, task assignments, and student submissions.

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Authentication**: JWT with bcrypt password hashing
- **Frontend**: EJS templates with Bootstrap 5
- **Session Management**: Cookie-based JWT tokens

## Features Implemented
- User registration and login with role selection (Teacher/Student)
- JWT-based authentication with secure password hashing
- Role-based dashboards showing different views for Teachers vs Students
- Teacher features:
  - Upload YouTube lesson links
  - Create tasks/assignments with deadlines
  - View student submissions
- Student features:
  - View all lessons with embedded YouTube player
  - Submit text responses to tasks
  - Track submission status
- YouTube video protection:
  - Right-click disabled
  - Developer tools keyboard shortcuts blocked
  - Modest branding and no related videos in embed
- Bootstrap-styled responsive UI

## Project Structure
```
├── server.js                 # Main Express server
├── database/
│   ├── init.js              # SQLite database initialization
│   └── school.db            # SQLite database file (auto-generated)
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Login/Register routes
│   ├── dashboard.js         # Dashboard routes
│   ├── lessons.js           # Lesson management routes
│   └── tasks.js             # Task management routes
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard-teacher.ejs
│   ├── dashboard-student.ejs
│   ├── lessons.ejs
│   ├── create-lesson.ejs
│   ├── lesson-view.ejs
│   ├── tasks-teacher.ejs
│   ├── tasks-student.ejs
│   ├── create-task.ejs
│   └── task-view.ejs
└── public/
    └── css/
        └── style.css
```

## Database Schema
- **users**: id, email, password, full_name, role (teacher/student), created_at
- **lessons**: id, teacher_id, title, youtube_url, description, created_at
- **tasks**: id, teacher_id, title, description, deadline, created_at
- **submissions**: id, task_id, student_id, response, submitted_at

## Environment Variables
- `SESSION_SECRET`: JWT signing secret (stored in Replit Secrets)
- `PORT`: Server port (defaults to 5000)

## Email Notifications
**Note**: Email notification integration (Resend/SendGrid) was proposed but not set up. To add email notifications in the future:
1. Set up a Resend or SendGrid integration via Replit connectors
2. Add notification logic in routes/lessons.js and routes/tasks.js
3. Send emails when teachers create new lessons or tasks

## How to Use
1. Visit the app and click "Register"
2. Create an account as either a Teacher or Student
3. Teachers can:
   - Create lessons by pasting YouTube URLs
   - Create tasks with descriptions and deadlines
   - View student submissions
4. Students can:
   - Browse and watch all lessons
   - View tasks and submit responses
   - Track submission status

## Security Features
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens stored in httpOnly cookies
- Role-based access control middleware
- Input validation on registration
- Protected video content (basic right-click and keyboard protection)

## Future Enhancements
- Admin role with teacher approval workflow
- File upload for student submissions
- Task grading system
- Class/course management
- Email notifications for new lessons and tasks
- Enhanced video protection
