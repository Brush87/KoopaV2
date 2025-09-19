import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ConfirmModal from './ConfirmModal';
import AddPlayerModal from './AddPlayerModal';
import DraftCard from './DraftCard';
import PlayerStatsModal from './PlayerStatsModal';

// ...existing code...

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '');

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
  const res = await fetch(`${API_BASE}/drafts`);
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

  const deleteDraft = async (draftId: string) => {
    try {
  const res = await fetch(`${API_BASE}/drafts/${draftId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete draft');
      // refresh list
  const allDrafts = await (await fetch(`${API_BASE}/drafts`)).json();
      setDrafts(allDrafts.filter((d: any) => !d.completed));
    } catch (err: any) {
      window.alert(err.message || 'Error deleting draft');
    }
  };

  // Modal control for confirming delete
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const confirmDelete = (id: string) => setConfirmingDeleteId(id);
  const cancelDelete = () => setConfirmingDeleteId(null);
  const deleteDraftConfirmed = async () => {
    if (!confirmingDeleteId) return;
    await deleteDraft(confirmingDeleteId);
    setConfirmingDeleteId(null);
  };

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
  const res = await fetch(`${API_BASE}/drafts`, {
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
  const allDrafts = await (await fetch(`${API_BASE}/drafts`)).json();
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
      <div className="landing-wrap">
        <div className="landing-card">
          <h2>Available Drafts</h2>
          {drafts.length === 0 ? <p className="muted">No active drafts found.</p> : (
        <ul className="landing-list">
          {drafts.map(draft => (
            <li key={draft.id || draft._id} className="landing-item">
              <div className="landing-item-info">Draft ID: {draft.id || draft._id} {draft.name ? `| ${draft.name}` : ''}</div>
              <div className="landing-item-actions">
                <button className="btn btn-primary" onClick={() => onContinue(draft.id || draft._id)}>Continue</button>
                <button className="btn btn-danger" onClick={() => confirmDelete(draft.id || draft._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
          )}
          <div className="create-cta-row">
            <button className="btn btn-secondary" onClick={() => setShowForm(true)}>Create New Draft</button>
          </div>
          {showForm && (
            <form onSubmit={handleCreateDraft} className="create-form">
              <h3>Create New Draft</h3>
              <label className="form-field">Draft Name:
                <input className="form-input" type="text" value={draftName} onChange={e => setDraftName(e.target.value)} required />
              </label>
              <label className="form-field">Number of Teams:
                <input className="form-input" type="number" min={2} max={20} value={teamCount} onChange={handleTeamCountChange} required />
              </label>
          <div className="team-names-grid">
            {Array.from({ length: teamCount }).map((_, idx) => (
              <div key={idx} className="team-name-row">
                <label>Team {idx + 1} Name:
                  <input className="form-input" type="text" value={teamNames[idx] || ''} onChange={e => handleTeamNameChange(idx, e.target.value)} required />
                </label>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={creating}>Create</button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          {createError && <p className="form-error">{createError}</p>}
        </form>
      )}
        </div>
      </div>
      {confirmingDeleteId && (
        <ConfirmModal
          message="Delete this draft? This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={deleteDraftConfirmed}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

function App() {
  // Timer constants
  const PICK_TIME = 90; // seconds
  const ROUNDS = 18;
  // State for draft selection
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [draftedPlayers, setDraftedPlayers] = useState<{[teamIdx: number]: any[]}>({});
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [picksMade, setPicksMade] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [timer, setTimer] = useState(PICK_TIME);
  const [timerActive, setTimerActive] = useState(true);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const [draftCompleted, setDraftCompleted] = useState(false);
  const [autoDraftedForPick, setAutoDraftedForPick] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsPlayerId, setStatsPlayerId] = useState<string | number | null>(null);
  const [statsPlayerName, setStatsPlayerName] = useState<string | undefined>(undefined);
  const [statsPlayerImage, setStatsPlayerImage] = useState<string | null>(null);
  const [statsPlayerEmoji, setStatsPlayerEmoji] = useState<string | null>(null);
  const [statsPlayerPosition, setStatsPlayerPosition] = useState<string | null>(null);

  // When a draft is selected, fetch draft info and players
  useEffect(() => {
    async function fetchDraftAndPlayers() {
      if (!selectedDraftId) return;
      setLoading(true);
      setFetchError(null);
      try {
        // Fetch draft info
  const draftRes = await fetch(`${API_BASE}/drafts/${selectedDraftId}`);
        if (!draftRes.ok) throw new Error('Failed to fetch draft info');
        const draftData = await draftRes.json();
        setDraftName(draftData.name || null);
        // Set team names from draft managers
        const managers = Array.isArray(draftData.managers) ? draftData.managers : [];
        setTeamNames(managers.map((m: any) => m.name));
        // Fetch all players from backend
  const playersRes = await fetch(`${API_BASE}/players`);
        if (!playersRes.ok) throw new Error('Failed to fetch players');
        const playersData = await playersRes.json();

        // Build draftedPlayers and filter availablePlayers
        const draftedPlayersMap: {[teamIdx: number]: any[]} = {};
        const draftedPlayerIds = new Set();
        let totalPicks = 0;
        managers.forEach((manager: any, idx: number) => {
          if (Array.isArray(manager.players)) {
            // If pick field exists, use it for slot, else order
            manager.players.forEach((player: any, i: number) => {
              if (!player) return;
              draftedPlayerIds.add(player.id);
              if (!draftedPlayersMap[idx]) draftedPlayersMap[idx] = [];
              if (typeof player.pick === 'number') {
                draftedPlayersMap[idx][player.pick] = player;
                totalPicks++;
              } else {
                draftedPlayersMap[idx].push(player);
                totalPicks++;
              }
            });
          }
        });
        // Filter out drafted players from availablePlayers
        const filteredAvailablePlayers = playersData.filter((p: any) => !draftedPlayerIds.has(p.id));

        setAvailablePlayers(filteredAvailablePlayers);
        setDraftedPlayers(draftedPlayersMap);
        // Set picksMade based on drafted players found and compute current team idx for next pick
        setPicksMade(totalPicks);
        const teamCount = managers.length || 1;
        const computeNext = (pickNumber: number, teamCount: number) => {
          const round = Math.floor(pickNumber / teamCount);
          const pos = pickNumber % teamCount;
          return (round % 2 === 1) ? (teamCount - 1 - pos) : pos;
        };
        setCurrentTeamIdx(computeNext(totalPicks, teamCount));
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

  // ResizeObserver: calculate a per-column width so grid never overflows horizontally.
  const appRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!appRef.current) return;
    const el = appRef.current;

    function updateColumnWidth() {
      try {
        const containerWidth = el.clientWidth; // width inside .App
        const teamCount = Math.max(1, teamNames.length || 10);
        const gap = Number(getComputedStyle(el).getPropertyValue('--card-gap')) || 10;
        // total gaps count is (teamCount - 1) * gap
        const totalGaps = Math.max(0, teamCount - 1) * gap;
        // reserve some breathing room for paddings/borders: 40px
        const reserved = 40;
        const available = Math.max(100, containerWidth - totalGaps - reserved);
        const perCol = Math.floor(available / teamCount);
        // set CSS var on el
        el.style.setProperty('--calculated-card-min', perCol + 'px');
      } catch (e) {
        // noop
      }
    }

    updateColumnWidth();
    const ro = new ResizeObserver(() => updateColumnWidth());
    ro.observe(el);
    window.addEventListener('resize', updateColumnWidth);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateColumnWidth);
    };
  }, [teamNames.length]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive) return;
    if (paused) return;
    if (availablePlayers.length === 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, availablePlayers.length, paused]);

  // Auto-draft special POOP player when timer reaches -30s for a pick (once per pick)
  useEffect(() => {
    if (timer > -30) return;
    if (paused) return; // don't auto-draft while paused
    if (draftCompleted) return; // don't auto-draft after completion
    // If we've already auto-drafted for this pick number, skip
    if (autoDraftedForPick === picksMade) return;

    // create special POOP player
    const poopPlayer = {
      id: `poop-${Date.now()}`,
      firstName: { default: 'Kyle' },
      lastName: { default: 'Wellwood' },
      positionCode: 'POOP',
      team: 'POOP',
      headshot: '',
      emoji: '💩'
    };

    // Draft it for the current team
    (async () => {
      try {
        await draftPlayer(poopPlayer);
      } catch (e) {
        // Ensure we still mark as auto-drafted to avoid loops
        console.error('Auto-draft failed', e);
      } finally {
        setAutoDraftedForPick(picksMade);
      }
    })();
  }, [timer, picksMade, autoDraftedForPick, paused]);

  // Reset timer on pick. We intentionally do NOT add `paused` to the deps
  // so that toggling pause/resume doesn't trigger a reset. Use a ref
  // to observe paused state at the time the pick changes.
  useEffect(() => {
    if (pausedRef.current) return; // preserve timer when paused
    setTimer(PICK_TIME);
    // auto-start the timer
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
  await fetch(`${API_BASE}/drafts/${selectedDraftId}/draft`, {
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
    // Advance picks using snake order
    setPicksMade(prev => {
      const nextPick = prev + 1;
      const teamCount = teamNames.length || 1;
      const totalPicksPossible = (ROUNDS * teamCount);
      const round = Math.floor(nextPick / teamCount);
      const pos = nextPick % teamCount;
      const nextIdx = (round % 2 === 1) ? (teamCount - 1 - pos) : pos;
      setCurrentTeamIdx(nextIdx);
      // If we've reached or exceeded total picks, mark draft completed
      if (nextPick >= totalPicksPossible) {
        (async () => {
          try {
            if (selectedDraftId) {
              const res = await fetch(`${API_BASE}/drafts/${selectedDraftId}/complete`, { method: 'POST' });
              if (res.ok) {
                const text = await res.text();
                // Trigger client download
                const filename = (draftName || 'draft-results').replace(/[^a-z0-9\-_. ]/ig, '') + '.txt';
                downloadTextFile(filename, text);
              } else {
                console.error('Completion endpoint returned', res.status);
              }
            }
          } catch (e) {
            console.error('Failed to fetch draft completion text', e);
          } finally {
            setDraftCompleted(true);
            setTimerActive(false);
            setTimer(0);
          }
        })();
      }
      return nextPick;
    });
    setTimer(PICK_TIME);
    setTimerActive(true);
  };

  // Helper to trigger a client download of a text file
  function downloadTextFile(filename: string, text: string) {
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download file', e);
    }
  }

  // Undo (remove) the last pick and return player to available pool
  const undoLastPick = async () => {
    if (!selectedDraftId) return;
    if (picksMade <= 0) return;
    const lastPick = picksMade - 1; // 0-based
    const teamCount = teamNames.length || 1;
    const round = Math.floor(lastPick / teamCount);
    const pos = lastPick % teamCount;
    const managerPosition = (round % 2 === 1) ? (teamCount - 1 - pos) : pos;

    try {
  const res = await fetch(`${API_BASE}/drafts/${selectedDraftId}/undraft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerPosition, pickIndex: undefined })
      });
      if (!res.ok) throw new Error('Failed to undo pick');
      const data = await res.json();
      const removed = data.removed;
      if (!removed) return;

      // Update local draftedPlayers: remove the player from managerPosition
      setDraftedPlayers(prev => {
        const copy: {[k: number]: any[]} = { ...prev };
        const arr = (copy[managerPosition] || []).slice();
        // Remove by id if exists
        const idx = arr.findIndex(p => p && p.id === removed.id);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.pop();
        copy[managerPosition] = arr;
        return copy;
      });

      // Return player to availablePlayers if not already present
      // BUT do not re-add the special POOP auto-draft player to the pool
      setAvailablePlayers(prev => {
        if (!removed) return prev;
        if (removed.positionCode === 'POOP') return prev;
        if (prev.find(p => p && p.id === removed.id)) return prev;
        return [removed, ...prev];
      });

      // Adjust picksMade and currentTeamIdx
      setPicksMade(prev => {
        const next = Math.max(0, prev - 1);
        const nextRound = Math.floor(next / teamCount);
        const nextPos = next % teamCount;
        const nextIdx = (nextRound % 2 === 1) ? (teamCount - 1 - nextPos) : nextPos;
        setCurrentTeamIdx(nextIdx);
        return next;
      });
    } catch (err) {
      console.error('Undo failed', err);
    }
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

  // progress for ring: from PICK_TIME down to -30 => totalDuration
  const totalDuration = PICK_TIME + 30; // e.g., 90 + 30 = 120
  const elapsed = PICK_TIME - timer; // how many seconds elapsed since start of pick
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration));
  const RING_RADIUS = 30;
  const RING_CIRC = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRC * (1 - progress);

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
    <div className="App" ref={appRef}>
      <div className="app-header-row">
        {/* title intentionally removed per design update */}
      </div>
      {/* top-right controls: searchable select + Draft button */}
      <div className="top-right-controls">
        <button
          className="add-player-button"
          title="Add new player"
          aria-label="Add new player"
          onClick={() => setAddModalOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
        <button
          className="undo-button"
          title="Undo last pick"
          aria-label="Undo last pick"
          onClick={async () => {
            if (draftCompleted) return;
            await undoLastPick();
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.86 0 7 3.14 7 7a7 7 0 01-7 7 7 7 0 01-7-7H3a9 9 0 009 9 9 9 0 009-9c0-4.97-4.03-9-9-9z" />
          </svg>
        </button>
        <button
          className="pause-button"
          onClick={() => { if (!draftCompleted) setPaused(p => !p); }}
          aria-pressed={paused}
          aria-label={paused ? 'Resume draft timer' : 'Pause draft timer'}
          title={paused ? 'Resume' : 'Pause'}
        >
          {paused ? (
            // Play icon for resume
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M8 5v14l11-7z" />
            </svg>
          ) : (
            // Pause icon
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </button>
        <SearchSelect
          options={uniquePlayers}
          selected={selectedPlayer}
          onSelect={p => setSelectedPlayer(p)}
          onEnter={(p: any) => { if (p) { draftPlayer(p); setSelectedPlayer(null); } }}
        />
        <button className="draft-button" disabled={!selectedPlayer || paused || draftCompleted} onClick={() => {
          if (draftCompleted) return;
          if (selectedPlayer) {
            draftPlayer(selectedPlayer);
            setSelectedPlayer(null);
          }
        }}>Draft</button>
      </div>

      <AddPlayerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreate={(player: any) => {
          // Add and immediately draft to current team
          // Ensure the player exists in the available pool and then draft
          setAvailablePlayers(prev => [player, ...prev]);
          draftPlayer(player);
        }}
      />

      <div className="main-layout">
        {/* Draft Board */}
        <div className="board-panel">
          {/* Timer moved above the board */}
          <div className="timer-row timer-above header-with-timer">
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div className="current-team-label">Current Team</div>
              <div className="current-team-name">{teamNames[currentTeamIdx]}</div>
            </div>
              <div style={{ width: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {draftCompleted ? (
                  <div className="draft-completed">DRAFT COMPLETED</div>
                ) : (
                  <>
                    {timer < 0 && <div className="beats-left">BEATS</div>}
                    <div className={`timer-ring ${timer < 0 ? 'red' : timer < 15 ? 'orange' : ''}`} style={{ color: timer < 0 ? '#ff4444' : timer < 15 ? '#fff4e6' : 'inherit' }}>
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <defs />
                        <g transform="translate(36,36)">
                          <circle r="30" cx="0" cy="0" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                          <circle r="30" cx="0" cy="0" fill="none" stroke="currentColor" strokeWidth={6} strokeDasharray={RING_CIRC} strokeDashoffset={ringOffset} strokeLinecap="round" transform="rotate(-90)" />
                        </g>
                      </svg>
                      <div className="timer-label">{timer >= 0 ? timer : `-${Math.abs(timer)}`}s</div>
                    </div>
                    {timer < 0 && <div className="beats-right">BEATS</div>}
                  </>
                )}
              </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div className="current-pick-label">Current Pick</div>
              <div className="current-pick-value">{picksMade + 1}</div>
            </div>
          </div>
          <h3>Draft Board</h3>
          <div className="board-columns" style={{ gridTemplateColumns: `minmax(80px, 80px) repeat(${teamNames.length}, minmax(140px, 1fr))` }}>
            <div className="round-column">
              <div style={{padding:8}} />
              <div className="round-grid">
                {Array.from({ length: ROUNDS }).map((_, roundIdx) => (
                  <div key={`round-label-${roundIdx}`} className="round-label">Round {roundIdx + 1}</div>
                ))}
              </div>
            </div>
            {teamNames.map((team, idx) => (
              <div key={idx} className="team-column">
                <div className="team-name">{team}</div>
                <div className="round-grid">
                  {Array.from({ length: ROUNDS }).map((_, round) => {
                    const teamCount = teamNames.length || 1;
                    const pos = (round % 2 === 1) ? (teamCount - 1 - idx) : idx;
                    const overallPick = (round * teamCount) + pos + 1; // 1-based
                    const playerAtSlot = (draftedPlayers[idx] || [])[round];
                    return (
                      <div key={`team${idx}-round${round}-player${playerAtSlot?.id ?? round}`} onClick={() => {
                        // Do not open stats modal for special POOP players or for newly-created unsaved players
                        if (!playerAtSlot) return;
                        const isPoop = playerAtSlot.positionCode === 'POOP';
                        const idVal = playerAtSlot.id || playerAtSlot._id;
                        const isCreated = typeof idVal === 'string' && idVal.startsWith('new-');
                        if (isPoop || isCreated) return;
                        if (idVal) {
                          const pid = idVal;
                          setStatsPlayerId(pid);
                          const name = `${playerAtSlot.firstName?.default || ''} ${playerAtSlot.lastName?.default || ''}`.trim();
                          setStatsPlayerName(name || undefined);
                          setStatsPlayerImage(playerAtSlot.headshot || playerAtSlot.image || null);
                          setStatsPlayerEmoji(playerAtSlot.emoji || null);
                          setStatsPlayerPosition(playerAtSlot.positionCode || null);
                          setStatsOpen(true);
                        }
                        }} style={{ cursor: (playerAtSlot && (playerAtSlot.positionCode === 'POOP' || (typeof (playerAtSlot.id || playerAtSlot._id) === 'string' && (playerAtSlot.id || playerAtSlot._id).startsWith('new-')))) ? 'default' : (playerAtSlot ? 'pointer' : 'default') }}>
                        <DraftCard player={playerAtSlot} pickNumber={overallPick} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* original inline timer removed; timer now displayed above the board */}
        </div>
      </div>
  <PlayerStatsModal open={statsOpen} onClose={() => setStatsOpen(false)} playerId={statsPlayerId || ''} playerName={statsPlayerName} playerImage={statsPlayerImage} playerEmoji={statsPlayerEmoji} playerPosition={statsPlayerPosition} />
    </div>
  );
}

export default App;

// Stable SearchSelect component moved outside of App to avoid remounts on parent rerenders
type SearchSelectProps = {
  options: any[];
  onSelect: (p: any) => void;
  placeholder?: string;
  selected?: any | null;
  onEnter?: (p: any | null) => void;
};

export const SearchSelect: React.FC<SearchSelectProps> = React.memo(function SearchSelect({ options, onSelect, placeholder = 'Search players...', selected = null, onEnter }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Clear the input when selected becomes null (e.g., after drafting)
  useEffect(() => {
    if (!selected) {
      setQ('');
    }
  }, [selected]);

  const results = options.filter(p => {
    const first = typeof p.firstName?.default === 'string' ? p.firstName.default.toLowerCase() : '';
    const last = typeof p.lastName?.default === 'string' ? p.lastName.default.toLowerCase() : '';
    const qq = q.toLowerCase();
    return first.includes(qq) || last.includes(qq);
  }).slice(0, 30);

  const [highlight, setHighlight] = useState<number>(-1);

  useEffect(() => {
    // reset highlight when results change
    setHighlight(results.length > 0 ? 0 : -1);
  }, [q, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onEnter) {
        const chosen = (highlight >= 0 && results[highlight]) ? results[highlight] : (selected || results[0] || null);
        if (chosen) {
          // notify parent of selection
          onSelect(chosen);
          onEnter(chosen);
        } else {
          onEnter(null);
        }
        setOpen(false);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setHighlight(h => Math.min(results.length - 1, Math.max(0, h + 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setHighlight(h => Math.max(0, h - 1));
      return;
    }
  };

  return (
    <div className="search-select">
      <input
        ref={inputRef}
        placeholder={placeholder}
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {open && q && (
        <div className="search-select-dropdown">
          {results.length === 0 ? <div className="no-results">No players</div> : results.map((p: any, idx: number) => (
            <div
              key={p.id}
              className={`search-select-item${idx === highlight ? ' highlighted' : ''}`}
              onMouseDown={() => { onSelect(p); setQ((p.firstName?.default || '') + ' ' + (p.lastName?.default || '')); setOpen(false); }}
              onMouseEnter={() => setHighlight(idx)}
            >
              {p.firstName?.default} {p.lastName?.default}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
