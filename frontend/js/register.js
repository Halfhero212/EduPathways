import Auth from './auth.js';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const full_name = document.getElementById('full_name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  const result = await Auth.register(full_name, email, password, role);
  
  if (result.success) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = 'Account created successfully! Redirecting to login...';
    successDiv.classList.remove('d-none');
    
    setTimeout(() => {
      window.location.href = './login.html';
    }, 2000);
  } else {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = result.error;
    errorDiv.classList.remove('d-none');
  }
});
