import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDashboard({ token, user, onLogout }) {
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/scrape`, { url, price }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUrl('');
      setPrice('');
      fetchProducts();
    } catch (error) {
      alert('Error scraping product: ' + error.response?.data?.error);
    }
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Admin Panel - Product Management</h1>
        <div className="user-info">
          <span>Admin: {user?.email}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="url-form">
        <form onSubmit={handleScrape}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste ecommerce product URL here..."
            required
          />
          <div className="price-input-wrapper">
            <span className="currency-prefix">Rs.</span>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price (optional)"
              className="price-input"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Scraping...' : 'Add Product'}
          </button>
        </form>
      </div>

      <div className="stats">
        <h3>Total Products: {products.length}</h3>
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
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                View Original
              </a>
              <button 
                className="delete-btn"
                onClick={() => deleteProduct(product._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;