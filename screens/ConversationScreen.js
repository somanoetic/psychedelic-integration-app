import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Appbar, Chip, Menu } from 'react-native-paper';
import { IntegrationGuide } from '../lib/claudeService';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

const ConversationScreen = ({ navigation, route }) => {
  // DEBUG: Log the route params immediately
  console.log('ConversationScreen route params:', route.params);
  
  // Extract session with multiple fallback methods
  const session = route?.params?.session || route?.params?.sessionData || null;
  
  // DEBUG: Log what we actually got
  console.log('ConversationScreen extracted session:', session);
  
  // Early return if no session - with better error info
  if (!session || !session.id) {
    console.log('ConversationScreen: No valid session found');
    console.log('Route params available:', Object.keys(route?.params || {}));
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorText}>
          No session data available. Please go back and select a session.
        </Text>
        <Text style={styles.debugText}>
          Debug: Route params = {JSON.stringify(route?.params || 'none')}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State variables
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState([]);
  const [personalityMode, setPersonalityMode] = useState('mystical');
  const [menuVisible, setMenuVisible] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showMindMap, setShowMindMap] = useState(false);
  
  const flatListRef = useRef(null);
  const integrationGuideRef = useRef(null);

  // Initialize integration guide
  useEffect(() => {
    const initializeGuide = async () => {
      try {
        setIsInitializing(true);
        integrationGuideRef.current = new IntegrationGuide(personalityMode);
        
        // Load existing session data
        await loadSessionData();
        
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing guide:', error);
        showAlert('Error', 'Failed to initialize conversation. Please try again.');
        setIsInitializing(false);
      }
    };

    initializeGuide();
  }, [session.id, personalityMode]);

  // Load session data from session_data (using our workaround)
  const loadSessionData = async () => {
    try {
      console.log('Loading session data for session:', session.id);
      
      // Load messages from session_data instead of messages table
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('session_data')
          .eq('id', session.id)
          .single();

        if (sessionError) {
          console.error('Error loading session data:', sessionError);
          setMessages([]);
        } else {
          const messages = sessionData?.session_data?.messages || [];
          console.log('Loaded', messages.length, 'messages from session data');
          
          if (messages.length > 0) {
            const formattedMessages = messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(formattedMessages);
            
            // Initialize Claude with conversation history
            if (integrationGuideRef.current) {
              integrationGuideRef.current.initializeWithHistory(formattedMessages);
            }
          } else {
            setMessages([]);
          }
        }
      } catch (messageError) {
        console.error('Error loading messages from session data:', messageError);
        setMessages([]);
      }

      // Load entities
      try {
        const { data: entityData, error: entityError } = await supabase
          .from('entities')
          .select('*')
          .eq('session_id', session.id)
          .order('first_mentioned', { ascending: true });

        if (entityError) {
          console.error('Error loading entities:', entityError);
          setEntities([]);
        } else if (entityData) {
          console.log('Loaded', entityData.length, 'entities');
          setEntities(entityData);
        } else {
          setEntities([]);
        }
      } catch (entityError) {
        console.error('Error loading entities:', entityError);
        setEntities([]);
      }

    } catch (error) {
      console.error('Error loading session data:', error);
      setMessages([]);
      setEntities([]);
    }
  };

  // Save message to session_data (using our workaround)
  const saveMessageToDatabase = async (message) => {
    try {
      const { data: currentSession, error: fetchError } = await supabase
        .from('sessions')
        .select('session_data')
        .eq('id', session.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current session:', fetchError);
        return message;
      }

      const currentMessages = currentSession?.session_data?.messages || [];
      const updatedMessages = [...currentMessages, {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        entities: message.entities || []
      }];

      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          session_data: {
            ...currentSession?.session_data,
            messages: updatedMessages
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) {
        console.error('Error saving message to session data:', updateError);
        return message;
      }

      console.log('Message saved to session data successfully');
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      return message;
    }
  };

  // Save entities to database
  const saveEntitiesToDatabase = async (sessionId, extractedEntities) => {
    try {
      if (!extractedEntities || extractedEntities.length === 0) {
        return [];
      }

      const entityInserts = extractedEntities.map(entity => ({
        session_id: sessionId,
        name: entity.name || 'Unknown',
        description: entity.context || entity.description || '',
        category: entity.category || 'unknown',
        emotional_intensity: entity.emotional_intensity || 'medium',
        confidence: entity.confidence || 0.7,
        context: entity.context || '',
        source: 'claude_extraction',
        first_mentioned: new Date().toISOString()
      }));

      const { data: savedEntities, error: entityError } = await supabase
        .from('entities')
        .upsert(entityInserts, { 
          onConflict: 'session_id,name',
          ignoreDuplicates: false 
        })
        .select();

      if (entityError) {
        console.error('Entity save error:', entityError);
        return extractedEntities;
      }

      return savedEntities || extractedEntities;
    } catch (error) {
      console.error('Error saving entities:', error);
      return extractedEntities;
    }
  };

  // Handle sending message
  const sendMessage = async () => {
    if (!inputText.trim() || loading || !integrationGuideRef.current) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      entities: []
    };

    try {
      setLoading(true);
      setInputText('');
      
      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage]);

      // Save user message
      await saveMessageToDatabase(userMessage);

      // Get AI response
      const response = await integrationGuideRef.current.continueConversation(userMessage.content);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        entities: integrationGuideRef.current.entities || []
      };

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      await saveMessageToDatabase(assistantMessage);

      // Save extracted entities
      if (integrationGuideRef.current.entities && integrationGuideRef.current.entities.length > 0) {
        const savedEntities = await saveEntitiesToDatabase(
          session.id, 
          integrationGuideRef.current.entities
        );
        setEntities(prev => {
          const existingNames = prev.map(e => e.name);
          const newEntities = savedEntities.filter(e => !existingNames.includes(e.name));
          return [...prev, ...newEntities];
        });
      }

    } catch (error) {
      console.error('Error in conversation:', error);
      showAlert('Error', 'Failed to send message. Please check your connection and try again.');
      
      // Remove user message from UI if it failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  // Cross-platform alert helper
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Handle personality mode change
  const changePersonalityMode = async (newMode) => {
    if (newMode === personalityMode) return;
    
    try {
      setPersonalityMode(newMode);
      setMenuVisible(false);
      
      // Reinitialize guide with new personality
      integrationGuideRef.current = new IntegrationGuide(newMode);
      if (messages.length > 0) {
        integrationGuideRef.current.initializeWithHistory(messages);
      }
    } catch (error) {
      console.error('Error changing personality mode:', error);
      showAlert('Error', 'Failed to change guide personality');
    }
  };

  // Render message bubble
  const renderMessage = ({ item }) => {
    if (!item) return null;
    
    return (
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage
      ]}>
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userMessageText : styles.assistantMessageText
        ]}>
          {item.content || ''}
        </Text>
        {item.entities && item.entities.length > 0 && (
          <View style={styles.entitiesInMessage}>
            {item.entities.slice(0, 3).map((entity, index) => (
              <Chip
                key={index}
                style={styles.entityChip}
                textStyle={styles.entityChipText}
                onPress={() => showAlert('Symbol', `${entity.name || 'Unknown'}: ${entity.description || 'Discovered symbol'}`)}
              >
                {entity.name || 'Unknown'}
              </Chip>
            ))}
          </View>
        )}
        <Text style={styles.timestamp}>
          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Initializing your integration space...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={gradients.standard} start={{ x: 1.0, y: 0.0 }} end={{ x: 0.0, y: 1.0 }} style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={session?.title || 'Integration Session'} />
        
        {/* Mind Map button */}
        <Appbar.Action
          icon="share"
          onPress={() => navigation.navigate('MindMap', { session: session })}
        />
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="more-vert" 
              onPress={() => setMenuVisible(true)} 
            />
          }
        >
          <Menu.Item 
            onPress={() => changePersonalityMode('mystical')} 
            title="Mystical Guide" 
            titleStyle={personalityMode === 'mystical' ? { fontWeight: 'bold' } : {}}
          />
          <Menu.Item 
            onPress={() => changePersonalityMode('clinical')} 
            title="Clinical Guide" 
            titleStyle={personalityMode === 'clinical' ? { fontWeight: 'bold' } : {}}
          />
          <Menu.Item 
            onPress={() => changePersonalityMode('exploratory')} 
            title="Exploratory Guide" 
            titleStyle={personalityMode === 'exploratory' ? { fontWeight: 'bold' } : {}}
          />
           <Menu.Item 
             onPress={() => {
                setShowMindMap(true);
                setMenuVisible(false);
              }} 
              title="View Mind Map"
              leadingIcon="brain"
                  />
        </Menu>
      </Appbar.Header>

      {/* Entities Bar */}
      {entities && entities.length > 0 && (
        <View style={styles.entitiesContainer}>
          <FlatList
            horizontal
            data={entities}
            renderItem={({ item }) => {
              if (!item || !item.name) return null;
              return (
                <Chip
                  style={styles.entityChip}
                  textStyle={styles.entityChipText}
                  onPress={() => showAlert('Symbol Discovered', `${item.name}: ${item.description || 'A symbol from your journey'}`)}
                >
                  {item.name}
                </Chip>
              );
            }}
            keyExtractor={(item, index) => item?.id?.toString() || `entity-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.entitiesList}
          />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item?.id?.toString() || `message-${index}`}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Welcome to your integration space. Share your experience and let's begin the journey of understanding together.
            </Text>
          </View>
        }
      />

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Share your experience..."
          multiline
          style={styles.textInput}
          editable={!loading}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={loading || !inputText.trim()}
          style={[
            styles.sendButton,
            (loading || !inputText.trim()) && styles.sendButtonDisabled
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>

        {showMindMap && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'white',
            zIndex: 1000 
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#6C5CE7' }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Mind Map</Text>
              <TouchableOpacity onPress={() => setShowMindMap(false)}>
                <Text style={{ color: 'white', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <InteractiveSessionMindMap 
              session={session}
              entities={entities}
              connections={[]} // Add connections if you have them
              onEntitySelect={(entity) => {
                console.log('Selected entity:', entity);
              }}
              onConnectionCreate={(connection) => {
                console.log('Created connection:', connection);
                // TODO: Save to database
              }}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  entitiesContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entitiesList: {
    paddingHorizontal: 16,
  },
  entityChip: {
    marginRight: 8,
    backgroundColor: '#e3f2fd',
  },
  entityChipText: {
    fontSize: 12,
    color: '#1565c0',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.textInverse,
  },
  assistantMessageText: {
    color: colors.text,
  },
  entitiesInMessage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  debugText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'monospace',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConversationScreen;