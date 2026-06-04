import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import { apiService } from '../services/api';

interface ChatViewProps {
  user: any;
  teacherName: string;
  onBack: () => void;
  onOpenWhiteboard: (whiteboardData: any) => void;
  onNavigateToVoice: () => void;
  onNavigateToImageSolver: () => void;
}

interface Message {
  id: string;
  sender: 'student' | 'teacher';
  text: string;
  timestamp: Date;
  practiceQuestion?: {
    question: string;
    type: string;
    options: string[];
    correctAnswer: string;
  };
  whiteboard?: any;
  followUp?: string;
  selectedOption?: string;
  isAnswerCorrect?: boolean;
}

export default function ChatView({
  user,
  teacherName,
  onBack,
  onOpenWhiteboard,
  onNavigateToVoice,
  onNavigateToImageSolver
}: ChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentContext, setDocumentContext] = useState('');
  const [attachedFilename, setAttachedFilename] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Send an initial greeting from the teacher
  useEffect(() => {
    let greeting = '';
    switch (teacherName) {
      case 'Mathematics Teacher':
        greeting = `Hello ${user.name}! I am your Mathematics Teacher today. Math is like a puzzle, and I am here to help you solve it step-by-step. What topic are we learning today? Algebra, geometry, or calculus?`;
        break;
      case 'Help & English Buddy':
        greeting = `Hi ${user.name}! I am your Help & English Buddy 🤖. You can ask me to solve *any* problem at all! Also, I'll help you improve your English while we chat. How can I help you today?`;
        break;
      case 'Science Teacher':
        greeting = `Welcome ${user.name}! I am your Science Teacher. We will explore the laws of nature, chemical elements, and experiments. What questions do you have about the universe?`;
        break;
      case 'English Teacher':
        greeting = `Hi ${user.name}! I am your English Teacher. We will work on vocabulary, grammar, reading, and writing. Let me know what you would like to write or review today!`;
        break;
      case 'Coding Teacher':
        greeting = `Hello world! I am your Coding Teacher. Let's write some clean code and understand algorithms together. Which language or logical concept should we explore?`;
        break;
      case 'Classroom':
        greeting = `Welcome to the general Classroom, ${user.name}! 🏫 Here you can ask me absolutely any question from any subject, and I'll break it down for you. What would you like to learn today?`;
        break;
      case 'General Knowledge Teacher':
      default:
        greeting = `Greetings ${user.name}! I am your GK & History Teacher. Let's travel through time and geography to discover amazing facts. What is on your mind today?`;
        break;
    }

    setMessages([
      {
        id: 'welcome',
        sender: 'teacher',
        text: greeting,
        timestamp: new Date()
      }
    ]);
  }, [teacherName, user.name]);

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
    } else {
      Speech.stop(); // Stop any current speech
      setSpeakingId(id);
      Speech.speak(text, {
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    }
  };

  const handleDownloadPDF = () => {
    if (Platform.OS === 'web') {
      // For web, open a new window with formatted chat and call window.print()
      const chatHtml = messages.map(msg => `
        <div style="margin-bottom: 15px; font-family: sans-serif; ${msg.sender === 'teacher' ? 'background: #f0fdf4; padding: 10px; border-radius: 8px;' : 'text-align: right;'}">
          <strong style="color: ${msg.sender === 'teacher' ? '#166534' : '#1e3a8a'}">${msg.sender === 'teacher' ? teacherName : user.name}</strong>
          <p style="white-space: pre-wrap; margin-top: 5px;">${msg.text}</p>
        </div>
      `).join('');
      
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${teacherName} - Study Notes</title>
              <style>body { padding: 20px; }</style>
            </head>
            <body>
              <h2>EduGuru AI - Lesson Notes</h2>
              <p><strong>Subject:</strong> ${teacherName}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <hr/>
              ${chatHtml}
              <script>
                window.onload = () => { window.print(); window.close(); };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      alert("PDF download is coming soon to mobile!");
    }
  };

  const handleAttachDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setLoading(true);
        const res = await apiService.uploadDocument(file);
        
        if (res.success) {
          setDocumentContext(res.text);
          setAttachedFilename(res.filename);
          alert('Document parsed and attached to your session successfully!');
        } else {
          alert('Failed to extract text from document.');
        }
      }
    } catch (e) {
      console.error('Document picker error:', e);
      alert('Error picking document.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !documentContext) return;

    let studentMessageText = inputText;

    // Inject document context if present
    if (documentContext && !inputText.includes('[Attached Document]')) {
      studentMessageText = `[Attached Document: ${attachedFilename}]\n\n${documentContext}\n\n${studentMessageText}`;
      setDocumentContext(''); // Only inject once
      setAttachedFilename('');
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'student',
      text: inputText || 'Attached a document.',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Package message history
      const history = messages.map(msg => ({
        question: msg.sender === 'student' ? msg.text : '',
        ai_response: msg.sender === 'teacher' ? msg.text : ''
      })).filter(h => h.question || h.ai_response);

      const response = await apiService.sendMessage({
        userId: user.id,
        message: studentMessageText,
        subject: teacherName,
        classLevel: user.classLevel,
        preferredLanguage: user.preferredLanguage,
        history
      });

      if (response.mocked) {
        setIsOfflineMode(true);
      } else {
        setIsOfflineMode(false);
      }

      if (response.success && response.data) {
        const aiData = response.data;
        const newTeacherMsg: Message = {
          id: `teacher_${Date.now()}`,
          sender: 'teacher',
          text: aiData.explanation,
          practiceQuestion: aiData.practiceQuestion,
          whiteboard: aiData.whiteboard,
          followUp: aiData.followUp,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, newTeacherMsg]);
      }
    } catch (e) {
      console.error('Chat error', e);
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const handleSelectOption = (messageId: string, option: string, correctAns: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const isCorrect = option === correctAns;
        return {
          ...msg,
          selectedOption: option,
          isAnswerCorrect: isCorrect
        };
      }
      return msg;
    }));
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isTeacher = item.sender === 'teacher';

    return (
      <View style={[styles.messageRow, isTeacher ? styles.teacherRow : styles.studentRow]}>
        {isTeacher && <Text style={styles.avatarEmoji}>👨‍🏫</Text>}
        
        <View style={[styles.bubble, isTeacher ? styles.teacherBubble : styles.studentBubble]}>
          <Text style={[styles.messageText, isTeacher ? styles.teacherText : styles.studentText]}>
            {item.text}
          </Text>

          {isTeacher && (
            <TouchableOpacity 
              style={styles.ttsBtn}
              onPress={() => handleSpeak(item.id, item.text)}
            >
              <Text style={styles.ttsBtnText}>
                {speakingId === item.id ? '🛑 Stop Listening' : '🔊 Listen'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Render Practice Question inside chat bubble */}
          {item.practiceQuestion && item.practiceQuestion.question && item.practiceQuestion.question !== "Not applicable" && (
            <View style={styles.quizBox}>
              <Text style={styles.quizTitle}>✍️ Practice Question</Text>
              <Text style={styles.quizQuestion}>{item.practiceQuestion.question}</Text>
              
              {item.practiceQuestion.options?.map((opt, i) => {
                const isSelected = item.selectedOption === opt;
                const isCorrectOpt = opt === item.practiceQuestion?.correctAnswer;
                
                let btnStyle = styles.optionBtn;
                let textStyle = styles.optionText;

                if (item.selectedOption) {
                  if (isCorrectOpt) {
                    btnStyle = [styles.optionBtn, styles.optionCorrect];
                    textStyle = [styles.optionText, styles.optionCorrectText];
                  } else if (isSelected) {
                    btnStyle = [styles.optionBtn, styles.optionIncorrect];
                    textStyle = [styles.optionText, styles.optionIncorrectText];
                  } else {
                    btnStyle = [styles.optionBtn, styles.optionDisabled];
                  }
                }

                return (
                  <TouchableOpacity
                    key={i}
                    style={btnStyle}
                    disabled={!!item.selectedOption}
                    onPress={() => handleSelectOption(item.id, opt, item.practiceQuestion!.correctAnswer)}
                  >
                    <Text style={textStyle}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}

              {item.selectedOption && (
                <View style={styles.feedbackContainer}>
                  <Text style={item.isAnswerCorrect ? styles.feedbackCorrectText : styles.feedbackIncorrectText}>
                    {item.isAnswerCorrect ? '🎉 Correct! Brilliant response.' : '❌ Let\'s think again! Review the steps above.'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Whiteboard Attachment badge */}
          {item.whiteboard && item.whiteboard.type && (
            <TouchableOpacity
              style={styles.whiteboardBadge}
              onPress={() => onOpenWhiteboard(item.whiteboard)}
            >
              <Text style={styles.whiteboardBadgeText}>📺 Open Whiteboard Explanation</Text>
            </TouchableOpacity>
          )}

          {/* Follow up text */}
          {item.followUp && (
            <Text style={styles.followUpText}>
              💡 {item.followUp}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>◀ Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{teacherName}</Text>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPDF}>
            <Text style={styles.pdfBtnText}>📄 PDF</Text>
          </TouchableOpacity>
          <View style={styles.teacherStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>⚠️ You are offline — using Demo Mode</Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Indicator / Skeleton Card */}
      {loading && (
        <View style={styles.skeletonRow}>
          <Text style={styles.avatarEmoji}>👨‍🏫</Text>
          <View style={styles.skeletonBubble}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <Text style={styles.typingText}>Teacher is writing notes...</Text>
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputContainer}>
        {/* Quick Media Helpers */}
        <TouchableOpacity style={styles.actionIconBtn} onPress={handleAttachDocument}>
          <Text style={styles.actionIcon}>📎</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionIconBtn} onPress={onNavigateToImageSolver}>
          <Text style={styles.actionIcon}>📷</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionIconBtn} onPress={onNavigateToVoice}>
          <Text style={styles.actionIcon}>🎤</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          {attachedFilename ? (
            <Text style={{ color: '#10B981', fontSize: 10, paddingHorizontal: 16, paddingTop: 4 }}>
              📄 {attachedFilename} attached
            </Text>
          ) : null}
          <TextInput
            style={[styles.textInput, attachedFilename ? { paddingTop: 2 } : {}]}
            placeholder="Ask a question..."
            placeholderTextColor="#6B7280"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            disabled={loading}
          />
        </View>

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  pdfBtn: {
    backgroundColor: '#374151',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center'
  },
  pdfBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  teacherStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: '#991B1B', // Dark red background
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: '#FECACA', // Light red text
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  teacherRow: {
    alignSelf: 'flex-start',
    paddingRight: 40,
  },
  studentRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  avatarEmoji: {
    fontSize: 24,
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  teacherBubble: {
    backgroundColor: '#161B26',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  studentBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  teacherText: {
    color: '#E5E7EB',
  },
  studentText: {
    color: '#FFFFFF',
  },
  ttsBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  ttsBtnText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  skeletonBubble: {
    backgroundColor: '#161B26',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    flex: 1,
    maxWidth: '85%',
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#374151', // Dark grey placeholder
    borderRadius: 6,
    marginBottom: 8,
    width: '100%',
  },
  typingText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#161B26',
  },
  actionIconBtn: {
    padding: 8,
    marginRight: 4,
  },
  actionIcon: {
    fontSize: 22,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0B0F19',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  sendBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  quizBox: {
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  quizTitle: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
  },
  quizQuestion: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 12,
  },
  optionBtn: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionText: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  optionCorrectText: {
    color: '#10B981',
    fontWeight: '600',
  },
  optionIncorrectText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  feedbackContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  feedbackCorrectText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 12,
  },
  feedbackIncorrectText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 12,
  },
  whiteboardBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  whiteboardBadgeText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },
  followUpText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.1)',
    paddingTop: 8,
  },
});
