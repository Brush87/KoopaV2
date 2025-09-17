import React, { useState, useEffect } from 'react';
import './App.css';
import DraftCard from './DraftCard';

const TEAM_COUNT = 10;
const DEFAULT_TEAM_NAMES = [
  'Dragons', 'Sharks', 'Wolves', 'Falcons', 'Titans',
  'Knights', 'Raptors', 'Vikings', 'Pirates', 'Samurai'
];
const NHL_TEAM_ABBRS = [
  'ANA','UTA','BOS','BUF','CGY','CAR','CHI','COL','CBJ','DAL','DET','EDM','FLA','LAK','MIN','MTL','NSH','NJD','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','VAN','VGK','WPG','UTA'
];

function App() {
  // Timer constants
  const PICK_TIME = 90; // seconds
  // Removed unused OVERTIME constant
  // All hooks at top level
  const [teamNames, setTeamNames] = useState<string[]>([...DEFAULT_TEAM_NAMES]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [draftedPlayers, setDraftedPlayers] = useState<{[teamIdx: number]: any[]}>({});
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const ROUNDS = 16;
  const [search, setSearch] = useState('');
  const [timer, setTimer] = useState(PICK_TIME);
  const [timerActive, setTimerActive] = useState(true);

  // Handlers
  const handleChange = (index: number, value: string) => {
    const updated = [...teamNames];
    updated[index] = value;
    setTeamNames(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamNames.every(name => name.trim() !== '')) {
      setSubmitted(true);
    }
  };

  // Fetch NHL rosters
  useEffect(() => {
    const fetchRosters = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const allPlayers: any[] = [];
        await Promise.all(
          NHL_TEAM_ABBRS.map(async abbr => {
            const url = `http://localhost:4000/roster/${abbr}/20252026`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${abbr}`);
            const data = await res.json();
            ['forwards','defensemen','goalies'].forEach(type => {
              if (Array.isArray(data[type])) {
                allPlayers.push(...data[type].map((p: any) => ({...p, position: type, team: abbr})));
              }
            });
          })
        );
        setPlayers(allPlayers);
      } catch (err: any) {
        setFetchError(err.message || 'Error fetching rosters');
      } finally {
        setLoading(false);
      }
    };
    if (submitted) {
      fetchRosters();
    }
  }, [submitted]);

  // Initialize availablePlayers when players are loaded
  useEffect(() => {
    if (players.length > 0) {
      setAvailablePlayers([
        ...players
      ].sort((a, b) => {
        const nameA = (typeof a.firstName === 'string' ? a.firstName : '') + (typeof a.lastName === 'string' ? a.lastName : '');
        const nameB = (typeof b.firstName === 'string' ? b.firstName : '') + (typeof b.lastName === 'string' ? b.lastName : '');
        return nameA.localeCompare(nameB);
      }));
      setDraftedPlayers({});
      setCurrentTeamIdx(0);
      setTimer(PICK_TIME);
      setTimerActive(true);
    }
  }, [players]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive) return;
    if (availablePlayers.length === 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, availablePlayers.length]);

  // Reset timer on pick
  useEffect(() => {
    setTimer(PICK_TIME);
    setTimerActive(true);
  }, [currentTeamIdx]);

  // Draft a player for the current team
  const draftPlayer = (player: any) => {
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    setDraftedPlayers(prev => {
      const teamDrafts = prev[currentTeamIdx] || [];
      return { ...prev, [currentTeamIdx]: [...teamDrafts, player] };
    });
    setCurrentTeamIdx((prev) => (prev + 1) % TEAM_COUNT);
    setTimer(PICK_TIME);
    setTimerActive(true);
  };

  // UI
  if (!submitted) {
    return (
      <div className="App">
        <h2>Enter the names of all 10 Teams</h2>
        <form onSubmit={handleSubmit}>
          {teamNames.map((name, idx) => (
            <div key={idx}>
              <label>Team {idx + 1}: </label>
              <input
                type="text"
                value={name}
                onChange={e => handleChange(idx, e.target.value)}
                required
              />
            </div>
          ))}
          <button type="submit">Submit Teams</button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="App">
        <h2>Loading NHL rosters...</h2>
        <p>This may take a few moments.</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="App">
        <h2>Error loading rosters</h2>
        <p>{fetchError}</p>
      </div>
    );
  }

  // Timer color logic
  let timerColor = '#222';
  if (timer < 0) timerColor = 'red';
  else if (timer < 15) timerColor = 'orange';

  // Edge case: all players drafted
  if (availablePlayers.length === 0) {
    return (
      <div className="App">
        <h2>Draft Complete!</h2>
        <p>All players have been drafted.</p>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TEAM_COUNT}, 1fr)`, gap: '1rem', marginTop: 32 }}>
          {teamNames.map((team, idx) => (
            <div key={idx}>
              <strong>{team}</strong>
              <div style={{ display: 'grid', gridTemplateRows: `repeat(${ROUNDS}, 1fr)`, gap: '0.5rem' }}>
                {Array.from({ length: ROUNDS }).map((_, round) => (
                  <DraftCard key={`team${idx}-round${round}-player${(draftedPlayers[idx]||[])[round]?.id ?? round}`}
                    player={(draftedPlayers[idx] || [])[round]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filtered and sorted player list
  const uniquePlayersMap = new Map();
  availablePlayers.forEach(p => {
    if (p && p.id && !uniquePlayersMap.has(p.id)) {
      uniquePlayersMap.set(p.id, p);
    }
  });
  const uniquePlayers = Array.from(uniquePlayersMap.values());
  const filteredPlayers = uniquePlayers.filter(p => {
    const first = typeof p.firstName?.default === 'string' ? p.firstName.default.toLowerCase() : '';
    const last = typeof p.lastName?.default === 'string' ? p.lastName.default.toLowerCase() : '';
    const q = search.toLowerCase();
    return first.includes(q) || last.includes(q);
  }).sort((a, b) => {
    const nameA = ((typeof a.firstName?.default === 'string' ? a.firstName.default : '') + ' ' + (typeof a.lastName?.default === 'string' ? a.lastName.default : '')).toLowerCase();
    const nameB = ((typeof b.firstName?.default === 'string' ? b.firstName.default : '') + ' ' + (typeof b.lastName?.default === 'string' ? b.lastName.default : '')).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  console.log('FILTERED PLAYERS:', filteredPlayers);

  return (
    <div className="App">
      <h2>Fantasy Hockey Draft Board</h2>
      <p>Teams: {teamNames.join(', ')}</p>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Player List */}
        <div style={{ flex: 1 }}>
          <h3>Available Players ({filteredPlayers.length})</h3>
          <input
            type="text"
            placeholder="Search by first or last name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 4 }}
          />
          <ul style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 8 }}>
            {filteredPlayers.map(player => (
              <li key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span>{player.firstName?.default} {player.lastName?.default}</span>
                <button onClick={() => draftPlayer(player)}>Draft</button>
              </li>
            ))}
          </ul>
        </div>
        {/* Draft Board */}
        <div style={{ flex: 2 }}>
          <h3>Draft Board</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TEAM_COUNT}, 1fr)`, gap: '1rem' }}>
            {teamNames.map((team, idx) => (
              <div key={idx}>
                <strong>{team}</strong>
                <div style={{ display: 'grid', gridTemplateRows: `repeat(${ROUNDS}, 1fr)`, gap: '0.5rem' }}>
                  {Array.from({ length: ROUNDS }).map((_, round) => (
                    <DraftCard key={`team${idx}-round${round}-player${(draftedPlayers[idx]||[])[round]?.id ?? round}`}
                      player={(draftedPlayers[idx] || [])[round]} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <strong>Current Team: </strong>{teamNames[currentTeamIdx]}
            <span style={{ fontWeight: 'bold', fontSize: 20, color: timerColor, marginLeft: 16 }}>
              Timer: {timer >= 0 ? timer : `-${Math.abs(timer)}`}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
