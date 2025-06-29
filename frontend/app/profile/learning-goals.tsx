// app/profile/learning-goals.tsx - Learning Goals Detail Page
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Enhanced Learning Goals with detailed explanations
const learningGoalsData = {
  'academic-excellence': {
    label: 'Academic Excellence',
    icon: 'school',
    color: '#8b5a3c',
    description: 'Focus on improving your overall academic performance and understanding',
    benefits: [
      'Better grades across all subjects',
      'Improved study techniques and habits',
      'Enhanced critical thinking skills',
      'Stronger foundation for future learning'
    ],
    mentorTypes: ['Academic Tutors', 'Subject Specialists', 'Study Coaches'],
    timeCommitment: '3-5 hours per week',
    successMetrics: 'Grade improvements, test scores, assignment quality'
  },
  'exam-preparation': {
    label: 'Exam Preparation',
    icon: 'quiz',
    color: '#d97706',
    description: 'Targeted preparation for upcoming tests, exams, and assessments',
    benefits: [
      'Strategic exam preparation techniques',
      'Practice with mock tests and past papers',
      'Time management during exams',
      'Stress reduction and confidence building'
    ],
    mentorTypes: ['Exam Specialists', 'Test Prep Coaches', 'Subject Experts'],
    timeCommitment: '4-6 hours per week',
    successMetrics: 'Exam scores, practice test improvements, confidence levels'
  },
  'skill-development': {
    label: 'Skill Development',
    icon: 'build',
    color: '#059669',
    description: 'Learn new practical skills and enhance existing abilities',
    benefits: [
      'Hands-on learning experiences',
      'Industry-relevant skill acquisition',
      'Portfolio and project development',
      'Real-world application practice'
    ],
    mentorTypes: ['Industry Professionals', 'Skill Trainers', 'Project Mentors'],
    timeCommitment: '2-4 hours per week',
    successMetrics: 'Skill assessments, project completion, portfolio quality'
  },
  'career-guidance': {
    label: 'Career Guidance',
    icon: 'work',
    color: '#7c3aed',
    description: 'Get direction on career paths, job opportunities, and professional development',
    benefits: [
      'Career path exploration and planning',
      'Resume and interview preparation',
      'Industry insights and networking',
      'Professional skill development'
    ],
    mentorTypes: ['Career Counselors', 'Industry Veterans', 'HR Professionals'],
    timeCommitment: '1-2 hours per week',
    successMetrics: 'Career clarity, application success, networking growth'
  },
  'homework-help': {
    label: 'Homework Help',
    icon: 'assignment',
    color: '#dc2626',
    description: 'Get assistance with daily assignments and coursework',
    benefits: [
      'Timely completion of assignments',
      'Better understanding of concepts',
      'Improved problem-solving skills',
      'Reduced academic stress'
    ],
    mentorTypes: ['Subject Tutors', 'Homework Assistants', 'Academic Supporters'],
    timeCommitment: '2-3 hours per week',
    successMetrics: 'Assignment quality, submission timeliness, grade improvements'
  },
  'study-habits': {
    label: 'Study Habits',
    icon: 'schedule',
    color: '#0891b2',
    description: 'Develop effective study routines and time management skills',
    benefits: [
      'Personalized study schedules',
      'Effective note-taking techniques',
      'Memory enhancement strategies',
      'Consistent learning routines'
    ],
    mentorTypes: ['Study Coaches', 'Learning Strategists', 'Time Management Experts'],
    timeCommitment: '1-2 hours per week',
    successMetrics: 'Study consistency, time management, retention improvements'
  },
  'college-prep': {
    label: 'College Preparation',
    icon: 'business',
    color: '#ea580c',
    description: 'Prepare for college applications, entrance exams, and higher education',
    benefits: [
      'College application guidance',
      'Entrance exam preparation',
      'Essay writing and personal statements',
      'Scholarship and financial aid advice'
    ],
    mentorTypes: ['College Counselors', 'Admissions Experts', 'Test Prep Specialists'],
    timeCommitment: '3-4 hours per week',
    successMetrics: 'Application success, test scores, scholarship awards'
  },
  'subject-mastery': {
    label: 'Subject Mastery',
    icon: 'auto-awesome',
    color: '#7c2d12',
    description: 'Deep dive into specific subjects to achieve mastery level understanding',
    benefits: [
      'Advanced understanding of complex topics',
      'Problem-solving expertise',
      'Research and analytical skills',
      'Subject-specific methodologies'
    ],
    mentorTypes: ['Subject Matter Experts', 'Research Mentors', 'Advanced Tutors'],
    timeCommitment: '4-5 hours per week',
    successMetrics: 'Depth of understanding, problem-solving ability, research quality'
  },
  'confidence-building': {
    label: 'Confidence Building',
    icon: 'emoji-events',
    color: '#be185d',
    description: 'Build self-confidence and overcome academic challenges',
    benefits: [
      'Improved self-esteem and motivation',
      'Overcoming learning anxiety',
      'Public speaking and presentation skills',
      'Goal setting and achievement'
    ],
    mentorTypes: ['Life Coaches', 'Motivational Mentors', 'Counselors'],
    timeCommitment: '1-2 hours per week',
    successMetrics: 'Confidence levels, participation, leadership activities'
  },
  'time-management': {
    label: 'Time Management',
    icon: 'access-time',
    color: '#166534',
    description: 'Learn to effectively organize and prioritize your time and tasks',
    benefits: [
      'Better work-life balance',
      'Increased productivity',
      'Stress reduction',
      'Goal achievement strategies'
    ],
    mentorTypes: ['Productivity Coaches', 'Organization Experts', 'Life Coaches'],
    timeCommitment: '1-2 hours per week',
    successMetrics: 'Task completion, schedule adherence, stress levels'
  },
  'research-skills': {
    label: 'Research Skills',
    icon: 'search',
    color: '#1e40af',
    description: 'Develop strong research methodologies and information literacy',
    benefits: [
      'Effective information gathering',
      'Critical evaluation of sources',
      'Research methodology understanding',
      'Academic writing improvement'
    ],
    mentorTypes: ['Research Mentors', 'Librarians', 'Academic Writers'],
    timeCommitment: '2-3 hours per week',
    successMetrics: 'Research quality, source credibility, writing improvement'
  },
  'presentation-skills': {
    label: 'Presentation Skills',
    icon: 'slideshow',
    color: '#991b1b',
    description: 'Master the art of effective communication and public speaking',
    benefits: [
      'Confident public speaking',
      'Effective slide design',
      'Audience engagement techniques',
      'Professional communication'
    ],
    mentorTypes: ['Communication Coaches', 'Public Speaking Trainers', 'Presentation Experts'],
    timeCommitment: '2-3 hours per week',
    successMetrics: 'Presentation quality, audience feedback, confidence levels'
  },
};

export default function LearningGoalsDetailScreen() {
  const { user } = useAuthStore();
  
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

  const handleEditGoals = () => {
    router.push("/(onboarding)/goals");
  };

  const GoalDetailCard = ({ goalId, index }: { goalId: string; index: number }) => {
    const goal = learningGoalsData[goalId as keyof typeof learningGoalsData];
    if (!goal) return null;

    return (
      <Animated.View
        style={[
          styles.goalCard,
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
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 246, 240, 0.9)']}
          style={styles.goalCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Goal Header */}
          <View style={styles.goalHeader}>
            <View style={[styles.goalIconContainer, { backgroundColor: goal.color + '15' }]}>
              <MaterialIcons name={goal.icon as any} size={24} color={goal.color} />
            </View>
            <View style={styles.goalHeaderText}>
              <Text style={styles.goalTitle}>{goal.label}</Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
            </View>
          </View>

          {/* Goal Benefits */}
          <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>What You'll Achieve</Text>
            <View style={styles.benefitsList}>
              {goal.benefits.map((benefit, idx) => (
                <View key={idx} style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={16} color={goal.color} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Goal Details */}
          <View style={styles.goalDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <MaterialIcons name="schedule" size={16} color="#8b7355" />
                <Text style={styles.detailLabel}>Time Commitment</Text>
                <Text style={styles.detailValue}>{goal.timeCommitment}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialIcons name="trending-up" size={16} color="#8b7355" />
                <Text style={styles.detailLabel}>Success Metrics</Text>
                <Text style={styles.detailValue}>{goal.successMetrics}</Text>
              </View>
            </View>
          </View>

          {/* Mentor Types */}
          <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>Recommended Mentors</Text>
            <View style={styles.mentorTypes}>
              {goal.mentorTypes.map((mentorType, idx) => (
                <View key={idx} style={styles.mentorTag}>
                  <Text style={styles.mentorTagText}>{mentorType}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const userGoals = user?.goals || [];

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
        <Text style={styles.headerTitle}>Your Learning Goals</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditGoals}
        >
          <MaterialIcons name="edit" size={20} color="#8b5a3c" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {userGoals.length > 0 ? (
          <>
            {/* Goals Summary */}
            <Animated.View
              style={[
                styles.summaryCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIcon}>
                  <MaterialIcons name="my-location" size={24} color="#8b5a3c" />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>
                    {userGoals.length} Learning Goal{userGoals.length !== 1 ? 's' : ''} Selected
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    Your personalized learning journey awaits
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.editGoalsButton} onPress={handleEditGoals}>
                <MaterialIcons name="edit" size={16} color="#8b5a3c" />
                <Text style={styles.editGoalsButtonText}>Edit Goals</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Goals Detail Cards */}
            {userGoals.map((goalId, index) => (
              <GoalDetailCard key={goalId} goalId={goalId} index={index} />
            ))}

            {/* Action Card */}
            <Animated.View
              style={[
                styles.actionCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.actionTitle}>Ready to Start Learning?</Text>
              <Text style={styles.actionSubtitle}>
                Find mentors who specialize in your goals and begin your journey
              </Text>
              <TouchableOpacity style={styles.findMentorsButton}>
                <LinearGradient
                  colors={['#8b5a3c', '#d97706']}
                  style={styles.findMentorsGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons name="search" size={20} color="#fff" />
                  <Text style={styles.findMentorsText}>Find Mentors</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          /* No Goals State */
          <Animated.View
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emptyIcon}>
              <MaterialIcons name="my-location" size={48} color="#a0916d" />
            </View>
            <Text style={styles.emptyTitle}>No Learning Goals Set</Text>
            <Text style={styles.emptySubtitle}>
              Set your learning goals to get personalized mentor recommendations and start your journey
            </Text>
            <TouchableOpacity style={styles.setGoalsButton} onPress={handleEditGoals}>
              <LinearGradient
                colors={['#8b5a3c', '#d97706']}
                style={styles.setGoalsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.setGoalsText}>Set Learning Goals</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  editButton: {
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 20,
    padding: 8,
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
  summaryCard: {
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
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: "#8b7355",
  },
  editGoalsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  editGoalsButtonText: {
    color: "#8b5a3c",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  goalCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  goalCardGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  goalHeaderText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 6,
  },
  goalDescription: {
    fontSize: 14,
    color: "#8b7355",
    lineHeight: 20,
  },
  goalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  benefitText: {
    fontSize: 14,
    color: "#6b5b47",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  goalDetails: {
    backgroundColor: "rgba(139, 90, 60, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    gap: 16,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8b7355",
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 20,
  },
  detailValue: {
    fontSize: 13,
    color: "#4a3728",
    marginLeft: 20,
    lineHeight: 16,
  },
  mentorTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mentorTag: {
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  mentorTagText: {
    fontSize: 12,
    color: "#8b5a3c",
    fontWeight: "500",
  },
  actionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    marginTop: 8,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 8,
    textAlign: "center",
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  findMentorsButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  findMentorsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  findMentorsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(160, 145, 109, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  setGoalsButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  setGoalsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  setGoalsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});