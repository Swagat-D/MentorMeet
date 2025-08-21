import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export default function ConfirmationScreen() {
  const { mentorName, sessionTitle, date, time, price, duration } = useLocalSearchParams<{
    mentorName: string;
    sessionTitle: string;
    date: string;
    time: string;
    price: string;
    duration?: string;
  }>();
  
  const selectedDate = date ? new Date(date) : new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleGoHome = () => {
    router.replace("/(tabs)");
  };

  const handleViewSessions = () => {
    router.replace("/(tabs)/sessions");
  };

  const handleBookAnother = () => {
    router.replace("/(tabs)/search");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation Container */}
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.successIconGradient}
            >
              <MaterialIcons name="check" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          
          <View style={styles.successRipple1} />
          <View style={styles.successRipple2} />
          <View style={styles.successRipple3} />
        </View>
        
        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your session has been successfully booked. You'll receive a confirmation email shortly.
          </Text>
        </View>

        {/* Session Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="event-available" size={24} color="#8B4513" />
            <Text style={styles.cardTitle}>Session Details</Text>
          </View>
          
          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialIcons name="person" size={20} color="#8B7355" />
                <Text style={styles.detailLabel}>Mentor</Text>
              </View>
              <Text style={styles.detailValue}>{mentorName || 'Not specified'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialIcons name="subject" size={20} color="#8B7355" />
                <Text style={styles.detailLabel}>Subject</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>
                {sessionTitle || 'Session booked'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialIcons name="event" size={20} color="#8B7355" />
                <Text style={styles.detailLabel}>Date</Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(selectedDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialIcons name="schedule" size={20} color="#8B7355" />
                <Text style={styles.detailLabel}>Time</Text>
              </View>
              <Text style={styles.detailValue}>{time || 'Not specified'}</Text>
            </View>

            {duration && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <MaterialIcons name="timer" size={20} color="#8B7355" />
                  <Text style={styles.detailLabel}>Duration</Text>
                </View>
                <Text style={styles.detailValue}>{duration} minutes</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <MaterialIcons name="videocam" size={20} color="#8B7355" />
                <Text style={styles.detailLabel}>Type</Text>
              </View>
              <Text style={styles.detailValue}>Video Session</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{price || '0'}</Text>
          </View>
        </View>

        {/* Status Information */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialIcons name="info" size={20} color="#F59E0B" />
            <Text style={styles.statusTitle}>What's Next?</Text>
          </View>
          
          <View style={styles.statusContent}>
            <View style={styles.statusItem}>
              <View style={styles.statusIcon}>
                <MaterialIcons name="email" size={16} color="#10B981" />
              </View>
              <Text style={styles.statusText}>
                Confirmation email sent to your registered email address
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={styles.statusIcon}>
                <MaterialIcons name="hourglass-empty" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.statusText}>
                Waiting for mentor to accept and provide meeting link
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={styles.statusIcon}>
                <MaterialIcons name="notifications" size={16} color="#8B4513" />
              </View>
              <Text style={styles.statusText}>
                You'll receive reminders before your session starts
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Important Notes</Text>
          <View style={styles.notesList}>
            <Text style={styles.noteItem}>
              • Your mentor has 2 hours before the session to accept and provide a meeting link
            </Text>
            <Text style={styles.noteItem}>
              • If the mentor doesn't respond in time, you'll receive a full refund automatically
            </Text>
            <Text style={styles.noteItem}>
              • You can cancel or reschedule up to 24 hours before the session for a full refund
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleViewSessions}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B4513', '#D2691E']}
            style={styles.primaryButtonGradient}
          >
            <MaterialIcons name="event-note" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>View My Sessions</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleBookAnother}
            activeOpacity={0.8}
          >
            <MaterialIcons name="search" size={18} color="#8B4513" />
            <Text style={styles.secondaryButtonText}>Book Another Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <MaterialIcons name="home" size={18} color="#8B4513" />
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3EE",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 20,
  },

  // Success Animation
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    position: 'relative',
    marginBottom: 32,
  },
  successIconContainer: {
    position: 'relative',
    zIndex: 3,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successRipple1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    zIndex: 2,
  },
  successRipple2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    zIndex: 1,
  },
  successRipple3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    zIndex: 0,
  },

  // Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Details Card
  detailsCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginLeft: 8,
  },
  detailsContent: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8DDD1',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },

  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginLeft: 8,
  },
  statusContent: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
    flex: 1,
  },

  // Notes Card
  notesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  notesList: {
    gap: 8,
  },
  noteItem: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
  },
  primaryButton: {
    borderRadius: 12,
    marginBottom: 16,
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
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F3EE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});