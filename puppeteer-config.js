const puppeteer = require('puppeteer');

const getBrowserConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      executablePath: '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };
  }
  return {};
};

module.exports = { getBrowserConfig };