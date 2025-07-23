import React, { useState, useEffect } from 'react';
import './LineupSelection.css';
import FormationDisplay from './FormationDisplay';
import { calcolaPrestazionePerRuolo } from '../utils/performanceCalculator';

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

/*
const getPositionsForTactic = (tactic) => {
  return FORMATIONS[tactic]?.positions || FORMATIONS['4-3-3'].positions;
};
*/

const getCanonicalPosition = (apiPosition) => {
  if (typeof apiPosition !== 'string') return 'midfielder';
  const pos = apiPosition.toUpperCase().trim();

  // Handle Italian abbreviated positions first
  if (pos === 'POR') return 'goalkeeper';
  if (pos === 'DIF') return 'defender';
  if (pos === 'CEN') return 'midfielder';
  if (pos === 'ATT') return 'forward';
  if (pos === 'TQ') return 'attacking-midfielder'; // Trequartista
  if (pos === 'ALA' || pos === 'AS' || pos === 'SS') return 'forward'; // Ala/Ala Sinistra/Seconda Punta
  if (pos === 'PC') return 'forward'; // Prima Punta/Centro

  // Handle full Italian terms
  const lowerPos = pos.toLowerCase();
  if (lowerPos.includes('goal') || lowerPos.includes('portiere')) return 'goalkeeper';
  if (lowerPos.includes('defen') || lowerPos.includes('back') || lowerPos.includes('difensore') || lowerPos.includes('terzino')) return 'defender';
  if ((lowerPos.includes('attack') && lowerPos.includes('midfield')) || lowerPos.includes('trequartista') || (lowerPos.includes('centrocampista') && lowerPos.includes('offensivo'))) return 'attacking-midfielder';
  if (lowerPos.includes('midfield') || lowerPos.includes('centrocampista')) return 'midfielder';
  if (lowerPos.includes('forward') || lowerPos.includes('attack') || lowerPos.includes('striker') || lowerPos.includes('winger') || lowerPos.includes('attaccante') || lowerPos.includes('ala')) return 'forward';

  return 'midfielder'; // Default to midfielder for unknown roles
};

const POSITION_COMPATIBILITY = {
  goalkeeper: {
    goalkeeper: 1,
    defender: 0.1,
    midfielder: 0.1,
    'attacking-midfielder': 0.1,
    forward: 0.1,
  },
  defender: {
    goalkeeper: 0.1,
    defender: 1,
    midfielder: 0.8, // Defensive midfielders are common
    'attacking-midfielder': 0.4,
    forward: 0.3,
  },
  midfielder: {
    goalkeeper: 0.1,
    defender: 0.7, // Can adapt to a defensive role
    midfielder: 1,
    'attacking-midfielder': 0.9, // Strong compatibility
    forward: 0.6, // Can be a makeshift forward
  },
  'attacking-midfielder': {
    goalkeeper: 0.1,
    defender: 0.3,
    midfielder: 0.9, // Can play deeper
    'attacking-midfielder': 1,
    forward: 0.9, // High compatibility, often plays as a second striker
  },
  forward: {
    goalkeeper: 0.1,
    defender: 0.3,
    midfielder: 0.6, // Can drop back to midfield
    'attacking-midfielder': 0.85, // High compatibility, can play as an attacking midfielder
    forward: 1,
  },
};

const LineupSelection = ({ selectionData, onNext, onBack, initialLineup, onPlayerSelect }) => {
  const [currentFormation] = useState(initialLineup?.formation || '4-3-3');
  const [formation, setFormation] = useState({ titolari: [], panchina: [], rosaDisponibile: [] });
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState(null);
  const [swapMode, setSwapMode] = useState(false); // New state for swap mode

  useEffect(() => {
    const fullSquadRaw = selectionData?.userTeam?.squad || [];
    const fullSquad = JSON.parse(JSON.stringify(fullSquadRaw));

    const initialTitolari = (initialLineup?.titolari || []).map(p => {
        const playerWithStats = fullSquad.find(fp => fp.id === p.id) || p;
        return { ...playerWithStats, fieldPosition: p.fieldPosition };
    });
    const initialPanchina = initialLineup?.panchina || [];

    const usedPlayerIds = new Set([
      ...initialTitolari.map(p => p.id),
      ...initialPanchina.map(p => p.id)
    ]);

    const availablePlayers = fullSquad.filter(p => !usedPlayerIds.has(p.id));

    setFormation({
      titolari: initialTitolari,
      panchina: initialPanchina,
      rosaDisponibile: availablePlayers
    });
  }, [selectionData, initialLineup]);

  const handlePlayerClick = (player, sourceListName, positionKey) => {
    // If not in swap mode, show player details and do nothing else.
    if (!swapMode) {
      if (player) {
        onPlayerSelect(player);
      }
      return;
    }

    // --- The rest of the function is the existing swap logic ---
    const allPlayers = selectionData.players;

    if (!selectedPlayerForSwap) {
      if (player) {
        setSelectedPlayerForSwap({ player, source: sourceListName, positionKey });
      }
      return;
    }

    const { player: player1, source: source1, positionKey: key1 } = selectedPlayerForSwap;

    if (player && player1.id === player.id) {
      setSelectedPlayerForSwap(null);
      return;
    }
    
    const player2 = player;
    const source2 = sourceListName;
    const key2 = positionKey;

    const newLists = {
      titolari: JSON.parse(JSON.stringify(formation.titolari)),
      panchina: JSON.parse(JSON.stringify(formation.panchina)),
      rosaDisponibile: JSON.parse(JSON.stringify(formation.rosaDisponibile)),
    };

    const fullPlayer1 = allPlayers.find(p => p.id === player1.id);
    const fullPlayer2 = player2 ? allPlayers.find(p => p.id === player2.id) : null;

    if (!fullPlayer1) {
      console.error("Could not find player1 data. Aborting swap.");
      setSelectedPlayerForSwap(null);
      return;
    }

    let p1Index = newLists[source1].findIndex(p => p.id === player1.id);
    if (p1Index > -1) newLists[source1].splice(p1Index, 1);

    if (fullPlayer2) {
      let p2Index = newLists[source2].findIndex(p => p.id === player2.id);
      if (p2Index > -1) newLists[source2].splice(p2Index, 1);
    }

    const player1ForDest = { ...fullPlayer1 };
    if (source2 === 'titolari') player1ForDest.fieldPosition = key2;
    newLists[source2].push(player1ForDest);

    if (fullPlayer2) {
      const player2ForDest = { ...fullPlayer2 };
      if (source1 === 'titolari') player2ForDest.fieldPosition = key1;
      newLists[source1].push(player2ForDest);
    }

    setFormation({
      titolari: newLists.titolari,
      panchina: newLists.panchina,
      rosaDisponibile: newLists.rosaDisponibile,
    });

    setSelectedPlayerForSwap(null);
  };

  const handleAutoFill = () => {
    const allPlayers = [...formation.titolari, ...formation.panchina, ...formation.rosaDisponibile];
    const formationSlots = FORMATIONS[currentFormation].positions;

    const playersByRole = {
      goalkeeper: [],
      defender: [],
      midfielder: [],
      'attacking-midfielder': [],
      forward: [],
    };

    allPlayers.forEach(player => {
      const role = getCanonicalPosition(player.ruolo);
      playersByRole[role].push(player);
    });

    for (const role in playersByRole) {
      playersByRole[role].sort((a, b) => {
        const ratingA = calculatePlayerRating(a, role);
        const ratingB = calculatePlayerRating(b, role);
        return ratingB - ratingA;
      });
    }

    const newTitolari = [];
    const availablePlayers = JSON.parse(JSON.stringify(playersByRole));

    formationSlots.forEach((slot, index) => {
      const role = slot.role;
      let playerToAssign = null;

      if (availablePlayers[role] && availablePlayers[role].length > 0) {
        playerToAssign = availablePlayers[role].shift();
      } else {
        const fallbackRoles = ['forward', 'attacking-midfielder', 'midfielder', 'defender'];
        for (const fallbackRole of fallbackRoles) {
          if (availablePlayers[fallbackRole] && availablePlayers[fallbackRole].length > 0) {
            playerToAssign = availablePlayers[fallbackRole].shift();
            break;
          }
        }
      }

      if (playerToAssign) {
        playerToAssign.fieldPosition = `${role}-${index}`;
        newTitolari.push(playerToAssign);
      }
    });

    const remainingPlayers = Object.values(availablePlayers).flat();
    remainingPlayers.sort((a, b) => (b.overall || 0) - (a.overall || 0));

    const newPanchina = remainingPlayers.slice(0, 12);
    const newRosaDisponibile = remainingPlayers.slice(12);

    setFormation({
      titolari: newTitolari,
      panchina: newPanchina,
      rosaDisponibile: newRosaDisponibile,
    });
  };

  const calculatePlayerRating = (player, fieldRole) => {
    if (!player) return 0;

    const playerRole = getCanonicalPosition(player.ruolo);

    const hasAllStats = player.velocita && player.tiro && player.passaggio && player.dribbling && player.difesa && player.fisico;
    const hasGoalkeeperStats = player.tuffo && player.presa && player.rinvio && player.riflessi && player.reattivita && player.piazzamento;

    if (playerRole === 'goalkeeper' && hasGoalkeeperStats) {
      const performanceRating = calcolaPrestazionePerRuolo(player, 'goalkeeper');
      const compatibility = POSITION_COMPATIBILITY[playerRole]?.[fieldRole] || 0.5;
      return Math.round(performanceRating * compatibility);
    } else if (playerRole !== 'goalkeeper' && hasAllStats) {
      const performanceRating = calcolaPrestazionePerRuolo(player, playerRole);
      const compatibility = POSITION_COMPATIBILITY[playerRole]?.[fieldRole] || 0.5;
      return Math.round(performanceRating * compatibility);
    }

    const baseRating = player.overall || 70;
    const compatibility = POSITION_COMPATIBILITY[playerRole]?.[fieldRole] || 0.5;
    return Math.round(baseRating * compatibility);
  };

  const getPositionStatus = (player, fieldRole) => {
    const playerRole = getCanonicalPosition(player.ruolo);
    const compatibility = POSITION_COMPATIBILITY[playerRole]?.[fieldRole] || 0.5;
    if (compatibility === 1.0) return 'natural';
    if (compatibility >= 0.8) return 'adapted';
    return 'out-of-position';
  };

  return (
    <div className="lineup-selection-container">
      <div className="lineup-controls">
        <button onClick={() => setSwapMode(!swapMode)} className={`swap-mode-button ${swapMode ? 'active' : ''}`}>
          {swapMode ? 'Modalità Scambio Attiva' : 'Attiva Scambio Giocatori'}
        </button>
      </div>
      <FormationDisplay
        formation={formation}
        currentFormation={currentFormation}
        onPlayerClick={handlePlayerClick}
        selectedPlayerForSwap={selectedPlayerForSwap}
        calculatePlayerRating={calculatePlayerRating}
        getPositionStatus={getPositionStatus}
        showControls={true}
        onAutoFill={handleAutoFill}
        onClear={handleClear}
        onBack={onBack}
        onSave={handleSave}
      />
    </div>
  );
};

export default LineupSelection;
