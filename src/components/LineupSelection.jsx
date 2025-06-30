import React, { useState, useMemo } from 'react';
import './LineupSelection.css';

const getPositionsForTactic = (tactic) => {
  const layouts = {
    '4-3-3': [
      { role: 'goalkeeper', top: '92%', left: '50%' },
      { role: 'defender', top: '75%', left: '20%' }, { role: 'defender', top: '75%', left: '40%' }, { role: 'defender', top: '75%', left: '60%' }, { role: 'defender', top: '75%', left: '80%' },
      { role: 'midfielder', top: '50%', left: '25%' }, { role: 'midfielder', top: '50%', left: '50%' }, { role: 'midfielder', top: '50%', left: '75%' },
      { role: 'forward', top: '25%', left: '20%' }, { role: 'forward', top: '25%', left: '50%' }, { role: 'forward', top: '25%', left: '80%' },
    ],
    '3-5-2': [
        { role: 'goalkeeper', top: '92%', left: '50%' },
        { role: 'defender', top: '75%', left: '25%' }, { role: 'defender', top: '75%', left: '50%' }, { role: 'defender', top: '75%', left: '75%' },
        { role: 'midfielder', top: '55%', left: '15%' }, { role: 'midfielder', top: '50%', left: '35%' }, { role: 'midfielder', top: '45%', left: '50%' }, { role: 'midfielder', top: '50%', left: '65%' }, { role: 'midfielder', top: '55%', left: '85%' },
        { role: 'forward', top: '25%', left: '40%' }, { role: 'forward', top: '25%', left: '60%' },
    ],
    '4-4-2': [
        { role: 'goalkeeper', top: '92%', left: '50%' },
        { role: 'defender', top: '75%', left: '20%' }, { role: 'defender', top: '75%', left: '40%' }, { role: 'defender', top: '75%', left: '60%' }, { role: 'defender', top: '75%', left: '80%' },
        { role: 'midfielder', top: '50%', left: '20%' }, { role: 'midfielder', top: '50%', left: '40%' }, { role: 'midfielder', top: '50%', left: '60%' }, { role: 'midfielder', top: '50%', left: '80%' },
        { role: 'forward', top: '25%', left: '40%' }, { role: 'forward', top: '25%', left: '60%' },
    ],
    '4-2-3-1': [
        { role: 'goalkeeper', top: '92%', left: '50%' },
        { role: 'defender', top: '75%', left: '20%' }, { role: 'defender', top: '75%', left: '40%' }, { role: 'defender', top: '75%', left: '60%' }, { role: 'defender', top: '75%', left: '80%' },
        { role: 'midfielder', top: '60%', left: '35%' }, { role: 'midfielder', top: '60%', left: '65%' }, // 2 MC
        { role: 'attacking-midfielder', top: '45%', left: '25%' }, { role: 'attacking-midfielder', top: '40%', left: '50%' }, { role: 'attacking-midfielder', top: '45%', left: '75%' }, // 3 COC
        { role: 'forward', top: '20%', left: '50%' }, // 1 ATT
    ],
  };
  return layouts[tactic] || layouts['4-3-3'];
};

const LineupSelection = ({ selectionData, onNext, onBack }) => {
  const positions = useMemo(() => getPositionsForTactic(selectionData.tactic), [selectionData.tactic]);
  // Funzione per mappare il ruolo dal dato API a una classe CSS
  const getRole = (position) => {
      if (position === 'Goalkeeper') return 'goalkeeper';
      if (position === 'Defence') return 'defender';
      if (position === 'Midfield') return 'midfielder';
      if (position === 'Offence' || position === 'Attack') return 'forward';
      return 'player'; // Ruolo di fallback
  };

  // Inizializza i giocatori con il ruolo corretto
  const initialPlayers = (selectionData.players || []).map(p => ({ ...p, role: getRole(p.position) }));

  const [roster, setRoster] = useState(initialPlayers);
  const [lineup, setLineup] = useState({}); // Es: { 'goalkeeper-0': player, ... }
  const [subs, setSubs] = useState([]);

  const handleClearLineup = () => {
    const playersInLineup = Object.values(lineup);
    setRoster(prev => [...prev, ...playersInLineup]);
    setLineup({});
  };

  const handleAutoFillLineup = () => {
    const availablePlayers = [...initialPlayers];
    const newLineup = {};

    const roleToPositionMap = {
      'goalkeeper': ['Goalkeeper'],
      'defender': ['Defence'],
      'midfielder': ['Midfield'],
      'attacking-midfielder': ['Midfield', 'Attack', 'Offence'],
      'forward': ['Attack', 'Offence'],
    };

    Object.entries(formationLayout).forEach(([role, positionsInRole]) => {
      positionsInRole.forEach((_, index) => {
        const positionKey = `${role}-${index}`;
        const targetApiPositions = roleToPositionMap[role];
        
        let foundPlayerIndex = -1;
        if (targetApiPositions) {
          for (const apiPos of targetApiPositions) {
            foundPlayerIndex = availablePlayers.findIndex(p => p.position === apiPos);
            if (foundPlayerIndex !== -1) break;
          }
        }

        if (foundPlayerIndex !== -1) {
          const playerToAssign = availablePlayers.splice(foundPlayerIndex, 1)[0];
          newLineup[positionKey] = playerToAssign;
        }
      });
    });

    setLineup(newLineup);
    setRoster(availablePlayers);
    setSubs([]);
  };

  const handleDragStart = (e, player) => {
    e.dataTransfer.setData('player', JSON.stringify(player));
  };

  const handleDrop = (e, area, positionKey) => {
    e.preventDefault();
    const playerData = JSON.parse(e.dataTransfer.getData('player'));
    const player = { ...playerData };

    // Rimuove il giocatore da tutte le liste per evitare duplicati
    setRoster(prev => prev.filter(p => p.id !== player.id));
    setSubs(prev => prev.filter(p => p.id !== player.id));
    const newLineup = { ...lineup };
    Object.keys(newLineup).forEach(key => {
        if (newLineup[key] && newLineup[key].id === player.id) {
            delete newLineup[key];
        }
    });

    if (area === 'lineup') {
        // Se la posizione era occupata, sposta il vecchio giocatore nella rosa
        if(newLineup[positionKey]) {
            setRoster(prev => [...prev, newLineup[positionKey]]);
        }
        newLineup[positionKey] = player;
        setLineup(newLineup);
    } else if (area === 'subs') {
        setSubs(prev => [...prev, player]);
    } else if (area === 'roster') {
        setRoster(prev => [...prev, player]);
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const renderPosition = (role, pos, index) => {
    const key = `${role}-${index}`;
    const playerInPosition = lineup[key];
    return (
        <div 
            key={key} 
            className="player-position" 
            style={{ top: pos.top, left: pos.left }}
            onDrop={(e) => handleDrop(e, 'lineup', key)}
            onDragOver={allowDrop}
        >
            {playerInPosition ? (
                <div className={`player-token ${playerInPosition.role}`} draggable onDragStart={(e) => handleDragStart(e, playerInPosition)}>{playerInPosition.name.substring(0,1)}</div>
            ) : (
                <span className="role-indicator">{role.substring(0,3)}</span>
            )}
        </div>
    );
  }

  const formationLayout = useMemo(() => {
    return positions.reduce((acc, pos) => {
        (acc[pos.role] = acc[pos.role] || []).push(pos);
        return acc;
    }, {});
  }, [positions]);

  return (
    <div className="lineup-container">
        <div className="roster-panel" onDrop={(e) => handleDrop(e, 'roster')} onDragOver={allowDrop}>
            <h3>Rosa Disponibile</h3>
            {roster.map(player => (
                <div key={player.id} className="player-card" draggable onDragStart={(e) => handleDragStart(e, player)}>
                    <span className="player-name">{player.name}</span>
                    <span className="player-position-text">{player.position}</span>
                </div>
            ))}
        </div>

        <div className="pitch-container">
            <div className="pitch-header">
              <h3>Titolari ({selectionData.tactic || '4-3-3'})</h3>
              <button onClick={handleAutoFillLineup} className="action-button">Formazione Automatica</button>
              <button onClick={handleClearLineup} className="action-button clear-button">Svuota Formazione</button>
              <div className="actions-panel">
                  <button onClick={onBack} className="action-button back-button">Indietro</button>
                  <button onClick={() => onNext({ lineup, subs })} className="action-button save-button">Salva Formazione</button>
              </div>
            </div>
            <div className="pitch-display">
                {Object.entries(formationLayout).map(([role, positions]) => 
                    positions.map((pos, index) => renderPosition(role, pos, index))
                )}
            </div>
        </div>

        <div className="subs-panel" onDrop={(e) => handleDrop(e, 'subs')} onDragOver={allowDrop}>
            <h3>Panchina</h3>
            {subs.map(player => (
                <div key={player.id} className="player-card" draggable onDragStart={(e) => handleDragStart(e, player)}>
                    {player.name}
                </div>
            ))}
        </div>
    </div>
  );
};

export default LineupSelection;
