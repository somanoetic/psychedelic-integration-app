import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_OPTIONS } from './AvatarSelector';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const ConversationalJournalEntry = ({ navigation }) => {
  const [selectedAvatar, setSelectedAvatar] = useState('brain');
  const [conversationStep, setConversationStep] = useState('initial'); // initial, prompt_choice, free_write, prompted_write, save_confirm
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadPreferences();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPreferences = async () => {
    try {
      const avatar = await AsyncStorage.getItem('huxley_avatar');
      if (avatar) setSelectedAvatar(avatar);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const getAvatar = () => {
    return AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
  };

  const avatar = getAvatar();

  const journalPrompts = [
    {
      id: 'feeling',
      title: 'How am I feeling?',
      icon: 'mood',
      color: '#ec4899',
      prompt: "What am I feeling right now? What sensations do I notice in my body?",
    },
    {
      id: 'gratitude',
      title: 'What am I grateful for?',
      icon: 'favorite',
      color: '#10b981',
      prompt: "What am I grateful for today? Even small things count.",
    },
    {
      id: 'insight',
      title: 'What did I learn?',
      icon: 'lightbulb',
      color: '#f59e0b',
      prompt: "What insight or realization came to me recently?",
    },
    {
      id: 'challenge',
      title: 'What\'s challenging me?',
      icon: 'trending-up',
      color: '#3b82f6',
      prompt: "What's feeling difficult right now? What support do I need?",
    },
    {
      id: 'parts',
      title: 'What are my parts saying?',
      icon: 'psychology',
      color: '#8b5cf6',
      prompt: "What are the different parts of me saying or feeling right now?",
    },
    {
      id: 'integration',
      title: 'Integration reflection',
      icon: 'auto-awesome',
      color: '#06b6d4',
      prompt: "What am I integrating from my recent experiences? How has it changed me?",
    }
  ];

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const saveJournal = async () => {
    if (isSaving || !journalText.trim()) return;

    try {
      setIsSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showAlert('Authentication Error', 'Please log in again');
        return;
      }

      const journalEntry = {
        user_id: user.id,
        entry_type: selectedPrompt ? 'prompted' : 'free_write',
        prompt_id: selectedPrompt?.id || null,
        prompt_text: selectedPrompt?.prompt || null,
        entry_text: journalText,
        created_at: new Date().toISOString(),
      };

      // TODO: Replace with actual journal table when created
      // For now, we'll save to AsyncStorage as a fallback
      const existingEntries = await AsyncStorage.getItem('journal_entries');
      const entries = existingEntries ? JSON.parse(existingEntries) : [];
      entries.push(journalEntry);
      await AsyncStorage.setItem('journal_entries', JSON.stringify(entries));

      setConversationStep('save_confirm');
      setJournalText('');
      setSelectedPrompt(null);

    } catch (error) {
      console.error('Error saving journal:', error);
      showAlert('Error', 'Failed to save journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  const renderHuxleyMessage = (message) => (
    <View style={styles.huxleyBubble}>
      <View style={styles.huxleyHeader}>
        <View style={[styles.huxleyAvatarSmall, { backgroundColor: `${avatar.color}20` }]}>
          <MaterialIcons name={avatar.icon} size={24} color={avatar.color} />
        </View>
        <Text style={styles.huxleyName}>{avatar.name}</Text>
      </View>
      <Text style={styles.huxleyText}>{message}</Text>
    </View>
  );

  const renderUserOption = (text, onPress, icon, color = colors.primary) => (
    <TouchableOpacity
      style={[styles.responseBubble, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon} size={20} color="#ffffff" style={styles.responseIcon} />
      <Text style={styles.responseText}>{text}</Text>
      <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
    </TouchableOpacity>
  );

  const renderInitialStep = () => (
    <>
      {renderHuxleyMessage(
        "Writing can be a powerful way to process your thoughts and feelings. Would you like a prompt to guide you, or would you prefer to free-write whatever's on your mind?"
      )}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Give me a prompt', () => setConversationStep('prompt_choice'), 'help', '#10b981')}
        {renderUserOption('I\'ll free-write', () => setConversationStep('free_write'), 'edit', '#3b82f6')}
        {renderUserOption('Go back', () => navigation.goBack(), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  const renderPromptChoice = () => (
    <>
      {renderHuxleyMessage(
        "Here are some prompts that might resonate with you. Choose one that feels right, or go back to free-write instead."
      )}

      <View style={styles.promptsContainer}>
        {journalPrompts.map((prompt) => (
          <TouchableOpacity
            key={prompt.id}
            style={[styles.promptCard, { borderLeftColor: prompt.color }]}
            onPress={() => {
              setSelectedPrompt(prompt);
              setConversationStep('prompted_write');
            }}
          >
            <View style={[styles.promptIcon, { backgroundColor: `${prompt.color}20` }]}>
              <MaterialIcons name={prompt.icon} size={28} color={prompt.color} />
            </View>
            <View style={styles.promptContent}>
              <Text style={styles.promptTitle}>{prompt.title}</Text>
              <Text style={styles.promptPreview}>{prompt.prompt}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Free-write instead', () => setConversationStep('free_write'), 'edit', '#3b82f6')}
        {renderUserOption('Go back', () => setConversationStep('initial'), 'arrow-back', '#6b7280')}
      </View>
    </>
  );

  const renderFreeWrite = () => (
    <>
      {renderHuxleyMessage(
        "This is your space. Write whatever comes to mind. There's no right or wrong here. Just let it flow."
      )}

      <View style={styles.writeContainer}>
        <TextInput
          style={styles.journalInput}
          value={journalText}
          onChangeText={setJournalText}
          placeholder="Start writing..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.wordCount}>{journalText.split(/\s+/).filter(w => w.length > 0).length} words</Text>
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {journalText.trim().length > 0 && renderUserOption(
          isSaving ? 'Saving...' : 'Save this entry',
          saveJournal,
          'save',
          '#10b981'
        )}
        {renderUserOption('Use a prompt instead', () => setConversationStep('prompt_choice'), 'help', '#f59e0b')}
        {renderUserOption('Discard and go back', () => {
          setJournalText('');
          setConversationStep('initial');
        }, 'delete', '#6b7280')}
      </View>
    </>
  );

  const renderPromptedWrite = () => {
    if (!selectedPrompt) return null;

    return (
      <>
        {renderHuxleyMessage(selectedPrompt.prompt)}

        <View style={styles.writeContainer}>
          <View style={[styles.promptBadge, { backgroundColor: `${selectedPrompt.color}20` }]}>
            <MaterialIcons name={selectedPrompt.icon} size={16} color={selectedPrompt.color} />
            <Text style={[styles.promptBadgeText, { color: selectedPrompt.color }]}>
              {selectedPrompt.title}
            </Text>
          </View>

          <TextInput
            style={styles.journalInput}
            value={journalText}
            onChangeText={setJournalText}
            placeholder="Write your thoughts..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.wordCount}>{journalText.split(/\s+/).filter(w => w.length > 0).length} words</Text>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>You:</Text>
          {journalText.trim().length > 0 && renderUserOption(
            isSaving ? 'Saving...' : 'Save this entry',
            saveJournal,
            'save',
            '#10b981'
          )}
          {renderUserOption('Choose different prompt', () => {
            setSelectedPrompt(null);
            setConversationStep('prompt_choice');
          }, 'refresh', '#3b82f6')}
          {renderUserOption('Discard and go back', () => {
            setJournalText('');
            setSelectedPrompt(null);
            setConversationStep('initial');
          }, 'delete', '#6b7280')}
        </View>
      </>
    );
  };

  const renderSaveConfirm = () => (
    <>
      {renderHuxleyMessage(
        "Your journal entry has been saved. Thank you for taking time to write. Reflection is an important part of the integration process."
      )}

      <View style={styles.confirmCard}>
        <MaterialIcons name="check-circle" size={48} color="#10b981" />
        <Text style={styles.confirmText}>Entry saved successfully</Text>
        <Text style={styles.confirmSubtext}>
          You can review your entries anytime from your profile
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>You:</Text>
        {renderUserOption('Write another entry', () => {
          setJournalText('');
          setSelectedPrompt(null);
          setConversationStep('initial');
        }, 'add', '#10b981')}
        {renderUserOption('Go back home', () => navigation.goBack(), 'home', '#6b7280')}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.appName}>Journal</Text>
        <MaterialIcons name="edit-note" size={24} color="#1f2937" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {conversationStep === 'initial' && renderInitialStep()}
            {conversationStep === 'prompt_choice' && renderPromptChoice()}
            {conversationStep === 'free_write' && renderFreeWrite()}
            {conversationStep === 'prompted_write' && renderPromptedWrite()}
            {conversationStep === 'save_confirm' && renderSaveConfirm()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  huxleyBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  huxleyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  huxleyAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  huxleyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  huxleyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    marginLeft: 4,
  },
  responseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderTopRightRadius: 4,
    marginBottom: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  responseIcon: {
    marginRight: 12,
  },
  responseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  promptsContainer: {
    marginBottom: 24,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  promptIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  promptContent: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  promptPreview: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  writeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  promptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  promptBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  journalInput: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  wordCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  confirmCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ConversationalJournalEntry;
