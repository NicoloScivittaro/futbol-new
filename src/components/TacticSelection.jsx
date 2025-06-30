import React, { useState } from 'react';
import './TacticSelection.css';

const formations = {
  '4-3-3': {
    goalkeeper: [{ top: '90%', left: '50%' }],
    defenders: [
      { top: '75%', left: '20%' },
      { top: '75%', left: '40%' },
      { top: '75%', left: '60%' },
      { top: '75%', left: '80%' },
    ],
    midfielders: [
      { top: '50%', left: '25%' },
      { top: '50%', left: '50%' },
      { top: '50%', left: '75%' },
    ],
    forwards: [
      { top: '25%', left: '20%' },
      { top: '25%', left: '50%' },
      { top: '25%', left: '80%' },
    ],
  },
  '3-5-2': {
    goalkeeper: [{ top: '90%', left: '50%' }],
    defenders: [
        { top: '75%', left: '25%' },
        { top: '75%', left: '50%' },
        { top: '75%', left: '75%' },
    ],
    midfielders: [
        { top: '50%', left: '15%' },
        { top: '50%', left: '35%' },
        { top: '50%', left: '50%' },
        { top: '50%', left: '65%' },
        { top: '50%', left: '85%' },
    ],
    forwards: [
        { top: '25%', left: '40%' },
        { top: '25%', left: '60%' },
    ],
  },
   '4-4-2': {
    goalkeeper: [{ top: '90%', left: '50%' }],
    defenders: [
      { top: '75%', left: '20%' },
      { top: '75%', left: '40%' },
      { top: '75%', left: '60%' },
      { top: '75%', left: '80%' },
    ],
    midfielders: [
      { top: '50%', left: '20%' },
      { top: '50%', left: '40%' },
      { top: '50%', left: '60%' },
      { top: '50%', left: '80%' },
    ],
    forwards: [
      { top: '25%', left: '40%' },
      { top: '25%', left: '60%' },
    ],
  },
};

const TacticSelection = () => {
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');

  const renderPlayers = () => {
    const formation = formations[selectedFormation];
    if (!formation) return null;

    let players = [];
    for (const role in formation) {
        formation[role].forEach((pos, index) => {
            players.push(
                <div key={`${role}-${index}`} className={`player ${role}`} style={{ top: pos.top, left: pos.left }}></div>
            );
        });
    }
    return players;
  };

  return (
    <div className="tactic-board-container">
        <h2 className="tactic-title">Scegli il Modulo</h2>
        <div className="formation-selector">
            <select onChange={(e) => setSelectedFormation(e.target.value)} value={selectedFormation}>
                {Object.keys(formations).map(formation => (
                    <option key={formation} value={formation}>{formation}</option>
                ))}
            </select>
        </div>
        <div className="pitch">
            <div className="pitch-lines"></div>
            {renderPlayers()}
        </div>
    </div>
  );
};

export default TacticSelection;
