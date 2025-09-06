require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const puppeteer = require('puppeteer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://imserv67:gogo%40%23123@cluster0.igvyhft.mongodb.net/affiliate-store?retryWrites=true&w=majority&appName=Cluster0');

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
    const { url } = req.body;
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: process.env.NODE_ENV === 'production' ? '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome' : undefined
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const productData = await page.evaluate(() => {
      const getTextContent = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return element.textContent.trim();
        }
        return '';
      };

      const getImageSrc = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
        }
        return '';
      };

      return {
        title: getTextContent([
          'h1[data-spm-anchor-id]',
          '.pdp-mod-product-badge-title',
          'h1',
          '.product-title',
          '[data-testid="product-title"]',
          '.title'
        ]),
        price: getTextContent([
          '.pdp-price',
          '.price-current',
          '.notranslate',
          '.price',
          '.product-price',
          '[data-testid="price"]',
          '.cost'
        ]),
        description: getTextContent([
          '.html-content',
          '.pdp-product-desc',
          '.description',
          '.product-description',
          '[data-testid="description"]'
        ]),
        image: getImageSrc([
          '.gallery-preview-panel img',
          '.pdp-mod-common-image img',
          'img[alt*="product"]',
          '.product-image img',
          'img'
        ])
      };
    });

    await browser.close();

    if (!productData.title && !productData.price) {
      throw new Error('Could not extract product data from this URL');
    }

    const product = new Product({
      ...productData,
      url
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
app.get('/api/products', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
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
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));