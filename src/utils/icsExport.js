// Generatore standard iCalendar (.ics) RFC 5545 per inTurno

function getNextDayStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextDate = new Date(y, m - 1, d + 1);
  const ny = nextDate.getFullYear();
  const nm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nd = String(nextDate.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function computeEndTime(startTime, hours = 8) {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + Math.round(hours * 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function formatICSDate(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD
  // timeStr: HH:mm
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    return `VALUE=DATE:${cleanDate}`;
  }
  const cleanTime = timeStr.replace(/:/g, '') + '00';
  return `${cleanDate}T${cleanTime}`;
}

export function buildICSContent(schedule, shifts, startDateStr, endDateStr, calendarName = 'inTurno - I miei Turni') {
  const shiftMap = new Map((shifts || []).map(s => [s.code, s]));
  const events = [];

  const sortedDates = Object.keys(schedule || {}).sort();

  sortedDates.forEach(dateStr => {
    if (startDateStr && dateStr < startDateStr) return;
    if (endDateStr && dateStr > endDateStr) return;

    const entry = schedule[dateStr];
    if (!entry || !entry.shiftCode || entry.shiftCode === 'R') return; // Skip rest days in calendar export

    const shift = shiftMap.get(entry.shiftCode);
    
    // Titolo evento: SOLO il nome completo del turno (senza sigla breve)
    const shiftFullName = shift?.name?.trim() || entry.shiftCode;
    const summary = shiftFullName;
    
    let startTime = entry.customStartTime || shift?.startTime || '';
    let endTime = entry.customEndTime || shift?.endTime || '';

    // Se è specificato solo l'orario di inizio, calcola l'orario di fine in base alle ore del turno
    if (startTime && !endTime) {
      endTime = computeEndTime(startTime, shift?.hours || 8);
    }

    let dtStart = '';
    let dtEnd = '';

    if (startTime && endTime) {
      const cleanStartTime = startTime.replace(/:/g, '') + '00';
      const cleanEndTime = endTime.replace(/:/g, '') + '00';
      const cleanStartDate = dateStr.replace(/-/g, '');

      dtStart = `DTSTART;TZID=Europe/Rome:${cleanStartDate}T${cleanStartTime}`;

      // Gestione turno notturno che si conclude il giorno successivo
      if (endTime <= startTime) {
        const nextDayStr = getNextDayStr(dateStr);
        const cleanNextDate = nextDayStr.replace(/-/g, '');
        dtEnd = `DTEND;TZID=Europe/Rome:${cleanNextDate}T${cleanEndTime}`;
      } else {
        dtEnd = `DTEND;TZID=Europe/Rome:${cleanStartDate}T${cleanEndTime}`;
      }
    } else {
      // Evento per l'intera giornata (es. Ferie/Permessi senza orario)
      // Nello standard iCalendar RFC 5545, DTEND per un evento di un giorno intero è il giorno successivo (esclusivo)
      const cleanStartDate = dateStr.replace(/-/g, '');
      const nextDayStr = getNextDayStr(dateStr);
      const cleanNextDate = nextDayStr.replace(/-/g, '');
      dtStart = `DTSTART;${formatICSDate(dateStr, '')}`;
      dtEnd = `DTEND;VALUE=DATE:${cleanNextDate}`;
    }

    const descriptionParts = [];
    descriptionParts.push(`Turno: ${shiftFullName} (${entry.shiftCode})`);
    if (startTime && endTime) {
      descriptionParts.push(`Orario: ${startTime} - ${endTime}`);
    }
    if (entry.modifiers && entry.modifiers.length > 0) {
      descriptionParts.push(`Modificatori: ${entry.modifiers.join(', ')}`);
    }
    if (entry.note) {
      descriptionParts.push(`Note: ${entry.note}`);
    }
    const description = descriptionParts.join('\\n');

    events.push([
      'BEGIN:VEVENT',
      `UID:inturno-${dateStr}-${entry.shiftCode}-${Date.now()}@inturno.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      dtStart,
      dtEnd,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    ].filter(Boolean).join('\r\n'));
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//inTurno//Organizza il Lavoro//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:Europe/Rome',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Rome',
    'X-LIC-LOCATION:Europe/Rome',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

export function generateICS(schedule, shifts, startDateStr, endDateStr) {
  const icsContent = buildICSContent(schedule, shifts, startDateStr, endDateStr);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inTurno_calendario_${startDateStr || 'tutti'}_${endDateStr || ''}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function createICSFile(schedule, shifts, startDateStr, endDateStr, calendarName = 'inTurno - I miei Turni', mimeType = 'text/calendar') {
  const icsContent = buildICSContent(schedule, shifts, startDateStr, endDateStr, calendarName);
  const fileName = startDateStr ? `inTurno_calendario_${startDateStr}.ics` : 'inTurno_calendario_completo.ics';
  return new File([icsContent], fileName, { type: mimeType });
}
