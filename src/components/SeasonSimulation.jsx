import React, { useState, useEffect, useMemo } from 'react';
import './SeasonSimulation.css';

const generateSchedule = (teams) => {
  if (!teams || teams.length === 0) return [];
  const schedule = [];
  let allTeams = [...teams];
  if (allTeams.length % 2 !== 0) {
    allTeams.push({ id: 'rest', name: 'Riposo', crest: '' });
  }
  const numTeams = allTeams.length;
  const numRounds = (numTeams - 1);
  const teamsForScheduling = allTeams.slice();
  for (let round = 0; round < numRounds; round++) {
    const roundMatches = [];
    for (let i = 0; i < numTeams / 2; i++) {
      const home = teamsForScheduling[i];
      const away = teamsForScheduling[numTeams - 1 - i];
      if (home.id !== 'rest' && away.id !== 'rest') {
        roundMatches.push({ home, away });
      }
    }
    schedule.push(roundMatches);
    const lastTeam = teamsForScheduling.pop();
    teamsForScheduling.splice(1, 0, lastTeam);
  }
  const returnSchedule = schedule.map(round => 
    round.map(match => ({ home: match.away, away: match.home }))
  );
  return [...schedule, ...returnSchedule];
};

const simulateMatch = (home, away) => {
  const homeScore = Math.floor(Math.random() * 5);
  const awayScore = Math.floor(Math.random() * 4);
  let winner = null;
  if (homeScore > awayScore) winner = home.id;
  if (awayScore > homeScore) winner = away.id;
  return { home, away, homeScore, awayScore, winner };
};

const SeasonSimulation = ({ selectionData, onBack, onPlayMatch }) => {
  const { team, allTeams, lastMatchResult: userMatchResult } = selectionData;

  const [standings, setStandings] = useState([]);
  const schedule = useMemo(() => generateSchedule(allTeams), [allTeams]);
  const [currentRound, setCurrentRound] = useState(0);
  const [lastRoundResults, setLastRoundResults] = useState([]);
  const [processedResult, setProcessedResult] = useState(null);

  useEffect(() => {
    if (allTeams && allTeams.length > 0) {
      const initialStandings = allTeams.map(t => ({
        id: t.id, name: t.name, crest: t.crest,
        played: 0, wins: 0, draws: 0, losses: 0, points: 0,
      }));
      setStandings(initialStandings);
    }
  }, [allTeams]);

  const updateStandings = (results) => {
    setStandings(prevStandings => {
      const newStandings = [...prevStandings].map(s => {
        let newStanding = { ...s };
        results.forEach(result => {
          if (s.id === result.home.id || s.id === result.away.id) {
            newStanding.played += 1;
            if (result.winner === null) { newStanding.draws += 1; newStanding.points += 1; }
            else if (result.winner === s.id) { newStanding.wins += 1; newStanding.points += 3; }
            else { newStanding.losses += 1; }
          }
        });
        return newStanding;
      });
      newStandings.sort((a, b) => b.points - a.points || (b.wins - a.wins));
      return newStandings;
    });
  };

  useEffect(() => {
    if (userMatchResult && userMatchResult !== processedResult) {
      const roundMatches = schedule[currentRound];
      if (!roundMatches) return;

      const otherMatches = roundMatches.filter(
        m => m.home.id !== userMatchResult.home.id || m.away.id !== userMatchResult.away.id
      );
      
      const otherResults = otherMatches.map(match => simulateMatch(match.home, match.away));
      const allResults = [userMatchResult, ...otherResults];
      
      setLastRoundResults(allResults);
      updateStandings(allResults);
      setCurrentRound(prev => prev + 1);
      setProcessedResult(userMatchResult);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMatchResult, schedule, currentRound, processedResult]);

  const handleSimulateRound = () => {
    if (currentRound >= schedule.length) {
      alert("Campionato terminato!");
      return;
    }

    const roundMatches = schedule[currentRound];
    const userMatch = roundMatches.find(m => m.home.id === team.id || m.away.id === team.id);
    
    if (userMatch) {
      onPlayMatch(userMatch);
    } else {
      const results = roundMatches.map(match => simulateMatch(match.home, match.away));
      setLastRoundResults(results);
      updateStandings(results);
      setCurrentRound(prev => prev + 1);
    }
  };
  
  const isSeasonOver = currentRound >= schedule.length;

  return (
    <div className="season-container-new">
      <div className="season-header">
        <h1>Simulazione Campionato</h1>
        <button onClick={onBack} className="back-button-season">Torna alla Dashboard</button>
      </div>
      <div className="season-content">
        <div className="standings-panel">
          <h2>Classifica</h2>
          <table>
            <thead>
              <tr>
                <th>Pos</th><th className="team-header">Squadra</th><th>G</th><th>V</th><th>N</th><th>P</th><th>PT</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, index) => (
                <tr key={s.id} className={s.id === team.id ? 'user-team' : ''}>
                  <td>{index + 1}</td>
                  <td className="team-name-cell"><span>{s.name}</span></td>
                  <td>{s.played}</td><td>{s.wins}</td><td>{s.draws}</td><td>{s.losses}</td><td className="points">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="simulation-panel">
          <h2>Controllo Stagione</h2>
          {isSeasonOver ? (
            <div className="result-card"><h3>Campionato Terminato!</h3></div>
          ) : (
            <>
              <div className="match-card"><h3>Prossima Giornata: {currentRound + 1}</h3></div>
              {lastRoundResults.length > 0 && (
                <div className="result-card">
                  <h3>Risultati Giornata {currentRound}</h3>
                  <ul>{lastRoundResults.map((r, i) => <li key={i}>{r.home.name} {r.homeScore} - {r.awayScore} {r.away.name}</li>)}</ul>
                </div>
              )}
              <button onClick={handleSimulateRound} className="simulate-button">Simula Giornata</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonSimulation;
