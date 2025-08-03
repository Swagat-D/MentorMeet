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
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import BookingCalendar from '@/components/booking/BookingCalendar';
import mentorService, { MentorProfile } from '@/services/mentorService';
import bookingService, { TimeSlot, BookingRequest } from '@/services/bookingService';
import { useAuthStore } from '@/stores/authStore';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

type BookingStep = 'details' | 'payment' | 'processing' | 'success';

interface PaymentMethod {
  id: string;
  type: 'card';
  card: { brand: string; last4: string };
  isDefault: boolean;
}

export default function BookingFlowScreen() {
  const { mentorId } = useLocalSearchParams<{ mentorId: string }>();
  const { user } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('details');
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [paymentValidated, setPaymentValidated] = useState(false);

  // Mock payment methods - replace with real payment service
  const paymentMethods: PaymentMethod[] = [
    { id: 'pm_1NqLo2LkdIwHu7ixOVDr4a9x', type: 'card', card: { brand: 'visa', last4: '4242' }, isDefault: true },
    { id: 'pm_1NqLo2LkdIwHu7ixOVDr4a9y', type: 'card', card: { brand: 'mastercard', last4: '8888' }, isDefault: false },
  ];

  useEffect(() => {
    if (mentorId) {
      loadMentorData();
    }
  }, [mentorId]);

  const loadMentorData = async () => {
    try {
      setLoading(true);
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
        setSubject(`${mentorData.expertise[0]} - General Discussion`);
      }

      // Set default payment method
      const defaultPayment = paymentMethods.find(pm => pm.isDefault);
      if (defaultPayment) {
        setSelectedPaymentMethod(defaultPayment.id);
        // Validate default payment method
        validatePaymentMethod(defaultPayment.id);
      }
      
    } catch (error: any) {
      console.error('❌ Error loading mentor:', error);
      Alert.alert('Error', 'Failed to load mentor information', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const validatePaymentMethod = async (paymentMethodId: string) => {
    try {
      const isValid = await bookingService.validatePaymentMethod(paymentMethodId);
      setPaymentValidated(isValid);
    } catch (error) {
      console.error('❌ Payment validation failed:', error);
      setPaymentValidated(false);
    }
  };

  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot);
  }, []);

  const validateDetailsForm = (): boolean => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return false;
    }
    if (!subject.trim() || subject.trim().length < 3) {
      Alert.alert('Error', 'Please enter a valid subject (minimum 3 characters)');
      return false;
    }
    return true;
  };

  const validatePaymentForm = (): boolean => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return false;
    }
    if (!paymentValidated) {
      Alert.alert('Error', 'Please select a valid payment method');
      return false;
    }
    return true;
  };

  const handleDetailsNext = () => {
    if (validateDetailsForm()) {
      setCurrentStep('payment');
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    validatePaymentMethod(methodId);
  };

  const handleBookingConfirm = async () => {
    if (!validatePaymentForm() || !mentor || !user) return;

    try {
      setProcessing(true);
      setCurrentStep('processing');

      const bookingRequest: BookingRequest = {
        mentorId: mentor._id,
        timeSlot: selectedSlot!,
        sessionType: 'video',
        subject: subject.trim(),
        notes: notes.trim(),
        paymentMethodId: selectedPaymentMethod,
      };

      console.log('🎯 Creating booking with payment-first flow...');
      const result = await bookingService.createBooking(bookingRequest);

      if (result.success && result.data) {
        setBookingResult(result.data);
        setCurrentStep('success');
        
        // Show success message
        Alert.alert(
          'Booking Confirmed! 🎉',
          'Your payment has been processed and your session has been booked successfully. Check your email for meeting details.',
          [{ text: 'Perfect!' }]
        );
      } else {
        throw new Error(result.message || 'Failed to create booking');
      }

    } catch (error: any) {
      console.error('❌ Booking creation failed:', error);
      
      // Go back to payment step for retry
      setCurrentStep('payment');
      
      // Show specific error messages
      let errorTitle = 'Booking Failed';
      let errorMessage = error.message || 'Failed to create booking. Please try again.';
      
      if (error.message?.includes('payment')) {
        errorTitle = 'Payment Failed';
        errorMessage = 'Your payment could not be processed. Please check your payment method and try again.';
      } else if (error.message?.includes('no longer available')) {
        errorTitle = 'Time Slot Unavailable';
        errorMessage = 'The selected time slot is no longer available. Please select another time slot.';
        // Clear the selected slot
        setSelectedSlot(null);
        setCurrentStep('details');
      } else if (error.message?.includes('refunded')) {
        errorTitle = 'Meeting Creation Failed';
        errorMessage = 'We couldn\'t create your meeting, but your payment has been refunded. Please try booking again.';
      }
      
      Alert.alert(errorTitle, errorMessage);
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

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {/* Session Details Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Session Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Mathematics - Algebra, Python Programming"
            placeholderTextColor="#8B7355"
            maxLength={200}
          />
          <Text style={styles.inputHint}>
            Be specific about what you'd like to learn or discuss
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any specific topics, questions, or learning goals..."
            placeholderTextColor="#8B7355"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.inputHint}>
            Help your mentor prepare for the session
          </Text>
        </View>
      </View>
      
      {/* Calendar */}
      <BookingCalendar
        mentor={mentor!}
        onSlotSelect={handleSlotSelect}
        selectedSlot={selectedSlot}
      />
      
      {/* Selected Slot Summary */}
      {selectedSlot && (
        <View style={styles.selectedSlotContainer}>
          <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.selectedSlotGradient}>
            <View style={styles.selectedSlotHeader}>
              <MaterialIcons name="event-available" size={24} color="#166534" />
              <Text style={styles.selectedSlotTitle}>Selected Session</Text>
            </View>
            
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
                <MaterialIcons name="currency-rupee" size={16} color="#166534" />
                <Text style={styles.metaText}>{formatPrice(selectedSlot.price)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </ScrollView>
  );

  const renderPaymentStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {/* Booking Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Booking Summary</Text>
        
        <View style={styles.summaryItem}>
          <MaterialIcons name="person" size={20} color="#8B4513" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Mentor</Text>
            <Text style={styles.summaryValue}>{mentor?.displayName}</Text>
          </View>
        </View>
        
        <View style={styles.summaryItem}>
          <MaterialIcons name="book" size={20} color="#8B4513" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Subject</Text>
            <Text style={styles.summaryValue}>{subject}</Text>
          </View>
        </View>
        
        <View style={styles.summaryItem}>
          <MaterialIcons name="schedule" size={20} color="#8B4513" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>
              {selectedSlot && formatDateTime(selectedSlot.startTime).date}
            </Text>
            <Text style={styles.summaryValueSecondary}>
              {selectedSlot && `${formatDateTime(selectedSlot.startTime).time} - ${formatDateTime(selectedSlot.endTime).time} (${selectedSlot.duration} min)`}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryTotal}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{selectedSlot && formatPrice(selectedSlot.price)}</Text>
        </View>
        
        <View style={styles.paymentNote}>
          <MaterialIcons name="info" size={16} color="#8B4513" />
          <Text style={styles.paymentNoteText}>
            Payment will be processed immediately upon confirmation
          </Text>
        </View>
      </View>
      
      {/* Payment Methods */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === method.id && styles.paymentMethodSelected
            ]}
            onPress={() => handlePaymentMethodSelect(method.id)}
            activeOpacity={0.8}
          >
            <View style={styles.paymentMethodLeft}>
              <MaterialIcons name="credit-card" size={24} color={
                selectedPaymentMethod === method.id ? "#FFFFFF" : "#8B4513"
              } />
              <View style={styles.paymentMethodInfo}>
                <Text style={[
                  styles.paymentMethodTitle,
                  selectedPaymentMethod === method.id && styles.paymentMethodTitleSelected
                ]}>
                  {method.card.brand.toUpperCase()} •••• {method.card.last4}
                </Text>
                {method.isDefault && (
                  <Text style={[
                    styles.defaultLabel,
                    selectedPaymentMethod === method.id && styles.defaultLabelSelected
                  ]}>
                    Default
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.paymentMethodRight}>
              {selectedPaymentMethod === method.id && paymentValidated && (
                <MaterialIcons name="verified" size={16} color="#FFFFFF" />
              )}
              <MaterialIcons
                name={selectedPaymentMethod === method.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={24}
                color={selectedPaymentMethod === method.id ? "#FFFFFF" : "#8B4513"}
              />
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.addPaymentMethod} activeOpacity={0.8}>
          <MaterialIcons name="add" size={20} color="#8B4513" />
          <Text style={styles.addPaymentMethodText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <LinearGradient colors={['#8B4513', '#D2691E']} style={styles.processingHeader}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.processingTitle}>Processing Your Booking</Text>
        <Text style={styles.processingSubtitle}>
          Please wait while we process your payment and create your session
        </Text>
      </LinearGradient>
      
      <View style={styles.processingSteps}>
        <View style={styles.processingStep}>
          <MaterialIcons name="payment" size={24} color="#10B981" />
          <Text style={styles.processingStepText}>Processing payment...</Text>
        </View>
        <View style={styles.processingStep}>
          <MaterialIcons name="event" size={24} color="#8B7355" />
          <Text style={styles.processingStepText}>Creating meeting...</Text>
        </View>
        <View style={styles.processingStep}>
          <MaterialIcons name="email" size={24} color="#8B7355" />
          <Text style={styles.processingStepText}>Sending confirmations...</Text>
        </View>
      </View>
      
      <Text style={styles.processingNote}>
        This usually takes 10-30 seconds. Please don't close the app.
      </Text>
    </View>
  );

  const renderSuccessStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.successContainer}>
        {/* Success Header */}
        <LinearGradient colors={['#10B981', '#059669']} style={styles.successHeader}>
          <MaterialIcons name="check-circle" size={48} color="#FFFFFF" />
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your payment has been processed and your session is scheduled
          </Text>
        </LinearGradient>
        
        {/* Session Details */}
        <View style={styles.successDetails}>
          <Text style={styles.successDetailsTitle}>Session Information</Text>
          
          <View style={styles.successDetailItem}>
            <MaterialIcons name="person" size={20} color="#8B4513" />
            <View style={styles.successDetailContent}>
              <Text style={styles.successDetailLabel}>Mentor</Text>
              <Text style={styles.successDetailValue}>{mentor?.displayName}</Text>
            </View>
          </View>
          
          <View style={styles.successDetailItem}>
            <MaterialIcons name="schedule" size={20} color="#8B4513" />
            <View style={styles.successDetailContent}>
              <Text style={styles.successDetailLabel}>Date & Time</Text>
              <Text style={styles.successDetailValue}>
                {selectedSlot && formatDateTime(selectedSlot.startTime).date}
              </Text>
              <Text style={styles.successDetailValueSecondary}>
                {selectedSlot && `${formatDateTime(selectedSlot.startTime).time} - ${formatDateTime(selectedSlot.endTime).time}`}
              </Text>
            </View>
          </View>
          
          <View style={styles.successDetailItem}>
            <MaterialIcons name="payment" size={20} color="#8B4513" />
            <View style={styles.successDetailContent}>
              <Text style={styles.successDetailLabel}>Payment</Text>
              <Text style={styles.successDetailValue}>
                {selectedSlot && formatPrice(selectedSlot.price)} - Paid
              </Text>
              <Text style={styles.successDetailValueSecondary}>
                Payment ID: {bookingResult?.paymentId?.slice(-8)}
              </Text>
            </View>
          </View>
          
          {bookingResult?.meetingLink && (
            <View style={styles.successDetailItem}>
              <MaterialIcons name="videocam" size={20} color="#8B4513" />
              <View style={styles.successDetailContent}>
                <Text style={styles.successDetailLabel}>Google Meet Link</Text>
                <TouchableOpacity 
                  style={styles.meetingButton}
                  onPress={() => {
                    Alert.alert(
                      'Meeting Link Ready', 
                      'Your Google Meet link has been sent to your email. You can also access it from your sessions tab.',
                      [
                        { text: 'Got it!' }
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="videocam" size={16} color="#FFFFFF" />
                  <Text style={styles.meetingButtonText}>Meeting Link Ready</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What Happens Next?</Text>
          
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
              Automatic reminders set for 24 hours and 1 hour before your session
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
              <MaterialIcons name="support-agent" size={16} color="#10B981" />
            </View>
            <Text style={styles.nextStepText}>
              Your mentor will receive notification and can prepare for the session
            </Text>
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/sessions')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#8B4513', '#D2691E']} style={styles.primaryButtonGradient}>
              <MaterialIcons name="event-note" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>View My Sessions</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Book Another Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Mentor Not Found</Text>
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
      
      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#F8F3EE']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep === 'success') {
              router.push('/(tabs)/sessions');
            } else if (currentStep === 'processing') {
              // Don't allow back during processing
              return;
            } else {
              router.back();
            }
          }}
          disabled={currentStep === 'processing'}
          activeOpacity={0.8}
        >
          <MaterialIcons 
            name="arrow-back" 
            size={24} 
            color={currentStep === 'processing' ? "#D1C4B8" : "#8B4513"} 
          />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {currentStep === 'details' ? 'Schedule Session' :
             currentStep === 'payment' ? 'Review & Pay' :
             currentStep === 'processing' ? 'Processing...' : 'Booking Complete'}
          </Text>
          {currentStep !== 'success' && currentStep !== 'processing' && (
            <Text style={styles.headerSubtitle}>
              Step {currentStep === 'details' ? '1' : '2'} of 2
            </Text>
          )}
        </View>
        
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Mentor Info */}
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
              {mentor.rating?.toFixed(1) || '5.0'} • {mentor.totalSessions || 0} sessions
            </Text>
          </View>
        </View>
        {mentor.isOnline && (
          <View style={styles.onlineIndicator}>
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'processing' && renderProcessingStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      {currentStep !== 'success' && currentStep !== 'processing' && (
        <View style={styles.bottomNav}>
          {currentStep === 'payment' && (
            <TouchableOpacity
              style={styles.backNavButton}
              onPress={() => setCurrentStep('details')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="chevron-left" size={20} color="#8B4513" />
              <Text style={styles.backNavButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 'details' && { flex: 1 },
              (!selectedSlot || (currentStep === 'payment' && !paymentValidated)) && styles.nextButtonDisabled
            ]}
            onPress={() => {
              if (currentStep === 'details') {
                handleDetailsNext();
              } else {
                handleBookingConfirm();
              }
            }}
            disabled={!selectedSlot || (currentStep === 'payment' && !paymentValidated)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(!selectedSlot || (currentStep === 'payment' && !paymentValidated)) 
                ? ['#D1C4B8', '#D1C4B8'] 
                : ['#8B4513', '#D2691E']
              }
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 'details' ? 'Continue to Payment' : 'Confirm & Pay'}
              </Text>
              {currentStep === 'payment' && selectedSlot && (
                <Text style={styles.nextButtonPrice}>{formatPrice(selectedSlot.price)}</Text>
              )}
              <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
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
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#2A2A2A',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 20,
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
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
  },
  mentorRating: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 4,
    fontWeight: '500',
  },
  onlineIndicator: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Form Section
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
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
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  inputHint: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Selected Slot
  selectedSlotContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#10B981',
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
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Summary
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryContent: {
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
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  paymentNoteText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },

  // Payment Section
  paymentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
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
  paymentMethodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
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

  // Processing State
  processingContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  processingHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 40,
    width: '100%',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  processingSteps: {
    width: '100%',
    marginBottom: 32,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  processingStepText: {
    fontSize: 16,
    color: '#2A2A2A',
    marginLeft: 12,
    fontWeight: '500',
  },
  processingNote: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Success State
  successContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
    width: '100%',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  successDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  successDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
    textAlign: 'center',
  },
  successDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  successDetailContent: {
    marginLeft: 12,
    flex: 1,
  },
  successDetailLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  successDetailValueSecondary: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  meetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  meetingButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Next Steps
  nextSteps: {
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

  // Success Actions
  successActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#F8F3EE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    fontWeight: '600',
  },
});