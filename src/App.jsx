import React, { useState, useEffect } from 'react';
import { 
  addMonths, 
  subMonths, 
  format, 
  isSameMonth, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth 
} from 'date-fns';
import confetti from 'canvas-confetti';

import Navbar from './components/Navbar';
import CalendarMonth from './components/CalendarMonth';
import DayEditModal from './components/DayEditModal';
import StatsView from './components/StatsView';
import SettingsModal from './components/SettingsModal';
import WeekPatternModal from './components/WeekPatternModal';
import IcsExportModal from './components/IcsExportModal';
import ShiftPickerModal from './components/ShiftPickerModal';
import ActiveShiftBanner from './components/ActiveShiftBanner';
import { Plus } from 'lucide-react';

import { 
  loadStoredData, 
  saveSchedule, 
  saveShiftsConfig, 
  saveModifiersConfig, 
  saveSettings 
} from './utils/storage';

export default function App() {
  const initialData = loadStoredData();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState(initialData.schedule);
  const [shifts, setShifts] = useState(initialData.shifts);
  const [modifiersList, setModifiersList] = useState(initialData.modifiers);
  const [settings, setSettings] = useState(initialData.settings);

  // Active interaction states
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'stats'
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [brushMode, setBrushMode] = useState(false);

  // Modal states
  const [editingDayDate, setEditingDayDate] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWeekPatternOpen, setIsWeekPatternOpen] = useState(false);
  const [isShiftPickerOpen, setIsShiftPickerOpen] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    saveSchedule(schedule);
  }, [schedule]);

  useEffect(() => {
    saveShiftsConfig(shifts);
  }, [shifts]);

  useEffect(() => {
    saveModifiersConfig(modifiersList);
  }, [modifiersList]);

  useEffect(() => {
    saveSettings(settings);
    // Apply theme
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [settings]);

  // Date navigation handlers
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleToggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  // Day click handler
  const handleDayClick = (day, dateStr) => {
    if (brushMode) {
      const activeShift = shifts.find(s => s.id === selectedShiftId);

      if (selectedShiftId === '__ERASER__') {
        // Erase
        const newSchedule = { ...schedule };
        delete newSchedule[dateStr];
        setSchedule(newSchedule);
      } else if (activeShift) {
        // If the day already has this shift, deselect/erase it on double tap
        const currentEntry = schedule[dateStr];
        if (currentEntry?.shiftCode === activeShift.code) {
          const newSchedule = { ...schedule };
          delete newSchedule[dateStr];
          setSchedule(newSchedule);
        } else {
          setSchedule(prev => ({
            ...prev,
            [dateStr]: {
              ...(prev[dateStr] || {}),
              shiftCode: activeShift.code,
              customStartTime: activeShift.startTime || '',
              customEndTime: activeShift.endTime || '',
            }
          }));
        }
      }
    } else {
      // Detail Mode
      setEditingDayDate(day);
    }
  };

  // Force open detail modal (e.g. right click, long press, or edit button)
  const handleDayLongPress = (day, dateStr) => {
    setEditingDayDate(day);
  };

  // Save single day from modal
  const handleSaveDay = (dateStr, data) => {
    setSchedule(prev => ({
      ...prev,
      [dateStr]: data
    }));
  };

  // Delete single day from modal
  const handleDeleteDay = (dateStr) => {
    const newSchedule = { ...schedule };
    delete newSchedule[dateStr];
    setSchedule(newSchedule);
  };

  const handleSelectShiftToAssign = (shiftId) => {
    setSelectedShiftId(shiftId);
    setBrushMode(true);
  };

  const handleStopAssigning = () => {
    setBrushMode(false);
    setSelectedShiftId(null);
  };

  // Quick Action: Fill Week Lun-Ven with active brush shift
  const handleFillWeekDays = (weekDays) => {
    if (!brushMode || !selectedShiftId) {
      setIsShiftPickerOpen(true);
      return;
    }
    const activeShift = shifts.find(s => s.id === selectedShiftId);
    if (!activeShift && selectedShiftId !== '__ERASER__') return;

    const newSchedule = { ...schedule };
    // Week days: index 0 to 4 are Lun-Ven
    weekDays.slice(0, 5).forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (selectedShiftId === '__ERASER__') {
        delete newSchedule[dateStr];
      } else {
        newSchedule[dateStr] = {
          ...(newSchedule[dateStr] || {}),
          shiftCode: activeShift.code,
          customStartTime: activeShift.startTime || '',
          customEndTime: activeShift.endTime || '',
        };
      }
    });

    // Auto assign Rest to Saturday and Sunday if not already set
    weekDays.slice(5, 7).forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (!newSchedule[dateStr] && selectedShiftId !== '__ERASER__') {
        newSchedule[dateStr] = { shiftCode: 'R' };
      }
    });

    setSchedule(newSchedule);
  };

  // Quick Action: Fill Week Lun-Sab
  const handleFillWeekFull = (weekDays) => {
    if (!brushMode || !selectedShiftId) {
      setIsShiftPickerOpen(true);
      return;
    }
    const activeShift = shifts.find(s => s.id === selectedShiftId);
    if (!activeShift && selectedShiftId !== '__ERASER__') return;

    const newSchedule = { ...schedule };
    // Lun-Sab: index 0 to 5
    weekDays.slice(0, 6).forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (selectedShiftId === '__ERASER__') {
        delete newSchedule[dateStr];
      } else {
        newSchedule[dateStr] = {
          ...(newSchedule[dateStr] || {}),
          shiftCode: activeShift.code,
          customStartTime: activeShift.startTime || '',
          customEndTime: activeShift.endTime || '',
        };
      }
    });

    // Domenica Riposo
    const sunStr = format(weekDays[6], 'yyyy-MM-dd');
    if (!newSchedule[sunStr] && selectedShiftId !== '__ERASER__') {
      newSchedule[sunStr] = { shiftCode: 'R' };
    }

    setSchedule(newSchedule);
  };

  // Quick pattern application from modal
  const handleApplyPattern = (newSchedule) => {
    setSchedule(newSchedule);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#eef7f2] text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col selection:bg-emerald-200 selection:text-emerald-950 dark:selection:bg-yellow-400 dark:selection:text-slate-950 transition-colors duration-200">
      
      {/* Top Navigation */}
      <Navbar
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenWeekPattern={() => setIsWeekPatternOpen(true)}
        onOpenShiftPicker={() => setIsShiftPickerOpen(true)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {activeTab === 'calendar' ? (
          <>
            {/* Monthly Calendar View (mostrata pulita a schermo intero) */}
            <div className="flex-1 pb-24 sm:pb-20">
              <CalendarMonth
                currentDate={currentDate}
                schedule={schedule}
                shifts={shifts}
                modifiersList={modifiersList}
                brushMode={brushMode}
                selectedShiftId={selectedShiftId}
                onDayClick={handleDayClick}
                onDayLongPress={handleDayLongPress}
                onFillWeekDays={handleFillWeekDays}
                onFillWeekFull={handleFillWeekFull}
              />
            </div>

            {/* Pulsante Flottante per aprire la selezione turni (visibile quando non stiamo inserendo) */}
            {!brushMode && (
              <button
                onClick={() => setIsShiftPickerOpen(true)}
                className="fixed bottom-6 right-5 sm:right-8 z-20 flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-900/20 dark:shadow-yellow-400/30 hover:scale-105 active:scale-95 transition-all"
                title="Scegli un turno da assegnare con un tocco"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Assegna Turno</span>
              </button>
            )}

            {/* Banner Flottante durante la modalità inserimento rapido */}
            {brushMode && selectedShiftId && (
              <ActiveShiftBanner
                activeShiftId={selectedShiftId}
                shifts={shifts}
                onChangeShift={() => setIsShiftPickerOpen(true)}
                onDone={handleStopAssigning}
              />
            )}
          </>
        ) : (
          /* Stats & Reports Tab */
          <div className="flex-1 pb-12">
            <StatsView
              schedule={schedule}
              shifts={shifts}
              currentDate={currentDate}
              onOpenExport={() => setIsExportOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <ShiftPickerModal
        isOpen={isShiftPickerOpen}
        onClose={() => setIsShiftPickerOpen(false)}
        shifts={shifts}
        onSelectShift={handleSelectShiftToAssign}
        onOpenWeekPattern={() => setIsWeekPatternOpen(true)}
      />

      <DayEditModal
        isOpen={!!editingDayDate}
        onClose={() => setEditingDayDate(null)}
        date={editingDayDate}
        scheduleEntry={editingDayDate ? schedule[format(editingDayDate, 'yyyy-MM-dd')] : null}
        shifts={shifts}
        modifiersList={modifiersList}
        onSaveDay={handleSaveDay}
        onDeleteDay={handleDeleteDay}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        shifts={shifts}
        setShifts={setShifts}
        modifiersList={modifiersList}
        setModifiersList={setModifiersList}
        schedule={schedule}
        setSchedule={setSchedule}
        settings={settings}
        setSettings={setSettings}
      />

      <WeekPatternModal
        isOpen={isWeekPatternOpen}
        onClose={() => setIsWeekPatternOpen(false)}
        currentDate={currentDate}
        shifts={shifts}
        schedule={schedule}
        onApplyPattern={handleApplyPattern}
      />

      <IcsExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentDate={currentDate}
        schedule={schedule}
        shifts={shifts}
        theme={settings.theme}
      />

    </div>
  );
}
