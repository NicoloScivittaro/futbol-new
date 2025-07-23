import React from 'react';
import './PlayerDetails.css';

const PlayerDetails = ({ player, onClose }) => {
  if (!player) return null;

  const renderStats = () => {
    const stats = [];
    // Basic Info
    if (player.eta) stats.push({ label: 'Età', value: player.eta });
    if (player.nazionalita) stats.push({ label: 'Nazionalità', value: player.nazionalita });
    if (player.piede) stats.push({ label: 'Piede', value: player.piede });
    if (player.altezza) stats.push({ label: 'Altezza', value: `${player.altezza} cm` });
    if (player.peso) stats.push({ label: 'Peso', value: `${player.peso} kg` });

    // Goalkeeper stats
    if (player.ruolo === 'POR') {
        if (player.tuffo) stats.push({ label: 'Tuffo', value: player.tuffo });
        if (player.presa) stats.push({ label: 'Presa', value: player.presa });
        if (player.rinvio) stats.push({ label: 'Rinvio', value: player.rinvio });
        if (player.riflessi) stats.push({ label: 'Riflessi', value: player.riflessi });
        if (player.reattivita) stats.push({ label: 'Reattività', value: player.reattivita });
        if (player.piazzamento) stats.push({ label: 'Piazzamento', value: player.piazzamento });
    } else {
    // Outfield player stats
        if (player.velocita) stats.push({ label: 'Velocità', value: player.velocita });
        if (player.tiro) stats.push({ label: 'Tiro', value: player.tiro });
        if (player.passaggio) stats.push({ label: 'Passaggio', value: player.passaggio });
        if (player.dribbling) stats.push({ label: 'Dribbling', value: player.dribbling });
        if (player.difesa) stats.push({ label: 'Difesa', value: player.difesa });
        if (player.fisico) stats.push({ label: 'Fisico', value: player.fisico });
    }
    return stats.map(stat => (
        <div key={stat.label} className="stat-row">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">{stat.value}</span>
        </div>
    ));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{player.name}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
            <div className="player-summary">
                <span className="player-detail-role">{player.ruolo}</span>
                <span className="player-detail-overall">OVR: {player.overall}</span>
            </div>
            <div className="stats-grid">
                {renderStats()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
