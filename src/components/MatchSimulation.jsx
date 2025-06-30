import React, { useState, useEffect } from 'react';
import './MatchSimulation.css';

// Helper per ottenere il cognome
const getLastName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
};

// Motore di simulazione avanzato
const runSimulation = (selectionData, opponentTeam) => {
  const events = [];
  const playerTeam = selectionData.team;
  const style = selectionData.style;
  const lineupPlayers = Object.values(selectionData.lineup).filter(p => p); // Filtra eventuali slot vuoti

  // Filtra giocatori per ruolo per azioni più realistiche
  const forwards = lineupPlayers.filter(p => p.position === 'Attack');
  const midfielders = lineupPlayers.filter(p => p.position === 'Midfield');
  const defenders = lineupPlayers.filter(p => p.position === 'Defence');

  const playerStrength = playerTeam.strength || 75;
  const opponentStrength = opponentTeam.strength || 70;

  let playerGoals = 0;
  let opponentGoals = 0;

  // Modificatori basati sullo stile di gioco
  let eventProbabilityModifier = 1.0;
  let goalConversionModifier = 1.0;

  switch (style) {
    case 'tiki-taka':
      eventProbabilityModifier = 1.2; // Più azioni
      goalConversionModifier = 0.9;   // Meno cinismo, più possesso
      break;
    case 'contropiede':
      eventProbabilityModifier = 0.8; // Meno azioni, ma più letali
      goalConversionModifier = 1.3;
      break;
    case 'pressing-alto':
      eventProbabilityModifier = 1.3; // Tante occasioni create e subite
      break;
    default:
      break;
  }

  for (let minute = 1; minute <= 90; minute++) {
    if (Math.random() < (0.1 * eventProbabilityModifier)) {
      const isPlayerTeamEvent = Math.random() < (playerStrength / (playerStrength + opponentStrength));
      const teamEvent = isPlayerTeamEvent ? playerTeam : opponentTeam;
      
      let playerInvolved = null;
      if (isPlayerTeamEvent) {
        if (lineupPlayers.length > 0) {
          const actionRoll = Math.random();
          if (actionRoll < 0.6 && forwards.length > 0) {
            playerInvolved = forwards[Math.floor(Math.random() * forwards.length)];
          } else if (actionRoll < 0.9 && midfielders.length > 0) {
            playerInvolved = midfielders[Math.floor(Math.random() * midfielders.length)];
          } else {
            playerInvolved = lineupPlayers[Math.floor(Math.random() * lineupPlayers.length)];
          }
        }
      } else {
        if (opponentTeam.squad && opponentTeam.squad.length > 0) {
          playerInvolved = opponentTeam.squad[Math.floor(Math.random() * opponentTeam.squad.length)];
        }
      }

      const eventTypeRoll = Math.random();
      let eventType = 'Tiro fuori';
      if (eventTypeRoll < (0.15 * (isPlayerTeamEvent ? goalConversionModifier : 1.0))) {
        eventType = 'GOL!';
        isPlayerTeamEvent ? playerGoals++ : opponentGoals++;
      } else if (eventTypeRoll < 0.5) {
        eventType = 'Tiro in porta';
      }

      events.push({ 
        minute,
        team: teamEvent.name,
        teamCrest: teamEvent.crest,
        type: eventType,
        player: playerInvolved ? getLastName(playerInvolved.name) : '',
        score: `${playerGoals} - ${opponentGoals}`
      });
    }
  }
  return events;
};

const MatchSimulation = ({ selectionData, onMatchEnd, isSeasonMatch }) => {
  const [events, setEvents] = useState([]);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [simulationFinished, setSimulationFinished] = useState(false);

  const { team: userTeam, currentMatch } = selectionData;
  const isSeasonGame = isSeasonMatch && currentMatch;

  const homeTeam = isSeasonGame ? currentMatch.home : userTeam;
  const awayTeam = isSeasonGame ? currentMatch.away : { name: 'Avversario FC', crest: 'https://via.placeholder.com/20', strength: 70 };
  const opponentTeam = homeTeam.id === userTeam.id ? awayTeam : homeTeam;

  useEffect(() => {
    const allEvents = runSimulation(selectionData, opponentTeam);
    setEvents(allEvents);
  }, [selectionData, opponentTeam]);

  useEffect(() => {
    if (events.length > 0) {
      const interval = setInterval(() => {
        setVisibleEvents(prev => {
          if (prev.length < events.length) {
            return [...prev, events[prev.length]];
          } else {
            clearInterval(interval);
            setSimulationFinished(true);
            return prev;
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [events]);

  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const finalScoreString = lastEvent ? lastEvent.score : '0 - 0';
  const [playerGoals, opponentGoals] = finalScoreString.split(' - ').map(Number);

  const isUserHome = homeTeam.id === userTeam.id;
  const homeScore = isUserHome ? playerGoals : opponentGoals;
  const awayScore = isUserHome ? opponentGoals : playerGoals;

  const handleEnd = () => {
    if (!isSeasonGame) {
      onMatchEnd();
      return;
    }

    let winner = null;
    if (homeScore > awayScore) winner = homeTeam.id;
    else if (awayScore > homeScore) winner = awayTeam.id;

    onMatchEnd({
      home: homeTeam,
      away: awayTeam,
      homeScore,
      awayScore,
      winner,
    });
  };

  return (
    <div className="match-simulation-container">
      <div className="scoreboard">
        <div className="team-info">
          <img src={homeTeam.crest} alt={homeTeam.name} className="team-crest" />
          <span className="team-name">{homeTeam.name}</span>
        </div>
        <div className="score">{simulationFinished ? `${homeScore} - ${awayScore}` : '...'}</div>
        <div className="team-info">
          <span className="team-name">{awayTeam.name}</span>
          <img src={awayTeam.crest} alt={awayTeam.name} className="team-crest" />
        </div>
      </div>

      <div className="timeline-container">
        {visibleEvents.map((event, index) => (
          <div key={index} className="timeline-event">
            <div className="event-minute">{event.minute}'</div>
            <div className="event-details">
              <img src={event.teamCrest} alt={event.team} className="event-team-crest" />
              <div>
                <span className={`event-type ${event.type === 'GOL!' ? 'goal' : ''}`}>{event.type}</span>
                {event.player && <span className="event-player"> - {event.player}</span>}
              </div>
            </div>
            <div className="event-score">{event.score}</div>
          </div>
        ))}
        {simulationFinished && <div className="match-end-message">Partita terminata!</div>}
      </div>

      {simulationFinished && (
        <div className="match-end-actions">
          <button onClick={handleEnd} className="action-button">
            {isSeasonGame ? 'Torna al Campionato' : 'Torna alla Dashboard'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchSimulation;
