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

type SessionFilter = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending';

interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  pendingSessions: number;
  cancelledSessions: number;
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
    pendingSessions: 0,
    cancelledSessions: 0,
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
      
      // Load all sessions - FIXED: Load each type separately to avoid duplication
      const [upcomingResult, completedResult, cancelledResult, pendingResult] = await Promise.all([
        bookingService.getUserBookings('upcoming', 1, 100),
        bookingService.getUserBookings('completed', 1, 100),
        bookingService.getUserBookings('cancelled', 1, 100),
        bookingService.getUserBookings('pending', 1, 100),
      ]);

      // FIXED: Use Set to ensure unique sessions by ID
      const allSessionsMap = new Map();
      
      // Add sessions to map (will automatically prevent duplicates)
      [...upcomingResult.sessions, ...completedResult.sessions, ...cancelledResult.sessions, ...pendingResult.sessions]
        .forEach(session => {
          allSessionsMap.set(session.id, session);
        });

      const uniqueSessions = Array.from(allSessionsMap.values());

      // Sort by date (upcoming first, then by date descending)
      uniqueSessions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const now = new Date();

        // Upcoming sessions first
        const aIsUpcoming = dateA > now && !['cancelled', 'completed'].includes(a.status);
        const bIsUpcoming = dateB > now && !['cancelled', 'completed'].includes(b.status);

        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;

        // Then sort by date (newest first for past, earliest first for future)
        if (aIsUpcoming && bIsUpcoming) {
          return dateA.getTime() - dateB.getTime(); // Earliest upcoming first
        }
        return dateB.getTime() - dateA.getTime(); // Most recent past first
      });

      setSessions(uniqueSessions);

      // FIXED: Calculate stats from actual unique sessions
      const stats = calculateSessionStats(uniqueSessions);
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

  // FIXED: Calculate stats from actual sessions data
  const calculateSessionStats = (sessions: Session[]): SessionStats => {
    const now = new Date();
    
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const cancelledSessions = sessions.filter(s => s.status === 'cancelled').length;
    const pendingSessions = sessions.filter(s => s.status === 'pending_mentor_acceptance').length;
    const upcomingSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate > now && !['cancelled', 'completed'].includes(s.status);
    }).length;

    // Calculate average rating from completed sessions
    const ratedSessions = sessions.filter(s => s.status === 'completed' && s.userRating);
    const averageRating = ratedSessions.length > 0 
      ? ratedSessions.reduce((sum, s) => sum + (s.userRating || 0), 0) / ratedSessions.length 
      : undefined;

    return {
      totalSessions: sessions.length,
      completedSessions,
      upcomingSessions,
      pendingSessions,
      cancelledSessions,
      averageRating
    };
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, []);

  const filterSessions = () => {
    let filtered = sessions;
    const now = new Date();

    switch (selectedFilter) {
      case 'upcoming':
        filtered = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate > now && !['cancelled', 'completed'].includes(session.status);
        });
        break;
      case 'completed':
        filtered = sessions.filter(session => session.status === 'completed');
        break;
      case 'cancelled':
        filtered = sessions.filter(session => session.status === 'cancelled');
        break;
      case 'pending':
        filtered = sessions.filter(session => session.status === 'pending_mentor_acceptance');
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
        router.push(`/booking/${session.mentor.id}?reschedule=${session.id}`);
        break;
      case 'join':
        if (session.meetingLink) {
          Alert.alert(
            'Join Meeting',
            'This will open your meeting session.',
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
        await loadSessions();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel session');
    }
  };

  const openMeetingLink = (meetingLink: string) => {
    import('expo-linking').then(Linking => {
      Linking.openURL(meetingLink);
    });
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
      return { color: '#DC2626', text: 'Cancelled', icon: 'cancel' as const, bgColor: '#FEF2F2' };
    }

    if (session.status === 'completed') {
      return { color: '#10B981', text: 'Completed', icon: 'check-circle' as const, bgColor: '#ECFDF5' };
    }

    if (session.status === 'pending_mentor_acceptance') {
      return { color: '#F59E0B', text: 'Pending', icon: 'hourglass-empty' as const, bgColor: '#FEF3C7' };
    }

    if (session.status === 'confirmed') {
      if (diffMinutes < -session.duration) {
        return { color: '#8B7355', text: 'Past', icon: 'history' as const, bgColor: '#F9F7F4' };
      }

      if (diffMinutes <= 15 && diffMinutes >= -15) {
        return { color: '#DC2626', text: 'Live Now', icon: 'videocam' as const, bgColor: '#FEF2F2' };
      }

      if (diffMinutes > 0) {
        if (diffMinutes < 60) {
          return { color: '#8B4513', text: `In ${diffMinutes}m`, icon: 'schedule' as const, bgColor: '#F8F3EE' };
        } else if (diffMinutes < 1440) {
          return { color: '#8B4513', text: `In ${Math.floor(diffMinutes / 60)}h`, icon: 'schedule' as const, bgColor: '#F8F3EE' };
        }
        return { color: '#8B4513', text: 'Upcoming', icon: 'schedule' as const, bgColor: '#F8F3EE' };
      }
    }

    return { color: '#8B7355', text: 'Past', icon: 'history' as const, bgColor: '#F9F7F4' };
  };

  // FIXED: Get proper mentor/student name
  const getDisplayName = (person: { name?: string; firstName?: string; lastName?: string }) => {
    if (person.name) return person.name;
    if (person.firstName && person.lastName) return `${person.firstName} ${person.lastName}`;
    if (person.firstName) return person.firstName;
    return 'Unknown User';
  };

  const renderSessionCard = (session: Session) => {
  const statusInfo = getSessionStatusInfo(session);
  const canJoin = (statusInfo.text === 'Live Now' || statusInfo.text.includes('In')) && session.meetingLink && session.status === 'confirmed';
  const canCancel = !['completed', 'cancelled'].includes(session.status) && statusInfo.text !== 'Past';
  const canRate = session.status === 'completed' && !session.userRating;
  
  // Get proper display name
  const mentorName = getDisplayName(session.mentor);
  const studentName = getDisplayName(session.student);

  return (
    <View key={session.id} style={styles.sessionCard}>
      {/* Session Header */}
      <View style={styles.sessionHeader}>
        <View style={styles.sessionHeaderLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: session.mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentorName)}&background=8B4513&color=fff` }}
              style={styles.mentorAvatar}
            />
          </View>
          <View style={styles.sessionHeaderInfo}>
            <Text style={styles.sessionMentorName}>{mentorName}</Text>
            <Text style={styles.sessionSubject} numberOfLines={1}>
              {session.subject}
            </Text>
            <View style={styles.sessionMetaRow}>
              <MaterialIcons name="schedule" size={14} color="#8B7355" />
              <Text style={styles.sessionMetaText}>
                {formatSessionDate(session.date)} • {formatSessionTime(session.date)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.sessionStatusContainer, { backgroundColor: statusInfo.bgColor }]}>
          <MaterialIcons 
            name={statusInfo.icon} 
            size={14} 
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
          <MaterialIcons name="timer" size={16} color="#8B7355" />
          <Text style={styles.sessionDetailText}>{session.duration} minutes</Text>
        </View>
        
        <View style={styles.sessionDetailRow}>
          <MaterialIcons name="videocam" size={16} color="#8B7355" />
          <Text style={styles.sessionDetailText}>Video Session</Text>
        </View>
        
        <View style={styles.sessionDetailRow}>
          <MaterialIcons name="payment" size={16} color="#8B7355" />
          <Text style={styles.sessionDetailText}>₹{session.price}</Text>
        </View>
      </View>

      {/* Meeting URL Status */}
      <View style={styles.meetingUrlContainer}>
        <View style={styles.meetingUrlRow}>
          <MaterialIcons name="link" size={16} color="#8B7355" />
          <Text style={styles.meetingUrlLabel}>Meeting Link:</Text>
          {session.meetingLink ? (
            <TouchableOpacity
              style={styles.meetingUrlAvailable}
              onPress={() => openMeetingLink(session.meetingLink!)}
              activeOpacity={0.7}
            >
              <Text style={styles.meetingUrlAvailableText}>Available</Text>
              <MaterialIcons name="launch" size={14} color="#10B981" />
            </TouchableOpacity>
          ) : (
            <View style={styles.meetingUrlPending}>
              <Text style={styles.meetingUrlPendingText}>
                {session.status === 'pending_mentor_acceptance' 
                  ? 'Awaiting mentor' 
                  : session.status === 'cancelled'
                  ? 'Not applicable'
                  : 'Not provided'}
              </Text>
              <MaterialIcons 
                name={session.status === 'pending_mentor_acceptance' ? 'schedule' : 'info'} 
                size={14} 
                color="#F59E0B" 
              />
            </View>
          )}
        </View>
        
        {/* Additional meeting info for Google Meet */}
        {session.meetingLink && (
          <Text style={styles.meetingProviderText}>
            Google Meet • Tap to join
          </Text>
        )}
      </View>

      {/* Session Actions */}
      {(canJoin || canRate || canCancel) && (
        <View style={styles.sessionActions}>
          {canJoin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => openMeetingLink(session.meetingLink!)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="videocam" size={18} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>
                {statusInfo.text === 'Live Now' ? 'Join Now' : 'Join Meeting'}
              </Text>
            </TouchableOpacity>
          )}
          
          {canRate && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleSessionAction(session, 'rate')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="star" size={18} color="#F59E0B" />
              <Text style={styles.secondaryButtonText}>Rate</Text>
            </TouchableOpacity>
          )}
          
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleSessionAction(session, 'cancel')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="cancel" size={18} color="#DC2626" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
          {/* If you want to show a review, replace with a valid property from Session, e.g. session.review or remove this block */}
        </View>
      )}
    </View>
  );
};

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="event-note" size={48} color="#8B7355" />
      </View>
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'upcoming' ? 'No Upcoming Sessions' :
         selectedFilter === 'completed' ? 'No Completed Sessions' :
         selectedFilter === 'cancelled' ? 'No Cancelled Sessions' :
         selectedFilter === 'pending' ? 'No Pending Sessions' :
         'No Sessions Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'upcoming' ? 'You don\'t have any upcoming sessions scheduled.' :
         selectedFilter === 'completed' ? 'You haven\'t completed any sessions yet.' :
         selectedFilter === 'cancelled' ? 'You don\'t have any cancelled sessions.' :
         selectedFilter === 'pending' ? 'No sessions waiting for mentor acceptance.' :
         'Start your learning journey by booking a session with a mentor.'}
      </Text>
      {(selectedFilter === 'all' || selectedFilter === 'upcoming') && (
        <TouchableOpacity
          style={styles.findMentorButton}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
        >
          <Text style={styles.findMentorText}>Find a Mentor</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // FIXED: Simple, elegant stats without colorful boxes
  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <Text style={styles.statsSectionTitle}>Your Learning Progress</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sessionStats.totalSessions}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sessionStats.completedSessions}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sessionStats.upcomingSessions}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        
        {sessionStats.pendingSessions > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sessionStats.pendingSessions}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        )}
        
        {sessionStats.averageRating && (
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sessionStats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
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
          { key: 'all', label: 'All', count: sessionStats.totalSessions },
          { key: 'upcoming', label: 'Upcoming', count: sessionStats.upcomingSessions },
          { key: 'pending', label: 'Pending', count: sessionStats.pendingSessions },
          { key: 'completed', label: 'Completed', count: sessionStats.completedSessions },
          { key: 'cancelled', label: 'Cancelled', count: sessionStats.cancelledSessions },
        ].filter(filter => filter.count > 0 || filter.key === 'all').map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter(filter.key as SessionFilter)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter.key && styles.filterTabTextActive
            ]}>
              {filter.label}
            </Text>
            {filter.count > 0 && (
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
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading your sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>My Sessions</Text>
            <Text style={styles.headerSubtitle}>
              Track your learning journey
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>
      </View>

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
                 selectedFilter === 'pending' ? 'Pending Sessions' :
                 'Cancelled Sessions'} ({filteredSessions.length})
              </Text>
              
              {filteredSessions.map(renderSessionCard)}
            </>
          )}
        </View>

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
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 16,
    textAlign: 'center',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
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
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // FIXED: Simple elegant stats without colorful boxes
  statsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '20%',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F3EE',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  filterTabActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabBadge: {
    backgroundColor: '#E8DDD1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterTabBadgeText: {
    fontSize: 11,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 16,
  },

  // FIXED: Clean, elegant session cards
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8DDD1',
  },
  sessionHeaderInfo: {
    flex: 1,
    paddingTop: 2,
  },
  sessionMentorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  sessionSubject: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
    lineHeight: 18,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionMetaText: {
    fontSize: 12,
    color: '#8B7355',
    marginLeft: 4,
  },
  sessionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  sessionStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Session Details
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 4,
  },
  sessionDetailText: {
    fontSize: 13,
    color: '#8B7355',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Session Actions
  sessionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
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
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  secondaryButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
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

  meetingUrlContainer: {
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#F3F1EB',
  marginTop: 12,
},
meetingUrlRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
},
meetingUrlLabel: {
  fontSize: 14,
  color: '#8B7355',
  fontWeight: '500',
},
meetingUrlAvailable: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#ECFDF5',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  gap: 4,
  marginLeft: 'auto',
},
meetingUrlAvailableText: {
  fontSize: 12,
  color: '#10B981',
  fontWeight: '600',
},
meetingUrlPending: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FEF3C7',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  gap: 4,
  marginLeft: 'auto',
},
meetingUrlPendingText: {
  fontSize: 12,
  color: '#F59E0B',
  fontWeight: '500',
},
meetingProviderText: {
  fontSize: 11,
  color: '#8B7355',
  fontStyle: 'italic',
  marginLeft: 24, // Align with the icon
  marginTop: 2,
},
userReviewText: {
  fontSize: 12,
  color: '#666',
  fontStyle: 'italic',
  marginTop: 4,
  marginLeft: 8,
},

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  ratingLabel: {
    fontSize: 13,
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F3EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  findMentorButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findMentorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 32,
  },
});