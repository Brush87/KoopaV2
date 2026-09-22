import React from 'react';

interface DraftCardProps {
  player?: any;
  pickNumber?: number;
}

const DraftCard: React.FC<DraftCardProps> = ({ player, pickNumber }) => {
  if (!player) {
    return (
      <div className="card-empty">
        <span className="empty-pick-num">#{pickNumber ?? '—'}</span>
      </div>
    );
  }

  const pic = player.headshot?.url || (typeof player.headshot === 'string' ? player.headshot : '');
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

  const posClass = posCode.replace(/[^A-Z0-9]/g, '') || 'UNK';
  const givenPos = (player.positionCode || posCode || '').toString();
  let displayPos = givenPos;
  if (givenPos === 'R') displayPos = 'RW';
  if (givenPos === 'L') displayPos = 'LW';

  const firstName = player.firstName?.default || player.firstName || '';
  const lastName = player.lastName?.default || player.lastName || '';
  const team = player.team || player.teamName || 'UNK';

  return (
    <div className={`draft-card pos-${posClass}`}>
      <div className="card-top">
        {pic ? (
          <img src={pic} alt="headshot" className="player-headshot" />
        ) : player.emoji ? (
          <div className="player-emoji" aria-hidden>{player.emoji}</div>
        ) : (
          <div className="player-avatar-fallback">{firstName.charAt(0)}{lastName.charAt(0)}</div>
        )}
      </div>

      <div className="player-name">
        <div className="player-first">{firstName}</div>
        <div className="player-last">{lastName}</div>
      </div>

      <div className="player-meta">
        <span className="meta-team">{team}</span>
        <span className="meta-divider">•</span>
        <span className="meta-pos">{displayPos}</span>
      </div>
    </div>
  );
};

export default DraftCard;
