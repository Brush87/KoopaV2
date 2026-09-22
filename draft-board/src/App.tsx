import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ConfirmModal from './ConfirmModal';
import AddPlayerModal from './AddPlayerModal';
import DraftCard from './DraftCard';
import PlayerStatsModal from './PlayerStatsModal';

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
      const allDrafts = await (await fetch(`${API_BASE}/drafts`)).json();
      setDrafts(allDrafts.filter((d: any) => !d.completed));
    } catch (err: any) {
      window.alert(err.message || 'Error deleting draft');
    }
  };

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
      return Array(count).fill('').map((_, i) => prev[i] || `Team ${i + 1}`);
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
      const allDrafts = await (await fetch(`${API_BASE}/drafts`)).json();
      setDrafts(allDrafts.filter((d: any) => !d.completed));
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
                  <div className="landing-item-info">
                    <strong>{draft.name || 'Untitled Draft'}</strong> <span className="muted">(ID: {draft.id || draft._id})</span>
                  </div>
                  <div className="landing-item-actions">
                    <button className="btn btn-primary" onClick={() => onContinue(draft.id || draft._id)}>Continue</button>
                    <button className="btn btn-danger" onClick={() => confirmDelete(draft.id || draft._id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="create-cta-row">
            <button className="btn btn-secondary" onClick={() => setShowForm(true)}>+ Create New Draft</button>
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
  const PICK_TIME = 90; // seconds
  const ROUNDS = 18;

  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [draftedPlayers, setDraftedPlayers] = useState<{ [teamIdx: number]: any[] }>({});
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [picksMade, setPicksMade] = useState(0);
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

  // Fetch draft info and player pool
  useEffect(() => {
    async function fetchDraftAndPlayers() {
      if (!selectedDraftId) return;
      setLoading(true);
      setFetchError(null);
      try {
        const draftRes = await fetch(`${API_BASE}/drafts/${selectedDraftId}`);
        if (!draftRes.ok) throw new Error('Failed to fetch draft info');
        const draftData = await draftRes.json();
        setDraftName(draftData.name || null);
        setDraftCompleted(!!draftData.completed);

        const managers = Array.isArray(draftData.managers) ? draftData.managers : [];
        setTeamNames(managers.map((m: any) => m.name));

        const playersRes = await fetch(`${API_BASE}/players`);
        if (!playersRes.ok) throw new Error('Failed to fetch players');
        const playersData = await playersRes.json();

        const draftedPlayersMap: { [teamIdx: number]: any[] } = {};
        const draftedPlayerIds = new Set();
        let totalPicks = 0;

        managers.forEach((manager: any, idx: number) => {
          if (Array.isArray(manager.players)) {
            manager.players.forEach((player: any) => {
              if (!player) return;
              draftedPlayerIds.add(player.id);
              if (!draftedPlayersMap[idx]) draftedPlayersMap[idx] = [];
              draftedPlayersMap[idx].push(player);
              totalPicks++;
            });
          }
        });

        const filteredAvailablePlayers = playersData.filter((p: any) => !draftedPlayerIds.has(p.id));

        setAvailablePlayers(filteredAvailablePlayers);
        setDraftedPlayers(draftedPlayersMap);
        setPicksMade(totalPicks);

        const teamCount = managers.length || 1;
        const round = Math.floor(totalPicks / teamCount);
        const pos = totalPicks % teamCount;
        const nextTeamIdx = (round % 2 === 1) ? (teamCount - 1 - pos) : pos;
        setCurrentTeamIdx(nextTeamIdx);

        if (totalPicks >= ROUNDS * teamCount || draftData.completed) {
          setDraftCompleted(true);
          setTimerActive(false);
          setTimer(0);
        } else {
          setTimer(PICK_TIME);
          setTimerActive(true);
        }
      } catch (err: any) {
        setFetchError(err.message || 'Error fetching draft/players');
      } finally {
        setLoading(false);
      }
    }
    fetchDraftAndPlayers();
  }, [selectedDraftId]);

  // Responsive column sizing
  const appRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!appRef.current) return;
    const el = appRef.current;

    function updateColumnWidth() {
      try {
        const containerWidth = el.clientWidth;
        const count = Math.max(1, teamNames.length || 10);
        const gap = Number(getComputedStyle(el).getPropertyValue('--card-gap')) || 10;
        const totalGaps = Math.max(0, count - 1) * gap;
        const reserved = 120; // reserve space for rounds sidebar & padding
        const available = Math.max(100, containerWidth - totalGaps - reserved);
        const perCol = Math.max(110, Math.floor(available / count));
        el.style.setProperty('--calculated-card-min', perCol + 'px');
      } catch (e) {}
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

  // Timer countdown
  useEffect(() => {
    if (!timerActive || paused || draftCompleted) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, paused, draftCompleted]);

  // Auto-draft POOP (Kyle Wellwood) player at -30 seconds
  useEffect(() => {
    if (timer > -30 || paused || draftCompleted) return;
    if (autoDraftedForPick === picksMade) return;

    // Set flag immediately to prevent re-entry loop
    setAutoDraftedForPick(picksMade);

    const poopPlayer = {
      id: `poop-${Date.now()}`,
      firstName: { default: 'Kyle' },
      lastName: { default: 'Wellwood' },
      positionCode: 'POOP',
      team: 'POOP',
      headshot: '',
      emoji: '💩'
    };

    draftPlayer(poopPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, picksMade, autoDraftedForPick, paused, draftCompleted]);

  // Reset timer on team index change
  useEffect(() => {
    if (pausedRef.current || draftCompleted) return;
    setTimer(PICK_TIME);
    setTimerActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeamIdx]);

  const draftPlayer = async (player: any) => {
    if (draftCompleted) return;

    const managerIdx = currentTeamIdx;
    const currentPicks = picksMade;
    const teamCount = teamNames.length || 1;

    // Update frontend state synchronously
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    setDraftedPlayers(prev => {
      const teamDrafts = prev[managerIdx] || [];
      return { ...prev, [managerIdx]: [...teamDrafts, player] };
    });

    const nextPickNum = currentPicks + 1;
    setPicksMade(nextPickNum);

    const round = Math.floor(nextPickNum / teamCount);
    const pos = nextPickNum % teamCount;
    const nextManagerIdx = (round % 2 === 1) ? (teamCount - 1 - pos) : pos;
    setCurrentTeamIdx(nextManagerIdx);

    setTimer(PICK_TIME);
    setTimerActive(true);

    // 1. Persist pick to backend
    if (selectedDraftId) {
      try {
        await fetch(`${API_BASE}/drafts/${selectedDraftId}/draft`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ managerPosition: managerIdx, player })
        });
      } catch (err) {
        console.error('Failed to persist drafted player', err);
      }
    }

    // 2. Check draft completion (AFTER pick is persisted)
    const totalPicksPossible = ROUNDS * teamCount;
    if (nextPickNum >= totalPicksPossible) {
      setDraftCompleted(true);
      setTimerActive(false);
      setTimer(0);

      if (selectedDraftId) {
        try {
          const res = await fetch(`${API_BASE}/drafts/${selectedDraftId}/complete`, { method: 'POST' });
          if (res.ok) {
            const text = await res.text();
            const filename = (draftName || 'draft-results').replace(/[^a-z0-9\-_. ]/ig, '') + '.txt';
            downloadTextFile(filename, text);
          }
        } catch (e) {
          console.error('Failed to complete draft', e);
        }
      }
    }
  };

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

  const undoLastPick = async () => {
    if (!selectedDraftId || picksMade <= 0) return;

    const lastPick = picksMade - 1;
    const teamCount = teamNames.length || 1;
    const round = Math.floor(lastPick / teamCount);
    const pos = lastPick % teamCount;
    const managerPosition = (round % 2 === 1) ? (teamCount - 1 - pos) : pos;

    try {
      const res = await fetch(`${API_BASE}/drafts/${selectedDraftId}/undraft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerPosition })
      });
      if (!res.ok) throw new Error('Failed to undo pick');
      const data = await res.json();
      const removed = data.removed;

      setDraftedPlayers(prev => {
        const copy = { ...prev };
        const arr = (copy[managerPosition] || []).slice();
        if (removed && removed.id) {
          const idx = arr.findIndex(p => p && p.id === removed.id);
          if (idx >= 0) arr.splice(idx, 1);
          else arr.pop();
        } else {
          arr.pop();
        }
        copy[managerPosition] = arr;
        return copy;
      });

      if (removed && removed.positionCode !== 'POOP') {
        setAvailablePlayers(prev => {
          if (prev.some(p => p && p.id === removed.id)) return prev;
          return [removed, ...prev];
        });
      }

      setPicksMade(lastPick);
      setCurrentTeamIdx(managerPosition);
      setDraftCompleted(false);
      setTimer(PICK_TIME);
      setTimerActive(true);
    } catch (err) {
      console.error('Undo failed', err);
    }
  };

  if (!selectedDraftId) {
    return <LandingPage onContinue={setSelectedDraftId} />;
  }

  if (loading) {
    return (
      <div className="App">
        <h2>Loading draft board...</h2>
        <p className="muted">Connecting to server and fetching players.</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="App">
        <h2>Error loading draft</h2>
        <p className="error-text">{fetchError}</p>
      </div>
    );
  }

  const totalDuration = PICK_TIME + 30;
  const elapsed = PICK_TIME - timer;
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration));
  const RING_RADIUS = 30;
  const RING_CIRC = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRC * (1 - progress);

  const uniquePlayersMap = new Map();
  availablePlayers.forEach(p => {
    if (p && p.id && !uniquePlayersMap.has(p.id)) {
      uniquePlayersMap.set(p.id, p);
    }
  });
  const uniquePlayers = Array.from(uniquePlayersMap.values());

  return (
    <div className="App" ref={appRef}>
      {/* Sticky Glass Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">🏒</span>
          <span className="brand-title">{draftName || 'Fantasy Draft Board'}</span>
        </div>

        <div className="nav-controls">
          <button
            className="icon-btn add-btn"
            title="Add Custom Player"
            aria-label="Add Custom Player"
            onClick={() => setAddModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
            <span className="btn-text">Add Player</span>
          </button>

          <button
            className="icon-btn undo-btn"
            title="Undo Last Pick"
            aria-label="Undo Last Pick"
            onClick={undoLastPick}
            disabled={picksMade <= 0}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 0 1 5 5v2M3 10l6-6M3 10l6 6" />
            </svg>
            <span className="btn-text">Undo</span>
          </button>

          <button
            className="icon-btn pause-btn"
            onClick={() => { if (!draftCompleted) setPaused(p => !p); }}
            aria-label={paused ? 'Resume Draft' : 'Pause Draft'}
            title={paused ? 'Resume Draft' : 'Pause Draft'}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
            <span className="btn-text">{paused ? 'Resume' : 'Pause'}</span>
          </button>

          <SearchSelect
            options={uniquePlayers}
            selected={selectedPlayer}
            onSelect={p => setSelectedPlayer(p)}
            onEnter={(p: any) => {
              if (p) {
                draftPlayer(p);
                setSelectedPlayer(null);
              }
            }}
          />

          <button
            className="draft-action-btn"
            disabled={!selectedPlayer || paused || draftCompleted}
            onClick={() => {
              if (selectedPlayer && !draftCompleted && !paused) {
                draftPlayer(selectedPlayer);
                setSelectedPlayer(null);
              }
            }}
          >
            Draft Pick
          </button>
        </div>
      </nav>

      <AddPlayerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreate={(player: any) => {
          setAvailablePlayers(prev => [player, ...prev]);
          draftPlayer(player);
        }}
      />

      <div className="main-layout">
        <div className="board-panel">
          {/* Header Banner & Live Timer */}
          <div className="timer-banner">
            <div className="banner-on-deck">
              <span className="banner-label">CURRENTLY ON THE CLOCK</span>
              <div className="banner-team-name">{teamNames[currentTeamIdx] || 'Team'}</div>
            </div>

            <div className="timer-ring-container">
              {draftCompleted ? (
                <div className="draft-completed-badge">DRAFT COMPLETED 🏆</div>
              ) : (
                <>
                  {timer < 0 && <div className="beats-badge left">BEATS</div>}
                  <div className={`timer-ring ${timer < 0 ? 'red' : timer < 15 ? 'orange' : ''}`}>
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      <g transform="translate(36,36)">
                        <circle r="30" cx="0" cy="0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                        <circle
                          r="30"
                          cx="0"
                          cy="0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={6}
                          strokeDasharray={RING_CIRC}
                          strokeDashoffset={ringOffset}
                          strokeLinecap="round"
                          transform="rotate(-90)"
                        />
                      </g>
                    </svg>
                    <div className="timer-label">{timer >= 0 ? timer : `-${Math.abs(timer)}`}s</div>
                  </div>
                  {timer < 0 && <div className="beats-badge right">BEATS</div>}
                </>
              )}
            </div>

            <div className="banner-pick-info">
              <span className="banner-label">OVERALL PICK</span>
              <div className="banner-pick-num">#{picksMade + 1}</div>
            </div>
          </div>

          {/* Draft Board Grid */}
          <div className="board-wrapper">
            <div
              className="board-columns"
              style={{ gridTemplateColumns: `80px repeat(${teamNames.length}, minmax(var(--calculated-card-min, 130px), 1fr))` }}
            >
              <div className="round-column">
                <div className="col-header-spacer" />
                <div className="round-grid">
                  {Array.from({ length: ROUNDS }).map((_, roundIdx) => (
                    <div key={`round-label-${roundIdx}`} className="round-label">
                      R{roundIdx + 1}
                    </div>
                  ))}
                </div>
              </div>

              {teamNames.map((team, idx) => (
                <div key={idx} className={`team-column ${idx === currentTeamIdx && !draftCompleted ? 'active-team' : ''}`}>
                  <div className="team-name-header">
                    <span className="team-pos">#{idx + 1}</span>
                    <span className="team-title">{team}</span>
                  </div>
                  <div className="round-grid">
                    {Array.from({ length: ROUNDS }).map((_, round) => {
                      const teamCount = teamNames.length || 1;
                      const pos = (round % 2 === 1) ? (teamCount - 1 - idx) : idx;
                      const overallPick = (round * teamCount) + pos + 1;
                      const playerAtSlot = (draftedPlayers[idx] || [])[round];

                      return (
                        <div
                          key={`team${idx}-round${round}-p${playerAtSlot?.id ?? round}`}
                          className="card-slot"
                          onClick={() => {
                            if (!playerAtSlot) return;
                            const isPoop = playerAtSlot.positionCode === 'POOP';
                            const idVal = playerAtSlot.id || playerAtSlot._id;
                            const isCreated = typeof idVal === 'string' && idVal.startsWith('new-');
                            if (isPoop || isCreated) return;
                            if (idVal) {
                              setStatsPlayerId(idVal);
                              const name = `${playerAtSlot.firstName?.default || playerAtSlot.firstName || ''} ${playerAtSlot.lastName?.default || playerAtSlot.lastName || ''}`.trim();
                              setStatsPlayerName(name || undefined);
                              setStatsPlayerImage(playerAtSlot.headshot?.url || playerAtSlot.headshot || playerAtSlot.image || null);
                              setStatsPlayerEmoji(playerAtSlot.emoji || null);
                              setStatsPlayerPosition(playerAtSlot.positionCode || null);
                              setStatsOpen(true);
                            }
                          }}
                        >
                          <DraftCard player={playerAtSlot} pickNumber={overallPick} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PlayerStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        playerId={statsPlayerId || ''}
        playerName={statsPlayerName}
        playerImage={statsPlayerImage}
        playerEmoji={statsPlayerEmoji}
        playerPosition={statsPlayerPosition}
      />
    </div>
  );
}

export default App;

type SearchSelectProps = {
  options: any[];
  onSelect: (p: any) => void;
  placeholder?: string;
  selected?: any | null;
  onEnter?: (p: any | null) => void;
};

export const SearchSelect: React.FC<SearchSelectProps> = React.memo(function SearchSelect({
  options,
  onSelect,
  placeholder = 'Search player to draft...',
  selected = null,
  onEnter
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!selected) {
      setQ('');
    }
  }, [selected]);

  const results = options.filter(p => {
    const first = typeof p.firstName?.default === 'string' ? p.firstName.default.toLowerCase() : (typeof p.firstName === 'string' ? p.firstName.toLowerCase() : '');
    const last = typeof p.lastName?.default === 'string' ? p.lastName.default.toLowerCase() : (typeof p.lastName === 'string' ? p.lastName.toLowerCase() : '');
    const qq = q.toLowerCase();
    return first.includes(qq) || last.includes(qq);
  }).slice(0, 30);

  const [highlight, setHighlight] = useState<number>(-1);

  useEffect(() => {
    setHighlight(results.length > 0 ? 0 : -1);
  }, [q, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onEnter) {
        const chosen = (highlight >= 0 && results[highlight]) ? results[highlight] : (selected || results[0] || null);
        if (chosen) {
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
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onKeyDown={handleKeyDown}
      />
      {open && q && (
        <div className="search-select-dropdown">
          {results.length === 0 ? (
            <div className="no-results">No matching players</div>
          ) : (
            results.map((p: any, idx: number) => {
              const name = `${p.firstName?.default || p.firstName || ''} ${p.lastName?.default || p.lastName || ''}`.trim();
              const team = p.team || 'UNK';
              const pos = p.positionCode || '??';
              return (
                <div
                  key={p.id}
                  className={`search-select-item${idx === highlight ? ' highlighted' : ''}`}
                  onMouseDown={() => {
                    onSelect(p);
                    setQ(name);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHighlight(idx)}
                >
                  <span className="search-item-name">{name}</span>
                  <span className="search-item-badge">{team} | {pos}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});
