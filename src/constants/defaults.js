export const CATEGORIES = {
  WORK: 'work',
  REST: 'rest',
  VACATION: 'vacation',
  LEAVE: 'leave',
  SICK: 'sick'
};

export const CATEGORY_LABELS = {
  [CATEGORIES.WORK]: 'Lavoro',
  [CATEGORIES.REST]: 'Riposo',
  [CATEGORIES.VACATION]: 'Ferie',
  [CATEGORIES.LEAVE]: 'Permesso / ROL',
  [CATEGORIES.SICK]: 'Malattia'
};

export const DEFAULT_SHIFTS = [
  {
    id: 'm1',
    code: 'M1',
    name: 'Mattina 1',
    category: CATEGORIES.WORK,
    startTime: '06:00',
    endTime: '14:00',
    hours: 8,
    color: '#0284c7', // Sky-600
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'm2',
    code: 'M2',
    name: 'Mattina 2',
    category: CATEGORIES.WORK,
    startTime: '07:00',
    endTime: '15:00',
    hours: 8,
    color: '#0ea5e9', // Sky-500
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'm3',
    code: 'M3',
    name: 'Mattina 3',
    category: CATEGORIES.WORK,
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
    color: '#38bdf8', // Sky-400
    textColor: '#082f49',
    activeInPalette: true,
  },
  {
    id: 'p1',
    code: 'P1',
    name: 'Pomeriggio 1',
    category: CATEGORIES.WORK,
    startTime: '14:00',
    endTime: '22:00',
    hours: 8,
    color: '#f59e0b', // Amber-500
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'p2',
    code: 'P2',
    name: 'Pomeriggio 2',
    category: CATEGORIES.WORK,
    startTime: '13:00',
    endTime: '21:00',
    hours: 8,
    color: '#d97706', // Amber-600
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'p3',
    code: 'P3',
    name: 'Pomeriggio 3',
    category: CATEGORIES.WORK,
    startTime: '15:00',
    endTime: '23:00',
    hours: 8,
    color: '#b45309', // Amber-700
    textColor: '#ffffff',
    activeInPalette: false,
  },
  {
    id: 'n',
    code: 'N',
    name: 'Notte',
    category: CATEGORIES.WORK,
    startTime: '22:00',
    endTime: '06:00',
    hours: 8,
    color: '#6366f1', // Indigo-500
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'g',
    code: 'G',
    name: 'Giornata Intera',
    category: CATEGORIES.WORK,
    startTime: '08:30',
    endTime: '17:30',
    hours: 8,
    color: '#10b981', // Emerald-500
    textColor: '#ffffff',
    activeInPalette: false,
  },
  {
    id: 'r',
    code: 'R',
    name: 'Riposo',
    category: CATEGORIES.REST,
    startTime: '',
    endTime: '',
    hours: 0,
    color: '#475569', // Slate-600
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'f',
    code: 'F',
    name: 'Ferie',
    category: CATEGORIES.VACATION,
    startTime: '',
    endTime: '',
    hours: 8,
    color: '#8b5cf6', // Violet-500
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'rol',
    code: 'ROL',
    name: 'Permesso ROL',
    category: CATEGORIES.LEAVE,
    startTime: '',
    endTime: '',
    hours: 8,
    color: '#ec4899', // Pink-500
    textColor: '#ffffff',
    activeInPalette: true,
  },
  {
    id: 'mal',
    code: 'MAL',
    name: 'Malattia',
    category: CATEGORIES.SICK,
    startTime: '',
    endTime: '',
    hours: 8,
    color: '#ef4444', // Red-500
    textColor: '#ffffff',
    activeInPalette: true,
  }
];

export const DEFAULT_MODIFIERS = [
  { id: 'straord-1', label: '+1h', color: '#16a34a', desc: '1 Ora Straordinario' },
  { id: 'straord-2', label: '+2h', color: '#15803d', desc: '2 Ore Straordinario' },
  { id: 'straord-3', label: '+3h', color: '#166534', desc: '3 Ore Straordinario' },
  { id: 'antic-1', label: '-1h', color: '#ea580c', desc: 'Uscita anticipata 1h' },
  { id: 'antic-2', label: '-2h', color: '#c2410c', desc: 'Uscita anticipata 2h' },
  { id: 'formazione', label: 'Formaz.', color: '#0284c7', desc: 'Corso di Formazione' },
  { id: 'reperibile', label: 'Reperib.', color: '#7c3aed', desc: 'Reperibilità attiva' },
  { id: 'cambio', label: 'Cambio', color: '#ca8a04', desc: 'Cambio turno con collega' }
];

export const PRESET_PACKS = [
  {
    id: 'preset-standard-mp',
    name: 'Standard 2 Turni (Mattina / Pomeriggio)',
    description: 'Alternanza settimanale Mattine (M1/M2/M3) e Pomeriggi (P1/P2) con Riposo nel weekend',
    shifts: DEFAULT_SHIFTS
  },
  {
    id: 'preset-ciclo-continuo',
    name: 'Ciclo Continuo (Mattina / Pomeriggio / Notte / Riposo)',
    description: 'Schema a turni rotativi continuo 4x2 o 3x2 con turno Notte incluso',
    shifts: DEFAULT_SHIFTS
  }
];
