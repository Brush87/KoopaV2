import React, { useState } from 'react';
import { NHL_TEAM_ABBRS } from './constants';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (player: any) => void;
};

const POSITION_OPTIONS = [
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'G', label: 'G' },
  { value: 'R', label: 'RW' },
  { value: 'L', label: 'LW' },
];

export default function AddPlayerModal({ open, onClose, onCreate }: Props) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [teamAbbr, setTeamAbbr] = useState('');
  const [position, setPosition] = useState('C');

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const player = {
      id: `new-${Date.now()}`,
      firstName: { default: first || 'New' },
      lastName: { default: last || 'Player' },
      team: teamAbbr || 'UNK',
      positionCode: position,
      emoji: '🤢',
      headshot: null,
    };
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(player)
        });
        if (res.ok) {
          const data = await res.json();
          onCreate(data.player || player);
        } else {
          console.error('Failed to persist new player, status', res.status);
          onCreate(player);
        }
      } catch (err) {
        console.error('Error saving player', err);
        onCreate(player);
      }
    })();
    // reset
    setFirst('');
    setLast('');
    setTeamAbbr('');
    setPosition('C');
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ position: 'relative' }}>
        <div className="modal-player-spot">
          <span className="modal-player-emoji">🤢</span>
        </div>
        <button className="modal-close-button" aria-label="Close" onClick={onClose}>×</button>
        <h3>Add New Player</h3>
        <form onSubmit={submit}>
          <label>Firstname
            <input value={first} onChange={e => setFirst(e.target.value)} required />
          </label>
          <label>Lastname
            <input value={last} onChange={e => setLast(e.target.value)} required />
          </label>
          <label>Team Abbr
            <input list="teams" value={teamAbbr} onChange={e => setTeamAbbr(e.target.value)} placeholder="NYR" />
            <datalist id="teams">
              {NHL_TEAM_ABBRS.map(t => <option key={t} value={t} />)}
            </datalist>
          </label>
          <label>Position
            <select value={position} onChange={e => setPosition(e.target.value)}>
              {POSITION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="modal-cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="draft-button">Create & Draft</button>
          </div>
        </form>
      </div>
    </div>
  );
}
