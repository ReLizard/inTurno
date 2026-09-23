import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  MessageCircle, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  Printer, 
  Check,
  Smartphone,
  Eye
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  parseISO 
} from 'date-fns';
import { it } from 'date-fns/locale';

import { generateICS, createICSFile } from '../utils/icsExport';
import { exportScheduleCSV } from '../utils/storage';
import { 
  generateWhatsAppText, 
  openWhatsApp, 
  renderScheduleCardToCanvas, 
  shareOrDownloadFile 
} from '../utils/shareUtils';

export default function IcsExportModal({
  isOpen,
  onClose,
  currentDate,
  schedule,
  shifts,
  theme = 'light'
}) {
  if (!isOpen) return null;

  // Intervalli calcolati
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Stati intervallo
  const [rangeType, setRangeType] = useState('thisWeek'); // 'thisWeek' | 'nextWeek' | 'month' | 'custom'
  const [customStart, setCustomStart] = useState(format(thisWeekStart, 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(thisWeekEnd, 'yyyy-MM-dd'));

  // Stati info a comparsa per ciascuna delle 3 opzioni
  const [activeInfo, setActiveInfo] = useState(null); // 'calendar' | 'whatsapp' | 'photo' | null
  const [showOtherExports, setShowOtherExports] = useState(false);

  // Stato anteprima foto
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [showPhotoPreviewModal, setShowPhotoPreviewModal] = useState(false);

  // Risoluzione date correnti dell'intervallo scelto
  const getDates = () => {
    if (rangeType === 'thisWeek') return { start: thisWeekStart, end: thisWeekEnd };
    if (rangeType === 'nextWeek') return { start: nextWeekStart, end: nextWeekEnd };
    if (rangeType === 'month') return { start: monthStart, end: monthEnd };
    return {
      start: customStart ? parseISO(customStart) : thisWeekStart,
      end: customEnd ? parseISO(customEnd) : thisWeekEnd
    };
  };

  const { start: effectiveStart, end: effectiveEnd } = getDates();
  const startStr = format(effectiveStart, 'yyyy-MM-dd');
  const endStr = format(effectiveEnd, 'yyyy-MM-dd');

  // 1. Azione: Sincronizza con Calendario del Telefono
  const handleSyncCalendar = async () => {
    const calendarName = 'inTurno - I miei Turni';
    const icsFile = createICSFile(schedule, shifts, startStr, endStr, calendarName);
    await shareOrDownloadFile(icsFile, `inTurno_${startStr}_${endStr}.ics`);
  };

  // 2. Azione: Invia su WhatsApp
  const handleSendWhatsApp = () => {
    const text = generateWhatsAppText(schedule, shifts, effectiveStart, effectiveEnd);
    openWhatsApp(text);
  };

  // 3. Azione: Genera e Mostra Foto Turni
  const handlePreparePhoto = async () => {
    setIsGeneratingPhoto(true);
    try {
      const result = await renderScheduleCardToCanvas({
        schedule,
        shifts,
        startDate: effectiveStart,
        endDate: effectiveEnd,
        theme: theme,
        title: 'I Miei Turni di Lavoro'
      });
      setPhotoPreview(result.dataUrl);
      setPhotoBlob(result.blob);
      setShowPhotoPreviewModal(true);
    } catch (err) {
      console.error('Errore generazione foto turni', err);
      alert('Impossibile generare la foto dei turni.');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  const handleSharePhoto = async () => {
    if (!photoBlob) return;
    const file = new File([photoBlob], `inTurno_${startStr}_${endStr}.png`, { type: 'image/png' });
    await shareOrDownloadFile(file, `inTurno_${startStr}_${endStr}.png`);
  };

  const handleDownloadPhoto = () => {
    if (!photoPreview) return;
    const a = document.createElement('a');
    a.href = photoPreview;
    a.download = `inTurno_${startStr}_${endStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Funzioni secondarie
  const handleDownloadCSV = () => {
    exportScheduleCSV(schedule, shifts, null, null);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleInfo = (id) => {
    setActiveInfo(prev => prev === id ? null : id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Condividi & Esporta Turni
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Comunica i tuoi turni a familiari o sincronizza il tuo calendario
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
          <div className="p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            
            {/* Selettore Intervallo Rapido */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Periodo da Condividere
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRangeType('thisWeek')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    rangeType === 'thisWeek'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm dark:bg-yellow-400 dark:text-slate-950 dark:border-yellow-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:text-white'
                  }`}
                >
                  Questa Sett.
                </button>
                <button
                  type="button"
                  onClick={() => setRangeType('nextWeek')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    rangeType === 'nextWeek'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm dark:bg-yellow-400 dark:text-slate-950 dark:border-yellow-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:text-white'
                  }`}
                >
                  Prossima Sett.
                </button>
                <button
                  type="button"
                  onClick={() => setRangeType('month')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    rangeType === 'month'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm dark:bg-yellow-400 dark:text-slate-950 dark:border-yellow-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:text-white'
                  }`}
                >
                  Mese Intero
                </button>
                <button
                  type="button"
                  onClick={() => setRangeType('custom')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    rangeType === 'custom'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm dark:bg-yellow-400 dark:text-slate-950 dark:border-yellow-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:text-white'
                  }`}
                >
                  Personalizzato
                </button>
              </div>

              {/* Date personalizzate */}
              {rangeType === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-2.5 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Da</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">A</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* LE 3 OPZIONI PRINCIPALI */}
            <div className="space-y-3 pt-1">
              
              {/* OPZIONE 1: CALENDARIO DEL TELEFONO */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:border-emerald-300 dark:hover:border-slate-700 transition-all">
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Sincronizza con Calendario
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Google Calendar, Apple Calendario (.ics)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleInfo('calendar')}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors ${
                        activeInfo === 'calendar' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : ''
                      }`}
                      title="Come funziona questa opzione?"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncCalendar}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Sincronizza</span>
                    </button>
                  </div>
                </div>

                {/* Info Card a comparsa */}
                {activeInfo === 'calendar' && (
                  <div className="px-4 py-3 bg-blue-50/60 dark:bg-blue-950/30 border-t border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-950 dark:text-blue-200 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1 text-blue-700 dark:text-blue-400">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Come funziona:</span>
                    </div>
                    <p>• <strong>Su Android:</strong> Invia i turni a <em>Google Calendar</em> o Calendario Samsung. Basta premere <em>"Aggiungi tutti"</em>.</p>
                    <p>• <strong>Su iPhone:</strong> Si apre l'app <em>Calendario Apple</em> con il pulsante <em>"Aggiungi tutti al calendario"</em>.</p>
                    <p>• <strong>Per un familiare:</strong> Puoi anche inoltrarlo come file nella sua chat WhatsApp per farglielo importare con un tocco.</p>
                  </div>
                )}
              </div>

              {/* OPZIONE 2: WHATSAPP */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:border-emerald-300 dark:hover:border-slate-700 transition-all">
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Invia Turni via WhatsApp
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Messaggio chiaro e ordinato per famiglia o colleghi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleInfo('whatsapp')}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors ${
                        activeInfo === 'whatsapp' ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                      title="Come funziona questa opzione?"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Apri WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Info Card a comparsa */}
                {activeInfo === 'whatsapp' && (
                  <div className="px-4 py-3 bg-emerald-50/60 dark:bg-emerald-950/30 border-t border-emerald-100 dark:border-emerald-900/50 text-[11px] text-emerald-950 dark:text-emerald-200 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Come funziona:</span>
                    </div>
                    <p>Apre direttamente l'app WhatsApp sul tuo telefono (o WhatsApp Web su computer) con il messaggio precompilato.</p>
                    <p>Ti basterà scegliere la persona (o il gruppo di famiglia) a cui recapitarlo e premere il tasto verde di invio.</p>
                  </div>
                )}
              </div>

              {/* OPZIONE 3: FOTO TURNI (SCHEDA GRAFICA) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:border-emerald-300 dark:hover:border-slate-700 transition-all">
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Invia Foto Turni
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Scheda grafica a colori da inviare o usare come sfondo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleInfo('photo')}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors ${
                        activeInfo === 'photo' ? 'bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400' : ''
                      }`}
                      title="Come funziona questa opzione?"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePreparePhoto}
                      disabled={isGeneratingPhoto}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isGeneratingPhoto ? 'Creo...' : 'Genera Foto'}</span>
                    </button>
                  </div>
                </div>

                {/* Info Card a comparsa */}
                {activeInfo === 'photo' && (
                  <div className="px-4 py-3 bg-purple-50/60 dark:bg-purple-950/30 border-t border-purple-100 dark:border-purple-900/50 text-[11px] text-purple-950 dark:text-purple-200 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1 text-purple-700 dark:text-purple-400">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Come funziona:</span>
                    </div>
                    <p>Crea un'elegante immagine grafica ad alta definizione con i badge colorati dei turni, orari e ore totali.</p>
                    <p>Puoi condividerla liberamente come qualsiasi foto scattata con lo smartphone (WhatsApp, Telegram, email) oppure salvarla tra le tue immagini.</p>
                  </div>
                )}
              </div>

            </div>

            {/* SEZIONE ALTRE ESPORTAZIONI (ACCORDION RIPEGABILE) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowOtherExports(!showOtherExports)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <span>Altre opzioni di esportazione (Excel CSV, Stampa PDF)</span>
                {showOtherExports ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showOtherExports && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Foglio Excel / CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Printer className="w-4 h-4 text-slate-600 dark:text-yellow-400" />
                    <span>Stampa / PDF</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white transition-colors"
            >
              Chiudi
            </button>
          </div>

        </div>
      </div>

      {/* MODALE ANTEPRIMA FOTO TURNI GENERATA */}
      {showPhotoPreviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Anteprima */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Anteprima Foto Turni</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pronta per essere condivisa con familiari o salvata
                </p>
              </div>
              <button
                onClick={() => setShowPhotoPreviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Immagine generata scrollabile */}
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950/50">
              {photoPreview && (
                <img 
                  src={photoPreview} 
                  alt="Foto turni inTurno" 
                  className="rounded-2xl shadow-xl max-w-full max-h-[55vh] object-contain border border-slate-300/60 dark:border-slate-700"
                />
              )}
            </div>

            {/* Azioni foto */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5 justify-between items-center">
              <button
                type="button"
                onClick={handleDownloadPhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Salva nella Galleria</span>
              </button>

              <button
                type="button"
                onClick={handleSharePhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Condividi Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
