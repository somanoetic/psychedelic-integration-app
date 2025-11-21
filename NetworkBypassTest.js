import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const NetworkBypassTest = ({ navigation }) => {
  const [testMode, setTestMode] = useState(false);

  const enableTestMode = () => {
    Alert.alert(
      'Test Mode',
      'This will enable offline mode for testing. The app will work without internet connectivity.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enable', 
          onPress: () => {
            setTestMode(true);
            // You could store this in AsyncStorage or context
            console.log('Test mode enabled - app will work offline');
          }
        }
      ]
    );
  };

  const testExperienceMapping = () => {
    // Navigate with test session data
    const testSession = {
      id: 'test_session_123',
      title: 'Test Experience Processing',
      session_data: {
        sessionType: 'experience',
        conversationMode: 'experience_mapping',
        messages: [],
        entities: []
      },
      created_at: new Date().toISOString()
    };
    
    navigation.navigate('ExperienceMapping', { session: testSession, testMode: true });
  };

  const testTherapeuticIntegration = () => {
    // Navigate with test session data
    const testSession = {
      id: 'test_session_456',
      title: 'Test Integration Session',
      session_data: {
        sessionType: 'integration',
        conversationMode: 'therapeutic_integration',
        messages: [],
        entities: []
      },
      created_at: new Date().toISOString()
    };
    
    navigation.navigate('TherapeuticIntegration', { session: testSession, testMode: true });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Bypass Test</Text>
      <Text style={styles.description}>
        Test the app functionality without requiring internet connectivity
      </Text>

      <TouchableOpacity style={styles.button} onPress={enableTestMode}>
        <Text style={styles.buttonText}>
          {testMode ? '✅ Test Mode Enabled' : '🚀 Enable Test Mode'}
        </Text>
      </TouchableOpacity>

      {testMode && (
        <View style={styles.testActions}>
          <Text style={styles.testTitle}>Test App Features:</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testExperienceMapping}>
            <Text style={styles.testButtonText}>📝 Test Experience Processing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={testTherapeuticIntegration}>
            <Text style={styles.testButtonText}>🧘 Test Therapeutic Integration</Text>
          </TouchableOpacity>
          
          <Text style={styles.testNote}>
            Note: These will use fallback responses instead of Claude AI
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testActions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  testButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  backButton: {
    backgroundColor: '#8E8E93',
    padding: 12,
    borderRadius: 6,
  },
  backButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default NetworkBypassTest;