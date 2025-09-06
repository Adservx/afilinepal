import React, { useState } from 'react';
import Auth from './Auth';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import './App.css';

function App() {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      return null;
    }
  });

  const handleLogin = (newToken, newUser) => {
    try {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    setToken(null);
    setUser(null);
  };



  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard token={token} user={user} onLogout={handleLogout} />;
  } else if (user?.role === 'user') {
    return <UserDashboard token={token} user={user} onLogout={handleLogout} />;
  }

  return <div>Loading...</div>;
}

export default App;