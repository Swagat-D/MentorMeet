// frontend/components/tests/PersonalInsightsResults.tsx - Professional Results
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface PersonalInsights {
  whatYouLike: string;
  whatYouAreGoodAt: string;
  recentProjects: string;
  characterStrengths: string[];
  valuesInLife: string[];
}

interface Props {
  insights: PersonalInsights;
  testData?: any;
  onBack: () => void;
}

export default function PersonalInsightsResults({ insights, testData, onBack }: Props) {
  const renderInsightCard = (title: string, content: string, icon: string) => (
    <View style={styles.insightCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon as any} size={24} color="#DC2626" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardContent}>{content}</Text>
    </View>
  );

  const renderListCard = (title: string, items: string[], icon: string) => (
    <View style={styles.insightCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon as any} size={24} color="#DC2626" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.listContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listBullet} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Personal Insights</Text>
          <Text style={styles.headerSubtitle}>Your profile summary</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.homeButton}>
          <MaterialIcons name="home" size={24} color="#4a3728" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Completion Message */}
        <View style={styles.completionCard}>
          <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.completionHeader}>
            <MaterialIcons name="check-circle" size={32} color="#FFFFFF" />
            <Text style={styles.completionTitle}>Personal Insights Complete!</Text>
            <Text style={styles.completionSubtitle}>
              Your personal profile has been successfully captured
            </Text>
            {testData && (
              <View style={styles.testStatusContainer}>
                <Text style={styles.testStatusText}>
                  Assessment Status: {testData.isComplete ? 'All Sections Complete 🎉' : `${testData.completionPercentage}% Complete`}
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Insights Cards */}
        {renderInsightCard(
          "What You Enjoy",
          insights.whatYouLike,
          "favorite"
        )}

        {renderInsightCard(
          "Your Strengths",
          insights.whatYouAreGoodAt,
          "star"
        )}

        {renderInsightCard(
          "Recent Projects",
          insights.recentProjects,
          "build"
        )}

        {renderListCard(
          "Character Strengths",
          insights.characterStrengths,
          "psychology"
        )}

        {renderListCard(
          "Life Values",
          insights.valuesInLife,
          "favorite-border"
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/psychometric-test')}
          >
            <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.actionButtonGradient}>
              <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Back to Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/')}
          >
            <LinearGradient colors={['#059669', '#10B981']} style={styles.actionButtonGradient}>
              <MaterialIcons name="home" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Back to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 100, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8b7355',
    marginTop: 2,
  },
  homeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  completionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    overflow: 'hidden',
  },
  completionHeader: {
    alignItems: 'center',
    padding: 32,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  testStatusContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  testStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  cardContent: {
    fontSize: 15,
    color: '#4a3728',
    lineHeight: 22,
    paddingLeft: 36,
  },
  listContainer: {
    paddingLeft: 36,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  listText: {
    fontSize: 15,
    color: '#4a3728',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});