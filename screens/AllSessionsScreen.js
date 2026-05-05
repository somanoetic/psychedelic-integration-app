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

const AllSessionsScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, experience, integration

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      console.log('AllSessionsScreen: Loading sessions');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('AllSessionsScreen: User error:', userError);
        showAlert('Authentication Error', userError.message);
        return;
      }

      if (!user) {
        console.error('AllSessionsScreen: No user found');
        showAlert('Error', 'Please log in again');
        return;
      }

      console.log('AllSessionsScreen: User found:', user.id);

      // Load user sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('AllSessionsScreen: Session loading error:', sessionError);
        showAlert('Database Error', sessionError.message);
      } else {
        console.log('AllSessionsScreen: Sessions loaded:', sessionData?.length || 0);
        setSessions(sessionData || []);
      }

    } catch (error) {
      console.error('AllSessionsScreen: Unexpected error:', error);
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

  const createNewSession = async (type) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        showAlert('Authentication Error', 'Please log in again');
        return;
      }

      const sessionTitle = type === 'experience' 
        ? `Experience Processing ${new Date().toLocaleDateString()}`
        : `Integration Session ${new Date().toLocaleDateString()}`;

      const newSession = {
        user_id: user.id,
        title: sessionTitle,
        journey_date: new Date().toISOString().split('T')[0],
        current_step: 1,
        session_data: {
          sessionType: type,
          conversationMode: type === 'experience' ? 'experience_mapping' : 'therapeutic_integration'
        }
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select()
        .single();

      if (error) {
        console.error('Session creation error:', error);
        showAlert('Error', `Failed to create session: ${error.message}`);
      } else {
        // Add to sessions list
        setSessions(prev => [data, ...prev]);
        
        // Navigate based on type
        if (type === 'experience') {
          navigation.navigate('ExperienceMapping', { session: data });
        } else {
          navigation.navigate('TherapeuticIntegration', { session: data });
        }
      }

    } catch (error) {
      console.error('Error creating session:', error);
      showAlert('Error', `Failed to create session: ${error.message}`);
    }
  };

  const navigateToConversation = (sessionData) => {
    try {
      console.log('AllSessionsScreen: Navigating to conversation with session:', sessionData);
      
      if (!sessionData || !sessionData.id) {
        console.error('AllSessionsScreen: Invalid session data for navigation:', sessionData);
        showAlert('Error', 'Invalid session data');
        return;
      }

      // Navigate based on session type
      const sessionType = sessionData.session_data?.sessionType || 'integration';
      if (sessionType === 'experience') {
        navigation.navigate('ExperienceMapping', { session: sessionData });
      } else {
        navigation.navigate('TherapeuticIntegration', { session: sessionData });
      }
      
    } catch (error) {
      console.error('AllSessionsScreen: Navigation error:', error);
      showAlert('Navigation Error', error.message);
    }
  };

  const getFilteredSessions = () => {
    if (filter === 'all') return sessions;
    
    return sessions.filter(session => {
      const sessionType = session.session_data?.sessionType || 'integration';
      if (filter === 'experience') return sessionType === 'experience';
      if (filter === 'integration') return sessionType === 'integration';
      return true;
    });
  };

  const renderFilterButtons = () => {
    return (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' && styles.filterButtonTextActive
          ]}>
            All Sessions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'experience' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('experience')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'experience' && styles.filterButtonTextActive
          ]}>
            📝 Experience Processing
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'integration' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('integration')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'integration' && styles.filterButtonTextActive
          ]}>
            🧘 Therapeutic Integration
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSession = ({ item }) => {
    console.log('AllSessionsScreen: Rendering session:', item);
    
    const sessionType = item.session_data?.sessionType || 'integration';
    const sessionTypeLabel = sessionType === 'experience' 
      ? '📝 Experience Processing' 
      : '🧘 Therapeutic Integration';
    
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('AllSessionsScreen: Session clicked:', item);
          navigateToConversation(item);
        }}
        style={styles.sessionItem}
      >
        <Card style={styles.sessionCard}>
          <Card.Content>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>{item.title || 'Untitled Session'}</Text>
              <Text style={styles.sessionType}>{sessionTypeLabel}</Text>
            </View>
            <Text style={styles.sessionDate}>
              {item.journey_date 
                ? new Date(item.journey_date).toLocaleDateString()
                : new Date(item.created_at).toLocaleDateString()
              }
            </Text>
            <Text style={styles.sessionStep}>Step {item.current_step || 1} of 4</Text>
            
            {/* Show additional session data if available */}
            {item.session_data?.practicesCompleted && (
              <Text style={styles.sessionExtra}>
                {item.session_data.practicesCompleted.length} practices completed
              </Text>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Sessions Found</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' 
          ? 'Create your first session to begin processing and integrating your psychedelic experiences.'
          : filter === 'experience'
          ? 'No experience processing sessions yet. Create one to systematically document your journey.'
          : 'No therapeutic integration sessions yet. Create one to work on connecting insights to your life.'
        }
      </Text>
      <View style={styles.createButtons}>
        <TouchableOpacity 
          style={[styles.createButton, styles.experienceButton]} 
          onPress={() => createNewSession('experience')}
        >
          <Text style={styles.createButtonText}>📝 New Experience Processing</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.createButton, styles.integrationButton]} 
          onPress={() => createNewSession('integration')}
        >
          <Text style={styles.createButtonText}>🧘 New Integration Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredSessions = getFilteredSessions();

  console.log('AllSessionsScreen: Rendering, loading:', loading, 'sessions:', filteredSessions.length);

  return (
    <LinearGradient colors={gradients.standard} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="All Sessions" />
        <Appbar.Action
          icon="refresh"
          onPress={loadSessions}
        />
      </Appbar.Header>

      {/* Filter Buttons */}
      {renderFilterButtons()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.sessionsList}
          ListEmptyComponent={renderEmptyState}
          refreshing={loading}
          onRefresh={loadSessions}
        />
      )}

      <View style={styles.fabContainer}>
        <FAB
          style={[styles.fab, styles.experienceFab]}
          icon="pencil"
          label="Experience"
          onPress={() => createNewSession('experience')}
          size="small"
        />
        <FAB
          style={[styles.fab, styles.integrationFab]}
          icon="meditation"
          label="Integration"
          onPress={() => createNewSession('integration')}
          size="small"
        />
      </View>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: colors.textInverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  sessionType: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sessionStep: {
    fontSize: 12,
    color: '#2196f3',
    marginBottom: 4,
  },
  sessionExtra: {
    fontSize: 11,
    color: colors.success,
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
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButtons: {
    gap: 12,
    width: '100%',
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  experienceButton: {
    backgroundColor: colors.success,
  },
  integrationButton: {
    backgroundColor: colors.primary,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    gap: 8,
  },
  fab: {
    backgroundColor: colors.primary,
  },
  experienceFab: {
    backgroundColor: colors.success,
  },
  integrationFab: {
    backgroundColor: colors.primary,
  },
});

export default AllSessionsScreen;