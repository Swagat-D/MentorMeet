// frontend/components/tests/EmployabilityResults.tsx - Professional Results
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

interface EmployabilityScores {
  S: number;
  T: number;
  E: number;
  P: number;
  Speaking: number;
}

interface Props {
  results: {
    scores: EmployabilityScores;
    employabilityQuotient: number;
  };
  onBack: () => void;
}

export default function EmployabilityResults({ results, onBack }: Props) {
  const { scores, employabilityQuotient } = results;
  
  const categories = [
    { key: 'S', name: 'Self Management', color: '#0EA5E9' },
    { key: 'T', name: 'Team Work', color: '#059669' },
    { key: 'E', name: 'Enterprising', color: '#F59E0B' },
    { key: 'P', name: 'Problem Solving', color: '#7C3AED' },
    { key: 'Speaking', name: 'Speaking & Listening', color: '#DC2626' },
  ];

  const maxScore = 5;
  const sortedScores = categories.map(cat => ({
    ...cat,
    score: scores[cat.key as keyof EmployabilityScores]
  })).sort((a, b) => b.score - a.score);

  const getQuotientLevel = (quotient: number) => {
    if (quotient >= 8) return { level: 'Excellent', color: '#10B981' };
    if (quotient >= 6) return { level: 'Good', color: '#059669' };
    if (quotient >= 4) return { level: 'Average', color: '#F59E0B' };
    return { level: 'Developing', color: '#DC2626' };
  };

  const quotientInfo = getQuotientLevel(employabilityQuotient);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Employability Results</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.homeButton}>
          <MaterialIcons name="home" size={24} color="#4a3728" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Employability Quotient */}
        <View style={styles.resultCard}>
          <LinearGradient colors={['#059669', '#10B981']} style={styles.quotientHeader}>
            <MaterialIcons name="work" size={32} color="#FFFFFF" />
            <Text style={styles.quotientTitle}>Employability Quotient</Text>
            <View style={styles.quotientDisplay}>
              <Text style={styles.quotientNumber}>{employabilityQuotient}</Text>
              <Text style={styles.quotientOutOf}>/10</Text>
            </View>
            <View style={[styles.quotientBadge, { backgroundColor: quotientInfo.color }]}>
              <Text style={styles.quotientLevel}>{quotientInfo.level}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* STEPS Scores */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>STEPS Skills Assessment</Text>
          <View style={styles.chartContainer}>
            {sortedScores.map((category, index) => {
              const percentage = (category.score / maxScore) * 100;
              return (
                <View key={category.key} style={styles.barRow}>
                  <Text style={styles.barLabel}>{category.name}</Text>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.barFill, 
                        { 
                          width: `${percentage}%`, 
                          backgroundColor: category.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.barValue}>{category.score.toFixed(1)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Strength */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Your Strongest Skill</Text>
          <View style={styles.strengthContainer}>
            <View style={[styles.strengthIcon, { backgroundColor: sortedScores[0].color }]}>
              <MaterialIcons name="star" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.strengthName}>{sortedScores[0].name}</Text>
            <Text style={styles.strengthScore}>{sortedScores[0].score.toFixed(1)}/5.0</Text>
          </View>
        </View>

        {/* Development Areas */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Areas for Development</Text>
          <View style={styles.developmentList}>
            {sortedScores.filter(cat => cat.score < 3.5).map((category, index) => (
              <View key={category.key} style={styles.developmentItem}>
                <View style={styles.developmentBullet} />
                <Text style={styles.developmentText}>{category.name}</Text>
                <Text style={styles.developmentScore}>{category.score.toFixed(1)}</Text>
              </View>
            ))}
            {sortedScores.filter(cat => cat.score < 3.5).length === 0 && (
              <Text style={styles.noDevelopmentText}>
                Great job! All your skills are at a good level. Continue maintaining your strengths.
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/psychometric-test')}
          >
            <LinearGradient colors={['#059669', '#10B981']} style={styles.actionButtonGradient}>
              <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Continue Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/')}
          >
            <LinearGradient colors={['#8b5a3c', '#a0916d']} style={styles.actionButtonGradient}>
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
  quotientHeader: {
    alignItems: 'center',
    padding: 32,
  },
  quotientTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 16,
  },
  quotientDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  quotientNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quotientOutOf: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  quotientBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quotientLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    padding: 20,
    paddingBottom: 16,
  },
  chartContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barLabel: {
    width: 140,
    fontSize: 14,
    fontWeight: '600',
    color: '#4a3728',
  },
  barContainer: {
    flex: 1,
    height: 28,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 14,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 14,
  },
  barValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  strengthContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  strengthIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  strengthName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 4,
  },
  strengthScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b7355',
  },
  developmentList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  developmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  developmentBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 12,
  },
  developmentText: {
    flex: 1,
    fontSize: 15,
    color: '#4a3728',
  },
  developmentScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b7355',
  },
  noDevelopmentText: {
    fontSize: 15,
    color: '#059669',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
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