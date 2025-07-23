import React, { useState, useEffect, useMemo } from 'react';

import './SeasonSimulation.css';
import FormationDisplay from './FormationDisplay';
import MatchCommentary from './MatchCommentary';

// Generates a unique ID for a match based on teams and matchday
const getMatchId = (homeTeamId, awayTeamId, matchdayIndex) => `match-${matchdayIndex}-${homeTeamId}-${awayTeamId}`;

// Generates a round-robin calendar
const generateCalendar = (teams) => {
  if (!teams || teams.length < 2) return [];

  const numTeams = teams.length;
  const numMatchdays = numTeams - 1;
  
  // Create initial schedule
  const schedule = [];
  
  // Fix the first team
  const fixedTeam = teams[0];
  let rotatingTeams = [...teams.slice(1)];
  
  for (let day = 1; day <= numMatchdays; day++) {
    const matchday = { day, matches: [] };
    
    // Add match for fixed team
    const opponent = rotatingTeams[0];
    matchday.matches.push({
      id: getMatchId(fixedTeam.id, opponent.id, day - 1),
      home: fixedTeam,
      away: opponent
    });
    
    // Add matches for rotating teams
    for (let i = 1; i < rotatingTeams.length / 2; i++) {
      const home = rotatingTeams[i];
      const away = rotatingTeams[rotatingTeams.length - i];
      matchday.matches.push({
        id: getMatchId(home.id, away.id, day - 1),
        home,
        away
      });
    }
    
    schedule.push(matchday);
    
    // Rotate teams (move last to first)
    const last = rotatingTeams.pop();
    rotatingTeams.unshift(last);
  }

  // Generate second leg by swapping home and away
  const secondLeg = schedule.map((matchday, roundIndex) => ({
    day: matchday.day + numMatchdays,
    matches: matchday.matches.map(match => ({
      ...match,
      id: getMatchId(match.away.id, match.home.id, roundIndex + numMatchdays),
      home: match.away,
      away: match.home,
    }))
  }));

  return [...schedule, ...secondLeg];
};

const calculateStandings = (allMatchResults, teams) => {
  if (!teams || teams.length === 0) {
    return [];
  }

  const standingsMap = {};
  teams.forEach(team => {
    standingsMap[team.id] = {
      team: team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [],
    };
  });

  if (Object.keys(allMatchResults).length > 0) {
    Object.values(allMatchResults).flat().forEach(result => {
      const homeStats = standingsMap[result.home.id];
      const awayStats = standingsMap[result.away.id];

      if (!homeStats || !awayStats) {
        return; // Skip if a team isn't in the standings map
      }

      homeStats.played += 1;
      awayStats.played += 1;
      homeStats.goalsFor += result.homeScore;
      homeStats.goalsAgainst += result.awayScore;
      awayStats.goalsFor += result.awayScore;
      awayStats.goalsAgainst += result.homeScore;

      if (result.homeScore > result.awayScore) {
        homeStats.wins += 1;
        homeStats.points += 3;
        homeStats.form.push('W');
        awayStats.losses += 1;
        awayStats.form.push('L');
      } else if (result.awayScore > result.homeScore) {
        awayStats.wins += 1;
        awayStats.points += 3;
        awayStats.form.push('W');
        homeStats.losses += 1;
        homeStats.form.push('L');
      } else {
        homeStats.draws += 1;
        homeStats.points += 1;
        homeStats.form.push('D');
        awayStats.draws += 1;
        awayStats.points += 1;
        awayStats.form.push('D');
      }
    });
  }

  const finalStandings = Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    const goalDiffB = (b.goalsFor - b.goalsAgainst);
    const goalDiffA = (a.goalsFor - a.goalsAgainst);
    if (goalDiffB !== goalDiffA) {
      return goalDiffB - goalDiffA;
    }
    return b.goalsFor - a.goalsFor;
  });

  return finalStandings;
};

const calculateTopScorers = (allMatchResults, teams) => {
  const scorerStats = {};

  // 1. Create a comprehensive map of all players from all teams.
  const playerMap = new Map();
  if (teams && teams.length > 0) {
    teams.forEach(team => {
      if (team.squad) { // Ensure squad exists
        team.squad.forEach(player => {
          playerMap.set(player.id, { ...player, teamName: team.name, teamCrest: team.crest });
        });
      }
    });
  }

  // 2. Aggregate goals from all completed matches.
  if (allMatchResults && Object.keys(allMatchResults).length > 0) {
    Object.values(allMatchResults).flat().forEach(match => {
      if (match.scorers) {
        Object.entries(match.scorers).forEach(([playerId, goals]) => {
          scorerStats[playerId] = (scorerStats[playerId] || 0) + goals;
        });
      }
    });
  }

  // 3. Map scorer IDs back to player data and sort the list.
  return Object.entries(scorerStats)
    .map(([playerId, goals]) => ({ 
      player: playerMap.get(parseInt(playerId, 10)), 
      goals 
    }))
    .filter(s => s.player) // IMPORTANT: Filter out any scorer not found in the map.
    .sort((a, b) => b.goals - a.goals);
};

const FORMATION_POSITIONS = {
  '4-3-3': [
    'goalkeeper-0', 'defender-1', 'defender-2', 'defender-3', 'defender-4',
    'midfielder-5', 'midfielder-6', 'midfielder-7',
    'forward-8', 'forward-9', 'forward-10'
  ]
};

const getCanonicalPosition = (apiPosition) => {
  if (typeof apiPosition !== 'string') return 'midfielder';
  const pos = apiPosition.toLowerCase();

  if (pos.includes('goal') || pos.includes('portiere')) return 'goalkeeper';
  if (pos.includes('defen') || pos.includes('back') || pos.includes('difensore') || pos.includes('terzino')) return 'defender';
  if ((pos.includes('attack') && pos.includes('midfield')) || pos.includes('trequartista') || (pos.includes('centrocampista') && pos.includes('offensivo'))) return 'attacking-midfielder';
  if (pos.includes('midfield') || pos.includes('centrocampista')) return 'midfielder';
  if (pos.includes('forward') || pos.includes('attack') || pos.includes('striker') || pos.includes('winger') || pos.includes('attaccante') || pos.includes('ala')) return 'forward';

  return 'midfielder'; // Default to midfielder for unknown roles
};

const POSITION_COMPATIBILITY = {
  'goalkeeper': { 'goalkeeper': 1.0 },
  'defender': { 'defender': 1.0, 'midfielder': 0.8, 'attacking-midfielder': 0.6, 'forward': 0.5 },
  'midfielder': { 'midfielder': 1.0, 'defender': 0.85, 'attacking-midfielder': 0.9, 'forward': 0.75 },
  'attacking-midfielder': { 'attacking-midfielder': 1.0, 'midfielder': 0.9, 'forward': 0.85, 'defender': 0.6 },
  'forward': { 'forward': 1.0, 'attacking-midfielder': 0.85, 'midfielder': 0.75, 'defender': 0.5 },
};

const getRole = (position, forPositionKey = false) => {
    if (forPositionKey) {
        if (position.startsWith('goalkeeper')) return 'Goalkeeper';
        if (position.startsWith('defender')) return 'Defender';
        if (position.startsWith('midfielder')) return 'Midfielder';
        if (position.startsWith('forward')) return 'Attacker';
    }
    switch (position) {
        case 'Goalkeeper': return 'Goalkeeper';
        case 'Centre-Back': case 'Left-Back': case 'Right-Back': return 'Defender';
        case 'Defensive Midfield': case 'Central Midfield': case 'Attacking Midfield': return 'Midfielder';
        case 'Centre-Forward': case 'Left Winger': case 'Right Winger': return 'Attacker';
        default: return 'Unknown';
    }
};

const SeasonSimulation = ({ selectionData, lineupData, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [calendar, setCalendar] = useState([]);
  // const [standings, setStandings] = useState([]);
  // const [topScorers, setTopScorers] = useState([]);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [results, setResults] = useState({});
  const [matchInProgress, setMatchInProgress] = useState(null);
  const [matchCommentaryData, setMatchCommentaryData] = useState(null);
  const [formation, setFormation] = useState({ titolari: {}, panchina: [], rosaDisponibile: [], changed: false });
  const [baseFormation, setBaseFormation] = useState(null);
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState(null);
  // const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    if (selectionData && selectionData.teams && lineupData) {
      const teamDetailsMap = new Map(selectionData.teams.map(team => [team.id, team]));

      const processedTeams = lineupData.map(lineup => {
        const teamDetails = teamDetailsMap.get(lineup.team_id);
        return {
          // Essential data from lineupData
          id: lineup.team_id,
          squad: lineup.players || [],
          // Enriched data from selectionData, if available
          name: teamDetails?.name || `Team #${lineup.team_id}`,
          crest: teamDetails?.crest || '',
        };
      });

      setTeams(processedTeams);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [selectionData, lineupData]);

  useEffect(() => {
    if (teams.length > 0 && selectionData?.calendar) {
      const teamsMap = new Map(teams.map(t => [t.id, t]));
      const updatedCalendar = selectionData.calendar.map(matchday => ({
        ...matchday,
        matches: matchday.matches.map(match => ({
          ...match,
          home: teamsMap.get(match.home.id) || match.home,
          away: teamsMap.get(match.away.id) || match.away,
        })),
      }));
      setCalendar(updatedCalendar);
    }
  }, [teams, selectionData?.calendar]);



  useEffect(() => {
    if (teams.length > 0 && lineupData && selectionData) {
      setCalendar(generateCalendar(teams));
      // setStandings(calculateStandings([], teams));
      // setTopScorers(calculateTopScorers([], teams));

      const userTeamLineup = lineupData.find(ld => ld.team_id === selectionData.userTeam.id);
      if (userTeamLineup) {
        const initialTitolari = {};
        const positions = FORMATION_POSITIONS['4-3-3'];
        userTeamLineup.players.slice(0, 11).forEach((player, index) => {
          if (positions[index]) {
            initialTitolari[positions[index]] = player;
          }
        });
        const initialPanchina = userTeamLineup.players.slice(11, 20);
        setBaseFormation({ titolari: initialTitolari, panchina: initialPanchina });
      }
    }
  }, [teams, lineupData, selectionData]);

  const sortedStandings = useMemo(() => calculateStandings(results, teams), [results, teams]);
  const sortedTopScorers = useMemo(() => calculateTopScorers(results, teams), [results, teams]);

  if (loading) {
    return <div className="loading-container">Caricamento dati...</div>;
  }

  const calculatePlayerRating = (player, fieldRole) => {
    if (!player) return 0;
    const baseRating = player.overall || 70;
    const playerRole = getCanonicalPosition(player.position);

    if (!fieldRole) return baseRating; // Return base rating if fieldRole is not provided

    const compatibility = POSITION_COMPATIBILITY[playerRole]?.[fieldRole] || 0.5; // Default penalty
    return Math.round(baseRating * compatibility);
  };

  const getPositionStatus = (player, fieldRole) => {
    const playerRole = getCanonicalPosition(player.position);
    const compatibility = POSITION_COMPATIBILITY[playerRole]?.[fieldRole] || 0.5;
    if (compatibility === 1.0) return 'natural';
    if (compatibility >= 0.8) return 'adapted';
    return 'out-of-position';
  };

  const handlePlayerSelection = (clickedPlayer, clickedList, clickedPositionKey = null) => {
    if (!selectedPlayerForSwap) {
      if (clickedPlayer) setSelectedPlayerForSwap({ player: clickedPlayer, sourceList: clickedList, positionKey: clickedPositionKey });
      return;
    }
    const { player: sourcePlayer, sourceList, positionKey: sourcePositionKey } = selectedPlayerForSwap;
    if (clickedPlayer && sourcePlayer.id === clickedPlayer.id) {
      setSelectedPlayerForSwap(null);
      return;
    }
    const newFormation = JSON.parse(JSON.stringify(formation));
    if (sourcePositionKey) delete newFormation.titolari[sourcePositionKey];
    else newFormation[sourceList] = newFormation[sourceList].filter(p => p.id !== sourcePlayer.id);
    if (clickedPlayer) {
      if (clickedPositionKey) delete newFormation.titolari[clickedPositionKey];
      else newFormation[clickedList] = newFormation[clickedList].filter(p => p.id !== clickedPlayer.id);
    }
    if (clickedPositionKey) newFormation.titolari[clickedPositionKey] = sourcePlayer;
    else newFormation[clickedList].push(sourcePlayer);
    if (clickedPlayer) {
      if (sourcePositionKey) newFormation.titolari[sourcePositionKey] = clickedPlayer;
      else newFormation[sourceList].push(clickedPlayer);
    }
    setFormation({ ...newFormation, changed: true });
    setSelectedPlayerForSwap(null);
  };

  // const handlePositionClick = (positionKey) => { if (selectedPlayerForSwap) handlePlayerSelection(null, 'titolari', positionKey); };

  const setAutomaticFormation = () => {
    const players = [...Object.values(formation.titolari), ...formation.panchina, ...formation.rosaDisponibile];
    const uniquePlayers = Array.from(new Map(players.map(p => [p.id, p])).values());
    const sortedPlayers = [...uniquePlayers].sort((a, b) => calculatePlayerRating(b) - calculatePlayerRating(a));
    const newTitolari = {};
    const assignedPlayerIds = new Set();
    
    FORMATION_POSITIONS['4-3-3'].forEach(posKey => {
      const role = getRole(posKey.split('-')[0], true);
      const bestPlayer = sortedPlayers.find(p => !assignedPlayerIds.has(p.id) && getRole(p.position) === role);
      if (bestPlayer) { newTitolari[posKey] = bestPlayer; assignedPlayerIds.add(bestPlayer.id); }
    });
    const remainingPlayers = sortedPlayers.filter(p => !assignedPlayerIds.has(p.id));
    setFormation({ titolari: newTitolari, panchina: remainingPlayers.slice(0, 9), rosaDisponibile: remainingPlayers.slice(9), changed: true });
  };

  const handlePlayUserMatch = (match) => {
    const isHome = match.home.id === selectionData.userTeam.id;
    const userTeam = isHome ? match.home : match.away;
    setMatchInProgress({ match, userTeam });

    const userTeamRoster = userTeam.squad || [];
    if (baseFormation) {
      const titolariIds = new Set(Object.values(baseFormation.titolari).map(p => p.id));
      const panchinaIds = new Set(baseFormation.panchina.map(p => p.id));
      const rosaDisponibile = userTeamRoster.filter(p => !titolariIds.has(p.id) && !panchinaIds.has(p.id));
      setFormation({ titolari: { ...baseFormation.titolari }, panchina: [...baseFormation.panchina], rosaDisponibile, changed: false });
    } else {
      setFormation({ titolari: {}, panchina: [], rosaDisponibile: userTeamRoster, changed: false });
    }
  };

  const simulateMatch = (home, away, userFormation = null) => {
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 3);
    const scorers = {};

    const addGoals = (team, count, isUserTeam) => {
      let players;
      if (isUserTeam && userFormation) {
        players = [...Object.values(userFormation.titolari), ...userFormation.panchina]
          .filter(p => getCanonicalPosition(p.position) !== 'goalkeeper');
      } else {
        players = (team.squad || []).filter(p => getCanonicalPosition(p.position) !== 'goalkeeper');
      }

      if (players.length === 0) return; // No eligible players to score

      for (let i = 0; i < count; i++) {
        const scorer = players[Math.floor(Math.random() * players.length)];
        if (scorer) {
          scorers[scorer.id] = (scorers[scorer.id] || 0) + 1;
        }
      }
    };

    addGoals(home, homeScore, home.id === selectionData.userTeam.id);
    addGoals(away, awayScore, away.id === selectionData.userTeam.id);

    return { homeScore, awayScore, scorers };
  };

  const generateCommentary = (match, result, userFormation) => {
    const commentary = [];
    const events = [];

    const allGoals = [];
    for (let i = 0; i < result.homeScore; i++) allGoals.push(match.home);
    for (let i = 0; i < result.awayScore; i++) allGoals.push(match.away);

    allGoals.forEach(scoringTeam => {
      let potentialScorers;
      if (scoringTeam.id === selectionData.userTeam.id) {
        potentialScorers = [...Object.values(userFormation.titolari), ...userFormation.panchina]
          .filter(p => getCanonicalPosition(p.position) !== 'goalkeeper');
      } else {
        potentialScorers = (scoringTeam.squad || []).filter(p => getCanonicalPosition(p.position) !== 'goalkeeper');
      }

      if (potentialScorers.length > 0) {
        const scorer = potentialScorers[Math.floor(Math.random() * potentialScorers.length)];
        events.push({ type: 'goal', player: scorer, team: scoringTeam, minute: Math.floor(Math.random() * 90) + 1 });
      }
    });

    events.sort((a, b) => a.minute - b.minute);

    let homeGoals = 0;
    let awayGoals = 0;

    events.forEach(event => {
      if (event.type === 'goal') {
        let text;
        // Determine the score *before* this goal to generate the correct text.
        const currentHomeGoals = homeGoals;
        const currentAwayGoals = awayGoals;

        if (event.team.id === match.home.id) {
          homeGoals++; // Increment score for the home team
          if (currentHomeGoals > currentAwayGoals) text = `${event.team.name} aumenta il vantaggio!`; // Was already winning
          else if (currentHomeGoals === currentAwayGoals) text = `${event.team.name} passa in vantaggio!`; // Broke a tie
          else text = `${event.team.name} pareggia!`; // Tied the game
        } else {
          awayGoals++; // Increment score for the away team
          if (currentAwayGoals > currentHomeGoals) text = `${event.team.name} aumenta il vantaggio!`; // Was already winning
          else if (currentAwayGoals === currentHomeGoals) text = `${event.team.name} passa in vantaggio!`; // Broke a tie
          else text = `${event.team.name} pareggia!`; // Tied the game
        }
        commentary.push({ minute: event.minute, text: `GOL! ${text}<br />- ${event.player.name}` });
      }
    });

    return commentary;
  };

  const handleSimulateMatch = () => {
    if (!matchInProgress) return;

    const { match } = matchInProgress;
    const updatedMatch = JSON.parse(JSON.stringify(match));

    // The user's team squad is now based on the confirmed formation
    const userTeamSquad = [...Object.values(formation.titolari), ...formation.panchina];
    if (updatedMatch.home.id === selectionData.userTeam.id) {
      updatedMatch.home.squad = userTeamSquad;
    } else {
      updatedMatch.away.squad = userTeamSquad;
    }

    const result = simulateMatch(updatedMatch.home, updatedMatch.away, formation);
    const commentaryEvents = generateCommentary(updatedMatch, result, formation);

    const matchResult = {
      ...result,
      id: updatedMatch.id,
      home: updatedMatch.home,
      away: updatedMatch.away,
    };

    // The result is now passed to the commentary component and will be saved
    // only when the user clicks the "finish match" button.
    setMatchCommentaryData({
      match: updatedMatch,
      commentary: { events: commentaryEvents },
      formation: formation,
      userTeam: selectionData.userTeam,
      result: matchResult,
    });
  };

  const confirmFormation = () => {
    if (formation.changed) {
      setBaseFormation({ titolari: formation.titolari, panchina: formation.panchina });
    }
    handleSimulateMatch();
  };

  const handleFinishMatch = () => {
    const { result: userMatchResult } = matchCommentaryData;
    const matchdayToSimulate = currentMatchday;
    const matchdayData = calendar.find(md => md.day === matchdayToSimulate);

    let newMatchdayResults = [...(results[matchdayToSimulate] || []), userMatchResult];

    if (matchdayData) {
      const playedMatchIds = new Set(newMatchdayResults.map(r => r.id));
      
      matchdayData.matches.forEach(match => {
        if (!playedMatchIds.has(match.id)) {
          const result = simulateMatch(match.home, match.away);
          const fullResult = { ...result, id: match.id, home: match.home, away: match.away };
          newMatchdayResults.push(fullResult);
        }
      });
    }

    setResults(prev => ({ ...prev, [matchdayToSimulate]: newMatchdayResults }));
    setCurrentMatchday(prev => prev + 1);
    setMatchCommentaryData(null);
    setMatchInProgress(null);
  };

  // ========= CONDITIONAL RENDERING =========

  if (matchCommentaryData) {
    return <MatchCommentary {...matchCommentaryData} onClose={handleFinishMatch} />;
  }

  if (matchInProgress) {
    return (
      <FormationDisplay
        formation={formation}
        onPlayerClick={handlePlayerSelection}
        selectedPlayerForSwap={selectedPlayerForSwap}
        calculatePlayerRating={calculatePlayerRating}
        getPositionStatus={getPositionStatus}
        showControls={true}
        onAutoFill={setAutomaticFormation}
        onSave={confirmFormation}
        onBack={() => setMatchInProgress(null)}
        teamName={matchInProgress.userTeam.name}
      />
    );
  }

  return (
    <div className="season-simulation-container">
      <div className="season-header">
        <h1>Stagione</h1>
        <button onClick={onBack} className="back-button">Indietro</button>
      </div>
      <div className="season-content">
        <div className="calendar-container">
          <h2>Calendario</h2>
          {calendar.map(matchday => (
            <div key={matchday.day} className="matchday">
              <h3>Giornata {matchday.day}</h3>
              <ul>
                {matchday.matches.map(match => {
                  const result = (results[matchday.day] || []).find(r => r.id === match.id);
                  const isUserMatch = match.home.id === selectionData.userTeam.id || match.away.id === selectionData.userTeam.id;
                  const canPlay = !result && isUserMatch && matchday.day === currentMatchday;
                  return (
                    <li key={match.id} className={`match-item ${result ? 'played' : ''}`}>
                      <span className="team home-team"><img src={match.home.crest} alt="" className="team-crest-small" /> {match.home.name}</span>
                      <span className="score">{result ? `${result.homeScore} - ${result.awayScore}` : '-'}</span>
                      <span className="team away-team">{match.away.name} <img src={match.away.crest} alt="" className="team-crest-small" /></span>
                      {canPlay && <button onClick={() => handlePlayUserMatch(match)} className="play-button">Gioca</button>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="sidebar-container">
          <div className="standings-container">
            <h2>Classifica</h2>
            <table className="standings-table-professional">
              <thead><tr><th>#</th><th className="team-name-header">Squadra</th><th>Pt</th><th>G</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th><th>Forma</th></tr></thead>
              <tbody>
                {sortedStandings.map((s, index) => (
                  <tr key={s.team.id}>
                    <td>{index + 1}</td>
                    <td className="team-cell"><img src={s.team.crest} alt={`${s.team.name} crest`} className="team-crest-small" /><span>{s.team.name}</span></td>
                    <td className="points-cell">{s.points}</td><td>{s.played}</td><td>{s.wins}</td><td>{s.draws}</td><td>{s.losses}</td><td>{s.goalsFor}</td><td>{s.goalsAgainst}</td><td>{s.goalsFor - s.goalsAgainst}</td>
                    <td><div className="form-icons">{s.form.slice(-5).map((f, i) => <span key={i} className={`form-indicator form-${f.toLowerCase()}`}>{f}</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="top-scorers-container">
            <h2>Classifica Marcatori</h2>
            <table className="top-scorers-table">
              <thead><tr><th>Giocatore</th><th>Squadra</th><th>Gol</th></tr></thead>
              <tbody>
                {sortedTopScorers.slice(0, 15).map(scorer => (
                  <tr key={scorer.player.id}>
                    <td>{scorer.player.name}</td>
                    <td><img src={scorer.player.teamCrest} alt="" className="team-crest-small" /> {scorer.player.teamName}</td>
                    <td>{scorer.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonSimulation;
