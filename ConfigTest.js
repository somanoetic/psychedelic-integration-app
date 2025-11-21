/**
 * Simple test to verify config is loading properly
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import config from './lib/config';

const ConfigTest = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Config Test</Text>

      <Text style={styles.label}>Supabase URL:</Text>
      <Text style={styles.value}>{config.supabaseUrl || 'MISSING'}</Text>

      <Text style={styles.label}>Supabase Anon Key:</Text>
      <Text style={styles.value}>{config.supabaseAnonKey ? 'LOADED (hidden)' : 'MISSING'}</Text>

      <Text style={styles.label}>Anthropic API Key:</Text>
      <Text style={styles.value}>{config.anthropicApiKey ? 'LOADED (hidden)' : 'MISSING'}</Text>

      <Text style={styles.success}>
        ✅ Config module loaded successfully!
      </Text>
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
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  success: {
    fontSize: 18,
    color: 'green',
    marginTop: 30,
    fontWeight: 'bold',
  },
});

export default ConfigTest;
