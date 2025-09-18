const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = 4000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/koopa';
let db;

MongoClient.connect(mongoUri, { useUnifiedTopology: true })
  .then(client => {
    db = client.db();
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Get all players from MongoDB
app.get('/players', async (req, res) => {
  try {
    const players = await db.collection('players').find({}).toArray();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get all drafts from MongoDB
app.get('/drafts', async (req, res) => {
  try {
    const drafts = await db.collection('drafts').find({}).toArray();
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Add a new draft
app.post('/drafts', express.json(), async (req, res) => {
  try {
    const draft = req.body;
    const result = await db.collection('drafts').insertOne(draft);
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

app.listen(PORT, () => {
  console.log(`NHL Proxy server running on http://localhost:${PORT}`);
});