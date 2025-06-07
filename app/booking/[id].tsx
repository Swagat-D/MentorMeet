import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { mentors } from "@/mocks/mentors";
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react-native";
import { formatDate } from "@/utils/date-utils";

// Generate time slots from 9 AM to 5 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    slots.push(`${hour}:00`);
    if (hour < 17) {
      slots.push(`${hour}:30`);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Generate dates for the next 7 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<number | null>(null);
  
  const mentor = mentors.find((m) => m.id === id);
  const dates = generateDates();
  
  if (!mentor) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Mentor not found</Text>
      </SafeAreaView>
    );
  }

  const handleContinue = () => {
    if (selectedSessionType !== null && selectedTime) {
      router.push({
        pathname: `/payment/${mentor.id}`,
        params: {
          sessionType: selectedSessionType.toString(),
          date: selectedDate.toISOString(),
          time: selectedTime,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Book a Session with</Text>
          <Text style={styles.mentorName}>{mentor.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Session Type</Text>
          {mentor.sessionTypes.map((session: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sessionTypeItem,
                selectedSessionType === index && styles.selectedSessionTypeItem,
              ]}
              onPress={() => setSelectedSessionType(index)}
            >
              <View>
                <Text style={styles.sessionTypeTitle}>{session.title}</Text>
                <Text style={styles.sessionTypeDuration}>{session.duration} minutes</Text>
              </View>
              <Text style={styles.sessionTypePrice}>${session.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.datesContainer}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateItem,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dateDay,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateText,
                  ]}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
                <Text
                  style={[
                    styles.dateNumber,
                    selectedDate.toDateString() === date.toDateString() && styles.selectedDateText,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotsContainer}>
            {timeSlots.map((time, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.selectedTimeSlotText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Calendar size={16} color="#666" />
              <Text style={styles.summaryItemLabel}>Date</Text>
            </View>
            <Text style={styles.summaryItemValue}>
              {selectedDate ? formatDate(selectedDate) : "Not selected"}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Clock size={16} color="#666" />
              <Text style={styles.summaryItemLabel}>Time</Text>
            </View>
            <Text style={styles.summaryItemValue}>
              {selectedTime || "Not selected"}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={styles.summaryItemLabel}>Session</Text>
            </View>
            <Text style={styles.summaryItemValue}>
              {selectedSessionType !== null
                ? mentor.sessionTypes[selectedSessionType].title
                : "Not selected"}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={styles.summaryItemLabel}>Price</Text>
            </View>
            <Text style={styles.summaryItemValue}>
              {selectedSessionType !== null
                ? `$${mentor.sessionTypes[selectedSessionType].price}`
                : "$0"}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedSessionType || !selectedTime) && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedSessionType || !selectedTime}
          >
            <Text style={styles.continueButtonText}>Continue to Payment</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    color: "#666",
  },
  mentorName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  sessionTypeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedSessionTypeItem: {
    borderColor: "#5B8FF9",
    backgroundColor: "#f0f7ff",
  },
  sessionTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  sessionTypeDuration: {
    fontSize: 14,
    color: "#666",
  },
  sessionTypePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5B8FF9",
  },
  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateItem: {
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    width: 45,
  },
  selectedDateItem: {
    backgroundColor: "#5B8FF9",
    borderColor: "#5B8FF9",
  },
  dateDay: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  selectedDateText: {
    color: "#fff",
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  timeSlot: {
    width: "30%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginRight: "5%",
    marginBottom: 12,
    alignItems: "center",
  },
  timeSlot3n: {
    marginRight: 0,
  },
  selectedTimeSlot: {
    backgroundColor: "#5B8FF9",
    borderColor: "#5B8FF9",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#333",
  },
  selectedTimeSlotText: {
    color: "#fff",
  },
  summarySection: {
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItemLabel: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: "#5B8FF9",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
});