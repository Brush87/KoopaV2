import React, { useEffect, useState } from 'react';

type StatRow = { [k: string]: any };

export default function PlayerStatsModal({ open, onClose, playerId, playerName, playerImage, playerEmoji, playerPosition }: { open: boolean; onClose: () => void; playerId: string | number; playerName?: string; playerImage?: string | null; playerEmoji?: string | null; playerPosition?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<StatRow[]>([]);

  useEffect(() => {
    if (!open) return;
    if (!playerId) return;
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
        // Sort by seasonId descending (newest first). seasonId can be numeric or string like '20232024' or '2023'
        const normalizeSeason = (s: any) => {
          if (s === undefined || s === null) return -Infinity;
          const str = String(s).replace(/[^0-9]/g, '');
          const asNum = Number(str);
          return isNaN(asNum) ? -Infinity : asNum;
        };
  // ascending: oldest seasons first
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
      <div className="modal-card" style={{ width: '920px', maxHeight: '86vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* header: image + title + close */}
        <div className="modal-header">
          <div style={{ width: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {playerImage ? <img src={playerImage} alt={playerName ? `${playerName} headshot` : 'player headshot'} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} /> : (playerEmoji ? <span className="modal-player-emoji">{playerEmoji}</span> : null)}
          </div>
          <h3 className="modal-title">Player Stats {playerName ? `- ${playerName}` : ''}</h3>
          <button className="modal-close-button" aria-label="Close" onClick={onClose}>×</button>
        </div>

        {/* scrollable middle area for the stats table */}
        <div className="modal-stats-body">
          <div className="modal-stats-inner">
            {loading && <p>Loading stats...</p>}
            {error && <p style={{ color: 'salmon' }}>{error}</p>}
            {!loading && !error && rows.length === 0 && <p>No stats available.</p>}
            {!loading && rows.length > 0 && (
              <div style={{ width: '100%', overflow: 'auto' }}>
                {/* If playerPosition is G (goalie), fall back to generic table */}
                {playerPosition === 'G' ? (
                  // Goalie-specific columns: Season, Team, Wins, Saves, Shutouts, SV%
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
                        const seasonDisplay = season ? (season.length > 4 ? season.slice(0,4) + ' - ' + season.slice(4) : season) : 'NO DATA';
                        const team = r.teamAbbrevs ?? r.teamAbbrev ?? r.team ?? 'NO DATA';
                        const wins = (r.wins !== undefined && r.wins !== null) ? r.wins : 'NO DATA';
                        const saves = (r.saves !== undefined && r.saves !== null) ? r.saves : 'NO DATA';
                        const shutouts = (r.shutouts !== undefined && r.shutouts !== null) ? r.shutouts : 'NO DATA';
                        // Save percentage: remove leading 0 (0.900 -> .900)
                        let svPct = (r.savePct !== undefined && r.savePct !== null) ? String(r.savePct) : 'NO DATA';
                        if (svPct !== 'NO DATA') {
                          // ensure number-like formatting
                          const num = Number(svPct);
                          if (!isNaN(num)) {
                            svPct = num >= 1 ? String(num) : String(num).replace(/^0(?=\.)/, '');
                          }
                        }
                        return (
                          <tr key={i}>
                            <td className="season-col">{seasonDisplay}</td>
                            <td className="stats-team-col">{team}</td>
                            <td className="numeric">{String(wins)}</td>
                            <td className="numeric">{String(saves)}</td>
                            <td className="numeric">{String(shutouts)}</td>
                            <td className="numeric">{svPct}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* Skater-specific column order and formatting per user request */
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
                        // Helpers and fallbacks
                        const season = r.seasonId ? String(r.seasonId) : null;
                        const seasonDisplay = season ? (season.length > 4 ? season.slice(0,4) + ' - ' + season.slice(4) : season) : 'NO DATA';
                        const team = r.teamAbbrevs ?? r.teamAbbrev ?? r.team ?? 'NO DATA';
                        const goals = (r.goals !== undefined && r.goals !== null) ? r.goals : 'NO DATA';
                        const assists = (r.assists !== undefined && r.assists !== null) ? r.assists : 'NO DATA';
                        const points = (r.points !== undefined && r.points !== null) ? r.points : 'NO DATA';
                        const plusMinus = (r.plusMinus !== undefined && r.plusMinus !== null) ? r.plusMinus : (r.plusMinus === 0 ? 0 : 'NO DATA');
                        // ToI: use timeOnIcePerGame / 60 then convert fractional minutes to mm:ss
                        const toiRaw = (r.timeOnIcePerGame !== undefined && r.timeOnIcePerGame !== null) ? r.timeOnIcePerGame : null;
                        let toiDisplay = 'NO DATA';
                        if (toiRaw !== null && toiRaw !== undefined) {
                          // If already in mm:ss string form, keep it
                          if (typeof toiRaw === 'string' && toiRaw.includes(':')) {
                            toiDisplay = toiRaw;
                          } else {
                            const asNum = Number(toiRaw);
                            if (!isNaN(asNum)) {
                              // per request: treat toiRaw as seconds -> divide by 60 to get minutes.decimal
                              const totalMinutesDecimal = asNum / 60;
                              let minutes = Math.floor(totalMinutesDecimal);
                              let seconds = Math.round((totalMinutesDecimal - minutes) * 60);
                              if (seconds >= 60) { minutes += Math.floor(seconds / 60); seconds = seconds % 60; }
                              toiDisplay = `${minutes}:${seconds.toString().padStart(2,'0')}`;
                            }
                          }
                        }
                        const hits = (r.hits !== undefined && r.hits !== null) ? r.hits : 'NO DATA';
                        const blocks = (r.blocks !== undefined && r.blocks !== null) ? r.blocks : 'NO DATA';
                        const stg = ((r.shGoals ?? 0) + (r.ppGoals ?? 0)) || 'NO DATA';
                        const stp = ((r.shPoints ?? 0) + (r.ppPoints ?? 0)) || 'NO DATA';

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
                            <td className="numeric">{stg === 'NO DATA' ? 'NO DATA' : String(stg)}</td>
                            <td className="numeric">{stp === 'NO DATA' ? 'NO DATA' : String(stp)}</td>
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

        {/* footer */}
        <div className="modal-footer">
          <button className="modal-cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
