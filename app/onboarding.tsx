import { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Easing } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth-store";
import { subjects } from "@/constants/subjects";
import { ArrowRight, Check } from "lucide-react-native";

export default function OnboardingScreen() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const { completeOnboarding } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  // Animation on mount
  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  });

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleContinue = () => {
    completeOnboarding(selectedSubjects);
    router.replace("/(tabs)");
  };

  const renderSubjectItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = selectedSubjects.includes(item);
    
    // Staggered animation for each item
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemTranslateYAnim = useRef(new Animated.Value(20)).current;
    
    useState(() => {
      Animated.parallel([
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(itemTranslateYAnim, {
          toValue: 0,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    });
    
    return (
      <Animated.View
        style={{
          opacity: itemFadeAnim,
          transform: [{ translateY: itemTranslateYAnim }],
          flex: 1,
        }}
      >
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
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        <Text style={styles.title}>What are you interested in?</Text>
        <Text style={styles.subtitle}>
          Select subjects you want to learn to help us find the perfect mentors for you
        </Text>
      </Animated.View>

      <FlatList
        data={subjects}
        renderItem={renderSubjectItem}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.subjectList}
      />

      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedSubjects.length === 0 && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={selectedSubjects.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
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
    fontSize: 28,
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
  continueButton: {
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
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
});