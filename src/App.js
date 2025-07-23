import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TeamSelection from './components/Coach/TeamSelection';
import SeasonSimulation from './components/SeasonSimulation';
import MatchSimulation from './components/MatchSimulation';
import LineupSelection from './components/LineupSelection';
import TopScorers from './components/TopScorers';
import './App.css';

// TODO: Move this to a .env file for better security
// const API_KEY = '55e64e34833c444399581c586407b864';

// Helper function to extract the last name from a full name for robust matching
const getLastName = (fullName) => {
  if (typeof fullName !== 'string' || !fullName) return '';
  const parts = fullName.trim().toLowerCase().split(' ');
  // Get the last part and normalize it by removing non-alphanumeric characters
  return parts[parts.length - 1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '');
};

/*
// Helper function to remove duplicate players from a squad
const deduplicateSquad = (squad) => {
  if (!Array.isArray(squad) || squad.length === 0) return [];
  const uniquePlayers = new Map();
  squad.forEach(player => {
    // We need a consistent key. Player ID is the best one.
    if (player && player.id && !uniquePlayers.has(player.id)) {
      uniquePlayers.set(player.id, player);
    }
  });
  return Array.from(uniquePlayers.values());
};
*/

/*
// Default squad template for teams without squad data
const DEFAULT_SQUAD = [
  { id: 1, name: "Goalkeeper 1", position: "Goalkeeper", stamina: 100 },
  { id: 2, name: "Defender 1", position: "Defender", stamina: 100 },
  { id: 3, name: "Defender 2", position: "Defender", stamina: 100 },
  { id: 4, name: "Defender 3", position: "Defender", stamina: 100 },
  { id: 5, name: "Defender 4", position: "Defender", stamina: 100 },
  { id: 6, name: "Midfielder 1", position: "Midfielder", stamina: 100 },
  { id: 7, name: "Midfielder 2", position: "Midfielder", stamina: 100 },
  { id: 8, name: "Midfielder 3", position: "Midfielder", stamina: 100 },
  { id: 9, name: "Forward 1", position: "Forward", stamina: 100 },
  { id: 10, name: "Forward 2", position: "Forward", stamina: 100 },
  { id: 11, name: "Forward 3", position: "Forward", stamina: 100 },
  { id: 12, name: "Goalkeeper 2", position: "Goalkeeper", stamina: 100 },
  { id: 13, name: "Defender 5", position: "Defender", stamina: 100 },
  { id: 14, name: "Midfielder 4", position: "Midfielder", stamina: 100 },
  { id: 15, name: "Forward 4", position: "Forward", stamina: 100 }
];
*/

function AppContent() {
  const [selectionData, setSelectionData] = useState(null);
  const [lineupData, setLineupData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [step, setStep] = useState('team');
  const [userMatchResult, setUserMatchResult] = useState(null);
  const [pendingMatch, setPendingMatch] = useState(null);
  const [localPlayerStats, setLocalPlayerStats] = useState(null);

  // Fetch local player stats once on mount
  useEffect(() => {
    const fetchLocalStats = async () => {
      try {
        const response = await fetch('/player.json');
        const data = await response.json();
        const statsMap = new Map(data.players.map(p => [getLastName(p.nome), p]));
        setLocalPlayerStats(statsMap);
      } catch (error) {
        console.error("Failed to load local player stats:", error);
      }
    };
    fetchLocalStats();
  }, []);

  /*
  // A clean, synchronous function to apply overrides using the stats from state
  const overrideStats = (squad, teamName) => {
    if (teamName !== 'AS Roma' || !squad || !localPlayerStats) {
      return squad;
    }

    const roleMapping = {
      'POR': 'Goalkeeper',
      'DIF': 'Defender',
      'CEN': 'Midfielder',
      'ATT': 'Attacker',
    };

    return squad.map(player => {
      const playerLastName = getLastName(player.name);
      const localPlayer = localPlayerStats.get(playerLastName);
      if (localPlayer) {
        const newPosition = roleMapping[localPlayer.ruolo] || player.position;
        return {
          ...player,
          name: localPlayer.nome,
          position: newPosition,
          stats: {
            speed: localPlayer.velocita,
            technique: localPlayer.tecnica,
            tackling: localPlayer.contrasti,
            passing: localPlayer.passaggio,
            shooting: localPlayer.tiro,
            stamina: localPlayer.resistenza,
          },
        };
      }
      return player;
    });
  };
  */

  // Effect to load data from session and apply overrides once local stats are ready
  useEffect(() => {
    if (!localPlayerStats) return; // Wait for local stats to be loaded

    try {
      const savedSelection = sessionStorage.getItem('selectionData');
      if (savedSelection) {
        const selection = JSON.parse(savedSelection);
        if (selection && selection.userTeam && selection.allTeams) {
          // Apply overrides to the loaded selection data
          // selection.userTeam.squad = overrideStats(selection.userTeam.squad, selection.userTeam.name);
          setSelectionData(selection);

          const savedLineup = sessionStorage.getItem('lineupData');
          if (savedLineup) {
            const lineup = JSON.parse(savedLineup);
            if (lineup && lineup.titolari && lineup.panchina) {
              // Apply overrides to the loaded lineup data
              // lineup.titolari = overrideStats(lineup.titolari, selection.userTeam.name);
              // lineup.panchina = overrideStats(lineup.panchina, selection.userTeam.name);
              setLineupData(lineup);
              setStep('season');
            } else {
              sessionStorage.removeItem('lineupData');
              setStep('lineup');
            }
          } else {
            setStep('lineup');
          }
        } else {
          throw new Error('Invalid saved selection data.');
        }
      }
    } catch (error) {
      console.error('Could not load session data, resetting:', error);
      resetSelection();
    }
  }, [localPlayerStats]); // This effect runs once localPlayerStats are available

  const handleTeamSelected = ({ team: selectedTeam, style, allTeams }) => {
    if (!localPlayerStats) {
      console.error("Local stats not loaded yet, please wait.");
      return;
    }

    // The full team data is already in selectedTeam, and the list of all teams is passed directly.
    // No need for a new API call.

    let finalSquad;
    if (selectedTeam.squad && selectedTeam.squad.length > 0) {
      finalSquad = selectedTeam.squad;
    } else {
      finalSquad = [];
    }

    // Ensure all other teams also have a valid squad for the season simulation
    const allTeamsData = allTeams.map(team => {
      if (team.id === selectedTeam.id) {
        return selectedTeam; // This is our modified team
      }
      // If another team is missing a squad, assign the default one
      if (!team.squad || team.squad.length === 0) {
        return { ...team, squad: [] };
      }
      return team; // Return the team as is
    });

    const selection = {
      userTeam: selectedTeam,
      teams: allTeamsData, // Corrected property name from allTeams to teams
      userTeamStyle: style,
      competition: { name: 'Serie A', code: 'SA' },
    };

    setSelectionData(selection);
    sessionStorage.setItem('selectionData', JSON.stringify(selection));
    setStep('lineup');
  };

  const handleLineupConfirm = (lineup) => {
    const allTeamsLineupData = selectionData.teams.map(team => {
      if (team.id === selectionData.userTeam.id) {
        // For the user's team, use the newly confirmed lineup
        return {
          team_id: team.id,
          players: [...Object.values(lineup.titolari), ...lineup.panchina],
        };
      }
      // For all other teams, use their existing squad
      return {
        team_id: team.id,
        players: team.squad || [],
      };
    });

    setLineupData(allTeamsLineupData);
    sessionStorage.setItem('lineupData', JSON.stringify(allTeamsLineupData));

    if (pendingMatch) {
      setMatchData(pendingMatch);
      setPendingMatch(null);
      setStep('match');
    } else {
      setStep('season');
    }
  };

  const handlePlayMatch = (match) => {
    if (!match || !match.home || !match.away || !match.home.squad || !match.away.squad) {
      console.error('Dati della partita o rose delle squadre incompleti:', match);
      return;
    }
    setPendingMatch(match);
    setStep('prematch');
  };

  const handleMatchEnd = (result) => {
    setUserMatchResult(result);
    setMatchData(null);
    setStep('season');
  };

  const handleUserMatchProcessed = () => {
    setUserMatchResult(null);
  };

  const handleBackToLineup = () => {
    setStep('lineup');
  };

  const resetSelection = () => {
    setSelectionData(null);
    setLineupData(null);
    setMatchData(null);
    setPendingMatch(null);
    sessionStorage.removeItem('selectionData');
    sessionStorage.removeItem('lineupData');
    setStep('team');
  };

  const renderStep = () => {
    // Wait until data is loaded before rendering children
    if (step !== 'team' && !selectionData) {
        return <div className="loading-container">Loading...</div>;
    }

    switch (step) {
      case 'lineup':
        return <LineupSelection selectionData={selectionData} onNext={handleLineupConfirm} onBack={resetSelection} />;
      case 'prematch':
        return <LineupSelection 
                selectionData={selectionData} 
                onNext={handleLineupConfirm} 
                onBack={() => { setPendingMatch(null); setStep('season'); }}
                initialLineup={lineupData}
              />;
      case 'season':
        return <SeasonSimulation 
                  selectionData={selectionData} 
                  lineupData={lineupData} 
                  onPlayMatch={handlePlayMatch} 
                  onBack={handleBackToLineup} 
                  userMatchResult={userMatchResult} 
                  onUserMatchProcessed={handleUserMatchProcessed}
                />;
      case 'match':
        return <MatchSimulation matchData={matchData} lineupData={lineupData} userTeam={selectionData.userTeam} onMatchEnd={handleMatchEnd} />;
      case 'team':
      default:
        return <TeamSelection onTeamSelected={handleTeamSelected} />;
    }
  };

  return (
    <main>
      {renderStep()}
    </main>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1><Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>FutbolFan 2.0</Link></h1>
          <nav className="main-nav">
            <Link to="/top-scorers">Classifica Marcatori</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/top-scorers" element={<TopScorers />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
