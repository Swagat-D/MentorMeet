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

type BookingStep = 'datetime' | 'payment' | 'confirmation';

interface BookingDetails {
  subject: string;
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
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('datetime');
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    subject: '',
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
      
      // Set default subject based on mentor's expertise
      if (mentorData.expertise && mentorData.expertise.length > 0) {
        const primaryExpertise = mentorData.expertise[0];
        setBookingDetails(prev => ({ 
          ...prev, 
          subject: `${primaryExpertise} - General Discussion` 
        }));
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
      // For now, using mock data - replace with real API
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
      case 'datetime':
        if (!selectedSlot) {
          newErrors.slot = 'Please select a time slot to continue';
        }
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
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }

    switch (currentStep) {
      case 'datetime':
        setCurrentStep('payment');
        break;
      case 'payment':
        await handleCreateBooking();
        break;
    }
  }, [currentStep, validateCurrentStep, errors]);

  const handlePreviousStep = useCallback(() => {
    switch (currentStep) {
      case 'payment':
        setCurrentStep('datetime');
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
        sessionType: 'video', // All sessions are video via Google Meet
        subject: bookingDetails.subject.trim(),
        notes: bookingDetails.notes.trim(),
        paymentMethodId: bookingDetails.paymentMethodId,
      };

      console.log('🎯 Creating booking:', bookingRequest);

      const result = await bookingService.createBooking(bookingRequest);

      if (result.success && result.data) {
        setBookingResult(result.data);
        setCurrentStep('confirmation');
        
        Alert.alert(
          'Booking Confirmed! 🎉',
          'Your session has been booked successfully. Google Meet link has been sent to your email.',
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
      case 'datetime': return 33;
      case 'payment': return 66;
      case 'confirmation': return 100;
      default: return 0;
    }
  }, [currentStep]);

  // Render methods for each step
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
        Step {currentStep === 'datetime' ? 1 : currentStep === 'payment' ? 2 : 3} of 3
      </Text>
    </View>
  );

  const renderDateTimeStep = () => (
    <ScrollView style={styles.stepScrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Date & Time</Text>
        <Text style={styles.stepSubtitle}>
          Choose an available time slot for your Google Meet session with {mentor?.displayName}
        </Text>
        
        {/* Calendar Component */}
        <BookingCalendar
          mentor={mentor!}
          onSlotSelect={handleSlotSelect}
          selectedSlot={selectedSlot}
        />
        
        {/* Session Details Form */}
        <View style={styles.sessionDetailsContainer}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          
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

        {/* Selected Slot Summary */}
        {selectedSlot && (
          <View style={styles.selectedSlotContainer}>
            <LinearGradient
              colors={['#F0FDF4', '#DCFCE7']}
              style={styles.selectedSlotGradient}
            >
              <View style={styles.selectedSlotHeader}>
                <MaterialIcons name="event-available" size={24} color="#166534" />
                <Text style={styles.selectedSlotTitle}>Selected Time Slot</Text>
              </View>
              
              <View style={styles.selectedSlotDetails}>
                <Text style={styles.selectedSlotDate}>
                  {formatDateTime(selectedSlot.startTime).date}
                </Text>
                <Text style={styles.selectedSlotTime}>
                  {formatDateTime(selectedSlot.startTime).time} - {formatDateTime(selectedSlot.endTime).time}
                </Text>
                
                <View style={styles.selectedSlotMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="schedule" size={16} color="#166534" />
                    <Text style={styles.metaText}>{selectedSlot.duration} minutes</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="videocam" size={16} color="#166534" />
                    <Text style={styles.metaText}>Google Meet</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="attach-money" size={16} color="#166534" />
                    <Text style={styles.metaText}>${selectedSlot.price}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderPaymentStep = () => (
    <ScrollView style={styles.stepScrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Payment & Confirmation</Text>
        <Text style={styles.stepSubtitle}>
          Review your booking details and complete payment
        </Text>
        
        {/* Booking Summary */}
        <View style={styles.bookingSummaryContainer}>
          <LinearGradient
            colors={['#F8F3EE', '#FFFFFF']}
            style={styles.bookingSummaryGradient}
          >
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            
            <View style={styles.summarySection}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="person" size={20} color="#8B4513" />
                <View style={styles.summaryItemContent}>
                  <Text style={styles.summaryLabel}>Mentor</Text>
                  <Text style={styles.summaryValue}>{mentor?.displayName}</Text>
                </View>
              </View>
              
              <View style={styles.summaryItem}>
                <MaterialIcons name="book" size={20} color="#8B4513" />
                <View style={styles.summaryItemContent}>
                  <Text style={styles.summaryLabel}>Subject</Text>
                  <Text style={styles.summaryValue}>{bookingDetails.subject}</Text>
                </View>
              </View>
              
              <View style={styles.summaryItem}>
                <MaterialIcons name="schedule" size={20} color="#8B4513" />
                <View style={styles.summaryItemContent}>
                  <Text style={styles.summaryLabel}>Date & Time</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSlot && formatDateTime(selectedSlot.startTime).date}
                  </Text>
                  <Text style={styles.summaryValueSecondary}>
                    {selectedSlot && `${formatDateTime(selectedSlot.startTime).time} - ${formatDateTime(selectedSlot.endTime).time}`}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryItem}>
                <MaterialIcons name="videocam" size={20} color="#8B4513" />
                <View style={styles.summaryItemContent}>
                  <Text style={styles.summaryLabel}>Session Type</Text>
                  <Text style={styles.summaryValue}>Google Meet Video Call</Text>
                  <Text style={styles.summaryValueSecondary}>{selectedSlot?.duration} minutes</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryTotal}>
              <Text style={styles.summaryTotalLabel}>Total Amount</Text>
              <Text style={styles.summaryTotalValue}>${selectedSlot?.price}</Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* Payment Methods */}
        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
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
                  <View style={styles.cardIconContainer}>
                    <MaterialIcons 
                      name="credit-card" 
                      size={24} 
                      color={bookingDetails.paymentMethodId === method.id ? "#FFFFFF" : "#8B4513"} 
                    />
                  </View>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={[
                      styles.paymentMethodTitle,
                      bookingDetails.paymentMethodId === method.id && styles.paymentMethodTitleSelected
                    ]}>
                      {method.card.brand.toUpperCase()} •••• {method.card.last4}
                    </Text>
                    {method.isDefault && (
                      <Text style={[
                        styles.defaultLabel,
                        bookingDetails.paymentMethodId === method.id && styles.defaultLabelSelected
                      ]}>
                        Default Payment Method
                      </Text>
                    )}
                  </View>
                </View>
                <MaterialIcons
                  name={bookingDetails.paymentMethodId === method.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={24}
                  color={bookingDetails.paymentMethodId === method.id ? "#FFFFFF" : "#8B4513"}
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
        </View>
        
        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <MaterialIcons name="security" size={20} color="#10B981" />
          <Text style={styles.securityNoticeText}>
            Your payment information is secure and encrypted. You'll receive a Google Meet link immediately after booking.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderConfirmationStep = () => (
    <ScrollView style={styles.stepScrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <View style={styles.confirmationContainer}>
          {/* Success Header */}
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.successHeader}
          >
            <View style={styles.successIconContainer}>
              <MaterialIcons name="check-circle" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
            <Text style={styles.confirmationSubtitle}>
              Your Google Meet session has been successfully scheduled
            </Text>
          </LinearGradient>
          
          {/* Booking Details Card */}
          <View style={styles.confirmationDetailsCard}>
            <Text style={styles.confirmationDetailsTitle}>Session Details</Text>
            
            <View style={styles.confirmationDetailsList}>
              <View style={styles.confirmationDetailItem}>
                <MaterialIcons name="person" size={20} color="#8B4513" />
                <View style={styles.confirmationDetailContent}>
                  <Text style={styles.confirmationDetailLabel}>Mentor</Text>
                  <Text style={styles.confirmationDetailValue}>{mentor?.displayName}</Text>
                </View>
              </View>
              
              <View style={styles.confirmationDetailItem}>
                <MaterialIcons name="book" size={20} color="#8B4513" />
                <View style={styles.confirmationDetailContent}>
                  <Text style={styles.confirmationDetailLabel}>Subject</Text>
                  <Text style={styles.confirmationDetailValue}>{bookingDetails.subject}</Text>
                </View>
              </View>
              
              <View style={styles.confirmationDetailItem}>
                <MaterialIcons name="schedule" size={20} color="#8B4513" />
                <View style={styles.confirmationDetailContent}>
                  <Text style={styles.confirmationDetailLabel}>Date & Time</Text>
                  <Text style={styles.confirmationDetailValue}>
                    {selectedSlot && formatDateTime(selectedSlot.startTime).date}
                  </Text>
                  <Text style={styles.confirmationDetailValueSecondary}>
                    {selectedSlot && `${formatDateTime(selectedSlot.startTime).time} - ${formatDateTime(selectedSlot.endTime).time}`}
                  </Text>
                </View>
              </View>
              
              {bookingResult?.meetingLink && (
                <View style={styles.confirmationDetailItem}>
                  <MaterialIcons name="videocam" size={20} color="#8B4513" />
                  <View style={styles.confirmationDetailContent}>
                    <Text style={styles.confirmationDetailLabel}>Google Meet Link</Text>
                    <TouchableOpacity 
                      style={styles.meetingLinkButton}
                      onPress={() => {
                        Alert.alert(
                          'Google Meet Link', 
                          bookingResult.meetingLink,
                          [
                            { text: 'Copy Link', onPress: () => {/* Copy to clipboard */} },
                            { text: 'OK' }
                          ]
                        );
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
          </View>
          
          {/* Next Steps */}
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
            
            <View style={styles.nextStepsList}>
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons name="email" size={16} color="#10B981" />
                </View>
                <Text style={styles.nextStepText}>
                  Confirmation email sent with Google Meet link and calendar invite
                </Text>
              </View>
              
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons name="notifications" size={16} color="#10B981" />
                </View>
                <Text style={styles.nextStepText}>
                  Automatic reminders set for 24hrs, 1hr, and 15min before session
                </Text>
              </View>
              
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons name="calendar-today" size={16} color="#10B981" />
                </View>
                <Text style={styles.nextStepText}>
                  Event automatically added to your Google Calendar
                </Text>
              </View>
              
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons name="support" size={16} color="#10B981" />
                </View>
                <Text style={styles.nextStepText}>
                  24/7 support available if you need any assistance
                </Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.confirmationActions}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => router.push('/(tabs)/sessions')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B4513', '#D2691E']}
                style={styles.primaryActionGradient}
              >
                <MaterialIcons name="event-note" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>View My Sessions</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionText}>Find More Mentors</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F3EE" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#8B4513', '#D2691E']}
            style={styles.loadingSpinner}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.loadingText}>Loading mentor information...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we prepare your booking experience</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!mentor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F3EE" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Mentor Not Found</Text>
          <Text style={styles.errorDescriptionText}>
            The mentor you're looking for could not be found or is currently unavailable.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B4513', '#D2691E']}
              style={styles.errorButtonGradient}
            >
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.errorButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F3EE" />
      
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F3EE']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => currentStep === 'confirmation' ? router.push('/(tabs)/sessions') : router.back()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={24} color="#8B4513" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {currentStep === 'datetime' ? 'Schedule Session' :
               currentStep === 'payment' ? 'Confirm & Pay' : 'Booking Complete'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentStep === 'datetime' ? 'Choose your preferred time' :
               currentStep === 'payment' ? 'Review and complete payment' : 'Session successfully booked'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {currentStep !== 'confirmation' && (
              <TouchableOpacity 
                style={styles.helpButton}
                onPress={() => Alert.alert('Help', 'Contact support if you need assistance with booking')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="help-outline" size={20} color="#8B7355" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      {currentStep !== 'confirmation' && renderProgressBar()}

      {/* Mentor Info Header */}
      <LinearGradient
        colors={['#FFFFFF', '#FEFEFE']}
        style={styles.mentorHeader}
      >
        <Image 
          source={{ uri: mentor.profileImage || 'https://via.placeholder.com/56' }} 
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
      </LinearGradient>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {currentStep === 'datetime' && renderDateTimeStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
      </KeyboardAvoidingView>

      {/* Enhanced Bottom Navigation */}
      {currentStep !== 'confirmation' && (
        <LinearGradient
          colors={['#FFFFFF', '#F8F3EE']}
          style={styles.bottomNavigation}
        >
          <View style={styles.bottomNavigationContent}>
            {currentStep !== 'datetime' && (
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
                currentStep === 'datetime' && { flex: 1 },
                processing && styles.nextButtonDisabled
              ]}
              onPress={handleNextStep}
              disabled={processing || !selectedSlot}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={processing || !selectedSlot ? ['#D1C4B8', '#D1C4B8'] : ['#8B4513', '#D2691E']}
                style={styles.nextButtonGradient}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>
                      {currentStep === 'datetime' ? 'Continue to Payment' : 'Confirm Booking'}
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
        </LinearGradient>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EE',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescriptionText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 150,
  },
  errorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Enhanced Header
  header: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E8DDD1',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Mentor Header
  mentorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mentorAvatar: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    borderRadius: isTablet ? 28 : 24,
    marginRight: 12,
    backgroundColor: '#E8DDD1',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: isTablet ? 18 : 16,
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
    fontWeight: '500',
  },
  mentorExpertise: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
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
  stepScrollContainer: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  stepTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 32,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Session Details
  sessionDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
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
    paddingVertical: 14,
    fontSize: 16,
    color: '#2A2A2A',
    backgroundColor: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  characterCount: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'right',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
    fontWeight: '500',
  },

  // Selected Slot
  selectedSlotContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  selectedSlotGradient: {
    padding: 20,
  },
  selectedSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedSlotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginLeft: 8,
  },
  selectedSlotDetails: {
    marginLeft: 32,
  },
  selectedSlotDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  selectedSlotTime: {
    fontSize: 16,
    color: '#2A2A2A',
    marginBottom: 12,
  },
  selectedSlotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Booking Summary
  bookingSummaryContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bookingSummaryGradient: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 2,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    lineHeight: 22,
  },
  summaryValueSecondary: {
    fontSize: 14,
    color: '#8B7355',
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
    backgroundColor: '#F8F3EE',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  summaryTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },

  // Payment
  paymentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  paymentMethodsContainer: {
    marginTop: 8,
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
    backgroundColor: '#8B4513',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#8B4513',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  paymentMethodTitleSelected: {
    color: '#FFFFFF',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
  },
  defaultLabelSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  addPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B4513',
    borderStyle: 'dashed',
    backgroundColor: '#F8F3EE',
  },
  addPaymentMethodText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
    marginLeft: 8,
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityNoticeText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Confirmation
  confirmationContainer: {
    alignItems: 'center',
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successIconContainer: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  confirmationDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  confirmationDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationDetailsList: {
    // No additional styles needed
  },
  confirmationDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  confirmationDetailContent: {
    marginLeft: 12,
    flex: 1,
  },
  confirmationDetailLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
    fontWeight: '500',
  },
  confirmationDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    lineHeight: 22,
  },
  confirmationDetailValueSecondary: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F3EE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  meetingLinkText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
    marginRight: 8,
  },

  // Next Steps
  nextStepsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  nextStepsList: {
    // No additional styles needed
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nextStepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  nextStepText: {
    fontSize: 14,
    color: '#166534',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Confirmation Actions
  confirmationActions: {
    width: '100%',
    gap: 12,
  },
  primaryActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B4513',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryActionButton: {
    backgroundColor: '#F8F3EE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },

  // Enhanced Bottom Navigation
  bottomNavigation: {
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomNavigationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 16,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F3EE',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
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
    ...Platform.select({
      ios: {
        shadowColor: '#8B4513',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  nextButtonDisabled: {
    opacity: 0.6,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
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
    fontWeight: '600',
  },
});

