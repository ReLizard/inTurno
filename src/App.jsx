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
import ShiftPalette from './components/ShiftPalette';
import CalendarMonth from './components/CalendarMonth';
import DayEditModal from './components/DayEditModal';
import StatsView from './components/StatsView';
import SettingsModal from './components/SettingsModal';
import WeekPatternModal from './components/WeekPatternModal';
import IcsExportModal from './components/IcsExportModal';

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
  const [selectedShiftId, setSelectedShiftId] = useState('m1');
  const [brushMode, setBrushMode] = useState(true);

  // Modal states
  const [editingDayDate, setEditingDayDate] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWeekPatternOpen, setIsWeekPatternOpen] = useState(false);

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

  // Quick Action: Fill Week Lun-Ven with active brush shift
  const handleFillWeekDays = (weekDays) => {
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

    // Sunday = Rest
    const sunDateStr = format(weekDays[6], 'yyyy-MM-dd');
    if (!newSchedule[sunDateStr] && selectedShiftId !== '__ERASER__') {
      newSchedule[sunDateStr] = { shiftCode: 'R' };
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-yellow-400 selection:text-slate-950">
      
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
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'calendar' ? (
          <>
            {/* Quick Shift Palette / Brush bar */}
            <div className="shift-palette sticky top-[61px] sm:top-[65px] z-20">
              <ShiftPalette
                shifts={shifts}
                selectedShiftId={selectedShiftId}
                onSelectShift={setSelectedShiftId}
                brushMode={brushMode}
                setBrushMode={setBrushMode}
                onOpenWeekPattern={() => setIsWeekPatternOpen(true)}
              />
            </div>

            {/* Monthly Calendar View */}
            <div className="flex-1 pb-12">
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
      />

    </div>
  );
}
