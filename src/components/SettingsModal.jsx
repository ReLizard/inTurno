import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Upload, 
  Download, 
  RefreshCw, 
  Palette, 
  Sliders, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS, DEFAULT_SHIFTS, PRESET_PACKS } from '../constants/defaults';
import { exportBackupJSON } from '../utils/storage';

export default function SettingsModal({
  isOpen,
  onClose,
  shifts,
  setShifts,
  modifiersList,
  setModifiersList,
  schedule,
  setSchedule,
  settings,
  setSettings
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'backup' | 'presets'
  const [editingShift, setEditingShift] = useState(null); // shift being created or edited
  const [isNewShift, setIsNewShift] = useState(false);

  // Backup file upload handler
  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.shifts) setShifts(parsed.shifts);
        if (parsed.modifiers) setModifiersList(parsed.modifiers);
        if (parsed.schedule) setSchedule(parsed.schedule);
        if (parsed.settings) setSettings(parsed.settings);
        alert('Dati e backup ripristinati con successo!');
      } catch (err) {
        alert('Errore nel caricamento del file di backup: formato non valido.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenEditShift = (shift) => {
    setIsNewShift(false);
    setEditingShift({ ...shift });
  };

  const handleOpenNewShift = () => {
    setIsNewShift(true);
    setEditingShift({
      id: `shift_${Date.now()}`,
      code: '',
      name: '',
      category: CATEGORIES.WORK,
      startTime: '08:00',
      endTime: '16:00',
      hours: 8,
      color: '#0ea5e9',
      textColor: '#ffffff',
      activeInPalette: true
    });
  };

  const handleSaveShift = (e) => {
    e.preventDefault();
    if (!editingShift.code.trim() || !editingShift.name.trim()) {
      alert('Inserisci almeno Sigla e Nome del turno.');
      return;
    }

    if (isNewShift) {
      setShifts([...shifts, { ...editingShift, code: editingShift.code.toUpperCase().trim() }]);
    } else {
      setShifts(shifts.map(s => s.id === editingShift.id ? { ...editingShift, code: editingShift.code.toUpperCase().trim() } : s));
    }
    setEditingShift(null);
  };

  const handleDeleteShift = (id) => {
    if (confirm('Sei sicuro di voler eliminare questo tipo di turno?')) {
      setShifts(shifts.filter(s => s.id !== id));
      if (editingShift?.id === id) setEditingShift(null);
    }
  };

  const handleApplyPreset = (preset) => {
    if (confirm(`Vuoi caricare il preset "${preset.name}"? I tuoi tipi di turno attuali verranno aggiornati.`)) {
      setShifts(preset.shifts);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Impostazioni & Turni
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Personalizza i codici turno, i colori, i backup e le preferenze
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 bg-slate-50 dark:bg-slate-950/40 gap-2">
          <button
            onClick={() => { setActiveTab('shifts'); setEditingShift(null); }}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'shifts'
                ? 'border-emerald-600 text-emerald-700 dark:border-yellow-400 dark:text-yellow-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Tipi di Turno ({shifts.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-700 dark:border-yellow-400 dark:text-yellow-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Backup & Dati
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-emerald-600 text-emerald-700 dark:border-yellow-400 dark:text-yellow-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Preset Aziendali
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto overflow-x-hidden flex-1 space-y-4 min-w-0 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-700">
          
          {/* TAB 1: SHIFTS */}
          {activeTab === 'shifts' && (
            <div className="min-w-0">
              {editingShift ? (
                /* Edit/Create Form */
                <form onSubmit={handleSaveShift} className="space-y-4 bg-slate-50 dark:bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-w-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {isNewShift ? 'Nuovo Tipo di Turno' : `Modifica Turno: ${editingShift.code}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingShift(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium"
                    >
                      Annulla
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Sigla Breve (1-3 lettere)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Es. M1"
                        value={editingShift.code}
                        onChange={(e) => setEditingShift({ ...editingShift, code: e.target.value })}
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-extrabold uppercase focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                        required
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Es. Mattina 1"
                        value={editingShift.name}
                        onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Categoria
                      </label>
                      <select
                        value={editingShift.category}
                        onChange={(e) => setEditingShift({ ...editingShift, category: e.target.value })}
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                          <option key={catKey} value={catKey}>{catLabel}</option>
                        ))}
                      </select>
                    </div>

                    <div className="min-w-0">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Colore Badge
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editingShift.color}
                          onChange={(e) => setEditingShift({ ...editingShift, color: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0 shrink-0"
                        />
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{editingShift.color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Orario Inizio Standard
                      </label>
                      <input
                        type="time"
                        value={editingShift.startTime || ''}
                        onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Orario Fine Standard
                      </label>
                      <input
                        type="time"
                        value={editingShift.endTime || ''}
                        onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 dark:focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="activeInPalette"
                      checked={editingShift.activeInPalette !== false}
                      onChange={(e) => setEditingShift({ ...editingShift, activeInPalette: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 dark:text-yellow-400 focus:ring-0 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    />
                    <label htmlFor="activeInPalette" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mostra nella barra pennello rapido
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingShift(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 shadow flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 stroke-[2.5]" />
                      <span>Salva Turno</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Shifts List */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Turni Configurati
                    </span>
                    <button
                      onClick={handleOpenNewShift}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Aggiungi Turno</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {shifts.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 dark:bg-slate-950/60 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 group dark:hover:border-slate-700 transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: s.color, color: s.textColor || '#fff' }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow shrink-0"
                          >
                            {s.code}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{s.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : CATEGORY_LABELS[s.category] || 'Turno'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditShift(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                            title="Modifica"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(s.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BACKUP & DATA */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Privacy e Salvataggio Locale (100% Offline)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tutti i tuoi turni, preferenze e statistiche sono salvati localmente sul tuo dispositivo. Nessun dato viene inviato a server esterni. Per non perdere nulla quando cambi dispositivo o browser, scarica una copia di sicurezza in formato JSON.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => exportBackupJSON(shifts, modifiersList, schedule, settings)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 font-black text-xs flex items-center gap-2 shadow transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Scarica Backup (.json)</span>
                  </button>

                  <label className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer shadow transition-all active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Ripristina Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset Data Danger Zone */}
              <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-rose-700 dark:text-rose-300">
                    Azzera Tutti i Dati
                  </div>
                  <div className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                    Cancella tutti i turni inseriti a calendario e ripristina la configurazione iniziale.
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('ATTENZIONE: Sei sicuro di voler azzerare l\'intero calendario?')) {
                      setSchedule({});
                      alert('Calendario azzerato.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 shadow"
                >
                  Svuota Calendario
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Puoi caricare un set preconfigurato di turni adatto al tuo tipo di lavoro:
              </p>

              <div className="space-y-3">
                {PRESET_PACKS.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-white hover:bg-emerald-50/30 border border-slate-200 dark:bg-slate-950/60 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {preset.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {preset.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyPreset(preset)}
                      className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 dark:bg-slate-800 dark:hover:bg-yellow-400 dark:hover:text-slate-950 dark:text-slate-200 font-bold text-xs transition-all shrink-0 dark:border-slate-700"
                    >
                      Carica Preset
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
            inTurno v1.01
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white transition-colors"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
