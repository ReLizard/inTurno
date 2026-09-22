import React from 'react';
import { X, Eraser, Sparkles, Clock, CalendarDays } from 'lucide-react';

export default function ShiftPickerModal({
  isOpen,
  onClose,
  shifts,
  onSelectShift,
  onOpenWeekPattern
}) {
  if (!isOpen) return null;

  const activeShifts = shifts.filter(s => s.activeInPalette !== false);

  const handlePick = (shiftId) => {
    onSelectShift(shiftId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-yellow-400" />
              Scegli il Turno da Inserire
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Seleziona un turno e poi tocca i giorni nel calendario per assegnarlo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift Options List / Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeShifts.map((shift) => (
              <button
                key={shift.id}
                onClick={() => handlePick(shift.id)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/5 transition-all text-left group active:scale-[0.98]"
              >
                {/* Colored Badge */}
                <div
                  style={{
                    backgroundColor: shift.color,
                    color: shift.textColor || '#ffffff',
                  }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                >
                  {shift.code}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-100 group-hover:text-yellow-400 transition-colors truncate">
                    {shift.name}
                  </div>
                  {shift.startTime && shift.endTime ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Nessun orario prefissato
                    </div>
                  )}
                </div>
              </button>
            ))}

            {/* Eraser option */}
            <button
              onClick={() => handlePick('__ERASER__')}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-dashed border-rose-500/40 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10 transition-all text-left group active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <Eraser className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-rose-400 group-hover:text-rose-300 transition-colors">
                  Cancella Turno (Gomma)
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Rimuove il turno dai giorni toccati
                </div>
              </div>
            </button>
          </div>

          {/* Quick Pattern Link Footer */}
          {onOpenWeekPattern && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenWeekPattern();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-xs font-semibold text-slate-300 hover:text-yellow-400 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Devi compilare intere settimane o mesi a schema ricorrente? Clicca qui</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
