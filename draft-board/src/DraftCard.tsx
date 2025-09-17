import React from 'react';

interface DraftCardProps {
  player?: any;
}

const DraftCard: React.FC<DraftCardProps> = ({ player }) => {
  if (!player) {
    return (
      <div style={{ border: '1px dashed #bbb', borderRadius: 6, padding: 8, minHeight: 80, textAlign: 'center', color: '#aaa' }}>
        <span>Empty</span>
      </div>
    );
  }
  // Picture URL from player.headshot or player.headshot.url or fallback
  let pic = player.headshot?.url || player.headshot || '';
  return (
    <div style={{ border: '1px solid #888', borderRadius: 6, padding: 8, minHeight: 80, textAlign: 'center' }}>
      {pic && <img src={pic} alt="headshot" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginBottom: 4 }} />}
      <div style={{ fontWeight: 'bold' }}>{player.firstName?.default} {player.lastName?.default}</div>
      <div style={{ fontSize: 13 }}>{player.team} | {player.position.replace('men','')}</div>
    </div>
  );
};

export default DraftCard;
