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
  let base = 50;

  // Bonus / Malus per ogni statistica (soglia di riferimento: 70)
  const bonusVelocita = (giocatore.velocita - 70) * 0.2;    // corsa e ripartenze
  const bonusTiro = (giocatore.tiro - 70) * 0.3;             // finalizzazione
  const bonusPassaggio = (giocatore.passaggio - 70) * 0.25;  // creazione gioco
  const bonusDribbling = (giocatore.dribbling - 70) * 0.2;   // 1v1
  const bonusDifesa = (giocatore.difesa - 70) * 0.35;        // chiusure
  const bonusFisico = (giocatore.fisico - 70) * 0.2;         // contrasti e stanchezza
  const bonusOverall = (giocatore.overall - 70) * 0.4;       // influenza complessiva

  // Calcolo finale
  const prestazioneModificata = base +
    bonusVelocita +
    bonusTiro +
    bonusPassaggio +
    bonusDribbling +
    bonusDifesa +
    bonusFisico +
    bonusOverall;

  return Math.round(Math.max(0, prestazioneModificata));
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
    'POR': {
      tuffo: 0.4,
      presa: 0.3,
      rinvio: 0.2,
      riflessi: 0.4,
      reattivita: 0.3,
      piazzamento: 0.3
    },
    'DIF': {
      difesa: 0.4,
      fisico: 0.3,
      velocita: 0.2,
      passaggio: 0.2
    },
    'CEN': {
      passaggio: 0.4,
      dribbling: 0.3,
      fisico: 0.2,
      velocita: 0.2
    },
    'ATT': {
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

export default {
  calcolaPrestazione,
  calcolaPrestazionePerRuolo,
  calcolaProbabilitaAzione,
  calcolaModificatoreStanchezza
};
