import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    isAuthenticated: localStorage.getItem('token') ? true : false,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: true
  });

  useEffect(() => {
    // Configure axios with the token
    if (auth.token) {
      api.defaults.headers.common['x-auth-token'] = auth.token;
    } else {
      delete api.defaults.headers.common['x-auth-token'];
    }
  }, [auth.token]);

  useEffect(() => {
    const loadUser = async () => {
      // If no token, skip loading user
      if (!auth.token) {
        setAuth({
          ...auth,
          isAuthenticated: false,
          loading: false
        });
        return;
      }

      try {
        console.log('Loading user with token:', auth.token);
        const res = await api.get('/api/auth/me');
        console.log('User loaded successfully:', res.data);
        
        setAuth({
          ...auth,
          isAuthenticated: true,
          user: res.data,
          loading: false
        });
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setAuth({
          ...auth,
          token: null,
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };
    
    loadUser();
    // eslint-disable-next-line
  }, []);

  // Login
  const login = async (formData) => {
    try {
      const res = await api.post('/api/auth/login', formData);
      console.log('Login successful:', res.data);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Set auth header for next requests
      api.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setAuth({
        ...auth,
        token: res.data.token,
        isAuthenticated: true,
        user: res.data.user,
        loading: false
      });
      
      return { success: true };
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Login failed'
      };
    }
  };

  // Register
  const register = async (formData) => {
    try {
      const res = await api.post('/api/auth/register', formData);
      console.log('Registration successful:', res.data);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Set auth header for next requests
      api.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setAuth({
        ...auth,
        token: res.data.token,
        isAuthenticated: true,
        user: res.data.user,
        loading: false
      });
      
      return { success: true };
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Logout
  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['x-auth-token'];
    
    setAuth({
      ...auth,
      token: null,
      isAuthenticated: false,
      user: null
    });
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
