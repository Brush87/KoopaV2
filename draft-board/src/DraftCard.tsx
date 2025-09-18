import React from 'react';

interface DraftCardProps {
  player?: any;
}

const DraftCard: React.FC<DraftCardProps> = ({ player }) => {
  if (!player) {
    return (
      <div className="card-empty">
        <span>Empty</span>
      </div>
    );
  }
  // Picture URL from player.headshot or player.headshot.url or fallback
  let pic = player.headshot?.url || player.headshot || '';
  return (
    <div className="draft-card">
      {pic && <img src={pic} alt="headshot" />}
      <div className="player-name">{player.firstName?.default} {player.lastName?.default}</div>
      <div className="player-meta">{player.team} | {String(player.position || '').replace('men','')}</div>
    </div>
  );
};

export default DraftCard;
