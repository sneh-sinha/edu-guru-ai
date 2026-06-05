import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { apiService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

interface ImageSolverViewProps {
  user: any;
  onClose: () => void;
  onOpenWhiteboard: (data: any) => void;
}

export default function ImageSolverView({ user, onClose, onOpenWhiteboard }: ImageSolverViewProps) {
  const [stage, setStage] = useState<'picker' | 'analyzing' | 'solution'>('picker');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [solutionData, setSolutionData] = useState<any>(null);

  // Math, science template simulations for instant testing
  const sampleTemplates = [
    {
      id: 'math',
      title: 'Math: Solve 3x + 12 = 27',
      preview: '📐 Math Algebra problem',
      base64: 'mock_math_base64_img'
    },
    {
      id: 'science',
      title: 'Science: Plant Cell Diagram question',
      preview: '🍀 Biology diagram problem',
      base64: 'mock_science_base64_img'
    }
  ];

  const handleSelectSample = (sample: any) => {
    setSelectedPhoto(sample.preview);
    triggerSolver(sample.id, sample.base64);
  };

  const takePhoto = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Camera permission is required to take photos.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.6,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setSelectedPhoto(result.assets[0].uri);
      triggerSolver('science', result.assets[0].base64);
    }
  };

  const pickFromGallery = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Gallery permission is required to select photos.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.6,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setSelectedPhoto(result.assets[0].uri);
      triggerSolver('science', result.assets[0].base64);
    }
  };

  const triggerSolver = async (subjectType: string, imageBase64: string) => {
    setStage('analyzing');
    try {
      const response = await apiService.solveImage({
        userId: user.id,
        subject: subjectType === 'math' ? 'Mathematics Teacher' : 'Science Teacher',
        classLevel: user.classLevel,
        imageBase64
      });

      if (response.success) {
        setExtractedText(response.extractedText);
        setSolutionData(response.data);
        setStage('solution');
      }
    } catch (e) {
      console.error(e);
      setStage('picker');
    }
  };

  const resetSolver = () => {
    setSelectedPhoto(null);
    setExtractedText('');
    setSolutionData(null);
    setStage('picker');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Homework Photo Solver</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Back ✕</Text>
        </TouchableOpacity>
      </View>

      {stage === 'picker' && (
        <ScrollView contentContainerStyle={styles.pickerBody} showsVerticalScrollIndicator={false}>
          <View style={styles.pickerCard}>
            <Text style={styles.cameraIcon}>📸</Text>
            <Text style={styles.pickerTitle}>Submit a Question Image</Text>
            <Text style={styles.pickerDesc}>
              Snap a picture of your textbook, homework sheet, or handwritten equation. EduGuru will read it, teach the concept, and solve it step-by-step.
            </Text>

            {/* Quick Template Selector */}
            <Text style={styles.templateLabel}>Quick Test Templates:</Text>
            {sampleTemplates.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.templateBtn}
                onPress={() => handleSelectSample(s)}
              >
                <Text style={styles.templateTitleText}>{s.title}</Text>
                <Text style={styles.templateArrow}>➔</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR REAL CAPTURE</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
              <Text style={styles.actionBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.secondaryActionBtn]} onPress={pickFromGallery}>
              <Text style={styles.actionBtnTextSec}>🖼️ Choose From Gallery</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {stage === 'analyzing' && (
        <View style={styles.centerStage}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.analyzingText}>Extracting text using OCR...</Text>
          <Text style={styles.analyzingSub}>Applying layout analysis & querying AI Teacher...</Text>
        </View>
      )}

      {stage === 'solution' && solutionData && (
        <ScrollView style={styles.solutionBody} showsVerticalScrollIndicator={false}>
          <View style={styles.photoPreviewCard}>
            {selectedPhoto && (selectedPhoto.startsWith('file') || selectedPhoto.startsWith('data')) ? (
              <Image source={{ uri: selectedPhoto }} style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 16 }} resizeMode="contain" />
            ) : null}
            <Text style={styles.previewHeading}>Captured Image Content:</Text>
            <Text style={styles.extractedText}>"{extractedText}"</Text>
          </View>

          {/* Solution Explanation */}
          <View style={styles.solutionCard}>
            <Text style={styles.sectionLabel}>👩‍🏫 Lesson & Solution Breakdown</Text>
            <Text style={styles.explanationText}>
              {solutionData.explanation ? solutionData.explanation.replace(/###/g, '').replace(/####/g, '') : "No explanation available"}
            </Text>

            {solutionData.whiteboard && solutionData.whiteboard.type && (
              <TouchableOpacity
                style={styles.whiteboardBtn}
                onPress={() => onOpenWhiteboard(solutionData.whiteboard)}
              >
                <Text style={styles.whiteboardBtnText}>📺 Open Step-by-Step Whiteboard Drawing</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Similar Practice Question */}
          {solutionData.practiceQuestion && solutionData.practiceQuestion.question && solutionData.practiceQuestion.question !== "Not applicable" && (
            <View style={styles.practiceCard}>
              <Text style={styles.practiceHeader}>✍️ Try a Similar Question</Text>
              <Text style={styles.practiceQuestionText}>{solutionData.practiceQuestion.question}</Text>
              
              {solutionData.practiceQuestion.options?.map((opt: string) => (
                <View key={opt} style={styles.mockOption}>
                  <Text style={styles.mockOptionText}>{opt}</Text>
                </View>
              ))}
              
              <Text style={styles.correctAnswerLabel}>
                Correct answer is: {solutionData.practiceQuestion.correctAnswer}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.resetBtn} onPress={resetSolver}>
            <Text style={styles.resetBtnText}>Solve Another Photo</Text>
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
  pickerBody: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: '#161B26',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pickerDesc: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
  },
  templateLabel: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 13,
    alignSelf: 'flex-start',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  templateBtn: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateTitleText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  templateArrow: {
    color: '#6366F1',
    fontWeight: '700',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1F2937',
  },
  orText: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryActionBtn: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  actionBtnTextSec: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  analyzingText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 18,
  },
  analyzingSub: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  solutionBody: {
    flex: 1,
    padding: 16,
  },
  photoPreviewCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    marginBottom: 16,
  },
  previewHeading: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  extractedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
    fontStyle: 'italic',
  },
  solutionCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 18,
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
  },
  explanationText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 22,
  },
  whiteboardBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  whiteboardBtnText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
  },
  practiceCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    marginBottom: 24,
  },
  practiceHeader: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  practiceQuestionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 12,
  },
  mockOption: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  mockOptionText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  correctAnswerLabel: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 10,
  },
  resetBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
