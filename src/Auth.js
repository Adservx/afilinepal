import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function Auth({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email,
        password,
        ...(isLogin ? {} : { role: 'user' })
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.token, response.data.user);
    } catch (error) {
      alert(error.response?.data?.error || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        {onBack && (
          <button className="back-btn" onClick={onBack}>← Back</button>
        )}
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            className="toggle-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;