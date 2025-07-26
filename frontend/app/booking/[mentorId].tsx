// app/booking/[mentorId].tsx - Enhanced Booking Flow with Better Error Handling
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import BookingCalendar from '@/components/booking/BookingCalendar';
import mentorService, { MentorProfile } from '@/services/mentorService';
import bookingService, { TimeSlot, BookingRequest } from '@/services/bookingService';
import { useAuthStore } from '@/stores/authStore';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

type BookingStep = 'calendar' | 'details' | 'payment' | 'confirmation';

interface BookingDetails {
  subject: string;
  sessionType: 'video' | 'audio' | 'in-person';
  notes: string;
  paymentMethodId: string;
}

interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
  };
  isDefault: boolean;
}

export default function BookingFlowScreen() {
  const { mentorId } = useLocalSearchParams<{ mentorId: string }>();
  const { user } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('calendar');
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    subject: '',
    sessionType: 'video',
    notes: '',
    paymentMethodId: '',
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mentorId) {
      loadInitialData();
    }
  }, [mentorId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMentorData(),
        loadPaymentMethods(),
      ]);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMentorData = async () => {
    try {
      const mentorData = await mentorService.getMentorById(mentorId!);
      
      if (!mentorData) {
        Alert.alert('Error', 'Mentor not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }
      
      setMentor(mentorData);
      
      // Set default subject if mentor has subjects
      if (mentorData.subjects && mentorData.subjects.length > 0) {
        const firstSubject = typeof mentorData.subjects[0] === 'string' 
          ? mentorData.subjects[0] 
          : mentorData.subjects[0].name;
        setBookingDetails(prev => ({ ...prev, subject: firstSubject }));
      }
      
    } catch (error: any) {
      console.error('❌ Error loading mentor:', error);
      Alert.alert('Error', 'Failed to load mentor information', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      // Mock payment methods - replace with actual API call
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_1NQ5xA2eZvKYlo2CYou1tn2W',
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
          isDefault: true,
        },
        {
          id: 'pm_1NQ5xB2eZvKYlo2CYou1tn2X',
          type: 'card',
          card: { brand: 'mastercard', last4: '8888' },
          isDefault: false,
        },
      ];
      
      setPaymentMethods(mockPaymentMethods);
      
      // Set default payment method
      const defaultPayment = mockPaymentMethods.find(pm => pm.isDefault);
      if (defaultPayment) {
        setBookingDetails(prev => ({ ...prev, paymentMethodId: defaultPayment.id }));
      }
      
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
    }
  };

  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'calendar':
        if (!selectedSlot) {
          newErrors.slot = 'Please select a time slot to continue';
          return false;
        }
        break;
        
      case 'details':
        if (!bookingDetails.subject.trim()) {
          newErrors.subject = 'Subject is required';
        }
        if (bookingDetails.subject.trim().length < 3) {
          newErrors.subject = 'Subject must be at least 3 characters';
        }
        break;
        
      case 'payment':
        if (!bookingDetails.paymentMethodId) {
          newErrors.payment = 'Please select a payment method';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, selectedSlot, bookingDetails]);

  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot);
    setErrors(prev => ({ ...prev, slot: '' }));
  }, []);

  const handleNextStep = useCallback(async () => {
    if (!validateCurrentStep()) {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }

    switch (currentStep) {
      case 'calendar':
        setCurrentStep('details');
        break;
      case 'details':
        setCurrentStep('payment');
        break;
      case 'payment':
        await handleCreateBooking();
        break;
    }
  }, [currentStep, validateCurrentStep, errors]);

  const handlePreviousStep = useCallback(() => {
    switch (currentStep) {
      case 'details':
        setCurrentStep('calendar');
        break;
      case 'payment':
        setCurrentStep('details');
        break;
      case 'confirmation':
        // Don't allow going back from confirmation
        break;
    }
  }, [currentStep]);

  const handleCreateBooking = async () => {
    if (!mentor || !selectedSlot || !user) {
      Alert.alert('Error', 'Missing required information for booking.');
      return;
    }

    try {
      setProcessing(true);

      const bookingRequest: BookingRequest = {
        mentorId: mentor._id,
        timeSlot: selectedSlot,
        sessionType: bookingDetails.sessionType,
        subject: bookingDetails.subject.trim(),
        notes: bookingDetails.notes.trim(),
        paymentMethodId: bookingDetails.paymentMethodId,
      };

      console.log('🎯 Creating booking:', bookingRequest);

      const result = await bookingService.createBooking(bookingRequest);

      if (result.success && result.data) {
        setBookingResult(result.data);
        setCurrentStep('confirmation');
        
        // Show success alert
        Alert.alert(
          'Booking Confirmed!',
          'Your session has been booked successfully. Check your email for confirmation and meeting details.',
          [{ text: 'Perfect!' }]
        );
      } else {
        throw new Error(result.message || 'Failed to create booking');
      }

    } catch (error: any) {
      console.error('❌ Booking creation failed:', error);
      Alert.alert(
        'Booking Failed',
        error.message || 'Failed to create booking. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  }, []);

  const getStepProgress = useCallback(() => {
    switch (currentStep) {
      case 'calendar': return 25;
      case 'details': return 50;
      case 'payment': return 75;
      case 'confirmation': return 100;
      default: return 0;
    }
  }, [currentStep]);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <LinearGradient
          colors={['#8B4513', '#D2691E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${getStepProgress()}%` }]}
        />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep === 'calendar' ? 1 : currentStep === 'details' ? 2 : currentStep === 'payment' ? 3 : 4} of 4
      </Text>
    </View>
  );

  const renderCalendarStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>
      <Text style={styles.stepSubtitle}>
        Choose an available time slot for your session with {mentor?.displayName}
      </Text>
      
      <BookingCalendar
        mentor={mentor!}
        onSlotSelect={handleSlotSelect}
        selectedSlot={selectedSlot}
      />
      
      {selectedSlot && (
        <View style={styles.selectedSlotSummary}>
          <LinearGradient
            colors={['#F8F3EE', '#FFFFFF']}
            style={styles.selectedSlotGradient}
          >
            <MaterialIcons name="schedule" size={24} color="#8B4513" />
            <View style={styles.slotSummaryContent}>
              <Text style={styles.slotSummaryTitle}>Selected Time</Text>
              <Text style={styles.slotSummaryDetails}>
                {formatDateTime(selectedSlot.startTime).date}
              </Text>
              <Text style={styles.slotSummaryDetails}>
                {formatDateTime(selectedSlot.startTime).time} - {formatDateTime(selectedSlot.endTime).time}
              </Text>
              <View style={styles.slotSummaryMeta}>
                <Text style={styles.slotSummaryPrice}>
                  ${selectedSlot.price}
                </Text>
                <Text style={styles.slotSummaryDuration}>
                  {selectedSlot.duration} minutes
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Session Details</Text>
      <Text style={styles.stepSubtitle}>
        Provide information about what you'd like to learn
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={[
              styles.input,
              errors.subject && styles.inputError
            ]}
            value={bookingDetails.subject}
            onChangeText={(text) => {
              setBookingDetails(prev => ({ ...prev, subject: text }));
              setErrors(prev => ({ ...prev, subject: '' }));
            }}
            placeholder="e.g., Mathematics - Algebra, Python Programming"
            placeholderTextColor="#8B7355"
            maxLength={200}
          />
          {errors.subject && (
            <Text style={styles.errorText}>{errors.subject}</Text>
          )}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Session Type</Text>
          <View style={styles.sessionTypeContainer}>
            {(['video', 'audio', 'in-person'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.sessionTypeOption,
                  bookingDetails.sessionType === type && styles.sessionTypeOptionSelected
                ]}
                onPress={() => setBookingDetails(prev => ({ ...prev, sessionType: type }))}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={type === 'video' ? 'videocam' : type === 'audio' ? 'mic' : 'place'}
                  size={20}
                  color={bookingDetails.sessionType === type ? '#FFFFFF' : '#8B4513'}
                />
                <Text style={[
                  styles.sessionTypeText,
                  bookingDetails.sessionType === type && styles.sessionTypeTextSelected
                ]}>
                  {type === 'video' ? 'Video Call' : type === 'audio' ? 'Audio Call' : 'In Person'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bookingDetails.notes}
            onChangeText={(text) => setBookingDetails(prev => ({ ...prev, notes: text }))}
            placeholder="Any specific topics you'd like to focus on or questions you have..."
            placeholderTextColor="#8B7355"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>
            {bookingDetails.notes.length}/1000 characters
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Payment Method</Text>
      <Text style={styles.stepSubtitle}>
        Choose how you'd like to pay for your session
      </Text>
      
      <View style={styles.paymentMethodsContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              bookingDetails.paymentMethodId === method.id && styles.paymentMethodSelected
            ]}
            onPress={() => {
              setBookingDetails(prev => ({ ...prev, paymentMethodId: method.id }));
              setErrors(prev => ({ ...prev, payment: '' }));
            }}
            activeOpacity={0.8}
          >
            <View style={styles.paymentMethodLeft}>
              <MaterialIcons name="credit-card" size={24} color="#8B4513" />
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodTitle}>
                  {method.card.brand.toUpperCase()} •••• {method.card.last4}
                </Text>
                {method.isDefault && (
                  <Text style={styles.defaultLabel}>Default</Text>
                )}
              </View>
            </View>
            <MaterialIcons
              name={bookingDetails.paymentMethodId === method.id ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={20}
              color="#8B4513"
            />
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.addPaymentMethod} activeOpacity={0.8}>
          <MaterialIcons name="add" size={20} color="#8B4513" />
          <Text style={styles.addPaymentMethodText}>Add New Payment Method</Text>
        </TouchableOpacity>
        
        {errors.payment && (
          <Text style={styles.errorText}>{errors.payment}</Text>
        )}
      </View>
      
      {/* Booking Summary */}
      <View style={styles.bookingSummary}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Mentor</Text>
          <Text style={styles.summaryValue}>{mentor?.displayName}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Subject</Text>
          <Text style={styles.summaryValue}>{bookingDetails.subject}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Date & Time</Text>
          <View style={styles.summaryValueContainer}>
            <Text style={styles.summaryValue}>
              {selectedSlot && formatDateTime(selectedSlot.startTime).date}
            </Text>
            <Text style={styles.summaryValueSecondary}>
              {selectedSlot && `${formatDateTime(selectedSlot.startTime).time} - ${formatDateTime(selectedSlot.endTime).time}`}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{selectedSlot?.duration} minutes</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Total Amount</Text>
          <Text style={styles.summaryTotalValue}>${selectedSlot?.price}</Text>
        </View>
      </View>
    </View>
  );

  const renderConfirmationStep = () => (
    <ScrollView style={styles.confirmationScrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <View style={styles.confirmationHeader}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.successIconContainer}
          >
            <MaterialIcons name="check" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmationSubtitle}>
            Your session has been successfully booked
          </Text>
        </View>
        
        <View style={styles.confirmationDetails}>
          <View style={styles.confirmationItem}>
            <MaterialIcons name="person" size={20} color="#8B4513" />
            <View style={styles.confirmationItemContent}>
              <Text style={styles.confirmationLabel}>Mentor</Text>
              <Text style={styles.confirmationValue}>{mentor?.displayName}</Text>
            </View>
          </View>
          
          <View style={styles.confirmationItem}>
            <MaterialIcons name="book" size={20} color="#8B4513" />
            <View style={styles.confirmationItemContent}>
              <Text style={styles.confirmationLabel}>Subject</Text>
              <Text style={styles.confirmationValue}>{bookingDetails.subject}</Text>
            </View>
          </View>
          
          <View style={styles.confirmationItem}>
            <MaterialIcons name="schedule" size={20} color="#8B4513" />
            <View style={styles.confirmationItemContent}>
              <Text style={styles.confirmationLabel}>Date & Time</Text>
              <Text style={styles.confirmationValue}>
                {selectedSlot && formatDateTime(selectedSlot.startTime).date}
              </Text>
              <Text style={styles.confirmationValueSecondary}>
                {selectedSlot && `${formatDateTime(selectedSlot.startTime).time} - ${formatDateTime(selectedSlot.endTime).time}`}
              </Text>
            </View>
          </View>
          
          {bookingResult?.meetingLink && (
            <View style={styles.confirmationItem}>
              <MaterialIcons name="videocam" size={20} color="#8B4513" />
              <View style={styles.confirmationItemContent}>
                <Text style={styles.confirmationLabel}>Meeting Link</Text>
                <TouchableOpacity 
                  style={styles.meetingLinkButton}
                  onPress={() => {
                    Alert.alert('Meeting Link', bookingResult.meetingLink, [
                      { text: 'Copy Link', onPress: () => {/* Copy to clipboard */} },
                      { text: 'OK' }
                    ]);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.meetingLinkText}>Join Meeting</Text>
                  <MaterialIcons name="launch" size={16} color="#8B4513" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.confirmationNotices}>
          <View style={styles.noticeItem}>
            <MaterialIcons name="email" size={16} color="#10B981" />
            <Text style={styles.noticeText}>
              Confirmation email sent with calendar invite
            </Text>
          </View>
          
          <View style={styles.noticeItem}>
            <MaterialIcons name="notifications" size={16} color="#10B981" />
            <Text style={styles.noticeText}>
              Reminders set for 24hrs, 1hr, and 15min before session
            </Text>
          </View>
          
          <View style={styles.noticeItem}>
            <MaterialIcons name="calendar-today" size={16} color="#10B981" />
            <Text style={styles.noticeText}>
              Event added to your Google Calendar
            </Text>
          </View>
        </View>
        
        <View style={styles.confirmationActions}>
          <TouchableOpacity
            style={styles.viewSessionsButton}
            onPress={() => router.push('/(tabs)/sessions')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B4513', '#D2691E']}
              style={styles.buttonGradient}
            >
              <Text style={styles.viewSessionsButtonText}>View My Sessions</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.findMoreMentorsButton}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
          >
            <Text style={styles.findMoreMentorsButtonText}>Find More Mentors</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F3EE" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading mentor information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!mentor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F3EE" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Mentor Not Found</Text>
          <Text style={styles.errorText}>
            The mentor you're looking for could not be found.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

    return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F3EE" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => currentStep === 'confirmation' ? router.push('/(tabs)/sessions') : router.back()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={24} color="#8B4513" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {currentStep === 'calendar' ? 'Select Time' :
           currentStep === 'details' ? 'Session Details' :
           currentStep === 'payment' ? 'Payment' : 'Confirmation'}
        </Text>
        
        <View style={styles.headerRight}>
          {currentStep !== 'confirmation' && (
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => Alert.alert('Help', 'Contact support if you need assistance')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="help-outline" size={20} color="#8B7355" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {currentStep !== 'confirmation' && renderProgressBar()}

      {/* Mentor Info Header */}
      <View style={styles.mentorHeader}>
        <Image 
          source={{ uri: mentor.profileImage || 'https://via.placeholder.com/48' }} 
          style={styles.mentorAvatar} 
        />
        <View style={styles.mentorInfo}>
          <Text style={styles.mentorName}>{mentor.displayName}</Text>
          <View style={styles.mentorMeta}>
            <MaterialIcons name="star" size={14} color="#D4AF37" />
            <Text style={styles.mentorRating}>
              {mentor.rating?.toFixed(1) || '5.0'} ({mentor.totalSessions || 0} sessions)
            </Text>
          </View>
          <Text style={styles.mentorExpertise} numberOfLines={1}>
            {mentor.expertise?.slice(0, 2).join(', ') || 'Expert Mentor'}
          </Text>
        </View>
        {mentor.isOnline && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 'calendar' && renderCalendarStep()}
          {currentStep === 'details' && renderDetailsStep()}
          {currentStep === 'payment' && renderPaymentStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      {currentStep !== 'confirmation' && (
        <View style={styles.bottomNavigation}>
          {currentStep !== 'calendar' && (
            <TouchableOpacity
              style={styles.backNavButton}
              onPress={handlePreviousStep}
              disabled={processing}
              activeOpacity={0.8}
            >
              <MaterialIcons name="chevron-left" size={20} color="#8B4513" />
              <Text style={styles.backNavButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 'calendar' && { flex: 1 },
              processing && styles.nextButtonDisabled
            ]}
            onPress={handleNextStep}
            disabled={processing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={processing ? ['#D1C4B8', '#D1C4B8'] : ['#8B4513', '#D2691E']}
              style={styles.nextButtonGradient}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === 'calendar' ? 'Continue' :
                     currentStep === 'details' ? 'Review & Pay' :
                     'Confirm Booking'}
                  </Text>
                  {currentStep === 'payment' && selectedSlot && (
                    <Text style={styles.nextButtonPrice}>${selectedSlot.price}</Text>
                  )}
                  <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EE',
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F3EE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  helpButton: {
    padding: 8,
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#E8DDD1',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Mentor Header
  mentorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E8DDD1',
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  mentorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  mentorRating: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 4,
  },
  mentorExpertise: {
    fontSize: 12,
    color: '#8B4513',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },

  // Step Container
  stepContainer: {
    paddingHorizontal: isTablet ? 40 : 20,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Selected Slot Summary
  selectedSlotSummary: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  selectedSlotGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  slotSummaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  slotSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 4,
  },
  slotSummaryDetails: {
    fontSize: 14,
    color: '#2A2A2A',
    marginBottom: 2,
  },
  slotSummaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  slotSummaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginRight: 12,
  },
  slotSummaryDuration: {
    fontSize: 14,
    color: '#8B7355',
  },

  // Form Container
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8DDD1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2A2A2A',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'right',
    marginTop: 4,
  },

  // Session Type Selection
  sessionTypeContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 12,
  },
  sessionTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    backgroundColor: '#F8F3EE',
    flex: isTablet ? 1 : undefined,
  },
  sessionTypeOptionSelected: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  sessionTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 8,
  },
  sessionTypeTextSelected: {
    color: '#FFFFFF',
  },

  // Payment Methods
  paymentMethodsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  paymentMethodSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#F8F3EE',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
    marginTop: 2,
  },
  addPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B4513',
    borderStyle: 'dashed',
  },
  addPaymentMethodText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
    marginLeft: 8,
  },

  // Booking Summary
  bookingSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8B7355',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    flex: 2,
    textAlign: 'right',
  },
  summaryValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  summaryValueSecondary: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'right',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E8DDD1',
    marginVertical: 16,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },

  // Confirmation
  confirmationScrollContainer: {
    flex: 1,
  },
  confirmationHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  confirmationDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  confirmationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  confirmationItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 2,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  confirmationValueSecondary: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F3EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
    marginTop: 4,
  },
  meetingLinkText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
    marginRight: 6,
  },
  confirmationNotices: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 12,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  confirmationActions: {
    gap: 12,
  },
  viewSessionsButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSessionsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  findMoreMentorsButton: {
    backgroundColor: '#F8F3EE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  findMoreMentorsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },

  // Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8F3EE',
    marginRight: 12,
  },
  backNavButtonText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
    marginLeft: 4,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  nextButtonPrice: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
    opacity: 0.9,
  },
});