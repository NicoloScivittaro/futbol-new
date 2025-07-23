/**
 * Algoritmo di calcolo delle prestazioni dei giocatori
 * Calcola un modificatore di prestazione basato sulle statistiche del giocatore
 */

/**
 * Calcola la prestazione di un giocatore basata sulle sue statistiche
 * @param {Object} giocatore - Oggetto giocatore con le statistiche
 * @param {number} giocatore.velocita - Velocità (0-100)
 * @param {number} giocatore.tiro - Tiro (0-100)
 * @param {number} giocatore.passaggio - Passaggio (0-100)
 * @param {number} giocatore.dribbling - Dribbling (0-100)
 * @param {number} giocatore.difesa - Difesa (0-100)
 * @param {number} giocatore.fisico - Fisico (0-100)
 * @param {number} giocatore.overall - Overall (0-100)
 * @returns {number} Prestazione modificata (0-150 circa)
 */
export function calcolaPrestazione(giocatore) {
  if (!giocatore) return 0;

  const { ruolo, overall } = giocatore;

  // Specialized handling for goalkeepers
  if (ruolo === 'POR') {
    const { tuffo, presa, rinvio, riflessi, reattivita, piazzamento } = giocatore;
    if ([tuffo, presa, rinvio, riflessi, reattivita, piazzamento].some(s => s === undefined)) {
      return (overall || 50); // Fallback if goalkeeper stats are missing
    }
    let prestazione = 50;
    prestazione += (tuffo - 70) * 0.2;
    prestazione += (presa - 70) * 0.2;
    prestazione += (rinvio - 70) * 0.1;
    prestazione += (riflessi - 70) * 0.2;
    prestazione += (reattivita - 70) * 0.15;
    prestazione += (piazzamento - 70) * 0.15;
    if (overall) {
      prestazione += (overall - 70) * 0.3;
    }
    return Math.round(Math.max(0, Math.min(100, prestazione)));
  }

  // Handling for field players
  const { velocita, tiro, passaggio, dribbling, difesa, fisico } = giocatore;
  if ([velocita, tiro, passaggio, dribbling, difesa, fisico].some(s => s === undefined)) {
    return (overall || 50); // Fallback if stats are missing
  }

  let prestazione = 50; // Base value

  // Bonus/Malus based on stats
  prestazione += (velocita - 70) * 0.1;
  prestazione += (tiro - 70) * 0.1;
  prestazione += (passaggio - 70) * 0.1;
  prestazione += (dribbling - 70) * 0.1;
  prestazione += (difesa - 70) * 0.1;
  prestazione += (fisico - 70) * 0.1;

  // Bonus/Malus based on overall
  if (overall) {
    prestazione += (overall - 70) * 0.4;
  }

  return Math.round(Math.max(0, Math.min(100, prestazione)));
}

/**
 * Calcola la prestazione specifica per ruolo
 * @param {Object} giocatore - Oggetto giocatore
 * @param {string} ruolo - Ruolo specifico (POR, DIF, CEN, ATT)
 * @returns {number} Prestazione modificata per il ruolo
 */
export function calcolaPrestazionePerRuolo(giocatore, ruolo) {
  const prestazioneBase = calcolaPrestazione(giocatore);
  
  // Moltiplicatori specifici per ruolo
  const moltiplicatori = {
    'goalkeeper': {
      tuffo: 0.4,
      presa: 0.3,
      rinvio: 0.2,
      riflessi: 0.4,
      reattivita: 0.3,
      piazzamento: 0.3
    },
    'defender': {
      difesa: 0.4,
      fisico: 0.3,
      velocita: 0.2,
      passaggio: 0.2
    },
    'midfielder': {
      passaggio: 0.4,
      dribbling: 0.3,
      fisico: 0.2,
      velocita: 0.2
    },
    'attacking-midfielder': {
      passaggio: 0.3,
      dribbling: 0.3,
      tiro: 0.3,
      velocita: 0.2
    },
    'forward': {
      tiro: 0.4,
      dribbling: 0.3,
      velocita: 0.3,
      fisico: 0.2
    }
  };

  if (!moltiplicatori[ruolo]) {
    return prestazioneBase;
  }

  let bonusRuolo = 0;
  const mult = moltiplicatori[ruolo];

  // Calcola bonus specifico per il ruolo
  for (const [stat, peso] of Object.entries(mult)) {
    if (giocatore[stat] !== undefined) {
      bonusRuolo += (giocatore[stat] - 70) * peso;
    }
  }

  return Math.round(Math.max(0, prestazioneBase + bonusRuolo));
}

/**
 * Calcola la probabilità di successo per un'azione specifica
 * @param {Object} giocatore - Oggetto giocatore
 * @param {string} azione - Tipo di azione (dribbling, tiro, passaggio, difesa, etc.)
 * @returns {number} Probabilità di successo (0-1)
 */
export function calcolaProbabilitaAzione(giocatore, azione) {
  const mappingAzioni = {
    'dribbling': ['dribbling', 'velocita'],
    'tiro': ['tiro', 'overall'],
    'passaggio': ['passaggio', 'overall'],
    'difesa': ['difesa', 'fisico'],
    'contrasto': ['fisico', 'difesa'],
    'parata': ['riflessi', 'tuffo', 'presa'],
    'cross': ['passaggio', 'velocita'],
    'colpo_di_testa': ['fisico', 'tiro']
  };

  const statistiche = mappingAzioni[azione] || ['overall'];
  let mediaStats = 0;

  for (const stat of statistiche) {
    mediaStats += giocatore[stat] || 70;
  }
  mediaStats /= statistiche.length;

  // Converte in probabilità (0-1) con curva realistica
  const probabilita = Math.min(0.95, Math.max(0.05, (mediaStats - 30) / 70));
  
  return probabilita;
}

/**
 * Calcola il modificatore di stanchezza
 * @param {number} minutiGiocati - Minuti giocati nella partita
 * @param {number} fisico - Statistica fisico del giocatore
 * @returns {number} Moltiplicatore di prestazione (0.5-1.0)
 */
export function calcolaModificatoreStanchezza(minutiGiocati, fisico) {
  const sogliaSopportazione = fisico * 0.8; // I giocatori più fisici resistono di più
  
  if (minutiGiocati <= sogliaSopportazione) {
    return 1.0; // Prestazione piena
  }
  
  const minutiEccesso = minutiGiocati - sogliaSopportazione;
  const penalita = minutiEccesso * 0.01; // 1% di penalità per ogni minuto oltre la soglia
  
  return Math.max(0.5, 1.0 - penalita);
}

const performanceCalculator = {
  calcolaPrestazione,
  calcolaPrestazionePerRuolo,
  calcolaProbabilitaAzione,
  calcolaModificatoreStanchezza
};

export default performanceCalculator;
