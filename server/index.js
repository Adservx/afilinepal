require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const scrapeWithCheerio = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    
    const priceSelectors = [
      '.pdp-price', '.price-current', '.notranslate', '.price', '.product-price',
      '[data-testid="price"]', '.cost', '.sale-price', '.current-price',
      '.price-now', '.price-display', '.price-value', '.amount', '.currency',
      'span[class*="price"]', 'div[class*="price"]', '.price-box .price',
      '.price-wrapper .price', '[class*="Price"]', '[id*="price"]',
      '.money', '.price-range', '.regular-price', '.a-price-whole',
      '.a-price .a-offscreen', '.price-current-label', '.price-sales'
    ];
    
    const getPrice = () => {
      for (const selector of priceSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const text = $(elements[i]).text().trim();
          if (text && /[\$£€¥₹₽]|\d+[.,]\d+/.test(text)) {
            return text;
          }
        }
      }
      return '';
    };
    
    const getContent = (selectorArray) => {
      for (const selector of selectorArray) {
        const element = $(selector).first();
        if (element.length) {
          const text = element.text().trim();
          const src = element.attr('src') || element.attr('data-src');
          return text || src || '';
        }
      }
      return '';
    };
    
    return {
      title: getContent(['h1[data-spm-anchor-id]', '.pdp-mod-product-badge-title', 'h1', '.product-title', '[data-testid="product-title"]']),
      price: getPrice(),
      description: getContent(['.html-content', '.pdp-product-desc', '.description', '.product-description']),
      image: getContent(['.gallery-preview-panel img', '.pdp-mod-common-image img', 'img[alt*="product"]', '.product-image img'])
    };
  } catch (error) {
    throw new Error(`Scraping failed: ${error.message}`);
  }
};
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://imserv67:gogo%40%23123@cluster0.igvyhft.mongodb.net/affiliate-store?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Product schema
const productSchema = new mongoose.Schema({
  title: String,
  price: String,
  image: String,
  description: String,
  url: String,
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Auth routes
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role: role || 'user' });
    await user.save();
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey');
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey');
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Scrape product details (admin only)
app.post('/api/scrape', auth, adminAuth, async (req, res) => {
  try {
    const { url, price } = req.body;
    const productData = await scrapeWithCheerio(url);

    if (!productData.title && !productData.price && !price) {
      throw new Error('Could not extract product data from this URL');
    }

    const product = new Product({
      ...productData,
      price: price ? `Rs. ${price}` : productData.price,
      url
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (public)
app.get('/api/products', async (req, res) => {
  try {
    console.log('Fetching products...');
    const products = await Product.find().sort({ createdAt: -1 });
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product (admin only)
app.delete('/api/products/:id', auth, adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler: send back React's index.html file
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});



const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));