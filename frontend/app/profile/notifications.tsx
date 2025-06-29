// app/profile/notifications.tsx - Professional Notifications Settings Page
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: 'learning' | 'social' | 'system';
}

export default function NotificationsScreen() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Master notification toggle
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    // Learning Notifications
    {
      id: 'session_reminders',
      title: 'Session Reminders',
      description: 'Get notified 30 minutes before your scheduled sessions',
      icon: 'schedule',
      enabled: true,
      category: 'learning'
    },
    {
      id: 'homework_deadlines',
      title: 'Assignment Deadlines',
      description: 'Reminders for upcoming homework and project due dates',
      icon: 'assignment',
      enabled: true,
      category: 'learning'
    },
    {
      id: 'study_streaks',
      title: 'Study Streaks & Achievements',
      description: 'Celebrate your learning milestones and daily streaks',
      icon: 'local-fire-department',
      enabled: true,
      category: 'learning'
    },
    {
      id: 'goal_progress',
      title: 'Learning Goal Updates',
      description: 'Progress updates on your personalized learning objectives',
      icon: 'my-location',
      enabled: false,
      category: 'learning'
    },
    {
      id: 'weekly_summary',
      title: 'Weekly Learning Summary',
      description: 'Your weekly progress report and upcoming schedule',
      icon: 'analytics',
      enabled: true,
      category: 'learning'
    },

    // Social & Communication
    {
      id: 'new_messages',
      title: 'Messages',
      description: 'New messages from mentors and study group members',
      icon: 'message',
      enabled: true,
      category: 'social'
    },
    {
      id: 'mentor_availability',
      title: 'Mentor Availability',
      description: 'When your favorite mentors have new time slots available',
      icon: 'person-add',
      enabled: false,
      category: 'social'
    },
    {
      id: 'session_feedback',
      title: 'Feedback Requests',
      description: 'Requests to rate and review completed learning sessions',
      icon: 'star',
      enabled: true,
      category: 'social'
    },
    {
      id: 'study_group_invites',
      title: 'Study Group Invitations',
      description: 'Invitations to join study groups and collaborative sessions',
      icon: 'group',
      enabled: false,
      category: 'social'
    },

    // System & Updates
    {
      id: 'app_updates',
      title: 'App Updates & Features',
      description: 'New features, improvements, and important announcements',
      icon: 'system-update',
      enabled: true,
      category: 'system'
    },
    {
      id: 'security_alerts',
      title: 'Security & Account',
      description: 'Login alerts, password changes, and security updates',
      icon: 'security',
      enabled: true,
      category: 'system'
    },
    {
      id: 'promotional',
      title: 'Tips & Recommendations',
      description: 'Study tips, mentor suggestions, and educational content',
      icon: 'lightbulb',
      enabled: false,
      category: 'system'
    },
  ]);

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

  const toggleMasterNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (!enabled) {
      // If turning off master toggle, disable all notifications
      setNotifications(prev => prev.map(n => ({ ...n, enabled: false })));
    } else {
      // If turning on master toggle, enable essential notifications
      setNotifications(prev => prev.map(n => ({
        ...n,
        enabled: ['session_reminders', 'new_messages', 'security_alerts', 'app_updates'].includes(n.id)
      })));
    }
  };

  const toggleNotification = (id: string) => {
    if (!notificationsEnabled) return; // Don't allow individual toggles if master is off
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, enabled: !notification.enabled }
          : notification
      )
    );
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to save notification preferences
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      Alert.alert(
        "Settings Saved",
        "Your notification preferences have been updated successfully!",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to save notification settings. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning': return '#8b5a3c';
      case 'social': return '#d97706';
      case 'system': return '#059669';
      default: return '#8b7355';
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'learning': return 'Learning & Progress';
      case 'social': return 'Social & Communication';
      case 'system': return 'System & Updates';
      default: return 'Other';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'learning': return 'Notifications about your study sessions, progress, and academic goals';
      case 'social': return 'Messages, feedback requests, and social interactions with mentors';
      case 'system': return 'App updates, security alerts, and account-related notifications';
      default: return '';
    }
  };

  const NotificationItem = ({ notification, index }: { notification: NotificationSetting; index: number }) => (
    <Animated.View
      style={[
        styles.notificationItem,
        !notificationsEnabled && styles.notificationItemDisabled,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + (index * 3)],
            })
          }]
        }
      ]}
    >
      <View style={styles.notificationLeft}>
        <View style={[
          styles.notificationIcon, 
          { 
            backgroundColor: getCategoryColor(notification.category) + '15',
            opacity: notificationsEnabled ? 1 : 0.5
          }
        ]}>
          <MaterialIcons 
            name={notification.icon as any} 
            size={20} 
            color={getCategoryColor(notification.category)} 
            style={{ opacity: notificationsEnabled ? 1 : 0.5 }}
          />
        </View>
        <View style={styles.notificationText}>
          <Text style={[
            styles.notificationTitle,
            !notificationsEnabled && styles.disabledText
          ]}>
            {notification.title}
          </Text>
          <Text style={[
            styles.notificationDescription,
            !notificationsEnabled && styles.disabledText
          ]}>
            {notification.description}
          </Text>
        </View>
      </View>
      <Switch
        value={notification.enabled && notificationsEnabled}
        onValueChange={() => toggleNotification(notification.id)}
        disabled={!notificationsEnabled}
        trackColor={{ 
          false: "#E5E7EB", 
          true: getCategoryColor(notification.category) + '40' 
        }}
        thumbColor={
          notification.enabled && notificationsEnabled 
            ? getCategoryColor(notification.category) 
            : "#fff"
        }
        ios_backgroundColor="#E5E7EB"
      />
    </Animated.View>
  );

  const renderCategory = (category: 'learning' | 'social' | 'system') => {
    const categoryNotifications = notifications.filter(n => n.category === category);
    const enabledCount = categoryNotifications.filter(n => n.enabled && notificationsEnabled).length;
    
    return (
      <Animated.View
        key={category}
        style={[
          styles.categorySection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryTitle}>{getCategoryTitle(category)}</Text>
            <Text style={styles.categoryDescription}>{getCategoryDescription(category)}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryCount}>{enabledCount}/{categoryNotifications.length}</Text>
          </View>
        </View>
        
        <View style={[
          styles.categoryCard,
          !notificationsEnabled && styles.categoryCardDisabled
        ]}>
          {categoryNotifications.map((notification, index) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              index={index}
            />
          ))}
        </View>
      </Animated.View>
    );
  };

  const getEnabledNotificationsCount = () => {
    return notifications.filter(n => n.enabled && notificationsEnabled).length;
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Master Control Section */}
        <Animated.View
          style={[
            styles.masterControlCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.masterControlHeader}>
            <View style={styles.masterControlIcon}>
              <MaterialIcons 
                name={notificationsEnabled ? "notifications" : "notifications-off"} 
                size={24} 
                color={notificationsEnabled ? "#8b5a3c" : "#8b7355"} 
              />
            </View>
            <View style={styles.masterControlText}>
              <Text style={styles.masterControlTitle}>
                {notificationsEnabled ? "Notifications Enabled" : "Notifications Disabled"}
              </Text>
              <Text style={styles.masterControlSubtitle}>
                {notificationsEnabled 
                  ? `${getEnabledNotificationsCount()} of ${notifications.length} notifications are active`
                  : "Turn on to receive learning updates and reminders"
                }
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleMasterNotifications}
              trackColor={{ false: "#E5E7EB", true: "#8b5a3c40" }}
              thumbColor={notificationsEnabled ? "#8b5a3c" : "#fff"}
              ios_backgroundColor="#E5E7EB"
              style={styles.masterSwitch}
            />
          </View>
          
          {notificationsEnabled && (
            <View style={styles.masterControlInfo}>
              <MaterialIcons name="info-outline" size={14} color="#8b7355" />
              <Text style={styles.masterControlInfoText}>
                You can customize individual notification types below
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Notification Categories */}
        {notificationsEnabled && (
          <>
            {['learning', 'social', 'system'].map(category => 
              renderCategory(category as 'learning' | 'social' | 'system')
            )}
          </>
        )}

        {/* Disabled State Info */}
        {!notificationsEnabled && (
          <Animated.View
            style={[
              styles.disabledStateCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <MaterialIcons name="notifications-off" size={48} color="#a0916d" />
            <Text style={styles.disabledStateTitle}>Notifications are turned off</Text>
            <Text style={styles.disabledStateText}>
              You won't receive any notifications about your learning progress, 
              messages from mentors, or important updates. Turn on notifications 
              above to stay connected with your learning journey.
            </Text>
          </Animated.View>
        )}

        {/* Save Button */}
        <Animated.View
          style={[
            styles.saveSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveSettings}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? ['#a0916d', '#a0916d'] : ['#8b5a3c', '#d97706']}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <>
                  <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Saving Preferences...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Notification Settings</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <MaterialIcons name="privacy-tip" size={16} color="#8b7355" />
          <Text style={styles.privacyNoteText}>
            Your notification preferences are private and can be changed anytime. 
            Some notifications may require device permissions to function properly.
          </Text>
        </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  masterControlCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  masterControlHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  masterControlIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  masterControlText: {
    flex: 1,
  },
  masterControlTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  masterControlSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    lineHeight: 18,
  },
  masterSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  masterControlInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
  },
  masterControlInfoText: {
    fontSize: 12,
    color: "#8b7355",
    marginLeft: 6,
    fontStyle: "italic",
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: "#8b7355",
    lineHeight: 18,
  },
  categoryBadge: {
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
    marginLeft: 12,
  },
  categoryCount: {
    fontSize: 12,
    color: "#8b5a3c",
    fontWeight: "600",
  },
  categoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  categoryCardDisabled: {
    opacity: 0.6,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.05)",
  },
  notificationItemDisabled: {
    opacity: 0.5,
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 13,
    color: "#8b7355",
    lineHeight: 16,
  },
  disabledText: {
    opacity: 0.6,
  },
  disabledStateCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  disabledStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  disabledStateText: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 20,
  },
  saveSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139, 115, 85, 0.05)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 115, 85, 0.1)",
  },
  privacyNoteText: {
    fontSize: 12,
    color: "#8b7355",
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});