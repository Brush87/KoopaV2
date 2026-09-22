import React, { useEffect, useState } from 'react';

type StatRow = { [k: string]: any };

interface PlayerStatsModalProps {
  open: boolean;
  onClose: () => void;
  playerId: string | number;
  playerName?: string;
  playerImage?: string | null;
  playerEmoji?: string | null;
  playerPosition?: string | null;
}

export default function PlayerStatsModal({
  open,
  onClose,
  playerId,
  playerName,
  playerImage,
  playerEmoji,
  playerPosition
}: PlayerStatsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<StatRow[]>([]);

  useEffect(() => {
    if (!open || !playerId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const posQuery = playerPosition ? `?position=${encodeURIComponent(playerPosition)}` : '';
        const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        const res = await fetch(`${base.replace(/\/$/, '')}/stats/${playerId}${posQuery}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const json = await res.json();
        const fetchedRows: StatRow[] = Array.isArray(json.data) ? json.data : [];

        // Sort by seasonId ascending (oldest first)
        const normalizeSeason = (s: any) => {
          if (s === undefined || s === null) return -Infinity;
          const str = String(s).replace(/[^0-9]/g, '');
          const asNum = Number(str);
          return isNaN(asNum) ? -Infinity : asNum;
        };

        fetchedRows.sort((a, b) => normalizeSeason(a.seasonId) - normalizeSeason(b.seasonId));
        setRows(fetchedRows);
      } catch (err: any) {
        setError(err.message || 'Error fetching stats');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, playerId, playerPosition]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card stats-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-player-avatar-wrap">
            {playerImage ? (
              <img
                src={playerImage}
                alt={playerName ? `${playerName} headshot` : 'player headshot'}
                className="modal-player-img"
              />
            ) : playerEmoji ? (
              <span className="modal-player-emoji">{playerEmoji}</span>
            ) : null}
          </div>
          <h3 className="modal-title">
            Player Stats {playerName ? `- ${playerName}` : ''}
          </h3>
          <button className="modal-close-button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Scrollable stats area */}
        <div className="modal-stats-body">
          <div className="modal-stats-inner">
            {loading && <p className="muted-text">Loading stats...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && !error && rows.length === 0 && <p className="muted-text">No stats available.</p>}
            {!loading && rows.length > 0 && (
              <div style={{ width: '100%', overflowX: 'auto' }}>
                {playerPosition === 'G' ? (
                  /* Goalie Table */
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Season</th>
                        <th className="stats-team-col">Team</th>
                        <th className="numeric">Wins</th>
                        <th className="numeric">Saves</th>
                        <th className="numeric">Shutouts</th>
                        <th className="numeric">SV %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice().reverse().map((r, i) => {
                        const season = r.seasonId ? String(r.seasonId) : null;
                        const seasonDisplay = season
                          ? (season.length >= 8 ? `${season.slice(0, 4)}-${season.slice(6, 8)}` : season)
                          : 'NO DATA';
                        const team = r.teamAbbrevs ?? r.teamAbbrev ?? r.team ?? 'NO DATA';
                        const wins = r.wins ?? 'NO DATA';
                        const saves = r.saves ?? 'NO DATA';
                        const shutouts = r.shutouts ?? 'NO DATA';

                        let svPct = r.savePct ?? r.savePctg ?? null;
                        let svDisplay = 'NO DATA';
                        if (svPct !== null && svPct !== undefined) {
                          const num = Number(svPct);
                          if (!isNaN(num)) {
                            svDisplay = num >= 1 ? num.toFixed(3) : num.toFixed(3).replace(/^0(?=\.)/, '');
                          }
                        }

                        return (
                          <tr key={i}>
                            <td className="season-col">{seasonDisplay}</td>
                            <td className="stats-team-col">{team}</td>
                            <td className="numeric">{String(wins)}</td>
                            <td className="numeric">{String(saves)}</td>
                            <td className="numeric">{String(shutouts)}</td>
                            <td className="numeric">{svDisplay}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* Skater Table */
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Season</th>
                        <th className="stats-team-col">Team</th>
                        <th className="stats-goals-col numeric">Goals</th>
                        <th className="numeric">Assists</th>
                        <th className="numeric">Points</th>
                        <th className="numeric">+/-</th>
                        <th>ToI</th>
                        <th className="numeric">Hits</th>
                        <th className="numeric">Blocks</th>
                        <th className="numeric">STG</th>
                        <th className="numeric">STP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice().reverse().map((r, i) => {
                        const season = r.seasonId ? String(r.seasonId) : null;
                        const seasonDisplay = season
                          ? (season.length >= 8 ? `${season.slice(0, 4)}-${season.slice(6, 8)}` : season)
                          : 'NO DATA';
                        const team = r.teamAbbrevs ?? r.teamAbbrev ?? r.team ?? 'NO DATA';
                        const goals = r.goals ?? 'NO DATA';
                        const assists = r.assists ?? 'NO DATA';
                        const points = r.points ?? 'NO DATA';
                        const plusMinus = r.plusMinus ?? (r.plusMinus === 0 ? 0 : 'NO DATA');

                        // ToI
                        const toiRaw = r.timeOnIcePerGame ?? null;
                        let toiDisplay = 'NO DATA';
                        if (toiRaw !== null && toiRaw !== undefined) {
                          if (typeof toiRaw === 'string' && toiRaw.includes(':')) {
                            toiDisplay = toiRaw;
                          } else {
                            const asNum = Number(toiRaw);
                            if (!isNaN(asNum) && asNum > 0) {
                              const totalMinutesDecimal = asNum / 60;
                              let minutes = Math.floor(totalMinutesDecimal);
                              let seconds = Math.round((totalMinutesDecimal - minutes) * 60);
                              if (seconds >= 60) {
                                minutes += Math.floor(seconds / 60);
                                seconds = seconds % 60;
                              }
                              toiDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            }
                          }
                        }

                        const hits = r.hits !== null && r.hits !== undefined ? r.hits : 'NO DATA';
                        const blocks = r.blockedShots ?? r.blocks ?? 'NO DATA';

                        const ppGoals = r.ppGoals ?? 0;
                        const shGoals = r.shGoals ?? 0;
                        const stg = (ppGoals + shGoals) || (r.goals !== undefined ? 0 : 'NO DATA');

                        const ppPoints = r.ppPoints ?? 0;
                        const shPoints = r.shPoints ?? 0;
                        const stp = (ppPoints + shPoints) || (r.points !== undefined ? 0 : 'NO DATA');

                        return (
                          <tr key={i}>
                            <td className="season-col">{seasonDisplay}</td>
                            <td className="stats-team-col">{team}</td>
                            <td className="stats-goals-col numeric">{String(goals)}</td>
                            <td className="numeric">{String(assists)}</td>
                            <td className="numeric">{String(points)}</td>
                            <td className="numeric">{String(plusMinus)}</td>
                            <td>{toiDisplay}</td>
                            <td className="numeric">{String(hits)}</td>
                            <td className="numeric">{String(blocks)}</td>
                            <td className="numeric">{String(stg)}</td>
                            <td className="numeric">{String(stp)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
