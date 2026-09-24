import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  ArrowRightLeft, 
  CalendarRange, 
  Layers
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, isWeekend } from 'date-fns';

export default function WeekPatternModal({
  isOpen,
  onClose,
  currentDate,
  shifts,
  schedule,
  onApplyPattern
}) {
  if (!isOpen) return null;

  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);

  const [patternType, setPatternType] = useState('alternating'); // 'alternating' | 'uniform'
  const [weekAShiftCode, setWeekAShiftCode] = useState('M1');
  const [weekBShiftCode, setWeekBShiftCode] = useState('P1');
  const [uniformShiftCode, setUniformShiftCode] = useState('M1');
  const [applyScope, setApplyScope] = useState('month'); // 'month' | 'selected_weeks'
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [autoWeekendRest, setWeekendRest] = useState(true);

  const handleApply = () => {
    const weeksInMonth = eachWeekOfInterval(
      { start: currentMonthStart, end: currentMonthEnd },
      { weekStartsOn: 1 }
    );

    const newSchedule = { ...schedule };

    weeksInMonth.forEach((weekStart, idx) => {
      // Monday to Sunday of this week
      const weekDays = eachDayOfInterval({
        start: weekStart,
        end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      });

      let targetShiftCode = '';
      if (patternType === 'alternating') {
        // Even index = Week A, Odd index = Week B
        targetShiftCode = idx % 2 === 0 ? weekAShiftCode : weekBShiftCode;
      } else {
        targetShiftCode = uniformShiftCode;
      }

      weekDays.forEach((day, dayIndex) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isSat = dayIndex === 5;
        const isSun = dayIndex === 6;

        if (isSat || isSun) {
          if (autoWeekendRest) {
            newSchedule[dateStr] = {
              ...(newSchedule[dateStr] || {}),
              shiftCode: 'R'
            };
          }
        } else {
          // Monday to Friday
          newSchedule[dateStr] = {
            ...(newSchedule[dateStr] || {}),
            shiftCode: targetShiftCode
          };
        }
      });
    });

    onApplyPattern(newSchedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Pianificazione Automatica
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Compila intere settimane o mesi con alternanza intelligente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto overflow-x-hidden space-y-4 min-w-0 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-700">
          
          {/* Pattern Type Choice */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Tipo di Schema
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPatternType('alternating')}
                className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition-all ${
                  patternType === 'alternating'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm dark:bg-yellow-400/10 dark:border-yellow-400 dark:text-yellow-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Alternanza A / B</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                  Sett. Mattina ↔ Sett. Pomeriggio
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPatternType('uniform')}
                className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition-all ${
                  patternType === 'uniform'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm dark:bg-yellow-400/10 dark:border-yellow-400 dark:text-yellow-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>Turno Uniforme</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                  Stesso turno per tutto il mese
                </span>
              </button>
            </div>
          </div>

          {/* Shift Selectors */}
          {patternType === 'alternating' ? (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                    Settimana A (Dispari)
                  </label>
                  <select
                    value={weekAShiftCode}
                    onChange={(e) => setWeekAShiftCode(e.target.value)}
                    className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                    Settimana B (Pari)
                  </label>
                  <select
                    value={weekBShiftCode}
                    onChange={(e) => setWeekBShiftCode(e.target.value)}
                    className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 min-w-0">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                Turno da Applicare
              </label>
              <select
                value={uniformShiftCode}
                onChange={(e) => setUniformShiftCode(e.target.value)}
                className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoWeekendRest}
                onChange={(e) => setWeekendRest(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 dark:text-yellow-400 focus:ring-0 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Imposta automaticamente <strong className="text-slate-900 dark:text-white">Riposo (R)</strong> a Sabato e Domenica
              </span>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 shadow flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Applica al Mese</span>
          </button>
        </div>

      </div>
    </div>
  );
}
