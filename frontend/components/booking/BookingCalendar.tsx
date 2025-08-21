// frontend/components/booking/BookingCalendar.tsx - Updated for Manual Schedule
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

const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface BookingCalendarProps {
  mentor: MentorProfile;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayToShow = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    firstDayToShow.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(firstDayToShow);
      date.setDate(firstDayToShow.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const isSelected = selectedDate ? 
        date.toDateString() === selectedDate.toDateString() : false;
      
      // Check if mentor has availability on this day
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const hasAvailability = mentor.weeklySchedule && 
        mentor.weeklySchedule[dayName] && 
        mentor.weeklySchedule[dayName].isAvailable &&
        mentor.weeklySchedule[dayName].timeSlots &&
        mentor.weeklySchedule[dayName].timeSlots.length > 0;
      
      days.push({
        date: new Date(date),
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isSelected,
        hasAvailability,
      });
    }
    
    return days;
  }, [currentDate, selectedDate, today, mentor.weeklySchedule]);

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
      setErrorMessage(null);
      
      // Format date for API (local date without timezone conversion)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      console.log('📅 Loading manual slots for:', dateString);
      
      const slots = await bookingService.getAvailableSlots(mentor._id, dateString);
      
      console.log('✅ Loaded available slots:', slots.length);
      setAvailableSlots(slots);
      
    } catch (error: any) {
      console.error('❌ Error loading slots:', error);
      setErrorMessage(error.message);
      
      // Show user-friendly error dialog
      const errorTitle = getErrorTitle(error.message);
      const errorSuggestion = getErrorSuggestion(error.message);
      
      Alert.alert(
        errorTitle,
        errorSuggestion,
        [{ text: 'OK' }]
      );
      
    } finally {
      setLoadingSlots(false);
    }
  };

  const getErrorTitle = (errorMessage: string): string => {
    if (errorMessage.includes('Past dates')) return 'Select Future Date';
    if (errorMessage.includes('profile setup')) return 'Profile Incomplete';
    if (errorMessage.includes('schedule')) return 'No Schedule Available';
    if (errorMessage.includes('availability')) return 'Service Unavailable';
    return 'No Available Times';
  };

  const getErrorSuggestion = (errorMessage: string): string => {
    if (errorMessage.includes('Past dates')) {
      return 'Please select tomorrow or a future date for booking.';
    }
    if (errorMessage.includes('profile setup')) {
      return 'This mentor is still setting up their profile. Please check back later.';
    }
    if (errorMessage.includes('schedule')) {
      return 'This mentor hasn\'t configured their availability schedule yet.';
    }
    if (errorMessage.includes('availability')) {
      return 'Unable to load availability right now. Please check your internet connection and try again.';
    }
    return 'This mentor doesn\'t have available slots for this date. Try selecting a different date.';
  };

  const handleDateSelect = (day: any) => {
    if (!day.isCurrentMonth) return;
    
    // Check if it's past date
    if (day.isPast) {
      const message = day.isToday 
        ? 'For the best experience, please book sessions at least 2 hours in advance. Try selecting tomorrow or a future date.'
        : 'Please select tomorrow or a future date for booking.';
      
      Alert.alert('Select Future Date', message, [{ text: 'OK' }]);
      return;
    }
    
    // Check if mentor has availability on this day
    if (!day.hasAvailability) {
      const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
      Alert.alert(
        'No Availability',
        `${mentor.displayName} doesn't have availability scheduled for ${dayName}s. Please select a different day.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Toggle date selection
    if (selectedDate && day.date.toDateString() === selectedDate.toDateString()) {
      setSelectedDate(null);
      setAvailableSlots([]);
      setErrorMessage(null);
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
    setErrorMessage(null);
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
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getDurationLabel = (duration: number) => {
    if (duration <= 30) return 'Quick Session';
    if (duration <= 60) return 'Standard Session';
    if (duration <= 90) return 'Extended Session';
    return 'Long Session';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={24} color="#8B4513" />
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-right" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Mentor Schedule Summary */}
      {mentor.weeklySchedule && (
        <View style={styles.scheduleInfo}>
          <MaterialIcons name="info-outline" size={16} color="#8B7355" />
          <Text style={styles.scheduleInfoText}>
            Available: {Object.entries(mentor.weeklySchedule)
              .filter(([_, daySchedule]) => daySchedule.isAvailable)
              .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
              .join(', ')}
          </Text>
        </View>
      )}

      {/* Day Names */}
      <View style={styles.dayNamesContainer}>
        {dayNames.map((day, index) => (
          <View key={index} style={styles.dayNameItem}>
            <Text style={styles.dayNameText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarWeeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {week.map((day, dayIndex) => (
              <TouchableOpacity
                key={`${day.date.toISOString()}-${dayIndex}`}
                style={[
                  styles.dayButton,
                  !day.isCurrentMonth && styles.dayButtonInactive,
                  day.isPast && styles.dayButtonPast,
                  day.isSelected && styles.dayButtonSelected,
                  day.isToday && !day.isSelected && styles.dayButtonToday,
                  day.hasAvailability && day.isCurrentMonth && !day.isPast && styles.dayButtonAvailable,
                ]}
                onPress={() => handleDateSelect(day)}
                disabled={day.isPast || !day.isCurrentMonth}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayText,
                  (!day.isCurrentMonth || day.isPast) && styles.dayTextInactive,
                  day.isSelected && styles.dayTextSelected,
                  day.isToday && !day.isSelected && styles.dayTextToday,
                ]}>
                  {day.dayNumber}
                </Text>
                {day.hasAvailability && day.isCurrentMonth && !day.isPast && !day.isSelected && (
                  <View style={styles.availabilityDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Time Slots Section */}
      {selectedDate && (
        <View style={styles.timeSlotsSection}>
          <View style={styles.slotsHeader}>
            <MaterialIcons name="schedule" size={20} color="#8B4513" />
            <Text style={styles.slotsTitle}>
              Available Times - {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          {loadingSlots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B4513" />
              <Text style={styles.loadingText}>Loading available times...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="event-busy" size={32} color="#DC2626" />
              <Text style={styles.errorTitle}>Unable to Load Slots</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => loadAvailableSlots(selectedDate)}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <MaterialIcons name="event-busy" size={32} color="#8B7355" />
              <Text style={styles.noSlotsTitle}>No Available Times</Text>
              <Text style={styles.noSlotsText}>
                This mentor doesn't have available slots for this date. Try selecting a different date.
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.slotsScrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {availableSlots.map((slot, index) => {
                const isSelected = selectedSlot?.id === slot.id;
                const durationLabel = getDurationLabel(slot.duration);
                
                return (
                  <TouchableOpacity
                    key={`slot-${slot.id}-${index}`}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.timeSlotSelected
                    ]}
                    onPress={() => handleSlotSelect(slot)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isSelected 
                        ? ['#8B4513', '#D2691E'] 
                        : ['#FFFFFF', '#F8F3EE']
                      }
                      style={styles.timeSlotGradient}
                    >
                      <View style={styles.timeSlotContent}>
                        <View style={styles.timeSlotLeft}>
                          <View style={styles.timeSlotTimeContainer}>
                            <Text style={[
                              styles.timeSlotTime,
                              isSelected && styles.timeSlotTimeSelected
                            ]}>
                              {formatTime(slot.startTime)}
                            </Text>
                            <Text style={[
                              styles.timeSlotDuration,
                              isSelected && styles.timeSlotDurationSelected
                            ]}>
                              {slot.duration} min
                            </Text>
                          </View>
                          <Text style={[
                            styles.durationLabel,
                            isSelected && styles.durationLabelSelected
                          ]}>
                            {durationLabel}
                          </Text>
                        </View>
                        
                        <View style={styles.timeSlotRight}>
                          <Text style={[
                            styles.timeSlotPrice,
                            isSelected && styles.timeSlotPriceSelected
                          ]}>
                            {formatPrice(slot.price)}
                          </Text>
                          <MaterialIcons 
                            name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
                            size={20} 
                            color={isSelected ? "#FFFFFF" : "#8B4513"} 
                          />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
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
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },

  // Schedule Info
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F3EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  scheduleInfoText: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Day Names
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayNameItem: {
    flex: 1,
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
    marginBottom: 20,
  },
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
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
  dayButtonAvailable: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
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
  availabilityDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  // Time Slots Section
  timeSlotsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
    paddingTop: 20,
    maxHeight: 300,
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginLeft: 8,
  },

  // Loading State
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8B7355',
  },

  // Error State
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // No Slots
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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

  // Time Slots
  slotsScrollContainer: {
    maxHeight: 200,
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
    padding: 16,
  },
  timeSlotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSlotLeft: {
    flex: 1,
  },
  timeSlotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
    marginRight: 8,
  },
  timeSlotTimeSelected: {
    color: '#FFFFFF',
  },
  timeSlotDuration: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeSlotDurationSelected: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  durationLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  durationLabelSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  timeSlotRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  timeSlotPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 6,
  },
  timeSlotPriceSelected: {
    color: '#FFFFFF',
  },
});