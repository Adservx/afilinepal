const puppeteer = require('puppeteer-core');
const chromium = require('chromium');

const getBrowserConfig = () => ({
  executablePath: chromium.path,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ]
});

module.exports = { getBrowserConfig };