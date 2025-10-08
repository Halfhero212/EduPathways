// API Configuration
// IMPORTANT: Replace 'your-app-name' with your actual Render service name after deployment
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://edu-pathways-backend.vercel.app/';

export default API_URL;
