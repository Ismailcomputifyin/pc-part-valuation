// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// 🟣 GameLoot scraper
async function searchGameloot(q) {
  try {
    const { data } = await axios.get(`https://gameloot.in/shop/?s=${encodeURIComponent(q)}`);
    const $ = cheerio.load(data);
    const prices = [];
    $('.product').each((i, el) => {
      const txt = $(el).find('.price').text().trim().replace(/₹|,|\s/g, '');
      const p = parseInt(txt);
      if (p) prices.push(p);
    });
    return prices;
  } catch { return []; }
}

// 🟣 GameNation scraper
async function searchGamenation(q) {
  try {
    const { data } = await axios.get(`https://gamenation.in/PCComponents/?SearchTerm=${encodeURIComponent(q)}`);
    const $ = cheerio.load(data);
    const prices = [];
    $('.card-price, .ProductPrice').each((i, el) => {
      const txt = $(el).text().replace(/₹|,|\s/g, '');
      const p = parseInt(txt);
      if (p) prices.push(p);
    });
    return prices;
  } catch { return []; }
}

// 🟣 OLX India scraper
async function searchOLX(q) {
  try {
    const { data } = await axios.get(`https://www.olx.in/items/q-${encodeURIComponent(q.replace(/\s+/g, '-'))}`);
    const $ = cheerio.load(data);
    const prices = [];
    $('span._89yzn').each((i, el) => {
      const txt = $(el).text().replace(/₹|,|\s/g, '');
      const p = parseInt(txt);
      if (p) prices.push(p);
    });
    return prices;
  } catch { return []; }
}

// 🟣 eBay USA scraper
async function searchEbay(q) {
  try {
    const { data } = await axios.get(`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`);
    const $ = cheerio.load(data);
    const prices = [];
    $('.s-item__price').each((i, el) => {
      const txt = $(el).text().replace(/[\$,]/g, '');
      const val = parseFloat(txt);
      if (val) prices.push(Math.round(val * 85)); // Approx ₹85 per USD
    });
    return prices;
  } catch { return []; }
}

// API Endpoint
app.get('/valuation', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing ?query= parameter' });

  const [g1, g2, o, e] = await Promise.all([
    searchGameloot(query),
    searchGamenation(query),
    searchOLX(query),
    searchEbay(query),
  ]);
  const all = [...g1, ...g2, ...o, ...e];
  if (!all.length) return res.status(404).json({ error: 'No prices found' });

  const low = Math.min(...all), high = Math.max(...all);
  const avg = Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  res.json({ low, high, avg, count: all.length });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
