// frontend/components/tests/PersonalInsightsResults.tsx - Updated to match other results pages
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
    <View style={styles.resultCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.insightContainer}>
        <View style={styles.insightHeader}>
          <MaterialIcons name={icon as any} size={20} color="#DC2626" />
        </View>
        <Text style={styles.insightText}>{content}</Text>
      </View>
    </View>
  );

  const renderListCard = (title: string, items: string[], icon: string) => (
    <View style={styles.resultCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.listContainer}>
        <View style={styles.insightHeader}>
          <MaterialIcons name={icon as any} size={20} color="#DC2626" />
        </View>
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listBullet} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header - Matching other results pages */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Personal Insights Results</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.homeButton}>
          <MaterialIcons name="home" size={24} color="#4a3728" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Main Results Header - Matching other results */}
        <View style={styles.resultCard}>
          <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.mainHeader}>
            <MaterialIcons name="person" size={32} color="#FFFFFF" />
            <Text style={styles.mainTitle}>Personal Profile Complete</Text>
            <Text style={styles.mainSubtitle}>Your insights have been captured</Text>
          </LinearGradient>
        </View>

        {/* Insights Results */}
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

        {/* Action Buttons - Matching other results */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/psychometric-test')}
          >
            <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.actionButtonGradient}>
              <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Continue Assessment</Text>
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
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
    overflow: 'hidden',
  },
  mainHeader: {
    alignItems: 'center',
    padding: 32,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    padding: 20,
    paddingBottom: 16,
  },
  insightContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  insightHeader: {
    marginBottom: 12,
  },
  insightText: {
    fontSize: 15,
    color: '#4a3728',
    lineHeight: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemsList: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    padding: 12,
    borderRadius: 8,
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
    flex: 1,
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