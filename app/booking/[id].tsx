// app/booking/[id].tsx - Updated Booking Page with Header
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { mentors } from "@/mocks/mentors";
import { Calendar, Clock, ArrowRight } from "lucide-react-native";
import { formatDate } from "@/utils/date-utils";
import SecondaryHeader from "@/components/navigation/SecondaryHeader";

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
      <View style={styles.container}>
        <SecondaryHeader title="Booking" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mentor not found</Text>
        </View>
      </View>
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
    <View style={styles.container}>
      <SecondaryHeader 
        title="Book Session" 
        subtitle={`with ${mentor.name}`}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  sessionTypeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedSessionTypeItem: {
    borderColor: "#4F46E5",
    backgroundColor: "#F0F9FF",
  },
  sessionTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  sessionTypeDuration: {
    fontSize: 14,
    color: "#6B7280",
  },
  sessionTypePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateItem: {
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    width: 45,
  },
  selectedDateItem: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  dateDay: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
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
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginRight: "5%",
    marginBottom: 12,
    alignItems: "center",
  },
  selectedTimeSlot: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#1F2937",
  },
  selectedTimeSlotText: {
    color: "#fff",
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  continueButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#E5E7EB",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
});