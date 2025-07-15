// frontend/components/tests/InterestInventoryInstructions.tsx - Mobile-First Design
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { riasecInfo } from '@/data/riasecQuestions';

const { width } = Dimensions.get('window');

interface Props {
  onBeginTest: () => void;
  onBack: () => void;
}

export default function InterestInventoryInstructions({ onBeginTest, onBack }: Props) {
  React.useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobile Header */}
      <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Interest Inventory</Text>
            <Text style={styles.headerSubtitle}>RIASEC Assessment</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="psychology" size={48} color="#8B4513" />
          </View>
          <Text style={styles.heroTitle}>Discover Your Career Interests</Text>
          <Text style={styles.heroDescription}>
            Take the RIASEC assessment to understand what motivates you and find careers that match your personality
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="quiz" size={24} color="#8B4513" />
            </View>
            <Text style={styles.statNumber}>54</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="schedule" size={24} color="#059669" />
            </View>
            <Text style={styles.statNumber}>10-12</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="insights" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Career Types</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>How It Works</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Read Each Statement</Text>
                <Text style={styles.stepDescription}>
                  Consider if the activity or statement interests you
                </Text>
              </View>
              <MaterialIcons name="visibility" size={24} color="#8B4513" />
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choose Yes or No</Text>
                <Text style={styles.stepDescription}>
                  Select based on your genuine interest, not skills
                </Text>
              </View>
              <MaterialIcons name="touch-app" size={24} color="#059669" />
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Save & Continue</Text>
                <Text style={styles.stepDescription}>
                  Tap "Save & Next" to move to the next question
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#F59E0B" />
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Your Results</Text>
                <Text style={styles.stepDescription}>
                  Discover your Holland Code and career matches
                </Text>
              </View>
              <MaterialIcons name="celebration" size={24} color="#DC2626" />
            </View>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="lightbulb" size={24} color="#F59E0B" />
            <Text style={styles.tipsTitle}>Pro Tips</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Answer honestly based on what you enjoy, not what you're good at</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Go with your first instinct - don't overthink</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Use the bookmark feature to mark questions for review</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Your progress is automatically saved</Text>
            </View>
          </View>
        </View>

        {/* RIASEC Preview */}
        <View style={styles.riasecCard}>
          <Text style={styles.riasecTitle}>What You'll Discover</Text>
          <Text style={styles.riasecSubtitle}>
            Your results will show which of these 6 career personality types match you best:
          </Text>
          
          <View style={styles.riasecGrid}>
            {riasecInfo.map((type, index) => (
              <View key={index} style={styles.riasecItem}>
                <View style={[styles.riasecIcon, { backgroundColor: type.color }]}>
                  <Text style={styles.riasecLetter}>{type.letter}</Text>
                </View>
                <Text style={styles.riasecName}>{type.name}</Text>
                <Text style={styles.riasecDesc}>{type.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sample Question */}
        <View style={styles.sampleCard}>
          <Text style={styles.sampleTitle}>Sample Question</Text>
          
          <View style={styles.sampleQuestion}>
            <Text style={styles.sampleQuestionText}>
              Build kitchen cabinets
            </Text>
            
            <View style={styles.sampleAnswers}>
              <View style={styles.sampleAnswerYes}>
                <MaterialIcons name="thumb-up" size={20} color="#10B981" />
                <Text style={styles.sampleAnswerText}>YES</Text>
                <Text style={styles.sampleAnswerSubtext}>This interests me</Text>
              </View>
              
              <View style={styles.sampleAnswerNo}>
                <MaterialIcons name="thumb-down" size={20} color="#EF4444" />
                <Text style={styles.sampleAnswerText}>NO</Text>
                <Text style={styles.sampleAnswerSubtext}>This doesn't interest me</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity style={styles.beginButton} onPress={onBeginTest}>
          <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.beginButtonGradient}>
            <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
            <Text style={styles.beginButtonText}>Start Assessment</Text>
          </LinearGradient>
        </TouchableOpacity>

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

  // Mobile Header
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },

  // Instructions Card
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginLeft: 8,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    flex: 1,
  },

  // RIASEC Card
  riasecCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  riasecTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
    textAlign: 'center',
  },
  riasecSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  riasecGrid: {
    gap: 16,
  },
  riasecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  riasecIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  riasecLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  riasecName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    flex: 1,
  },
  riasecDesc: {
    fontSize: 12,
    color: '#8B7355',
    flex: 2,
    marginLeft: 8,
  },

  // Sample Card
  sampleCard: {
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  sampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 16,
    textAlign: 'center',
  },
  sampleQuestion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  sampleQuestionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 20,
  },
  sampleAnswers: {
    flexDirection: 'row',
    gap: 12,
  },
  sampleAnswerYes: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  sampleAnswerNo: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  sampleAnswerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 8,
    marginBottom: 4,
  },
  sampleAnswerSubtext: {
    fontSize: 11,
    color: '#8B7355',
    textAlign: 'center',
  },

  // Begin Button
  beginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  beginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  beginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  bottomPadding: {
    height: 40,
  },
});