import React, { useState, useEffect } from 'react';
import './TopScorers.css';

const TopScorers = () => {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScorers = async () => {
      try {
        // Hardcoded for Serie A (SA) as per the example
        const response = await fetch('/v4/competitions/SA/scorers', {
          headers: {
            'X-Auth-Token': process.env.REACT_APP_API_KEY
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setScorers(data.scorers || []);
      } catch (e) {
        setError(e.message);
        console.error("Error fetching top scorers:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchScorers();
  }, []);

  if (loading) {
    return <div className="loading">Caricamento classifica marcatori...</div>;
  }

  if (error) {
    return <div className="error">Errore nel caricamento dei dati: {error}</div>;
  }

  return (
    <div className="top-scorers-container">
      <h1>Classifica Marcatori - Serie A</h1>
      <table className="scorers-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Giocatore</th>
            <th>Squadra</th>
            <th>Nazionalità</th>
            <th>Gol</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((scorer, index) => (
            <tr key={scorer.player.id}>
              <td>{index + 1}</td>
              <td>{scorer.player.name}</td>
              <td>{scorer.team.name}</td>
              <td>{scorer.player.nationality}</td>
              <td className="goals">{scorer.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopScorers;
