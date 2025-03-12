import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token for all requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['x-auth-token'] = token;
  console.log('Token set in API utility:', token);
}

// Add a response interceptor for handling auth errors
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request detected:', error.response.data);
      
      // Only clear tokens if we're not on the login page already
      if (!window.location.pathname.includes('/login')) {
        console.log('Clearing authentication data due to 401 error');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
