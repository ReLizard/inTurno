import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  Check, 
  Share2 
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, startOfYear, endOfYear } from 'date-fns';
import { generateICS } from '../utils/icsExport';
import { exportScheduleCSV } from '../utils/storage';

export default function IcsExportModal({
  isOpen,
  onClose,
  currentDate,
  schedule,
  shifts
}) {
  if (!isOpen) return null;

  const currentMonthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const threeMonthsEnd = format(endOfMonth(addMonths(currentDate, 2)), 'yyyy-MM-dd');
  const currentYearStart = format(startOfYear(currentDate), 'yyyy-MM-dd');
  const currentYearEnd = format(endOfYear(currentDate), 'yyyy-MM-dd');

  const [rangeType, setRangeType] = useState('month'); // 'month' | '3months' | 'year' | 'custom'
  const [customStart, setCustomStart] = useState(currentMonthStart);
  const [customEnd, setCustomEnd] = useState(currentMonthEnd);

  const getEffectiveRange = () => {
    if (rangeType === 'month') return { start: currentMonthStart, end: currentMonthEnd };
    if (rangeType === '3months') return { start: currentMonthStart, end: threeMonthsEnd };
    if (rangeType === 'year') return { start: currentYearStart, end: currentYearEnd };
    return { start: customStart, end: customEnd };
  };

  const handleDownloadICS = () => {
    const { start, end } = getEffectiveRange();
    generateICS(schedule, shifts, start, end);
    onClose();
  };

  const handleDownloadCSV = () => {
    const { start, end } = getEffectiveRange();
    exportScheduleCSV(schedule, shifts, null, null);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Esporta & Condividi
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Sincronizza con Google/Apple Calendar o esporta in Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Seleziona Intervallo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRangeType('month')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  rangeType === 'month'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Mese Corrente
              </button>
              <button
                type="button"
                onClick={() => setRangeType('3months')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  rangeType === '3months'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Prossimi 3 Mesi
              </button>
              <button
                type="button"
                onClick={() => setRangeType('year')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  rangeType === 'year'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Anno Intero
              </button>
              <button
                type="button"
                onClick={() => setRangeType('custom')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  rangeType === 'custom'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Personalizzato
              </button>
            </div>
          </div>

          {rangeType === 'custom' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Da</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">A</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Export Actions Buttons */}
          <div className="space-y-2.5 pt-2">
            
            {/* Action 1: ICS */}
            <button
              onClick={handleDownloadICS}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-between shadow-lg transition-all active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-blue-200" />
                <div className="text-left">
                  <div className="font-extrabold text-sm">Scarica per Google/Apple Calendar (.ics)</div>
                  <div className="text-[10px] text-blue-100 opacity-90">Sincronizza orari e promemoria sul telefono</div>
                </div>
              </div>
              <Download className="w-4 h-4" />
            </button>

            {/* Action 2: CSV */}
            <button
              onClick={handleDownloadCSV}
              className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-700 transition-all active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="font-bold">Esporta Foglio Excel / CSV</div>
                  <div className="text-[10px] text-slate-400">Tabella completa con ore, note e modificatori</div>
                </div>
              </div>
              <Download className="w-4 h-4" />
            </button>

            {/* Action 3: Print / PDF */}
            <button
              onClick={handlePrint}
              className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-700 transition-all active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 text-yellow-400" />
                <div className="text-left">
                  <div className="font-bold">Stampa / Salva in PDF</div>
                  <div className="text-[10px] text-slate-400">Layout cartaceo o PDF pronto da stampare</div>
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
