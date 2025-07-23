import React, { useState, useEffect } from 'react';
import './LineupSelection.css';
import FormationDisplay from './FormationDisplay';
import { calcolaPrestazione } from '../utils/performanceCalculator';

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
  'goalkeeper': { 'goalkeeper': 1.0 },
  'defender': { 'defender': 1.0, 'midfielder': 0.8, 'attacking-midfielder': 0.6, 'forward': 0.5 },
  'midfielder': { 'midfielder': 1.0, 'defender': 0.85, 'attacking-midfielder': 0.9, 'forward': 0.75 },
  'attacking-midfielder': { 'attacking-midfielder': 1.0, 'midfielder': 0.9, 'forward': 0.85, 'defender': 0.6 },
  'forward': { 'forward': 1.0, 'attacking-midfielder': 0.85, 'midfielder': 0.75, 'defender': 0.5 },
};

const LineupSelection = ({ selectionData, onNext, onBack, initialLineup }) => {
  const [currentFormation] = useState(initialLineup?.formation || '4-3-3');
  const [formation, setFormation] = useState({ titolari: [], panchina: [], rosaDisponibile: [] });
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState(null);

  useEffect(() => {
    const fullSquadRaw = selectionData?.userTeam?.squad || [];

    // De-duplica la rosa basandosi sull'ID del giocatore per evitare errori di chiave
    const seenIds = new Set();
    const fullSquad = fullSquadRaw.filter(player => {
      if (!player || typeof player.id === 'undefined') return false;
      if (seenIds.has(player.id)) {
        console.warn(`ID giocatore duplicato rimosso: ${player.id}`);
        return false;
      }
      seenIds.add(player.id);
      return true;
    });

    const initialTitolari = initialLineup?.titolari || [];
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
    // Case 1: No player is selected yet. Select the clicked player.
    if (!selectedPlayerForSwap) {
      if (player) {
        setSelectedPlayerForSwap({ player, source: sourceListName });
      }
      return; // Do nothing if an empty slot is clicked first.
    }

    // Case 2: A player is already selected. Handle the second click.
    const player1Info = selectedPlayerForSwap;

    // If the user clicks the same player again, deselect it.
    if (player && player1Info.player.id === player.id) {
      setSelectedPlayerForSwap(null);
      return;
    }

    const newFormation = JSON.parse(JSON.stringify(formation));
    const sourceList = newFormation[player1Info.source];
    const sourceIndex = sourceList.findIndex(p => p.id === player1Info.player.id);

    if (sourceIndex === -1) {
      setSelectedPlayerForSwap(null); // Should not happen
      return;
    }

    // Scenario A: Moving a selected player to an empty 'titolari' slot.
    if (!player && sourceListName === 'titolari') {
      const playerToMove = sourceList.splice(sourceIndex, 1)[0];
      playerToMove.fieldPosition = positionKey; // Assign the new position
      newFormation.titolari.push(playerToMove);
      setFormation(newFormation);
      setSelectedPlayerForSwap(null);
      return;
    }
    
    // Scenario B: Swapping two players.
    const player2Info = { player, source: sourceListName };
    const destList = newFormation[player2Info.source];
    const destIndex = destList.findIndex(p => p.id === player2Info.player.id);

    if (destIndex === -1) {
      setSelectedPlayerForSwap(null); // Should not happen
      return;
    }

    // Perform the swap
    const p1_data = sourceList[sourceIndex];
    const p2_data = destList[destIndex];
    sourceList[sourceIndex] = p2_data;
    destList[destIndex] = p1_data;

    // Correctly swap or assign fieldPosition for titolari
    const p1_is_titolare = player1Info.source === 'titolari';
    const p2_is_titolare = player2Info.source === 'titolari';

    if (p1_is_titolare && p2_is_titolare) {
      [p1_data.fieldPosition, p2_data.fieldPosition] = [p2_data.fieldPosition, p1_data.fieldPosition];
    } else if (p1_is_titolare && !p2_is_titolare) {
      p2_data.fieldPosition = p1_data.fieldPosition;
      delete p1_data.fieldPosition;
    } else if (!p1_is_titolare && p2_is_titolare) {
      p1_data.fieldPosition = p2_data.fieldPosition;
      delete p2_data.fieldPosition;
    }

    setFormation(newFormation);
    setSelectedPlayerForSwap(null); // Reset selection after swap
  };

  const handleAutoFill = () => {
    // Combine all available players into one list to ensure we consider everyone
    const allPlayers = [...formation.titolari, ...formation.panchina, ...formation.rosaDisponibile];
    const playersByRole = {
      goalkeeper: [],
      defender: [],
      midfielder: [],
      'attacking-midfielder': [],
      forward: [],
    };

    // Categorize and sort players by role and overall rating
    allPlayers.forEach(player => {
      const role = getCanonicalPosition(player.ruolo);
      if (playersByRole[role]) {
        playersByRole[role].push(player);
      }
    });

    // Sort each role group by overall descending
    for (const role in playersByRole) {
      playersByRole[role].sort((a, b) => (b.overall || 0) - (a.overall || 0));
    }

    const newTitolari = [];
    const formationSlots = FORMATIONS[currentFormation].positions;

    // Create a copy of the sorted players to draw from
    const availablePlayers = JSON.parse(JSON.stringify(playersByRole));

    formationSlots.forEach((slot, index) => {
      const role = slot.role;
      let playerToAssign = null;

      // Find the best available player for the role
      if (availablePlayers[role] && availablePlayers[role].length > 0) {
        playerToAssign = availablePlayers[role].shift();
      } else {
        // If no player for the specific role, try to find a compatible one from other roles
        // This is a simple fallback, could be improved with compatibility scores
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

    // Remaining players go to the bench or available list
    const remainingPlayers = Object.values(availablePlayers).flat();
    remainingPlayers.sort((a, b) => (b.overall || 0) - (a.overall || 0));

    const newPanchina = remainingPlayers.slice(0, 12); // Max 12 on bench
    const newRosaDisponibile = remainingPlayers.slice(12);

    setFormation({
      titolari: newTitolari,
      panchina: newPanchina,
      rosaDisponibile: newRosaDisponibile,
    });
  };

  const handleClear = () => {
    const allPlayers = [...formation.titolari, ...formation.panchina, ...formation.rosaDisponibile];
    setFormation({
      titolari: [],
      panchina: [],
      rosaDisponibile: allPlayers
    });
  };

  const handleSave = () => {
    if (formation.titolari.length !== 11) {
      alert('Devi selezionare 11 giocatori titolari!');
      return;
    }
    onNext({ 
      formation: currentFormation,
      titolari: formation.titolari,
      panchina: formation.panchina
    });
  };

  const calculatePlayerRating = (player, fieldRole) => {
    if (!player) return 0;
    
    // Use the new performance calculator if all stats are available
    if (player.velocita && player.tiro && player.passaggio && player.dribbling && player.difesa && player.fisico) {
      const performanceRating = calcolaPrestazione(player);
      const playerRole = getCanonicalPosition(player.ruolo);
      const compatibility = POSITION_COMPATIBILITY[playerRole]?.[fieldRole] || 0.5;
      return Math.round(performanceRating * compatibility);
    }
    
    // Fallback to simple overall-based calculation
    const baseRating = player.overall || 70;
    const playerRole = getCanonicalPosition(player.ruolo);
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
  );
};

export default LineupSelection;
