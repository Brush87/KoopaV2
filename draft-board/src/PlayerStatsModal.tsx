import React, { useEffect, useState } from 'react';

type StatRow = { [k: string]: any };

export default function PlayerStatsModal({ open, onClose, playerId, playerName }: { open: boolean; onClose: () => void; playerId: string | number; playerName?: string }) {
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
        const res = await fetch(`http://localhost:4000/stats/${playerId}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const json = await res.json();
        setRows(Array.isArray(json.data) ? json.data : []);
      } catch (err: any) {
        setError(err.message || 'Error fetching stats');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, playerId]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ width: '720px', maxHeight: '70vh', overflow: 'auto' }}>
        <h3>Player Stats {playerName ? `- ${playerName}` : ''}</h3>
        {loading && <p>Loading stats...</p>}
        {error && <p style={{ color: 'salmon' }}>{error}</p>}
        {!loading && !error && rows.length === 0 && <p>No stats available.</p>}
        {!loading && rows.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(rows[0]).map(k => (
                  <th key={k} style={{ textAlign: 'left', padding: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {Object.keys(rows[0]).map(k => (
                    <td key={k} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{String(r[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="modal-cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
