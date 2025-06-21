// app/(tabs)/sessions.tsx - Fully Responsive Sessions Screen
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { sessions } from "@/mocks/mentors";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { formatDate, formatTime, formatRelativeTime } from "@/utils/date-utils";

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isTablet = width >= 768;
const isLargeScreen = width >= 1024;

// Responsive utilities
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (isLargeScreen) return large;
  if (isTablet) return medium;
  return small;
};

const getHorizontalPadding = () => {
  return getResponsiveValue(20, 32, 48);
};

const getFontSize = (base: number) => {
  const scale = getResponsiveValue(1, 1.1, 1.2);
  return Math.round(base * scale);
};

const getSessionsPerRow = () => {
  return getResponsiveValue(1, 2, 3);
};

type TabType = "upcoming" | "completed" | "cancelled";
type SortType = "date" | "mentor" | "subject" | "status";

export default function SessionsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [sortBy, setSortBy] = useState<SortType>("date");
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Filter and sort sessions
  const getFilteredSessions = () => {
    let filtered = sessions;

    // Filter by tab
    const now = new Date();
    switch (activeTab) {
      case "upcoming":
        filtered = sessions.filter(session => 
          new Date(session.date) > now && session.status !== 'cancelled'
        );
        break;
      case "completed":
        filtered = sessions.filter(session => 
          session.status === 'completed' || 
          (new Date(session.date) <= now && session.status !== 'cancelled')
        );
        break;
      case "cancelled":
        filtered = sessions.filter(session => session.status === 'cancelled');
        break;
    }

    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "mentor":
          return a.mentor.name.localeCompare(b.mentor.name);
        case "subject":
          return a.subject.localeCompare(b.subject);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredSessions = getFilteredSessions();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <MaterialIcons name="check-circle" size={16} color="#10B981" />;
      case 'cancelled':
        return <MaterialIcons name="cancel" size={16} color="#EF4444" />;
      case 'rescheduled':
        return <MaterialIcons name="refresh" size={16} color="#F59E0B" />;
      default:
        return <MaterialIcons name="schedule" size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'rescheduled':
        return '#F59E0B';
      case 'ongoing':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const TabButton = ({ type, label, count }: { type: TabType; label: string; count: number }) => (
    <TouchableOpacity
      style={[
        styles.tab,
        activeTab === type && styles.activeTab,
        { 
          flex: 1,
          paddingVertical: getResponsiveValue(12, 14, 16),
        }
      ]}
      onPress={() => setActiveTab(type)}
    >
      <Text
        style={[
          styles.tabText,
          activeTab === type && styles.activeTabText,
          { fontSize: getFontSize(16) }
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View style={styles.tabBadge}>
          <Text style={[styles.tabBadgeText, { fontSize: getFontSize(12) }]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const SessionCard = ({ session, index }: { session: any; index: number }) => {
    const isUpcoming = activeTab === "upcoming";
    const canJoin = isUpcoming && new Date(session.date) <= new Date(Date.now() + 30 * 60 * 1000); // 30 min before
    
    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          { 
            width: isTablet ? (screenData.width - getHorizontalPadding() * 2 - 16 * (getSessionsPerRow() - 1)) / getSessionsPerRow() : '100%',
            marginRight: isTablet && (index + 1) % getSessionsPerRow() !== 0 ? 16 : 0,
          }
        ]}
        onPress={() => router.push(`/session/${session.id}`)}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <Image source={{ uri: session.mentor.avatar }} style={styles.sessionAvatar} />
            <View style={styles.sessionBasicInfo}>
              <Text style={[styles.sessionMentorName, { fontSize: getFontSize(16) }]} numberOfLines={1}>
                {session.mentor.name}
              </Text>
              <Text style={[styles.sessionSubject, { fontSize: getFontSize(14) }]} numberOfLines={1}>
                {session.subject}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons name="more-vert" size={getResponsiveValue(16, 18, 20)} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Session Details */}
        <View style={styles.sessionDetails}>
          <View style={styles.sessionDetailRow}>
            <MaterialIcons name="event" size={getResponsiveValue(14, 16, 18)} color="#6B7280" />
            <Text style={[styles.sessionDetailText, { fontSize: getFontSize(14) }]}>
              {formatDate(session.date)}
            </Text>
          </View>
          
          <View style={styles.sessionDetailRow}>
            <MaterialIcons name="schedule" size={getResponsiveValue(14, 16, 18)} color="#6B7280" />
            <Text style={[styles.sessionDetailText, { fontSize: getFontSize(14) }]}>
              {formatTime(session.date)} • {session.sessionType.duration}min
            </Text>
          </View>
          
          <View style={styles.sessionDetailRow}>
            <MaterialIcons name="place" size={getResponsiveValue(14, 16, 18)} color="#6B7280" />
            <Text style={[styles.sessionDetailText, { fontSize: getFontSize(14) }]}>
              {session.sessionType.type === 'video_call' ? 'Video Call' : 
               session.sessionType.type === 'audio_call' ? 'Audio Call' : 'In Person'}
            </Text>
          </View>
        </View>

        {/* Status and Actions */}
        <View style={styles.sessionFooter}>
          <View style={styles.sessionStatus}>
            {getStatusIcon(session.status)}
            <Text style={[
              styles.sessionStatusText,
              { 
                color: getStatusColor(session.status),
                fontSize: getFontSize(12) 
              }
            ]}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Text>
          </View>

          <View style={styles.sessionActions}>
            <Text style={[styles.sessionPrice, { fontSize: getFontSize(16) }]}>
              ${session.price}
            </Text>
            
            {isUpcoming && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  canJoin ? styles.joinButton : styles.rescheduleButton
                ]}
                onPress={() => {
                  if (canJoin) {
                    // Join session
                    router.push(`/session/join/${session.id}`);
                  } else {
                    // Reschedule
                    router.push(`/session/reschedule/${session.id}`);
                  }
                }}
              >
                {canJoin ? (
                  <MaterialIcons name="play-circle-filled" size={getResponsiveValue(16, 18, 20)} color="#fff" />
                ) : (
                  <MaterialIcons name="event" size={getResponsiveValue(16, 18, 20)} color="#4F46E5" />
                )}
                <Text style={[
                  canJoin ? styles.joinButtonText : styles.rescheduleButtonText,
                  { fontSize: getFontSize(12) }
                ]}>
                  {canJoin ? 'Join' : 'Reschedule'}
                </Text>
              </TouchableOpacity>
            )}

            {activeTab === "completed" && session.userRating && (
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={getResponsiveValue(14, 16, 18)} color="#F59E0B" fill="#F59E0B" />
                <Text style={[styles.ratingText, { fontSize: getFontSize(12) }]}>
                  {session.userRating}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Access Buttons for Completed Sessions */}
        {activeTab === "completed" && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <MaterialIcons name="chat" size={getResponsiveValue(14, 16, 18)} color="#6B7280" />
              <Text style={[styles.quickActionText, { fontSize: getFontSize(11) }]}>
                Message
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <MaterialIcons name="refresh" size={getResponsiveValue(14, 16, 18)} color="#6B7280" />
              <Text style={[styles.quickActionText, { fontSize: getFontSize(11) }]}>
                Book Again
              </Text>
            </TouchableOpacity>
            
            {!session.userRating && (
              <TouchableOpacity style={styles.quickAction}>
                <MaterialIcons name="star" size={getResponsiveValue(14, 16, 18)} color="#6B7280" />
                <Text style={[styles.quickActionText, { fontSize: getFontSize(11) }]}>
                  Rate
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="event" size={getResponsiveValue(48, 56, 64)} color="#E5E7EB" />
      </View>
      <Text style={[styles.emptyTitle, { fontSize: getFontSize(20) }]}>
        {activeTab === "upcoming" && "No upcoming sessions"}
        {activeTab === "completed" && "No completed sessions"}
        {activeTab === "cancelled" && "No cancelled sessions"}
      </Text>
      <Text style={[styles.emptySubtitle, { fontSize: getFontSize(16) }]}>
        {activeTab === "upcoming" 
          ? "Book a session with a mentor to start learning"
          : "Your session history will appear here"
        }
      </Text>
      {activeTab === "upcoming" && (
        <TouchableOpacity
          style={styles.findMentorsButton}
          onPress={() => router.push("/(tabs)/search")}
        >
          <Text style={[styles.findMentorsButtonText, { fontSize: getFontSize(16) }]}>
            Find Mentors
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Get counts for tabs
  const upcomingCount = sessions.filter(s => 
    new Date(s.date) > new Date() && s.status !== 'cancelled'
  ).length;
  const completedCount = sessions.filter(s => 
    s.status === 'completed' || (new Date(s.date) <= new Date() && s.status !== 'cancelled')
  ).length;
  const cancelledCount = sessions.filter(s => s.status === 'cancelled').length;

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      {/* Header with Stats */}
      <LinearGradient
        colors={["#4F46E5", "#7C3AED"]}
        style={[styles.headerSection, { paddingHorizontal: getHorizontalPadding() }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { fontSize: getFontSize(24) }]}>
              My Sessions
            </Text>
            <Text style={[styles.headerSubtitle, { fontSize: getFontSize(16) }]}>
              Manage your learning schedule
            </Text>
          </View>
          
          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons name="search" size={getResponsiveValue(20, 22, 24)} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { fontSize: getFontSize(20) }]}>
              {upcomingCount}
            </Text>
            <Text style={[styles.statLabel, { fontSize: getFontSize(12) }]}>
              Upcoming
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { fontSize: getFontSize(20) }]}>
              {completedCount}
            </Text>
            <Text style={[styles.statLabel, { fontSize: getFontSize(12) }]}>
              Completed
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { fontSize: getFontSize(20) }]}>
              {sessions.reduce((total, session) => total + session.sessionType.duration, 0)}
            </Text>
            <Text style={[styles.statLabel, { fontSize: getFontSize(12) }]}>
              Total Hours
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { paddingHorizontal: getHorizontalPadding() }]}>
        <TabButton type="upcoming" label="Upcoming" count={upcomingCount} />
        <TabButton type="completed" label="Completed" count={completedCount} />
        <TabButton type="cancelled" label="Cancelled" count={cancelledCount} />
      </View>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={({ item, index }) => <SessionCard session={item} index={index} />}
          keyExtractor={(item) => item.id}
          numColumns={getSessionsPerRow()}
          key={getSessionsPerRow()} // Force re-render when columns change
          contentContainerStyle={[
            styles.sessionsList,
            { 
              paddingHorizontal: getHorizontalPadding(),
              paddingBottom: getResponsiveValue(32, 40, 48) 
            }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerSection: {
    paddingTop: getResponsiveValue(20, 24, 32),
    paddingBottom: getResponsiveValue(24, 28, 32),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(20, 24, 28),
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerAction: {
    padding: getResponsiveValue(8, 10, 12),
    borderRadius: getResponsiveValue(12, 14, 16),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    marginTop: getResponsiveValue(8, 10, 12),
    marginBottom: getResponsiveValue(8, 10, 12),
    borderRadius: getResponsiveValue(12, 14, 16),
    padding: getResponsiveValue(4, 6, 8),
    marginHorizontal: getHorizontalPadding(),
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: getResponsiveValue(8, 10, 12),
    flexDirection: "row",
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#4F46E5",
  },
  tabBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 18,
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sessionsList: {
    paddingTop: getResponsiveValue(8, 10, 12),
  },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(16, 18, 20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionAvatar: {
    width: getResponsiveValue(48, 52, 56),
    height: getResponsiveValue(48, 52, 56),
    borderRadius: getResponsiveValue(24, 26, 28),
    marginRight: getResponsiveValue(12, 14, 16),
  },
  sessionBasicInfo: {
    flex: 1,
  },
  sessionMentorName: {
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  sessionSubject: {
    color: "#4F46E5",
    fontWeight: "500",
  },
  moreButton: {
    padding: getResponsiveValue(4, 6, 8),
  },
  sessionDetails: {
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  sessionDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveValue(6, 8, 10),
  },
  sessionDetailText: {
    color: "#6B7280",
    marginLeft: getResponsiveValue(8, 10, 12),
  },
  sessionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionStatusText: {
    marginLeft: getResponsiveValue(6, 8, 10),
    fontWeight: "500",
  },
  sessionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionPrice: {
    fontWeight: "bold",
    color: "#1F2937",
    marginRight: getResponsiveValue(12, 14, 16),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    paddingVertical: getResponsiveValue(6, 8, 10),
    borderRadius: getResponsiveValue(8, 10, 12),
  },
  joinButton: {
    backgroundColor: "#10B981",
  },
  rescheduleButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#4F46E5",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: getResponsiveValue(4, 6, 8),
  },
  rescheduleButtonText: {
    color: "#4F46E5",
    fontWeight: "600",
    marginLeft: getResponsiveValue(4, 6, 8),
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#F59E0B",
    fontWeight: "600",
    marginLeft: getResponsiveValue(4, 6, 8),
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: getResponsiveValue(12, 14, 16),
    paddingTop: getResponsiveValue(12, 14, 16),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  quickAction: {
    alignItems: "center",
    padding: getResponsiveValue(8, 10, 12),
  },
  quickActionText: {
    color: "#6B7280",
    fontWeight: "500",
    marginTop: getResponsiveValue(4, 6, 8),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveValue(40, 48, 56),
  },
  emptyIconContainer: {
    width: getResponsiveValue(80, 90, 100),
    height: getResponsiveValue(80, 90, 100),
    borderRadius: getResponsiveValue(40, 45, 50),
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getResponsiveValue(20, 24, 28),
  },
  emptyTitle: {
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: getResponsiveValue(8, 10, 12),
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#6B7280",
    textAlign: "center",
    lineHeight: getResponsiveValue(24, 26, 28),
    marginBottom: getResponsiveValue(24, 28, 32),
  },
  findMentorsButton: {
    backgroundColor: "#4F46E5",
    borderRadius: getResponsiveValue(12, 14, 16),
    paddingHorizontal: getResponsiveValue(24, 28, 32),
    paddingVertical: getResponsiveValue(12, 14, 16),
  },
  findMentorsButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});