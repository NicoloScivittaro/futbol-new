import React, { useState } from 'react';

const FORMATIONS = [
  { id: '4-3-3', label: '4-3-3', layout: { defense: 4, midfield: 3, attack: 3 } },
  { id: '3-5-2', label: '3-5-2', layout: { defense: 3, midfield: 5, attack: 2 } },
  { id: '4-4-2', label: '4-4-2', layout: { defense: 4, midfield: 4, attack: 2 } },
  { id: '4-2-3-1', label: '4-2-3-1', layout: { defense: 4, holding: 2, attackingMidfield: 3, attack: 1 } },
];

const FormationPitch = ({ formation }) => {
    if (!formation) return null;

    const renderPlayers = (count) => {
        return Array.from({ length: count }).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-white rounded-full border-2 border-gray-700 flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-800 rounded-full"></div>
            </div>
        ));
    };

    const renderFormationLayout = (layout) => {
        const lines = [
            { key: 'attack', players: layout.attack || 0 },
            { key: 'attackingMidfield', players: layout.attackingMidfield || 0 },
            { key: 'midfield', players: layout.midfield || 0 },
            { key: 'holding', players: layout.holding || 0 },
            { key: 'defense', players: layout.defense || 0 },
        ].filter(line => line.players > 0);

        return (
             <div className="flex flex-col-reverse justify-around h-full w-full p-4">
                {/* Goalkeeper */}
                <div className="flex justify-center items-center">
                     <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-gray-700 flex items-center justify-center">
                        <div className="w-6 h-6 bg-gray-800 rounded-full"></div>
                    </div>
                </div>
                {lines.map(line => (
                    <div key={line.key} className="flex justify-around items-center w-full">
                        {renderPlayers(line.players)}
                    </div>
                ))}
            </div>
        );
    }


    return (
        <div className="relative w-full h-96 bg-green-600 border-4 border-white rounded-lg overflow-hidden my-4 shadow-inner">
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            {/* Center line */}
            <div className="absolute top-0 left-1/2 w-0.5 bg-white/50 h-full -translate-x-1/2"></div>
             {/* Penalty box (bottom) */}
            <div className="absolute bottom-0 left-1/2 w-48 h-24 border-2 border-white/50 -translate-x-1/2 rounded-t-lg"></div>

            {renderFormationLayout(formation.layout)}
        </div>
    );
};


export default function TacticSelection({ teamData, onNext, onBack }) {
  const [selectedFormation, setSelectedFormation] = useState('');

  const handleSelectFormation = (formationId) => {
    setSelectedFormation(formationId);
  };

  const handleSubmit = () => {
    if (selectedFormation) {
      onNext && onNext({ tactic: selectedFormation });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2a1a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#2c3e50] rounded-xl shadow-2xl p-8 border border-[#FFD700]">
        <h1 className="text-4xl font-bold mb-6 text-center text-[#FFD700] font-bebas-neue">SCEGLI IL MODULO</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <label className="block mb-4 font-semibold text-lg text-[#FFD700]">MODULI DISPONIBILI</label>
            <div className="grid grid-cols-2 gap-4">
              {FORMATIONS.map(formation => (
                <button
                  type="button"
                  key={formation.id}
                  className={`p-4 rounded-lg border-2 text-center font-bold transition-all duration-200 ${selectedFormation === formation.id ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-transparent border-gray-500 hover:border-[#FFD700]'}`}
                  onClick={() => handleSelectFormation(formation.id)}
                >
                  {formation.label}
                </button>
              ))}
            </div>
          </div>
          
          <FormationPitch formation={FORMATIONS.find(f => f.id === selectedFormation)} />
        </div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            className="w-1/3 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition-all duration-300"
          >
            INDIETRO
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-1/3 bg-[#FFD700] text-black py-3 rounded-lg font-bold text-lg hover:bg-white transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!selectedFormation}
          >
            AVANTI
          </button>
        </div>
      </div>
    </div>
  );
}
