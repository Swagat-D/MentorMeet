// components/navigation/HeaderRight.tsx - Enhanced Header Right Component  
import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { router } from "expo-router";
import { Search, Bell, Bookmark } from "lucide-react-native";
import { useFavoritesStore } from "@/stores/favorites-store";

export default function HeaderRight() {
  const { getFavoriteCount } = useFavoritesStore();
  const favoriteCount = getFavoriteCount();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => router.push("/favorites")}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Bookmark size={22} color="#1F2937" strokeWidth={2} />
          {favoriteCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {favoriteCount > 99 ? '99+' : favoriteCount}
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
          <Bell size={22} color="#1F2937" strokeWidth={2} />
          {/* Notification badge - you can make this dynamic */}
          <View style={[styles.badge, styles.notificationBadge]}>
            <Text style={styles.badgeText}>3</Text>
          </View>
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
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    backgroundColor: "#EF4444",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
});