const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/koopa';
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db();
    const drafts = db.collection('drafts');

    const ROUNDS = 18;
    const teamCount = 2;
    // build managers with players such that there is exactly one pick left
    const totalPicks = ROUNDS * teamCount;
    const picksMade = totalPicks - 1; // one pick left

    // Distribute picksMade into managers arrays in snake order
    const managers = Array.from({ length: teamCount }).map((_, idx) => ({ name: `Team ${idx+1}`, position: idx + 1, players: [] }));

    // For simplicity, fill managers players sequentially
    let pick = 0;
    for (let round = 0; round < ROUNDS; round++) {
      for (let pos = 0; pos < teamCount; pos++) {
        if (pick >= picksMade) break;
        const roundIdx = round;
        const pickPos = (round % 2 === 1) ? (teamCount - 1 - pos) : pos;
        const manager = managers[pickPos];
        manager.players.push({ id: `seed-p${pick}`, firstName: { default: `P${pick}` }, lastName: { default: 'Seed' }, positionCode: 'C' });
        pick++;
      }
      if (pick >= picksMade) break;
    }

    const draft = {
      name: `Seed One-Away Draft ${Date.now()}`,
      managers,
      completed: false,
      started: new Date()
    };

    const res = await drafts.insertOne(draft);
    console.log('Inserted seed draft with id:', res.insertedId.toString());
    process.exit(0);
  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
