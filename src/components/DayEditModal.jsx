import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { isItalianHoliday } from '../utils/holidays';
import { 
  X, 
  Trash2, 
  Check, 
  Clock, 
  MessageSquare, 
  Plus, 
  Sparkles,
  Tag
} from 'lucide-react';

export default function DayEditModal({
  isOpen,
  onClose,
  date,
  scheduleEntry,
  shifts,
  modifiersList,
  onSaveDay,
  onDeleteDay
}) {
  if (!isOpen || !date) return null;

  const dateStr = format(date, 'yyyy-MM-dd');
  const formattedDateTitle = format(date, "EEEE d MMMM yyyy", { locale: it });
  const holidayName = isItalianHoliday(dateStr);

  const [selectedShiftCode, setSelectedShiftCode] = useState(scheduleEntry?.shiftCode || '');
  const [customStartTime, setCustomStartTime] = useState(scheduleEntry?.customStartTime || '');
  const [customEndTime, setCustomEndTime] = useState(scheduleEntry?.customEndTime || '');
  const [selectedModifiers, setSelectedModifiers] = useState(scheduleEntry?.modifiers || []);
  const [note, setNote] = useState(scheduleEntry?.note || '');
  const [customModifierInput, setCustomModifierInput] = useState('');
  const [showAddModifier, setShowAddModifier] = useState(false);

  // Sync state when date or entry changes
  useEffect(() => {
    setSelectedShiftCode(scheduleEntry?.shiftCode || '');
    setCustomStartTime(scheduleEntry?.customStartTime || '');
    setCustomEndTime(scheduleEntry?.customEndTime || '');
    setSelectedModifiers(scheduleEntry?.modifiers || []);
    setNote(scheduleEntry?.note || '');
  }, [date, scheduleEntry]);

  const handleShiftSelect = (shift) => {
    if (selectedShiftCode === shift.code) {
      // Deselect
      setSelectedShiftCode('');
      setCustomStartTime('');
      setCustomEndTime('');
    } else {
      setSelectedShiftCode(shift.code);
      setCustomStartTime(shift.startTime || '');
      setCustomEndTime(shift.endTime || '');
    }
  };

  const toggleModifier = (modLabel) => {
    if (selectedModifiers.includes(modLabel)) {
      setSelectedModifiers(selectedModifiers.filter(m => m !== modLabel));
    } else {
      setSelectedModifiers([...selectedModifiers, modLabel]);
    }
  };

  const handleAddCustomModifier = (e) => {
    e.preventDefault();
    if (!customModifierInput.trim()) return;
    const label = customModifierInput.trim();
    if (!selectedModifiers.includes(label)) {
      setSelectedModifiers([...selectedModifiers, label]);
    }
    setCustomModifierInput('');
    setShowAddModifier(false);
  };

  const handleSave = () => {
    if (!selectedShiftCode && selectedModifiers.length === 0 && !note.trim()) {
      onDeleteDay(dateStr);
    } else {
      onSaveDay(dateStr, {
        shiftCode: selectedShiftCode,
        customStartTime,
        customEndTime,
        modifiers: selectedModifiers,
        note: note.trim()
      });
    }
    onClose();
  };

  const handleDelete = () => {
    onDeleteDay(dateStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/90 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              {formattedDateTitle}
            </h3>
            {holidayName && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-950/80 dark:border-rose-800/80 px-2 py-0.5 rounded-md inline-block mt-1">
                🎉 {holidayName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-700">
          
          {/* Section: Select Shift */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Seleziona Turno
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {shifts.map((s) => {
                const isSelected = selectedShiftCode === s.code;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleShiftSelect(s)}
                    style={{
                      backgroundColor: isSelected ? s.color : undefined,
                      borderColor: s.color,
                      color: isSelected ? (s.textColor || '#ffffff') : undefined
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-emerald-600 dark:ring-yellow-400 font-extrabold shadow-md scale-102 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold'
                    }`}
                  >
                    <span className="text-base font-black">{s.code}</span>
                    <span className="text-[11px] truncate max-w-full opacity-90">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Custom Hours (if a shift with time is selected) */}
          {selectedShiftCode && (
            <div className="bg-emerald-50/40 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-emerald-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-yellow-400" />
                <span>Orario Effettivo (Inizio - Fine)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Inizio</label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Fine</label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Modifiers (Straordinari, Permessi, Chip) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-yellow-400" />
                <span>Modificatori & Straordinari</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddModifier(!showAddModifier)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-yellow-400 dark:hover:text-yellow-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuovo Chip</span>
              </button>
            </div>

            {/* Chip List */}
            <div className="flex flex-wrap gap-2">
              {modifiersList.map((mod) => {
                const isSelected = selectedModifiers.includes(mod.label);
                return (
                  <button
                    key={mod.id || mod.label}
                    type="button"
                    onClick={() => toggleModifier(mod.label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-yellow-400 dark:text-slate-950 dark:border-yellow-400 shadow'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:text-white'
                    }`}
                  >
                    <span>{mod.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-white dark:text-slate-950 stroke-[3]" />}
                  </button>
                );
              })}

              {/* Extra selected custom chips that might not be in default list */}
              {selectedModifiers
                .filter(m => !modifiersList.some(item => item.label === m))
                .map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleModifier(m)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white border border-emerald-600 dark:bg-yellow-400 dark:text-slate-950 dark:border-yellow-400 shadow flex items-center gap-1.5"
                  >
                    <span>{m}</span>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                ))}
            </div>

            {/* Input to add custom chip */}
            {showAddModifier && (
              <form onSubmit={handleAddCustomModifier} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Es. +1.5h, Reperibilità, ecc."
                  value={customModifierInput}
                  onChange={(e) => setCustomModifierInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 font-bold px-3 py-2 rounded-xl text-xs"
                >
                  Aggiungi
                </button>
              </form>
            )}
          </div>

          {/* Section: Note */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-yellow-400" />
              <span>Note Giornata / Cambio Turno</span>
            </label>
            <textarea
              rows={2}
              placeholder="Scrivi qui promemoria, cambi colleghi, note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400 resize-none"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            title="Svuota giorno"
            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 dark:border-rose-900/40 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancella</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salva Giorno</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
