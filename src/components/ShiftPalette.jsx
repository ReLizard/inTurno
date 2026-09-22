import React from 'react';
import { Paintbrush, Eraser, MousePointerClick, Info, Sparkles, Check } from 'lucide-react';

export default function ShiftPalette({
  shifts,
  selectedShiftId,
  onSelectShift,
  brushMode,
  setBrushMode,
  onOpenWeekPattern
}) {
  const activeShifts = shifts.filter(s => s.activeInPalette !== false);

  return (
    <div className="bg-slate-900/95 dark:bg-slate-900/90 border-b border-slate-800 py-2.5 px-3 sm:px-6 shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        
        {/* Left: Mode & Helper */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setBrushMode(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                brushMode
                  ? 'bg-yellow-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modalità Pennello Rapido: tocca un turno e poi tocca i giorni per assegnarlo con 1 tap"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Pennello Rapido</span>
            </button>
            <button
              onClick={() => setBrushMode(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                !brushMode
                  ? 'bg-yellow-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modalità Dettaglio: tocca un giorno per aprire la scheda di modifica completa"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Dettaglio Giorno</span>
            </button>
          </div>

          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            {brushMode ? 'Seleziona un turno e tocca i giorni da compilare' : 'Tocca un giorno per modificare orari, straordinari e note'}
          </span>
        </div>

        {/* Right: Scrollable Shift Badges & Eraser */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-slate-700">
          {activeShifts.map((shift) => {
            const isSelected = brushMode && selectedShiftId === shift.id;
            return (
              <button
                key={shift.id}
                onClick={() => {
                  setBrushMode(true);
                  onSelectShift(shift.id);
                }}
                style={{
                  backgroundColor: shift.color,
                  color: shift.textColor || '#ffffff',
                }}
                className={`group relative shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition-all active:scale-95 ${
                  isSelected
                    ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900 scale-105 shadow-yellow-500/20 shadow-lg z-10'
                    : 'opacity-90 hover:opacity-100 hover:scale-105'
                }`}
              >
                <span className="font-extrabold tracking-wide">{shift.code}</span>
                <span className="text-[11px] opacity-90 hidden sm:inline">{shift.name}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}

          {/* Eraser / Reset day */}
          <button
            onClick={() => {
              setBrushMode(true);
              onSelectShift('__ERASER__');
            }}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 border transition-all active:scale-95 ${
              brushMode && selectedShiftId === '__ERASER__'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500 ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 scale-105'
                : 'bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 border-slate-700'
            }`}
            title="Gomma: Cancella il turno dai giorni selezionati"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Gomma</span>
          </button>
        </div>

      </div>
    </div>
  );
}
