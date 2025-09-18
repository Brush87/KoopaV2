// mongo-init.js
const { MongoClient } = require('mongodb');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const NHL_TEAM_ABBRS = [
  'ANA','UTA','BOS','BUF','CGY','CAR','CHI','COL','CBJ','DAL','DET','EDM','FLA','LAK','MIN','MTL','NSH','NJD','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','VAN','VGK','WPG','UTA'
];
const SEASON = '20242025'; // Use a valid season
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/koopa';

async function fetchAllPlayers() {
  const allPlayers = [];
  for (const abbr of NHL_TEAM_ABBRS) {
    const url = `https://api-web.nhle.com/v1/roster/${abbr}/${SEASON}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to fetch ${abbr}: ${res.status} ${body}`);
      }
      const data = await res.json();
      ['forwards','defensemen','goalies'].forEach(type => {
        if (Array.isArray(data[type])) {
          allPlayers.push(...data[type].map(p => ({...p, position: type, team: abbr})));
        }
      });
    } catch (err) {
      console.error(`Error fetching ${abbr}:`, err.message);
    }
  }
  return allPlayers;
}

async function main() {
  const { v4: uuidv4 } = await import('uuid');
  const client = await MongoClient.connect(mongoUri, { useUnifiedTopology: true });
  const db = client.db();
  const players = await fetchAllPlayers();
  await db.collection('players').deleteMany({});
  await db.collection('players').insertMany(players);
  console.log(`Inserted ${players.length} players.`);

  // Insert a sample draft
  await db.collection('drafts').deleteMany({});
  const sampleDraft = {
    id: uuidv4(),
    managers: [
      {
        name: 'Alice',
        position: 1,
        players: [
          {
            ...players[0],
            pick: 1
          }
        ]
      },
      {
        name: 'Bob',
        position: 2,
        players: [
          {
            ...players[1],
            pick: 2
          }
        ]
      }
    ],
    completed: false,
    started: new Date()
  };
  await db.collection('drafts').insertOne(sampleDraft);
  console.log('Inserted sample draft.');
  await client.close();
}

main().catch(console.error);
