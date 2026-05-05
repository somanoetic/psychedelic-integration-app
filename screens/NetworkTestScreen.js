import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import config from '../lib/config';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const NetworkTestScreen = ({ navigation }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, status, details) => {
    setResults(prev => [...prev, { test, status, details, timestamp: new Date() }]);
  };

  const testConnectivity = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Test 1: Basic internet connectivity
      addResult('Internet Connectivity', 'testing', 'Testing basic internet...');
      try {
        const response = await fetch('https://www.google.com', { method: 'HEAD' });
        addResult('Internet Connectivity', 'success', `Status: ${response.status}`);
      } catch (error) {
        addResult('Internet Connectivity', 'failed', error.message);
      }

      // Test 2: Supabase connectivity
      addResult('Supabase Database', 'testing', 'Testing Supabase connection...');
      try {
        const { data, error } = await supabase.from('sessions').select('count').limit(1);
        if (error) throw error;
        addResult('Supabase Database', 'success', 'Connection successful');
      } catch (error) {
        addResult('Supabase Database', 'failed', error.message);
      }

      // Test 3: Anthropic API accessibility
      addResult('Anthropic API Access', 'testing', 'Testing API endpoint access...');
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
          })
        });
        
        if (response.status === 401) {
          addResult('Anthropic API Access', 'partial', 'Endpoint accessible, API key invalid');
        } else if (response.status < 500) {
          addResult('Anthropic API Access', 'success', `Endpoint accessible (${response.status})`);
        } else {
          addResult('Anthropic API Access', 'failed', `Server error: ${response.status}`);
        }
      } catch (error) {
        addResult('Anthropic API Access', 'failed', error.message);
      }

      // Test 4: DNS resolution
      addResult('DNS Resolution', 'testing', 'Testing domain resolution...');
      try {
        await fetch('https://api.anthropic.com', { method: 'HEAD' });
        addResult('DNS Resolution', 'success', 'Domain resolves correctly');
      } catch (error) {
        if (error.message.includes('Network request failed')) {
          addResult('DNS Resolution', 'failed', 'DNS resolution failed or domain blocked');
        } else {
          addResult('DNS Resolution', 'partial', error.message);
        }
      }

      // Test 5: HTTPS capability
      addResult('HTTPS Support', 'testing', 'Testing HTTPS connections...');
      try {
        await fetch('https://httpbin.org/get', { method: 'GET' });
        addResult('HTTPS Support', 'success', 'HTTPS requests working');
      } catch (error) {
        addResult('HTTPS Support', 'failed', error.message);
      }

    } catch (error) {
      addResult('General Test', 'failed', `Test suite error: ${error.message}`);
    } finally {
      setTesting(false);
    }
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

  const generateDiagnosis = () => {
    const failed = results.filter(r => r.status === 'failed');
    const successful = results.filter(r => r.status === 'success');
    
    if (failed.some(r => r.test === 'Internet Connectivity')) {
      return {
        title: 'No Internet Connection',
        message: 'Basic internet connectivity is not available. Check your wifi/cellular connection.',
        actions: ['Check wifi settings', 'Try cellular data', 'Restart network connection']
      };
    }
    
    if (failed.some(r => r.test === 'Anthropic API Access')) {
      return {
        title: 'Anthropic API Blocked',
        message: 'The Anthropic API endpoint is not accessible. This is likely due to network restrictions.',
        actions: [
          'Disable VPN temporarily',
          'Try different network (mobile hotspot)',
          'Check corporate firewall settings',
          'Contact IT department if on corporate network'
        ]
      };
    }
    
    if (failed.some(r => r.test === 'DNS Resolution')) {
      return {
        title: 'DNS Issues',
        message: 'Domain name resolution is failing. DNS servers may be blocking the API.',
        actions: [
          'Try different DNS servers (8.8.8.8)',
          'Check VPN DNS settings',
          'Restart router/modem'
        ]
      };
    }
    
    if (successful.length > 0 && failed.length === 0) {
      return {
        title: 'Network Connectivity Good',
        message: 'All network tests passed. The issue may be temporary or with the API service.',
        actions: [
          'Try again in a few moments',
          'Check Anthropic status page',
          'Verify API key is valid'
        ]
      };
    }
    
    return {
      title: 'Mixed Results',
      message: 'Some tests passed, others failed. Review individual results for more detail.',
      actions: ['Review test results below', 'Contact support with results']
    };
  };

  const diagnosis = results.length > 0 ? generateDiagnosis() : null;

  return (
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Network Diagnostics</Text>
        <View />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Connectivity Test</Text>
          <Text style={styles.sectionDescription}>
            This will test your connection to various services to help diagnose Claude API issues.
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, testing && styles.testButtonDisabled]}
            onPress={testConnectivity}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.testButtonText}>Run Network Tests</Text>
            )}
          </TouchableOpacity>
        </View>

        {diagnosis && (
          <View style={styles.diagnosisSection}>
            <Text style={styles.diagnosisTitle}>{diagnosis.title}</Text>
            <Text style={styles.diagnosisMessage}>{diagnosis.message}</Text>
            
            <Text style={styles.actionsTitle}>Suggested Actions:</Text>
            {diagnosis.actions.map((action, index) => (
              <Text key={index} style={styles.actionItem}>• {action}</Text>
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

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Common Solutions</Text>
          <Text style={styles.infoItem}>🔧 <Text style={styles.infoLabel}>VPN Issues:</Text> Disable VPN temporarily</Text>
          <Text style={styles.infoItem}>🏢 <Text style={styles.infoLabel}>Corporate Network:</Text> Contact IT about API access</Text>
          <Text style={styles.infoItem}>📱 <Text style={styles.infoLabel}>Mobile:</Text> Try switching wifi/cellular</Text>
          <Text style={styles.infoItem}>🔥 <Text style={styles.infoLabel}>Firewall:</Text> Check security software settings</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.surface,
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
  sectionDescription: {
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
    backgroundColor: colors.disabled,
  },
  testButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  diagnosisSection: {
    backgroundColor: colors.bubbleArchetypal,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  diagnosisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  diagnosisMessage: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  actionItem: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 4,
    marginLeft: 8,
  },
  resultsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
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
  infoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 18,
  },
  infoLabel: {
    fontWeight: '600',
  },
};

export default NetworkTestScreen;
