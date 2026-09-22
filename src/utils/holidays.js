// Calcolo festività italiane e Pasqua / Pasquetta con algoritmo di Gauss

function getEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getItalianHolidays(year) {
  const holidays = {};

  const fixed = [
    { month: 0, day: 1, name: "Capodanno" },
    { month: 0, day: 6, name: "Epifania" },
    { month: 3, day: 25, name: "Festa della Liberazione" },
    { month: 4, day: 1, name: "Festa del Lavoro" },
    { month: 5, day: 2, name: "Festa della Repubblica" },
    { month: 7, day: 15, name: "Ferragosto" },
    { month: 10, day: 1, name: "Tutti i Santi" },
    { month: 11, day: 8, name: "Immacolata Concezione" },
    { month: 11, day: 25, name: "Natale" },
    { month: 11, day: 26, name: "Santo Stefano" },
  ];

  fixed.forEach(h => {
    const key = `${year}-${String(h.month + 1).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
    holidays[key] = h.name;
  });

  const easter = getEaster(year);
  const easterKey = `${year}-${String(easter.getMonth() + 1).padStart(2, '0')}-${String(easter.getDate()).padStart(2, '0')}`;
  holidays[easterKey] = "Pasqua";

  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  const easterMondayKey = `${year}-${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`;
  holidays[easterMondayKey] = "Lunedì dell'Angelo (Pasquetta)";

  return holidays;
}

export function isItalianHoliday(dateStr) {
  // dateStr is in YYYY-MM-DD format
  if (!dateStr) return null;
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getItalianHolidays(year);
  return holidays[dateStr] || null;
}
