import React, { useState, useEffect } from 'react';
import './App.css';
import DraftCard from './DraftCard';

// ...existing code...

function LandingPage({ onContinue }: { onContinue: (draftId: string) => void }) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [teamCount, setTeamCount] = useState(10);
  const [teamNames, setTeamNames] = useState<string[]>(Array(10).fill('').map((_, i) => `Team ${i + 1}`));
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDrafts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:4000/drafts');
        if (!res.ok) throw new Error('Failed to fetch drafts');
        const allDrafts = await res.json();
        setDrafts(allDrafts.filter((d: any) => !d.completed));
      } catch (err: any) {
        setError(err.message || 'Error fetching drafts');
      } finally {
        setLoading(false);
      }
    }
    fetchDrafts();
  }, []);

  const handleTeamCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(2, Math.min(20, Number(e.target.value)));
    setTeamCount(count);
    setTeamNames(prev => {
      const arr = Array(count).fill('').map((_, i) => prev[i] || `Team ${i + 1}`);
      return arr;
    });
  };

  const handleTeamNameChange = (idx: number, value: string) => {
    setTeamNames(prev => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const managers = teamNames.map((name, idx) => ({ name, position: idx + 1, players: [] }));
      const draft = {
        name: draftName,
        managers,
        completed: false,
        started: new Date()
      };
      const res = await fetch('http://localhost:4000/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      if (!res.ok) throw new Error('Failed to create draft');
      const result = await res.json();
      setShowForm(false);
      setDraftName('');
      setTeamCount(10);
      setTeamNames(Array(10).fill('').map((_, i) => `Team ${i + 1}`));
      // Refresh drafts
      const allDrafts = await (await fetch('http://localhost:4000/drafts')).json();
      setDrafts(allDrafts.filter((d: any) => !d.completed));
      // Select the new draft and render board
      onContinue(result.insertedId || result._id || result.id);
    } catch (err: any) {
      setCreateError(err.message || 'Error creating draft');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="App"><h2>Loading drafts...</h2></div>;
  if (error) return <div className="App"><h2>Error loading drafts</h2><p>{error}</p></div>;

  return (
    <div className="App">
      <h2>Available Drafts</h2>
      {drafts.length === 0 ? <p>No active drafts found.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {drafts.map(draft => (
            <li key={draft.id || draft._id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span>Draft ID: {draft.id || draft._id} {draft.name ? `| ${draft.name}` : ''}</span>
              <button onClick={() => onContinue(draft.id || draft._id)}>Continue</button>
            </li>
          ))}
        </ul>
      )}
      <button style={{ marginTop: 24 }} onClick={() => setShowForm(true)}>Create New Draft</button>
      {showForm && (
        <form onSubmit={handleCreateDraft} style={{ marginTop: 24, border: '1px solid #ccc', padding: 16, borderRadius: 8, maxWidth: 400 }}>
          <h3>Create New Draft</h3>
          <label>Draft Name:<br />
            <input type="text" value={draftName} onChange={e => setDraftName(e.target.value)} required style={{ width: '100%', marginBottom: 8 }} />
          </label>
          <label>Number of Teams:<br />
            <input type="number" min={2} max={20} value={teamCount} onChange={handleTeamCountChange} required style={{ width: '100%', marginBottom: 8 }} />
          </label>
          {Array.from({ length: teamCount }).map((_, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <label>Team {idx + 1} Name:<br />
                <input type="text" value={teamNames[idx] || ''} onChange={e => handleTeamNameChange(idx, e.target.value)} required style={{ width: '100%' }} />
              </label>
            </div>
          ))}
          <button type="submit" disabled={creating} style={{ marginTop: 12 }}>Create</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 8 }}>Cancel</button>
          {createError && <p style={{ color: 'red' }}>{createError}</p>}
        </form>
      )}
    </div>
  );
}

function App() {
  // Timer constants
  const PICK_TIME = 90; // seconds
  const ROUNDS = 16;
  // State for draft selection
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [draftedPlayers, setDraftedPlayers] = useState<{[teamIdx: number]: any[]}>({});
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [timer, setTimer] = useState(PICK_TIME);
  const [timerActive, setTimerActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // When a draft is selected, fetch draft info and players
  useEffect(() => {
    async function fetchDraftAndPlayers() {
      if (!selectedDraftId) return;
      setLoading(true);
      setFetchError(null);
      try {
        // Fetch draft info
        const draftRes = await fetch(`http://localhost:4000/drafts/${selectedDraftId}`);
        if (!draftRes.ok) throw new Error('Failed to fetch draft info');
        const draftData = await draftRes.json();
        // Set team names from draft managers
        const managers = Array.isArray(draftData.managers) ? draftData.managers : [];
        setTeamNames(managers.map((m: any) => m.name));
        // Fetch all players from backend
        const playersRes = await fetch('http://localhost:4000/players');
        if (!playersRes.ok) throw new Error('Failed to fetch players');
        const playersData = await playersRes.json();

        // Build draftedPlayers and filter availablePlayers
        const draftedPlayersMap: {[teamIdx: number]: any[]} = {};
        const draftedPlayerIds = new Set();
        managers.forEach((manager: any, idx: number) => {
          if (Array.isArray(manager.players)) {
            // If pick field exists, use it for slot, else order
            manager.players.forEach((player: any, i: number) => {
              draftedPlayerIds.add(player.id);
              if (!draftedPlayersMap[idx]) draftedPlayersMap[idx] = [];
              if (typeof player.pick === 'number') {
                draftedPlayersMap[idx][player.pick] = player;
              } else {
                draftedPlayersMap[idx].push(player);
              }
            });
          }
        });
        // Filter out drafted players from availablePlayers
        const filteredAvailablePlayers = playersData.filter((p: any) => !draftedPlayerIds.has(p.id));

        setAvailablePlayers(filteredAvailablePlayers);
        setDraftedPlayers(draftedPlayersMap);
        setCurrentTeamIdx(0);
        setTimer(PICK_TIME);
        setTimerActive(true);
      } catch (err: any) {
        setFetchError(err.message || 'Error fetching draft/players');
      } finally {
        setLoading(false);
      }
    }
    fetchDraftAndPlayers();
  }, [selectedDraftId]);

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
  const draftPlayer = async (player: any) => {
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    setDraftedPlayers(prev => {
      const teamDrafts = prev[currentTeamIdx] || [];
      return { ...prev, [currentTeamIdx]: [...teamDrafts, player] };
    });
    // Persist to backend
    if (selectedDraftId) {
      try {
        await fetch(`http://localhost:4000/drafts/${selectedDraftId}/draft`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            managerPosition: currentTeamIdx,
            player
          })
        });
      } catch (err) {
        // Optionally handle error (e.g., show notification)
        console.error('Failed to persist drafted player', err);
      }
    }
    setCurrentTeamIdx((prev) => (prev + 1) % teamNames.length);
    setTimer(PICK_TIME);
    setTimerActive(true);
  };

  // Landing page logic
  if (!selectedDraftId) {
    return <LandingPage onContinue={setSelectedDraftId} />;
  }

  if (loading) {
    return (
      <div className="App">
        <h2>Loading draft and players...</h2>
        <p>This may take a few moments.</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="App">
        <h2>Error loading draft/players</h2>
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
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${teamNames.length}, 1fr)`, gap: '1rem', marginTop: 32 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${teamNames.length}, 1fr)`, gap: '1rem' }}>
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
