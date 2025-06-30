import React, { useState } from 'react';
import './App.css';
import TeamSelection from './components/Coach/TeamSelection';
import TacticSelection from './components/Coach/TacticSelection';
import LineupSelection from './components/LineupSelection';
import CoachDashboard from './components/CoachDashboard';
import MatchSimulation from './components/MatchSimulation';
import SeasonSimulation from './components/SeasonSimulation';

function App() {
  const [step, setStep] = useState('team'); // 'team', 'tactic', 'lineup', 'dashboard', 'match', 'season'
  const [selection, setSelection] = useState({});

  const handleTeamNext = (data) => {
    setSelection(prev => ({ ...prev, ...data }));
    setStep('tactic');
  };

  const handleTacticNext = (data) => {
    setSelection(prev => ({ ...prev, ...data }));
    setStep('lineup');
  };

  const handleLineupNext = (data) => {
    setSelection(prev => ({ ...prev, ...data }));
    setStep('dashboard');
  };

  const handleDashboardNext = () => {
    setStep('match');
  };

  const handleMatchEnd = () => {
    setStep('dashboard');
  };

  const handleGoToSeason = () => {
    setStep('season');
  };

  const handlePlayUserMatch = (matchData) => {
    setSelection(prev => ({ ...prev, currentMatch: matchData }));
    setStep('match');
  };

  const handleUserMatchEnd = (result) => {
    setSelection(prev => ({ ...prev, lastMatchResult: result }));
    setStep('season');
  };

  const handleBack = () => {
    switch (step) {
      case 'season':
        setStep('dashboard');
        break;
      case 'match':
        setStep('dashboard');
        break;
      case 'dashboard':
        setStep('lineup');
        break;
      case 'lineup':
        setStep('tactic');
        break;
      case 'tactic':
        setStep('team');
        break;
      default:
        break;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'team':
        return <TeamSelection onNext={handleTeamNext} />;
      case 'tactic':
        return <TacticSelection teamData={selection} onNext={handleTacticNext} onBack={handleBack} />;
      case 'lineup':
        return <LineupSelection selectionData={selection} onNext={handleLineupNext} onBack={handleBack} />;
      case 'dashboard':
        return <CoachDashboard selectionData={selection} onNext={handleDashboardNext} onBack={handleBack} onGoToSeason={handleGoToSeason} />;
      case 'match':
        return <MatchSimulation selectionData={selection} onMatchEnd={handleUserMatchEnd} isSeasonMatch={true} />;
      case 'season':
        return <SeasonSimulation selectionData={selection} onBack={handleBack} onPlayMatch={handlePlayUserMatch} />;
      default:
        return <TeamSelection onNext={handleTeamNext} />;
    }
  };

  return (
    <div className="App bg-green-50 min-h-screen">
      {renderStep()}
    </div>
  );
}

export default App;
