import { format, eachDayOfInterval, parseISO, isWeekend } from 'date-fns';
import { it } from 'date-fns/locale';
import { CATEGORIES } from '../constants/defaults';
import { isItalianHoliday } from './holidays';
import { createICSFile } from './icsExport';

// Helper per formattare il testo WhatsApp
export function generateWhatsAppText(schedule, shifts, startDate, endDate) {
  const shiftMap = new Map((shifts || []).map(s => [s.code, s]));
  const safeSchedule = schedule || {};

  let s = startDate instanceof Date ? startDate : new Date(startDate);
  let e = endDate instanceof Date ? endDate : new Date(endDate);
  if (s > e) {
    const tmp = s;
    s = e;
    e = tmp;
  }

  const days = eachDayOfInterval({ start: s, end: e });

  const startFormatted = format(s, 'd MMM', { locale: it });
  const endFormatted = format(e, 'd MMM yyyy', { locale: it });

  let text = `🗓️ *I miei turni (${startFormatted} - ${endFormatted})*\n\n`;

  let totalHours = 0;
  let workCount = 0;

  days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayLabel = format(day, 'EEE d', { locale: it });
    // Capitalize first letter (es. "Lun 22")
    const formattedDayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    
    const entry = safeSchedule[dateStr];
    const holidayName = isItalianHoliday(dateStr);

    if (!entry || !entry.shiftCode) {
      text += `• *${formattedDayLabel}*: _Libero / Non impostato_`;
      if (holidayName) text += ` (🎉 ${holidayName})`;
      text += `\n`;
      return;
    }

    const shift = shiftMap.get(entry.shiftCode);
    const code = entry.shiftCode;
    const name = shift ? shift.name : code;
    const startTime = entry.customStartTime || shift?.startTime || '';
    const endTime = entry.customEndTime || shift?.endTime || '';
    const isRest = shift?.category === CATEGORIES.REST || code === 'R';

    if (isRest) {
      text += `• *${formattedDayLabel}*: ☕ *Riposo*`;
    } else {
      workCount++;
      totalHours += shift?.hours || 8;
      text += `• *${formattedDayLabel}*: *${code}* - ${name}`;
      if (startTime && endTime) {
        text += ` (${startTime} - ${endTime})`;
      }
    }

    if (entry.modifiers && entry.modifiers.length > 0) {
      text += ` [${entry.modifiers.join(', ')}]`;
    }

    if (entry.note) {
      text += ` _(${entry.note})_`;
    }

    if (holidayName) {
      text += ` 🎉`;
    }

    text += `\n`;
  });

  text += `\n⏱️ *Totale:* ${workCount} turni (~${totalHours} ore)\n`;
  text += `📱 _Condiviso con inTurno_`;

  return text;
}

// Invia direttamente a WhatsApp
export function openWhatsApp(text) {
  const encoded = encodeURIComponent(text);
  // Usa api.whatsapp.com che su smartphone apre l'app nativa e su desktop WhatsApp Web
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank');
}

// Apertura diretta nel Calendario del Telefono (Android/iOS)
export async function openInCalendarApp(schedule, shifts, startStr, endStr) {
  const calendarName = 'inTurno - I miei Turni';
  const fileName = startStr ? `inTurno_calendario_${startStr}.ics` : 'inTurno_calendario_completo.ics';

  // 1. Prova Web Share API per prendere il file direttamente in memoria e chiedere con quale app aprirlo (Android / iPhone)
  if (typeof navigator !== 'undefined' && navigator.share) {
    const file = createICSFile(schedule, shifts, startStr, endStr, calendarName, 'text/calendar');
    let canShare = false;

    try {
      canShare = Boolean(navigator.canShare && navigator.canShare({ files: [file] }));
    } catch (e) {
      canShare = false;
    }

    if (canShare) {
      try {
        await navigator.share({
          title: 'inTurno - I Miei Turni',
          files: [file]
        });
        return { success: true, method: 'share-sheet' };
      } catch (err) {
        if (err.name === 'AbortError') {
          // L'utente ha annullato la scelta
          return { success: false, aborted: true };
        }
        console.warn('Share calendar failed, continuing fallback', err);
      }
    }
  }

  // 2. Su iOS Safari: navigare direttamente al blob apre subito l'app Calendario Apple in memoria
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    const icsFile = createICSFile(schedule, shifts, startStr, endStr, calendarName, 'text/calendar');
    const url = URL.createObjectURL(icsFile);
    window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { success: true, method: 'ios-prompt' };
  }

  // 3. Fallback per Android (Chrome / Samsung Internet) e Desktop:
  // Scarica direttamente il file .ics senza popup intermedi.
  // Su smartphone Android questo genera la notifica/barra nativa con pulsante "Apri",
  // che aprendola avvia la scelta dell'app (Google Calendar / Calendario).
  const icsFile = createICSFile(schedule, shifts, startStr, endStr, calendarName, 'text/calendar');
  const url = URL.createObjectURL(icsFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return { success: true, method: 'download' };
}

// Download esplicito del solo file .ics
export function downloadICSFile(schedule, shifts, startStr, endStr) {
  const calendarName = 'inTurno - I miei Turni';
  const icsFile = createICSFile(schedule, shifts, startStr, endStr, calendarName);
  const url = URL.createObjectURL(icsFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = startStr && endStr ? `inTurno_${startStr}_${endStr}.ics` : 'inTurno_calendario_completo.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

// Generatore Immagine Grafica su Canvas (Restituisce Promise<{ blob, dataUrl }>)
export function renderScheduleCardToCanvas({
  schedule,
  shifts,
  startDate,
  endDate,
  theme = 'light',
  title = 'I Miei Turni di Lavoro'
}) {
  return new Promise((resolve, reject) => {
    try {
      const shiftMap = new Map((shifts || []).map(s => [s.code, s]));
      const safeSchedule = schedule || {};

      let s = startDate instanceof Date ? startDate : new Date(startDate);
      let e = endDate instanceof Date ? endDate : new Date(endDate);
      if (s > e) {
        const tmp = s;
        s = e;
        e = tmp;
      }

      const days = eachDayOfInterval({ start: s, end: e });

      // Dimensioni per una visualizzazione perfetta (1080px ideale per smartphone, Instagram, WhatsApp)
      const width = 1080;
      const padding = 50;
      const headerHeight = 220;
      const rowHeight = 96;
      const footerHeight = 150;
      const height = headerHeight + (days.length * rowHeight) + footerHeight;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D non disponibile');
      }

      const isLight = theme === 'light';

      // 1. Sfondo generale (richiama il tema pastel green o dark)
      ctx.fillStyle = isLight ? '#eef7f2' : '#0b0f17';
      ctx.fillRect(0, 0, width, height);

      // Scheda principale contenitore
      const cardX = padding;
      const cardY = padding;
      const cardW = width - (padding * 2);
      const cardH = height - (padding * 2);

      // Disegna card arrotondata
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36);
      ctx.fillStyle = isLight ? '#ffffff' : '#141a23';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isLight ? '#d5e9dc' : '#222b38';
      ctx.stroke();

      // 2. Intestazione Scheda
      // Brand pill
      const brandX = cardX + 45;
      const brandY = cardY + 45;
      drawRoundedRect(ctx, brandX, brandY, 130, 44, 14);
      ctx.fillStyle = isLight ? '#059669' : '#eab308';
      ctx.fill();
      ctx.fillStyle = isLight ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('inTurno', brandX + 65, brandY + 22);

      // Titolo
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
      ctx.font = '900 44px system-ui, -apple-system, sans-serif';
      ctx.fillText(title, brandX + 155, brandY + 36);

      // Intervallo date
      const startStr = format(s, 'd MMMM', { locale: it });
      const endStr = format(e, 'd MMMM yyyy', { locale: it });
      ctx.fillStyle = isLight ? '#059669' : '#facc15';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${startStr} - ${endStr}`, brandX, brandY + 88);

      // Linea divisoria header
      const sepY = cardY + 160;
      ctx.beginPath();
      ctx.moveTo(cardX + 40, sepY);
      ctx.lineTo(cardX + cardW - 40, sepY);
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Righe dei Giorni
      let currentY = sepY + 20;
      let workedDaysCount = 0;
      let totalEstHours = 0;

      days.forEach((day, idx) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayName = format(day, 'EEEE d MMMM', { locale: it });
        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        const isWeekendDay = isWeekend(day);
        const holidayName = isItalianHoliday(dateStr);

        const entry = safeSchedule[dateStr];
        const shift = entry?.shiftCode ? shiftMap.get(entry.shiftCode) : null;
        const isRest = shift?.category === CATEGORIES.REST || entry?.shiftCode === 'R';

        // Sfondo alternato per riga
        const rowBoxY = currentY;
        const rowBoxH = rowHeight - 12;
        if (idx % 2 === 1) {
          drawRoundedRect(ctx, cardX + 25, rowBoxY, cardW - 50, rowBoxH, 16);
          ctx.fillStyle = isLight ? '#f8fafc' : '#19212d';
          ctx.fill();
        }

        // Evidenziazione festività
        if (holidayName) {
          drawRoundedRect(ctx, cardX + 25, rowBoxY, cardW - 50, rowBoxH, 16);
          ctx.fillStyle = isLight ? '#fff1f2' : '#2c1218';
          ctx.fill();
          ctx.strokeStyle = isLight ? '#fecdd3' : '#881337';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Data e Giorno (colonna sinistra)
        ctx.textAlign = 'left';
        ctx.font = isWeekendDay || holidayName ? 'bold 28px system-ui, sans-serif' : '600 28px system-ui, sans-serif';
        if (holidayName) {
          ctx.fillStyle = isLight ? '#e11d48' : '#fb7185';
        } else if (isWeekendDay) {
          ctx.fillStyle = isLight ? '#047857' : '#f59e0b';
        } else {
          ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
        }
        ctx.fillText(capitalizedDayName, cardX + 50, currentY + 52);

        // Badge Turno (colonna destra)
        const badgeW = 95;
        const badgeH = 52;
        const badgeX = cardX + cardW - 460;
        const badgeY = currentY + 16;

        if (entry?.shiftCode) {
          const badgeColor = shift?.color || (isRest ? '#64748b' : '#3b82f6');
          const badgeTextColor = shift?.textColor || '#ffffff';

          drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 14);
          ctx.fillStyle = badgeColor;
          ctx.fill();

          ctx.fillStyle = badgeTextColor;
          ctx.font = '900 24px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(entry.shiftCode, badgeX + (badgeW / 2), badgeY + (badgeH / 2));

          // Orari e dettagli
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.font = 'bold 24px system-ui, sans-serif';
          ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
          const shiftName = shift?.name || entry.shiftCode;
          ctx.fillText(shiftName, badgeX + badgeW + 24, currentY + 40);

          const startTime = entry.customStartTime || shift?.startTime;
          const endTime = entry.customEndTime || shift?.endTime;
          if (startTime && endTime) {
            ctx.font = '600 20px monospace, monospace';
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.fillText(`${startTime} - ${endTime}`, badgeX + badgeW + 24, currentY + 68);
          } else if (isRest) {
            ctx.font = 'italic 20px system-ui, sans-serif';
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.fillText('Giornata di riposo', badgeX + badgeW + 24, currentY + 68);
          }

          if (!isRest) {
            workedDaysCount++;
            totalEstHours += shift?.hours || 8;
          }
        } else {
          // Giorno vuoto
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.font = 'italic 22px system-ui, sans-serif';
          ctx.fillStyle = isLight ? '#94a3b8' : '#64748b';
          ctx.fillText('Libero / Nessun turno', badgeX, currentY + 50);
        }

        currentY += rowHeight;
      });

      // 4. Footer con Statistiche
      const footerY = currentY + 15;
      ctx.beginPath();
      ctx.moveTo(cardX + 40, footerY);
      ctx.lineTo(cardX + cardW - 40, footerY);
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText(`Totale: ${workedDaysCount} giorni lavorati (~${totalEstHours} ore stimate)`, cardX + 50, footerY + 45);

      ctx.textAlign = 'right';
      ctx.fillStyle = isLight ? '#059669' : '#eab308';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('Creato con inTurno PWA', cardX + cardW - 50, footerY + 45);

      // Generazione sincrona e garantita del DataURL e Blob
      const dataUrl = canvas.toDataURL('image/png');
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      resolve({ blob, dataUrl });
    } catch (err) {
      console.error('Errore creazione canvas:', err);
      reject(err);
    }
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Condivisione mobile libera tramite Web Share API con fallback a download
export async function shareOrDownloadFile(file, downloadName) {
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'inTurno - I Miei Turni'
        });
        return { success: true, method: 'share' };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      console.warn('Share error, fallback to download', err);
    }
  }

  // Fallback download
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadName || file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { success: true, method: 'download' };
}
