import React, { useState, useEffect } from 'react';
import './CoachDashboard.css';

// Funzione per generare dati di stato casuali per i giocatori
const generatePlayerStatus = (players) => {
  const conditions = ['Ottima', 'Buona', 'Stanca', 'Affaticata'];
  return players.map(player => ({
    ...player,
    form: Math.floor(Math.random() * 61) + 40, // Forma da 40 a 100
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    injured: Math.random() < 0.05, // 5% di probabilità di infortunio
  }));
};

const CoachDashboard = ({ selectionData, onNext, onBack, onGoToSeason }) => {
  const [playerStatuses, setPlayerStatuses] = useState([]);

  useEffect(() => {
    // Combina i giocatori della formazione titolare e della panchina
    const allPlayersInLineup = [...Object.values(selectionData.lineup), ...selectionData.subs];
    setPlayerStatuses(generatePlayerStatus(allPlayersInLineup));
  }, [selectionData]);

  const getFormColor = (form) => {
    if (form >= 85) return 'form-high';
    if (form >= 60) return 'form-medium';
    return 'form-low';
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Pannello Allenatore</h2>
      <p className="team-name">Squadra: {selectionData.team.name}</p>

      <div className="player-status-table">
        <div className="table-header">
          <div>Giocatore</div>
          <div>Forma</div>
          <div>Condizione</div>
          <div>Stato</div>
        </div>
        <div className="table-body">
          {playerStatuses.map(player => (
            <div key={player.id} className={`table-row ${player.injured ? 'injured' : ''}`}>
              <div>{player.name}</div>
              <div>
                <div className="form-bar-container">
                  <div className={`form-bar ${getFormColor(player.form)}`} style={{ width: `${player.form}%` }}></div>
                </div>
                <span className="form-value">{player.form}</span>
              </div>
              <div>{player.condition}</div>
              <div>{player.injured ? 'Infortunato' : 'Disponibile'}</div>
            </div>
          ))}
        </div>
      </div>

            <div className="dashboard-actions">
        <button onClick={onBack} className="action-button back-button">Torna alla Formazione</button>
        <button onClick={onGoToSeason} className="action-button season-button">Gestisci Stagione</button>
        <button onClick={onNext} className="action-button next-button">Simula Partita</button>
      </div>
    </div>
  );
};

export default CoachDashboard;
