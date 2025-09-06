import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserDashboard({ token, user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      (product.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Product Catalog</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="search-input"
        />
      </div>

      <div className="products-count">
        <p>Showing {filteredProducts.length} of {products.length} products</p>
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card user-card">
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
                View Product
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserDashboard;