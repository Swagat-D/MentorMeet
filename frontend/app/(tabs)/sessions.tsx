import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import bookingService, { Session } from '@/services/bookingService';
import { useAuthStore } from '@/stores/authStore';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

type SessionFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  averageRating?: number;
}

export default function SessionsScreen() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<SessionFilter>('all');
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
  });

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, selectedFilter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Load all sessions
      const [upcomingResult, completedResult, cancelledResult, stats] = await Promise.all([
        bookingService.getUserBookings('upcoming', 1, 50),
        bookingService.getUserBookings('completed', 1, 50),
        bookingService.getUserBookings('cancelled', 1, 50),
        bookingService.getSessionStats(),
      ]);

      // Combine all sessions
      const allSessions = [
        ...upcomingResult.sessions,
        ...completedResult.sessions,
        ...cancelledResult.sessions,
      ];

      // Sort by date (upcoming first, then by date)
      allSessions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const now = new Date();

        // Upcoming sessions first
        const aIsUpcoming = dateA > now && a.status !== 'cancelled';
        const bIsUpcoming = dateB > now && b.status !== 'cancelled';

        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;

        // Then sort by date
        return dateB.getTime() - dateA.getTime();
      });

      setSessions(allSessions);
      setSessionStats(stats);

    } catch (error: any) {
      console.error('❌ Error loading sessions:', error);
      Alert.alert(
        'Error Loading Sessions',
        'Failed to load your sessions. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, []);

  const filterSessions = () => {
    let filtered = sessions;

    switch (selectedFilter) {
      case 'upcoming':
        filtered = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          const now = new Date();
          return sessionDate > now && session.status !== 'cancelled';
        });
        break;
      case 'completed':
        filtered = sessions.filter(session => session.status === 'completed');
        break;
      case 'cancelled':
        filtered = sessions.filter(session => session.status === 'cancelled');
        break;
      default:
        filtered = sessions;
    }

    setFilteredSessions(filtered);
  };

  const handleSessionAction = async (session: Session, action: 'cancel' | 'reschedule' | 'join' | 'rate') => {
    switch (action) {
      case 'cancel':
        Alert.alert(
          'Cancel Session',
          'Are you sure you want to cancel this session? You may be eligible for a refund.',
          [
            { text: 'Keep Session', style: 'cancel' },
            {
              text: 'Cancel Session',
              style: 'destructive',
              onPress: () => cancelSession(session.id),
            },
          ]
        );
        break;
      case 'reschedule':
        // Navigate to reschedule flow
        router.push(`/booking/${session.mentor.id}?reschedule=${session.id}`);
        break;
      case 'join':
        if (session.meetingLink) {
          // Open meeting link
          Alert.alert(
            'Join Google Meet',
            'This will open your Google Meet session.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Join Meeting', onPress: () => openMeetingLink(session.meetingLink!) },
            ]
          );
        } else {
          Alert.alert('Error', 'No meeting link available for this session.');
        }
        break;
      case 'rate':
        // Navigate to rating screen
        router.push(`/sessions/rate/${session.id}`);
        break;
    }
  };

  const cancelSession = async (sessionId: string) => {
    try {
      const result = await bookingService.cancelBooking(sessionId, 'User cancelled');
      
      if (result.success) {
        Alert.alert(
          'Session Cancelled',
          'Your session has been cancelled successfully. You will receive a refund if eligible.',
          [{ text: 'OK' }]
        );
        await loadSessions(); // Refresh sessions
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel session');
    }
  };

      const openMeetingLink = (meetingLink: string) => {
    if (meetingLink.includes('meet.google.com')) {
      // For React Native, use Linking
      import('expo-linking').then(Linking => {
        Linking.openURL(meetingLink);
      });
    } else {
      Alert.alert('Meeting Link', meetingLink, [
        { text: 'Copy Link', onPress: () => {
          import('expo-clipboard').then(Clipboard => {
            Clipboard.setStringAsync(meetingLink);
            Alert.alert('Copied!', 'Meeting link copied to clipboard');
          });
        }},
        { text: 'OK' }
      ]);
    }
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatSessionTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getSessionStatusInfo = (session: Session) => {
    const sessionDate = new Date(session.date);
    const now = new Date();
    const diffMinutes = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60));

    if (session.status === 'cancelled') {
      return { color: '#DC2626', text: 'Cancelled', icon: 'cancel' };
    }

    if (session.status === 'completed') {
      return { color: '#10B981', text: 'Completed', icon: 'check-circle' };
    }

    if (diffMinutes < -session.duration) {
      return { color: '#8B7355', text: 'Past', icon: 'history' };
    }

    if (diffMinutes <= 15 && diffMinutes >= -15) {
      return { color: '#F59E0B', text: 'Live Now', icon: 'videocam' };
    }

    if (diffMinutes > 0) {
      if (diffMinutes < 60) {
        return { color: '#8B4513', text: `In ${diffMinutes}m`, icon: 'schedule' };
      } else if (diffMinutes < 1440) {
        return { color: '#8B4513', text: `In ${Math.floor(diffMinutes / 60)}h`, icon: 'schedule' };
      }
      return { color: '#8B4513', text: 'Upcoming', icon: 'schedule' };
    }

    return { color: '#8B7355', text: 'Past', icon: 'history' };
  };

  const renderSessionCard = (session: Session) => {
    const statusInfo = getSessionStatusInfo(session);
    const canJoin = statusInfo.text === 'Live Now' || (statusInfo.text.includes('In') && !statusInfo.text.includes('days'));
    const canCancel = statusInfo.text !== 'Past' && statusInfo.text !== 'Completed' && statusInfo.text !== 'Cancelled';
    const canRate = session.status === 'completed' && !session.userRating;

    return (
        <LinearGradient
          colors={['#FFFFFF', '#F8F3EE']}
          style={styles.sessionCardGradient}
        >
          {/* Session Header */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionHeaderLeft}>
              <Image
                source={{ uri: session.mentor.avatar || 'https://via.placeholder.com/48' }}
                style={styles.mentorAvatar}
              />
              <View style={styles.sessionHeaderInfo}>
                <Text style={styles.sessionMentorName}>{session.mentor.name}</Text>
                <Text style={styles.sessionSubject} numberOfLines={1}>
                  {session.subject}
                </Text>
              </View>
            </View>
            
            <View style={styles.sessionStatusContainer}>
              <MaterialIcons 
                name={statusInfo.icon as any} 
                size={16} 
                color={statusInfo.color} 
              />
              <Text style={[styles.sessionStatus, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          {/* Session Details */}
          <View style={styles.sessionDetails}>
            <View style={styles.sessionDetailRow}>
              <MaterialIcons name="schedule" size={16} color="#8B7355" />
              <Text style={styles.sessionDetailText}>
                {formatSessionDate(session.date)} at {formatSessionTime(session.date)}
              </Text>
            </View>
            
            <View style={styles.sessionDetailRow}>
              <MaterialIcons name="timer" size={16} color="#8B7355" />
              <Text style={styles.sessionDetailText}>
                {session.duration} minutes
              </Text>
            </View>
            
            <View style={styles.sessionDetailRow}>
              <MaterialIcons name="videocam" size={16} color="#8B7355" />
              <Text style={styles.sessionDetailText}>
                Google Meet Session
              </Text>
            </View>
            
            <View style={styles.sessionDetailRow}>
              <MaterialIcons name="attach-money" size={16} color="#8B7355" />
              <Text style={styles.sessionDetailText}>
                ${session.price}
              </Text>
            </View>
          </View>

          {/* Session Actions */}
          <View style={styles.sessionActions}>
             {canJoin && session.meetingLink && (
    <TouchableOpacity
      style={[styles.actionButton, styles.joinButton]}
      onPress={() => openMeetingLink(session.meetingLink!)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.actionButtonGradient}
      >
        <MaterialIcons name="videocam" size={16} color="#FFFFFF" />
        <Text style={styles.joinButtonText}>
          {statusInfo.text === 'Live Now' ? 'Join Now' : 'Join Meeting'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  )}
            
            {canRate && (
              <TouchableOpacity
                style={[styles.actionButton, styles.rateButton]}
                onPress={() => handleSessionAction(session, 'rate')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="star" size={16} color="#F59E0B" />
                <Text style={styles.rateButtonText}>Rate Session</Text>
              </TouchableOpacity>
            )}
            
            {canCancel && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rescheduleButton]}
                  onPress={() => handleSessionAction(session, 'reschedule')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="schedule" size={16} color="#8B4513" />
                  <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleSessionAction(session, 'cancel')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="cancel" size={16} color="#DC2626" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* User Rating Display */}
          {session.userRating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialIcons
                    key={star}
                    name={star <= session.userRating! ? 'star' : 'star-border'}
                    size={16}
                    color="#D4AF37"
                  />
                ))}
              </View>
            </View>
          )}
        </LinearGradient>
    );
  };

  {filteredSessions.map((session) => (
  <View key={session.id} style={styles.sessionCard}>
    {renderSessionCard(session)}
  </View>
))}

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="event-note" size={64} color="#8B7355" />
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'upcoming' ? 'No Upcoming Sessions' :
         selectedFilter === 'completed' ? 'No Completed Sessions' :
         selectedFilter === 'cancelled' ? 'No Cancelled Sessions' :
         'No Sessions Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'upcoming' ? 'You don\'t have any upcoming sessions scheduled.' :
         selectedFilter === 'completed' ? 'You haven\'t completed any sessions yet.' :
         selectedFilter === 'cancelled' ? 'You don\'t have any cancelled sessions.' :
         'Start your learning journey by booking a session with a mentor.'}
      </Text>
      {(selectedFilter === 'all' || selectedFilter === 'upcoming') && (
        <TouchableOpacity
          style={styles.findMentorButton}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B4513', '#D2691E']}
            style={styles.findMentorGradient}
          >
            <MaterialIcons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.findMentorText}>Find a Mentor</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <Text style={styles.statsSectionTitle}>Your Learning Progress</Text>
      
      <View style={styles.statsGrid}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.statCard}
        >
          <MaterialIcons name="event-available" size={24} color="#FFFFFF" />
          <Text style={styles.statNumber}>{sessionStats.totalSessions}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </LinearGradient>
        
        <LinearGradient
          colors={['#8B4513', '#D2691E']}
          style={styles.statCard}
        >
          <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.statNumber}>{sessionStats.completedSessions}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </LinearGradient>
        
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.statCard}
        >
          <MaterialIcons name="schedule" size={24} color="#FFFFFF" />
          <Text style={styles.statNumber}>{sessionStats.upcomingSessions}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </LinearGradient>
        
        {sessionStats.averageRating && (
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            style={styles.statCard}
          >
            <MaterialIcons name="star" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{sessionStats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </LinearGradient>
        )}
      </View>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContainer}
      >
        {[
          { key: 'all', label: 'All Sessions', count: sessions.length },
          { key: 'upcoming', label: 'Upcoming', count: sessionStats.upcomingSessions },
          { key: 'completed', label: 'Completed', count: sessionStats.completedSessions },
          { key: 'cancelled', label: 'Cancelled', count: sessions.filter(s => s.status === 'cancelled').length },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter(filter.key as SessionFilter)}
            activeOpacity={0.8}
          >
            {selectedFilter === filter.key && (
              <LinearGradient
                colors={['#8B4513', '#D2691E']}
                style={styles.filterTabGradient}
              />
            )}
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter.key && styles.filterTabTextActive
            ]}>
              {filter.label}
            </Text>
            <View style={[
              styles.filterTabBadge,
              selectedFilter === filter.key && styles.filterTabBadgeActive
            ]}>
              <Text style={[
                styles.filterTabBadgeText,
                selectedFilter === filter.key && styles.filterTabBadgeTextActive
              ]}>
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#8B4513', '#D2691E']}
            style={styles.loadingSpinner}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.loadingText}>Loading your sessions...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we fetch your learning progress</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F3EE']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>My Sessions</Text>
            <Text style={styles.headerSubtitle}>
              Track your learning journey and upcoming sessions
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B4513', '#D2691E']}
              style={styles.headerActionGradient}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8B4513']}
            tintColor="#8B4513"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        {sessionStats.totalSessions > 0 && renderStatsSection()}

        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* Sessions List */}
        <View style={styles.sessionsContainer}>
          {filteredSessions.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <Text style={styles.sessionsListTitle}>
                {selectedFilter === 'all' ? 'All Sessions' :
                 selectedFilter === 'upcoming' ? 'Upcoming Sessions' :
                 selectedFilter === 'completed' ? 'Completed Sessions' :
                 'Cancelled Sessions'} ({filteredSessions.length})
              </Text>
              
              {filteredSessions.map(renderSessionCard)}
            </>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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

  // Header
  header: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 20,
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },
  headerAction: {
    borderRadius: 25,
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
  headerActionGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsSectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: isTablet ? '23%' : '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  statNumber: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.9,
  },

  // Filter Tabs
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterScrollContainer: {
    paddingHorizontal: isTablet ? 32 : 20,
    gap: 12,
  },
  filterTab: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F3EE',
    borderWidth: 1,
    borderColor: '#E8DDD1',
    overflow: 'hidden',
  },
  filterTabActive: {
    borderColor: '#8B4513',
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
  },
  filterTabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginRight: 8,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabBadge: {
    backgroundColor: '#E8DDD1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterTabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  filterTabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Sessions Container
  sessionsContainer: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingTop: 24,
  },
  sessionsListTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },

  // Session Card
  sessionCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
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
  sessionCardGradient: {
    padding: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E8DDD1',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sessionHeaderInfo: {
    flex: 1,
  },
  sessionMentorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  sessionSubject: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  sessionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.2)',
  },
  sessionStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Session Details
  sessionDetails: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Session Actions
  sessionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  joinButton: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  rateButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 6,
  },
  rescheduleButton: {
    backgroundColor: '#F8F3EE',
    borderColor: '#8B4513',
  },
  rescheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 6,
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginRight: 8,
    fontWeight: '500',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  findMentorButton: {
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
  findMentorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  findMentorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 32,
  },
});