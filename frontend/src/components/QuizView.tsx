import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { apiService } from '../services/api';

interface QuizViewProps {
  user: any;
  defaultTopic: string;
  onClose: () => void;
}

export default function QuizView({ user, defaultTopic, onClose }: QuizViewProps) {
  const [topic, setTopic] = useState(defaultTopic || 'General Science');
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  
  // Quiz Answers State
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [appAnswer, setAppAnswer] = useState('');

  // Results State
  const [evaluation, setEvaluation] = useState<any>(null);
  const [step, setStep] = useState<'setup' | 'quiz' | 'results'>('setup');

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const response = await apiService.generateQuiz(topic, user.classLevel);
      if (response.success) {
        setQuiz(response.quiz);
        setStep('quiz');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    setGrading(true);
    try {
      const response = await apiService.evaluateQuiz({
        userId: user.id,
        topic: quiz.topic,
        mcqAnswers,
        shortAnswers,
        appAnswer,
        quiz
      });
      if (response.success) {
        setEvaluation(response.evaluation);
        setStep('results');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Lesson Assessment</Text>
        </View>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonPulse} />
          <View style={[styles.skeletonLine, { width: '80%', height: 20, marginTop: 20 }]} />
          <View style={[styles.skeletonLine, { width: '50%', height: 16 }]} />
          
          <View style={[styles.skeletonBox, { marginTop: 40 }]} />
          <View style={styles.skeletonBox} />
          <View style={styles.skeletonBox} />
          
          <Text style={styles.loadingText}>EduGuru is writing quiz questions on "{topic}"...</Text>
        </View>
      </View>
    );
  }

  if (grading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grading Assessment</Text>
        </View>
        <View style={styles.skeletonContainer}>
          <Text style={{fontSize: 40, marginBottom: 20}}>📝</Text>
          <View style={[styles.skeletonLine, { width: '90%', height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '70%', height: 16 }]} />
          <Text style={styles.loadingText}>Teacher is grading your answers and preparing feedback...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Lesson Assessment</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Back ✕</Text>
        </TouchableOpacity>
      </View>

      {step === 'setup' && (
        <ScrollView contentContainerStyle={styles.setupContainer}>
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>📝</Text>
            <Text style={styles.cardTitle}>Custom Topic Quiz</Text>
            <Text style={styles.cardDesc}>
              Enter any topic (e.g., Photosynthesis, Algebra, World War II) and our AI Teacher will draft an 8-question quiz matched to your level ({user.classLevel}).
            </Text>

            <Text style={styles.label}>Select or Type Topic</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Newton's Laws, Cells, Fractions"
              placeholderTextColor="#6B7280"
              value={topic}
              onChangeText={setTopic}
            />

            <View style={styles.suggestedContainer}>
              {['Fractions', 'Photosynthesis', 'World War I', 'Python Basics'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={styles.suggestedPill}
                  onPress={() => setTopic(t)}
                >
                  <Text style={styles.suggestedPillText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={startQuiz}>
              <Text style={styles.primaryBtnText}>Generate Custom Quiz</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 'quiz' && quiz && (
        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={styles.topicBanner}>
            <Text style={styles.topicLabel}>Quiz Topic</Text>
            <Text style={styles.topicText}>{quiz.topic}</Text>
            <Text style={styles.topicSub}>5 MCQs • 2 Concept Questions • 1 Application Question</Text>
          </View>

          {/* MCQs Section */}
          <Text style={styles.sectionHeader}>Section A: Multiple Choice Questions</Text>
          {quiz.mcqs?.map((q: any, index: number) => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionNum}>Question {index + 1} of 8</Text>
              <Text style={styles.questionText}>{q.question}</Text>
              {q.options?.map((opt: string) => {
                const isSelected = mcqAnswers[q.id] === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, isSelected && styles.optionBtnActive]}
                    onPress={() => setMcqAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Short Questions Section */}
          <Text style={styles.sectionHeader}>Section B: Conceptual Explanations</Text>
          {quiz.shortQuestions?.map((q: any, index: number) => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionNum}>Question {index + 6} of 8</Text>
              <Text style={styles.questionText}>{q.question}</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Type your explanation here..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                value={shortAnswers[q.id] || ''}
                onChangeText={(val) => setShortAnswers(prev => ({ ...prev, [q.id]: val }))}
              />
            </View>
          ))}

          {/* Application Question Section */}
          <Text style={styles.sectionHeader}>Section C: Real-World Application</Text>
          {quiz.applicationQuestion && (
            <View style={[styles.questionCard, { marginBottom: 32 }]}>
              <Text style={styles.questionNum}>Question 8 of 8</Text>
              <Text style={styles.questionText}>{quiz.applicationQuestion.question}</Text>
              <TextInput
                style={styles.textArea}
                placeholder="How would you apply this concept? Describe..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                value={appAnswer}
                onChangeText={setAppAnswer}
              />
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={submitQuiz}>
            <Text style={styles.primaryBtnText}>Submit Answers For Grading</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {step === 'results' && evaluation && (
        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Results Score Header */}
          <View style={styles.resultsBanner}>
            <Text style={styles.resultsEmoji}>🏆</Text>
            <Text style={styles.resultsTitle}>Grading Complete!</Text>
            <Text style={styles.resultsScore}>
              {evaluation.score} <Text style={styles.resultsScoreSlash}>/ {evaluation.maxScore} Points</Text>
            </Text>
            <Text style={styles.resultsAccuracy}>{evaluation.accuracy}% Accuracy</Text>
          </View>

          {/* Strengths & Weaknesses */}
          <View style={styles.areasRow}>
            <View style={[styles.areaCard, { borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={styles.areaHeader}>✨ Strong Areas</Text>
              <Text style={styles.areaText}>{evaluation.strongTopic || 'Excellent general understanding'}</Text>
            </View>
            <View style={[styles.areaCard, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Text style={styles.areaHeader}>⚠️ Focus Areas</Text>
              <Text style={styles.areaText}>{evaluation.weakTopic || 'None'}</Text>
            </View>
          </View>

          {/* Detailed Feedback */}
          <Text style={styles.sectionHeader}>Teacher's Feedback Sheet</Text>

          {/* MCQs feedback */}
          {quiz.mcqs?.map((q: any, index: number) => {
            const feed = evaluation.feedback?.mcqs?.[q.id] || {
              isCorrect: false,
              studentAnswer: mcqAnswers[q.id] || 'No answer',
              correctAnswer: q.correctAnswer,
              explanation: "Feedback unavailable"
            };
            return (
              <View key={q.id} style={[styles.feedbackCard, feed.isCorrect ? styles.feedCorrectCard : styles.feedIncorrectCard]}>
                <Text style={styles.feedQuestionNum}>Question {index + 1}: MCQ</Text>
                <Text style={styles.feedQuestionText}>{q.question}</Text>
                
                <Text style={styles.feedLabel}>Your Answer:</Text>
                <Text style={[styles.feedVal, feed.isCorrect ? styles.feedCorrectVal : styles.feedIncorrectVal]}>
                  {feed.studentAnswer}
                </Text>

                {!feed.isCorrect && (
                  <>
                    <Text style={styles.feedLabel}>Correct Answer:</Text>
                    <Text style={[styles.feedVal, styles.feedCorrectVal]}>{feed.correctAnswer}</Text>
                  </>
                )}

                <Text style={styles.feedExplainTitle}>Concept Explanation:</Text>
                <Text style={styles.feedExplain}>{feed.explanation}</Text>
              </View>
            );
          })}

          {/* Short feedback */}
          {quiz.shortQuestions?.map((q: any, index: number) => {
            const feed = evaluation.feedback?.shortQuestions?.[q.id];
            return (
              <View key={q.id} style={styles.feedbackCard}>
                <Text style={styles.feedQuestionNum}>Question {index + 6}: Concept Review</Text>
                <Text style={styles.feedQuestionText}>{q.question}</Text>
                
                <Text style={styles.feedLabel}>Your Written Answer:</Text>
                <Text style={styles.feedWrittenText}>{shortAnswers[q.id] || '[No Answer]'}</Text>

                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>Grade: {Math.round((feed?.score || 0) * 100)}%</Text>
                </View>

                <Text style={styles.feedExplainTitle}>Teacher's Handwritten Notes:</Text>
                <Text style={styles.teacherNotesText}>" {feed?.feedback || 'Good effort.'} "</Text>
              </View>
            );
          })}

          {/* App Question feedback */}
          {quiz.applicationQuestion && evaluation.feedback?.applicationQuestion && (
            <View style={[styles.feedbackCard, { marginBottom: 32 }]}>
              <Text style={styles.feedQuestionNum}>Question 8: Real-World Application</Text>
              <Text style={styles.feedQuestionText}>{quiz.applicationQuestion.question}</Text>
              
              <Text style={styles.feedLabel}>Your Design Logic:</Text>
              <Text style={styles.feedWrittenText}>{appAnswer || '[No Answer]'}</Text>

              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>Grade: {Math.round((evaluation.feedback?.applicationQuestion?.score || 0) * 100)}%</Text>
              </View>

              <Text style={styles.feedExplainTitle}>Teacher's Design Feedback:</Text>
              <Text style={styles.teacherNotesText}>" {evaluation.feedback?.applicationQuestion?.feedback || 'Nice formulation.'} "</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
            <Text style={styles.primaryBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#161B26',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0B0F19',
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  setupContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#161B26',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDesc: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  suggestedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'flex-start',
    width: '100%',
  },
  suggestedPill: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  suggestedPillText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  scrollBody: {
    flex: 1,
    padding: 16,
  },
  topicBanner: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 20,
  },
  topicLabel: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  topicText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  topicSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366F1',
    marginVertical: 12,
  },
  questionCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 12,
  },
  questionNum: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  questionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  optionBtn: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
  },
  optionBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  optionTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  resultsBanner: {
    backgroundColor: '#161B26',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 20,
  },
  resultsEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
  },
  resultsScore: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 8,
  },
  resultsScoreSlash: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsAccuracy: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  areasRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  areaCard: {
    flex: 1,
    backgroundColor: '#161B26',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  areaHeader: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  },
  areaText: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  feedbackCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 12,
  },
  feedCorrectCard: {
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  feedIncorrectCard: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  feedQuestionNum: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedQuestionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
  },
  feedLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  feedVal: {
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 2,
  },
  feedCorrectVal: {
    color: '#10B981',
  },
  feedIncorrectVal: {
    color: '#EF4444',
  },
  feedExplainTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 10,
    marginBottom: 4,
  },
  feedExplain: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
  feedWrittenText: {
    color: '#FFFFFF',
    fontSize: 13,
    backgroundColor: '#0B0F19',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    fontStyle: 'italic',
  },
  gradeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  gradeBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  teacherNotesText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    backgroundColor: '#1E1E2E',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    borderLeftWidth: 3,
    borderColor: '#6366F1',
  },
  skeletonContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1F2937',
  },
  skeletonLine: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    marginVertical: 6,
  },
  skeletonBox: {
    backgroundColor: '#1F2937',
    width: '100%',
    height: 60,
    borderRadius: 12,
    marginVertical: 8,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 20,
    fontSize: 14,
    textAlign: 'center'
  }
});
