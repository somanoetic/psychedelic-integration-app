import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Appbar, Card, FAB } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Loading sessions...');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setDebugInfo('Connecting to database...');
      console.log('HomeScreen: Loading sessions');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('HomeScreen: User error:', userError);
        setDebugInfo(`User error: ${userError.message}`);
        showAlert('Authentication Error', userError.message);
        return;
      }

      if (!user) {
        console.error('HomeScreen: No user found');
        setDebugInfo('No user found');
        showAlert('Error', 'Please log in again');
        return;
      }

      console.log('HomeScreen: User found:', user.id);
      setDebugInfo('Loading your sessions...');

      // Load user sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('HomeScreen: Session loading error:', sessionError);
        setDebugInfo(`Database error: ${sessionError.message}`);
        showAlert('Database Error', sessionError.message);
      } else {
        console.log('HomeScreen: Sessions loaded:', sessionData?.length || 0);
        setDebugInfo(`Loaded ${sessionData?.length || 0} sessions`);
        setSessions(sessionData || []);
      }

    } catch (error) {
      console.error('HomeScreen: Unexpected error:', error);
      setDebugInfo(`Network error: ${error.message}`);
      showAlert('Connection Error', 'Unable to load sessions. Check your connection.');
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

  const createNewSession = async () => {
    try {
      setDebugInfo('Creating new session...');
      console.log('HomeScreen: Creating new session');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('HomeScreen: User error in create session:', userError);
        showAlert('Authentication Error', 'Please log in again');
        return;
      }

      const newSession = {
        user_id: user.id,
        title: `Integration Session ${new Date().toLocaleDateString()}`,
        journey_date: new Date().toISOString().split('T')[0],
        current_step: 1,
        session_data: {}
      };

      console.log('HomeScreen: Inserting session:', newSession);

      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select()
        .single();

      if (error) {
        console.error('HomeScreen: Session creation error:', error);
        setDebugInfo(`Session creation failed: ${error.message}`);
        showAlert('Error', `Failed to create session: ${error.message}`);
      } else {
        console.log('HomeScreen: Session created successfully:', data);
        setDebugInfo('Session created successfully!');
        
        // Add to sessions list
        setSessions(prev => [data, ...prev]);
        
        // Navigate to conversation
        navigateToConversation(data);
      }

    } catch (error) {
      console.error('HomeScreen: Unexpected error in session creation:', error);
      setDebugInfo(`Error creating session: ${error.message}`);
      showAlert('Error', `Failed to create session: ${error.message}`);
    }
  };

  const navigateToConversation = (sessionData) => {
    try {
      console.log('HomeScreen: Navigating to conversation with session:', sessionData);
      
      if (!sessionData || !sessionData.id) {
        console.error('HomeScreen: Invalid session data for navigation:', sessionData);
        showAlert('Error', 'Invalid session data');
        return;
      }

      setDebugInfo(`Opening session: ${sessionData.title}`);
      
      navigation.navigate('Conversation', { 
        session: sessionData 
      });
      
    } catch (error) {
      console.error('HomeScreen: Navigation error:', error);
      setDebugInfo(`Navigation error: ${error.message}`);
      showAlert('Navigation Error', error.message);
    }
  };

  const renderSession = ({ item }) => {
    console.log('HomeScreen: Rendering session:', item);
    
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('HomeScreen: Session clicked:', item);
          navigateToConversation(item);
        }}
        style={styles.sessionItem}
      >
        <Card style={styles.sessionCard}>
          <Card.Content>
            <Text style={styles.sessionTitle}>{item.title || 'Untitled Session'}</Text>
            <Text style={styles.sessionDate}>
              {item.journey_date 
                ? new Date(item.journey_date).toLocaleDateString()
                : new Date(item.created_at).toLocaleDateString()
              }
            </Text>
            <Text style={styles.sessionStep}>Step {item.current_step || 1} of 4</Text>
            <Text style={styles.sessionId}>ID: {item.id}</Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Welcome to Integration</Text>
      <Text style={styles.emptyText}>
        Create your first session to begin processing and integrating your psychedelic experiences.
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={createNewSession}>
        <Text style={styles.createButtonText}>Create First Session</Text>
      </TouchableOpacity>
    </View>
  );

  console.log('HomeScreen: Rendering, loading:', loading, 'sessions:', sessions.length);

  return (
    <LinearGradient colors={gradients.standard} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Appbar.Header>
        <Appbar.Content title="Integration Sessions" />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate('AdminSetup')}
        />
        <Appbar.Action
          icon="refresh"
          onPress={loadSessions}
        />
      </Appbar.Header>

      {/* Debug info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Debug: {debugInfo}</Text>
        <TouchableOpacity 
          style={styles.adminButton} 
          onPress={() => navigation.navigate('AdminSetup')}
        >
          <Text style={styles.adminButtonText}>🔧 Admin Setup (Click to Get Professional Access)</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.sessionsList}
          ListEmptyComponent={renderEmptyState}
          refreshing={loading}
          onRefresh={loadSessions}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Session"
        onPress={createNewSession}
      />
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugContainer: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    margin: 8,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 8,
  },
  adminButton: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  adminButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  sessionsList: {
    padding: 16,
    flexGrow: 1,
  },
  sessionItem: {
    marginBottom: 12,
  },
  sessionCard: {
    elevation: 2,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sessionStep: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
  },
  sessionId: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default HomeScreen;