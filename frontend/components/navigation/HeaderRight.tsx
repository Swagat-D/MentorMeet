// frontend/components/navigation/HeaderRight.tsx - Updated with Dynamic Notifications Badge
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useNotificationsStore } from "@/stores/notificationsStore";

export default function HeaderRight() {
  const { getFavoriteCount } = useFavoritesStore();
  const { unreadCount, refreshUnreadCount, isInitialized } = useNotificationsStore();
  
  const favoriteCount = getFavoriteCount();

  // Refresh unread count when component mounts or becomes visible
  useEffect(() => {
    if (!isInitialized) {
      refreshUnreadCount();
    }
  }, [isInitialized, refreshUnreadCount]);

  // Refresh unread count periodically (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => router.push("/favorites")}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="bookmark-border" size={22} color="#5d4e37" strokeWidth={2} />
          {favoriteCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {favoriteCount > 99 ? '99+' : favoriteCount.toString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => router.push("/notifications")}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="notifications" size={22} color="#5d4e37" strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={[styles.badge, styles.notificationBadge]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 8,
  },
  iconContainer: {
    position: "relative",
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#8b5a3c",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  notificationBadge: {
    backgroundColor: "#dc2626",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
});