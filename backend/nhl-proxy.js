const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/koopa';
let db;

const NHL_TEAM_ABBRS = [
  'ANA', 'BOS', 'BUF', 'CAR', 'CBJ', 'CGY', 'CHI', 'COL', 'DAL', 'DET',
  'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NJD', 'NSH', 'NYI', 'NYR', 'OTT',
  'PHI', 'PIT', 'SEA', 'SJS', 'STL', 'TBL', 'TOR', 'UTA', 'VAN', 'VGK',
  'WPG', 'WSH'
];

async function autoSeedIfEmpty(database) {
  try {
    const count = await database.collection('players').countDocuments();
    if (count > 0) return;
    console.log('Player database is empty. Auto-seeding player pool from NHL API...');
    const SEASON = '20242025';
    const fetch = global.fetch || (await import('node-fetch')).default;
    const allPlayers = [];

    for (const abbr of NHL_TEAM_ABBRS) {
      try {
        const res = await fetch(`https://api-web.nhle.com/v1/roster/${abbr}/${SEASON}`);
        if (!res.ok) continue;
        const data = await res.json();
        ['forwards', 'defensemen', 'goalies'].forEach(type => {
          if (Array.isArray(data[type])) {
            allPlayers.push(...data[type].map(p => ({ ...p, position: type, team: abbr })));
          }
        });
      } catch (e) {}
    }

    if (allPlayers.length > 0) {
      await database.collection('players').insertMany(allPlayers);
      console.log(`Successfully auto-seeded ${allPlayers.length} players.`);
    }
  } catch (err) {
    console.error('Auto-seed failed:', err);
  }
}

async function initDb() {
  try {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    db = client.db();
    console.log(`Connected to MongoDB at ${mongoUri}`);
    await autoSeedIfEmpty(db);
  } catch (err) {
    console.log('Local MongoDB not reachable. Launching in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const client = new MongoClient(uri);
      await client.connect();
      db = client.db('koopa');
      console.log(`Connected to in-memory MongoDB at ${uri}`);
      await autoSeedIfEmpty(db);
    } catch (memErr) {
      console.error('Failed to start in-memory MongoDB:', memErr);
      process.exit(1);
    }
  }
}

initDb();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

async function findDraftDoc(id) {
  if (!db) return null;
  let query = null;
  let draft = null;

  try {
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
      draft = await db.collection('drafts').findOne(query);
    }
  } catch (e) {
    query = null;
  }

  if (!draft) {
    query = { id };
    draft = await db.collection('drafts').findOne(query);
  }

  return draft ? { query, draft } : null;
}

app.get('/players', async (req, res) => {
  try {
    const players = await db.collection('players').find({}).toArray();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.post('/players', async (req, res) => {
  try {
    const player = req.body;
    if (!player) return res.status(400).json({ error: 'Missing player body' });
    const result = await db.collection('players').insertOne(player);
    const idString = result.insertedId.toString();
    await db.collection('players').updateOne({ _id: result.insertedId }, { $set: { id: idString } });
    const saved = await db.collection('players').findOne({ _id: result.insertedId });
    res.json({ insertedId: idString, player: saved });
  } catch (err) {
    console.error('Failed to create player', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

app.get('/drafts', async (req, res) => {
  try {
    const drafts = await db.collection('drafts').find({}).toArray();
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

app.get('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const match = await findDraftDoc(id);
    if (!match) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json(match.draft);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

app.post('/drafts', async (req, res) => {
  try {
    const draft = req.body;
    const result = await db.collection('drafts').insertOne(draft);
    res.json({ insertedId: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

app.patch('/drafts/:id/draft', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerPosition, player } = req.body;
    if (typeof managerPosition !== 'number' || !player) {
      return res.status(400).json({ error: 'Missing managerPosition or player' });
    }
    const match = await findDraftDoc(id);
    if (!match) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const update = {};
    update[`managers.${managerPosition}.players`] = player;
    await db.collection('drafts').updateOne(match.query, {
      $push: update
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to persist drafted player', err);
    res.status(500).json({ error: 'Failed to persist drafted player' });
  }
});

app.patch('/drafts/:id/undraft', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerPosition, pickIndex, playerId } = req.body;
    if (typeof managerPosition !== 'number') {
      return res.status(400).json({ error: 'Missing managerPosition' });
    }

    const match = await findDraftDoc(id);
    if (!match) return res.status(404).json({ error: 'Draft not found' });

    const draft = match.draft;
    const managers = Array.isArray(draft.managers) ? draft.managers : [];
    const manager = managers[managerPosition];
    if (!manager) return res.status(400).json({ error: 'Invalid managerPosition' });

    const players = Array.isArray(manager.players) ? [...manager.players] : [];
    if (players.length === 0) return res.status(400).json({ error: 'No players to undraft' });

    let removeIdx = -1;
    if (typeof pickIndex === 'number' && pickIndex >= 0 && pickIndex < players.length) {
      removeIdx = pickIndex;
    } else if (playerId) {
      removeIdx = players.findIndex(p => p && (p.id === playerId || p._id === playerId));
    }

    if (removeIdx === -1) {
      removeIdx = players.length - 1;
    }

    const removed = players.splice(removeIdx, 1)[0];

    await db.collection('drafts').updateOne(match.query, {
      $set: { [`managers.${managerPosition}.players`]: players }
    });

    res.json({ success: true, removed });
  } catch (err) {
    console.error('Undraft failed', err);
    res.status(500).json({ error: 'Failed to undraft player' });
  }
});

app.post('/drafts/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const match = await findDraftDoc(id);
    if (!match) return res.status(404).json({ error: 'Draft not found' });

    const draft = match.draft;
    await db.collection('drafts').updateOne(match.query, {
      $set: { completed: true, completedAt: new Date() }
    });

    const managers = Array.isArray(draft.managers) ? draft.managers : [];
    const lines = [];
    lines.push(`Draft Results for: ${draft.name || (draft.id || draft._id)}`);
    lines.push(`Completed: ${new Date().toLocaleString()}`);
    lines.push('');

    managers.forEach((m, idx) => {
      lines.push(`${m.name || `Team ${idx + 1}`}:`);
      const players = Array.isArray(m.players) ? m.players : [];
      if (players.length === 0) {
        lines.push('  (No players drafted)');
      } else {
        players.forEach((p, i) => {
          const first = p.firstName?.default || p.firstName || '';
          const last = p.lastName?.default || p.lastName || '';
          const name = `${first} ${last}`.trim() || p.id || 'Unknown';
          const pos = p.positionCode || p.position || '??';
          const team = p.team || p.teamName || '';
          const teamStr = team ? ` — ${team}` : '';
          lines.push(`  Round ${i + 1}: ${name} (${pos}${teamStr})`);
        });
      }
      lines.push('');
    });

    const textBody = lines.join('\n');
    res.type('text/plain').send(textBody);
  } catch (err) {
    console.error('Complete draft failed', err);
    res.status(500).json({ error: 'Failed to complete draft' });
  }
});

app.delete('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const match = await findDraftDoc(id);
    if (!match) return res.status(404).json({ error: 'Draft not found' });

    await db.collection('drafts').deleteOne(match.query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

app.get('/stats/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { position } = req.query;
    if (!playerId) return res.status(400).json({ error: 'Missing playerId' });

    const fetch = global.fetch || (await import('node-fetch')).default;
    const base = 'https://api.nhle.com/stats/rest/en';

    if (position === 'G') {
      const url = `${base}/goalie/summary?sort=seasonId&cayenneExp=playerId=${playerId}`;
      const r = await fetch(url);
      if (!r.ok) {
        const body = await r.text();
        return res.status(502).json({ error: 'Failed fetching goalie stats', status: r.status, body });
      }
      const json = await r.json();
      return res.json(json);
    }

    const summaryUrl = `${base}/skater/summary?sort=seasonId&cayenneExp=playerId=${playerId}`;
    const realtimeUrl = `${base}/skater/realtime?sort=seasonId&cayenneExp=playerId=${playerId}`;

    const [summaryRes, realtimeRes] = await Promise.all([
      fetch(summaryUrl),
      fetch(realtimeUrl)
    ]);

    if (!summaryRes.ok) {
      const body = await summaryRes.text();
      return res.status(502).json({ error: 'Failed fetching skater summary stats', status: summaryRes.status, body });
    }

    const summaryJson = await summaryRes.json();
    const realtimeJson = realtimeRes.ok ? await realtimeRes.json() : { data: [] };

    const summaryData = Array.isArray(summaryJson.data) ? summaryJson.data : [];
    const realtimeData = Array.isArray(realtimeJson.data) ? realtimeJson.data : [];

    const realtimeMap = new Map();
    realtimeData.forEach(row => {
      if (row && row.seasonId) {
        realtimeMap.set(String(row.seasonId), row);
      }
    });

    const mergedData = summaryData.map(summaryRow => {
      const seasonKey = String(summaryRow.seasonId);
      const realtimeRow = realtimeMap.get(seasonKey) || {};
      return {
        ...summaryRow,
        hits: realtimeRow.hits !== undefined ? realtimeRow.hits : null,
        blockedShots: realtimeRow.blockedShots !== undefined ? realtimeRow.blockedShots : null,
        takeaways: realtimeRow.takeaways !== undefined ? realtimeRow.takeaways : null,
        giveaways: realtimeRow.giveaways !== undefined ? realtimeRow.giveaways : null
      };
    });

    res.json({ data: mergedData });
  } catch (err) {
    console.error('Stats proxy error', err);
    res.status(500).json({ error: 'Stats proxy failed' });
  }
});

app.listen(PORT, () => {
  console.log(`NHL Proxy server running on http://localhost:${PORT}`);
});