import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

interface OnboardingViewProps {
  user: any;
  onComplete: (profile: any) => void;
}

export default function OnboardingView({ user, onComplete }: OnboardingViewProps) {
  const [classLevel, setClassLevel] = useState('Class 6-8');
  const [language, setLanguage] = useState('English');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const classLevels = ['Class 1-5', 'Class 6-8', 'Class 9-12', 'College'];
  const languages = ['English', 'Hindi', 'Spanish', 'French'];
  const subjects = ['Mathematics', 'Science', 'English', 'Coding', 'General Knowledge'];

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(item => item !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleStart = () => {
    onComplete({
      userId: user.id,
      classLevel,
      preferredLanguage: language,
      favoriteSubjects: selectedSubjects
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logoText}>EduGuru AI</Text>
          <Text style={styles.tagline}>Your Personal AI Teacher</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Complete Your Profile</Text>

          {/* Class Level Selector */}
          <Text style={styles.label}>What grade/class are you in?</Text>
          <View style={styles.selectorGrid}>
            {classLevels.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.selectorBtn,
                  classLevel === lvl && styles.selectorBtnActive
                ]}
                onPress={() => setClassLevel(lvl)}
              >
                <Text
                  style={[
                    styles.selectorBtnText,
                    classLevel === lvl && styles.selectorBtnTextActive
                  ]}
                >
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Language Selector */}
          <Text style={styles.label}>Preferred Learning Language</Text>
          <View style={styles.selectorGrid}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.selectorBtn,
                  language === lang && styles.selectorBtnActive
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.selectorBtnText,
                    language === lang && styles.selectorBtnTextActive
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Favorite Subjects Selector */}
          <Text style={styles.label}>Choose Your Favorite Subjects</Text>
          <View style={styles.pillContainer}>
            {subjects.map((sub) => {
              const isSelected = selectedSubjects.includes(sub);
              return (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.pill,
                    isSelected && styles.pillActive
                  ]}
                  onPress={() => toggleSubject(sub)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.pillTextActive
                    ]}
                  >
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleStart}>
            <Text style={styles.submitBtnText}>Start Learning Adventure</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContainer: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(99, 102, 241, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#161B26',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0F131E',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectorBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0F131E',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  selectorBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  selectorBtnText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorBtnTextActive: {
    color: '#6366F1',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    backgroundColor: '#0F131E',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pillActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  pillText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#10B981',
  },
  submitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
