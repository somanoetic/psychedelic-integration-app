import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Button, Card, TextInput, Title } from 'react-native-paper';
import { CheckSquare, Square } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import { TOS_VERSION } from '../lib/legal/tosVersion';

function parseDobParts(monthStr, dayStr, yearStr) {
  const m = parseInt(monthStr, 10);
  const d = parseInt(dayStr, 10);
  const y = parseInt(yearStr, 10);
  if (!Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  if (y < 1900 || y > new Date().getFullYear()) return null;
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function calculateAge(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function toIsoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);

  const parsedDob = isSignUp ? parseDobParts(dobMonth, dobDay, dobYear) : null;
  const signupReady =
    isSignUp &&
    email.length > 0 &&
    password.length > 0 &&
    parsedDob !== null &&
    tosAccepted;

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
    const dob = parseDobParts(dobMonth, dobDay, dobYear);
    if (!dob) {
      Alert.alert(
        'Date of Birth',
        'Please enter a valid date of birth in MM / DD / YYYY format.'
      );
      return;
    }
    if (calculateAge(dob) < 18) {
      Alert.alert(
        'Age Requirement',
        'Multitudes is only available to users 18 and older. We cannot create an account at this time.'
      );
      return;
    }
    if (!tosAccepted) {
      Alert.alert(
        'Terms Required',
        'Please confirm you have read and agree to the Terms of Service and Privacy Policy.'
      );
      return;
    }

    setLoading(true);

    let signupEmail = email;
    if (!email.includes('@')) {
      signupEmail = `${email}@psychapp.com`;
    }

    const tosAcceptedAtIso = new Date().toISOString();

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: password,
      options: {
        data: {
          date_of_birth: toIsoDate(dob),
          tos_version: TOS_VERSION,
          tos_accepted_at: tosAcceptedAtIso,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error);
      // The Supabase auth gateway can return a non-JSON 5xx (e.g. a 504
      // timeout) during email/load bursts; in that case supabase-js stringifies
      // the whole Response object into error.message. Never show that to a
      // tester — map server/timeout errors to a friendly retry message and
      // surface only known, actionable auth errors verbatim.
      const status = error.status || error.statusCode;
      const isServerOrTimeout =
        (typeof status === 'number' && status >= 500) ||
        /timeout|gateway|fetch|network/i.test(error.message || '');

      if (isServerOrTimeout) {
        Alert.alert(
          'Server Busy',
          'We could not reach the server just now. Please wait a moment and try again.'
        );
      } else {
        Alert.alert('Sign Up Error', error.message);
      }
    } else {
      Alert.alert('Success', 'Account created and ready to use!');
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
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand logo (wordmark + tagline are baked into the image) */}
          <View style={styles.header}>
            <Image source={icons.multitudesLogo} style={styles.logoImage} />
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

            {isSignUp && (
              <>
                <Text style={styles.dobLabel}>Date of birth</Text>
                <View style={styles.dobRow}>
                  <TextInput
                    label="MM"
                    value={dobMonth}
                    onChangeText={(t) => setDobMonth(t.replace(/[^0-9]/g, '').slice(0, 2))}
                    style={styles.dobInput}
                    keyboardType="number-pad"
                    maxLength={2}
                    mode="outlined"
                    outlineColor={colors.sand}
                    activeOutlineColor={colors.primary}
                    theme={{ colors: { primary: colors.primary } }}
                  />
                  <Text style={styles.dobSeparator}>/</Text>
                  <TextInput
                    label="DD"
                    value={dobDay}
                    onChangeText={(t) => setDobDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                    style={styles.dobInput}
                    keyboardType="number-pad"
                    maxLength={2}
                    mode="outlined"
                    outlineColor={colors.sand}
                    activeOutlineColor={colors.primary}
                    theme={{ colors: { primary: colors.primary } }}
                  />
                  <Text style={styles.dobSeparator}>/</Text>
                  <TextInput
                    label="YYYY"
                    value={dobYear}
                    onChangeText={(t) => setDobYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    style={[styles.dobInput, styles.dobInputYear]}
                    keyboardType="number-pad"
                    maxLength={4}
                    mode="outlined"
                    outlineColor={colors.sand}
                    activeOutlineColor={colors.primary}
                    theme={{ colors: { primary: colors.primary } }}
                  />
                </View>
                <Text style={styles.dobHelper}>
                  You must be 18 or older to use Multitudes.
                </Text>

                <TouchableOpacity
                  style={styles.tosRow}
                  onPress={() => setTosAccepted(!tosAccepted)}
                  activeOpacity={0.7}
                >
                  {tosAccepted ? (
                    <CheckSquare size={24} color={colors.primary} strokeWidth={2} />
                  ) : (
                    <Square size={24} color={colors.slate} strokeWidth={2} />
                  )}
                  <Text style={styles.tosText}>
                    I have read and agree to the{' '}
                    <Text
                      style={styles.tosLink}
                      onPress={() => navigation.navigate('TermsOfService')}
                    >
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text
                      style={styles.tosLink}
                      onPress={() => navigation.navigate('PrivacyPolicy')}
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || (isSignUp && !signupReady)) && styles.buttonDisabled,
              ]}
              onPress={isSignUp ? signUpWithEmail : signInWithEmail}
              disabled={loading || (isSignUp && !signupReady)}
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
              <Text style={styles.secondaryButtonText}>Test Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={() => navigation.navigate('NetworkTest')}
            >
              <Text style={styles.tertiaryButtonText}>Test Connection</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 240,
    height: 240,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.medium,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.serif,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  dobLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dobInput: {
    flex: 1,
    backgroundColor: colors.white,
    height: 48,
  },
  dobInputYear: {
    flex: 1.4,
  },
  dobSeparator: {
    fontSize: 18,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
  dobHelper: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tosText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  tosLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
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