// app/(tabs)/profile.tsx - Fully Responsive Enhanced Profile Screen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { subjects } from "@/constants/subjects";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

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

const getGridColumns = () => {
  return getResponsiveValue(2, 3, 4);
};

// Mock achievements data
const achievements = [
  { id: 1, title: "First Session", description: "Completed your first learning session", icon: "🎯", earned: true, date: "2024-01-15" },
  { id: 2, title: "Week Streak", description: "7 days of continuous learning", icon: "🔥", earned: true, date: "2024-01-20" },
  { id: 3, title: "Math Master", description: "Completed 10 math sessions", icon: "📊", earned: true, date: "2024-01-25" },
  { id: 4, title: "Early Bird", description: "Attended morning sessions", icon: "🌅", earned: false, date: null },
  { id: 5, title: "Social Learner", description: "Connected with 5 mentors", icon: "👥", earned: true, date: "2024-02-01" },
  { id: 6, title: "Perfectionist", description: "Maintained 5.0 rating", icon: "⭐", earned: false, date: null },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/auth");
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      "Change Profile Picture",
      "Choose an option",
      [
        { text: "Camera", onPress: () => console.log("Camera") },
        { text: "Gallery", onPress: () => console.log("Gallery") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <View style={[
      styles.statCard,
      { 
        width: isTablet ? (screenData.width - getHorizontalPadding() * 2 - 16 * (getGridColumns() - 1)) / getGridColumns() : '48%',
        marginRight: isTablet ? 16 : 0,
      }
    ]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={getResponsiveValue(20, 24, 28)} color={color} strokeWidth={2} />
      </View>
      <Text style={[styles.statValue, { fontSize: getFontSize(20) }]}>{value}</Text>
      <Text style={[styles.statTitle, { fontSize: getFontSize(14) }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { fontSize: getFontSize(12) }]}>{subtitle}</Text>
      )}
    </View>
  );

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightComponent,
    color = "#6B7280"
  }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
          <Icon size={getResponsiveValue(20, 22, 24)} color={color} strokeWidth={2} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { fontSize: getFontSize(16) }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { fontSize: getFontSize(13) }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && <MaterialIcons name="chevron-right" size={getResponsiveValue(16, 18, 20)} color="#9CA3AF" />}
      </View>
    </TouchableOpacity>
  );

  const AchievementBadge = ({ achievement }: { achievement: any }) => (
    <TouchableOpacity 
      style={[
        styles.achievementBadge,
        !achievement.earned && styles.achievementBadgeDisabled,
        { 
          width: isTablet ? (screenData.width - getHorizontalPadding() * 2 - 12 * (getGridColumns() - 1)) / getGridColumns() : '48%',
          marginRight: isTablet ? 12 : 0,
        }
      ]}
      onPress={() => {
        Alert.alert(
          achievement.title,
          achievement.description + (achievement.earned ? `\nEarned on: ${new Date(achievement.date).toLocaleDateString()}` : "\nKeep learning to unlock this achievement!")
        );
      }}
    >
      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
      <Text style={[
        styles.achievementTitle,
        { fontSize: getFontSize(12) },
        !achievement.earned && styles.achievementTitleDisabled
      ]}>
        {achievement.title}
      </Text>
      {achievement.earned && (
        <View style={styles.achievementEarned}>
          <MaterialIcons name="emoji-events" size={getResponsiveValue(12, 14, 16)} color="#F59E0B" />        
        </View>
      )}
    </TouchableOpacity>
  );

  const earnedAchievements = achievements.filter(a => a.earned);

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profile Section */}
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          style={[styles.headerSection, { paddingHorizontal: getHorizontalPadding() }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[
            styles.headerContent,
            isTablet && styles.headerContentTablet
          ]}>
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={handleChangeAvatar}
              >
                <Image
                  source={{ 
                    uri: user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" 
                  }}
                  style={[
                    styles.avatar,
                    { 
                      width: getResponsiveValue(80, 90, 100),
                      height: getResponsiveValue(80, 90, 100),
                      borderRadius: getResponsiveValue(40, 45, 50),
                    }
                  ]}
                />
                <View style={styles.cameraIcon}>
                  <MaterialIcons name="camera-alt" size={getResponsiveValue(16, 18, 20)} color="#4F46E5" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { fontSize: getFontSize(24) }]}>
                  {user?.name || "Student"}
                </Text>
                <Text style={[styles.userEmail, { fontSize: getFontSize(16) }]}>
                  {user?.email || "student@example.com"}
                </Text>
                <Text style={[styles.userRole, { fontSize: getFontSize(14) }]}>
                  {user?.role === 'mentee' ? 'Learning Journey' : 'Mentor'} • Member since Jan 2024
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <MaterialIcons name="edit" size={getResponsiveValue(16, 18, 20)} color="#fff" />
              <Text style={[styles.editButtonText, { fontSize: getFontSize(14) }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Learning Statistics</Text>
          <View style={[
            styles.statsGrid,
            isTablet && styles.statsGridTablet
          ]}>
            <StatCard
              icon={() => <MaterialIcons name="schedule" size={getResponsiveValue(20, 24, 28)} color="#10B981" />}
              title="Hours Learned"
              value={`${user?.stats?.totalHoursLearned || 42}h`}
              subtitle="+5h this week"
              color="#10B981"
            />
            <StatCard
              icon={() => <MaterialIcons name="event" size={getResponsiveValue(20, 24, 28)} color="#F59E0B" />}
              title="Sessions"
              value={user?.stats?.sessionsCompleted || 15}
              subtitle="3 upcoming"
              color="#F59E0B"
            />
            <StatCard
              icon={() => <MaterialIcons name="group" size={getResponsiveValue(20, 24, 28)} color="#EF4444" />}
              title="Mentors"
              value={user?.stats?.mentorsConnected || 8}
              subtitle="4 favorites"
              color="#EF4444"
            />
            <StatCard
              icon={() => <MaterialIcons name="schedule" size={getResponsiveValue(12, 14, 16)} color="#F59E0B" />}
              title="Avg Rating"
              value={user?.stats?.averageRating || 4.8}
              subtitle="Based on 12 reviews"
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Learning Progress */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Learning Progress</Text>
            <TouchableOpacity onPress={() => router.push('/progress')}>
              <Text style={[styles.sectionLink, { fontSize: getFontSize(14) }]}>View Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <MaterialIcons name="trending-up" size={getResponsiveValue(20, 22, 24)} color="#4F46E5" />
              <Text style={[styles.progressTitle, { fontSize: getFontSize(16) }]}>
                This Month's Goal
              </Text>
            </View>
            <Text style={[styles.progressSubtitle, { fontSize: getFontSize(14) }]}>
              Complete 8 sessions • 6 of 8 completed
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={[styles.progressPercent, { fontSize: getFontSize(12) }]}>75% Complete</Text>
          </View>
        </View>

        {/* Interests */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Your Interests</Text>
            <TouchableOpacity onPress={() => router.push("/edit-interests")}>
              <Text style={[styles.sectionLink, { fontSize: getFontSize(14) }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.interestsContainer}>
            {(user?.interests || subjects.slice(0, 6)).map((interest) => (
              <View key={interest} style={styles.interestTag}>
                <Text style={[styles.interestText, { fontSize: getFontSize(14) }]}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>
              Achievements ({earnedAchievements.length}/{achievements.length})
            </Text>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={[styles.sectionLink, { fontSize: getFontSize(14) }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[
            styles.achievementsGrid,
            isTablet && styles.achievementsGridTablet
          ]}>
            {achievements.slice(0, getResponsiveValue(4, 6, 8)).map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>

        {/* Settings Sections */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Preferences</Text>
          
          <SettingItem
            icon={() => <Ionicons name="moon" size={getResponsiveValue(20, 22, 24)} color="#6366F1" />}
            title="Dark Mode"
            subtitle="Switch to dark theme"
            color="#6366F1"
            showArrow={false}
            rightComponent={
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                thumbColor={isDarkMode ? "#fff" : "#fff"}
              />
            }
          />
          
          <SettingItem
            icon={() => <MaterialIcons name="notifications" size={getResponsiveValue(20, 22, 24)} color="#F59E0B" />}
            title="Notifications"
            subtitle="Manage your notification preferences"
            color="#F59E0B"
            onPress={() => router.push("/settings/notifications")}
          />
          
          <SettingItem
            icon={() => <MaterialIcons name="language" size={getResponsiveValue(20, 22, 24)} color="#10B981" />}
            title="Language"
            subtitle="English (US)"
            color="#10B981"
            onPress={() => router.push("/settings/language")}
          />
        </View>

        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Account & Security</Text>
          
          <SettingItem
            icon={() => <MaterialIcons name="credit-card" size={getResponsiveValue(20, 22, 24)} color="#3B82F6" />}
            title="Payment Methods"
            subtitle="Manage billing and payments"
            color="#3B82F6"
            onPress={() => router.push("/settings/payment")}
          />
          
          <SettingItem
            icon={() => <MaterialIcons name="security" size={getResponsiveValue(20, 22, 24)} color="#EF4444" />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            color="#EF4444"
            onPress={() => router.push("/settings/privacy")}
          />
          
          <SettingItem
            icon={() => <MaterialIcons name="lock" size={getResponsiveValue(20, 22, 24)} color="#8B5CF6" />}
            title="Change Password"
            subtitle="Update your account password"
            color="#8B5CF6"
            onPress={() => router.push("/settings/password")}
          />
          
          <SettingItem
            icon={() => <MaterialIcons name="smartphone" size={getResponsiveValue(20, 22, 24)} color="#06B6D4" />}
            title="Two-Factor Authentication"
            subtitle="Add an extra layer of security"
            color="#06B6D4"
            onPress={() => router.push("/settings/2fa")}
          />
        </View>

        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Support</Text>
          
          <SettingItem
            icon={() => <MaterialIcons name="help-outline" size={getResponsiveValue(20, 22, 24)} color="#10B981" />}
            title="Help & Support"
            subtitle="Get help and contact support"
            color="#10B981"
            onPress={() => router.push("/settings/help")}
          />
          
          <SettingItem
            icon={() => <MaterialIcons name="download" size={getResponsiveValue(20, 22, 24)} color="#6B7280" />}
            title="Data Export"
            subtitle="Download your learning data"
            color="#6B7280"
            onPress={() => router.push("/settings/export")}
          />
          
          <SettingItem
            icon={() => <MaterialIcons name="share" size={getResponsiveValue(20, 22, 24)} color="#F59E0B" />}
            title="Invite Friends"
            subtitle="Share MentorMatch with friends"
            color="#F59E0B"
            onPress={() => router.push("/invite")}
          />
        </View>

        {/* Logout Button */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={getResponsiveValue(20, 22, 24)} color="#EF4444" strokeWidth={2} />
            <Text style={[styles.logoutText, { fontSize: getFontSize(16) }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { fontSize: getFontSize(14) }]}>MentorMatch</Text>
            <Text style={[styles.appVersion, { fontSize: getFontSize(12) }]}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingTop: getResponsiveValue(20, 24, 32),
    paddingBottom: getResponsiveValue(24, 28, 32),
  },
  headerContent: {
    alignItems: "center",
  },
  headerContentTablet: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: getResponsiveValue(20, 0, 0),
  },
  avatarContainer: {
    position: "relative",
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  avatar: {
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(8, 10, 12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  profileInfo: {
    alignItems: isTablet ? "flex-start" : "center",
  },
  userName: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: isTablet ? "left" : "center",
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
    textAlign: isTablet ? "left" : "center",
  },
  userRole: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: isTablet ? "left" : "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: getResponsiveValue(12, 14, 16),
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingVertical: getResponsiveValue(10, 12, 14),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  section: {
    paddingVertical: getResponsiveValue(20, 24, 28),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#1F2937",
  },
  sectionLink: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statsGridTablet: {
    justifyContent: "flex-start",
  },
  statCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(16, 18, 20),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
  },
  statIcon: {
    width: getResponsiveValue(40, 44, 48),
    height: getResponsiveValue(40, 44, 48),
    borderRadius: getResponsiveValue(20, 22, 24),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  statValue: {
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  statTitle: {
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  statSubtitle: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(20, 22, 24),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  progressTitle: {
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  progressSubtitle: {
    color: "#6B7280",
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  progressBar: {
    height: getResponsiveValue(8, 10, 12),
    backgroundColor: "#E5E7EB",
    borderRadius: getResponsiveValue(4, 5, 6),
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: getResponsiveValue(4, 5, 6),
  },
  progressPercent: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestTag: {
    backgroundColor: "#EEF2FF",
    borderRadius: getResponsiveValue(20, 22, 24),
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingVertical: getResponsiveValue(8, 10, 12),
    marginRight: getResponsiveValue(12, 14, 16),
    marginBottom: getResponsiveValue(8, 10, 12),
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  interestText: {
    color: "#4F46E5",
    fontWeight: "500",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementsGridTablet: {
    justifyContent: "flex-start",
  },
  achievementBadge: {
    backgroundColor: "#F9FAFB",
    borderRadius: getResponsiveValue(12, 14, 16),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(12, 14, 16),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
    position: "relative",
  },
  achievementBadgeDisabled: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: getResponsiveValue(24, 28, 32),
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  achievementTitle: {
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  achievementTitleDisabled: {
    color: "#9CA3AF",
  },
  achievementEarned: {
    position: "absolute",
    top: getResponsiveValue(4, 6, 8),
    right: getResponsiveValue(4, 6, 8),
    backgroundColor: "#FEF3C7",
    borderRadius: getResponsiveValue(8, 10, 12),
    padding: getResponsiveValue(2, 4, 6),
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: getResponsiveValue(16, 18, 20),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: getResponsiveValue(40, 44, 48),
    height: getResponsiveValue(40, 44, 48),
    borderRadius: getResponsiveValue(12, 14, 16),
    alignItems: "center",
    justifyContent: "center",
    marginRight: getResponsiveValue(12, 14, 16),
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  settingSubtitle: {
    color: "#6B7280",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: getResponsiveValue(12, 14, 16),
    paddingVertical: getResponsiveValue(16, 18, 20),
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
    marginLeft: 8,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: getResponsiveValue(20, 24, 28),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  appName: {
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  appVersion: {
    color: "#9CA3AF",
  },
  bottomPadding: {
    height: getResponsiveValue(32, 40, 48),
  },
});