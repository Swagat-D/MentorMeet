import { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { sessions } from "@/mocks/sessions";
import { Calendar, Clock, Video } from "lucide-react-native";
import { formatDate, formatTime } from "@/utils/date-utils";

type TabType = "upcoming" | "past";

export default function SessionsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  const upcomingSessions = sessions.filter(
    (session) => new Date(session.date) > new Date()
  );
  
  const pastSessions = sessions.filter(
    (session) => new Date(session.date) <= new Date()
  );

  const renderSessionItem = ({ item }: { item: typeof sessions[0] }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => router.push(`/mentor/${item.mentor.id}`)}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionSubject}>{item.subject}</Text>
        <Text style={styles.sessionPrice}>${item.price}</Text>
      </View>
      
      <Text style={styles.mentorName}>{item.mentor.name}</Text>
      
      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <Calendar size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Clock size={16} color="#666" />
          <Text style={styles.detailText}>{formatTime(item.date)}</Text>
        </View>
      </View>
      
      {activeTab === "upcoming" && (
        <TouchableOpacity style={styles.joinButton}>
          <Video size={16} color="#fff" />
          <Text style={styles.joinButtonText}>Join Session</Text>
        </TouchableOpacity>
      )}
      
      {activeTab === "past" && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Your Rating:</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                style={[
                  styles.star,
                  star <= (item.userRating || 0) && styles.filledStar,
                ]}
              >
                ★
              </Text>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "upcoming" ? upcomingSessions : pastSessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.sessionsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "upcoming"
                ? "No upcoming sessions"
                : "No past sessions"}
            </Text>
            <TouchableOpacity
              style={styles.findMentorsButton}
              onPress={() => router.push("/(tabs)/")}
            >
              <Text style={styles.findMentorsButtonText}>Find Mentors</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#5B8FF9",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  activeTabText: {
    color: "#5B8FF9",
  },
  sessionsList: {
    padding: 20,
  },
  sessionCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5B8FF9",
  },
  sessionPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  mentorName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sessionDetails: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  joinButton: {
    backgroundColor: "#5B8FF9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: "row",
  },
  star: {
    fontSize: 18,
    color: "#ddd",
    marginRight: 2,
  },
  filledStar: {
    color: "#FFD700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  findMentorsButton: {
    backgroundColor: "#5B8FF9",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  findMentorsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});