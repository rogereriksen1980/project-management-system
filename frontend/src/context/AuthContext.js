import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: true
  });

  useEffect(() => {
    const loadUser = async () => {
      if (auth.token) {
        try {
          // Set auth token header
          if (auth.token) {
            api.defaults.headers.common['x-auth-token'] = auth.token;
          }
          
          const res = await api.get('/api/auth/me');
          
          setAuth({
            ...auth,
            isAuthenticated: true,
            user: res.data,
            loading: false
          });
        } catch (err) {
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
      } else {
        setAuth({
          ...auth,
          isAuthenticated: false,
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
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setAuth({
        ...auth,
        token: res.data.token,
        isAuthenticated: true,
        user: res.data.user,
        loading: false
      });
      
      return true;
    } catch (err) {
      return false;
    }
  };

  // Register
  const register = async (formData) => {
    try {
      const res = await api.post('/api/auth/register', formData);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setAuth({
        ...auth,
        token: res.data.token,
        isAuthenticated: true,
        user: res.data.user,
        loading: false
      });
      
      return true;
    } catch (err) {
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
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
