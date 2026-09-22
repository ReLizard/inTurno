// Generatore standard iCalendar (.ics) per inTurno

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

export function generateICS(schedule, shifts, startDateStr, endDateStr) {
  const shiftMap = new Map(shifts.map(s => [s.code, s]));
  const events = [];

  const sortedDates = Object.keys(schedule).sort();

  sortedDates.forEach(dateStr => {
    if (startDateStr && dateStr < startDateStr) return;
    if (endDateStr && dateStr > endDateStr) return;

    const entry = schedule[dateStr];
    if (!entry || !entry.shiftCode || entry.shiftCode === 'R') return; // Skip rest days in calendar export unless desired

    const shift = shiftMap.get(entry.shiftCode);
    const summary = `${entry.shiftCode} - ${shift ? shift.name : 'Turno'}`;
    
    const startTime = entry.customStartTime || (shift ? shift.startTime : '');
    const endTime = entry.customEndTime || (shift ? shift.endTime : '');

    let dtStart = '';
    let dtEnd = '';

    if (startTime && endTime) {
      dtStart = `DTSTART;TZID=Europe/Rome:${formatICSDate(dateStr, startTime)}`;
      // Handle night shift ending next day
      if (endTime < startTime) {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        const nextDayStr = d.toISOString().slice(0, 10);
        dtEnd = `DTEND;TZID=Europe/Rome:${formatICSDate(nextDayStr, endTime)}`;
      } else {
        dtEnd = `DTEND;TZID=Europe/Rome:${formatICSDate(dateStr, endTime)}`;
      }
    } else {
      // All-day event
      dtStart = `DTSTART;${formatICSDate(dateStr, '')}`;
      dtEnd = `DTEND;${formatICSDate(dateStr, '')}`;
    }

    const descriptionParts = [];
    if (entry.modifiers && entry.modifiers.length > 0) {
      descriptionParts.push(`Modificatori: ${entry.modifiers.join(', ')}`);
    }
    if (entry.note) {
      descriptionParts.push(`Note: ${entry.note}`);
    }
    const description = descriptionParts.join('\\n');

    events.push([
      'BEGIN:VEVENT',
      `UID:inturno-${dateStr}-${entry.shiftCode}@inturno.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      dtStart,
      dtEnd,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT'
    ].filter(Boolean).join('\r\n'));
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//inTurno//Organizza il Lavoro//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:inTurno Turni',
    'X-WR-TIMEZONE:Europe/Rome',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

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
