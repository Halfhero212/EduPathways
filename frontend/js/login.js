import Auth from './auth.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const result = await Auth.login(email, password);
  
  if (result.success) {
    window.location.href = './dashboard.html';
  } else {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = result.error;
    errorDiv.classList.remove('d-none');
  }
});
