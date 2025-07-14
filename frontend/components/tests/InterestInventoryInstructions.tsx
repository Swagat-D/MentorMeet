// frontend/components/tests/InterestInventoryInstructions.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
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
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interest Inventory</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.instructionsContent}>
        <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.instructionsHero}>
          <MaterialIcons name="interests" size={60} color="#FFFFFF" />
          <Text style={styles.instructionsTitle}>RIASEC Assessment</Text>
          <Text style={styles.instructionsSubtitle}>
            Discover your career interests and personality type
          </Text>
        </LinearGradient>

        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="thumb-up" size={24} color="#10B981" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Answer Honestly</Text>
                <Text style={styles.instructionText}>
                  Choose "Yes" if the statement describes you or interests you, "No" if it doesn't
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="speed" size={24} color="#F59E0B" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Go with First Instinct</Text>
                <Text style={styles.instructionText}>
                  Don't overthink - your immediate reaction is usually most accurate
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="bookmark" size={24} color="#8B4513" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Mark for Review</Text>
                <Text style={styles.instructionText}>
                  You can mark questions to review later and navigate between questions
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="save" size={24} color="#7C3AED" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Auto-Save Progress</Text>
                <Text style={styles.instructionText}>
                  Your answers are automatically saved every 30 seconds
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.testDetails}>
          <Text style={styles.detailsTitle}>Test Overview</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialIcons name="quiz" size={20} color="#8B4513" />
              <Text style={styles.detailText}>54 Questions</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={20} color="#8B4513" />
              <Text style={styles.detailText}>10-12 Minutes</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="psychology" size={20} color="#8B4513" />
              <Text style={styles.detailText}>RIASEC Model</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="insights" size={20} color="#8B4513" />
              <Text style={styles.detailText}>Instant Results</Text>
            </View>
          </View>
        </View>

        <View style={styles.riasecInfo}>
          <Text style={styles.riasecTitle}>What is RIASEC?</Text>
          <Text style={styles.riasecDescription}>
            RIASEC is a career interest model developed by psychologist John Holland. It categorizes people into six personality types:
          </Text>
          <View style={styles.riasecTypes}>
            {riasecInfo.map((type, index) => (
              <View key={index} style={styles.riasecType}>
                <View style={[styles.riasecLetter, { backgroundColor: type.color }]}>
                  <Text style={styles.riasecLetterText}>{type.letter}</Text>
                </View>
                <View style={styles.riasecTypeContent}>
                  <Text style={styles.riasecTypeName}>{type.name}</Text>
                  <Text style={styles.riasecTypeDesc}>{type.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.beginButton} onPress={onBeginTest}>
          <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.beginButtonGradient}>
            <Text style={styles.beginButtonText}>Begin Test</Text>
            <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  scrollView: {
    flex: 1,
  },
  instructionsContent: {
    padding: 20,
  },
  instructionsHero: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsSubtitle: {
    fontSize: 16,
    color: '#E8DDD1',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 20,
  },
  instructionsList: {
    gap: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },
  testDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (width - 80) / 2,
  },
  detailText: {
    fontSize: 14,
    color: '#2A2A2A',
    marginLeft: 8,
    fontWeight: '500',
  },
  riasecInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  riasecTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  riasecDescription: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
    marginBottom: 16,
  },
  riasecTypes: {
    gap: 12,
  },
  riasecType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riasecLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  riasecLetterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  riasecTypeContent: {
    flex: 1,
  },
  riasecTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  riasecTypeDesc: {
    fontSize: 12,
    color: '#8B7355',
  },
  beginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  beginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  beginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});