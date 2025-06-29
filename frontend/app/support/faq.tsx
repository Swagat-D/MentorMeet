// app/support/faq.tsx - Frequently Asked Questions Page
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'account' | 'learning' | 'technical' | 'billing' | 'mentors';
  tags: string[];
}

const faqCategories = [
  { id: 'all', label: 'All', icon: 'help-outline', color: '#8b5a3c' },
  { id: 'general', label: 'General', icon: 'info', color: '#059669' },
  { id: 'account', label: 'Account', icon: 'account-circle', color: '#d97706' },
  { id: 'learning', label: 'Learning', icon: 'school', color: '#7c3aed' },
  { id: 'mentors', label: 'Mentors', icon: 'person', color: '#dc2626' },
  { id: 'technical', label: 'Technical', icon: 'settings', color: '#6b7280' },
  { id: 'billing', label: 'Billing', icon: 'payment', color: '#0891b2' },
];

const faqData: FAQItem[] = [
  // General FAQs
  {
    id: 'what-is-mentormatch',
    question: 'What is MentorMatch?',
    answer: 'MentorMatch is an educational platform that connects learners with expert mentors for personalized learning experiences. We offer one-on-one tutoring, group sessions, and specialized courses across various subjects and skills.',
    category: 'general',
    tags: ['platform', 'about', 'overview'],
  },
  {
    id: 'how-it-works',
    question: 'How does MentorMatch work?',
    answer: 'Simply create an account, set your learning goals, browse our mentor profiles, and book sessions that fit your schedule. You can attend sessions via video call, chat with your mentors, and track your progress over time.',
    category: 'general',
    tags: ['process', 'how-to', 'getting-started'],
  },
  {
    id: 'age-requirements',
    question: 'What are the age requirements?',
    answer: 'MentorMatch is designed for learners aged 13 and above. Users under 18 may need parental consent depending on their location. We offer age-appropriate content and mentoring for all age groups.',
    category: 'general',
    tags: ['age', 'requirements', 'minors'],
  },

  // Account FAQs
  {
    id: 'create-account',
    question: 'How do I create an account?',
    answer: 'Tap "Sign Up" on the login screen, enter your name, email, and password, then verify your email address with the code we send you. You can also sign up using your Google account for faster registration.',
    category: 'account',
    tags: ['registration', 'sign-up', 'new-user'],
  },
  {
    id: 'forgot-password',
    question: 'I forgot my password. How can I reset it?',
    answer: 'On the login screen, tap "Forgot Password" and enter your email address. We\'ll send you a verification code to reset your password. Follow the instructions in the email to create a new password.',
    category: 'account',
    tags: ['password', 'reset', 'forgot'],
  },
  {
    id: 'change-email',
    question: 'Can I change my email address?',
    answer: 'Yes, you can update your email address in your profile settings. Go to Profile > Edit Profile and update your email. You\'ll need to verify the new email address before the change takes effect.',
    category: 'account',
    tags: ['email', 'change', 'update'],
  },
  {
    id: 'delete-account',
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Profile > Settings > Account Settings and select "Delete Account". Please note that this action is permanent and cannot be undone. All your data will be permanently removed.',
    category: 'account',
    tags: ['delete', 'remove', 'deactivate'],
  },

  // Learning FAQs
  {
    id: 'book-session',
    question: 'How do I book a session with a mentor?',
    answer: 'Go to the Search tab, browse mentor profiles, and tap on a mentor you\'d like to work with. On their profile, tap "Book Session", choose your preferred time slot, select the session type, and confirm your booking.',
    category: 'learning',
    tags: ['booking', 'sessions', 'mentors'],
  },
  {
    id: 'cancel-session',
    question: 'Can I cancel or reschedule a session?',
    answer: 'Yes, you can cancel or reschedule sessions up to 24 hours before the scheduled time without penalty. Go to your Sessions tab, find the session, and tap "Cancel" or "Reschedule". Late cancellations may incur fees.',
    category: 'learning',
    tags: ['cancel', 'reschedule', 'sessions'],
  },
  {
    id: 'session-types',
    question: 'What types of sessions are available?',
    answer: 'We offer various session types including 1-on-1 tutoring, group sessions, homework help, exam preparation, skill development workshops, and career guidance. Each mentor may offer different session types based on their expertise.',
    category: 'learning',
    tags: ['session-types', 'tutoring', 'group'],
  },
  {
    id: 'session-duration',
    question: 'How long are sessions?',
    answer: 'Session duration varies by mentor and session type. Most sessions range from 30 minutes to 2 hours. You can see the available duration options when booking a session with a specific mentor.',
    category: 'learning',
    tags: ['duration', 'length', 'time'],
  },

  // Mentor FAQs
  {
    id: 'find-mentors',
    question: 'How do I find the right mentor for me?',
    answer: 'Use our search and filter features to find mentors by subject, expertise, rating, price, and availability. Read mentor profiles, reviews, and watch introduction videos to find someone who matches your learning style and goals.',
    category: 'mentors',
    tags: ['find', 'search', 'match'],
  },
  {
    id: 'mentor-qualifications',
    question: 'Are mentors qualified and verified?',
    answer: 'Yes, all our mentors go through a rigorous verification process. We check their qualifications, experience, background, and conduct interviews. Look for the verified badge on mentor profiles.',
    category: 'mentors',
    tags: ['qualified', 'verified', 'background'],
  },
  {
    id: 'favorite-mentors',
    question: 'Can I work with the same mentor regularly?',
    answer: 'Absolutely! You can add mentors to your favorites and book recurring sessions with them. Building a relationship with a consistent mentor often leads to better learning outcomes.',
    category: 'mentors',
    tags: ['favorite', 'regular', 'recurring'],
  },
  {
    id: 'mentor-ratings',
    question: 'How do mentor ratings work?',
    answer: 'After each session, you can rate your mentor from 1-5 stars and leave a review. These ratings help other learners choose mentors and help us maintain quality standards. Mentors with consistently low ratings may be removed.',
    category: 'mentors',
    tags: ['ratings', 'reviews', 'feedback'],
  },

  // Technical FAQs
  {
    id: 'technical-requirements',
    question: 'What are the technical requirements?',
    answer: 'You need a device with internet connection, camera, and microphone for video sessions. We support iOS 12+, Android 8+, and modern web browsers. A stable internet connection is recommended for the best experience.',
    category: 'technical',
    tags: ['requirements', 'device', 'system'],
  },
  {
    id: 'video-issues',
    question: 'I\'m having video or audio issues during sessions. What should I do?',
    answer: 'First, check your internet connection and ensure your camera/microphone permissions are enabled. Try refreshing the app or switching to a different network. If issues persist, contact technical support immediately.',
    category: 'technical',
    tags: ['video', 'audio', 'troubleshoot'],
  },
  {
    id: 'app-not-working',
    question: 'The app isn\'t working properly. How can I fix it?',
    answer: 'Try force-closing and reopening the app, check for app updates in your app store, or restart your device. If problems continue, clear the app cache or reinstall the app. Contact support if issues persist.',
    category: 'technical',
    tags: ['app', 'not-working', 'fix'],
  },

  // Billing FAQs
  {
    id: 'payment-methods',
    question: 'What payment methods do you accept?',
    answer: 'We accept major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers in some regions. Payment is processed securely and you\'ll receive a receipt after each transaction.',
    category: 'billing',
    tags: ['payment', 'methods', 'cards'],
  },
  {
    id: 'pricing',
    question: 'How much do sessions cost?',
    answer: 'Session prices vary by mentor, subject, and session type. Rates typically range from $15-100 per hour. You can see exact pricing on each mentor\'s profile before booking. Some mentors offer package deals or discounts.',
    category: 'billing',
    tags: ['pricing', 'cost', 'rates'],
  },
  {
    id: 'refunds',
    question: 'What is your refund policy?',
    answer: 'We offer full refunds for sessions cancelled 24+ hours in advance. If a mentor cancels or doesn\'t show up, you\'ll receive a full refund. For other issues, contact support and we\'ll review your case individually.',
    category: 'billing',
    tags: ['refund', 'policy', 'cancellation'],
  },
  {
    id: 'billing-issues',
    question: 'I see an unexpected charge on my account. What should I do?',
    answer: 'Check your session history and receipts in the app first. If you still can\'t identify the charge, contact our billing support team with the transaction details and we\'ll investigate and resolve the issue promptly.',
    category: 'billing',
    tags: ['billing', 'charge', 'unexpected'],
  },
];

export default function FAQScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  
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

  // Filter FAQs based on category and search query
  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const CategoryTab = ({ category, index }: { category: any; index: number }) => (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + (index * 2)],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.categoryTab,
          selectedCategory === category.id && styles.categoryTabSelected,
        ]}
        onPress={() => setSelectedCategory(category.id)}
        activeOpacity={0.8}
      >
        <MaterialIcons 
          name={category.icon as any} 
          size={16} 
          color={selectedCategory === category.id ? '#fff' : category.color} 
        />
        <Text style={[
          styles.categoryTabText,
          selectedCategory === category.id && styles.categoryTabTextSelected,
        ]}>
          {category.label}
        </Text>
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
              outputRange: [0, 30 + (index * 3)],
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
        <View style={styles.faqQuestionContainer}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <View style={styles.faqCategoryBadge}>
            <Text style={styles.faqCategoryText}>
              {faqCategories.find(cat => cat.id === faq.category)?.label}
            </Text>
          </View>
        </View>
        <MaterialIcons 
          name={expandedFAQ === faq.id ? "expand-less" : "expand-more"} 
          size={24} 
          color="#8b5a3c" 
        />
      </TouchableOpacity>
      
      {expandedFAQ === faq.id && (
        <Animated.View 
          style={styles.faqAnswer}
        >
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          
          {/* FAQ Tags */}
          <View style={styles.faqTags}>
            {faq.tags.map((tag, idx) => (
              <View key={idx} style={styles.faqTag}>
                <Text style={styles.faqTagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Helpful Section */}
          <View style={styles.helpfulSection}>
            <Text style={styles.helpfulText}>Was this helpful?</Text>
            <View style={styles.helpfulButtons}>
              <TouchableOpacity style={styles.helpfulButton}>
                <MaterialIcons name="thumb-up" size={16} color="#059669" />
                <Text style={styles.helpfulButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpfulButton}>
                <MaterialIcons name="thumb-down" size={16} color="#dc2626" />
                <Text style={styles.helpfulButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return faqData.length;
    return faqData.filter(faq => faq.category === categoryId).length;
  };

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
        <Text style={styles.headerTitle}>FAQ</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/support/contact')}
        >
          <MaterialIcons name="support-agent" size={20} color="#8b5a3c" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Section */}
        <Animated.View
          style={[
            styles.searchSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#8b7355" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search frequently asked questions..."
              placeholderTextColor="#a0916d"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color="#8b7355" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Category Tabs */}
        <View style={styles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {faqCategories.map((category, index) => (
              <CategoryTab key={category.id} category={category} index={index} />
            ))}
          </ScrollView>
        </View>

        {/* Results Info */}
        <Animated.View
          style={[
            styles.resultsInfo,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.resultsText}>
            {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
          </Text>
          {selectedCategory !== 'all' && (
            <Text style={styles.categoryInfo}>
              in {faqCategories.find(cat => cat.id === selectedCategory)?.label}
            </Text>
          )}
        </Animated.View>

        {/* FAQ List */}
        <View style={styles.faqList}>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <FAQCard key={faq.id} faq={faq} index={index} />
            ))
          ) : (
            <Animated.View
              style={[
                styles.noResults,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <MaterialIcons name="search-off" size={48} color="#a0916d" />
              <Text style={styles.noResultsTitle}>No FAQs Found</Text>
              <Text style={styles.noResultsText}>
                {searchQuery 
                  ? `No questions match "${searchQuery}". Try different keywords or browse categories.`
                  : `No questions in this category yet.`
                }
              </Text>
              <TouchableOpacity 
                style={styles.contactSupportButton}
                onPress={() => router.push('/support/contact')}
              >
                <LinearGradient
                  colors={['#8b5a3c', '#d97706']}
                  style={styles.contactSupportGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons name="support-agent" size={16} color="#fff" />
                  <Text style={styles.contactSupportText}>Contact Support</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Still Need Help Section */}
        {filteredFAQs.length > 0 && (
          <Animated.View
            style={[
              styles.needHelpSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(139, 90, 60, 0.05)', 'rgba(217, 119, 6, 0.03)']}
              style={styles.needHelpGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.needHelpContent}>
                <MaterialIcons name="help-center" size={32} color="#8b5a3c" />
                <Text style={styles.needHelpTitle}>Still need help?</Text>
                <Text style={styles.needHelpText}>
                  Can't find what you're looking for? Our support team is here to help!
                </Text>
                <TouchableOpacity 
                  style={styles.needHelpButton}
                  onPress={() => router.push('/support/contact')}
                >
                  <MaterialIcons name="chat" size={16} color="#8b5a3c" />
                  <Text style={styles.needHelpButtonText}>Get Personal Help</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
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
  searchButton: {
    padding: 4,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#4a3728",
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesScroll: {
    paddingRight: 24,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  categoryTabSelected: {
    backgroundColor: "#8b5a3c",
    borderColor: "#8b5a3c",
  },
  categoryTabText: {
    fontSize: 14,
    color: "#4a3728",
    fontWeight: "500",
    marginLeft: 6,
  },
  categoryTabTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  resultsInfo: {
    marginBottom: 20,
  },
  resultsText: {
    fontSize: 16,
    color: "#4a3728",
    fontWeight: "600",
  },
  categoryInfo: {
    fontSize: 14,
    color: "#8b7355",
    marginTop: 2,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    overflow: "hidden",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
  },
  faqQuestionContainer: {
    flex: 1,
    marginRight: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a3728",
    lineHeight: 22,
    marginBottom: 8,
  },
  faqCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  faqCategoryText: {
    fontSize: 10,
    color: "#8b5a3c",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#6b5b47",
    lineHeight: 20,
    marginBottom: 16,
  },
  faqTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  faqTag: {
    backgroundColor: "rgba(139, 115, 85, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  faqTagText: {
    fontSize: 10,
    color: "#8b7355",
    fontWeight: "500",
  },
  helpfulSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
  },
  helpfulText: {
    fontSize: 12,
    color: "#8b7355",
    fontWeight: "500",
  },
  helpfulButtons: {
    flexDirection: "row",
    gap: 8,
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 115, 85, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(139, 115, 85, 0.2)",
  },
  helpfulButtonText: {
    fontSize: 10,
    color: "#8b7355",
    marginLeft: 4,
    fontWeight: "500",
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a3728",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  contactSupportButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  contactSupportGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  contactSupportText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  needHelpSection: {
    marginTop: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.1)",
  },
  needHelpGradient: {
    padding: 24,
  },
  needHelpContent: {
    alignItems: "center",
  },
  needHelpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  needHelpText: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  needHelpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  needHelpButtonText: {
    color: "#8b5a3c",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});