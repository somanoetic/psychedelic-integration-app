import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import config from '../lib/config';
import { colors } from '../theme/colors';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const QuickNetworkTest = ({ navigation }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, status, details) => {
    const result = { test, status, details, timestamp: new Date() };
    setResults(prev => [...prev, result]);
    console.log(`${test}: ${status} - ${details}`);
  };

  const testBasicConnectivity = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Basic internet
    addResult('Internet', 'testing', 'Testing basic connectivity...');
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      addResult('Internet', 'success', `Connected (${response.status})`);
    } catch (error) {
      addResult('Internet', 'failed', error.message);
      setTesting(false);
      return; // Stop if no internet
    }

    // Test 2: Anthropic API domain resolution
    addResult('API Domain', 'testing', 'Testing api.anthropic.com...');
    try {
      const response = await fetch('https://api.anthropic.com', { 
        method: 'HEAD',
        timeout: 10000 
      });
      addResult('API Domain', 'success', `Domain accessible (${response.status})`);
    } catch (error) {
      addResult('API Domain', 'failed', error.message);
    }

    // Test 3: API endpoint test
    addResult('API Endpoint', 'testing', 'Testing API endpoint...');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY || 'test-key',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        }),
        timeout: 15000
      });

      if (response.status === 200) {
        addResult('API Endpoint', 'success', 'API fully accessible!');
      } else if (response.status === 401) {
        addResult('API Endpoint', 'partial', 'Endpoint works, check API key');
      } else if (response.status < 500) {
        addResult('API Endpoint', 'partial', `Endpoint accessible (${response.status})`);
      } else {
        addResult('API Endpoint', 'failed', `Server error: ${response.status}`);
      }
    } catch (error) {
      addResult('API Endpoint', 'failed', error.message);
    }

    setTesting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return colors.success;
      case 'failed': return colors.error;
      case 'partial': return colors.warning;
      case 'testing': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'partial': return '⚠️';
      case 'testing': return '🔄';
      default: return '•';
    }
  };

  const getDiagnosis = () => {
    if (results.length === 0) return null;

    const internetFailed = results.some(r => r.test === 'Internet' && r.status === 'failed');
    const domainFailed = results.some(r => r.test === 'API Domain' && r.status === 'failed');
    const endpointFailed = results.some(r => r.test === 'API Endpoint' && r.status === 'failed');
    const allSuccess = results.every(r => r.status === 'success' || r.status === 'partial');

    if (internetFailed) {
      return {
        title: '🌐 No Internet Connection',
        message: 'Your device cannot reach the internet.',
        solutions: [
          'Check WiFi/cellular connection',
          'Restart network adapter',
          'Try different network'
        ]
      };
    }

    if (domainFailed) {
      return {
        title: '🚫 Anthropic API Blocked',
        message: 'Your network is blocking access to api.anthropic.com',
        solutions: [
          'Disable VPN temporarily',
          'Switch to mobile hotspot',
          'Contact network administrator',
          'Try different DNS servers (8.8.8.8)'
        ]
      };
    }

    if (endpointFailed) {
      return {
        title: '🔐 API Access Issue',
        message: 'Can reach domain but API calls are failing',
        solutions: [
          'Check if VPN has protocol restrictions',
          'Verify firewall allows HTTPS API calls',
          'Try different network',
          'Check corporate proxy settings'
        ]
      };
    }

    if (allSuccess) {
      return {
        title: '✅ Network Looks Good!',
        message: 'All connectivity tests passed. The issue might be temporary.',
        solutions: [
          'Try the app again now',
          'Restart the app if still failing',
          'Check Anthropic status page',
          'Verify API key is valid'
        ]
      };
    }

    return {
      title: '🔍 Mixed Results',
      message: 'Some tests passed, others failed. Check details below.',
      solutions: ['Review individual test results', 'Try suggested fixes above']
    };
  };

  const diagnosis = getDiagnosis();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quick Network Test</Text>
        <View />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claude API Connectivity Test</Text>
          <Text style={styles.description}>
            This will test the specific connection path your app uses to reach Claude.
          </Text>

          <TouchableOpacity
            style={[styles.testButton, testing && styles.testButtonDisabled]}
            onPress={testBasicConnectivity}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.testButtonText}>Test Claude Connection</Text>
            )}
          </TouchableOpacity>
        </View>

        {diagnosis && (
          <View style={[styles.diagnosisSection, 
            diagnosis.title.includes('✅') && styles.successDiagnosis,
            diagnosis.title.includes('❌') && styles.errorDiagnosis,
            diagnosis.title.includes('🚫') && styles.blockedDiagnosis
          ]}>
            <Text style={styles.diagnosisTitle}>{diagnosis.title}</Text>
            <Text style={styles.diagnosisMessage}>{diagnosis.message}</Text>
            
            <Text style={styles.solutionsTitle}>Try these solutions:</Text>
            {diagnosis.solutions.map((solution, index) => (
              <Text key={index} style={styles.solutionItem}>• {solution}</Text>
            ))}
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                  <Text style={styles.resultTest}>{result.test}</Text>
                  <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                    {result.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.resultDetails}>{result.details}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'VPN Check',
                'Do you have a VPN enabled?\n\nIf yes, try disabling it temporarily and test again.',
                [
                  { text: 'No VPN', style: 'cancel' },
                  { text: 'Will disable VPN', onPress: () => {} }
                ]
              );
            }}
          >
            <Text style={styles.actionButtonText}>🔧 Check VPN Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Network Switch',
                'Try switching networks:\n\n• WiFi → Cellular data\n• Or try a mobile hotspot\n• Different WiFi network',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.actionButtonText}>📱 Switch Networks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Corporate Network',
                'If on corporate/work network:\n\n• Contact IT about API access\n• Try personal mobile hotspot\n• Check proxy settings',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.actionButtonText}>🏢 Corporate Network Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  diagnosisSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  successDiagnosis: {
    backgroundColor: '#ecfdf5',
    borderColor: colors.success,
  },
  errorDiagnosis: {
    backgroundColor: '#fef2f2',
    borderColor: colors.error,
  },
  blockedDiagnosis: {
    backgroundColor: colors.bubbleArchetypal,
    borderColor: colors.warning,
  },
  diagnosisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  diagnosisMessage: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  solutionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  solutionItem: {
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 8,
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultTest: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 24,
  },
  quickActionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
};

export default QuickNetworkTest;
