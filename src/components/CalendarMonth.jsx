import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  isWeekend
} from 'date-fns';
import { it } from 'date-fns/locale';
import { isItalianHoliday } from '../utils/holidays';
import { Sparkles, Plus, Edit2, MessageSquare, Clock, Zap } from 'lucide-react';

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

  const shiftMap = new Map(shifts.map(s => [s.code, s]));
  const shiftByIdMap = new Map(shifts.map(s => [s.id, s]));
  const activeBrushShift = selectedShiftId === '__ERASER__' 
    ? { code: 'GOMMA', name: 'Cancella' } 
    : shiftByIdMap.get(selectedShiftId);

  const weekDayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const shortWeekDayLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-4">
      {/* Calendar Card */}
      <div className="bg-slate-900/90 dark:bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        
        {/* Weekdays Header */}
        <div className="grid grid-cols-[38px_repeat(7,1fr)] sm:grid-cols-[54px_repeat(7,1fr)] bg-slate-800/80 border-b border-slate-700/80 text-center font-bold text-xs sm:text-sm text-slate-300 py-2.5">
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider flex items-center justify-center font-semibold" title="Azioni Rapide Settimana">
            Sett.
          </div>
          {shortWeekDayLabels.map((dayLabel, idx) => {
            const isSatSun = idx >= 5;
            return (
              <div 
                key={dayLabel} 
                className={`flex flex-col items-center justify-center ${isSatSun ? 'text-amber-400 font-extrabold' : 'text-slate-200'}`}
              >
                <span className="hidden sm:inline">{weekDayLabels[idx]}</span>
                <span className="sm:hidden">{dayLabel}</span>
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
                className="grid grid-cols-[38px_repeat(7,1fr)] sm:grid-cols-[54px_repeat(7,1fr)] divide-x divide-slate-800/40 min-h-[95px] sm:min-h-[125px]"
              >
                {/* Quick Week Action Button Sidebar */}
                <div className="bg-slate-950/40 flex flex-col items-center justify-center p-1 gap-1.5 group select-none">
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400">
                    W{weekNumber}
                  </span>
                  
                  {/* Quick Fill Lun-Ven with active brush shift */}
                  <button
                    onClick={() => onFillWeekDays(week)}
                    title={`Riempi Lun-Ven con turno ${activeBrushShift?.code || 'selezionato'}`}
                    className="p-1 sm:p-1.5 rounded-lg bg-slate-800/80 hover:bg-yellow-400 hover:text-slate-950 text-slate-400 transition-all active:scale-95 border border-slate-700/50 shadow-sm"
                  >
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    onClick={() => onFillWeekFull(week)}
                    title="Riempi Lun-Sab o imposta schema completo"
                    className="hidden sm:flex p-1 rounded-md text-[9px] font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    6gg
                  </button>
                </div>

                {/* 7 Days in Week */}
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
                      className={`relative p-1 sm:p-2 flex flex-col justify-between transition-all cursor-pointer select-none group min-h-[95px] sm:min-h-[125px] ${
                        !isCurrentMonth 
                          ? 'bg-slate-950/60 opacity-35 hover:opacity-70' 
                          : isWeekendDay 
                            ? 'bg-slate-900/40 hover:bg-slate-800/60' 
                            : 'bg-slate-900/70 hover:bg-slate-800/80'
                      } ${
                        isDayToday 
                          ? 'ring-2 ring-yellow-400 ring-inset bg-yellow-400/5' 
                          : ''
                      } ${
                        holidayName 
                          ? 'border-t-2 border-t-rose-500' 
                          : ''
                      }`}
                    >
                      {/* Top Header: Day Number + Holiday / Badges */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <span 
                            className={`inline-flex items-center justify-center font-bold text-xs sm:text-sm rounded-lg transition-transform group-hover:scale-105 ${
                              isDayToday
                                ? 'bg-yellow-400 text-slate-950 px-1.5 py-0.5 shadow font-extrabold'
                                : holidayName
                                  ? 'text-rose-400 font-extrabold'
                                  : isWeekendDay
                                    ? 'text-amber-300 font-semibold'
                                    : 'text-slate-200'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                        </div>

                        {/* Holiday Tag */}
                        {holidayName && (
                          <span 
                            className="text-[9px] sm:text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-1 rounded truncate max-w-[55px] sm:max-w-[75px]" 
                            title={holidayName}
                          >
                            {holidayName}
                          </span>
                        )}

                        {/* Edit details hover button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDayLongPress(day, dateStr);
                          }}
                          title="Modifica dettagli giorno"
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-opacity hidden sm:block"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Middle: Shift Badge */}
                      <div className="my-1 flex-1 flex flex-col justify-center">
                        {shift ? (
                          <div
                            style={{
                              backgroundColor: shift.color,
                              color: shift.textColor || '#ffffff',
                            }}
                            className="rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 text-center shadow-md font-extrabold flex flex-col items-center justify-center transition-transform group-hover:scale-102"
                          >
                            <span className="text-sm sm:text-base leading-none tracking-tight">
                              {shift.code}
                            </span>
                            
                            {/* Time preview if available */}
                            {(entry?.customStartTime || shift.startTime) && (
                              <span className="text-[9px] sm:text-[10px] opacity-90 font-mono font-medium hidden sm:block mt-0.5">
                                {entry?.customStartTime || shift.startTime}
                                {entry?.customEndTime || shift.endTime ? ` - ${entry?.customEndTime || shift.endTime}` : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-6 sm:h-8 flex items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl group-hover:border-slate-700 group-hover:text-slate-500">
                            <span className="text-[10px] hidden group-hover:inline font-medium">+ Turno</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Modifiers Chips & Note indicator */}
                      <div className="flex flex-wrap items-center gap-1 min-h-[16px]">
                        {/* Modifiers (Overtime, Early exit, etc.) */}
                        {entry?.modifiers && entry.modifiers.map((modLabel, idx) => (
                          <span
                            key={idx}
                            className={`text-[8px] sm:text-[9px] font-extrabold px-1 py-0.2 rounded-md shadow-xs ${
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

                        {/* Note Indicator */}
                        {entry?.note && (
                          <span 
                            title={entry.note} 
                            className="inline-flex items-center text-yellow-400 text-[10px] hover:scale-110 transition-transform"
                          >
                            <MessageSquare className="w-3 h-3 fill-yellow-400/20" />
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
    </div>
  );
}
