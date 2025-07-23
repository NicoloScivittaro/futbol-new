import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TeamSelection from './components/Coach/TeamSelection';
import SeasonSimulation from './components/SeasonSimulation';
import MatchSimulation from './components/MatchSimulation';
import LineupSelection from './components/LineupSelection';
import TopScorers from './components/TopScorers';
import './App.css';

function AppContent() {
  const [selectionData, setSelectionData] = useState(null);
  const [lineupData, setLineupData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [step, setStep] = useState('team');
  const [userMatchResult, setUserMatchResult] = useState(null);
  const [pendingMatch, setPendingMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    setLoading(true);
    
    try {
      console.log('Processing teams data...');
      
      // Since teams already come with squad data from local file, just process them
      const allTeamsData = allTeams.map(team => {
        if (!team.squad || team.squad.length === 0) {
          console.warn(`Squad for team ${team.name} not found, creating default squad`);
          // Create a more realistic default squad
          const defaultSquad = Array.from({ length: 25 }, (_, i) => ({
            id: team.id * 1000 + i + 1,
            name: `${team.name.split(' ')[0]} Player ${i + 1}`,
            position: i === 0 ? 'Goalkeeper' : (i < 8 ? 'Defender' : (i < 16 ? 'Midfielder' : 'Attacker')),
            nationality: 'Italy',
            dateOfBirth: '1995-01-01',
            shirtNumber: i + 1
          }));
          return { ...team, squad: defaultSquad };
        }
        
        // Team already has squad data from local file
        console.log(`✓ Team ${team.name} has ${team.squad.length} players`);
        return team;
      });

      console.log('All teams processed');
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
    } catch (error) {
      console.error('Error in handleTeamSelected:', error);
      // Fallback to basic team data
      const selection = {
        userTeam: selectedTeam,
        teams: allTeams,
        userTeamStyle: style,
        competition: { name: 'Serie A', code: 'SA' },
      };
      setSelectionData(selection);
      setStep('lineup');
    } finally {
      setLoading(false);
    }
  };

  const handleLineupConfirm = (lineup) => {
    const allTeamsLineupData = selectionData.teams.map(team => {
      if (team.id === selectionData.userTeam.id) {
        return {
          team_id: team.id,
          players: [...Object.values(lineup.titolari), ...lineup.panchina],
        };
      }
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
      {loading ? <div className="loading-container">Loading...</div> : renderStep()}
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
