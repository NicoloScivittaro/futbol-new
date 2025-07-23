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
  const competitionCode = 'SA';

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log('Fetching teams from API...');
        
        // Try different approaches to get teams
        let response;
        let data;
        
        // First try: current season
        try {
          console.log('Trying: /api/v4/competitions/SA/teams?season=2024');
          response = await fetch('/api/v4/competitions/SA/teams?season=2024');
          if (response.ok) {
            data = await response.json();
            console.log('✓ Success with season=2024');
          }
        } catch (e) {
          console.log('✗ Failed with season=2024:', e.message);
        }
        
        // Second try: no season parameter
        if (!data) {
          try {
            console.log('Trying: /api/v4/competitions/SA/teams');
            response = await fetch('/api/v4/competitions/SA/teams');
            if (response.ok) {
              data = await response.json();
              console.log('✓ Success without season parameter');
            }
          } catch (e) {
            console.log('✗ Failed without season:', e.message);
          }
        }
        
        // Third try: previous season
        if (!data) {
          try {
            console.log('Trying: /api/v4/competitions/SA/teams?season=2023');
            response = await fetch('/api/v4/competitions/SA/teams?season=2023');
            if (response.ok) {
              data = await response.json();
              console.log('✓ Success with season=2023');
            }
          } catch (e) {
            console.log('✗ Failed with season=2023:', e.message);
          }
        }
        
        if (!data) {
          throw new Error('All API attempts failed');
        }
        
        console.log('Successfully fetched teams:', data.teams?.length || 0, 'teams');
        setTeams(data.teams || []);
        console.log('Teams loaded successfully');
      } catch (e) {
        console.error("Failed to fetch from API, trying local file:", e);
        // If API fails, try to fetch from local file
        try {
          const response = await fetch('/sa_teams.json');
          if (!response.ok) {
            throw new Error(`Local file error! status: ${response.status}`);
          }
          const data = await response.json();
          setTeams(data.teams || []);
          setError(null); // Clear error if local file succeeds
          console.log('Loaded teams from local file');
        } catch (localError) {
          setError("Failed to load teams data");
          console.error("Failed to fetch from local file:", localError);
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
      const currentSeason = '2024';
      const response = await fetch(`/api/v4/teams/${selectedTeamId}?season=${currentSeason}`);
      let teamData;

      if (response.ok) {
        teamData = await response.json();
      } else {
        console.warn(`API error for team ${selectedTeamId}: ${response.status}. Falling back to basic data.`);
        teamData = teams.find(t => t.id === parseInt(selectedTeamId)) || {};
      }

      // Fallback for Roma squad
      if (parseInt(selectedTeamId) === 100 && (!teamData.squad || teamData.squad.length === 0)) {
        console.log("AS Roma squad not found via API, attempting to load from local fallback.");
        try {
          const fallbackResponse = await fetch('/roma_squad.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            teamData.squad = fallbackData.squad; // Merge local squad into team data
            console.log("Successfully loaded AS Roma squad from local file.");
          } else {
            console.error("Could not load local fallback squad for AS Roma.");
          }
        } catch (fallbackError) {
          console.error("Error fetching local fallback squad for AS Roma:", fallbackError);
        }
      }

      if (!teamData.squad || teamData.squad.length === 0) {
        const teamName = teamData.name || teams.find(t => t.id === parseInt(selectedTeamId))?.name;
        console.warn(`Squad for team ${teamName} is not available. App.js will use a default squad.`);
      }

      onTeamSelected({
        team: teamData,
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