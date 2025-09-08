import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

function LandingPage({ user, onShowAuth, onLogout }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('Fetching from:', `${API_URL}/api/products`);
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      setProducts([]);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Ecommerce Product Catalog</h1>
        <div className="auth-buttons">
          {user ? (
            <div className="user-info">
              <span>Welcome, {user.email}</span>
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <button onClick={onShowAuth} className="login-btn">Login / Register</button>
          )}
        </div>
      </header>

      <div className="products-count">
        <p>Browse {products.length} products</p>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            {product.image && (
              <img src={product.image} alt={product.title} />
            )}
            <div className="product-info">
              <h3>{product.title}</h3>
              <p className="price">{product.price}</p>
              <p className="description">{product.description}</p>
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-btn"
              >
                Shop Now
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;