const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Dummy scraper functions for now
const searchGameloot = async (query) => [22000, 21000];
const searchGamenation = async (query) => [21500, 20500];
const searchOLX = async (query) => [20000];
const searchEbay = async (query) => [23000];

app.get('/valuation', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const [gameloot, gamenation, olx, ebay] = await Promise.all([
      searchGameloot(query),
      searchGamenation(query),
      searchOLX(query),
      searchEbay(query)
    ]);

    const allPrices = [...gameloot, ...gamenation, ...olx, ...ebay];
    if (allPrices.length === 0) return res.status(404).json({ error: 'No prices found' });

    const low = Math.min(...allPrices);
    const high = Math.max(...allPrices);
    const avg = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);

    res.json({
      low, high, avg, count: allPrices.length,
      sources: {
        gameloot: gameloot.length,
        gamenation: gamenation.length,
        olx: olx.length,
        ebay: ebay.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prices', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});