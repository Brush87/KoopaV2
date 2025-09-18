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

// Get all drafts from MongoDB
app.get('/drafts', async (req, res) => {
  try {
    const drafts = await db.collection('drafts').find({}).toArray();
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Get a single draft by ID
app.get('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    // Try ObjectId, fallback to string
    try {
      const { ObjectId } = require('mongodb');
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { id };
    }
    let draft = await db.collection('drafts').findOne(query);
    // If not found by ObjectId, try by string id
    if (!draft) {
      draft = await db.collection('drafts').findOne({ id });
    }
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json(draft);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch draft' });
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

// PATCH endpoint to persist a drafted player to a manager's players array
app.patch('/drafts/:id/draft', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { managerPosition, player } = req.body;
    if (typeof managerPosition !== 'number' || !player) {
      return res.status(400).json({ error: 'Missing managerPosition or player' });
    }
    const { ObjectId } = require('mongodb');
    // Find draft by ObjectId or string id
    let query = { _id: new ObjectId(id) };
    let draft = await db.collection('drafts').findOne(query);
    if (!draft) {
      query = { id };
      draft = await db.collection('drafts').findOne(query);
    }
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    // Update the correct manager's players array
    const update = {};
    update[`managers.${managerPosition}.players`] = player;
    await db.collection('drafts').updateOne(query, {
      $push: update
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to persist drafted player' });
  }
});

app.listen(PORT, () => {
  console.log(`NHL Proxy server running on http://localhost:${PORT}`);
});