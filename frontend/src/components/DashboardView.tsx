import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { apiService } from '../services/api';

interface DashboardViewProps {
  user: any;
  onSelectTeacher: (teacherName: string) => void;
  onNavigateToQuiz: (topic: string) => void;
  onNavigateToImageSolver: () => void;
  onNavigateToStore: () => void;
  onNavigateToFlashcards: () => void;
  onNavigateToParentDashboard: () => void;
  onLogout: () => void;
}

export default function DashboardView({
  user,
  onSelectTeacher,
  onNavigateToQuiz,
  onNavigateToImageSolver,
  onNavigateToStore,
  onNavigateToFlashcards,
  onNavigateToParentDashboard,
  onLogout
}: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickTopic, setQuickTopic] = useState('');

  const teachers = [
    {
      name: 'Help & English Buddy',
      icon: '🤖',
      desc: 'Ask anything, solve any problem, and practice conversational English.',
      color: '#EC4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
    },
    {
      name: 'Mathematics Teacher',
      icon: '📐',
      desc: 'Step-by-step math explanations, proofs, and equations.',
      color: '#6366F1',
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      name: 'Science Teacher',
      icon: '🔬',
      desc: 'Physics, chemistry, experiments, and natural laws.',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      name: 'English Teacher',
      icon: '📚',
      desc: 'Grammar rules, essay advice, reading, and literature.',
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      name: 'Coding Teacher',
      icon: '💻',
      desc: 'Syntax, algorithm design, dry runs, and bug solving.',
      color: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
    },
    {
      name: 'General Knowledge Teacher',
      icon: '🌍',
      desc: 'History facts, geography trivia, and current events.',
      color: '#EC4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
    }
  ];

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await apiService.getDashboardStats(user.id);
        if (response.success) {
          setStats(response.stats);
        }
      } catch (e) {
        console.error('Failed to load dashboard stats', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user.id]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderText}>Syncing classroom dashboard...</Text>
      </View>
    );
  }

  const currentStats = stats || {
    learningStreak: 0,
    totalQuestions: 0,
    accuracy: 0,
    topicsCompleted: 0,
    weakAreas: [],
    strongAreas: [],
    weeklyProgress: []
  };

  const daysMaxQuestions = Math.max(...currentStats.weeklyProgress.map((d: any) => d.questions || 1), 5);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitle}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{user.name} 👋</Text>
          <Text style={styles.welcomeSub}>{user.classLevel} • {user.preferredLanguage}</Text>
        </View>
        <View style={styles.gamificationBadges}>
          <TouchableOpacity style={[styles.badgeBtn, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} onPress={onNavigateToStore}>
            <Text style={styles.badgeEmoji}>🪙</Text>
            <Text style={[styles.badgeText, { color: '#F59E0B' }]}>{user.coins || 0}</Text>
          </TouchableOpacity>
          <View style={[styles.badgeBtn, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={styles.badgeEmoji}>🔥</Text>
            <Text style={[styles.badgeText, { color: '#EF4444' }]}>{user.streak_days || 0}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Statistics */}
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <Text style={styles.statsEmoji}>🙋‍♂️</Text>
          <Text style={styles.statsNumber}>{currentStats.totalQuestions}</Text>
          <Text style={styles.statsLabel}>Questions Asked</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsEmoji}>🎯</Text>
          <Text style={styles.statsNumber}>{currentStats.accuracy}%</Text>
          <Text style={styles.statsLabel}>Quiz Accuracy</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsEmoji}>🏆</Text>
          <Text style={styles.statsNumber}>{currentStats.topicsCompleted}</Text>
          <Text style={styles.statsLabel}>Topics Mastered</Text>
        </View>
      </View>

      {/* Weekly Progress & Insights */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <View style={styles.weeklyChartCard}>
          <View style={styles.chartContainer}>
            {currentStats.weeklyProgress.map((day: any, idx: number) => {
              const heightPct = Math.max(10, Math.round((day.questions / daysMaxQuestions) * 100));
              return (
                <View key={idx} style={styles.chartColumn}>
                  <Text style={styles.chartNum}>{day.questions}</Text>
                  <View style={[styles.chartBar, { height: `${heightPct}%` }]} />
                  <Text style={styles.chartDay}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>



      {/* Quick Tools */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Homework Helpers</Text>
        <View style={styles.quickToolsContainer}>
          <TouchableOpacity style={styles.toolBtn} onPress={onNavigateToImageSolver}>
            <Text style={styles.toolEmoji}>📸</Text>
            <Text style={styles.toolTitle}>Solve Homework Photo</Text>
            <Text style={styles.toolDesc}>Scan homework problems, equations & sheets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={() => onNavigateToQuiz('General Science')}>
            <Text style={styles.toolEmoji}>📝</Text>
            <Text style={styles.toolTitle}>Practice Quiz</Text>
            <Text style={styles.toolDesc}>Test your knowledge with an AI assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={onNavigateToFlashcards}>
            <Text style={styles.toolEmoji}>🗂️</Text>
            <Text style={styles.toolTitle}>Flashcards</Text>
            <Text style={styles.toolDesc}>Review spaced-repetition cards</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={onNavigateToParentDashboard}>
            <Text style={styles.toolEmoji}>👨‍👩‍👧</Text>
            <Text style={styles.toolTitle}>Parent Portal</Text>
            <Text style={styles.toolDesc}>View student progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Teacher Selection */}
      <View style={[styles.sectionContainer, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>Select Your Teacher</Text>
        {teachers.map((teacher, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.teacherCard, { backgroundColor: teacher.bgColor, borderColor: teacher.color }]}
            onPress={() => onSelectTeacher(teacher.name)}
          >
            <Text style={styles.teacherIcon}>{teacher.icon}</Text>
            <View style={styles.teacherInfo}>
              <Text style={[styles.teacherName, { color: teacher.color }]}>{teacher.name}</Text>
              <Text style={styles.teacherDesc}>{teacher.desc}</Text>
            </View>
            <Text style={styles.arrowIcon}>➔</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: '#161B26',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  welcomeTitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  welcomeName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  welcomeSub: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignSelf: 'flex-start',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  gamificationBadges: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  badgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakFire: {
    fontSize: 22,
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#161B26',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  statsEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  weeklyChartCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: '12%',
  },
  chartNum: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartBar: {
    backgroundColor: '#6366F1',
    width: 10,
    borderRadius: 5,
  },
  chartDay: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 6,
  },
  areasRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  areaCard: {
    flex: 1,
    backgroundColor: '#161B26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  areaHeader: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 10,
  },
  areaEmpty: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  areaPill: {
    fontSize: 11,
    fontWeight: '600',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 4,
    overflow: 'hidden',
  },
  quickToolsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 16,
    padding: 16,
  },
  toolEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  toolTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  toolDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  teacherIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
  },
  teacherDesc: {
    color: '#E5E7EB',
    fontSize: 12,
    marginTop: 3,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 8,
  },
});
