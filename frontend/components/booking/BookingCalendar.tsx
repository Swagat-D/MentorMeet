// components/booking/BookingCalendar.tsx - Enhanced Calendar with Accurate Date Handling
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import bookingService, { TimeSlot } from '@/services/bookingService';
import { MentorProfile } from '@/services/mentorService';

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - 40;
const DAY_WIDTH = CALENDAR_WIDTH / 7;

interface BookingCalendarProps {
  mentor: MentorProfile;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  hasSlots: boolean;
}

export default function BookingCalendar({ 
  mentor, 
  onSlotSelect, 
  selectedSlot 
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Get today's date for comparison
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // First day to show (start of calendar grid)
    const firstDayToShow = new Date(firstDayOfMonth);
    firstDayToShow.setDate(firstDayToShow.getDate() - firstDayOfMonth.getDay());
    
    // Generate 42 days (6 weeks) for calendar grid
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(firstDayToShow);
      date.setDate(firstDayToShow.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const isSelected = selectedDate ? 
        date.toDateString() === selectedDate.toDateString() : false;
      
      days.push({
        date: new Date(date),
        dateString,
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isSelected,
        hasSlots: false, // Will be updated when we check availability
      });
    }
    
    return days;
  }, [currentDate, selectedDate, today]);

  // Load slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, mentor._id]);

  // Reset selected slot when calendar changes
  useEffect(() => {
    if (selectedSlot && selectedDate) {
      const slotDate = new Date(selectedSlot.startTime).toDateString();
      const selectedDateString = selectedDate.toDateString();
      
      if (slotDate !== selectedDateString) {
        onSlotSelect(selectedSlot); // Clear selection if date doesn't match
      }
    }
  }, [selectedDate, selectedSlot, onSlotSelect]);

  const loadAvailableSlots = async (date: Date) => {
    try {
      setLoadingSlots(true);
      setAvailableSlots([]);
      
      const dateString = date.toISOString().split('T')[0];
      console.log('📅 Loading slots for:', dateString);
      
      const slots = await bookingService.getAvailableSlots(mentor._id, dateString);
      
      // Filter out past slots for today
      const now = new Date();
      const filteredSlots = slots.filter(slot => {
        const slotTime = new Date(slot.startTime);
        return slotTime > now;
      });
      
      setAvailableSlots(filteredSlots);
      console.log('✅ Loaded slots:', filteredSlots.length);
      
    } catch (error: any) {
      console.error('❌ Error loading slots:', error);
      Alert.alert(
        'Error Loading Slots',
        'Failed to load available time slots. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (day: CalendarDay) => {
    if (day.isPast || !day.isCurrentMonth) return;
    
    // If clicking the same date, deselect it
    if (selectedDate && day.date.toDateString() === selectedDate.toDateString()) {
      setSelectedDate(null);
      setAvailableSlots([]);
      return;
    }
    
    setSelectedDate(day.date);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    onSlotSelect(slot);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    setCurrentDate(newDate);
    setSelectedDate(null);
    setAvailableSlots([]);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = (price: number) => {
    return `$${price}`;
  };

  const getDayStyle = (day: CalendarDay) => {
    if (!day.isCurrentMonth) {
      return [calendarStyles.dayButton, calendarStyles.dayButtonInactive];
    } else if (day.isPast) {
      return [calendarStyles.dayButton, calendarStyles.dayButtonPast];
    } else if (day.isSelected) {
      return [calendarStyles.dayButton, calendarStyles.dayButtonSelected];
    } else if (day.isToday) {
      return [calendarStyles.dayButton, calendarStyles.dayButtonToday];
    }
    return [calendarStyles.dayButton];
  };

  const getDayTextStyle = (day: CalendarDay) => {
    const styles = [calendarStyles.dayText];
    
    if (!day.isCurrentMonth || day.isPast) {
      styles.push(calendarStyles.dayTextInactive);
    } else if (day.isSelected) {
      styles.push(calendarStyles.dayTextSelected);
    } else if (day.isToday) {
      styles.push(calendarStyles.dayTextToday);
    }
    
    return styles;
  };

  const getSlotStyle = (slot: TimeSlot) => {
    const styles = [calendarStyles.timeSlot];
    
    if (!slot.isAvailable) {
      styles.push(calendarStyles.timeSlotUnavailable);
    } else if (selectedSlot?.id === slot.id) {
      styles.push(calendarStyles.timeSlotSelected);
    }
    
    return styles;
  };

  const getSlotTextStyle = (slot: TimeSlot) => {
    const styles = [calendarStyles.timeSlotText];
    
    if (!slot.isAvailable) {
      styles.push(calendarStyles.timeSlotTextUnavailable);
    } else if (selectedSlot?.id === slot.id) {
      styles.push(calendarStyles.timeSlotTextSelected);
    }
    
    return styles;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={calendarStyles.container}>
      {/* Calendar Header */}
      <View style={calendarStyles.calendarHeader}>
        <TouchableOpacity
          style={calendarStyles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <MaterialIcons name="chevron-left" size={24} color="#8B4513" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={calendarStyles.monthYearContainer}
          onPress={goToToday}
        >
          <Text style={calendarStyles.monthText}>
            {monthNames[currentDate.getMonth()]}
          </Text>
          <Text style={calendarStyles.yearText}>
            {currentDate.getFullYear()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={calendarStyles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <MaterialIcons name="chevron-right" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={calendarStyles.todayButton}
        onPress={goToToday}
      >
        <MaterialIcons name="today" size={16} color="#8B4513" />
        <Text style={calendarStyles.todayButtonText}>Today</Text>
      </TouchableOpacity>

      {/* Day Names Header */}
      <View style={calendarStyles.dayNamesContainer}>
        {dayNames.map((day, index) => (
          <View key={index} style={calendarStyles.dayNameItem}>
            <Text style={calendarStyles.dayNameText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={calendarStyles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={`${day.dateString}-${index}`}
            style={getDayStyle(day)}
            onPress={() => handleDateSelect(day)}
            disabled={day.isPast || !day.isCurrentMonth}
            activeOpacity={0.7}
          >
            <Text style={getDayTextStyle(day)}>
              {day.dayNumber}
            </Text>
            {/* Availability indicator */}
            {day.isCurrentMonth && !day.isPast && day.hasSlots && (
              <View style={calendarStyles.slotIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Time Slots Section */}
      {selectedDate && (
        <View style={calendarStyles.timeSlotsSection}>
          <View style={calendarStyles.timeSlotsHeader}>
            <MaterialIcons name="schedule" size={20} color="#8B4513" />
            <Text style={calendarStyles.timeSlotsTitle}>
              Available Times - {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          {loadingSlots ? (
            <View style={calendarStyles.slotsLoadingContainer}>
              <ActivityIndicator size="small" color="#8B4513" />
              <Text style={calendarStyles.slotsLoadingText}>Loading available times...</Text>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={calendarStyles.noSlotsContainer}>
              <MaterialIcons name="event-busy" size={32} color="#8B7355" />
              <Text style={calendarStyles.noSlotsTitle}>No Available Times</Text>
              <Text style={calendarStyles.noSlotsText}>
                This mentor has no available time slots on this date. Please try another date.
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={calendarStyles.timeSlotsContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={calendarStyles.timeSlotsContent}
            >
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={`${slot.id}-${index}`}
                  style={getSlotStyle(slot)}
                  onPress={() => handleSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                  activeOpacity={0.8}
                >
                  <View style={calendarStyles.timeSlotContent}>
                    <View style={calendarStyles.timeSlotLeft}>
                      <Text style={getSlotTextStyle(slot)}>
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </Text>
                      <Text style={calendarStyles.timeSlotDuration}>
                        {slot.duration} minutes • {slot.sessionType}
                      </Text>
                    </View>
                    
                    <View style={calendarStyles.timeSlotRight}>
                      <Text style={[calendarStyles.timeSlotPrice, getSlotTextStyle(slot)]}>
                        {formatPrice(slot.price)}
                      </Text>
                      {slot.isAvailable ? (
                        <MaterialIcons 
                          name={selectedSlot?.id === slot.id ? "radio-button-checked" : "radio-button-unchecked"}
                          size={20} 
                          color={selectedSlot?.id === slot.id ? "#FFFFFF" : "#8B7355"} 
                        />
                      ) : (
                        <MaterialIcons name="block" size={20} color="#DC2626" />
                      )}
                    </View>
                  </View>
                  
                  {!slot.isAvailable && (
                    <Text style={calendarStyles.unavailableText}>
                      This time slot is no longer available
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Google Calendar Integration Notice */}
      <View style={calendarStyles.calendarNotice}>
        <MaterialIcons name="info" size={16} color="#8B7355" />
        <Text style={calendarStyles.calendarNoticeText}>
          Availability synced with Google Calendar in real-time
        </Text>
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },

  // Calendar Header
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F3EE',
  },
  monthYearContainer: {
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  yearText: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },

  // Today Button
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8F3EE',
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
  todayButtonText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Day Names
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayNameItem: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7355',
  },

  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayButton: {
    width: DAY_WIDTH,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
    borderRadius: 8,
  },
  dayButtonInactive: {
    opacity: 0.3,
    backgroundColor: 'transparent',
  },
  dayButtonPast: {
    opacity: 0.5,
  },
  dayButtonSelected: {
    backgroundColor: '#8B4513',
  },
  dayButtonToday: {
    backgroundColor: '#F8F3EE',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  dayTextInactive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B7355',
  },
  dayTextSelected: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dayTextToday: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4513',
  },
  slotIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  // Time Slots Section
  timeSlotsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
  },
  timeSlotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginLeft: 8,
    flex: 1,
  },

  // Slots Loading
  slotsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  slotsLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8B7355',
  },

  // No Slots
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 12,
    marginBottom: 8,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Time Slots List
  timeSlotsContainer: {
    maxHeight: 240,
  },
  timeSlotsContent: {
    paddingBottom: 10,
  },
  timeSlot: {
    backgroundColor: '#F8F3EE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  timeSlotUnavailable: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  timeSlotSelected: {
    ...Platform.select({
      ios: {
        shadowColor: '#8B4513',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  timeSlotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSlotLeft: {
    flex: 1,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  timeSlotTextUnavailable: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timeSlotTextSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timeSlotDuration: {
    fontSize: 12,
    color: '#8B7355',
  },
  timeSlotRight: {
    alignItems: 'flex-end',
  },
  timeSlotPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  unavailableText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Calendar Notice
  calendarNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  calendarNoticeText: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 6,
  },
});