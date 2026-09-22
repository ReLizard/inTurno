import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  isWeekend
} from 'date-fns';
import { it } from 'date-fns/locale';
import { isItalianHoliday } from '../utils/holidays';
import { Edit2, MessageSquare, Zap, PartyPopper } from 'lucide-react';

export default function CalendarMonth({
  currentDate,
  schedule,
  shifts,
  modifiersList,
  brushMode,
  selectedShiftId,
  onDayClick,
  onDayLongPress,
  onFillWeekDays,
  onFillWeekFull,
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunedì
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Group days by weeks (chunks of 7)
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Extract all holidays falling in this active month
  const currentMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthHolidays = [];
  currentMonthDays.forEach(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    const hName = isItalianHoliday(dStr);
    if (hName) {
      monthHolidays.push({
        date: d,
        dateStr: dStr,
        dayNumber: format(d, 'd'),
        name: hName
      });
    }
  });

  const shiftMap = new Map(shifts.map(s => [s.code, s]));
  const shiftByIdMap = new Map(shifts.map(s => [s.id, s]));
  const activeBrushShift = selectedShiftId === '__ERASER__' 
    ? { code: 'GOMMA', name: 'Cancella' } 
    : shiftByIdMap.get(selectedShiftId);

  const weekDayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const shortWeekDayLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-6 py-3 sm:py-4">
      {/* Calendar Card */}
      <div className="bg-slate-900/90 dark:bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        
        {/* Weekdays Header: Colonne con larghezza rigidamente uniforme tramite minmax(0, 1fr) */}
        <div className="grid grid-cols-[28px_repeat(7,minmax(0,1fr))] sm:grid-cols-[46px_repeat(7,minmax(0,1fr))] bg-slate-800/80 border-b border-slate-700/80 text-center font-bold text-xs sm:text-sm text-slate-300 py-2 sm:py-2.5">
          <div className="text-[9px] sm:text-xs text-slate-400 uppercase tracking-wider flex items-center justify-center font-semibold" title="Azioni Rapide Settimana">
            #
          </div>
          {shortWeekDayLabels.map((dayLabel, idx) => {
            const isSatSun = idx >= 5;
            return (
              <div 
                key={dayLabel} 
                className={`flex flex-col items-center justify-center min-w-0 overflow-hidden px-0.5 ${
                  isSatSun ? 'text-amber-400 font-extrabold' : 'text-slate-200'
                }`}
              >
                <span className="hidden sm:inline truncate">{weekDayLabels[idx]}</span>
                <span className="sm:hidden truncate text-[11px]">{dayLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Calendar Grid by Weeks */}
        <div className="divide-y divide-slate-800/60">
          {weeks.map((week, weekIdx) => {
            const weekNumber = format(week[0], 'w', { locale: it });

            return (
              <div 
                key={weekIdx} 
                className="grid grid-cols-[28px_repeat(7,minmax(0,1fr))] sm:grid-cols-[46px_repeat(7,minmax(0,1fr))] divide-x divide-slate-800/40 min-h-[86px] sm:min-h-[118px]"
              >
                {/* Quick Week Action Button Sidebar */}
                <div className="bg-slate-950/40 flex flex-col items-center justify-center p-0.5 sm:p-1 gap-1 group select-none min-w-0 overflow-hidden">
                  <span className="text-[9px] sm:text-xs font-mono font-bold text-slate-400 truncate">
                    {weekNumber}
                  </span>
                  
                  {/* Quick Fill Lun-Ven */}
                  <button
                    onClick={() => onFillWeekDays(week)}
                    title={`Riempi Lun-Ven ${activeBrushShift ? `con turno ${activeBrushShift.code}` : ''}`}
                    className="p-1 rounded-lg bg-slate-800/80 hover:bg-yellow-400 hover:text-slate-950 text-slate-400 transition-all active:scale-95 border border-slate-700/50 shadow-sm"
                  >
                    <Zap className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    onClick={() => onFillWeekFull(week)}
                    title="Riempi Lun-Sab"
                    className="hidden sm:flex p-0.5 rounded text-[8px] font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    6g
                  </button>
                </div>

                {/* 7 Days in Week: Ciascuna cella ha min-w-0 e overflow-hidden per garantire proporzioni perfette */}
                {week.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);
                  const holidayName = isItalianHoliday(dateStr);
                  const entry = schedule[dateStr];
                  const shift = entry?.shiftCode ? shiftMap.get(entry.shiftCode) : null;
                  const isWeekendDay = isWeekend(day);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => onDayClick(day, dateStr)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onDayLongPress(day, dateStr);
                      }}
                      className={`relative p-1 sm:p-2 flex flex-col justify-between transition-all cursor-pointer select-none group min-h-[86px] sm:min-h-[118px] min-w-0 max-w-full overflow-hidden ${
                        !isCurrentMonth 
                          ? 'bg-slate-950/60 opacity-30 hover:opacity-60' 
                          : isWeekendDay 
                            ? 'bg-slate-900/40 hover:bg-slate-800/60' 
                            : 'bg-slate-900/70 hover:bg-slate-800/80'
                      } ${
                        isDayToday 
                          ? 'ring-2 ring-yellow-400 ring-inset bg-yellow-400/5' 
                          : ''
                      } ${
                        holidayName 
                          ? 'border-t-2 border-t-rose-500 bg-rose-500/[0.03]' 
                          : ''
                      }`}
                    >
                      {/* Top Header: Giorno + Festività (antispaginamento) */}
                      <div className="flex items-center justify-between gap-0.5 min-w-0 overflow-hidden leading-none">
                        <span 
                          className={`inline-flex items-center justify-center font-bold text-xs sm:text-sm rounded transition-transform group-hover:scale-105 shrink-0 ${
                            isDayToday
                              ? 'bg-yellow-400 text-slate-950 px-1 py-0.5 shadow font-extrabold rounded-md'
                              : holidayName
                                ? 'text-rose-400 font-black'
                                : isWeekendDay
                                  ? 'text-amber-300 font-bold'
                                  : 'text-slate-200'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>

                        {/* Indicatore Festività: Pallino compatto su mobile, etichetta tronca su desktop */}
                        {holidayName && (
                          <div className="flex items-center shrink-0 min-w-0" title={`Festività: ${holidayName}`}>
                            {/* Mobile dot */}
                            <span className="sm:hidden w-2 h-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500/80 shrink-0" />
                            
                            {/* Desktop pill */}
                            <span className="hidden sm:inline-block text-[9px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-1 py-0.5 rounded truncate max-w-[55px] md:max-w-[70px]">
                              {holidayName}
                            </span>
                          </div>
                        )}

                        {/* Edit details hover button (desktop only) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDayLongPress(day, dateStr);
                          }}
                          title="Modifica dettagli giorno"
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-opacity hidden sm:block shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Middle: Shift Badge */}
                      <div className="my-0.5 sm:my-1 flex-1 flex flex-col justify-center min-w-0 max-w-full overflow-hidden">
                        {shift ? (
                          <div
                            style={{
                              backgroundColor: shift.color,
                              color: shift.textColor || '#ffffff',
                            }}
                            className="rounded-lg sm:rounded-xl px-1 sm:px-2 py-0.5 sm:py-1.5 text-center shadow font-black flex flex-col items-center justify-center transition-transform group-hover:scale-102 min-w-0 max-w-full overflow-hidden"
                          >
                            <span className="text-xs sm:text-base leading-tight tracking-tight truncate max-w-full">
                              {shift.code}
                            </span>
                            
                            {/* Time preview if available (solo schermi medi/grandi) */}
                            {(entry?.customStartTime || shift.startTime) && (
                              <span className="text-[9px] opacity-90 font-mono font-medium hidden sm:block mt-0.5 truncate max-w-full">
                                {entry?.customStartTime || shift.startTime}
                                {entry?.customEndTime || shift.endTime ? ` - ${entry?.customEndTime || shift.endTime}` : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-5 sm:h-7 flex items-center justify-center text-slate-600/70 border border-dashed border-slate-800/70 rounded-lg group-hover:border-slate-700 group-hover:text-slate-500">
                            <span className="text-[9px] hidden sm:group-hover:inline font-medium text-slate-500">+</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Modifiers Chips & Note indicator */}
                      <div className="flex items-center justify-between gap-0.5 min-h-[14px] sm:min-h-[16px] min-w-0 max-w-full overflow-hidden">
                        <div className="flex items-center gap-0.5 min-w-0 max-w-full overflow-hidden">
                          {entry?.modifiers && entry.modifiers.slice(0, 2).map((modLabel, idx) => (
                            <span
                              key={idx}
                              className={`text-[7px] sm:text-[9px] font-extrabold px-1 py-0.2 rounded truncate max-w-[32px] sm:max-w-none shrink-0 ${
                                modLabel.startsWith('+')
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : modLabel.startsWith('-')
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}
                            >
                              {modLabel}
                            </span>
                          ))}
                          {entry?.modifiers && entry.modifiers.length > 2 && (
                            <span className="text-[7px] text-slate-400 font-bold shrink-0">
                              +{entry.modifiers.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Note Indicator */}
                        {entry?.note && (
                          <span 
                            title={entry.note} 
                            className="inline-flex items-center text-yellow-400 text-[9px] sm:text-[10px] shrink-0"
                          >
                            <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400/20" />
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

      </div>

      {/* Barra Informativa Festività del Mese (Sempre leggibile e cliccabile senza spaginare la griglia) */}
      {monthHolidays.length > 0 && (
        <div className="mt-2.5 sm:mt-3 px-3 py-2 bg-slate-900/70 border border-slate-800/80 rounded-xl sm:rounded-2xl flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 shadow-sm backdrop-blur-sm">
          <span className="text-rose-400 font-bold flex items-center gap-1.5 shrink-0">
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Festività di questo mese:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {monthHolidays.map((h, i) => (
              <button
                key={i}
                onClick={() => onDayClick(h.date, h.dateStr)}
                className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white font-medium flex items-center gap-1.5 transition-all active:scale-95"
                title={`Tocca per aprire ${h.name}`}
              >
                <span className="font-extrabold text-white bg-rose-500/40 px-1 rounded text-[10px]">
                  {h.dayNumber}
                </span>
                <span>{h.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
