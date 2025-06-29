// app/support/terms.tsx - Terms of Service Page
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function TermsOfServiceScreen() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, []);

  const Section = ({ title, children, icon }: { title: string; children: React.ReactNode; icon: string }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon as any} size={20} color="#8b5a3c" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Text style={styles.paragraph}>{children}</Text>
  );

  const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletPoint}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );

  const NumberedPoint = ({ number, children }: { number: string; children: React.ReactNode }) => (
    <View style={styles.numberedPoint}>
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{number}</Text>
      </View>
      <Text style={styles.numberedText}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="description" size={32} color="#8b5a3c" />
            </View>
            <Text style={styles.headerInfoTitle}>Terms of Service</Text>
            <Text style={styles.headerInfoSubtitle}>
              Please read these terms carefully before using MentorMatch
            </Text>
            <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
          </View>

          {/* Terms Content */}
          <View style={styles.termsContainer}>
            <Section title="Acceptance of Terms" icon="check-circle">
              <Paragraph>
                By accessing and using MentorMatch ("the App"), you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </Paragraph>
            </Section>

            <Section title="Description of Service" icon="app-registration">
              <Paragraph>
                MentorMatch is an educational platform that connects students with mentors for 
                learning and academic support. Our services include:
              </Paragraph>
              <BulletPoint>Mentor-student matching based on learning goals and preferences</BulletPoint>
              <BulletPoint>Scheduling and conducting learning sessions</BulletPoint>
              <BulletPoint>Progress tracking and learning analytics</BulletPoint>
              <BulletPoint>Educational resources and study materials</BulletPoint>
              <BulletPoint>Communication tools between mentors and students</BulletPoint>
            </Section>

            <Section title="User Responsibilities" icon="person-outline">
              <Paragraph>
                As a user of MentorMatch, you agree to:
              </Paragraph>
              <NumberedPoint number="1">
                Provide accurate and truthful information during registration and profile setup
              </NumberedPoint>
              <NumberedPoint number="2">
                Maintain the confidentiality of your account credentials
              </NumberedPoint>
              <NumberedPoint number="3">
                Use the platform for legitimate educational purposes only
              </NumberedPoint>
              <NumberedPoint number="4">
                Treat all users with respect and maintain professional conduct
              </NumberedPoint>
              <NumberedPoint number="5">
                Comply with all applicable laws and regulations
              </NumberedPoint>
            </Section>

            <Section title="Prohibited Activities" icon="block">
              <Paragraph>
                Users are prohibited from:
              </Paragraph>
              <BulletPoint>Sharing inappropriate, offensive, or harmful content</BulletPoint>
              <BulletPoint>Harassing, bullying, or threatening other users</BulletPoint>
              <BulletPoint>Attempting to access unauthorized areas of the platform</BulletPoint>
              <BulletPoint>Using the platform for commercial purposes without permission</BulletPoint>
              <BulletPoint>Violating intellectual property rights</BulletPoint>
              <BulletPoint>Creating fake accounts or impersonating others</BulletPoint>
            </Section>

            <Section title="Privacy and Data Protection" icon="security">
              <Paragraph>
                Your privacy is important to us. Please review our Privacy Policy to understand 
                how we collect, use, and protect your personal information. By using MentorMatch, 
                you consent to the collection and use of your information as outlined in our Privacy Policy.
              </Paragraph>
            </Section>

            <Section title="Limitation of Liability" icon="warning">
              <Paragraph>
                MentorMatch provides the platform "as is" without warranties of any kind. We are not 
                liable for any direct, indirect, incidental, or consequential damages arising from 
                your use of the platform.
              </Paragraph>
            </Section>

            <Section title="Contact Information" icon="contact-support">
              <Paragraph>
                If you have any questions about these Terms of Service, please contact us at:
              </Paragraph>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <MaterialIcons name="email" size={16} color="#8b5a3c" />
                  <Text style={styles.contactText}>support@mentormatch.com</Text>
                </View>
                <View style={styles.contactItem}>
                  <MaterialIcons name="language" size={16} color="#8b5a3c" />
                  <Text style={styles.contactText}>www.mentormatch.com</Text>
                </View>
              </View>
            </Section>

            {/* Agreement Notice */}
            <View style={styles.agreementNotice}>
              <MaterialIcons name="info" size={20} color="#8b5a3c" />
              <Text style={styles.agreementText}>
                By using MentorMatch, you acknowledge that you have read, understood, and agree 
                to be bound by these Terms of Service.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
  },
  headerButton: {
    width: 40,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerInfo: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  headerInfoTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 8,
    textAlign: "center",
  },
  headerInfoSubtitle: {
    fontSize: 16,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#a0916d",
    fontStyle: "italic",
  },
  termsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginLeft: 8,
  },
  sectionContent: {
    paddingLeft: 28,
  },
  paragraph: {
    fontSize: 15,
    color: "#4a3728",
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8b5a3c",
    marginRight: 12,
    marginTop: 8,
  },
  bulletText: {
    fontSize: 15,
    color: "#4a3728",
    lineHeight: 22,
    flex: 1,
  },
  numberedPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8b5a3c",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  numberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  numberedText: {
    fontSize: 15,
    color: "#4a3728",
    lineHeight: 22,
    flex: 1,
  },
  contactInfo: {
    marginTop: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    color: "#4a3728",
    marginLeft: 8,
  },
  agreementNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
    marginTop: 16,
  },
  agreementText: {
    fontSize: 14,
    color: "#4a3728",
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});