import React, { useState } from 'react';
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
  Eye,
  CheckCircle2
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

import { exportScheduleCSV } from '../utils/storage';
import { 
  generateWhatsAppText, 
  openWhatsApp, 
  renderScheduleCardToCanvas, 
  shareOrDownloadFile,
  openInCalendarApp,
  downloadICSFile
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
  const [toastMessage, setToastMessage] = useState(null);

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
    
    let s = customStart ? parseISO(customStart) : thisWeekStart;
    let e = customEnd ? parseISO(customEnd) : thisWeekEnd;
    if (s > e) {
      const tmp = s;
      s = e;
      e = tmp;
    }
    return { start: s, end: e };
  };

  const { start: effectiveStart, end: effectiveEnd } = getDates();
  const startStr = format(effectiveStart, 'yyyy-MM-dd');
  const endStr = format(effectiveEnd, 'yyyy-MM-dd');

  // Mostra notifica toast temporanea
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1. Azione: Apri con App Calendario del Telefono
  const handleOpenInCalendar = async () => {
    const res = await openInCalendarApp(schedule, shifts, startStr, endStr);
    if (res && res.method === 'download') {
      showToast('File calendario scaricato! Toccalo per aprirlo con Google Calendar o Calendario Apple.');
    } else if (res && res.method === 'share-sheet') {
      showToast('Seleziona Google Calendar o l\'app calendario sul tuo dispositivo.');
    }
  };

  // 1b. Azione: Scarica solo file .ics
  const handleDownloadOnlyICS = () => {
    downloadICSFile(schedule, shifts, startStr, endStr);
    showToast('File .ics scaricato con successo!');
  };

  // 2. Azione: Invia su WhatsApp
  const handleSendWhatsApp = () => {
    const text = generateWhatsAppText(schedule, shifts, effectiveStart, effectiveEnd);
    openWhatsApp(text);
  };

  // 3. Azione: Genera e Mostra Foto Turni in anteprima
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
      console.error('Errore generazione foto turni:', err);
      alert('Impossibile generare la foto dei turni. Riprova con un intervallo differente.');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  // Condividi foto tramite Share Sheet nativo del telefono (WhatsApp, Telegram, Salva, ecc.)
  const handleSharePhoto = async () => {
    if (!photoBlob) return;
    const file = new File([photoBlob], `inTurno_${startStr}_${endStr}.png`, { type: 'image/png' });
    const res = await shareOrDownloadFile(file, `inTurno_${startStr}_${endStr}.png`);
    if (res && res.method === 'download') {
      showToast('Immagine scaricata sul dispositivo!');
    }
  };

  // Salva direttamente la foto nella galleria/cartella download
  const handleDownloadPhoto = () => {
    if (!photoPreview) return;
    const a = document.createElement('a');
    a.href = photoPreview;
    a.download = `inTurno_${startStr}_${endStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Foto salvata nella cartella download / immagini!');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20">
                <Share2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Condividi i tuoi Turni
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Invia i tuoi turni a familiari o sincronizza il tuo calendario
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

          {/* Toast informativo se attivo */}
          {toastMessage && (
            <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="flex-1">{toastMessage}</span>
            </div>
          )}

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            
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

            {/* LE 3 OPZIONI PRINCIPALI - CON RIGHE INDIPENDENTI E TESTI CHIARI */}
            <div className="space-y-3 pt-1">
              
              {/* OPZIONE 1: CALENDARIO DEL TELEFONO */}
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-slate-900/90 p-4 space-y-3 transition-all hover:border-blue-400">
                {/* RIGA 1: Intestazione con Titolo e tasto Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Sincronizza con Calendario
                      </h4>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        Google Calendar, Apple Calendario (.ics)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleInfo('calendar')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                      activeInfo === 'calendar'
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60'
                    }`}
                    title="Informazioni su come funziona"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Come funziona</span>
                  </button>
                </div>

                {/* RIGA 2: Commento esplicativo visibile su riga indipendente (SENZA troncature) */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Collega automaticamente i tuoi turni al calendario del tuo smartphone. I turni saranno visualizzati direttamente insieme a tutti i tuoi altri impegni personali e familiari.
                </p>

                {/* Box Info a comparsa (Approfondimento) */}
                {activeInfo === 'calendar' && (
                  <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-950 dark:text-blue-200 leading-relaxed space-y-1.5 animate-fadeIn">
                    <div className="font-bold flex items-center gap-1 text-blue-700 dark:text-blue-400">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Guida dettagliata:</span>
                    </div>
                    <p>• <strong>Su Android:</strong> Il tasto <em>"Apri con App Calendario"</em> apre il selettore del telefono: tocca <strong>Google Calendar</strong> o Calendario Samsung e conferma con <em>"Aggiungi tutti"</em>.</p>
                    <p>• <strong>Su iPhone:</strong> Si apre direttamente l'app <strong>Calendario Apple</strong> con il pulsante per aggiungere subito l'intero periodo.</p>
                    <p>• <strong>Per inviarlo a familiari:</strong> Se preferisci, puoi usare il tasto <em>"Scarica file .ics"</em> e inviare il file allegato in una qualsiasi chat WhatsApp.</p>
                  </div>
                )}

                {/* RIGA 3: Tasti azione (Apri con Calendario + Scarica file .ics) */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenInCalendar}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Apri con App Calendario</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadOnlyICS}
                    className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    title="Scarica il file .ics per importarlo manualmente"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Scarica file .ics</span>
                  </button>
                </div>
              </div>

              {/* OPZIONE 2: WHATSAPP */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-slate-900/90 p-4 space-y-3 transition-all hover:border-emerald-400">
                {/* RIGA 1: Intestazione con Titolo e tasto Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Invia Turni via WhatsApp
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Messaggio chiaro, ordinato e formattato
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleInfo('whatsapp')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                      activeInfo === 'whatsapp'
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                    }`}
                    title="Informazioni su come funziona"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Come funziona</span>
                  </button>
                </div>

                {/* RIGA 2: Commento esplicativo visibile su riga indipendente (SENZA troncature) */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Compone in automatico un testo pulito ed elegante con i tuoi orari di entrata/uscita, giorni di riposo e totale ore. Pronto da inviare in chat a familiari o colleghi di lavoro.
                </p>

                {/* Box Info a comparsa (Approfondimento) */}
                {activeInfo === 'whatsapp' && (
                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 text-[11px] text-emerald-950 dark:text-emerald-200 leading-relaxed space-y-1.5 animate-fadeIn">
                    <div className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Guida dettagliata:</span>
                    </div>
                    <p>• Premendo il pulsante si apre direttamente l'app <strong>WhatsApp</strong> sul telefono (oppure WhatsApp Web se sei su computer).</p>
                    <p>• Il testo con date e orari dei tuoi turni è già pronto: ti basta scegliere il contatto o il gruppo di famiglia e premere il tasto verde di invio.</p>
                  </div>
                )}

                {/* RIGA 3: Tasto azione a tutta larghezza */}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Apri WhatsApp e Invia</span>
                </button>
              </div>

              {/* OPZIONE 3: FOTO TURNI (SCHEDA GRAFICA) */}
              <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-slate-900/90 p-4 space-y-3 transition-all hover:border-purple-400">
                {/* RIGA 1: Intestazione con Titolo e tasto Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Invia Foto Turni
                      </h4>
                      <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                        Scheda grafica a colori ad alta definizione
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleInfo('photo')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                      activeInfo === 'photo'
                        ? 'bg-purple-600 text-white dark:bg-purple-500'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60'
                    }`}
                    title="Informazioni su come funziona"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Come funziona</span>
                  </button>
                </div>

                {/* RIGA 2: Commento esplicativo visibile su riga indipendente (SENZA troncature) */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Genera una scheda grafica colorata con i badge dei turni, orari e riepilogo ore. Potrai visualizzare l'anteprima e condividerla liberamente come una foto dallo smartphone o salvarla nella galleria.
                </p>

                {/* Box Info a comparsa (Approfondimento) */}
                {activeInfo === 'photo' && (
                  <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/50 text-[11px] text-purple-950 dark:text-purple-200 leading-relaxed space-y-1.5 animate-fadeIn">
                    <div className="font-bold flex items-center gap-1 text-purple-700 dark:text-purple-400">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Guida dettagliata:</span>
                    </div>
                    <p>• Crea un'immagine nitida (formato 1080px) pronta per smartphone.</p>
                    <p>• Si apre subito una schermata di anteprima: da lì puoi premere <strong>"Condividi Foto"</strong> (per inviarla tramite WhatsApp, Telegram, email come qualsiasi foto della tua fotocamera) oppure <strong>"Salva nella Galleria"</strong>.</p>
                  </div>
                )}

                {/* RIGA 3: Tasto azione a tutta larghezza con stato di caricamento */}
                <button
                  type="button"
                  onClick={handlePreparePhoto}
                  disabled={isGeneratingPhoto}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generazione immagine in corso...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Vedi Anteprima e Condividi Foto</span>
                    </>
                  )}
                </button>
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
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
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

      {/* MODALE DEDICATA: ANTEPRIMA FOTO TURNI (z-[80] per essere sempre in primissimo piano) */}
      {showPhotoPreviewModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Anteprima */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Anteprima Foto Turni
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Condividi come foto o salvala nella galleria del telefono
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPhotoPreviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Immagine generata scrollabile */}
            <div className="p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-slate-100/90 dark:bg-slate-950/60 min-h-[300px]">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Anteprima Foto Turni" 
                  className="rounded-2xl shadow-xl max-w-full max-h-[58vh] object-contain border border-slate-300/80 dark:border-slate-700 transition-all hover:scale-[1.01]"
                />
              ) : (
                <div className="text-sm text-slate-400">Caricamento immagine...</div>
              )}
            </div>

            {/* Azioni foto */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 justify-between items-center">
              <button
                type="button"
                onClick={handleDownloadPhoto}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Salva nella Galleria</span>
              </button>

              <button
                type="button"
                onClick={handleSharePhoto}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all"
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
