import API_URL from './config.js';
import Auth from './auth.js';

let allCourses = [];
let categories = [];
let selectedCategory = '';

async function loadCourses() {
  try {
    const categoryParam = selectedCategory ? `?category=${selectedCategory}` : '';
    const response = await fetch(`${API_URL}/courses${categoryParam}`);
    const data = await response.json();
    
    if (data.success) {
      allCourses = data.courses;
      categories = data.categories;
      renderCategories();
      renderCourses(allCourses);
    }
  } catch (error) {
    console.error('Error loading courses:', error);
    document.getElementById('courseList').innerHTML = '<p class="text-danger">Error loading courses</p>';
  } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

function renderCategories() {
  const categoryList = document.getElementById('categoryList');
  const icons = {
    'Programming': 'fa-code',
    'Mathematics': 'fa-calculator',
    'Science': 'fa-flask',
    'Languages': 'fa-language',
    'Business': 'fa-briefcase',
    'Design': 'fa-palette'
  };
  
  categoryList.innerHTML = `
    <a href="#" class="list-group-item list-group-item-action ${!selectedCategory ? 'active' : ''}" data-category="">
      <i class="fas fa-th me-2"></i> All Courses
    </a>
    ${categories.map(cat => `
      <a href="#" class="list-group-item list-group-item-action ${selectedCategory == cat.id ? 'active' : ''}" data-category="${cat.id}">
        <i class="fas ${icons[cat.name] || 'fa-tag'} me-2"></i> ${cat.name}
      </a>
    `).join('')}
  `;
  
  document.querySelectorAll('[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectedCategory = e.currentTarget.dataset.category;
      loadCourses();
    });
  });
}

function renderCourses(courses) {
  const courseList = document.getElementById('courseList');
  
  if (courses.length === 0) {
    courseList.innerHTML = `
      <div class="col-12">
        <div class="empty-state fade-in">
          <i class="fas fa-book"></i>
          <h5>No courses found</h5>
          <p class="text-muted">Try a different category or search term</p>
        </div>
      </div>
    `;
    return;
  }
  
  courseList.innerHTML = courses.map(course => `
    <div class="col-md-6 mb-4">
      <div class="card h-100 course-card fade-in">
        <div class="course-card-header">
          <h5 class="mb-0">${course.title}</h5>
        </div>
        <div class="card-body d-flex flex-column">
          <p class="card-text flex-grow-1">${course.description.substring(0, 100)}...</p>
          <div class="course-meta mb-3">
            <span><i class="fas fa-user-tie"></i> ${course.teacher_name}</span>
            ${course.category_name ? `<span><i class="fas fa-tag"></i> ${course.category_name}</span>` : ''}
          </div>
          <div class="course-stats mb-3">
            <span class="badge bg-info"><i class="fas fa-play-circle me-1"></i> ${course.lesson_count} lessons</span>
            <span class="badge bg-success"><i class="fas fa-users me-1"></i> ${course.student_count} students</span>
          </div>
          <a href="./pages/course-detail.html?id=${course.id}" class="btn btn-primary w-100">
            <i class="fas fa-eye me-2"></i> View Course
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allCourses.filter(course => 
    course.title.toLowerCase().includes(searchTerm) || 
    course.description.toLowerCase().includes(searchTerm)
  );
  renderCourses(filtered);
});

if (Auth.isAuthenticated()) {
  const user = Auth.getUser();
  document.getElementById('navMenu').innerHTML = `
    <li class="nav-item">
      <a class="nav-link" href="./index.html"><i class="fas fa-book me-1"></i> Browse Courses</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="./pages/my-courses.html"><i class="fas fa-folder me-1"></i> My Courses</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="./pages/dashboard.html"><i class="fas fa-chart-line me-1"></i> Dashboard</a>
    </li>
    <li class="nav-item">
      <span class="nav-link"><i class="fas fa-user me-1"></i> ${user.full_name}</span>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-1"></i> Logout</a>
    </li>
  `;
  
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });
}

loadCourses();
