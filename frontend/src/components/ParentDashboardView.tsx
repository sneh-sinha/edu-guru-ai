import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { apiService } from '../services/api';

interface ParentDashboardViewProps {
  user: any;
  onClose: () => void;
}

export default function ParentDashboardView({ user, onClose }: ParentDashboardViewProps) {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    // Check PIN (hardcoded default 1234 for testing as requested)
    const res = await apiService.getParentStats(user.id, pin);
    if (res.success) {
      setStats(res.stats);
      setIsAuthenticated(true);
    } else {
      setError(res.error || 'Incorrect PIN');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕ Close</Text>
        </TouchableOpacity>
        
        <View style={styles.authCard}>
          <Text style={styles.authEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.authTitle}>Parent Portal</Text>
          <Text style={styles.authSub}>Enter your 4-digit PIN to view student progress.</Text>
          <Text style={styles.authHint}>(Default PIN: 1234)</Text>
          
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="••••"
            placeholderTextColor="#4B5563"
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginBtnText}>Unlock Dashboard</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentStats = stats || {
    learningStreak: 0,
    totalQuestions: 0,
    accuracy: 0,
    topicsCompleted: 0,
    weakAreas: ['Fractions', 'History'],
    strongAreas: ['Science'],
    weeklyProgress: []
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Portal</Text>
        <TouchableOpacity style={styles.closeBtnTop} onPress={onClose}>
          <Text style={styles.closeBtnTextTop}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.studentName}>{user.name}'s Progress</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Questions</Text>
            <Text style={styles.statsNumber}>{currentStats.totalQuestions}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Avg Accuracy</Text>
            <Text style={styles.statsNumber}>{currentStats.accuracy}%</Text>
          </View>
        </View>
        
        <View style={styles.areasCard}>
          <Text style={styles.areasTitle}>Areas to Improve ⚠️</Text>
          {currentStats.weakAreas && currentStats.weakAreas.length > 0 ? (
            currentStats.weakAreas.map((w: string, i: number) => (
              <Text key={i} style={styles.areaItem}>• {w}</Text>
            ))
          ) : (
            <Text style={styles.areaItem}>Doing great everywhere!</Text>
          )}
        </View>
        
        <View style={styles.areasCard}>
          <Text style={styles.areasTitle}>Strong Subjects 🌟</Text>
          {currentStats.strongAreas && currentStats.strongAreas.length > 0 ? (
            currentStats.strongAreas.map((w: string, i: number) => (
              <Text key={i} style={styles.areaItem}>• {w}</Text>
            ))
          ) : (
            <Text style={styles.areaItem}>Keep practicing!</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Lighter theme for parent dashboard to distinguish it
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    padding: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  authCard: {
    backgroundColor: '#1F2937',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  authEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  authTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  authSub: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  authHint: {
    color: '#10B981',
    fontSize: 12,
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: '#111827',
    color: '#FFF',
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 10,
  },
  loginBtn: {
    backgroundColor: '#6366F1',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtnTop: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  closeBtnTextTop: {
    color: '#4B5563',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsNumber: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },
  areasCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  areasTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  areaItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  }
});
