import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { apiService } from '../services/api';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface AuthViewProps {
  onLoginSuccess: (user: any) => void;
  onSignupSuccess: (user: any) => void;
}

export default function AuthView({ onLoginSuccess, onSignupSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '12063504761-52urhg7cbnb5sma4epe1inn5shkerv5q.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID_HERE.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken || authentication?.accessToken) {
        handleGoogleLogin(authentication.idToken, authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken?: string, accessToken?: string) => {
    setLoading(true);
    try {
      let userObj = undefined;
      
      if (accessToken && !idToken) {
         const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
         });
         userObj = await userInfoResponse.json();
      }

      const res = await apiService.loginWithGoogle({ idToken, user: userObj });
      if (res.success) {
        const userData = { ...res.user, token: res.token };
        apiService.setAuthToken(res.token);
        onLoginSuccess(userData);
      } else {
        Alert.alert('Google Login Failed', res.error || 'An error occurred');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred during Google Login');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await apiService.login({ email, password });
        if (response.success) {
          const userData = { ...response.user, token: response.token };
          apiService.setAuthToken(response.token);
          onLoginSuccess(userData);
        } else {
          alert(response.error || 'Login failed');
        }
      } else {
        if (!name.trim()) {
          alert('Please enter your name');
          setLoading(false);
          return;
        }
        const response = await apiService.signup({ name, email, password });
        if (response.success) {
          const userData = { ...response.user, token: response.token };
          apiService.setAuthToken(response.token);
          onSignupSuccess(userData);
        } else {
          alert(response.error || 'Signup failed');
        }
      }
    } catch (e) {
      alert('An error occurred');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address in the field above to reset your password.');
      return;
    }
    setLoading(true);
    try {
      const response = await apiService.resetPassword(email);
      if (response.success) {
        Alert.alert('Check Your Email', 'If an account exists for this email, password reset instructions have been sent.');
      } else {
        Alert.alert('Error', response.error || 'Failed to reset password');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred while resetting the password.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>EduGuru AI</Text>
        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#6B7280"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitBtnText}>{loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={() => { promptAsync(); }} disabled={!request || loading}>
          <Text style={styles.googleBtnText}>Sign in with Google</Text>
        </TouchableOpacity>

        {isLogin && (
          <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword} disabled={loading}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#161B26', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1F2937' },
  logo: { fontSize: 32, fontWeight: '800', color: '#6366F1', textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 20, color: '#FFFFFF', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#0F131E', borderWidth: 1, borderColor: '#2D3748', borderRadius: 12, padding: 14, color: '#FFFFFF', marginBottom: 16 },
  submitBtn: { backgroundColor: '#6366F1', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#2D3748' },
  dividerText: { color: '#9CA3AF', marginHorizontal: 10, fontSize: 14, fontWeight: '600' },
  googleBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  googleBtnText: { color: '#000000', fontWeight: '600', fontSize: 16 },
  forgotBtn: { marginTop: 16, alignItems: 'center' },
  forgotText: { color: '#8B5CF6', fontSize: 14, fontWeight: '600' },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#9CA3AF', fontSize: 14 }
});
