import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Briefcase, 
  Coffee, 
  Palmtree, 
  HeartPulse, 
  Clock, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp,
  Award
} from 'lucide-react';
import { CATEGORIES } from '../constants/defaults';
import { exportScheduleCSV } from '../utils/storage';

export default function StatsView({
  schedule,
  shifts,
  currentDate,
  onOpenExport
}) {
  const [filterMode, setFilterMode] = useState('month'); // 'month' | 'year' | 'all'

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const shiftMap = new Map(shifts.map(s => [s.code, s]));

  // Filter entries
  const filteredEntries = Object.entries(schedule).filter(([dateStr, entry]) => {
    if (!entry || !entry.shiftCode) return false;
    if (filterMode === 'month') {
      return dateStr.startsWith(monthStr);
    }
    if (filterMode === 'year') {
      return dateStr.startsWith(`${currentYear}`);
    }
    return true;
  });

  // Calculate statistics
  let workedDays = 0;
  let restDays = 0;
  let vacationDays = 0;
  let leaveDays = 0;
  let sickDays = 0;
  let totalHours = 0;
  let overtimeHours = 0;

  const frequencyByShift = {};

  filteredEntries.forEach(([dateStr, entry]) => {
    const code = entry.shiftCode;
    const shift = shiftMap.get(code);
    const category = shift?.category || CATEGORIES.WORK;

    frequencyByShift[code] = (frequencyByShift[code] || 0) + 1;

    if (category === CATEGORIES.WORK) {
      workedDays++;
      totalHours += shift?.hours || 8;
    } else if (category === CATEGORIES.REST) {
      restDays++;
    } else if (category === CATEGORIES.VACATION) {
      vacationDays++;
    } else if (category === CATEGORIES.LEAVE) {
      leaveDays++;
    } else if (category === CATEGORIES.SICK) {
      sickDays++;
    }

    // Process modifiers for overtime (+1h, +2h, etc.)
    if (entry.modifiers && Array.isArray(entry.modifiers)) {
      entry.modifiers.forEach(mod => {
        if (mod.startsWith('+') && mod.includes('h')) {
          const hoursNum = parseFloat(mod.replace('+', '').replace('h', '')) || 0;
          overtimeHours += hoursNum;
          totalHours += hoursNum;
        } else if (mod.startsWith('-') && mod.includes('h')) {
          const hoursNum = parseFloat(mod.replace('-', '').replace('h', '')) || 0;
          totalHours = Math.max(0, totalHours - hoursNum);
        }
      });
    }
  });

  // Sort frequency descending
  const sortedFrequency = Object.entries(frequencyByShift).sort((a, b) => b[1] - a[1]);

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Top Header & Filter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-emerald-900/10 dark:border-slate-800 shadow-xl shadow-emerald-950/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-yellow-400" />
            <span>Statistiche e Conteggio Turni</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Analisi dettagliata basata sulle giornate lavorate e frequenza turni
          </p>
        </div>

        {/* Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-stretch sm:self-auto">
          <button
            onClick={() => setFilterMode('month')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'month'
                ? 'bg-emerald-600 text-white dark:bg-yellow-400 dark:text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {monthNames[currentDate.getMonth()]} {currentYear}
          </button>
          <button
            onClick={() => setFilterMode('year')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'year'
                ? 'bg-emerald-600 text-white dark:bg-yellow-400 dark:text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Anno {currentYear}
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-emerald-600 text-white dark:bg-yellow-400 dark:text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Tutto
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Giornate Lavorate (Featured) */}
        <div className="bg-gradient-to-br from-emerald-500/15 via-white to-white dark:from-yellow-500/10 dark:via-slate-900 dark:to-slate-900 border border-emerald-500/30 dark:border-yellow-500/30 p-4 sm:p-5 rounded-3xl shadow-xl shadow-emerald-950/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-yellow-400">
              Giornate Lavorate
            </span>
            <div className="p-2 rounded-2xl bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 dark:bg-yellow-400/20 dark:text-yellow-400 dark:border-yellow-400/30">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {workedDays}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">gg</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              ~ {totalHours} ore totali stimate
            </div>
          </div>
        </div>

        {/* Card 2: Riposi */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Riposi
            </span>
            <div className="p-2 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {restDays}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">gg</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Giorni di riposo registrati
            </div>
          </div>
        </div>

        {/* Card 3: Ferie & Permessi */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Ferie & Permessi
            </span>
            <div className="p-2 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30">
              <Palmtree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {vacationDays + leaveDays}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">gg</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {vacationDays} Ferie • {leaveDays} ROL / Permessi
            </div>
          </div>
        </div>

        {/* Card 4: Straordinari */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Straordinari
            </span>
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              +{overtimeHours}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">ore</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Ore extra calcolate da modificatori
            </div>
          </div>
        </div>

      </div>

      {/* Detailed Shift Frequency Breakdown */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-emerald-900/10 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-yellow-400" />
              <span>Frequenza per Singolo Turno</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Conteggio esatto di quante volte hai svolto ciascun turno nel periodo selezionato
            </p>
          </div>

          <button
            onClick={() => exportScheduleCSV(schedule, shifts, filterMode === 'all' ? null : currentYear, filterMode === 'month' ? currentMonth : null)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 text-xs font-bold border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Esporta Excel / CSV</span>
          </button>
        </div>

        {sortedFrequency.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nessun turno registrato nel periodo selezionato.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {sortedFrequency.map(([code, count]) => {
              const shift = shiftMap.get(code);
              const percentage = workedDays > 0 && shift?.category === CATEGORIES.WORK
                ? Math.round((count / workedDays) * 100)
                : null;

              return (
                <div
                  key={code}
                  className="bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 dark:hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: shift?.color || '#334155',
                        color: shift?.textColor || '#ffffff',
                      }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-md shrink-0"
                    >
                      {code}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{shift?.name || code}</span>
                        {percentage !== null && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-yellow-400/10 dark:text-yellow-400 px-1.5 py-0.2 rounded font-mono font-bold">
                            {percentage}% del lavoro
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {shift?.startTime && shift?.endTime ? `${shift.startTime} - ${shift.endTime}` : 'Orario standard'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {count} <span className="text-xs font-semibold text-slate-400">volte</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
