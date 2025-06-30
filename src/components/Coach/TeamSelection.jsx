import React, { useState, useEffect } from "react";

const STYLES = [
  { id: "tiki-taka", label: "Tiki-Taka" },
  { id: "contropiede", label: "Contropiede" },
  { id: "pressing-alto", label: "Pressing Alto" },
];

export default function TeamSelection({ onNext }) {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);

  const API_TOKEN = 'db31d290622d4c84b8f8ad4292e0e5c5';
  const BASE_URL = '/v4';

  useEffect(() => {
    // Fetch teams from the Premier League (PL)
    fetch(`${BASE_URL}/competitions/PL/teams`, {
      headers: { 'X-Auth-Token': API_TOKEN }
    })
      .then(res => {
        if (!res.ok) {
          console.error('Failed to fetch teams:', res.status, res.statusText);
          return res.json().then(err => { throw new Error(err.message) });
        }
        return res.json();
      })
      .then(data => {
        setTeams(data.teams || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching teams:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      const teamId = parseInt(selectedTeam, 10);
      if (!isNaN(teamId)) {
        setPlayers([]); // Reset players while fetching new ones
        fetch(`${BASE_URL}/teams/${teamId}`, {
          headers: { 'X-Auth-Token': API_TOKEN }
        })
          .then(res => {
            if (!res.ok) {
              console.error('Failed to fetch players:', res.status, res.statusText);
              return res.json().then(err => { throw new Error(err.message) });
            }
            return res.json();
          })
          .then(data => setPlayers(data.squad || []))
          .catch(error => console.error(`Error fetching players for team ${teamId}:`, error));
      } else {
        setPlayers([]);
      }
    } else {
      setPlayers([]);
    }
  }, [selectedTeam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTeam && selectedStyle) {
      const teamObj = teams.find(t => t.id === parseInt(selectedTeam));
      onNext && onNext({ team: teamObj, style: selectedStyle, players: players, allTeams: teams });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2a1a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#2c3e50] rounded-xl shadow-2xl p-8 border border-[#FFD700]">
        <h1 className="text-4xl font-bold mb-6 text-center text-[#FFD700] font-bebas-neue">SCEGLI LA TUA SQUADRA</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-[#FFD700]">SQUADRA</label>
            {loading ? (
              <div className="text-center p-4">Caricamento...</div>
            ) : (
              <select
                className="w-full p-3 bg-[#1a2a1a] border border-[#FFD700] rounded focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                required
              >
                <option value="">Seleziona una squadra</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
          </div>

          {selectedTeam && !loading && (
            <div className="flex items-center justify-center gap-4 p-4 bg-black/20 rounded-lg">
              <img
                src={teams.find(t => t.id === parseInt(selectedTeam))?.crest}
                alt="Logo squadra"
                className="w-16 h-16 object-contain"
              />
              <span className="text-2xl font-bold">
                {teams.find(t => t.id === parseInt(selectedTeam))?.name}
              </span>
            </div>
          )}

          <div>
            <label className="block mb-2 font-semibold text-[#FFD700]">STILE DI GIOCO</label>
            <div className="grid grid-cols-3 gap-4">
              {STYLES.map(style => (
                <button
                  type="button"
                  key={style.id}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${selectedStyle === style.id ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-transparent border-gray-500 hover:border-[#FFD700]'}`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FFD700] text-black py-3 rounded-lg font-bold text-lg hover:bg-white transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!selectedTeam || !selectedStyle}
          >
            AVANTI
          </button>
        </form>
      </div>
    </div>
  );
} 