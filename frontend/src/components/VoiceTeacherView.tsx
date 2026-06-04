import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { apiService } from '../services/api';

interface VoiceTeacherViewProps {
  user: any;
  teacherName: string;
  onClose: () => void;
}

export default function VoiceTeacherView({ user, teacherName, onClose }: VoiceTeacherViewProps) {
  const [state, setState] = useState<'idle' | 'listening' | 'transcribing' | 'speaking'>('idle');
  const [spokenText, setSpokenText] = useState('');
  const [teacherResponse, setTeacherResponse] = useState<any>(null);
  const [pulseScale, setPulseScale] = useState(1);

  // Micro-animation for pulsing mic
  useEffect(() => {
    let interval: any;
    if (state === 'listening') {
      interval = setInterval(() => {
        setPulseScale(prev => (prev === 1 ? 1.25 : 1));
      }, 500);
    } else {
      setPulseScale(1);
    }
    return () => clearInterval(interval);
  }, [state]);

  const handleMicPress = () => {
    if (state === 'speaking') {
      setState('idle');
      return;
    }
    
    // Step 1: Start Listening
    setState('listening');
    setSpokenText('');
    setTeacherResponse(null);

    // Step 2: Stop listening after 3 seconds, start processing
    setTimeout(() => {
      setState('transcribing');
      
      // Send mock / real voice chat query
      triggerVoiceAPI();
    }, 3000);
  };

  const triggerVoiceAPI = async () => {
    try {
      const response = await apiService.sendVoiceMessage({
        userId: user.id,
        subject: teacherName,
        classLevel: user.classLevel,
        preferredLanguage: user.preferredLanguage,
        // In a real application, you'd record native audio, convert to base64, and pass here
        audioBase64: "mock_sound_base64" 
      });

      if (response.success) {
        setSpokenText(response.transcription);
        setTeacherResponse(response.data);
        setState('speaking');

        // Play the audio. In this cross-platform MVP we simulate speaker playback
        // In a native app, you'd use expo-av to play: `Audio.Sound.createAsync({ uri: 'data:audio/mp3;base64,' + response.audioBase64 })`
        simulateAudioPlayback();
      }
    } catch (e) {
      console.error(e);
      setState('idle');
    }
  };

  const simulateAudioPlayback = () => {
    // Standard audio simulation finishes after 7 seconds
    setTimeout(() => {
      setState('idle');
    }, 7000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Classroom</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Back ✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.teacherDetails}>
          <Text style={styles.avatarEmoji}>👨‍🏫</Text>
          <Text style={styles.teacherName}>{teacherName}</Text>
          <Text style={styles.teacherSub}>Adapting to {user.classLevel}</Text>
        </View>

        {/* Visual Pulse Waveform */}
        <View style={styles.micStage}>
          {state === 'listening' && (
            <View style={[styles.pulseCircle, { transform: [{ scale: pulseScale }] }]} />
          )}
          {state === 'speaking' && (
            <View style={styles.speakerGlow} />
          )}

          <TouchableOpacity
            style={[
              styles.micBtn,
              state === 'listening' && styles.micBtnActive,
              state === 'speaking' && styles.micBtnSpeaking
            ]}
            onPress={handleMicPress}
          >
            <Text style={styles.micEmoji}>
              {state === 'idle' && '🎤'}
              {state === 'listening' && '🛑'}
              {state === 'transcribing' && '⏳'}
              {state === 'speaking' && '🔊'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.statusLabel}>
            {state === 'idle' && 'Tap mic to ask a question'}
            {state === 'listening' && 'Listening to your voice... Speak now!'}
            {state === 'transcribing' && 'Transcribing your question...'}
            {state === 'speaking' && 'AI Teacher is explaining...'}
          </Text>
        </View>

        {/* Transcription and Answer box */}
        {(spokenText || teacherResponse) && (
          <View style={styles.transcriptCard}>
            {spokenText && (
              <View style={styles.transcriptSection}>
                <Text style={styles.sectionLabel}>🗣️ You asked:</Text>
                <Text style={styles.studentTranscript}>"{spokenText}"</Text>
              </View>
            )}

            {teacherResponse && (
              <View style={styles.answerSection}>
                <Text style={styles.sectionLabel}>👨‍🏫 Teacher's Response (Explanatory Note):</Text>
                <Text style={styles.teacherTranscript}>
                  {teacherResponse.explanation ? teacherResponse.explanation.replace(/###/g, '').replace(/####/g, '') : "Sorry, I couldn't understand that."}
                </Text>
                {teacherResponse.followUp && (
                  <Text style={styles.followUpText}>
                    💡 {teacherResponse.followUp}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
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
  body: {
    alignItems: 'center',
    padding: 24,
    flexGrow: 1,
  },
  teacherDetails: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  teacherName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  teacherSub: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  micStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    marginVertical: 20,
  },
  micBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#161B26',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 3,
  },
  micBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  micBtnSpeaking: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  micEmoji: {
    fontSize: 32,
  },
  pulseCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    zIndex: 1,
  },
  speakerGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    zIndex: 1,
  },
  statusLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  transcriptCard: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    marginTop: 40,
    marginBottom: 20,
  },
  transcriptSection: {
    borderBottomWidth: 1,
    borderColor: '#2D3748',
    paddingBottom: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  studentTranscript: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  answerSection: {},
  teacherTranscript: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  followUpText: {
    color: '#F59E0B',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
