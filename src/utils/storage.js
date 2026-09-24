import { DEFAULT_SHIFTS, DEFAULT_MODIFIERS } from '../constants/defaults';

const STORAGE_KEYS = {
  SHIFTS_CONFIG: 'inturno_shifts_config_v1',
  MODIFIERS_CONFIG: 'inturno_modifiers_config_v1',
  SCHEDULE: 'inturno_schedule_data_v1',
  SETTINGS: 'inturno_settings_v1',
  ALTERNATION_PREF: 'inturno_alternation_pref_v1',
};

export const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  startOfWeek: 1, // 1 = Lunedì, 0 = Domenica
  countMode: 'days', // 'days' | 'hours'
  showWeekendHighlight: true,
  showHolidaysBadge: true,
  autoAdvanceBrush: false,
};

export function loadStoredData() {
  try {
    const savedShifts = localStorage.getItem(STORAGE_KEYS.SHIFTS_CONFIG);
    const savedModifiers = localStorage.getItem(STORAGE_KEYS.MODIFIERS_CONFIG);
    const savedSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    return {
      shifts: savedShifts ? JSON.parse(savedShifts) : DEFAULT_SHIFTS,
      modifiers: savedModifiers ? JSON.parse(savedModifiers) : DEFAULT_MODIFIERS,
      schedule: savedSchedule ? JSON.parse(savedSchedule) : {},
      settings: savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS,
    };
  } catch (err) {
    console.error('Error loading data from localStorage', err);
    return {
      shifts: DEFAULT_SHIFTS,
      modifiers: DEFAULT_MODIFIERS,
      schedule: {},
      settings: DEFAULT_SETTINGS,
    };
  }
}

export function saveSchedule(schedule) {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  } catch (err) {
    console.error('Error saving schedule', err);
  }
}

export function saveShiftsConfig(shifts) {
  try {
    localStorage.setItem(STORAGE_KEYS.SHIFTS_CONFIG, JSON.stringify(shifts));
  } catch (err) {
    console.error('Error saving shifts config', err);
  }
}

export function saveModifiersConfig(modifiers) {
  try {
    localStorage.setItem(STORAGE_KEYS.MODIFIERS_CONFIG, JSON.stringify(modifiers));
  } catch (err) {
    console.error('Error saving modifiers config', err);
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings', err);
  }
}

export function exportBackupJSON(shifts, modifiers, schedule, settings) {
  const data = {
    app: 'inTurno',
    version: '1.03',
    exportDate: new Date().toISOString(),
    shifts,
    modifiers,
    schedule,
    settings
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const nowStr = new Date().toISOString().slice(0, 10);
  a.download = `inTurno_backup_${nowStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportScheduleCSV(schedule, shifts, year, month) {
  // Generate CSV for specific month or year
  let lines = ['Data,Giorno,Turno_Codice,Turno_Nome,Orario_Inizio,Orario_Fine,Straordinari_Modificatori,Note'];
  
  const sortedDates = Object.keys(schedule).sort();
  const shiftMap = new Map(shifts.map(s => [s.code, s]));

  sortedDates.forEach(dateStr => {
    if (year && !dateStr.startsWith(`${year}`)) return;
    if (month && !dateStr.startsWith(`${year}-${String(month).padStart(2, '0')}`)) return;

    const entry = schedule[dateStr];
    if (!entry) return;

    const shiftObj = shiftMap.get(entry.shiftCode) || {};
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = d.toLocaleDateString('it-IT', { weekday: 'long' });
    
    const mods = (entry.modifiers || []).join('; ');
    const note = (entry.note || '').replace(/"/g, '""');

    lines.push(`"${dateStr}","${dayName}","${entry.shiftCode || ''}","${shiftObj.name || ''}","${entry.customStartTime || shiftObj.startTime || ''}","${entry.customEndTime || shiftObj.endTime || ''}","${mods}","${note}"`);
  });

  const csvContent = "\uFEFF" + lines.join('\n'); // Add BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inTurno_export_${year || 'tutti'}${month ? '_' + month : ''}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
