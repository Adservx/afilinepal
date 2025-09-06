# Ecommerce Admin Panel

A React web app where admins can paste ecommerce URLs to automatically extract and store product details.

## Features

- Paste any ecommerce product URL
- Automatically scrapes product title, price, image, and description
- Stores data in MongoDB
- View all scraped products in a grid layout
- Delete products from the database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

This will start both the Express server (port 5000) and React app (port 3000).

## Usage

1. Open http://localhost:3000
2. Paste any ecommerce product URL (Amazon, eBay, etc.)
3. Click "Add Product" to scrape and save the product details
4. View all products in the grid below
5. Click "Delete" to remove products

## MongoDB Connection

The app connects to your MongoDB cluster using the provided connection string. Make sure your database is accessible and the credentials are correct.