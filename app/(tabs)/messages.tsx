// app/(tabs)/messages.tsx - Enhanced Professional Messages Screen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  MessageSquare,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Clock,
  Pin,
  Archive,
  Star,
  Filter,
} from "lucide-react-native";
import { formatRelativeTime } from "@/utils/date-utils";

const { width } = Dimensions.get('window');

// Mock chat data
const mockChats = [
  {
    id: '1',
    mentorId: '1',
    mentorName: 'Dr. Sarah Chen',
    mentorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    lastMessage: 'Great job on the algorithm implementation! Let\'s schedule a follow-up session.',
    timestamp: '2024-01-20T15:30:00Z',
    unreadCount: 2,
    isOnline: true,
    isPinned: false,
    messageType: 'text',
    isRead: false,
    subject: 'Computer Science',
  },
  {
    id: '2',
    mentorId: '2',
    mentorName: 'Prof. Michael Thompson',
    mentorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
    lastMessage: 'The calculus problem you sent was challenging. Here\'s my solution...',
    timestamp: '2024-01-20T10:15:00Z',
    unreadCount: 0,
    isOnline: false,
    isPinned: true,
    messageType: 'text',
    isRead: true,
    subject: 'Mathematics',
  },
  {
    id: '3',
    mentorId: '3',
    mentorName: 'Dr. Priya Patel',
    mentorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
    lastMessage: 'Your data visualization project looks amazing! 🎉',
    timestamp: '2024-01-19T18:45:00Z',
    unreadCount: 1,
    isOnline: true,
    isPinned: false,
    messageType: 'text',
    isRead: false,
    subject: 'Data Science',
  },
  {
    id: '4',
    mentorId: '4',
    mentorName: 'Alex Rodriguez',
    mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    lastMessage: 'Voice message (0:45)',
    timestamp: '2024-01-19T14:20:00Z',
    unreadCount: 0,
    isOnline: false,
    isPinned: false,
    messageType: 'voice',
    isRead: true,
    subject: 'Web Development',
  },
  {
    id: '5',
    mentorId: '5',
    mentorName: 'Emma Wilson',
    mentorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200',
    lastMessage: 'Session recording shared',
    timestamp: '2024-01-18T16:30:00Z',
    unreadCount: 0,
    isOnline: true,
    isPinned: false,
    messageType: 'file',
    isRead: true,
    subject: 'Business Studies',
  },
];

export default function MessagesScreen() {
  const [chats, setChats] = useState(mockChats);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState(mockChats);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pinned'>('all');

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    let filtered = chats;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(chat =>
        chat.mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(chat => chat.unreadCount > 0);
        break;
      case 'pinned':
        filtered = filtered.filter(chat => chat.isPinned);
        break;
      default:
        break;
    }

    // Sort by pinned first, then by timestamp
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setFilteredChats(filtered);
  }, [searchQuery, chats, selectedFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleChatPress = (chat: any) => {
    // Mark as read
    setChats(prevChats =>
      prevChats.map(c =>
        c.id === chat.id ? { ...c, unreadCount: 0, isRead: true } : c
      )
    );
    router.push(`/chat/${chat.id}`);
  };

  const togglePin = (chatId: string) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
      )
    );
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'voice':
        return <Phone size={14} color="#6B7280" />;
      case 'file':
        return <Archive size={14} color="#6B7280" />;
      default:
        return null;
    }
  };

  const FilterButton = ({ type, label, count }: { type: string; label: string; count?: number }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === type && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(type as any)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === type && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ChatItem = ({ chat }: { chat: any }) => (
    <TouchableOpacity
      style={[styles.chatItem, !chat.isRead && styles.unreadChatItem]}
      onPress={() => handleChatPress(chat)}
      activeOpacity={0.7}
    >
      <View style={styles.chatLeft}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: chat.mentorAvatar }} style={styles.avatar} />
          {chat.isOnline && <View style={styles.onlineIndicator} />}
          {chat.isPinned && (
            <View style={styles.pinnedIndicator}>
              <Pin size={10} color="#F59E0B" />
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.mentorName, !chat.isRead && styles.unreadText]} numberOfLines={1}>
              {chat.mentorName}
            </Text>
            <View style={styles.timestampContainer}>
              <Text style={styles.timestamp}>
                {formatRelativeTime(chat.timestamp)}
              </Text>
              {!chat.isRead && <CheckCheck size={14} color="#4F46E5" />}
            </View>
          </View>

          <View style={styles.messageRow}>
            <View style={styles.messageContent}>
              {getMessageIcon(chat.messageType)}
              <Text 
                style={[styles.lastMessage, !chat.isRead && styles.unreadMessage]} 
                numberOfLines={2}
              >
                {chat.lastMessage}
              </Text>
            </View>
          </View>

          <Text style={styles.subject}>{chat.subject}</Text>
        </View>
      </View>

      <View style={styles.chatRight}>
        {chat.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => togglePin(chat.id)}
        >
          <MoreVertical size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MessageSquare size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start learning by booking a session with a mentor
      </Text>
      <TouchableOpacity
        style={styles.startChatButton}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Text style={styles.startChatButtonText}>Find Mentors</Text>
      </TouchableOpacity>
    </View>
  );

  const totalUnread = chats.filter(chat => chat.unreadCount > 0).length;
  const totalPinned = chats.filter(chat => chat.isPinned).length;

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FilterButton type="all" label="All" />
          <FilterButton type="unread" label="Unread" count={totalUnread} />
          <FilterButton type="pinned" label="Pinned" count={totalPinned} />
        </View>
      </View>

      {/* Chat List */}
      <Animated.View style={[styles.chatList, { opacity: fadeAnim }]}>
        {filteredChats.length === 0 ? (
          searchQuery.trim() ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching with different keywords
              </Text>
            </View>
          ) : (
            <EmptyState />
          )
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={({ item }) => <ChatItem chat={item} />}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatListContent}
          />
        )}
      </Animated.View>

      {/* Quick Actions */}
      {filteredChats.length > 0 && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MessageSquare size={20} color="#fff" />
              <Text style={styles.quickActionText}>New Conversation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  clearSearch: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
  },
  filtersContainer: {
    flexDirection: "row",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: "#4F46E5",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  filterBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 18,
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingTop: 8,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  unreadChatItem: {
    backgroundColor: "#FAFBFF",
  },
  chatLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pinnedIndicator: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  unreadText: {
    fontWeight: "bold",
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    marginRight: 4,
  },
  messageRow: {
    marginBottom: 4,
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginLeft: 4,
  },
  unreadMessage: {
    color: "#1F2937",
    fontWeight: "500",
  },
  subject: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  chatRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 50,
  },
  unreadBadge: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  moreButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startChatButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  quickActions: {
    padding: 20,
    paddingBottom: 10,
  },
  quickActionButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});