// app/support/privacy.tsx - Privacy Policy Page
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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
              <MaterialIcons name="privacy-tip" size={32} color="#8b5a3c" />
            </View>
            <Text style={styles.headerInfoTitle}>Your Privacy Matters</Text>
            <Text style={styles.headerInfoSubtitle}>
              Learn how we collect, use, and protect your personal information
            </Text>
            <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
          </View>

          {/* Privacy Policy Content */}
          <View style={styles.policyContainer}>
            <Section title="Introduction" icon="info">
              <Paragraph>
                Welcome to MentorMatch. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our mobile application and related services. 
                Please read this privacy policy carefully. If you do not agree with the terms of this 
                privacy policy, please do not access the application.
              </Paragraph>
            </Section>

            <Section title="Information We Collect" icon="data-usage">
              <Paragraph>
                We collect information about you in a variety of ways:
              </Paragraph>
              
              <Text style={styles.subheading}>Personal Data</Text>
              <BulletPoint>Name, email address, and contact information</BulletPoint>
              <BulletPoint>Profile information including age range, gender, and study level</BulletPoint>
              <BulletPoint>Learning goals and educational preferences</BulletPoint>
              <BulletPoint>Profile pictures and bio information</BulletPoint>
              
              <Text style={styles.subheading}>Usage Data</Text>
              <BulletPoint>App usage analytics and interaction patterns</BulletPoint>
              <BulletPoint>Session data including learning progress and mentor interactions</BulletPoint>
              <BulletPoint>Device information and technical data</BulletPoint>
            </Section>

            <Section title="How We Use Your Information" icon="settings">
              <Paragraph>
                We use the information we collect to:
              </Paragraph>
              <BulletPoint>Provide and maintain our educational platform</BulletPoint>
              <BulletPoint>Match students with appropriate mentors</BulletPoint>
              <BulletPoint>Personalize your learning experience</BulletPoint>
              <BulletPoint>Send important notifications and updates</BulletPoint>
              <BulletPoint>Improve our services and develop new features</BulletPoint>
              <BulletPoint>Ensure platform security and prevent fraud</BulletPoint>
            </Section>

            <Section title="Information Sharing" icon="share">
              <Paragraph>
                We do not sell, trade, or otherwise transfer your personal information to third parties except:
              </Paragraph>
              <BulletPoint>With your explicit consent</BulletPoint>
              <BulletPoint>To provide requested services (mentor matching)</BulletPoint>
              <BulletPoint>To comply with legal obligations</BulletPoint>
              <BulletPoint>To protect our rights and safety</BulletPoint>
            </Section>

            <Section title="Data Security" icon="security">
              <Paragraph>
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. This includes:
              </Paragraph>
              <BulletPoint>Encryption of sensitive data</BulletPoint>
              <BulletPoint>Secure server infrastructure</BulletPoint>
              <BulletPoint>Regular security audits and updates</BulletPoint>
              <BulletPoint>Limited access to personal information</BulletPoint>
            </Section>

            <Section title="Your Rights" icon="account-circle">
              <Paragraph>
                You have the right to:
              </Paragraph>
              <BulletPoint>Access and update your personal information</BulletPoint>
              <BulletPoint>Delete your account and associated data</BulletPoint>
              <BulletPoint>Opt out of non-essential communications</BulletPoint>
              <BulletPoint>Request a copy of your data</BulletPoint>
              <BulletPoint>Report privacy concerns to our team</BulletPoint>
            </Section>

            <Section title="Cookies and Tracking" icon="cookie">
              <Paragraph>
                We use cookies and similar technologies to enhance your experience and analyze app usage. 
                You can control cookie preferences through your device settings.
              </Paragraph>
            </Section>

            <Section title="Children's Privacy" icon="child-care">
              <Paragraph>
                Our service is designed for users aged 13 and above. We do not knowingly collect 
                personal information from children under 13. If we discover we have collected 
                information from a child under 13, we will delete it immediately.
              </Paragraph>
            </Section>

            <Section title="Changes to Privacy Policy" icon="update">
              <Paragraph>
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </Paragraph>
            </Section>

            <Section title="Contact Us" icon="contact-support">
              <Paragraph>
                If you have any questions about this Privacy Policy, please contact us at:
              </Paragraph>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <MaterialIcons name="email" size={16} color="#8b5a3c" />
                  <Text style={styles.contactText}>privacy@mentormatch.com</Text>
                </View>
                <View style={styles.contactItem}>
                  <MaterialIcons name="language" size={16} color="#8b5a3c" />
                  <Text style={styles.contactText}>www.mentormatch.com/privacy</Text>
                </View>
              </View>
            </Section>

            {/* Privacy Notice */}
            <View style={styles.privacyNotice}>
              <MaterialIcons name="shield" size={20} color="#8b5a3c" />
              <Text style={styles.privacyText}>
                Your privacy is important to us. We are committed to protecting your personal 
                information and being transparent about how we use it.
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
  policyContainer: {
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
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a3728",
    marginTop: 12,
    marginBottom: 8,
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
  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
    marginTop: 16,
  },
  privacyText: {
    fontSize: 14,
    color: "#4a3728",
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});