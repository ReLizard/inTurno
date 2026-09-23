import { format, eachDayOfInterval, parseISO, isWeekend } from 'date-fns';
import { it } from 'date-fns/locale';
import { CATEGORIES } from '../constants/defaults';
import { isItalianHoliday } from './holidays';

// Helper per formattare il testo WhatsApp
export function generateWhatsAppText(schedule, shifts, startDate, endDate) {
  const shiftMap = new Map(shifts.map(s => [s.code, s]));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const startFormatted = format(startDate, 'd MMM', { locale: it });
  const endFormatted = format(endDate, 'd MMM yyyy', { locale: it });

  let text = `🗓️ *I miei turni (${startFormatted} - ${endFormatted})*\n\n`;

  let totalHours = 0;
  let workCount = 0;

  days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayLabel = format(day, 'EEE d', { locale: it });
    // Capitalize first letter (es. "Lun 22")
    const formattedDayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    
    const entry = schedule[dateStr];
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

// Generatore Immagine Grafica su Canvas (Restituisce un Blob PNG)
export function renderScheduleCardToCanvas({
  schedule,
  shifts,
  startDate,
  endDate,
  theme = 'light',
  title = 'I Miei Turni'
}) {
  return new Promise((resolve) => {
    const shiftMap = new Map(shifts.map(s => [s.code, s]));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Dimensioni per una visualizzazione perfetta (es. 1080 x auto, ideale per smartphone)
    const width = 1080;
    const padding = 60;
    const headerHeight = 220;
    const rowHeight = 95;
    const footerHeight = 160;
    const height = headerHeight + (days.length * rowHeight) + footerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const isLight = theme === 'light';

    // 1. Sfondo generale
    ctx.fillStyle = isLight ? '#eef7f2' : '#0b0f17';
    ctx.fillRect(0, 0, width, height);

    // Scheda principale contenitore
    const cardX = padding;
    const cardY = padding;
    const cardW = width - (padding * 2);
    const cardH = height - (padding * 2);

    // Disegna card arrotondata
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 40);
    ctx.fillStyle = isLight ? '#ffffff' : '#141a23';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isLight ? '#d5e9dc' : '#222b38';
    ctx.stroke();

    // 2. Intestazione Scheda
    // Brand pill
    const brandX = cardX + 50;
    const brandY = cardY + 50;
    drawRoundedRect(ctx, brandX, brandY, 130, 44, 16);
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
    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.fillText(title, brandX + 150, brandY + 36);

    // Intervallo date
    const startStr = format(startDate, 'd MMMM', { locale: it });
    const endStr = format(endDate, 'd MMMM yyyy', { locale: it });
    ctx.fillStyle = isLight ? '#059669' : '#facc15';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${startStr} - ${endStr}`, brandX, brandY + 85);

    // Linea divisoria header
    const sepY = cardY + 160;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, sepY);
    ctx.lineTo(cardX + cardW - 40, sepY);
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Righe dei Giorni
    let currentY = sepY + 25;
    let workedDaysCount = 0;
    let totalEstHours = 0;

    days.forEach((day, idx) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayName = format(day, 'EEEE d MMMM', { locale: it });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const isWeekendDay = isWeekend(day);
      const holidayName = isItalianHoliday(dateStr);

      const entry = schedule[dateStr];
      const shift = entry?.shiftCode ? shiftMap.get(entry.shiftCode) : null;
      const isRest = shift?.category === CATEGORIES.REST || entry?.shiftCode === 'R';

      // Sfondo alternato per riga
      const rowBoxY = currentY - 5;
      if (idx % 2 === 1) {
        drawRoundedRect(ctx, cardX + 30, rowBoxY, cardW - 60, rowHeight - 12, 18);
        ctx.fillStyle = isLight ? '#f8fafc' : '#19212d';
        ctx.fill();
      }

      // Evidenziazione festività o weekend
      if (holidayName) {
        drawRoundedRect(ctx, cardX + 30, rowBoxY, cardW - 60, rowHeight - 12, 18);
        ctx.fillStyle = isLight ? '#fff1f2' : '#2c1218';
        ctx.fill();
        ctx.strokeStyle = isLight ? '#fecdd3' : '#881337';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 1. Data e Giorno
      ctx.textAlign = 'left';
      ctx.font = isWeekendDay || holidayName ? 'bold 28px system-ui, sans-serif' : '600 28px system-ui, sans-serif';
      if (holidayName) {
        ctx.fillStyle = isLight ? '#e11d48' : '#fb7185';
      } else if (isWeekendDay) {
        ctx.fillStyle = isLight ? '#047857' : '#f59e0b';
      } else {
        ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
      }
      ctx.fillText(capitalizedDayName, cardX + 60, currentY + 45);

      // Badge Turno
      const badgeW = 90;
      const badgeH = 50;
      const badgeX = cardX + cardW - 480;
      const badgeY = currentY + 12;

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
        ctx.fillText(shiftName, badgeX + badgeW + 25, currentY + 36);

        const startTime = entry.customStartTime || shift?.startTime;
        const endTime = entry.customEndTime || shift?.endTime;
        if (startTime && endTime) {
          ctx.font = '500 20px monospace, monospace';
          ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
          ctx.fillText(`${startTime} - ${endTime}`, badgeX + badgeW + 25, currentY + 62);
        } else if (isRest) {
          ctx.font = 'italic 20px system-ui, sans-serif';
          ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
          ctx.fillText('Giornata di riposo', badgeX + badgeW + 25, currentY + 62);
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
        ctx.fillText('Libero / Nessun turno', badgeX, currentY + 45);
      }

      currentY += rowHeight;
    });

    // 4. Footer con Statistiche
    const footerY = currentY + 20;
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
    ctx.fillText(`Totale: ${workedDaysCount} giorni lavorati (~${totalEstHours} ore stimate)`, cardX + 60, footerY + 40);

    ctx.textAlign = 'right';
    ctx.fillStyle = isLight ? '#059669' : '#eab308';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Creato con inTurno PWA', cardX + cardW - 60, footerY + 40);

    canvas.toBlob((blob) => {
      resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
    }, 'image/png');
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
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'inTurno',
        text: 'I miei turni di lavoro da inTurno',
        files: [file]
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Share error, fallback to download', err);
      } else {
        return false;
      }
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
  URL.revokeObjectURL(url);
  return true;
}
