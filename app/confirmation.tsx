import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Clock, CheckCircle, Home } from "lucide-react-native";
import { formatDate } from "@/utils/date-utils";

export default function ConfirmationScreen() {
  const { mentorName, sessionTitle, date, time, price } = useLocalSearchParams<{
    mentorName: string;
    sessionTitle: string;
    date: string;
    time: string;
    price: string;
  }>();
  
  const selectedDate = date ? new Date(date) : new Date();

  const handleGoHome = () => {
    router.replace("/(tabs)");
  };

  const handleViewSessions = () => {
    router.replace("/(tabs)/sessions");
  };

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color="#5B8FF9" />
        </View>
        
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your session has been successfully booked
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Details</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Mentor</Text>
            <Text style={styles.detailValue}>{mentorName}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Session</Text>
            <Text style={styles.detailValue}>{sessionTitle}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailWithIcon}>
              <Calendar size={16} color="#666" />
              <Text style={styles.detailLabelWithIcon}>Date</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(selectedDate)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailWithIcon}>
              <Clock size={16} color="#666" />
              <Text style={styles.detailLabelWithIcon}>Time</Text>
            </View>
            <Text style={styles.detailValue}>{time}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>${price}</Text>
          </View>
        </View>

        <Text style={styles.infoText}>
          A confirmation email has been sent to your registered email address.
          You can also view this session in your Sessions tab.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewSessions}>
          <Text style={styles.primaryButtonText}>View My Sessions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
          <Home size={20} color="#5B8FF9" />
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabelWithIcon: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 12,
  },
  totalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5B8FF9",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#5B8FF9",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#5B8FF9",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});