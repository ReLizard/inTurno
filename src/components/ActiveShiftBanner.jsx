import React from 'react';
import { Check, ArrowLeftRight, Eraser, Info } from 'lucide-react';

export default function ActiveShiftBanner({
  activeShiftId,
  shifts,
  onChangeShift,
  onDone
}) {
  if (!activeShiftId) return null;

  const isEraser = activeShiftId === '__ERASER__';
  const shift = shifts.find(s => s.id === activeShiftId);

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-30 px-3 flex justify-center pointer-events-none animate-in slide-in-from-bottom-4 duration-200">
      <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 text-white rounded-2xl sm:rounded-full px-3.5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-md flex items-center justify-between sm:justify-center gap-3 sm:gap-4 max-w-xl w-full">
        
        {/* Active Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {isEraser ? (
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 flex items-center justify-center shrink-0">
              <Eraser className="w-4 h-4" />
            </div>
          ) : (
            <div
              style={{
                backgroundColor: shift?.color || '#3b82f6',
                color: shift?.textColor || '#ffffff',
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow shrink-0"
            >
              {shift?.code || '?'}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm truncate">
              <span>{isEraser ? 'Gomma attiva' : shift?.name || 'Turno attivo'}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-yellow-400 font-medium truncate">
              Tocca i giorni da assegnare
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onChangeShift}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all active:scale-95"
            title="Cambia turno da assegnare"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xs:inline">Cambia</span>
          </button>

          <button
            onClick={onDone}
            className="px-3.5 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-yellow-400/20 transition-all active:scale-95"
            title="Termina inserimento rapido e torna al calendario"
          >
            <Check className="w-4 h-4" />
            <span>Fine</span>
          </button>
        </div>

      </div>
    </div>
  );
}
