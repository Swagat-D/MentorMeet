// frontend/stores/notificationsStore.ts - Updated with correct API calls
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

// Types
export interface Notification {
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

export interface NotificationsState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  lastFetch?: Date;
  
  // Actions
  fetchNotifications: (forceRefresh?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  clearStore: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isInitialized: false,
      lastFetch: undefined,

      // Fetch notifications from API
      fetchNotifications: async (forceRefresh = false) => {
        const state = get();
        
        // Prevent multiple simultaneous fetches
        if (state.isLoading) return;
        
        // Check if we need to refresh (only if force refresh or not fetched in last 5 minutes)
        const now = new Date();
        const lastFetch = state.lastFetch;
        const shouldRefresh = forceRefresh || 
          !lastFetch || 
          !state.isInitialized ||
          (now.getTime() - lastFetch.getTime() > 5 * 60 * 1000); // 5 minutes
        
        if (!shouldRefresh && state.notifications.length > 0) {
          console.log('📬 Using cached notifications');
          return;
        }

        set({ isLoading: true });

        try {
          console.log('📬 [NOTIFICATIONS STORE] Fetching notifications...');
          
          const response = await ApiService.getNotifications({
            page: 1,
            limit: 50,
          });

          if (response.success && response.data) {
            const { notifications, pagination } = response.data;
            
            set({
              notifications: notifications || [],
              unreadCount: notifications?.filter((n: Notification) => !n.read).length || 0,
              isLoading: false,
              isInitialized: true,
              lastFetch: now,
            });

            console.log('✅ [NOTIFICATIONS STORE] Notifications fetched successfully:', {
              count: notifications?.length || 0,
              unreadCount: notifications?.filter((n: Notification) => !n.read).length || 0,
            });
          } else {
            throw new Error(response.message || 'Failed to fetch notifications');
          }
        } catch (error: any) {
          console.error('❌ [NOTIFICATIONS STORE] Fetch notifications error:', error);
          
          set({ 
            isLoading: false,
            isInitialized: true,
          });
          
          // Don't throw error to prevent UI crashes
          if (error.message && !error.message.includes('Network error')) {
            throw new Error(error.message || 'Failed to fetch notifications');
          }
        }
      },

      // Mark notification as read
      markAsRead: async (notificationId: string) => {
        try {
          console.log('👁️ [NOTIFICATIONS STORE] Marking notification as read:', notificationId);
          
          const response = await ApiService.markNotificationAsRead(notificationId);

          if (response.success) {
            set(state => ({
              notifications: state.notifications.map(notification =>
                notification.id === notificationId
                  ? { ...notification, read: true, readAt: new Date().toISOString() }
                  : notification
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            }));

            console.log('✅ [NOTIFICATIONS STORE] Notification marked as read');
          } else {
            throw new Error(response.message || 'Failed to mark notification as read');
          }
        } catch (error: any) {
          console.error('❌ [NOTIFICATIONS STORE] Mark as read error:', error);
          throw new Error(error.message || 'Failed to mark notification as read');
        }
      },

      // Mark all notifications as read
      markAllAsRead: async () => {
        try {
          console.log('👁️ [NOTIFICATIONS STORE] Marking all notifications as read');
          
          const response = await ApiService.markAllNotificationsAsRead();

          if (response.success) {
            const now = new Date().toISOString();
            set(state => ({
              notifications: state.notifications.map(notification => ({
                ...notification,
                read: true,
                readAt: notification.readAt || now
              })),
              unreadCount: 0,
            }));

            console.log('✅ [NOTIFICATIONS STORE] All notifications marked as read');
          } else {
            throw new Error(response.message || 'Failed to mark all notifications as read');
          }
        } catch (error: any) {
          console.error('❌ [NOTIFICATIONS STORE] Mark all as read error:', error);
          throw new Error(error.message || 'Failed to mark all notifications as read');
        }
      },

      // Delete notification
      deleteNotification: async (notificationId: string) => {
        try {
          console.log('🗑️ [NOTIFICATIONS STORE] Deleting notification:', notificationId);
          
          const response = await ApiService.deleteNotification(notificationId);

          if (response.success) {
            set(state => {
              const deletedNotification = state.notifications.find(n => n.id === notificationId);
              const wasUnread = deletedNotification && !deletedNotification.read;
              
              return {
                notifications: state.notifications.filter(n => n.id !== notificationId),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
              };
            });

            console.log('✅ [NOTIFICATIONS STORE] Notification deleted successfully');
          } else {
            throw new Error(response.message || 'Failed to delete notification');
          }
        } catch (error: any) {
          console.error('❌ [NOTIFICATIONS STORE] Delete notification error:', error);
          throw new Error(error.message || 'Failed to delete notification');
        }
      },

      // Clear all notifications
      clearAllNotifications: async () => {
        try {
          console.log('🧹 [NOTIFICATIONS STORE] Clearing all notifications');
          
          const response = await ApiService.clearAllNotifications();

          if (response.success) {
            set({
              notifications: [],
              unreadCount: 0,
            });

            console.log('✅ [NOTIFICATIONS STORE] All notifications cleared successfully');
          } else {
            throw new Error(response.message || 'Failed to clear all notifications');
          }
        } catch (error: any) {
          console.error('❌ [NOTIFICATIONS STORE] Clear all notifications error:', error);
          throw new Error(error.message || 'Failed to clear all notifications');
        }
      },

      // Refresh unread count
      refreshUnreadCount: async () => {
        try {
          console.log('🔢 [NOTIFICATIONS STORE] Refreshing unread count');
          
          const response = await ApiService.getUnreadCount();

          if (response.success && response.data) {
            set({ unreadCount: response.data.count || 0 });
            
            console.log('✅ [NOTIFICATIONS STORE] Unread count refreshed:', response.data.count);
          }
        } catch (error: any) {
          console.error('❌ [NOTIFICATIONS STORE] Refresh unread count error:', error);
          // Don't throw error for count refresh failures
        }
      },

      // Add new notification (for real-time updates)
      addNotification: (notification: Notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
        }));
        
        console.log('📬 [NOTIFICATIONS STORE] New notification added:', notification.title);
      },

      // Update existing notification
      updateNotification: (notificationId: string, updates: Partial<Notification>) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === notificationId);
          if (!notification) return state;

          const wasUnread = !notification.read;
          const willBeRead = updates.read === true;
          const unreadCountChange = wasUnread && willBeRead ? -1 : 0;

          return {
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, ...updates } : n
            ),
            unreadCount: Math.max(0, state.unreadCount + unreadCountChange),
          };
        });
        
        console.log('📝 [NOTIFICATIONS STORE] Notification updated:', notificationId);
      },

      // Clear store (for logout)
      clearStore: () => {
        set({
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          isInitialized: false,
          lastFetch: undefined,
        });
        
        console.log('🧹 [NOTIFICATIONS STORE] Store cleared');
      },
    }),
    {
      name: 'notifications-storage',
      storage: {
        getItem: async (name: string) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Error getting notifications from storage:', error);
            return null;
          }
        },
        setItem: async (name: string, value: any) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error setting notifications to storage:', error);
          }
        },
        removeItem: async (name: string) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing notifications from storage:', error);
          }
        },
      },
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastFetch: state.lastFetch,
        // Don't persist loading states
      }),
    }
  )
);