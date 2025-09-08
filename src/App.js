import React, { useState } from 'react';
import Auth from './Auth';
import AdminDashboard from './AdminDashboard';
import LandingPage from './LandingPage';
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
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = (newToken, newUser) => {
    try {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setShowAuth(false);
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

  if (showAuth) {
    return <Auth onLogin={handleLogin} onBack={() => setShowAuth(false)} />;
  }

  if (token && user?.role === 'admin') {
    return <AdminDashboard token={token} user={user} onLogout={handleLogout} />;
  }

  return <LandingPage user={user} onShowAuth={() => setShowAuth(true)} onLogout={handleLogout} />;
}

export default App;