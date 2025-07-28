// components/booking/BookingCalendar.tsx - Enhanced Responsive Calendar
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
import { LinearGradient } from 'expo-linear-gradient';
import bookingService, { TimeSlot } from '@/services/bookingService';
import { MentorProfile } from '@/services/mentorService';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

// Responsive calculations
const CONTAINER_PADDING = isTablet ? 40 : 20;
const CALENDAR_PADDING = 20;
const CALENDAR_WIDTH = width - (CONTAINER_PADDING * 2) - (CALENDAR_PADDING * 2);
const DAY_WIDTH = CALENDAR_WIDTH / 7;
const DAY_HEIGHT = isTablet ? 52 : 44;

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
  dayOfWeek: number;
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

  // Get today's date for comparison (fixed timezone handling)
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Generate calendar days with correct day alignment
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // First day to show (start of calendar grid) - properly aligned
    const firstDayToShow = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    firstDayToShow.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    // Generate exactly 42 days (6 weeks) for consistent grid
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(firstDayToShow);
      date.setDate(firstDayToShow.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
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
        dayOfWeek: date.getDay(),
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
        return slotTime > now && slot.isAvailable;
      });
      
      setAvailableSlots(filteredSlots);
      console.log('✅ Loaded available slots:', filteredSlots.length);
      
    } catch (error: any) {
      console.error('❌ Error loading slots:', error);
      Alert.alert(
        'Error Loading Slots',
        'Unable to load available time slots. Please check your connection and try again.',
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
    const baseStyle = [styles.dayButton];
    
    if (!day.isCurrentMonth) {
      baseStyle.push(styles.dayButtonInactive as any);
    } else if (day.isPast) {
      baseStyle.push(styles.dayButtonPast as any);
    } else if (day.isSelected) {
      baseStyle.push(styles.dayButtonSelected as any);
    } else if (day.isToday) {
      baseStyle.push(styles.dayButtonToday as any);
    }
    
    return baseStyle;
  };

  const getDayTextStyle = (day: CalendarDay) => {
    const baseStyle = [styles.dayText];
    
    if (!day.isCurrentMonth || day.isPast) {
      baseStyle.push(styles.dayTextInactive as any);
    } else if (day.isSelected) {
      baseStyle.push(styles.dayTextSelected as any);
    } else if (day.isToday) {
      baseStyle.push(styles.dayTextToday as any);
    }
    
    return baseStyle;
  };

  const getSlotStyle = (slot: TimeSlot) => {
    const baseStyle = [styles.timeSlot];
    
    if (!slot.isAvailable) {
      baseStyle.push(styles.timeSlotUnavailable as any);
    } else if (selectedSlot?.id === slot.id) {
      baseStyle.push(styles.timeSlotSelected as any);
    }
    
    return baseStyle;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Split calendar into weeks for better layout
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={24} color="#8B4513" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.monthYearContainer}
          onPress={goToToday}
          activeOpacity={0.7}
        >
          <Text style={styles.monthText}>
            {monthNames[currentDate.getMonth()]}
          </Text>
          <Text style={styles.yearText}>
            {currentDate.getFullYear()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-right" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Today Button */}
      <TouchableOpacity 
        style={styles.todayButton}
        onPress={goToToday}
        activeOpacity={0.7}
      >
        <MaterialIcons name="today" size={16} color="#8B4513" />
        <Text style={styles.todayButtonText}>Go to Today</Text>
      </TouchableOpacity>

      {/* Day Names Header */}
      <View style={styles.dayNamesContainer}>
        {dayNames.map((day, index) => (
          <View key={index} style={styles.dayNameItem}>
            <Text style={styles.dayNameText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid - Week by Week */}
      <View style={styles.calendarGrid}>
        {calendarWeeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {week.map((day, dayIndex) => (
              <TouchableOpacity
                key={`${day.dateString}-${dayIndex}`}
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
                  <View style={styles.slotIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Time Slots Section */}
      {selectedDate && (
        <View style={styles.timeSlotsSection}>
          <LinearGradient
            colors={['#F8F3EE', '#FFFFFF']}
            style={styles.timeSlotsHeader}
          >
            <MaterialIcons name="schedule" size={20} color="#8B4513" />
            <Text style={styles.timeSlotsTitle}>
              Available Times - {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </LinearGradient>

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
              style={styles.timeSlotsScrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsContent}
            >
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={`${slot.id}-${index}`}
                  style={getSlotStyle(slot)}
                  onPress={() => handleSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={selectedSlot?.id === slot.id 
                      ? ['#8B4513', '#D2691E'] 
                      : ['#FFFFFF', '#F8F3EE']
                    }
                    style={styles.timeSlotGradient}
                  >
                    <View style={styles.timeSlotContent}>
                      <View style={styles.timeSlotLeft}>
                        <Text style={[
                          styles.timeSlotTime,
                          selectedSlot?.id === slot.id && styles.timeSlotTimeSelected
                        ]}>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </Text>
                        <Text style={[
                          styles.timeSlotDuration,
                          selectedSlot?.id === slot.id && styles.timeSlotDurationSelected
                        ]}>
                          {slot.duration} minutes • Google Meet
                        </Text>
                      </View>
                      
                      <View style={styles.timeSlotRight}>
                        <Text style={[
                          styles.timeSlotPrice,
                          selectedSlot?.id === slot.id && styles.timeSlotPriceSelected
                        ]}>
                          {formatPrice(slot.price)}
                        </Text>
                        <MaterialIcons 
                          name={selectedSlot?.id === slot.id ? "radio-button-checked" : "radio-button-unchecked"}
                          size={20} 
                          color={selectedSlot?.id === slot.id ? "#FFFFFF" : "#8B4513"} 
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Integration Notice */}
      <View style={styles.integrationNotice}>
        <MaterialIcons name="info" size={14} color="#10B981" />
        <Text style={styles.integrationNoticeText}>
          Sessions are automatically scheduled with Google Meet and Calendar
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: CALENDAR_PADDING,
    margin: isTablet ? 20 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },

  // Calendar Header
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: isTablet ? 8 : 4,
  },
  navButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B4513',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  monthYearContainer: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  monthText: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  yearText: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    marginTop: 2,
    textAlign: 'center',
  },

  // Today Button
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8F3EE',
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  todayButtonText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Day Names
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  dayNameItem: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#8B7355',
    textAlign: 'center',
  },

  // Calendar Grid
  calendarGrid: {
    marginBottom: 20,
  },
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayButton: {
    width: DAY_WIDTH,
    height: DAY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 1,
    position: 'relative',
  },
  dayButtonInactive: {
    opacity: 0.3,
  },
  dayButtonPast: {
    opacity: 0.5,
  },
  dayButtonSelected: {
    backgroundColor: '#8B4513',
    ...Platform.select({
      ios: {
        shadowColor: '#8B4513',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayButtonToday: {
    backgroundColor: '#F8F3EE',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  dayText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  dayTextInactive: {
    color: '#C0C0C0',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextToday: {
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
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
    paddingTop: 20,
  },
  timeSlotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  timeSlotsTitle: {
    fontSize: isTablet ? 18 : 16,
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
    paddingVertical: 32,
  },
  slotsLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8B7355',
  },

  // No Slots
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noSlotsTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Time Slots List
  timeSlotsScrollContainer: {
    maxHeight: isTablet ? 320 : 280,
  },
  timeSlotsContent: {
    paddingBottom: 16,
  },
  timeSlot: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timeSlotUnavailable: {
    opacity: 0.6,
    borderColor: '#E5E7EB',
  },
  timeSlotSelected: {
    borderColor: '#8B4513',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#8B4513',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  timeSlotGradient: {
    padding: isTablet ? 20 : 16,
  },
  timeSlotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSlotLeft: {
    flex: 1,
  },
  timeSlotTime: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  timeSlotTimeSelected: {
    color: '#FFFFFF',
  },
  timeSlotDuration: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  timeSlotDurationSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  timeSlotRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  timeSlotPrice: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 6,
  },
  timeSlotPriceSelected: {
    color: '#FFFFFF',
  },

  // Integration Notice
  integrationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F0FDF4',
    marginHorizontal: -20,
    marginBottom: -20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  integrationNoticeText: {
    fontSize: 11,
    color: '#166534',
    marginLeft: 6,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});