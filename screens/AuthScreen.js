import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Button, Card, TextInput, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function signInWithEmail() {
    setLoading(true);

    // Check if username is 'test' and auto-fill credentials
    if (email.toLowerCase() === 'test') {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@psychapp.com',
        password: 'Test1234!',
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
      }
      setLoading(false);
      return;
    }

    // Determine if input is email or username
    let loginEmail = email;

    // If it doesn't contain @, treat it as a username and append domain
    if (!email.includes('@')) {
      loginEmail = `${email}@psychapp.com`;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (error) {
      Alert.alert('Sign In Error', error.message);
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);

    // Determine email (support username format)
    let signupEmail = email;
    if (!email.includes('@')) {
      signupEmail = `${email}@psychapp.com`;
    }

    console.log('Attempting signup with:', { email: signupEmail, passwordLength: password.length });

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: password,
    });

    if (error) {
      console.error('Signup error:', error);
      Alert.alert('Sign Up Error', `${error.message}\n\nEmail: ${signupEmail}\nPassword length: ${password.length}`);
    } else {
      console.log('Signup success:', data);
      if (data.user && !data.user.confirmed_at) {
        Alert.alert(
          'Email Confirmation Required',
          `Account created! Please check ${signupEmail} for the confirmation link.\n\nFor testing: Go to Supabase Dashboard → Authentication → Users → Find ${signupEmail} → Click "..." → Confirm email`
        );
      } else {
        Alert.alert('Success', 'Account created and ready to use!');
      }
    }
    setLoading(false);
  }

  // Quick test login helper
  async function quickTestLogin() {
    setEmail('test');
    setPassword('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@psychapp.com',
      password: 'Test1234!',
    });

    if (error) {
      Alert.alert('Test User Not Found', 'Please create the test user first by signing up with:\nUsername: test\nPassword: Test1234!');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient
        colors={gradients.warm}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>✦</Text>
            <Text style={styles.appName}>Huxley</Text>
            <Text style={styles.tagline}>Direct knowing through integration</Text>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            <Text style={styles.title}>
              {isSignUp ? 'Begin Your Journey' : 'Welcome Back'}
            </Text>

            <TextInput
              label="Email or Username"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              mode="outlined"
              outlineColor={colors.sand}
              activeOutlineColor={colors.primary}
              theme={{
                colors: {
                  primary: colors.primary,
                  text: colors.text,
                  placeholder: colors.textSecondary,
                }
              }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              autoCapitalize="none"
              mode="outlined"
              outlineColor={colors.sand}
              activeOutlineColor={colors.primary}
              theme={{
                colors: {
                  primary: colors.primary,
                  text: colors.text,
                  placeholder: colors.textSecondary,
                }
              }}
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={isSignUp ? signUpWithEmail : signInWithEmail}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.textButtonLabel}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Quick Access</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={quickTestLogin}
            >
              <Text style={styles.secondaryButtonText}>🚀 Test Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={() => navigation.navigate('NetworkTest')}
            >
              <Text style={styles.tertiaryButtonText}>🌐 Test Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7794b6',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    color: colors.white,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: -1,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.cream,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.medium,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  textButtonLabel: {
    color: colors.slate,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.sand,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
  },
  secondaryButton: {
    backgroundColor: colors.sand,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.sage,
  },
  tertiaryButtonText: {
    color: colors.sage,
    fontSize: 15,
    fontWeight: '600',
  },
});