// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// 🔵 GameLoot scraper (single source now)
async function searchGameloot(q) {
  try {
    const url = `https://gameloot.in/shop/?s=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const prices = [];

    $('.product').each((_, el) => {
      const txt = $(el).find('.price')
                     .text()
                     .trim()
                     .replace(/₹|,|\s/g, '');
      const p = parseInt(txt);
      if (p) prices.push(p);
    });

    return prices;
  } catch (err) {
    console.error('GameLoot scrape error:', err.message);
    return [];
  }
}

app.get('/valuation', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing ?query= parameter' });

  const prices = await searchGameloot(query);
  if (!prices.length) return res.status(404).json({ error: 'No prices found on GameLoot' });

  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  res.json({
    source: 'gameloot',
    low, high, avg, count: prices.length,
  });
});

app.listen(PORT, () => console.log(`💸 GameLoot valuation API running on port ${PORT}`));
