import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './lib/supabase';
import { colors } from './theme/colors';
import AuthScreen from './screens/AuthScreen';
import OnboardingCarousel from './screens/OnboardingCarousel';
import AnimatedSplash from './components/AnimatedSplash';
import ConversationScreen from './screens/ConversationScreen';
import SimpleEnhancedConversationScreen from './screens/SimpleEnhancedConversationScreen';
import EnhancedConversationScreen from './screens/EnhancedConversationScreen';
import EducationScreen from './screens/EducationScreen';
import OrganizedHomeScreen from './screens/OrganizedHomeScreen';
import ConversationalHomeScreen from './components/ConversationalHomeScreen';
import AllSessionsScreen from './screens/AllSessionsScreen';
import ExperienceMappingScreen from './screens/ExperienceMappingScreen';
import TherapeuticIntegrationScreen from './screens/TherapeuticIntegrationScreen';
import PreparationScreen from './screens/PreparationScreen';
import GeneralPreparationScreen from './screens/preparation/GeneralPreparationScreen';
import SessionPreparationScreen from './screens/preparation/SessionPreparationScreen';
import SessionToolsScreen from './screens/SessionToolsScreen';
import SessionDetailScreen from './screens/SessionDetailScreen';
import InteractiveSessionMindMap from './screens/InteractiveSessionMindMap';
import QuickNetworkTest from './screens/QuickNetworkTest';
import NetworkTestScreen from './screens/NetworkTestScreen';
import ExerciseLibraryScreen from './screens/ExerciseLibraryScreen';

// Conversational Components
import ConversationalSessionTools from './components/ConversationalSessionTools';
import ConversationalAllSessions from './components/ConversationalAllSessions';
import ConversationalExerciseLibrary from './components/ConversationalExerciseLibrary';
import ConversationalTriggeredSupport from './components/ConversationalTriggeredSupport';
import ConversationalJournalEntry from './components/ConversationalJournalEntry';
import DailyJournal from './components/DailyJournal';
import ConversationalNervousSystemMapping from './components/ConversationalNervousSystemMapping';
import ConversationalTriggersGlimmers from './components/ConversationalTriggersGlimmers';
import ConversationalRegulatingResources from './components/ConversationalRegulatingResources';
import CoreBeliefsAssessment from './components/CoreBeliefsAssessment';
import IFSPartsWorkChatWithContext from './enhanced-components/IFSPartsWorkChatWithContext';
import GlimmerSwiper from './components/GlimmerSwiper';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  // Use the actual safe area inset from the device
  const bottomInset = insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Sessions') {
            iconName = 'chat';
          } else if (route.name === 'Education') {
            iconName = 'school';
          } else if (route.name === 'AllSessions') {
            iconName = 'list';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.sand,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          paddingBottom: 4,
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Sessions"
        component={ConversationalHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Education"
        component={EducationScreen}
        options={{ title: 'Learn' }}
      />
      <Tab.Screen
        name="AllSessions"
        component={ConversationalAllSessions}
        options={{ title: 'Sessions' }}
      />
    </Tab.Navigator>
  );
};

// Main App Component with debug logging
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Starting app...');
  const [bypassAuth, setBypassAuth] = useState(false); // Add bypass mode
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showSplash, setShowSplash] = useState(true); // Show animated splash on startup

  useEffect(() => {
    checkOnboardingStatus();
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

  const initializeApp = async () => {
    try {
      setDebugInfo('Connecting to Supabase...');
      console.log('App: Starting initialization');

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
      setLoading(false);

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('App: Auth state changed:', _event, session ? 'Logged in' : 'Logged out');
        setSession(session);
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

  // Show onboarding for first-time users (after auth check)
  if ((session?.user || bypassAuth) && !onboardingComplete && !checkingOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingCarousel onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  // Show animated splash screen
  if (showSplash) {
    return (
      <AnimatedSplash
        onAnimationFinish={() => {
          console.log('Splash animation finished');
          setShowSplash(false);
        }}
      />
    );
  }

  if (loading || checkingOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTitle}>Psycheteleos</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <Text style={styles.debugHint}>
          If stuck here, check console logs or try restarting
        </Text>

        {/* Emergency bypass button */}
        <TouchableOpacity
          style={styles.bypassButton}
          onPress={() => {
            console.log('Emergency bypass activated');
            setBypassAuth(true);
            setLoading(false);
          }}
        >
          <Text style={styles.bypassButtonText}>🚨 Emergency Bypass (Test Mode)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {(session && session.user) || bypassAuth ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              {/* Dual Mode Conversation Screens */}
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
                name="Preparation" 
                component={PreparationScreen}
                options={{ 
                  headerShown: false,
                  title: 'Preparation Hub'
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
                name="SessionTools"
                component={ConversationalSessionTools}
                options={{
                  headerShown: false,
                  title: 'Session Tools'
                }}
              />
              <Stack.Screen
                name="SessionDetail"
                component={SessionDetailScreen}
                options={{
                  headerShown: false,
                  title: 'Session Detail'
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
                name="MindMap" 
                component={InteractiveSessionMindMap}
                options={{ 
                  headerShown: false,
                  title: 'Mind Map'
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
                name="TriggeredSupport"
                component={ConversationalTriggeredSupport}
                options={{
                  headerShown: false,
                  title: 'Triggered Support'
                }}
              />
              <Stack.Screen
                name="JournalEntry"
                component={ConversationalJournalEntry}
                options={{
                  headerShown: false,
                  title: 'Journal Entry'
                }}
              />
              <Stack.Screen
                name="DailyJournal"
                component={DailyJournal}
                options={{
                  headerShown: false,
                  title: 'Daily Journal'
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
            </>
          ) : (
            <>
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="NetworkTest" component={QuickNetworkTest} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
    </SafeAreaProvider>
  );
}

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