import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { subjects } from "@/constants/subjects";
import { Check, ArrowRight } from "lucide-react-native";

export default function EditInterestsScreen() {
  const { user, completeOnboarding } = useAuthStore();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (user?.interests) {
      setSelectedSubjects(user.interests);
    }
  }, [user]);

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleSave = () => {
    completeOnboarding(selectedSubjects);
    router.back();
  };

  const renderSubjectItem = ({ item }: { item: string }) => {
    const isSelected = selectedSubjects.includes(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.subjectItem,
          isSelected && styles.selectedSubjectItem,
        ]}
        onPress={() => toggleSubject(item)}
      >
        <Text style={[styles.subjectText, isSelected && styles.selectedSubjectText]}>
          {item}
        </Text>
        {isSelected && <Check size={20} color="#fff" />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Edit Interests" }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Update Your Interests</Text>
        <Text style={styles.subtitle}>
          Select subjects you want to learn to help us find the perfect mentors for you
        </Text>
      </View>

      <FlatList
        data={subjects}
        renderItem={renderSubjectItem}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.subjectList}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedSubjects.length === 0 && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={selectedSubjects.length === 0}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  subjectList: {
    paddingBottom: 20,
  },
  subjectItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    flexDirection: "row",
  },
  selectedSubjectItem: {
    backgroundColor: "#5B8FF9",
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginRight: 8,
  },
  selectedSubjectText: {
    color: "#fff",
  },
  footer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#5B8FF9",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
});