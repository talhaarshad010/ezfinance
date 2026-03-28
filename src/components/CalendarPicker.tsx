import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Typography, Button } from '.';

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;
  maxDate?: Date;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const generateYears = (currentYear: number) => {
  const years = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
};

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ visible, onClose, onSelectDate, initialDate, maxDate }) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  // Helpers to get calendar grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrev = () => {
    if (viewMode === 'days') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'years') {
      setCurrentDate(new Date(currentDate.getFullYear() - 20, currentDate.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'years') {
      setCurrentDate(new Date(currentDate.getFullYear() + 20, currentDate.getMonth(), 1));
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleApply = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  const renderDaysView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const blanks = Array.from({ length: firstDay }).map((_, i) => <View key={`blank-${i}`} style={styles.dateCell} />);
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

      const isFuture = maxDate && new Date(year, month, day) > maxDate;

      return (
        <TouchableOpacity 
          key={`day-${day}`} 
          style={[styles.dateCell, isSelected && styles.dateCellSelected]} 
          onPress={() => !isFuture && handleSelectDay(day)}
          disabled={isFuture}
        >
          <Typography 
            variant="body" 
            weight={isSelected || isToday ? '700' : '500'} 
            color={isSelected ? '#FFF' : isFuture ? '#CCC' : isToday ? '#0047AB' : '#333'}
          >
            {day}
          </Typography>
        </TouchableOpacity>
      );
    });

    return (
      <View>
        <View style={styles.daysHeader}>
          {DAYS_OF_WEEK.map(d => (
            <View key={d} style={styles.dayLabelCell}>
              <Typography variant="caption" weight="700" color="#AAA">{d}</Typography>
            </View>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {blanks}
          {days}
        </View>
      </View>
    );
  };

  const renderMonthsView = () => (
    <View style={styles.grid}>
      {MONTHS.map((m, i) => (
        <TouchableOpacity 
          key={m} 
          style={styles.gridItem} 
          onPress={() => {
            setCurrentDate(new Date(currentDate.getFullYear(), i, 1));
            setViewMode('days');
          }}
        >
          <Typography variant="body" weight={currentDate.getMonth() === i ? '700' : '500'} color={currentDate.getMonth() === i ? '#0047AB' : '#333'}>
            {m.substring(0, 3)}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderYearsView = () => {
    const years = generateYears(currentDate.getFullYear());
    return (
      <View style={styles.grid}>
         {years.map(y => (
            <TouchableOpacity 
              key={y} 
              style={styles.gridItem} 
              onPress={() => {
                setCurrentDate(new Date(y, currentDate.getMonth(), 1));
                setViewMode('months');
              }}
            >
              <Typography variant="body" weight={currentDate.getFullYear() === y ? '700' : '500'} color={currentDate.getFullYear() === y ? '#0047AB' : '#333'}>
                {y}
              </Typography>
            </TouchableOpacity>
         ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <Typography variant="h2">{selectedDate.toDateString()}</Typography>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handlePrev} style={styles.controlBtn}>
               <Feather name="chevron-left" size={20} color="#000" />
            </TouchableOpacity>
            
            <View style={{flexDirection: 'row'}}>
               <TouchableOpacity onPress={() => setViewMode(viewMode === 'months' ? 'days' : 'months')} style={{marginRight: 16}}>
                 <Typography variant="body" weight="700">{MONTHS[currentDate.getMonth()]}</Typography>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}>
                 <Typography variant="body" weight="700">{currentDate.getFullYear()}</Typography>
               </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleNext} style={styles.controlBtn}>
               <Feather name="chevron-right" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {viewMode === 'days' && renderDaysView()}
          {viewMode === 'months' && renderMonthsView()}
          {viewMode === 'years' && renderYearsView()}

          <Button title="Apply Date" onPress={handleApply} style={{marginTop: 24}} />

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  controlBtn: {
    padding: 8,
  },
  daysHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dayLabelCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dateCellSelected: {
    backgroundColor: '#000',
    borderRadius: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 250,
  },
  gridItem: {
    width: '33.33%',
    paddingVertical: 24,
    alignItems: 'center',
  }
});
