import React, { useState, useEffect, useMemo } from 'react';
import './MatchSimulation.css';

// --- Helper Functions ---

const calculatePlayerRating = (player) => {
  if (!player) return 0;
  // In a real app, this would be a complex calculation based on player attributes.
  if (player.rating) {
    return player.rating;
  }
  // Create a pseudo-rating based on position for more variety
  let baseRating = 50;
  switch (player.position) {
    case 'Goalkeeper':
      baseRating = 75;
      break;
    case 'Defender':
      baseRating = 70;
      break;
    case 'Midfielder':
      baseRating = 75;
      break;
    case 'Attacker':
      baseRating = 80;
      break;
    default:
      baseRating = 60;
  }
  // Add some randomness
  return Math.floor(baseRating + Math.random() * 10);
};

const generateOpponentLineup = (squad) => {
  if (!Array.isArray(squad) || squad.length < 11) {
    const safeSquad = Array.isArray(squad) ? squad : [];
    return { starters: safeSquad.slice(0, 11), subs: safeSquad.slice(11) };
  }

  const formations = {
    '4-4-2': { D: 4, M: 4, A: 2 },
    '4-3-3': { D: 4, M: 3, A: 3 },
    '3-5-2': { D: 3, M: 5, A: 2 },
    '4-5-1': { D: 4, M: 5, A: 1 },
  };

  const getRole = (position) => {
    if (!position) return 'Midfielder';
    const pos = position.toLowerCase();
    if (pos.includes('keeper')) return 'Goalkeeper';
    if (pos.includes('back') || pos.includes('defender')) return 'Defender';
    if (pos.includes('midfield') || pos.includes('winger')) return 'Midfielder';
    if (pos.includes('forward') || pos.includes('striker') || pos.includes('attacker')) return 'Attacker';
    return 'Midfielder';
  };

  const goalkeepers = squad.filter(p => getRole(p.position) === 'Goalkeeper').sort((a, b) => calculatePlayerRating(b) - calculatePlayerRating(a));
  const defenders = squad.filter(p => getRole(p.position) === 'Defender').sort((a, b) => calculatePlayerRating(b) - calculatePlayerRating(a));
  const midfielders = squad.filter(p => getRole(p.position) === 'Midfielder').sort((a, b) => calculatePlayerRating(b) - calculatePlayerRating(a));
  const attackers = squad.filter(p => getRole(p.position) === 'Attacker').sort((a, b) => calculatePlayerRating(b) - calculatePlayerRating(a));

  let maxStrength = -1;
  let bestFormationStarters = [];

  for (const [, counts] of Object.entries(formations)) {
    if (goalkeepers.length >= 1 && defenders.length >= counts.D && midfielders.length >= counts.M && attackers.length >= counts.A) {
      const currentStarters = [
        ...goalkeepers.slice(0, 1),
        ...defenders.slice(0, counts.D),
        ...midfielders.slice(0, counts.M),
        ...attackers.slice(0, counts.A)
      ];
      const currentStrength = currentStarters.reduce((acc, p) => acc + calculatePlayerRating(p), 0);
      if (currentStrength > maxStrength) {
        maxStrength = currentStrength;
        bestFormationStarters = currentStarters;
      }
    }
  }

  let starters = [];
  if (bestFormationStarters.length === 11) {
    starters = bestFormationStarters;
  } else {
    // Fallback logic for unbalanced squads
    const gk = goalkeepers.slice(0, 1);
    const coreDef = defenders.slice(0, 3);
    const coreMid = midfielders.slice(0, 3);
    const coreAtt = attackers.slice(0, 2);
    
    const coreTeam = [...gk, ...coreDef, ...coreMid, ...coreAtt];
    const coreTeamIds = new Set(coreTeam.map(p => p.id));
    
    const remainingPlayers = squad.filter(p => !coreTeamIds.has(p.id))
      .sort((a, b) => calculatePlayerRating(b) - calculatePlayerRating(a));
      
    const slotsToFill = 11 - coreTeam.length;
    starters = [...coreTeam, ...remainingPlayers.slice(0, slotsToFill)];
  }

  const starterIds = new Set(starters.map(p => p.id));
  const subs = squad.filter(p => p && !starterIds.has(p.id));

  return { starters, subs };
};

// --- Helper Components ---

const TeamSheet = ({ team, lineup }) => {
  const starters = lineup?.titolari || lineup?.starters || [];
  const subs = lineup?.panchina || lineup?.subs || [];

  return (
    <div className="team-sheet">
      <h3>{team.name}</h3>
      <h4>Titolari</h4>
      <ul>
        {starters.map(p => p && p.id ? <li key={p.id}>{p.name} <span className="player-pos">({p.position})</span></li> : null)}
      </ul>
      <h4>Panchina</h4>
      <ul>
        {subs.map(p => p && p.id ? <li key={p.id}>{p.name} <span className="player-pos">({p.position})</span></li> : null)}
      </ul>
    </div>
  );
};

const Scoreboard = ({ homeTeam, awayTeam, score, time }) => (
  <div className="scoreboard">
    <span className="team-name">{homeTeam.name}</span>
    <img src={homeTeam.crest} alt={`${homeTeam.name} crest`} className="team-crest" />
    <span className="score">{time}' | {score.home} - {score.away}</span>
    <img src={awayTeam.crest} alt={`${awayTeam.name} crest`} className="team-crest" />
    <span className="team-name">{awayTeam.name}</span>
  </div>
);

const EventLog = ({ events }) => (
  <div className="event-log">
    {events.map((event, index) => (
      <div key={index} className={`event-item ${event.type === 'GOL!' ? 'goal' : ''}`}>
        <span className="event-time">{event.time}'</span>
        <img src={event.team.crest} alt="team crest" className="event-crest" />
        <span className="event-type">{event.type}</span>
        {event.player && <span className="event-player">- {event.player.name}</span>}
      </div>
    ))}
  </div>
);

// --- Main Component ---

const MatchSimulation = ({ matchData, lineupData, userTeam, onMatchEnd }) => {
  const [events, setEvents] = useState([]);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [isMatchFinished, setIsMatchFinished] = useState(false);
  const [opponentLineup, setOpponentLineup] = useState(null);

  // Verifica che la squadra avversaria sia sempre quella specificata nel calendario
  const opponentTeam = useMemo(() => {
    if (!matchData || !userTeam) return null;
    
    // Verifica che i dati della partita siano validi
    if (!matchData.home || !matchData.away || !matchData.id) {
      console.error('Dati della partita non validi:', matchData);
      return null;
    }

    // Verifica che le squadre siano diverse
    if (matchData.home.id === matchData.away.id) {
      console.error('Errore: le squadre sono identiche');
      return null;
    }

    // Verifica se l'utente è la squadra di casa o di fuori
    const isHome = matchData.home.id === userTeam.id;
    const opponent = isHome ? matchData.away : matchData.home;
    
    // Verifica che la squadra avversaria sia valida
    if (!opponent || !opponent.squad) {
      console.error('Squadra avversaria non valida:', opponent);
      return null;
    }

    // Verifica che l'ID della squadra sia corretto
    if (opponent.id !== (isHome ? matchData.away.id : matchData.home.id)) {
      console.error('Discrepanza nell\'ID della squadra avversaria');
      return null;
    }

    return opponent;
  }, [matchData, userTeam]);

  useEffect(() => {
    if (opponentTeam && !opponentLineup) {
      // Se l'avversario ha già una formazione (titolari/panchina), usala.
      // Altrimenti, genera una formazione casuale dalla sua rosa.
      if (opponentTeam.titolari && opponentTeam.panchina) {
        setOpponentLineup({ starters: opponentTeam.titolari, subs: opponentTeam.panchina });
      } else if (opponentTeam.squad) {
        setOpponentLineup(generateOpponentLineup(opponentTeam.squad));
      }
    }
  }, [opponentTeam, opponentLineup]);

  useEffect(() => {
    if (!matchData?.home?.id || !matchData?.away?.id || !lineupData || !userTeam?.id || !opponentLineup) {
      return;
    }

    const { home: homeTeam, away: awayTeam } = matchData;

    const getPlayerForEvent = (team, isGoalAttempt = false) => {
      const isUser = team.id === userTeam.id;
      const currentLineup = isUser ? lineupData : opponentLineup;
      const starters = (isUser ? currentLineup.titolari : currentLineup.starters) || [];

      if (starters.length === 0) return { name: 'un giocatore', id: `fallback-${Date.now()}` };

      if (isGoalAttempt) {
        const attackers = starters.filter(p => p && p.position === 'Attacker');
        const midfielders = starters.filter(p => p && p.position === 'Midfielder');
        const chancePool = [];
        attackers.forEach(p => { for(let i=0; i<4; i++) chancePool.push(p) }); // 4x chance for attackers
        midfielders.forEach(p => chancePool.push(p)); // 1x chance

        if (chancePool.length > 0) {
          return chancePool[Math.floor(Math.random() * chancePool.length)];
        }
      }
      return starters[Math.floor(Math.random() * starters.length)];
    };

    const matchInterval = setInterval(() => {
      setTime(prevTime => {
        if (prevTime >= 90) {
          clearInterval(matchInterval);
          setIsMatchFinished(true);
          return 90;
        }

        const newTime = prevTime + 1;
        const rand = Math.random();

        if (rand < 0.05) {
          const eventTypeRand = Math.random();
          const attackingTeam = rand < 0.025 ? homeTeam : awayTeam;
          const isGoalAttempt = eventTypeRand < 0.5;
          const player = getPlayerForEvent(attackingTeam, isGoalAttempt);

          let event = { time: newTime, team: attackingTeam, player };

          if (eventTypeRand < 0.15) {
            event.type = 'GOL!';
            setScore(s => (attackingTeam.id === homeTeam.id ? { ...s, home: s.home + 1 } : { ...s, away: s.away + 1 }));
          } else if (eventTypeRand < 0.5) {
            event.type = 'Tiro in porta';
          } else {
            event.type = 'Tiro fuori';
          }
          setEvents(prev => [event, ...prev]);
        }

        return newTime;
      });
    }, 200);

    return () => clearInterval(matchInterval);
  }, [matchData, lineupData, userTeam, opponentLineup]);

  const handleFinishMatch = () => {
    onMatchEnd({ ...matchData, result: score });
  };

  if (!matchData?.home?.id || !opponentLineup) {
    return <div>Caricamento dati partita...</div>;
  }

  const { home: homeTeam, away: awayTeam } = matchData;
  const userLineup = lineupData;
  const oppLineup = opponentLineup;

  return (
    <div className="match-simulation-container">
      <div className="match-simulation">
        <TeamSheet team={homeTeam} lineup={homeTeam.id === userTeam.id ? userLineup : oppLineup} />
        <div className="match-center-column">
          <Scoreboard homeTeam={homeTeam} awayTeam={awayTeam} score={score} time={time} />
          <EventLog events={events} />
          {isMatchFinished && <button onClick={handleFinishMatch} className="action-button">Termina e Torna alla Stagione</button>}
        </div>
        <TeamSheet team={awayTeam} lineup={awayTeam.id === userTeam.id ? userLineup : oppLineup} />
      </div>
    </div>
  );
};

export default MatchSimulation;