import React from 'react';

interface DraftCardProps {
  player?: any;
  pickNumber?: number;
}

const DraftCard: React.FC<DraftCardProps> = ({ player, pickNumber }) => {
  if (!player) {
    return (
      <div className="card-empty">
        <span>Pick {pickNumber ?? '—'}</span>
      </div>
    );
  }
  // Picture URL from player.headshot or player.headshot.url or fallback
  let pic = player.headshot?.url || player.headshot || '';
  // Prefer explicit positionCode; provide a small fallback mapping
  const rawPos = (player.positionCode || player.position || '') as string;
  const normalize = (s: any) => String(s || '').trim();
  let posCode = normalize(rawPos).toUpperCase();
  if (!posCode) {
    const posName = normalize(player.position?.default || player.position);
    const p = posName.toLowerCase();
    if (p.includes('goal')) posCode = 'G';
    else if (p.includes('def')) posCode = 'D';
    else if (p.includes('cent') || p === 'c') posCode = 'C';
    else if (p.includes('left')) posCode = 'L';
    else if (p.includes('right')) posCode = 'R';
    else posCode = (posName.charAt(0) || '').toUpperCase();
  }

  // sanitize for classname
  const posClass = posCode.replace(/[^A-Z0-9]/g, '') || 'UNK';

  // Display RW / LW for right/left wings when appropriate, but keep posClass as R/L for styling
  const givenPos = (player.positionCode || posCode || '').toString();
  let displayPos = givenPos;
  if (givenPos === 'R') displayPos = 'RW';
  if (givenPos === 'L') displayPos = 'LW';

  return (
    <div className={`draft-card pos-${posClass}`}>
      {pic ? <img src={pic} alt="headshot" /> : (player.emoji ? <div className="player-emoji" aria-hidden>{player.emoji}</div> : null)}
      <div className="player-name">
        <div className="player-first">{player.firstName?.default}</div>
        <div className="player-last">{player.lastName?.default}</div>
      </div>

  <div className="player-meta">{player.team} | {displayPos}</div>
    </div>
  );
};

export default DraftCard;
