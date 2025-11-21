import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import config from './lib/config';

const ANTHROPIC_API_KEY = config.anthropicApiKey;

const NetworkTestScreen = () => {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, status, details) => {
    setTestResults(prev => [...prev, { test, status, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runNetworkTests = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: Basic internet connectivity
    try {
      const response = await fetch('https://httpbin.org/get', { 
        method: 'GET',
        timeout: 10000 
      });
      if (response.ok) {
        addResult('Basic Internet', '✅ PASS', 'Connected to httpbin.org');
      } else {
        addResult('Basic Internet', '❌ FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      addResult('Basic Internet', '❌ FAIL', error.message);
    }

    // Test 2: HTTPS connectivity
    try {
      const response = await fetch('https://api.github.com', { 
        method: 'GET',
        timeout: 10000 
      });
      if (response.ok) {
        addResult('HTTPS APIs', '✅ PASS', 'GitHub API accessible');
      } else {
        addResult('HTTPS APIs', '❌ FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      addResult('HTTPS APIs', '❌ FAIL', error.message);
    }

    // Test 3: Anthropic API domain resolution
    try {
      const response = await fetch('https://api.anthropic.com', { 
        method: 'GET',
        timeout: 15000 
      });
      addResult('Anthropic Domain', '✅ PASS', `Domain reachable (Status: ${response.status})`);
    } catch (error) {
      addResult('Anthropic Domain', '❌ FAIL', error.message);
    }

    // Test 4: Anthropic API with authentication
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }]
        }),
        timeout: 20000
      });
      
      if (response.ok) {
        addResult('Anthropic API', '✅ PASS', 'API call successful');
      } else {
        const errorText = await response.text();
        addResult('Anthropic API', '❌ FAIL', `Status: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      addResult('Anthropic API', '❌ FAIL', error.message);
    }

    // Test 5: Environment variables
    if (ANTHROPIC_API_KEY) {
      addResult('API Key', '✅ PASS', `Key loaded (${ANTHROPIC_API_KEY.substring(0, 8)}...)`);
    } else {
      addResult('API Key', '❌ FAIL', 'ANTHROPIC_API_KEY not found');
    }

    setTesting(false);
  };

  const getNetworkAdvice = () => {
    const failures = testResults.filter(r => r.status.includes('FAIL'));
    
    if (failures.length === 0) {
      return "✅ All tests passed! Your network should work with the Anthropic API.";
    }

    let advice = "🔧 Network Issues Detected:\n\n";
    
    if (failures.some(f => f.test === 'Basic Internet')) {
      advice += "• Check your internet connection\n";
      advice += "• Try restarting your router/modem\n";
    }
    
    if (failures.some(f => f.test === 'Anthropic Domain' || f.test === 'Anthropic API')) {
      advice += "• Your network is blocking Anthropic's API\n";
      advice += "• Try disconnecting from VPN\n";
      advice += "• Check corporate firewall settings\n";
      advice += "• Try using mobile hotspot temporarily\n";
      advice += "• Contact your IT department about api.anthropic.com access\n";
    }
    
    if (failures.some(f => f.test === 'API Key')) {
      advice += "• Check your .env file configuration\n";
      advice += "• Restart the Expo development server\n";
    }

    return advice;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network Connectivity Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={runNetworkTests}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Running Tests...' : 'Run Network Tests'}
        </Text>
      </TouchableOpacity>

      {testResults.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultTest}>{result.test}: {result.status}</Text>
              <Text style={styles.resultDetails}>{result.details}</Text>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
          ))}
        </View>
      )}

      {testResults.length > 0 && (
        <View style={styles.advice}>
          <Text style={styles.adviceTitle}>Recommendations:</Text>
          <Text style={styles.adviceText}>{getNetworkAdvice()}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Common Solutions:</Text>
        <Text style={styles.infoText}>
          1. Disconnect from VPN temporarily{'\n'}
          2. Try using mobile hotspot{'\n'}
          3. Contact IT about api.anthropic.com access{'\n'}
          4. Check if Expo is running on correct network{'\n'}
          5. Restart Expo development server
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  advice: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adviceText: {
    fontSize: 14,
    lineHeight: 20,
  },
  info: {
    backgroundColor: '#d1ecf1',
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NetworkTestScreen;