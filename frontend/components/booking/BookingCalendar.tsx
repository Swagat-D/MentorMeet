// components/booking/BookingCalendar.tsx - Professional Calendar with Google Integration
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';
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
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  slots: TimeSlot[];
  isSelected: boolean;
}

export default function BookingCalendar({ 
  mentor, 
  onSlotSelect, 
  selectedSlot 
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Generate calendar days for current month
  useEffect(() => {
    generateCalendarDays();
  }, [currentDate]);

  // Load slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, mentor._id]);

  const generateCalendarDays = () => {
    setLoadingCalendar(true);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month and how many days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const dateString = date.toISOString().split('T')[0];
      
      days.push({
        date: new Date(date),
        dateString,
        isCurrentMonth,
        isToday,
        isPast,
        slots: [],
        isSelected: selectedDate?.toDateString() === date.toDateString(),
      });
    }
    
    setCalendarDays(days);
    setLoadingCalendar(false);
  };

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
        'Error',
        'Failed to load available time slots. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (day: CalendarDay) => {
    if (day.isPast || !day.isCurrentMonth) return;
    
    setSelectedDate(day.date);
    
    // Update calendar days to reflect selection
    setCalendarDays(prev => 
      prev.map(d => ({
        ...d,
        isSelected: d.dateString === day.dateString
      }))
    );
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

  const getDayStyle = (day: CalendarDay): StyleProp<ViewStyle>[] => {
    const style: StyleProp<ViewStyle>[] = [styles.dayButton];
    
    if (!day.isCurrentMonth) {
      style.push(styles.dayButtonInactive);
    } else if (day.isPast) {
      style.push(styles.dayButtonPast);
    } else if (day.isSelected) {
      style.push(styles.dayButtonSelected);
    } else if (day.isToday) {
      style.push(styles.dayButtonToday);
    }
    
    return style;
  };

  const getDayTextStyle = (day: CalendarDay) => {
    let style = [styles.dayText];
    
    if (!day.isCurrentMonth || day.isPast) {
      style.push(styles.dayTextInactive);
    } else if (day.isSelected) {
      style.push(styles.dayTextSelected);
    } else if (day.isToday) {
      style.push(styles.dayTextToday);
    }
    
    return style;
  };

  const getSlotStyle = (slot: TimeSlot) => {
    let style = [styles.timeSlot];
    
    if (!slot.isAvailable) {
      style.push(styles.timeSlotUnavailable);
    } else if (selectedSlot?.id === slot.id) {
      style.push(styles.timeSlotSelected);
    }
    
    return style;
  };

  const getSlotTextStyle = (slot: TimeSlot) => {
    let style = [styles.timeSlotText];
    
    if (!slot.isAvailable) {
      style.push(styles.timeSlotTextUnavailable);
    } else if (selectedSlot?.id === slot.id) {
      style.push(styles.timeSlotTextSelected);
    }
    
    return style;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <MaterialIcons name="chevron-left" size={24} color="#8B4513" />
        </TouchableOpacity>
        
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthText}>
            {monthNames[currentDate.getMonth()]}
          </Text>
          <Text style={styles.yearText}>
            {currentDate.getFullYear()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <MaterialIcons name="chevron-right" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Day Names Header */}
      <View style={styles.dayNamesContainer}>
        {dayNames.map((day, index) => (
          <View key={index} style={styles.dayNameItem}>
            <Text style={styles.dayNameText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {loadingCalendar ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      ) : (
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={getDayStyle(day)}
              onPress={() => handleDateSelect(day)}
              disabled={day.isPast || !day.isCurrentMonth}
            >
              <Text style={getDayTextStyle(day)}>
                {day.date.getDate()}
              </Text>
              {/* Show dot indicator if slots are available */}
              {day.isCurrentMonth && !day.isPast && day.slots.length > 0 && (
                <View style={styles.slotIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Time Slots Section */}
      {selectedDate && (
        <View style={styles.timeSlotsSection}>
          <View style={styles.timeSlotsHeader}>
            <MaterialIcons name="schedule" size={20} color="#8B4513" />
            <Text style={styles.timeSlotsTitle}>
              Available Times - {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          {loadingSlots ? (
            <View style={styles.slotsLoadingContainer}>
              <ActivityIndicator size="small" color="#8B4513" />
              <Text style={styles.slotsLoadingText}>Loading available times...</Text>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <MaterialIcons name="event-busy" size={32} color="#8B7355" />
              <Text style={styles.noSlotsTitle}>No Available Times</Text>
              <Text style={styles.noSlotsText}>
                This mentor has no available time slots on this date. Please try another date.
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.timeSlotsContainer}
              showsVerticalScrollIndicator={false}
            >
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={slot.id}
                  style={getSlotStyle(slot)}
                  onPress={() => handleSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                >
                  <View style={styles.timeSlotContent}>
                    <View style={styles.timeSlotLeft}>
                      <Text style={getSlotTextStyle(slot)}>
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </Text>
                      <Text style={styles.timeSlotDuration}>
                        {slot.duration} minutes • {slot.sessionType}
                      </Text>
                    </View>
                    
                    <View style={styles.timeSlotRight}>
                      <Text style={[styles.timeSlotPrice, getSlotTextStyle(slot)]}>
                        {formatPrice(slot.price)}
                      </Text>
                      {slot.isAvailable ? (
                        <MaterialIcons 
                          name="radio-button-unchecked" 
                          size={20} 
                          color={selectedSlot?.id === slot.id ? "#8B4513" : "#8B7355"} 
                        />
                      ) : (
                        <MaterialIcons name="block" size={20} color="#DC2626" />
                      )}
                    </View>
                  </View>
                  
                  {!slot.isAvailable && (
                    <Text style={styles.unavailableText}>
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
      <View style={styles.calendarNotice}>
        <MaterialIcons name="info" size={16} color="#8B7355" />
        <Text style={styles.calendarNoticeText}>
          Availability synced with Google Calendar in real-time
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F3EE',
  },
  monthYearContainer: {
    alignItems: 'center',
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

  // Loading States
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  dayButtonInactive: {
    opacity: 0.3,
  },
  dayButtonPast: {
    opacity: 0.5,
  },
  dayButtonSelected: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
  },
  dayButtonToday: {
    backgroundColor: '#F8F3EE',
    borderRadius: 8,
    borderWidth: 1,
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
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dayTextToday: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
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
  },

  // Time Slots List
  timeSlotsContainer: {
    maxHeight: 200,
  },
  timeSlot: {
    backgroundColor: '#F8F3EE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  timeSlotUnavailable: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.6,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  timeSlotSelected: {
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