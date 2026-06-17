import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';

import { supabase } from './lib/supabase';
import metricsService from './lib/metricsService';
import huxleyService from './lib/huxleyService';
import { colors } from './theme/colors';
import { ThemedAlertHost, installThemedAlert } from './components/ThemedAlert';

// Patch React Native's Alert.alert at module load so every existing call site
// renders through the themed UI. Safe to call multiple times.
installThemedAlert();

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.primary,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    error: colors.error,
    placeholder: colors.textSecondary,
  },
};

import AuthScreen from './screens/AuthScreen';
import OnboardingCarousel from './screens/OnboardingCarousel';
import NonClinicalDisclosureScreen, { DISCLOSURE_STORAGE_KEY } from './screens/NonClinicalDisclosureScreen';
// AnimatedSplash removed - go straight to app
import SimpleEnhancedConversationScreen from './screens/SimpleEnhancedConversationScreen';
import EnhancedConversationScreen from './screens/EnhancedConversationScreen';
import EducationScreen from './screens/EducationScreen';
import ConversationalHomeScreen from './components/ConversationalHomeScreen';
import GridHomeScreen from './components/GridHomeScreen';
import GlobalHuxleyFab from './components/GlobalHuxleyFab';
import HuxleyChatScreen from './components/HuxleyChatScreen';
import { HuxleyChatProvider } from './contexts/HuxleyChatContext';
import AllSessionsScreen from './screens/AllSessionsScreen';
import ExperienceMappingScreen from './screens/ExperienceMappingScreen';
import TherapeuticIntegrationScreen from './screens/TherapeuticIntegrationScreen';
import GeneralPreparationScreen from './screens/preparation/GeneralPreparationScreen';
import SessionPreparationScreen from './screens/preparation/SessionPreparationScreen';
import SessionToolsScreen from './screens/SessionToolsScreen';
import QuickNetworkTest from './screens/QuickNetworkTest';
import NetworkTestScreen from './screens/NetworkTestScreen';
import ExerciseLibraryScreen from './screens/ExerciseLibraryScreen';
import GuidedExerciseScreen from './screens/GuidedExerciseScreen';
import AdminMetricsDashboard from './screens/AdminMetricsDashboard';
import AdminApplicationReviewScreen from './screens/AdminApplicationReviewScreen';
import AdminContentReviewScreen from './screens/AdminContentReviewScreen';
import ContributorExerciseSubmissionScreen from './screens/ContributorExerciseSubmissionScreen';
import SetIntentionScreen from './screens/SetIntentionScreen';
import SessionChecklistScreen from './screens/SessionChecklistScreen';
import InsightsScreen from './screens/InsightsScreen';
import ProcessIntegrateScreen from './screens/ProcessIntegrateScreen';
import ProcessIntegratePickerScreen from './screens/ProcessIntegratePickerScreen';
import InnerWorkScreen from './screens/InnerWorkScreen';
import PracticeScreen from './screens/PracticeScreen';
import ActiveImaginationScreen from './screens/ActiveImaginationScreen';
import PhilosophicalTalkthroughsHubScreen from './screens/PhilosophicalTalkthroughsHubScreen';
import PhilosophicalTalkthroughScreen from './screens/PhilosophicalTalkthroughScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import SettingsScreen from './screens/SettingsScreen';
import ContributorToolsScreen from './screens/ContributorToolsScreen';
import FindSupportScreen from './screens/FindSupportScreen';
import ContributorApplicationScreen from './screens/ContributorApplicationScreen';
import RegulationToolkitScreen from './screens/RegulationToolkitScreen';
import InnerAtlasScreen from './screens/InnerAtlasScreen';
import NervousSystemSummaryScreen from './screens/NervousSystemSummaryScreen';
import TriggersGlimmersSummaryScreen from './screens/TriggersGlimmersSummaryScreen';
import CoreBeliefsSummaryScreen from './screens/CoreBeliefsSummaryScreen';
import PartsSummaryScreen from './screens/PartsSummaryScreen';
import IntegrationSummaryScreen from './screens/IntegrationSummaryScreen';
import WorksheetLibraryScreen from './screens/WorksheetLibraryScreen';
import WorksheetPrintScreen from './screens/WorksheetPrintScreen';
import ScanCaptureScreen from './screens/ScanCaptureScreen';
import ScanReviewScreen from './screens/ScanReviewScreen';
import ScanDetailScreen from './screens/ScanDetailScreen';

import SessionsHubScreen from './screens/SessionsHubScreen';

// Conversational Components
import ConversationalAllSessions from './components/ConversationalAllSessions';
import ConversationalExerciseLibrary from './components/ConversationalExerciseLibrary';
import ConversationalTriggeredSupport from './components/ConversationalTriggeredSupport';
import DailyJournal from './components/DailyJournal';
import ConversationalNervousSystemMapping from './components/ConversationalNervousSystemMapping';
import ConversationalTriggersGlimmers from './components/ConversationalTriggersGlimmers';
import ConversationalRegulatingResources from './components/ConversationalRegulatingResources';
import CoreBeliefsAssessment from './components/CoreBeliefsAssessment';
import IFSPartsWorkChatWithContext from './enhanced-components/IFSPartsWorkChatWithContext';
import GlimmerSwiper from './components/GlimmerSwiper';
import TriggerTracker from './components/TriggerTracker';
import GlimmerTracker from './components/GlimmerTracker';
import NervousSystemCheckin from './components/NervousSystemCheckin';
import PartsCheckin from './components/PartsCheckin';
import IFSPartsInventory from './components/IFSPartsInventory';
import TrailScreen from './components/TrailScreen';
import HabitTracker from './components/HabitTracker';
import * as Sentry from '@sentry/react-native';
import config from './lib/config';

if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    sendDefaultPii: true,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration()],
  });
} else if (!__DEV__) {
  console.warn('[Sentry] SENTRY_DSN missing in production build — crashes will not be reported');
}

const Stack = createStackNavigator();

// Shared ref so the global Huxley FAB (mounted outside any screen) can drive
// navigation and so we can read the active route to decide where it shows.
const navigationRef = createNavigationContainerRef();

// Screens where the global FAB should NOT appear: the full Huxley chat (the FAB
// is redundant there) and the pre-auth / gate screens.
const FAB_HIDDEN_ROUTES = new Set([
  'HuxleyChat',
  'Auth',
  'Onboarding',
  'NonClinicalDisclosure',
  'TermsOfService',
  'PrivacyPolicy',
  'NetworkTest',
]);

// Main App Component with debug logging
function App() {
  const [fontsLoaded] = useFonts({ Fraunces_700Bold });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Starting app...');
  const [bypassAuth, setBypassAuth] = useState(false); // Add bypass mode
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [disclosureAcknowledged, setDisclosureAcknowledged] = useState(false);
  const [checkingDisclosure, setCheckingDisclosure] = useState(true);
  const [showSplash, setShowSplash] = useState(false); // Splash disabled
  const [activeRoute, setActiveRoute] = useState(null); // current top route name

  useEffect(() => {
    checkOnboardingStatus();
    checkDisclosureStatus();
  }, []);

  useEffect(() => {
    // Check if we should bypass auth for testing
    const shouldBypass = __DEV__ && process.env.BYPASS_AUTH === 'true';
    if (shouldBypass) {
      console.log('App: Bypassing auth for development');
      setBypassAuth(true);
      setLoading(false);
      return;
    }

    if (!checkingOnboarding) {
      initializeApp();
    }
  }, [checkingOnboarding]);

  const checkOnboardingStatus = async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), 3000); // 3 second timeout
      });

      const storagePromise = AsyncStorage.getItem('onboarding_completed');
      const completed = await Promise.race([storagePromise, timeoutPromise]);

      setOnboardingComplete(completed === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingComplete(false); // Default to showing onboarding
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
  };

  // ADR-009 #7: one-time non-HIPAA wellness disclosure. Versioned key so we can
  // re-show it if the disclosure copy changes materially (bump
  // DISCLOSURE_VERSION in NonClinicalDisclosureScreen.js).
  const checkDisclosureStatus = async () => {
    try {
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), 3000);
      });
      const storagePromise = AsyncStorage.getItem(DISCLOSURE_STORAGE_KEY);
      const ack = await Promise.race([storagePromise, timeoutPromise]);
      setDisclosureAcknowledged(ack === 'true');
    } catch (error) {
      console.error('Error checking disclosure status:', error);
      setDisclosureAcknowledged(false);
    } finally {
      setCheckingDisclosure(false);
    }
  };

  const handleDisclosureAcknowledged = () => {
    setDisclosureAcknowledged(true);
  };

  const initializeApp = async () => {
    try {
      setDebugInfo('Connecting to Supabase...');
      console.log('App: Starting initialization');

      // Initialize metrics service
      await metricsService.initialize();

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('App: Auth error:', error);
        setDebugInfo(`Auth error: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('App: Session check complete:', session ? 'Logged in' : 'Not logged in');
      setDebugInfo(session ? 'User logged in' : 'No user session');
      
      setSession(session);
      if (session?.user?.id) {
        Sentry.setUser({ id: session.user.id });
        huxleyService.initialize(session.user.id).catch(err =>
          console.warn('HuxleyService init error:', err.message)
        );
      }
      setLoading(false);

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('App: Auth state changed:', _event, session ? 'Logged in' : 'Logged out');
        setSession(session);
        Sentry.setUser(session?.user?.id ? { id: session.user.id } : null);
        if (session?.user?.id) {
          huxleyService.initialize(session.user.id).catch(err =>
            console.warn('HuxleyService init error:', err.message)
          );
        }
      });

      return () => {
        console.log('App: Cleaning up auth subscription');
        subscription.unsubscribe();
      };

    } catch (error) {
      console.error('App: Initialization error:', error);
      setDebugInfo(`Initialization error: ${error.message}`);
      setLoading(false);
    }
  };

  console.log('App: Rendering, loading:', loading, 'session:', !!session, 'onboarding:', onboardingComplete);

  // Show onboarding for first-time users (after auth check) - skip in demo/bypass mode
  if ((session?.user || bypassAuth) && !onboardingComplete && !checkingOnboarding && !bypassAuth) {
    return (
      <SafeAreaProvider>
        <OnboardingCarousel onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  // ADR-009 #7: non-HIPAA wellness disclosure. Shown once per user (or whenever
  // DISCLOSURE_VERSION is bumped) AFTER onboarding and before main app routes.
  // Existing users who already finished onboarding will hit this on next launch
  // post-update. Skip in dev bypass mode.
  if (
    (session?.user || bypassAuth) &&
    onboardingComplete &&
    !disclosureAcknowledged &&
    !checkingDisclosure &&
    !bypassAuth
  ) {
    return (
      <SafeAreaProvider>
        <NonClinicalDisclosureScreen onAcknowledge={handleDisclosureAcknowledged} />
      </SafeAreaProvider>
    );
  }

  // Splash animation removed - skip straight to app

  if (loading || checkingOnboarding || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTitle}>Multitudes</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <Text style={styles.debugHint}>
          If stuck here, check console logs or try restarting
        </Text>

        {/* Emergency bypass button - DEV ONLY, never rendered in production */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.bypassButton}
            onPress={() => {
              console.log('Emergency bypass activated (DEV ONLY)');
              setBypassAuth(true);
              setLoading(false);
            }}
          >
            <Text style={styles.bypassButtonText}>DEV: Emergency Bypass (Test Mode)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ThemedAlertHost />
        <HuxleyChatProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => setActiveRoute(navigationRef.getCurrentRoute()?.name ?? null)}
          onStateChange={() => setActiveRoute(navigationRef.getCurrentRoute()?.name ?? null)}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={(session && session.user) || bypassAuth ? (bypassAuth ? 'Home' : 'HuxleyChat') : 'Auth'}>
            {(session && session.user) || bypassAuth ? (
            <>
              <Stack.Screen name="HuxleyChat" component={HuxleyChatScreen} />
              {/* Bottom tab bar removed: Home, Journal, and Inner Atlas are now
                  flat Stack screens reached from home-screen tiles, the global
                  Huxley launcher, and in-app navigate() calls. */}
              <Stack.Screen name="Home" component={GridHomeScreen} />
              <Stack.Screen
                name="Journal"
                component={DailyJournal}
                options={{ headerShown: false, title: 'Journal' }}
              />
              <Stack.Screen
                name="Atlas"
                component={InnerAtlasScreen}
                options={{ headerShown: false, title: 'Inner Atlas' }}
              />
              {/* Previously moved out of the bottom tab bar;
                  reached from home-screen tiles and in-app navigate() calls */}
              <Stack.Screen
                name="Learn"
                component={EducationScreen}
                options={{ headerShown: false, title: 'Learn' }}
              />
              <Stack.Screen
                name="History"
                component={ConversationalAllSessions}
                options={{ headerShown: false, title: 'History' }}
              />
              {/* Dual Mode Conversation Screens */}
              <Stack.Screen
                name="ProcessIntegratePicker"
                component={ProcessIntegratePickerScreen}
                options={{
                  headerShown: false,
                  title: 'Process & Integrate'
                }}
              />
              <Stack.Screen
                name="ProcessIntegrate"
                component={ProcessIntegrateScreen}
                options={{
                  headerShown: false,
                  title: 'Process & Integrate'
                }}
              />
              <Stack.Screen
                name="InnerWork"
                component={InnerWorkScreen}
                options={{
                  headerShown: false,
                  title: 'Inner Work'
                }}
              />
              <Stack.Screen
                name="Practice"
                component={PracticeScreen}
                options={{
                  headerShown: false,
                  title: 'Practice'
                }}
              />
              <Stack.Screen
                name="ExperienceMapping"
                component={ExperienceMappingScreen}
                options={{
                  headerShown: false,
                  title: 'Experience Processing'
                }}
              />
              <Stack.Screen 
                name="TherapeuticIntegration" 
                component={TherapeuticIntegrationScreen}
                options={{ 
                  headerShown: false,
                  title: 'Therapeutic Integration'
                }}
              />
              <Stack.Screen
                name="GeneralPreparation"
                component={GeneralPreparationScreen}
                options={{ 
                  headerShown: false,
                  title: 'Foundational Preparation'
                }}
              />
              <Stack.Screen 
                name="SessionPreparation" 
                component={SessionPreparationScreen}
                options={{ 
                  headerShown: false,
                  title: 'Session Preparation'
                }}
              />
              <Stack.Screen
                name="SessionsHub"
                component={SessionsHubScreen}
                options={{
                  headerShown: false,
                  title: 'Sessions'
                }}
              />
              <Stack.Screen
                name="SessionTools"
                component={SessionToolsScreen}
                options={{
                  headerShown: false,
                  title: 'Session Tools'
                }}
              />
              {/* Legacy screens */}
              <Stack.Screen 
                name="Conversation" 
                component={EnhancedConversationScreen}
                options={{ 
                  headerShown: false,
                  title: 'Enhanced Integration Session'
                }}
              />
              <Stack.Screen
                name="NetworkTest"
                component={NetworkTestScreen}
                options={{
                  headerShown: true,
                  title: 'Network Diagnostics'
                }}
              />
              <Stack.Screen
                name="ExerciseLibrary"
                component={ConversationalExerciseLibrary}
                options={{
                  headerShown: false,
                  title: 'Exercise Library'
                }}
              />
              <Stack.Screen
                name="WorksheetLibrary"
                component={WorksheetLibraryScreen}
                options={{
                  headerShown: false,
                  title: 'Printable Worksheets'
                }}
              />
              <Stack.Screen
                name="WorksheetPrint"
                component={WorksheetPrintScreen}
                options={{
                  headerShown: false,
                  title: 'Get Printable'
                }}
              />
              <Stack.Screen
                name="ScanCapture"
                component={ScanCaptureScreen}
                options={{
                  headerShown: false,
                  title: 'Scan a page',
                  // No swipe-back; the capture screen owns its own lifecycle
                  // (it triggers the native scanner on mount).
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="ScanReview"
                component={ScanReviewScreen}
                options={{
                  headerShown: false,
                  title: 'Review scan'
                }}
              />
              <Stack.Screen
                name="ScanDetail"
                component={ScanDetailScreen}
                options={{
                  headerShown: false,
                  title: 'Scan'
                }}
              />
              <Stack.Screen
                name="GuidedExercise"
                component={GuidedExerciseScreen}
                options={{
                  headerShown: false,
                  title: 'Guided Exercise'
                }}
              />
              <Stack.Screen
                name="TriggeredSupport"
                component={ConversationalTriggeredSupport}
                options={{
                  headerShown: false,
                  title: 'Triggered Support'
                }}
              />
              <Stack.Screen
                name="IFSChat"
                component={IFSPartsWorkChatWithContext}
                options={{
                  headerShown: false,
                  title: 'IFS Parts Work'
                }}
              />
              <Stack.Screen
                name="NervousSystemMapping"
                component={ConversationalNervousSystemMapping}
                options={{
                  headerShown: false,
                  title: 'Nervous System Mapping'
                }}
              />
              <Stack.Screen
                name="TriggersGlimmers"
                component={ConversationalTriggersGlimmers}
                options={{
                  headerShown: false,
                  title: 'Triggers & Glimmers'
                }}
              />
              <Stack.Screen
                name="RegulatingResources"
                component={ConversationalRegulatingResources}
                options={{
                  headerShown: false,
                  title: 'Regulating Resources'
                }}
              />
              <Stack.Screen
                name="RegulationToolkit"
                component={RegulationToolkitScreen}
                options={{
                  headerShown: false,
                  title: 'Regulation Toolkit'
                }}
              />
              <Stack.Screen
                name="Insights"
                component={InsightsScreen}
                options={{
                  headerShown: false,
                  title: 'Insights'
                }}
              />
              <Stack.Screen
                name="NervousSystemSummary"
                component={NervousSystemSummaryScreen}
                options={{
                  headerShown: false,
                  title: 'Nervous System'
                }}
              />
              <Stack.Screen
                name="TriggersGlimmersSummary"
                component={TriggersGlimmersSummaryScreen}
                options={{
                  headerShown: false,
                  title: 'Triggers & Glimmers'
                }}
              />
              <Stack.Screen
                name="CoreBeliefsSummary"
                component={CoreBeliefsSummaryScreen}
                options={{
                  headerShown: false,
                  title: 'Core Beliefs'
                }}
              />
              <Stack.Screen
                name="PartsSummary"
                component={PartsSummaryScreen}
                options={{
                  headerShown: false,
                  title: 'Parts'
                }}
              />
              <Stack.Screen
                name="IntegrationSummary"
                component={IntegrationSummaryScreen}
                options={{
                  headerShown: false,
                  title: 'Integration Summary'
                }}
              />
              <Stack.Screen
                name="CoreBeliefs"
                component={CoreBeliefsAssessment}
                options={{
                  headerShown: false,
                  title: 'Core Beliefs Assessment'
                }}
              />
              <Stack.Screen
                name="GlimmerSwiper"
                component={GlimmerSwiper}
                options={{
                  headerShown: false,
                  title: 'Glimmer Swiper'
                }}
              />
              <Stack.Screen
                name="TriggerTracker"
                component={TriggerTracker}
                options={{
                  headerShown: false,
                  title: 'Log a Trigger'
                }}
              />
              <Stack.Screen
                name="GlimmerTracker"
                component={GlimmerTracker}
                options={{
                  headerShown: false,
                  title: 'Capture a Glimmer'
                }}
              />
              <Stack.Screen
                name="NervousSystemCheckin"
                component={NervousSystemCheckin}
                options={{
                  headerShown: false,
                  title: 'Nervous System Check-in'
                }}
              />
              <Stack.Screen
                name="PartsCheckin"
                component={PartsCheckin}
                options={{
                  headerShown: false,
                  title: 'Parts Check-in'
                }}
              />
              <Stack.Screen
                name="IFSPartsInventory"
                component={IFSPartsInventory}
                options={{
                  headerShown: false,
                  title: 'Parts Inventory'
                }}
              />
              <Stack.Screen
                name="CurriculumTracker"
                component={TrailScreen}
                options={{
                  headerShown: false,
                  title: 'Your Progress'
                }}
              />
              <Stack.Screen
                name="HabitTracker"
                component={HabitTracker}
                options={{
                  headerShown: false,
                  title: 'Habit Tracker'
                }}
              />
              <Stack.Screen
                name="AdminMetricsDashboard"
                component={AdminMetricsDashboard}
                options={{
                  headerShown: false,
                  title: 'Metrics Dashboard'
                }}
              />
              <Stack.Screen
                name="AdminApplicationReview"
                component={AdminApplicationReviewScreen}
                options={{
                  headerShown: false,
                  title: 'Contributor Applications'
                }}
              />
              <Stack.Screen
                name="AdminContentReview"
                component={AdminContentReviewScreen}
                options={{
                  headerShown: false,
                  title: 'Exercise Submissions'
                }}
              />
              <Stack.Screen
                name="ContributorExerciseSubmission"
                component={ContributorExerciseSubmissionScreen}
                options={{
                  headerShown: false,
                  title: 'Submit an Exercise'
                }}
              />
              <Stack.Screen
                name="SetIntention"
                component={SetIntentionScreen}
                options={{
                  headerShown: false,
                  title: 'Set Your Intention'
                }}
              />
              <Stack.Screen
                name="SessionChecklist"
                component={SessionChecklistScreen}
                options={{
                  headerShown: false,
                  title: 'Session Checklist'
                }}
              />
              <Stack.Screen
                name="ActiveImagination"
                component={ActiveImaginationScreen}
                options={{
                  headerShown: false,
                  title: 'Active Imagination'
                }}
              />
              <Stack.Screen
                name="PhilosophicalTalkthroughs"
                component={PhilosophicalTalkthroughsHubScreen}
                options={{
                  headerShown: false,
                  title: 'Philosophical Talkthroughs'
                }}
              />
              <Stack.Screen
                name="PhilosophicalTalkthrough"
                component={PhilosophicalTalkthroughScreen}
                options={{
                  headerShown: false,
                  title: 'Philosophical Talkthrough'
                }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  headerShown: false,
                  title: 'Settings'
                }}
              />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
                options={{
                  headerShown: false,
                  title: 'Privacy Policy'
                }}
              />
              <Stack.Screen
                name="TermsOfService"
                component={TermsOfServiceScreen}
                options={{
                  headerShown: false,
                  title: 'Terms of Service'
                }}
              />
              <Stack.Screen
                name="ContributorTools"
                component={ContributorToolsScreen}
                options={{
                  headerShown: false,
                  title: 'Contributor Tools'
                }}
              />
              <Stack.Screen
                name="ContributorApplication"
                component={ContributorApplicationScreen}
                options={{
                  headerShown: false,
                  title: 'Contributor Application'
                }}
              />
              <Stack.Screen
                name="FindSupport"
                component={FindSupportScreen}
                options={{
                  headerShown: false,
                  title: 'Find Support'
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="NetworkTest" component={QuickNetworkTest} />
              <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            </>
          )}
        </Stack.Navigator>
        {/* Global Huxley launcher — floats over every authed screen except
            the full chat + pre-auth gates (see FAB_HIDDEN_ROUTES). */}
        {((session && session.user) || bypassAuth) && !FAB_HIDDEN_ROUTES.has(activeRoute) && (
          <GlobalHuxleyFab navigationRef={navigationRef} />
        )}
      </NavigationContainer>
      </HuxleyChatProvider>
    </PaperProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  bypassButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 30,
  },
  bypassButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});