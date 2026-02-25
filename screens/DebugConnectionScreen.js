import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

const DebugConnectionScreen = ({ navigation }) => {
  const [status, setStatus] = useState('Testing connection...');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    console.log('DEBUG:', message);
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      addLog('Starting connection test...');
      
      // Test 1: Environment variables
      addLog(`Supabase URL: ${process.env.SUPABASE_URL ? 'Set' : 'Missing'}`);
      addLog(`Supabase Key: ${process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing'}`);
      
      // Test 2: Simple auth check
      addLog('Testing auth connection...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`Auth error: ${error.message}`);
        setStatus('Connection failed');
      } else {
        addLog('Auth connection successful');
        setStatus('Connection working');
      }
      
      // Test 3: Database query
      addLog('Testing database connection...');
      const { data: sessions, error: dbError } = await supabase
        .from('sessions')
        .select('count(*)')
        .limit(1);
        
      if (dbError) {
        addLog(`Database error: ${dbError.message}`);
      } else {
        addLog('Database connection successful');
      }
      
    } catch (error) {
      addLog(`Unexpected error: ${error.message}`);
      setStatus('Connection failed');
    }
  };

  const tryLogin = async () => {
    try {
      addLog('Testing login with dummy credentials...');
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'testpassword'
      });
      
      if (error) {
        addLog(`Login test result: ${error.message}`);
      } else {
        addLog('Login test successful');
      }
    } catch (error) {
      addLog(`Login test error: ${error.message}`);
    }
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={{ x: 1.0, y: 0.0 }}
      end={{ x: 0.0, y: 1.0 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Connection Debug
      </Text>
      
      <Text style={{ fontSize: 16, marginBottom: 20, color: status.includes('failed') ? 'red' : 'green' }}>
        Status: {status}
      </Text>
      
      <TouchableOpacity
        style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 8, marginBottom: 20 }}
        onPress={testConnection}
      >
        <Text style={{ color: colors.textInverse, textAlign: 'center', fontWeight: 'bold' }}>
          Retest Connection
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ backgroundColor: '#10b981', padding: 15, borderRadius: 8, marginBottom: 20 }}
        onPress={tryLogin}
      >
        <Text style={{ color: colors.textInverse, textAlign: 'center', fontWeight: 'bold' }}>
          Test Login
        </Text>
      </TouchableOpacity>
      
      <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
        Debug Logs:
      </Text>
      
      <View style={{ backgroundColor: '#000', padding: 10, borderRadius: 5, flex: 1 }}>
        {logs.map((log, index) => (
          <Text key={index} style={{ color: '#00ff00', fontSize: 12, marginBottom: 2 }}>
            {log}
          </Text>
        ))}
      </View>
      
      <TouchableOpacity
        style={{ backgroundColor: '#f59e0b', padding: 15, borderRadius: 8, marginTop: 20 }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: colors.textInverse, textAlign: 'center', fontWeight: 'bold' }}>
          Back to Auth
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ backgroundColor: '#10b981', padding: 15, borderRadius: 8, marginTop: 10 }}
        onPress={() => navigation.navigate('TestApp')}
      >
        <Text style={{ color: colors.textInverse, textAlign: 'center', fontWeight: 'bold' }}>
          Test App (Bypass Auth)
        </Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
    </LinearGradient>
  );
};

export default DebugConnectionScreen;