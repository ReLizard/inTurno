import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Settings, 
  Download, 
  Sun, 
  Moon,
  Sparkles,
  Share2
} from 'lucide-react';

export default function Navbar({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenExport,
  theme,
  onToggleTheme,
  onOpenWeekPattern
}) {
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onToday}>
            <img 
              src="/icon-192.png" 
              alt="inTurno Icon" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md border border-slate-700/60 object-contain hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  in<span className="text-yellow-400">T</span>urno
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-400/20">
                  PWA
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-wider font-semibold -mt-1 hidden sm:block">
                ORGANIZZA IL LAVORO
              </span>
            </div>
          </div>
        </div>

        {/* Date Navigator (Month / Year / Today) */}
        <div className="flex items-center bg-slate-800/80 dark:bg-slate-900/80 rounded-2xl p-1 border border-slate-700/60 shadow-inner">
          <button
            onClick={onPrevMonth}
            title="Mese precedente"
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/70 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onToday}
            className="px-3 py-1 sm:px-4 text-center group min-w-[130px] sm:min-w-[160px]"
          >
            <div className="text-sm sm:text-base font-bold text-white group-hover:text-yellow-400 transition-colors flex items-center justify-center gap-1.5">
              <span>{currentMonthName}</span>
              <span className="text-yellow-400 font-extrabold">{currentYear}</span>
            </div>
            <div className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">
              Tocca per Oggi
            </div>
          </button>

          <button
            onClick={onNextMonth}
            title="Mese successivo"
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/70 active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View switcher */}
          <div className="flex bg-slate-800/90 rounded-xl p-0.5 border border-slate-700/60">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-yellow-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Calendario</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-yellow-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden xs:inline">Report</span>
            </button>
          </div>

          {/* Quick Pattern Generator Button */}
          <button
            onClick={onOpenWeekPattern}
            title="Pianificazione Rapida Alternata"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-400 hover:text-yellow-300 border border-slate-700 transition-all flex items-center gap-1 text-xs font-semibold shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Schema Rapido</span>
          </button>

          {/* Export button */}
          <button
            onClick={onOpenExport}
            title="Esporta Calendario (.ics, CSV, Stampa)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Impostazioni e Personalizzazione Turni"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Passa al tema Chiaro' : 'Passa al tema Scuro'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 border border-slate-700 transition-all shadow-sm"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
}
