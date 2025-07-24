import React, { useState, useEffect } from "react";

const STYLES = [
  { id: "tiki-taka", label: "Tiki-Taka" },
  { id: "contropiede", label: "Contropiede" },
  { id: "pressing-alto", label: "Pressing Alto" },
];

export default function TeamSelection({ onTeamSelected }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log('Loading teams and players from local JSON files...');
        setLoading(true);
        
        // Load players from player.json
        const playersResponse = await fetch('/player.json');
        if (!playersResponse.ok) {
          throw new Error(`Failed to load players: ${playersResponse.status}`);
        }
        const playersData = await playersResponse.json();
        
        // Load teams from sa_teams.json
        const teamsResponse = await fetch('/sa_teams.json');
        if (!teamsResponse.ok) {
          throw new Error(`Failed to load teams: ${teamsResponse.status}`);
        }
        const teamsData = await teamsResponse.json();
        
        // Group players by team
        const playersByTeam = {};
        playersData.players.forEach(player => {
          const teamName = player.squadra;
          if (!playersByTeam[teamName]) {
            playersByTeam[teamName] = [];
          }
          
          // Convert player format to match expected structure
          const convertedPlayer = {
            id: player.id,
            name: player.nome,
            ruolo: player.ruolo,
            ruoliSecondari: player.ruoliSecondari,
            dateOfBirth: player.annoNascita ? `${player.annoNascita}-01-01` : null,
            nationality: player.nazionalita ? player.nazionalita[0] : 'Unknown',
            shirtNumber: player.numeroMaglia,
            marketValue: player.valoreMercato,
            overall: player.overall,
            height: player.altezzaCm,
            weight: player.pesoKg,
            contractExpiry: player.scadenzaContratto,
            velocita: player.velocita,
            tiro: player.tiro,
            passaggio: player.passaggio,
            dribbling: player.dribbling,
            difesa: player.difesa,
            fisico: player.fisico,
            tuffo: player.tuffo,
            presa: player.presa,
            rinvio: player.rinvio,
            riflessi: player.riflessi,
            reattivita: player.reattivita,
            piazzamento: player.piazzamento
          };
          
          playersByTeam[teamName].push(convertedPlayer);
        });
        
        // Combine teams with their players
        const teamsWithSquads = teamsData.teams.map(team => {
          const teamPlayers = playersByTeam[team.name] || [];
          return {
            ...team,
            squad: teamPlayers
          };
        });
        
        console.log('Teams loaded successfully:', teamsWithSquads.length);
        setTeams(teamsWithSquads);
        setError(null);
        
      } catch (error) {
        console.error('Error loading teams and players:', error);
        setError(`Failed to load teams and players: ${error.message}`);
        
        // Fallback: try to load from seriea_squad.json
        try {
          console.log('Attempting fallback to seriea_squad.json...');
          const fallbackResponse = await fetch('/seriea_squad.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setTeams(fallbackData.teams || []);
            setError(null);
            console.log('Fallback successful');
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setError('Failed to load team data from all sources');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedStyle) return;

    setLoading(true);
    setError(null);

    try {
      const selectedTeam = teams.find(t => t.id === parseInt(selectedTeamId));
      if (!selectedTeam.squad || selectedTeam.squad.length === 0) {
        console.warn(`Squad for team ${selectedTeam.name} is not available. App.js will use a default squad.`);
      }

      onTeamSelected({
        team: selectedTeam,
        style: selectedStyle,
        allTeams: teams,
      });
      
    } catch (err) {
      setError("Errore di rete. Verranno usati dati di base.");
      console.error("Network or JSON parsing error, falling back to basic data:", err);
      const selectedTeam = teams.find(t => t.id === parseInt(selectedTeamId));
      onTeamSelected({ team: selectedTeam, style: selectedStyle, allTeams: teams });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#1a2a1a] text-white flex items-center justify-center p-4"><p>Caricamento squadre...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#1a2a1a] text-white flex items-center justify-center p-4"><p>Errore nel caricamento: {error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#1a2a1a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#2c3e50] rounded-xl shadow-2xl p-8 border border-[#FFD700]">
        <h1 className="text-4xl font-bold mb-6 text-center text-[#FFD700] font-bebas-neue">SCEGLI LA TUA SQUADRA</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-[#FFD700]">SQUADRA</label>
              <select
                className="w-full p-3 bg-[#1a2a1a] border border-[#FFD700] rounded focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                required
              >
                <option value="">Seleziona una squadra</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
          </div>

          {selectedTeamId && (
            <div className="flex items-center justify-center gap-4 p-4 bg-black/20 rounded-lg">
              <img
                src={teams.find(t => t.id === parseInt(selectedTeamId))?.crest}
                alt="Logo squadra"
                className="w-16 h-16 object-contain"
              />
              <span className="text-2xl font-bold">
                {teams.find(t => t.id === parseInt(selectedTeamId))?.name}
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
            disabled={!selectedTeamId || !selectedStyle}
          >
            AVANTI
          </button>
        </form>
      </div>
    </div>
  );
} 