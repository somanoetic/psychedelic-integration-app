import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';

const inputTheme = {
  colors: {
    primary: colors.primary,
    text: colors.text,
    placeholder: colors.textSecondary,
  },
};

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!email.includes('@')) {
      Alert.alert('Email Required', 'Please enter the email address for your account.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setStep('reset');
  }

  async function resetPassword() {
    if (code.trim().length === 0) {
      Alert.alert('Code Required', 'Enter the code we emailed you.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password Too Short', 'Your new password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please re-enter your new password.');
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    });

    if (verifyError) {
      setLoading(false);
      Alert.alert('Invalid Code', verifyError.message);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      Alert.alert('Error', updateError.message);
      return;
    }

    Alert.alert('Password Updated', 'Your password has been changed. You are now signed in.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient
        colors={gradients.warm}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.backButton} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              {step === 'request' ? (
                <>
                  <Text style={styles.title}>Forgot your password?</Text>
                  <Text style={styles.subtitle}>
                    Enter the email address on your account and we'll send you a code to reset
                    your password.
                  </Text>

                  <TextInput
                    label="Email"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    mode="outlined"
                    outlineColor={colors.sand}
                    activeOutlineColor={colors.primary}
                    theme={inputTheme}
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={sendCode}
                    disabled={loading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {loading ? 'Sending...' : 'Send Reset Code'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.title}>Check your email</Text>
                  <Text style={styles.subtitle}>
                    We sent a code to {email}. Enter it below along with your new password.
                  </Text>

                  <TextInput
                    label="Reset Code"
                    placeholder="6-digit code"
                    value={code}
                    onChangeText={setCode}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    mode="outlined"
                    outlineColor={colors.sand}
                    activeOutlineColor={colors.primary}
                    theme={inputTheme}
                  />

                  <TextInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    style={styles.input}
                    autoCapitalize="none"
                    mode="outlined"
                    outlineColor={colors.sand}
                    activeOutlineColor={colors.primary}
                    theme={inputTheme}
                  />

                  <TextInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={styles.input}
                    autoCapitalize="none"
                    mode="outlined"
                    outlineColor={colors.sand}
                    activeOutlineColor={colors.primary}
                    theme={inputTheme}
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={resetPassword}
                    disabled={loading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.textButton} onPress={sendCode} disabled={loading}>
                    <Text style={styles.textButtonLabel}>Resend code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.medium,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.serif,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
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
});
