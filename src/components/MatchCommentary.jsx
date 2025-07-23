import React, { useState, useEffect } from 'react';
import './MatchCommentary.css';

const MatchCommentary = ({ match, commentary, formation, userTeam, result, onClose }) => {
  const { home, away } = match;
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [currentScore, setCurrentScore] = useState({ home: 0, away: 0 });
  // const [finalScore, setFinalScore] = useState(result);
  // const [showFinalScore, setShowFinalScore] = useState(false);
  // const [userFormation, setUserFormation] = useState(formation);

  useEffect(() => {
    if (visibleEvents.length >= commentary.events.length) {
      return; // All events have been shown
    }

    const timer = setTimeout(() => {
      const nextEvent = commentary.events[visibleEvents.length];
      setVisibleEvents(prevEvents => [...prevEvents, nextEvent]);

      if (nextEvent.type === 'goal') {
        setCurrentScore(prevScore => {
          const newScore = { ...prevScore };
          if (nextEvent.team.id === home.id) {
            newScore.home += 1;
          } else {
            newScore.away += 1;
          }
          return newScore;
        });
      }
    }, 1000); // 1-second delay for each event

    return () => clearTimeout(timer); // Cleanup the timeout
  }, [visibleEvents, commentary.events, home.id]);

  const isFinished = visibleEvents.length === commentary.events.length;

  const renderPlayerList = (team) => {
    const isUserTeam = team.id === userTeam.id;
    let titolari, panchina;
    if (isUserTeam) {
      titolari = Object.values(formation.titolari);
      panchina = formation.panchina;
    } else {
      const squad = team.squad || [];
      titolari = squad.slice(0, 11);
      panchina = squad.slice(11);
    }

    return (
      <div className="player-list-container">
        <h4>TITOLARI</h4>
        <ul>
          {Array.isArray(titolari) && titolari.map(player => <li key={player.id}>{player.name}</li>)}
        </ul>
        <h4>PANCHINA</h4>
        <ul>
                    {Array.isArray(panchina) && panchina.map(player => <li key={player.id}>{player.name}</li>)}
        </ul>
      </div>
    );
  };


  return (
    <div className="match-commentary-container">
      <div className="match-content-area">
        {renderPlayerList(home)}
        <div className="center-column">
          <div className="match-header-commentary">
            <div className="team-display">
              <img src={home.crest} alt={home.name} className="team-crest-large" />
              <span>{home.name}</span>
            </div>
            <div className="score-display">
              {isFinished ? `${result.homeScore} - ${result.awayScore}` : `${currentScore.home} - ${currentScore.away}`}
            </div>
            <div className="team-display">
              <img src={away.crest} alt={away.name} className="team-crest-large" />
              <span>{away.name}</span>
            </div>
          </div>

          <div className="commentary-feed-container">
            <div className="commentary-feed">
              {visibleEvents.map((event, index) => (
                <div key={index} className={`event-item event-type-${event.type}`}>
                  <span className="event-minute">{event.minute}'</span>
                  <div className="event-details">
                    <div className="event-text" dangerouslySetInnerHTML={{ __html: event.text }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isFinished && (
            <button onClick={onClose} className="finish-match-button">
              Fine Partita & Torna al Calendario
            </button>
          )}
        </div>
        {renderPlayerList(away)}
      </div>
    </div>
  );
};

export default MatchCommentary;
