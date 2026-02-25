import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Appbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import FeedbackButton from '../components/FeedbackButton';
import HuxleyWelcomeDialog from '../components/HuxleyWelcomeDialog';
import HuxleyCornerWidget from '../components/HuxleyCornerWidget';
import { colors, gradients, shadows, spacing, borderRadius } from '../theme/colors';

const { width } = Dimensions.get('window');

const OrganizedHomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState([]);
  const [userRole, setUserRole] = useState('patient'); // patient | therapist | admin
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    loadUserData();
    checkWelcomeDialog();
  }, []);

  const checkWelcomeDialog = async () => {
    try {
      // Always show Huxley welcome - it's the main navigation!
      setTimeout(() => {
        setShowWelcomeDialog(true);
      }, 500);
    } catch (error) {
      console.error('Error showing welcome dialog:', error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('OrganizedHomeScreen: Loading user data');
      console.log('OrganizedHomeScreen: Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
      console.log('OrganizedHomeScreen: Starting auth check...');

      // Get current user
      console.log('OrganizedHomeScreen: Calling supabase.auth.getUser()...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('OrganizedHomeScreen: Auth response received:', { user: !!user, error: !!userError });
      
      if (userError) {
        console.error('User error:', userError);
        showAlert('Authentication Error', userError.message);
        return;
      }

      if (!user) {
        console.error('No user found');
        showAlert('Error', 'Please log in again');
        return;
      }

      setUser(user);

      // Try to load recent sessions, but don't fail if database is unavailable
      try {
        console.log('OrganizedHomeScreen: Attempting to load sessions...');
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (sessionError) {
          console.error('Session loading error (non-fatal):', sessionError);
          // Don't show alert for database errors - just continue without sessions
          setRecentSessions([]);
        } else {
          console.log('Sessions loaded successfully:', sessionData?.length || 0);
          setRecentSessions(sessionData || []);
        }
      } catch (dbError) {
        console.error('Database connection error (non-fatal):', dbError);
        // Continue without recent sessions - the app can still work
        setRecentSessions([]);
      }

      // Check user role (if you have a user_roles table or metadata)
      // For now, defaulting to 'patient'
      setUserRole('patient');

    } catch (error) {
      console.error('Unexpected error:', error);
      showAlert('Connection Error', 'Unable to load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message) => {
    console.log(`Alert: ${title} - ${message}`);
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const navigateToExperienceProcessing = () => {
    navigation.navigate('ExperienceMapping');
  };

  const navigateToIntegrationSession = () => {
    navigation.navigate('TherapeuticIntegration');
  };

  const navigateToEducation = () => {
    navigation.navigate('Education');
  };

  const navigateToTherapistTools = () => {
    navigation.navigate('TherapistVerification');
  };

  const createQuickSession = async (type) => {
    try {
      console.log('createQuickSession called with type:', type);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Auth error in createQuickSession:', userError);
        showAlert('Authentication Error', 'Please log in again');
        return;
      }

      const sessionTitle = type === 'experience' 
        ? `Experience Processing ${new Date().toLocaleDateString()}`
        : `Integration Session ${new Date().toLocaleDateString()}`;

      console.log('Creating session with title:', sessionTitle);

      // Create session object WITHOUT id - let database generate UUID
      const newSessionData = {
        user_id: user.id,
        title: sessionTitle,
        journey_date: new Date().toISOString().split('T')[0],
        current_step: 1,
        session_data: {
          sessionType: type,
          conversationMode: type === 'experience' ? 'experience_mapping' : 'therapeutic_integration',
          messages: [],
          entities: []
        }
      };

      console.log('Session data prepared:', newSessionData);

      // Try to save to database first
      try {
        console.log('Attempting to save to database...');
        const { data, error } = await supabase
          .from('sessions')
          .insert([newSessionData])
          .select()
          .single();

        if (error) {
          console.error('Database session creation failed:', error);
          // Create local fallback session with temp ID
          const localSession = {
            id: `temp_${Date.now()}`,
            created_at: new Date().toISOString(),
            ...newSessionData
          };
          console.log('Using local session:', localSession);
          navigateToSession(localSession, type);
        } else {
          console.log('Session created in database successfully:', data);
          // Use the database session
          navigateToSession(data, type);
        }
      } catch (dbError) {
        console.error('Database completely unavailable (continuing with local session):', dbError);
        // Create local fallback session with temp ID
        const localSession = {
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          ...newSessionData
        };
        console.log('Using local session due to db error:', localSession);
        navigateToSession(localSession, type);
      }

    } catch (error) {
      console.error('Error creating session:', error);
      showAlert('Error', `Failed to create session: ${error.message}`);
    }
  };

  const navigateToSession = (sessionData, type) => {
    console.log('navigateToSession called with:', { type, sessionId: sessionData.id });
    // Navigate based on type
    if (type === 'experience') {
      console.log('Navigating to ExperienceMapping');
      navigation.navigate('ExperienceMapping', { session: sessionData });
    } else {
      console.log('Navigating to TherapeuticIntegration');
      navigation.navigate('TherapeuticIntegration', { session: sessionData });
    }
  };

  const renderMainActions = () => {
    const mainSections = [
      {
        id: 'foundation',
        emoji: '🧠',
        title: 'Foundation Learning',
        description: 'Learn nervous system basics, parts work, and grounding exercises',
        badge: 'Start Here',
        badgeColor: '#10b981',
        onPress: () => navigation.navigate('GeneralPreparation')
      },
      {
        id: 'session_tools',
        emoji: '🛠️',
        title: 'Session Tools',
        description: 'Create sessions, prepare, process experiences, and integrate insights',
        onPress: () => navigation.navigate('SessionTools')
      },
      {
        id: 'exercise_library',
        emoji: '💪',
        title: 'Exercise Library',
        description: 'Browse therapeutic practices: breathing, grounding, IFS parts work, and more',
        badge: 'New',
        badgeColor: colors.primary,
        onPress: () => navigation.navigate('ExerciseLibrary')
      },
      {
        id: 'learning_library',
        emoji: '📚',
        title: 'Learning Library',
        description: 'Deep dives into psychedelic science, integration frameworks, and healing',
        onPress: navigateToEducation
      },
      {
        id: 'therapist_tools',
        emoji: '⚕️',
        title: 'Therapist Tools',
        description: 'Professional tools for facilitators and integration therapists',
        onPress: navigateToTherapistTools
      }
    ];

    return (
      <View style={styles.mainActionsContainer}>
        <Text style={styles.sectionTitle}>What would you like to do today?</Text>

        {mainSections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[styles.actionCard, styles.primaryCard]}
            onPress={section.onPress}
          >
            <View style={styles.cardHeader}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>{section.emoji}</Text>
              </View>
              {section.badge && (
                <View style={[styles.badge, { backgroundColor: section.badgeColor }]}>
                  <Text style={styles.badgeText}>{section.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionTitle}>{section.title}</Text>
            <Text style={styles.actionDescription}>{section.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRecentSessions = () => {
    if (recentSessions.length === 0) return null;

    return (
      <View style={styles.recentSessionsContainer}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {recentSessions.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={styles.sessionItem}
            onPress={() => {
              // Navigate based on session type
              const sessionType = session.session_data?.sessionType || 'integration';
              if (sessionType === 'experience') {
                navigation.navigate('ExperienceMapping', { session });
              } else {
                navigation.navigate('TherapeuticIntegration', { session });
              }
            }}
          >
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionDate}>
                {new Date(session.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.sessionType}>
                {session.session_data?.sessionType === 'experience' 
                  ? '📝 Experience Processing' 
                  : '🧘 Integration Session'}
              </Text>
            </View>
            <View style={styles.sessionArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AllSessions')}
        >
          <Text style={styles.viewAllText}>View All Sessions</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWelcomeHeader = () => (
    <LinearGradient
      colors={[colors.cream, colors.sand]}
      style={styles.welcomeContainer}
    >
      <Text style={styles.welcomeTitle}>Welcome to Psycheteleos</Text>
      <Text style={styles.welcomeSubtitle}>
        Direct knowing through integration
      </Text>
    </LinearGradient>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.standard}
        start={{ x: 1.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ flex: 1 }}
      >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Content title="Psycheteleos" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Psycheteleos" titleStyle={styles.appbarTitle} />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate('NetworkTest')}
        />
        <Appbar.Action
          icon="account"
          onPress={() => navigation.navigate('Profile')}
        />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderWelcomeHeader()}
        {renderMainActions()}
        {renderRecentSessions()}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FeedbackButton />

      {/* Persistent Huxley Corner Widget */}
      <HuxleyCornerWidget
        onPress={() => setShowWelcomeDialog(true)}
        showPulse={false}
      />

      <HuxleyWelcomeDialog
        visible={showWelcomeDialog}
        onDismiss={() => setShowWelcomeDialog(false)}
        onNavigate={(route) => {
          setShowWelcomeDialog(false);
          // Check if it's a tab screen or stack screen
          if (route === 'Education' || route === 'AllSessions') {
            // These are tab screens, navigate directly
            navigation.navigate(route);
          } else {
            // These are stack screens (ExperienceMapping, ExerciseLibrary)
            // Navigate to parent stack navigator
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate(route);
            }
          }
        }}
      />
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbar: {
    backgroundColor: colors.surface,
    elevation: 0,
  },
  appbarTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  welcomeContainer: {
    padding: spacing.xl,
    borderBottomWidth: 0,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.deepEarth,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: colors.slate,
    lineHeight: 24,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.deepEarth,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  mainActionsContainer: {
    padding: spacing.lg,
  },
  primaryActions: {
    gap: spacing.md,
  },
  actionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  primaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  actionIcon: {
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 44,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  actionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.deepEarth,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  actionDescription: {
    fontSize: 15,
    color: colors.slate,
    textAlign: 'center',
    lineHeight: 22,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.cream,
    alignItems: 'center',
  },
  secondaryActionEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  secondaryActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.deepEarth,
    textAlign: 'center',
  },
  recentSessionsContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  sessionType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionArrow: {
    paddingLeft: spacing.md,
  },
  arrowText: {
    fontSize: 18,
    color: colors.primary,
  },
  viewAllButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderRadius: borderRadius.sm,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default OrganizedHomeScreen;