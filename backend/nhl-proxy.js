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

// Create a new player and persist to MongoDB
app.post('/players', express.json(), async (req, res) => {
  try {
    const player = req.body;
    if (!player) return res.status(400).json({ error: 'Missing player body' });
    const result = await db.collection('players').insertOne(player);
    // Read back the inserted document
    const inserted = await db.collection('players').findOne({ _id: result.insertedId });
    // Ensure an `id` string field exists for frontend consistency
    const idString = result.insertedId.toString();
    await db.collection('players').updateOne({ _id: result.insertedId }, { $set: { id: idString } });
    const saved = await db.collection('players').findOne({ _id: result.insertedId });
    res.json({ insertedId: idString, player: saved });
  } catch (err) {
    console.error('Failed to create player', err);
    res.status(500).json({ error: 'Failed to create player' });
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

// PATCH endpoint to remove (undraft) a player from a manager's players array
app.patch('/drafts/:id/undraft', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { managerPosition, pickIndex, playerId } = req.body;
    if (typeof managerPosition !== 'number') {
      return res.status(400).json({ error: 'Missing managerPosition' });
    }
    const { ObjectId } = require('mongodb');
    let query = { _id: new ObjectId(id) };
    let draft = await db.collection('drafts').findOne(query);
    if (!draft) {
      query = { id };
      draft = await db.collection('drafts').findOne(query);
    }
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const managers = Array.isArray(draft.managers) ? draft.managers : [];
    const manager = managers[managerPosition];
    if (!manager) return res.status(400).json({ error: 'Invalid managerPosition' });
    const players = Array.isArray(manager.players) ? manager.players : [];

    // Determine which player to remove
    let removed = null;
    if (typeof pickIndex === 'number' && players[pickIndex]) {
      removed = players[pickIndex];
    } else if (playerId) {
      removed = players.find(p => p && (p.id === playerId || p._id === playerId));
    } else {
      // default: remove last player
      removed = players[players.length - 1] || null;
    }

    if (!removed) return res.status(404).json({ error: 'Player to remove not found' });

    // Remove the player from the manager's players array using $pull by id
    await db.collection('drafts').updateOne(query, {
      $pull: { [`managers.${managerPosition}.players`]: { id: removed.id } }
    });

    res.json({ success: true, removed });
  } catch (err) {
    console.error('Undraft failed', err);
    res.status(500).json({ error: 'Failed to undraft player' });
  }
});

// Delete a draft by ID
app.delete('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      query = { id };
    }
    const result = await db.collection('drafts').deleteOne(query);
    if (result.deletedCount === 0) {
      // try by string id if ObjectId failed to match
      if (query._id) {
        const fallback = await db.collection('drafts').deleteOne({ id });
        if (fallback.deletedCount === 0) return res.status(404).json({ error: 'Draft not found' });
      } else {
        return res.status(404).json({ error: 'Draft not found' });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

app.listen(PORT, () => {
  console.log(`NHL Proxy server running on http://localhost:${PORT}`);
});

// Proxy endpoint to fetch player stats from NHL API
app.get('/stats/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { position } = req.query;
    if (!playerId) return res.status(400).json({ error: 'Missing playerId' });
    // Choose endpoint depending on position (goalies use goalie endpoint)
    const base = 'https://api.nhle.com/stats/rest/en';
    const url = (position === 'G')
      ? `${base}/goalie/summary?sort=seasonId&cayenneExp=playerId=${playerId}`
      : `${base}/skater/summary?sort=seasonId&cayenneExp=playerId=${playerId}`;
    const fetch = global.fetch || (await import('node-fetch')).default;
    const r = await fetch(url);
    if (!r.ok) {
      const body = await r.text();
      return res.status(502).json({ error: 'Failed fetching NHL stats', status: r.status, body });
    }
    const json = await r.json();
    res.json(json);
  } catch (err) {
    console.error('Stats proxy error', err);
    res.status(500).json({ error: 'Stats proxy failed' });
  }
});