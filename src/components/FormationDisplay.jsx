import React from 'react';
import './FormationDisplay.css';

const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { role: 'goalkeeper', top: '92%', left: '50%' },
      { role: 'defender', top: '75%', left: '15%' },
      { role: 'defender', top: '75%', left: '38%' },
      { role: 'defender', top: '75%', left: '62%' },
      { role: 'defender', top: '75%', left: '85%' },
      { role: 'midfielder', top: '50%', left: '30%' },
      { role: 'midfielder', top: '45%', left: '50%' },
      { role: 'midfielder', top: '50%', left: '70%' },
      { role: 'forward', top: '25%', left: '30%' },
      { role: 'forward', top: '20%', left: '50%' },
      { role: 'forward', top: '25%', left: '70%' }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { role: 'goalkeeper', top: '92%', left: '50%' },
      { role: 'defender', top: '75%', left: '15%' },
      { role: 'defender', top: '75%', left: '38%' },
      { role: 'defender', top: '75%', left: '62%' },
      { role: 'defender', top: '75%', left: '85%' },
      { role: 'midfielder', top: '50%', left: '15%' },
      { role: 'midfielder', top: '50%', left: '38%' },
      { role: 'midfielder', top: '50%', left: '62%' },
      { role: 'midfielder', top: '50%', left: '85%' },
      { role: 'forward', top: '25%', left: '35%' },
      { role: 'forward', top: '25%', left: '65%' }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { role: 'goalkeeper', top: '92%', left: '50%' },
      { role: 'defender', top: '75%', left: '30%' },
      { role: 'defender', top: '75%', left: '50%' },
      { role: 'defender', top: '75%', left: '70%' },
      { role: 'midfielder', top: '55%', left: '15%' },
      { role: 'midfielder', top: '50%', left: '35%' },
      { role: 'midfielder', top: '45%', left: '50%' },
      { role: 'midfielder', top: '50%', left: '65%' },
      { role: 'midfielder', top: '55%', left: '85%' },
      { role: 'forward', top: '25%', left: '35%' },
      { role: 'forward', top: '25%', left: '65%' }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { role: 'goalkeeper', top: '92%', left: '50%' },
      { role: 'defender', top: '75%', left: '15%' },
      { role: 'defender', top: '75%', left: '38%' },
      { role: 'defender', top: '75%', left: '62%' },
      { role: 'defender', top: '75%', left: '85%' },
      { role: 'midfielder', top: '60%', left: '35%' },
      { role: 'midfielder', top: '60%', left: '65%' },
      { role: 'attacking-midfielder', top: '45%', left: '25%' },
      { role: 'attacking-midfielder', top: '40%', left: '50%' },
      { role: 'attacking-midfielder', top: '45%', left: '75%' },
      { role: 'forward', top: '20%', left: '50%' }
    ]
  }
};

const getRole = (position) => {
  if (!position) return '?';
  switch (position) {
    case 'Goalkeeper': return 'P';
    case 'Defender': return 'D';
    case 'Midfielder': return 'C';
    case 'Attacker': return 'A';
    default: return position.charAt(0).toUpperCase();
  }
};

const FormationDisplay = ({
  formation,
  currentFormation = '4-3-3',
  onPlayerClick,
  selectedPlayerForSwap,
  calculatePlayerRating,
  getPositionStatus,
  showControls = true,
  onAutoFill,
  onClear,
  onSave,
  onBack,
  teamName
}) => {
  return (
      <div className="lineup-selection">
        {showControls && (
          <div className="controls">
            <div className="formation-controls">
              {teamName && <span className="lineup-team-name">{teamName}</span>}
            </div>
            <div className="lineup-actions">
              {onAutoFill && (
                <button className="control-button auto-button" onClick={onAutoFill}>
                  Auto
                </button>
              )}
              {onClear && (
                <button className="control-button clear-button" onClick={onClear}>
                  Svuota
                </button>
              )}
              {onBack && (
                <button className="control-button back-button" onClick={onBack}>
                  Indietro
                </button>
              )}
              {onSave && (
                <button className="control-button save-button" onClick={onSave}>
                  Salva
                </button>
              )}
            </div>
          </div>
        )}

        <div className="main-content">
          <div className="player-list-panel">
            <h2>Giocatori Disponibili</h2>
            <div className="player-list">
              {formation.rosaDisponibile.map((player, index) => (
                <div
                  key={player.id}
                  onClick={() => onPlayerClick(player, 'rosaDisponibile')}
                  className={`player-card ${selectedPlayerForSwap?.player.id === player.id ? 'selected' : ''}`}>
                  <div className="player-role">{getRole(player.position)}</div>
                  <div className="player-info">
                    <p className="player-name">{player.name}</p>
                    <span className="player-rating">OVR: {calculatePlayerRating(player)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="formation-title">{currentFormation}</div>
            {FORMATIONS[currentFormation].positions.map((position, index) => {
              const positionKey = `${position.role}-${index}`;
                            const player = formation.titolari
                ? (Array.isArray(formation.titolari)
                    ? formation.titolari.find(p => p.fieldPosition === positionKey) // Handle array case
                    : formation.titolari[positionKey]) // Handle object case
                : null;
              const fieldRole = position.role;
              const status = player && getPositionStatus ? getPositionStatus(player, fieldRole) : 'natural';
              const rating = player ? calculatePlayerRating(player, fieldRole) : '';

              return (
                <div
                  key={positionKey}
                  className="position-slot"
                  style={{ top: position.top, left: position.left }}
                  onClick={() => onPlayerClick(player, 'titolari', positionKey)} // Pass positionKey
                >
                  {player ? (
                    <div className={`player-token ${status} ${selectedPlayerForSwap?.player.id === player.id ? 'selected' : ''}`}>
                      <div className="player-name">{player ? player.name : positionKey.split('-')[0]}</div>
                      <div className="player-token-rating">{rating}</div>
                      <div className="player-token-position">{getRole(player.position)}</div>
                    </div>
                  ) : (
                    <div className="empty-position">
                      {position.role}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="player-list-panel">
            <h2>Panchina</h2>
            <div
              className="bench-drop-zone"
              onClick={() => onPlayerClick(null, 'panchina')}
            >
              + Aggiungi in panchina
            </div>
            <div className="player-list">
              {formation.panchina.map((player, index) => (
                <div
                  key={player.id}
                  onClick={() => onPlayerClick(player, 'panchina')}
                  className={`player-card ${selectedPlayerForSwap?.player.id === player.id ? 'selected' : ''}`}>
                  <div className="player-role">{getRole(player.position)}</div>
                  <div className="player-info">
                    <p className="player-name">{player.name}</p>
                    <span className="player-rating">OVR: {calculatePlayerRating(player, 'panchina')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
  );
};

export default FormationDisplay; 