import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AuthView from './src/components/AuthView';
import OnboardingView from './src/components/OnboardingView';
import DashboardView from './src/components/DashboardView';
import ChatView from './src/components/ChatView';
import WhiteboardView from './src/components/WhiteboardView';
import QuizView from './src/components/QuizView';
import VoiceTeacherView from './src/components/VoiceTeacherView';
import ImageSolverView from './src/components/ImageSolverView';
import StoreView from './src/components/StoreView';
import FlashcardView from './src/components/FlashcardView';
import ParentDashboardView from './src/components/ParentDashboardView';
import { apiService } from './src/services/api';

type Screen = 'auth' | 'onboarding' | 'dashboard' | 'chat' | 'whiteboard' | 'voice' | 'quiz' | 'imageSolver' | 'store' | 'flashcards' | 'parentDashboard';

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('General Knowledge Teacher');
  const [whiteboardData, setWhiteboardData] = useState<any>(null);
  const [quizTopic, setQuizTopic] = useState<string>('General Science');
  const [lastScreenBeforeWhiteboard, setLastScreenBeforeWhiteboard] = useState<Screen>('chat');

  // Load session on startup
  useEffect(() => {
    const loadSession = async () => {
      // User requested login page to always come first, bypassing auto-login persistence
      // We will clear the existing session just to be completely safe and avoid glitches
      try {
        await AsyncStorage.removeItem('@eduguru_user');
      } catch (error) {
        console.error('Failed to clear session:', error);
      } finally {
        setIsSessionLoading(false);
      }
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          apiService.registerPushToken(user.id, token);
        }
      });
    }
  }, [user?.id]);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });
    }

    return token;
  }

  const handleOnboardingComplete = async (profileData: any) => {
    // Save profile to backend (or local storage fallback)
    const response = await apiService.saveProfile(profileData);
    if (response.success) {
      setUser(response.user);
      await AsyncStorage.setItem('@eduguru_user', JSON.stringify(response.user));
      setScreen('dashboard');
    }
  };

  const handleSelectTeacher = (teacherName: string) => {
    setSelectedTeacher(teacherName);
    setScreen('chat');
  };

  const handleOpenWhiteboard = (data: any) => {
    setWhiteboardData(data);
    setLastScreenBeforeWhiteboard(screen);
    setScreen('whiteboard');
  };

  const renderActiveScreen = () => {
    if (isSessionLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading EduGuru AI...</Text>
        </View>
      );
    }

    switch (screen) {
      case 'auth':
        return (
          <AuthView
            onLoginSuccess={async (userData) => {
              setUser(userData);
              await AsyncStorage.setItem('@eduguru_user', JSON.stringify(userData));
              if (userData.classLevel) {
                setScreen('dashboard');
              } else {
                setScreen('onboarding');
              }
            }}
            onSignupSuccess={async (userData) => {
              setUser(userData);
              await AsyncStorage.setItem('@eduguru_user', JSON.stringify(userData));
              setScreen('onboarding');
            }}
          />
        );
      case 'onboarding':
        return <OnboardingView user={user} onComplete={handleOnboardingComplete} />;
      case 'dashboard':
        return (
          <DashboardView
            user={user}
            onSelectTeacher={handleSelectTeacher}
            onNavigateToQuiz={(topic) => {
              setQuizTopic(topic);
              setScreen('quiz');
            }}
            onNavigateToImageSolver={() => setScreen('imageSolver')}
            onNavigateToStore={() => setScreen('store')}
            onNavigateToFlashcards={() => setScreen('flashcards')}
            onNavigateToParentDashboard={() => setScreen('parentDashboard')}
            onLogout={async () => {
              // Set screen first so Dashboard unmounts before user becomes null
              setScreen('auth');
              setUser(null);
              try {
                await AsyncStorage.removeItem('@eduguru_user');
              } catch (e) {
                console.error(e);
              }
            }}
          />
        );
      case 'chat':
        return (
          <ChatView
            user={user}
            teacherName={selectedTeacher}
            onBack={() => setScreen('dashboard')}
            onOpenWhiteboard={handleOpenWhiteboard}
            onNavigateToVoice={() => setScreen('voice')}
            onNavigateToImageSolver={() => setScreen('imageSolver')}
          />
        );
      case 'whiteboard':
        return (
          <WhiteboardView
            whiteboardData={whiteboardData}
            onClose={() => setScreen(lastScreenBeforeWhiteboard)}
          />
        );
      case 'voice':
        return (
          <VoiceTeacherView
            user={user}
            teacherName={selectedTeacher}
            onClose={() => setScreen('chat')}
          />
        );
      case 'quiz':
        return (
          <QuizView
            user={user}
            defaultTopic={quizTopic}
            onClose={() => setScreen('dashboard')}
          />
        );
      case 'imageSolver':
        return (
          <ImageSolverView
            user={user}
            onClose={() => setScreen('dashboard')}
            onOpenWhiteboard={handleOpenWhiteboard}
          />
        );
      case 'store':
        return <StoreView user={user} onClose={() => setScreen('dashboard')} onCoinsUpdated={(newCoins) => setUser({...user, coins: newCoins})} />;
      case 'flashcards':
        return <FlashcardView user={user} onClose={() => setScreen('dashboard')} />;
      case 'parentDashboard':
        return <ParentDashboardView user={user} onClose={() => setScreen('dashboard')} />;
      default:
        return <OnboardingView user={user} onComplete={handleOnboardingComplete} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* App Body Content */}
      <View style={styles.mainBody}>
        {renderActiveScreen()}
      </View>

      {/* Persistent Premium Navigation Bar */}
      {user && screen !== 'auth' && screen !== 'onboarding' && screen !== 'whiteboard' && screen !== 'voice' && (
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navItem, screen === 'dashboard' && styles.navItemActive]}
            onPress={() => setScreen('dashboard')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navText, screen === 'dashboard' && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, screen === 'imageSolver' && styles.navItemActive]}
            onPress={() => setScreen('imageSolver')}
          >
            <Text style={styles.navIcon}>📸</Text>
            <Text style={[styles.navText, screen === 'imageSolver' && styles.navTextActive]}>Solver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, screen === 'chat' && selectedTeacher === 'Classroom' && styles.navItemActive]}
            onPress={() => {
              setSelectedTeacher('Classroom');
              setScreen('chat');
            }}
          >
            <Text style={styles.navIcon}>👨‍🏫</Text>
            <Text style={[styles.navText, screen === 'chat' && selectedTeacher === 'Classroom' && styles.navTextActive]}>Classroom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, screen === 'quiz' && styles.navItemActive]}
            onPress={() => {
              setQuizTopic('General Science');
              setScreen('quiz');
            }}
          >
            <Text style={styles.navIcon}>📝</Text>
            <Text style={[styles.navText, screen === 'quiz' && styles.navTextActive]}>Assessment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setUser(null);
              setScreen('auth');
            }}
          >
            <Text style={styles.navIcon}>🚪</Text>
            <Text style={styles.navText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  mainBody: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#161B26',
    borderTopWidth: 1,
    borderColor: '#1F2937',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navItemActive: {
    transform: [{ scale: 1.05 }],
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
});
