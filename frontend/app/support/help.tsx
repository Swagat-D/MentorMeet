// app/support/index.tsx - Help & Support Main Page
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SupportItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  action?: () => void;
  color: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'account' | 'learning' | 'technical';
}

export default function SupportScreen() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

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

  const supportItems: SupportItem[] = [
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions',
      icon: 'quiz',
      route: '/support/faq',
      color: '#8b5a3c',
    },
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Get in touch with our support team',
      icon: 'support-agent',
      route: '/support/contact',
      color: '#d97706',
    },
    {
      id: 'tutorials',
      title: 'Tutorials & Guides',
      description: 'Learn how to use MentorMatch',
      icon: 'school',
      route: '/support/tutorials',
      color: '#059669',
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      description: 'Help us improve the app',
      icon: 'feedback',
      route: '/support/feedback',
      color: '#7c3aed',
    },
    {
      id: 'report',
      title: 'Report an Issue',
      description: 'Report bugs or technical problems',
      icon: 'bug-report',
      route: '/support/report-issue',
      color: '#dc2626',
    },
    {
      id: 'community',
      title: 'Community Forum',
      description: 'Connect with other learners',
      icon: 'forum',
      action: () => {
        Alert.alert(
          'Community Forum',
          'Visit our community forum to connect with other learners and mentors.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Visit Forum', 
              onPress: () => Linking.openURL('https://community.mentormatch.com')
            }
          ]
        );
      },
      color: '#0891b2',
    },
  ];

  const quickFAQs: FAQItem[] = [
    {
      id: 'booking',
      question: 'How do I book a session with a mentor?',
      answer: 'To book a session, go to the Search tab, find a mentor you like, tap on their profile, and select "Book Session". Choose your preferred time slot and confirm your booking.',
      category: 'learning',
    },
    {
      id: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards (Visa, Mastercard, American Express), PayPal, and various digital payment methods depending on your region.',
      category: 'general',
    },
    {
      id: 'cancel',
      question: 'Can I cancel or reschedule a session?',
      answer: 'Yes, you can cancel or reschedule sessions up to 24 hours before the scheduled time. Go to your Sessions tab and tap on the session you want to modify.',
      category: 'learning',
    },
    {
      id: 'verification',
      question: 'How do I verify my email address?',
      answer: 'After registration, check your email for a verification code. Enter this code in the app to verify your account. If you don\'t receive it, check your spam folder or request a new code.',
      category: 'account',
    },
  ];

  const handleSupportItemPress = (item: SupportItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const SupportItemCard = ({ item, index }: { item: SupportItem; index: number }) => (
    <Animated.View
      style={[
        styles.supportItemCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + (index * 10)],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.supportItem}
        onPress={() => handleSupportItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.supportIcon, { backgroundColor: item.color + '15' }]}>
          <MaterialIcons name={item.icon as any} size={24} color={item.color} />
        </View>
        <View style={styles.supportContent}>
          <Text style={styles.supportTitle}>{item.title}</Text>
          <Text style={styles.supportDescription}>{item.description}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#a0916d" />
      </TouchableOpacity>
    </Animated.View>
  );

  const FAQCard = ({ faq, index }: { faq: FAQItem; index: number }) => (
    <Animated.View
      style={[
        styles.faqCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + (index * 5)],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => toggleFAQ(faq.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <MaterialIcons 
          name={expandedFAQ === faq.id ? "expand-less" : "expand-more"} 
          size={24} 
          color="#8b5a3c" 
        />
      </TouchableOpacity>
      {expandedFAQ === faq.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
    </Animated.View>
  );

  const EmergencyContact = () => (
    <Animated.View
      style={[
        styles.emergencyCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(220, 38, 38, 0.1)', 'rgba(239, 68, 68, 0.05)']}
        style={styles.emergencyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.emergencyHeader}>
          <MaterialIcons name="emergency" size={24} color="#dc2626" />
          <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
        </View>
        <Text style={styles.emergencyText}>
          If you're experiencing a technical emergency or urgent account issue, 
          contact our 24/7 support team.
        </Text>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => Linking.openURL('mailto:emergency@mentormatch.com')}
        >
          <MaterialIcons name="email" size={16} color="#dc2626" />
          <Text style={styles.emergencyButtonText}>Emergency Support</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Warm Background */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <Animated.View
          style={[
            styles.welcomeCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeIcon}>
              <MaterialIcons name="support-agent" size={32} color="#8b5a3c" />
            </View>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>How can we help you?</Text>
              <Text style={styles.welcomeSubtitle}>
                Our support team is here to assist you with any questions or issues
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Options</Text>
          <View style={styles.supportGrid}>
            {supportItems.map((item, index) => (
              <SupportItemCard key={item.id} item={item} index={index} />
            ))}
          </View>
        </View>

        {/* Quick FAQs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Help</Text>
            <TouchableOpacity onPress={() => router.push('/support/faq')}>
              <Text style={styles.sectionLink}>View All FAQs</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.faqList}>
            {quickFAQs.map((faq, index) => (
              <FAQCard key={faq.id} faq={faq} index={index} />
            ))}
          </View>
        </View>

        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          
          <View style={styles.contactMethods}>
            <TouchableOpacity 
              style={styles.contactMethod}
              onPress={() => Linking.openURL('mailto:support@mentormatch.com')}
            >
              <MaterialIcons name="email" size={20} color="#8b5a3c" />
              <View style={styles.contactMethodText}>
                <Text style={styles.contactMethodTitle}>Email Support</Text>
                <Text style={styles.contactMethodSubtitle}>support@mentormatch.com</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#a0916d" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactMethod}
              onPress={() => Linking.openURL('https://chat.mentormatch.com')}
            >
              <MaterialIcons name="chat" size={20} color="#d97706" />
              <View style={styles.contactMethodText}>
                <Text style={styles.contactMethodTitle}>Live Chat</Text>
                <Text style={styles.contactMethodSubtitle}>Available 9 AM - 6 PM EST</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#a0916d" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactMethod}
              onPress={() => Linking.openURL('tel:+1-800-MENTOR-1')}
            >
              <MaterialIcons name="phone" size={20} color="#059669" />
              <View style={styles.contactMethodText}>
                <Text style={styles.contactMethodTitle}>Phone Support</Text>
                <Text style={styles.contactMethodSubtitle}>+1-800-MENTOR-1</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#a0916d" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contact */}
        <EmergencyContact />

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoTitle}>MentorMatch</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoText}>
            Making quality education accessible to everyone
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 14,
    color: "#8b5a3c",
    fontWeight: "600",
  },
  supportGrid: {
    gap: 12,
  },
  supportItemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    overflow: "hidden",
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 13,
    color: "#8b7355",
  },
  faqList: {
    gap: 8,
  },
  faqCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a3728",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#6b5b47",
    lineHeight: 20,
  },
  contactMethods: {
    gap: 8,
  },
  contactMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  contactMethodText: {
    flex: 1,
    marginLeft: 12,
  },
  contactMethodTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 2,
  },
  contactMethodSubtitle: {
    fontSize: 13,
    color: "#8b7355",
  },
  emergencyCard: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  emergencyGradient: {
    padding: 16,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc2626",
    marginLeft: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: "#7f1d1d",
    lineHeight: 18,
    marginBottom: 12,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    alignSelf: "flex-start",
  },
  emergencyButtonText: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "600",
    marginLeft: 4,
  },
  appInfoSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 12,
    color: "#a0916d",
    marginBottom: 8,
  },
  appInfoText: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    fontStyle: "italic",
  },
});