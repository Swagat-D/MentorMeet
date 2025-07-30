// frontend/app/notifications.tsx - Professional Notifications Page
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';
import { useNotificationsStore } from '@/stores/notificationsStore';

const { width, height } = Dimensions.get('window');

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  readAt?: string;
  updatedAt: string;
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isInitialized,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshUnreadCount,
  } = useNotificationsStore();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Initialize notifications on mount
  useEffect(() => {
    const initialize = async () => {
      if (!isInitialized) {
        await fetchNotifications();
      }
    };
    initialize();
  }, [isInitialized, fetchNotifications]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotifications(true); // Force refresh
      await refreshUnreadCount();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications, refreshUnreadCount]);

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const handleDeleteNotification = async (notificationId: string) => {
  try {
    console.log('🗑️ [NOTIFICATIONS PAGE] Attempting to delete:', notificationId);
    
    await deleteNotification(notificationId);
    
    console.log('✅ [NOTIFICATIONS PAGE] Delete successful, closing modal');
    
    // Close modal and clear selected notification
    setModalVisible(false);
    setSelectedNotification(null);
    
    Alert.alert('Success', 'Notification deleted successfully');
    
  } catch (error: any) {
    console.error('❌ [NOTIFICATIONS PAGE] Delete failed:', error);
    
    // Close modal even on error and show error message
    setModalVisible(false);
    setSelectedNotification(null);
    
    Alert.alert('Error', error.message || 'Failed to delete notification');
  }
};

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      Alert.alert('Info', 'No unread notifications to mark as read');
      return;
    }

    try {
      await markAllAsRead();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark all as read');
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      Alert.alert('Info', 'No notifications to clear');
      return;
    }

    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllNotifications();
              Alert.alert('Success', 'All notifications cleared');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verification_approved':
        return 'verified';
      case 'verification_rejected':
        return 'cancel';
      case 'session_reminder':
      case 'session_booked':
        return 'event';
      case 'session_cancelled':
        return 'event-busy';
      case 'message_received':
        return 'message';
      case 'payment_success':
        return 'payment';
      case 'payment_failed':
        return 'error';
      case 'goal_achievement':
        return 'emoji-events';
      case 'streak_milestone':
        return 'local-fire-department';
      case 'system_announcement':
        return 'campaign';
      case 'account_security':
        return 'security';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'verification_approved':
      case 'payment_success':
      case 'goal_achievement':
        return '#059669';
      case 'verification_rejected':
      case 'payment_failed':
      case 'session_cancelled':
        return '#dc2626';
      case 'session_reminder':
      case 'session_booked':
        return '#d97706';
      case 'message_received':
        return '#2563eb';
      case 'streak_milestone':
        return '#ea580c';
      case 'system_announcement':
        return '#7c3aed';
      case 'account_security':
        return '#dc2626';
      default:
        return '#8b5a3c';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const NotificationItem = ({ notification, index }: { notification: Notification; index: number }) => (
    <Animated.View
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + (index * 2)],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationLeft}>
          <View style={[
            styles.notificationIcon,
            { backgroundColor: getNotificationColor(notification.type) + '15' }
          ]}>
            <MaterialIcons
              name={getNotificationIcon(notification.type) as any}
              size={20}
              color={getNotificationColor(notification.type)}
            />
          </View>
          
          <View style={styles.notificationText}>
            <View style={styles.notificationHeader}>
              <Text 
                style={[
                  styles.notificationTitle,
                  !notification.read && styles.unreadTitle
                ]} 
                numberOfLines={2}
              >
                {notification.title}
              </Text>
              {!notification.read && (
                <View style={styles.unreadDot} />
              )}
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            
            <Text style={styles.notificationTime}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={20} color="#a0916d" />
      </TouchableOpacity>
    </Animated.View>
  );

  const EmptyState = () => (
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <MaterialIcons 
        name={filter === 'unread' ? "mark-email-read" : "notifications-none"} 
        size={64} 
        color="#a0916d" 
      />
      <Text style={styles.emptyStateTitle}>
        {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
      </Text>
      <Text style={styles.emptyStateText}>
        {filter === 'unread' 
          ? 'You have no unread notifications' 
          : 'You\'ll see important updates and messages here'
        }
      </Text>
    </Animated.View>
  );

  const NotificationModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <LinearGradient
          colors={['#fefbf3', '#f8f6f0']}
          style={styles.modalBackground}
        />
        
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <MaterialIcons name="close" size={24} color="#4a3728" />
          </TouchableOpacity>
          
          <Text style={styles.modalHeaderTitle}>Notification</Text>
          
          <TouchableOpacity
            style={styles.modalDeleteButton}
            onPress={() => {
              if (selectedNotification) {
                Alert.alert(
                  'Delete Notification',
                  'Are you sure you want to delete this notification?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => handleDeleteNotification(selectedNotification.id)
                    }
                  ]
                );
              }
            }}
          >
            <MaterialIcons name="delete-outline" size={24} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {/* Modal Content */}
        {selectedNotification && (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalNotificationCard}>
              {/* Notification Header */}
              <View style={styles.modalNotificationHeader}>
                <View style={[
                  styles.modalNotificationIcon,
                  { backgroundColor: getNotificationColor(selectedNotification.type) + '15' }
                ]}>
                  <MaterialIcons
                    name={getNotificationIcon(selectedNotification.type) as any}
                    size={32}
                    color={getNotificationColor(selectedNotification.type)}
                  />
                </View>
                
                <View style={styles.modalNotificationMeta}>
                  <Text style={styles.modalNotificationTime}>
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </Text>
                  {selectedNotification.read && selectedNotification.readAt && (
                    <Text style={styles.modalNotificationRead}>
                      Read on {new Date(selectedNotification.readAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>

              {/* Notification Title */}
              <Text style={styles.modalNotificationTitle}>
                {selectedNotification.title}
              </Text>

              {/* Notification Message */}
              <Text style={styles.modalNotificationMessage}>
                {selectedNotification.message}
              </Text>

              {/* Additional Data (if available) */}
              {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                <View style={styles.modalAdditionalData}>
                  <Text style={styles.modalAdditionalDataTitle}>Additional Information</Text>
                  <View style={styles.modalDataContainer}>
                    {Object.entries(selectedNotification.data)
                      .filter(([key, value]) => value !== null && value !== undefined)
                      .map(([key, value]) => (
                        <View key={key} style={styles.modalDataItem}>
                          <Text style={styles.modalDataKey}>
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                          </Text>
                          <Text style={styles.modalDataValue}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Text>
                        </View>
                      ))
                    }
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerAction}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <MaterialIcons 
            name="done-all" 
            size={24} 
            color={unreadCount > 0 ? "#8b5a3c" : "#a0916d"} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <Animated.View
        style={[
          styles.filterContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && styles.activeFilterTab
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'all' && styles.activeFilterTabText
            ]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'unread' && styles.activeFilterTab
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[
              styles.filterTabText,
              filter === 'unread' && styles.activeFilterTabText
            ]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <MaterialIcons name="clear-all" size={18} color="#dc2626" />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8b5a3c"
            colors={['#8b5a3c']}
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5a3c" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                index={index}
              />
            ))}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Notification Detail Modal */}
      <NotificationModal />
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
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  headerBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: "center",
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  headerAction: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: "#8b5a3c",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8b7355",
  },
  activeFilterTabText: {
    color: "#fff",
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "500",
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: "#8b7355",
    marginTop: 12,
  },
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginHorizontal: 24,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#8b5a3c",
    backgroundColor: "rgba(139, 90, 60, 0.02)",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a3728",
    flex: 1,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dc2626",
    marginLeft: 8,
    marginTop: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#8b7355",
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#a0916d",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a3728",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  modalDeleteButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalNotificationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalNotificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalNotificationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  modalNotificationMeta: {
    flex: 1,
  },
  modalNotificationTime: {
    fontSize: 14,
    color: "#8b7355",
    fontWeight: "500",
    marginBottom: 4,
  },
  modalNotificationRead: {
    fontSize: 12,
    color: "#a0916d",
    fontStyle: "italic",
  },
  modalNotificationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 16,
    lineHeight: 26,
  },
  modalNotificationMessage: {
    fontSize: 16,
    color: "#5d4e37",
    lineHeight: 22,
    marginBottom: 20,
  },
  modalAdditionalData: {
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
    paddingTop: 20,
  },
  modalAdditionalDataTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 12,
  },
  modalDataContainer: {
    backgroundColor: "rgba(139, 90, 60, 0.05)",
    borderRadius: 12,
    padding: 16,
  },
  modalDataItem: {
    marginBottom: 8,
  },
  modalDataKey: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8b5a3c",
    marginBottom: 2,
  },
  modalDataValue: {
    fontSize: 14,
    color: "#5d4e37",
    lineHeight: 18,
  },
});