import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TeamSelection from './components/Coach/TeamSelection';
import SeasonSimulation from './components/SeasonSimulation';
import MatchSimulation from './components/MatchSimulation';
import LineupSelection from './components/LineupSelection';
import TopScorers from './components/TopScorers';
import './App.css';

// Helper function to extract the last name from a full name for robust matching
const getLastName = (fullName) => {
  if (typeof fullName !== 'string' || !fullName) return '';
  const parts = fullName.trim().toLowerCase().split(' ');
  // Get the last part and normalize it by removing non-alphanumeric characters
  return parts[parts.length - 1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '');
};

function AppContent() {
  const [selectionData, setSelectionData] = useState(null);
  const [lineupData, setLineupData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [step, setStep] = useState('team');
  const [userMatchResult, setUserMatchResult] = useState(null);
  const [pendingMatch, setPendingMatch] = useState(null);
  // const [localPlayerStats, setLocalPlayerStats] = useState(null);

  // Fetch local player stats once on mount
  /*
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
  */

  // Effect to load data from session and apply overrides once local stats are ready
  npm install  useEffect(() => {
    const savedSelection = sessionStorage.getItem('selectionData');
    if (savedSelection) {
      try {
        const selection = JSON.parse(savedSelection);
        if (selection && selection.userTeam && selection.teams) {
          setSelectionData(selection);

          const savedLineup = sessionStorage.getItem('lineupData');
          if (savedLineup) {
            const lineup = JSON.parse(savedLineup);
            if (lineup && lineup.titolari && lineup.panchina) {
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
      } catch (error) {
        console.error('Could not load session data, resetting:', error);
        resetSelection();
      }
    }
  }, []); // Run only once on mount

  const handleTeamSelected = ({ team: selectedTeam, style, allTeams }) => {
    // Ensure every team has a squad array to prevent crashes
    const allTeamsData = allTeams.map(team => {
      if (!team.squad) {
        console.warn(`Squadra ${team.name} non trovata, si usa una squadra di default.`);
        // Use a simple default squad structure
        const defaultSquad = Array.from({ length: 15 }, (_, i) => ({
          id: team.id * 1000 + i + 1,
          name: `Player ${i + 1}`,
          position: i === 0 ? 'Goalkeeper' : (i < 5 ? 'Defender' : (i < 10 ? 'Midfielder' : 'Attacker')),
          stamina: 100
        }));
        return { ...team, squad: defaultSquad };
      }
      // Deduplicate squad to prevent issues with duplicate player IDs
      const uniqueSquad = [...new Map(team.squad.map(p => [p.id, p])).values()];
      return { ...team, squad: uniqueSquad };
    });

    const finalUserTeam = allTeamsData.find(t => t.id === selectedTeam.id);

    const selection = {
      userTeam: finalUserTeam,
      teams: allTeamsData,
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
