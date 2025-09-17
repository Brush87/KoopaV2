
const express = require('express');
const app = express();
const PORT = 4000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/roster/:team/:season', async (req, res) => {
  const { team, season } = req.params;
  const url = `https://api-web.nhle.com/v1/roster/${team}/${season}`;
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch NHL roster', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`NHL Proxy server running on http://localhost:${PORT}`);
});