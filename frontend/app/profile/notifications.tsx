// app/profile/notifications.tsx - Notifications Settings Page
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
      title: 'Homework Deadlines',
      description: 'Reminders for upcoming assignment due dates',
      icon: 'assignment',
      enabled: true,
      category: 'learning'
    },
    {
      id: 'study_streaks',
      title: 'Study Streaks',
      description: 'Celebrate your learning milestones and streaks',
      icon: 'local-fire-department',
      enabled: true,
      category: 'learning'
    },
    {
      id: 'goal_progress',
      title: 'Goal Progress',
      description: 'Updates on your learning goal achievements',
      icon: 'my-location',
      enabled: false,
      category: 'learning'
    },

    // Social Notifications
    {
      id: 'new_messages',
      title: 'New Messages',
      description: 'Messages from your mentors and study groups',
      icon: 'message',
      enabled: true,
      category: 'social'
    },
    {
      id: 'mentor_availability',
      title: 'Mentor Availability',
      description: 'When your favorite mentors become available',
      icon: 'person-add',
      enabled: false,
      category: 'social'
    },
    {
      id: 'session_feedback',
      title: 'Session Feedback',
      description: 'Requests to rate and review completed sessions',
      icon: 'star',
      enabled: true,
      category: 'social'
    },

    // System Notifications
    {
      id: 'app_updates',
      title: 'App Updates',
      description: 'New features and important app announcements',
      icon: 'system-update',
      enabled: true,
      category: 'system'
    },
    {
      id: 'security_alerts',
      title: 'Security Alerts',
      description: 'Important security updates and login notifications',
      icon: 'security',
      enabled: true,
      category: 'system'
    },
    {
      id: 'marketing',
      title: 'Tips & Recommendations',
      description: 'Study tips, new mentor suggestions, and educational content',
      icon: 'lightbulb',
      enabled: false,
      category: 'system'
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

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

  const toggleNotification = (id: string) => {
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Alert.alert(
      "Settings Saved",
      "Your notification preferences have been updated successfully!",
      [{ text: "OK" }]
    );
    
    setIsLoading(false);
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
      case 'system': return 'System & Security';
      default: return 'Other';
    }
  };

  const NotificationItem = ({ notification, index }: { notification: NotificationSetting; index: number }) => (
    <Animated.View
      style={[
        styles.notificationItem,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + (index * 5)],
            })
          }]
        }
      ]}
    >
      <View style={styles.notificationLeft}>
        <View style={[
          styles.notificationIcon, 
          { backgroundColor: getCategoryColor(notification.category) + '15' }
        ]}>
          <MaterialIcons 
            name={notification.icon as any} 
            size={20} 
            color={getCategoryColor(notification.category)} 
          />
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationDescription}>{notification.description}</Text>
        </View>
      </View>
      <Switch
        value={notification.enabled}
        onValueChange={() => toggleNotification(notification.id)}
        trackColor={{ false: "#E5E7EB", true: getCategoryColor(notification.category) + '40' }}
        thumbColor={notification.enabled ? getCategoryColor(notification.category) : "#fff"}
        ios_backgroundColor="#E5E7EB"
      />
    </Animated.View>
  );

  const renderCategory = (category: 'learning' | 'social' | 'system') => {
    const categoryNotifications = notifications.filter(n => n.category === category);
    const enabledCount = categoryNotifications.filter(n => n.enabled).length;
    
    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{getCategoryTitle(category)}</Text>
          <Text style={styles.categoryCount}>
            {enabledCount} of {categoryNotifications.length} enabled
          </Text>
        </View>
        
        <View style={styles.categoryCard}>
          {categoryNotifications.map((notification, index) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              index={index}
            />
          ))}
        </View>
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
        {/* Info Section */}
        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="notifications" size={24} color="#8b5a3c" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Stay Updated</Text>
              <Text style={styles.infoSubtitle}>
                Choose which notifications you'd like to receive to enhance your learning experience
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.quickActions,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => {
              setNotifications(prev => prev.map(n => ({ ...n, enabled: true })));
            }}
          >
            <MaterialIcons name="check-circle" size={16} color="#059669" />
            <Text style={styles.quickActionText}>Enable All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => {
              setNotifications(prev => prev.map(n => ({ ...n, enabled: false })));
            }}
          >
            <MaterialIcons name="cancel" size={16} color="#dc2626" />
            <Text style={styles.quickActionText}>Disable All</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Notification Categories */}
        {['learning', 'social', 'system'].map(category => 
          renderCategory(category as 'learning' | 'social' | 'system')
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
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Preferences</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Note */}
        <View style={styles.noteCard}>
          <MaterialIcons name="info-outline" size={16} color="#8b7355" />
          <Text style={styles.noteText}>
            You can change these settings anytime. Some notifications may require device permissions.
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
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  quickActionText: {
    fontSize: 14,
    color: "#4a3728",
    fontWeight: "500",
    marginLeft: 6,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  categoryCount: {
    fontSize: 12,
    color: "#8b7355",
    fontWeight: "500",
  },
  categoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
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
  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139, 115, 85, 0.05)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 115, 85, 0.1)",
  },
  noteText: {
    fontSize: 12,
    color: "#8b7355",
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});