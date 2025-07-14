// components/navigation/SidebarDrawer.tsx - Minimal Professional Sidebar
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.75);

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  badge?: string;
  badgeColor?: string;
  iconColor?: string;
}

const menuSections = [
  {
    title: 'Learning',
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', route: '/(tabs)/', iconColor: '#8B4513' },
      { id: 'search', title: 'Find Mentors', icon: 'search', route: '/(tabs)/search', iconColor: '#8B4513' },
      { id: 'sessions', title: 'My Sessions', icon: 'video-call', route: '/(tabs)/sessions', iconColor: '#8B4513' },
      { id: 'progress', title: 'Progress', icon: 'trending-up', route: '/progress', iconColor: '#8B4513' },
    ]
  },
  {
    title: 'Assessment',
    items: [
      { 
        id: 'psychometric', 
        title: 'Career Assessment', 
        icon: 'psychology', 
        route: '/psychometric-test', 
        badge: 'NEW',
        badgeColor: '#7C3AED',
        iconColor: '#7C3AED'
      },
      { id: 'personality', title: 'Personality Test', icon: 'mood', route: '/personality-test', iconColor: '#059669' },
      { id: 'skills', title: 'Skills Evaluation', icon: 'quiz', route: '/skills-evaluation', iconColor: '#DC2626' },
    ]
  },
  {
    title: 'Account',
    items: [
      { id: 'profile', title: 'My Profile', icon: 'person', route: '/(tabs)/profile', iconColor: '#8B4513' },
      { id: 'achievements', title: 'Achievements', icon: 'emoji-events', route: '/achievements', iconColor: '#F59E0B' },
      { id: 'settings', title: 'Settings', icon: 'settings', route: '/settings', iconColor: '#6B7280' },
      { id: 'help', title: 'Help & Support', icon: 'help-outline', route: '/help', iconColor: '#6B7280' },
    ]
  }
];

export default function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
  const { user, logout } = useAuthStore();
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));
  const [upcomingSessions, setUpcomingSessions] = useState(0);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  const navigateTo = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              onClose();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name || 'User'
  )}&background=8B4513&color=fff&size=200&bold=true`;

  const renderMenuItem = (item: MenuItem, sectionIndex: number, itemIndex: number) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => navigateTo(item.route)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemIcon}>
        <MaterialIcons 
          name={item.icon as any} 
          size={20} 
          color={item.iconColor || '#8B4513'} 
        />
      </View>
      <Text style={styles.menuItemText}>{item.title}</Text>
      
      {item.id === 'sessions' && upcomingSessions > 0 && (
        <View style={styles.menuItemBadge}>
          <Text style={styles.badgeText}>{upcomingSessions}</Text>
        </View>
      )}
      
      {item.badge && (
        <View style={[styles.menuItemBadge, { backgroundColor: item.badgeColor || '#8B4513' }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatar || defaultAvatar }} 
              style={styles.avatar}
            />
            <View style={styles.statusDot} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'Student'}
            </Text>
            <Text style={styles.userRole}>Learning Journey</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#8B7355" />
        </TouchableOpacity>
      </View>

      {/* Menu Container - Fixed height, no scroll needed */}
      <View style={styles.menuContainer}>
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => 
              renderMenuItem(item, sectionIndex, itemIndex)
            )}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>MentorMatch v1.0.0</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  
  // Compact header section
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FAFAFA',
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E8DDD1',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  
  // Menu sections - Fixed layout
  menuContainer: {
    flex: 1,
    paddingVertical: 12,
  },
  menuSection: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B7355',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  
  // Menu items with modern box structure
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemIcon: {
    width: 24,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    flex: 1,
  },
  menuItemBadge: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#FAFAFA',
    borderBottomRightRadius: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    color: '#8B7355',
    fontWeight: '500',
  },
});