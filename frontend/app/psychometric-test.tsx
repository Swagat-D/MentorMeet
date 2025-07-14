// app/psychometric-test.tsx - Main Psychometric Test Landing Page
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface TestSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  imageUrl: string;
  questionCount: number;
  duration: string;
  route: string;
  color: string;
  lightColor: string;
}

const testSections: TestSection[] = [
  {
    id: 'riasec',
    title: 'Interest Inventory',
    subtitle: 'Section A - RIASEC Assessment',
    description: 'Discover your occupational personality using Holland\'s 6 dimensions: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.',
    icon: 'interests',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=face',
    questionCount: 54,
    duration: '10-12 min',
    route: '/tests/interest-inventory',
    color: '#8B4513',
    lightColor: '#F8F3EE'
  },
  {
    id: 'brain',
    title: 'Brain Profile Test',
    subtitle: 'Section B - Career Preference (Brain Test)',
    description: 'Understand your brain\'s dominant quadrants: L1 (Analyst), L2 (Organizer), R1 (Strategist), R2 (Socializer) through ranking exercises.',
    icon: 'psychology',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop',
    questionCount: 10,
    duration: '5-7 min',
    route: '/tests/brain-profile',
    color: '#7C3AED',
    lightColor: '#F3F0FF'
  },
  {
    id: 'employability',
    title: 'Employability Test',
    subtitle: 'Section C - STEPS Framework',
    description: 'Assess your job readiness across STEPS dimensions: Self-management, Teamwork, Enterprising, Problem-solving, Speaking & Listening.',
    icon: 'work',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=300&h=200&fit=crop',
    questionCount: 25,
    duration: '8-10 min',
    route: '/tests/employability',
    color: '#059669',
    lightColor: '#F0FDF4'
  },
  {
    id: 'personal',
    title: 'Personal Insights',
    subtitle: 'Section D - More About Yourself',
    description: 'Share your personal thoughts, strengths, values, and experiences to complete your comprehensive career profile.',
    icon: 'edit',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop',
    questionCount: 5,
    duration: '3-5 min',
    route: '/tests/personal-insights',
    color: '#DC2626',
    lightColor: '#FEF2F2'
  }
];

export default function PsychometricTest() {
  React.useEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

  const renderTestCard = (section: TestSection, index: number) => (
    <TouchableOpacity
      key={section.id}
      style={[styles.testCard, { backgroundColor: section.lightColor }]}
      onPress={() => router.push(section.route as any)}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        <Image 
          source={{ uri: section.imageUrl }} 
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        <View style={[styles.iconContainer, { backgroundColor: section.color }]}>
          <MaterialIcons name={section.icon as any} size={32} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: section.color }]}>{section.title}</Text>
          <Text style={styles.cardSubtitle}>{section.subtitle}</Text>
        </View>

        <Text style={styles.cardDescription}>{section.description}</Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="quiz" size={16} color="#8B7355" />
            <Text style={styles.metaText}>{section.questionCount} questions</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={16} color="#8B7355" />
            <Text style={styles.metaText}>{section.duration}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: section.color }]}
          onPress={() => router.push(section.route as any)}
        >
          <Text style={styles.startButtonText}>Begin Assessment</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Career Assessment</Text>
          <Text style={styles.headerSubtitle}>Discover Your Professional Path</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#8B4513', '#A0522D']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <MaterialIcons name="psychology" size={60} color="#FFFFFF" />
              </View>
              <Text style={styles.heroTitle}>Complete Career Assessment</Text>
              <Text style={styles.heroDescription}>
                Take our comprehensive 4-part assessment to understand your interests, 
                cognitive style, and employability skills. Get personalized career recommendations.
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>89</Text>
                  <Text style={styles.statLabel}>Total Questions</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>25-30</Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>3</Text>
                  <Text style={styles.statLabel}>Assessments</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How It Works</Text>
          <View style={styles.instructionsList}>
            {[
              { step: '1', text: 'Choose any assessment to start', icon: 'touch-app' },
              { step: '2', text: 'Answer questions honestly', icon: 'psychology' },
              { step: '3', text: 'Get instant detailed results', icon: 'insights' },
              { step: '4', text: 'Receive career recommendations', icon: 'work' },
            ].map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionStep}>
                  <Text style={styles.instructionStepText}>{instruction.step}</Text>
                </View>
                <MaterialIcons name={instruction.icon as any} size={24} color="#8B4513" />
                <Text style={styles.instructionText}>{instruction.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Test Sections */}
        <View style={styles.testsSection}>
          <Text style={styles.sectionTitle}>Choose Your Assessment</Text>
          <Text style={styles.sectionSubtitle}>
            You can take them individually or complete all four sections for comprehensive insights
          </Text>
          
          {testSections.map((section, index) => renderTestCard(section, index))}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>What You'll Discover</Text>
          <View style={styles.benefitsGrid}>
            {[
              { icon: 'favorite', title: 'Your Interests', desc: 'What motivates and excites you' },
              { icon: 'psychology', title: 'Thinking Style', desc: 'How your brain processes information' },
              { icon: 'trending-up', title: 'Skill Level', desc: 'Your current employability quotient' },
              { icon: 'work', title: 'Career Match', desc: 'Jobs that fit your profile' },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <MaterialIcons name={benefit.icon as any} size={28} color="#8B4513" />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Section
  heroSection: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 32,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#E8DDD1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#E8DDD1',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 24,
  },

  // Instructions
  instructionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  instructionStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionStepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 16,
    color: '#2A2A2A',
    marginLeft: 12,
    flex: 1,
  },

  // Tests Section
  testsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  // Test Cards
  testCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  cardImageContainer: {
    position: 'relative',
    height: 180,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  iconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 16,
    color: '#2A2A2A',
    lineHeight: 24,
    marginBottom: 16,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Benefits Section
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  benefitCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitDesc: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});