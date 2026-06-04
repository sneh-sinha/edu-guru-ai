import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated
} from 'react-native';
import { apiService } from '../services/api';

interface FlashcardViewProps {
  user: any;
  onClose: () => void;
}

export default function FlashcardView({ user, onClose }: FlashcardViewProps) {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    async function fetchCards() {
      const res = await apiService.getFlashcards(user.id);
      if (res.success && res.flashcards) {
        setFlashcards(res.flashcards);
      }
      setLoading(false);
    }
    fetchCards();
  }, [user.id]);

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Fetching your flashcards...</Text>
      </View>
    );
  }

  if (flashcards.length === 0 || currentIndex >= flashcards.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>You're all caught up!</Text>
        <Text style={styles.doneText}>Come back tomorrow for your next spaced-repetition review.</Text>
        <TouchableOpacity style={styles.returnBtn} onPress={onClose}>
          <Text style={styles.returnBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backBtnText}>◀ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Review ({currentIndex + 1}/{flashcards.length})</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.9} 
          onPress={() => setShowAnswer(!showAnswer)}
        >
          {showAnswer ? (
            <View style={styles.cardInner}>
              <Text style={styles.cardLabel}>Answer</Text>
              <Text style={styles.cardTextBack}>{currentCard.back}</Text>
            </View>
          ) : (
            <View style={styles.cardInner}>
              <Text style={styles.cardLabel}>Question</Text>
              <Text style={styles.cardTextFront}>{currentCard.front}</Text>
              <Text style={styles.tapHint}>Tap to flip</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showAnswer && (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnHard]} onPress={handleNext}>
            <Text style={styles.actionBtnText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnGood]} onPress={handleNext}>
            <Text style={styles.actionBtnText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnEasy]} onPress={handleNext}>
            <Text style={styles.actionBtnText}>Easy</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
  },
  doneEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  doneTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  doneText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  returnBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0B0F19',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 24,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardInner: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    position: 'absolute',
    top: 20,
    left: 20,
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTextFront: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 40,
  },
  cardTextBack: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 34,
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    color: '#9CA3AF',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnHard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  btnGood: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  btnEasy: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  }
});
