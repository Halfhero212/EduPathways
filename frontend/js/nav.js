import Auth from './auth.js';

export function setupNavigation(currentPage = '') {
  const user = Auth.getUser();
  
  const basePath = currentPage === 'catalog' ? '.' : '..';
  
  if (!user) {
    return `
      <li class="nav-item">
        <a class="nav-link ${currentPage === 'catalog' ? 'active' : ''}" href="${basePath}/index.html"><i class="fas fa-book me-1"></i> Browse Courses</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="${basePath}/pages/login.html"><i class="fas fa-sign-in-alt me-1"></i> Login</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="${basePath}/pages/register.html"><i class="fas fa-user-plus me-1"></i> Sign Up</a>
      </li>
    `;
  }
  
  return `
    <li class="nav-item">
      <a class="nav-link ${currentPage === 'catalog' ? 'active' : ''}" href="${basePath}/index.html"><i class="fas fa-book me-1"></i> Browse Courses</a>
    </li>
    <li class="nav-item">
      <a class="nav-link ${currentPage === 'my-courses' ? 'active' : ''}" href="${basePath}/pages/my-courses.html"><i class="fas fa-folder me-1"></i> My Courses</a>
    </li>
    <li class="nav-item">
      <a class="nav-link ${currentPage === 'dashboard' ? 'active' : ''}" href="${basePath}/pages/dashboard.html"><i class="fas fa-chart-line me-1"></i> Dashboard</a>
    </li>
    <li class="nav-item">
      <span class="nav-link"><i class="fas fa-user me-1"></i> ${user.full_name}</span>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-1"></i> Logout</a>
    </li>
  `;
}

export function attachLogoutHandler() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }
}
