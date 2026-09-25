import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Keyboard, Plus, Minus } from 'lucide-react';

const COMMON_PRESETS = ['06:00', '07:00', '08:00', '13:00', '14:00', '15:00', '21:00', '22:00', '23:00', '00:00'];

export default function TimePickerModal({
  isOpen,
  onClose,
  value = '',
  onChange,
  title = 'Imposta Orario'
}) {
  // Parse initial value HH:mm
  const parseTime = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) {
      const now = new Date();
      return {
        hours: now.getHours(),
        minutes: Math.floor(now.getMinutes() / 5) * 5
      };
    }
    const [h, m] = timeStr.split(':').map(Number);
    return {
      hours: isNaN(h) ? 8 : Math.max(0, Math.min(23, h)),
      minutes: isNaN(m) ? 0 : Math.max(0, Math.min(59, m))
    };
  };

  const [hours, setHours] = useState(8);
  const [minutes, setMinutes] = useState(0);
  const [activeTab, setActiveTab] = useState('hours'); // 'hours' | 'minutes'
  const [period, setPeriod] = useState('morning'); // 'morning' (0-11) | 'afternoon' (12-23)
  const [inputMode, setInputMode] = useState('clock'); // 'clock' | 'keypad'

  useEffect(() => {
    if (isOpen) {
      const parsed = parseTime(value);
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
      setPeriod(parsed.hours >= 12 ? 'afternoon' : 'morning');
      setActiveTab('hours');
      setInputMode('clock');
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === 'morning' && hours >= 12) {
      setHours(hours - 12);
    } else if (newPeriod === 'afternoon' && hours < 12) {
      setHours(hours + 12);
    }
  };

  const handleHourSelect = (h) => {
    const finalHour = period === 'afternoon' ? (h < 12 ? h + 12 : h) : (h >= 12 ? h - 12 : h);
    setHours(finalHour);
    // Smoothly auto-advance to minutes
    setActiveTab('minutes');
  };

  const handleMinuteSelect = (m) => {
    setMinutes(m);
  };

  const handleAdjustMinute = (delta) => {
    setMinutes((prev) => {
      let next = (prev + delta) % 60;
      if (next < 0) next += 60;
      return next;
    });
  };

  const handlePresetSelect = (preset) => {
    const [h, m] = preset.split(':').map(Number);
    setHours(h);
    setMinutes(m);
    setPeriod(h >= 12 ? 'afternoon' : 'morning');
  };

  const handleConfirm = () => {
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    onChange(formatted);
    onClose();
  };

  const handleClear = () => {
    onChange('');
    onClose();
  };

  // Clock Geometry for 12 numbers
  // Circle radius = 78px, center = (105, 105) inside a 210x210 box
  const clockRadius = 76;
  const clockCenter = 105;

  const hoursList = period === 'morning' 
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (h === 12 ? 0 : h))
    : [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Calculate current angle for hand
  const currentAngle = activeTab === 'hours'
    ? ((hours % 12) * 30) // 30 deg per hour
    : (minutes * 6);       // 6 deg per minute

  const handAngleRad = (currentAngle - 90) * (Math.PI / 180);
  const handEndX = clockCenter + clockRadius * Math.cos(handAngleRad);
  const handEndY = clockCenter + clockRadius * Math.sin(handAngleRad);

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xs sm:max-w-sm shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              {title}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital Time & Mode Switcher */}
        <div className="p-4 flex flex-col items-center bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-center gap-1.5">
            {/* Hour Block */}
            <button
              type="button"
              onClick={() => setActiveTab('hours')}
              className={`px-3.5 py-1.5 rounded-2xl text-3xl font-black font-mono transition-all ${
                activeTab === 'hours'
                  ? 'bg-emerald-600 text-white dark:bg-yellow-400 dark:text-slate-950 shadow-md scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              {String(hours).padStart(2, '0')}
            </button>

            <span className="text-2xl font-black text-slate-400 dark:text-slate-500 font-mono animate-pulse">:</span>

            {/* Minute Block */}
            <button
              type="button"
              onClick={() => setActiveTab('minutes')}
              className={`px-3.5 py-1.5 rounded-2xl text-3xl font-black font-mono transition-all ${
                activeTab === 'minutes'
                  ? 'bg-emerald-600 text-white dark:bg-yellow-400 dark:text-slate-950 shadow-md scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              {String(minutes).padStart(2, '0')}
            </button>

            {/* Toggle Input Mode (Clock vs Keypad) */}
            <button
              type="button"
              onClick={() => setInputMode(inputMode === 'clock' ? 'keypad' : 'clock')}
              title={inputMode === 'clock' ? 'Inserimento da tastiera' : 'Orologio'}
              className="ml-2 p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-emerald-600 dark:hover:text-yellow-400 transition-colors shadow-sm"
            >
              {inputMode === 'clock' ? <Keyboard className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </button>
          </div>

          {/* 24h Period Switcher (00-11 vs 12-23) */}
          <div className="flex items-center gap-1.5 mt-3 bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handlePeriodChange('morning')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                period === 'morning'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              00 – 11
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('afternoon')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                period === 'afternoon'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              12 – 23
            </button>
          </div>
        </div>

        {/* Content: Interactive Clock Dial or Keypad */}
        <div className="p-4 flex flex-col items-center justify-center min-w-0">
          {inputMode === 'clock' ? (
            <div className="flex flex-col items-center">
              {/* Circular Clock Dial */}
              <div 
                className="relative w-[210px] h-[210px] rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 select-none shadow-inner"
              >
                {/* SVG for Hand & Center Pivot */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {/* Center Dot */}
                  <circle
                    cx={clockCenter}
                    cy={clockCenter}
                    r="4"
                    className="fill-emerald-600 dark:fill-yellow-400"
                  />
                  {/* Hand Line */}
                  <line
                    x1={clockCenter}
                    y1={clockCenter}
                    x2={handEndX}
                    y2={handEndY}
                    strokeWidth="2.5"
                    className="stroke-emerald-600 dark:stroke-yellow-400"
                  />
                  {/* Hand Target Circle */}
                  <circle
                    cx={handEndX}
                    cy={handEndY}
                    r="16"
                    className="fill-emerald-600/25 dark:fill-yellow-400/25 stroke-emerald-600 dark:stroke-yellow-400"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Number Nodes */}
                {(activeTab === 'hours' ? hoursList : minutesList).map((val, idx) => {
                  const angle = (idx * 30 - 90) * (Math.PI / 180);
                  const posX = clockCenter + clockRadius * Math.cos(angle);
                  const posY = clockCenter + clockRadius * Math.sin(angle);

                  const isSelected = activeTab === 'hours'
                    ? (hours === val)
                    : (minutes === val || (Math.round(minutes / 5) * 5 % 60 === val && !minutesList.includes(minutes)));

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => activeTab === 'hours' ? handleHourSelect(val) : handleMinuteSelect(val)}
                      style={{
                        left: `${posX}px`,
                        top: `${posY}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-transform active:scale-90 z-10 ${
                        isSelected
                          ? 'bg-emerald-600 text-white dark:bg-yellow-400 dark:text-slate-950 font-black shadow-md scale-110'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-100/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      {activeTab === 'minutes' ? String(val).padStart(2, '0') : val}
                    </button>
                  );
                })}
              </div>

              {/* Minute Steppers (fine tuning) */}
              {activeTab === 'minutes' && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustMinute(-5)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    -5m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustMinute(-1)}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    title="-1 minuto"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 px-1">
                    {String(minutes).padStart(2, '0')} min
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustMinute(1)}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    title="+1 minuto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustMinute(5)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    +5m
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Numeric direct input keypad */
            <div className="w-full space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Ora (00 - 23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) {
                        const h = Math.max(0, Math.min(23, v));
                        setHours(h);
                        setPeriod(h >= 12 ? 'afternoon' : 'morning');
                      }
                    }}
                    className="w-full text-center text-xl font-mono font-bold py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Minuti (00 - 59)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) {
                        setMinutes(Math.max(0, Math.min(59, v)));
                      }
                    }}
                    className="w-full text-center text-xl font-mono font-bold py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Presets Pills */}
          <div className="w-full mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 text-center">
              Orari Frequenti
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-h-16 overflow-y-auto">
              {COMMON_PRESETS.map((p) => {
                const isSelected = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white dark:bg-yellow-400 dark:text-slate-950 font-black'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons: 100% Responsive, perfectly contained */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 min-w-0">
          <div>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
              >
                Svuota
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 shadow-md flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Imposta Orario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
