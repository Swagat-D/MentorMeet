// app/(tabs)/profile.tsx - Professional Profile Screen
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Learning Goals mapping for display
const learningGoalsMap: Record<string, { label: string; icon: string }> = {
  'academic-excellence': { label: 'Academic Excellence', icon: 'school' },
  'exam-preparation': { label: 'Exam Preparation', icon: 'quiz' },
  'skill-development': { label: 'Skill Development', icon: 'build' },
  'career-guidance': { label: 'Career Guidance', icon: 'work' },
  'homework-help': { label: 'Homework Help', icon: 'assignment' },
  'study-habits': { label: 'Study Habits', icon: 'schedule' },
  'college-prep': { label: 'College Preparation', icon: 'business' },
  'subject-mastery': { label: 'Subject Mastery', icon: 'auto-awesome' },
  'confidence-building': { label: 'Confidence Building', icon: 'emoji-events' },
  'time-management': { label: 'Time Management', icon: 'access-time' },
  'research-skills': { label: 'Research Skills', icon: 'search' },
  'presentation-skills': { label: 'Presentation Skills', icon: 'slideshow' },
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Add any refresh logic here
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
            router.replace("/(auth)/login");
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleChangePassword = () => {
    if (user?.provider === 'google') {
      Alert.alert("Google Account", "You're signed in with Google. Password changes should be done through your Google account.");
      return;
    }
    
    // Redirect to forgot password flow since we already have that infrastructure
    Alert.alert(
      "Change Password",
      "To change your password, we'll send a verification code to your email address.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Continue", 
          onPress: () => {
            router.push({
              pathname: "/(auth)/forgot-password",
              params: { fromProfile: "true" }
            });
          }
        }
      ]
    );
  };

  const handleEditGoals = () => {
    router.push("/profile/learning-goals");
  };

  const handleHelpandSupport = () => {
    router.push("/support/help");
  };

  const handlePrivacyPolicy = () => {
    router.push("/support/privacy");
  };

  const handleTermsCondition = () => {
    router.push("/support/terms");
  };

  const handleNotifications = () => {
    router.push("/profile/notifications");
  };

  const formatStudyLevel = (level?: string) => {
    return level?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified';
  };

  const formatGender = (gender?: string) => {
    return gender?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified';
  };

  const ProfileDetailItem = ({ icon, label, value }: any) => (
    <View style={styles.profileDetailItem}>
      <View style={styles.profileDetailIcon}>
        <MaterialIcons name={icon} size={20} color="#8b5a3c" />
      </View>
      <View style={styles.profileDetailContent}>
        <Text style={styles.profileDetailLabel}>{label}</Text>
        <Text style={styles.profileDetailValue}>{value}</Text>
      </View>
    </View>
  );

  const SettingItem = ({ icon, title, subtitle, onPress, showDivider = true }: any) => (
    <>
      <TouchableOpacity 
        style={styles.settingItem} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <MaterialIcons name={icon} size={20} color="#8b5a3c" />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.settingSubtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#a0916d" />
      </TouchableOpacity>
      {showDivider && <View style={styles.settingDivider} />}
    </>
  );

  const GoalChip = ({ goalId }: { goalId: string }) => {
    const goal = learningGoalsMap[goalId];
    if (!goal) return null;

    return (
      <View style={styles.goalChip}>
        <MaterialIcons name={goal.icon as any} size={14} color="#8b5a3c" />
        <Text style={styles.goalChipText}>{goal.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Warm Background */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ 
                    uri: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=8b5a3c&color=fff&size=200`
                  }}
                  style={styles.avatar}
                />
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={16} color="#059669" />
                </View>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                
                <View style={styles.accountBadge}>
                  <MaterialIcons 
                    name={user?.provider === 'google' ? 'account-circle' : 'alternate-email'} 
                    size={14} 
                    color="#8b7355" 
                  />
                  <Text style={styles.accountBadgeText}>
                    {user?.provider === 'google' ? 'Google Account' : 'Email Account'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <MaterialIcons name="edit" size={16} color="#8b5a3c" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Profile Details */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.profileDetailsCard}>
            <ProfileDetailItem
              icon="person"
              label="Gender"
              value={formatGender(user?.gender)}
            />
            <ProfileDetailItem
              icon="cake"
              label="Age Range"
              value={user?.ageRange ? `${user.ageRange} years` : 'Not specified'}
            />
            <ProfileDetailItem
              icon="school"
              label="Study Level"
              value={formatStudyLevel(user?.studyLevel)}
            />
            <ProfileDetailItem
              icon="calendar-today"
              label="Member Since"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              }) : 'Recently'}
            />
          </View>
        </Animated.View>

        {/* Learning Goals */}
        {user?.goals && user.goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Learning Goals</Text>
              <TouchableOpacity onPress={handleEditGoals}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.goalsContainer}>
              {user.goals.map((goalId, index) => (
                <GoalChip key={`${goalId}-${index}`} goalId={goalId} />
              ))}
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.settingsCard}>
            <SettingItem
              icon="edit"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={handleEditProfile}
            />
            
            {user?.provider === 'email' && (
              <SettingItem
                icon="lock"
                title="Change Password"
                subtitle="Update your account password"
                onPress={handleChangePassword}
              />
            )}
            
            <SettingItem
              icon="my-location"
              title="Learning Goals"
              subtitle="Manage your learning objectives"
              onPress={handleEditGoals}
            />
            
            <SettingItem
              icon="notifications"
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={handleNotifications}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.settingsCard}>
            <SettingItem
              icon="help-outline"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={handleHelpandSupport}
            />
            
            <SettingItem
              icon="privacy-tip"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={handlePrivacyPolicy}
            />
            
            <SettingItem
              icon="description"
              title="Terms of Service"
              subtitle="Read our terms of service"
              onPress={handleTermsCondition}
              showDivider={false}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appName}>MentorMatch</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: "#8b7355",
    marginBottom: 8,
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 115, 85, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountBadgeText: {
    fontSize: 12,
    color: "#8b7355",
    marginLeft: 4,
    fontWeight: "500",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  editButtonText: {
    color: "#8b5a3c",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 15,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 16,
  },
  editLink: {
    fontSize: 14,
    color: "#8b5a3c",
    fontWeight: "600",
  },
  profileDetailsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  profileDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileDetailContent: {
    flex: 1,
  },
  profileDetailLabel: {
    fontSize: 13,
    color: "#8b7355",
    fontWeight: "500",
    marginBottom: 2,
  },
  profileDetailValue: {
    fontSize: 15,
    color: "#4a3728",
    fontWeight: "600",
  },
  goalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  goalChipText: {
    fontSize: 12,
    color: "#8b5a3c",
    fontWeight: "500",
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#8b7355",
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(184, 134, 100, 0.1)",
    marginLeft: 64,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  logoutText: {
    color: "#dc2626",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 15,
  },
  appInfoSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
    marginHorizontal: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: "#a0916d",
  },
  bottomSpacing: {
    height: 100,
  },
});