/**
 * Huxley Chat Modal
 *
 * Pop-up chat interface with Huxley that can route to features.
 * Conversation surface delegated to <ChatConversation> — this file owns
 * the modal shell (backdrop, slide-up animation, header, quick actions).
 */

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { icons } from '../lib/uiIcons';
import conversationalRoutingService from '../lib/conversationalRoutingService';
import { ChatConversation } from './chat';

const HuxleyChatModal = ({ visible, onClose, onNavigate, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Need help finding something? I can guide you to the right tool, or tap the chat button for a deeper conversation.",
        },
      ]);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await conversationalRoutingService.routeMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          suggestedRoute: response.route,
          routeLabel: response.routeLabel,
        },
      ]);
    } catch (error) {
      console.error('Huxley chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Would you like to explore the app yourself, or try again in a moment?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoutePress = (route) => {
    onClose();
    setTimeout(() => {
      if (route === 'Education') {
        navigation.navigate('Education');
      } else {
        navigation.navigate(route);
      }
    }, 300);
  };

  const quickActions = [
    { label: "I'm triggered", route: 'TriggeredSupport', emoji: '🆘', icon: icons.trigger2 },
    { label: 'Journal', route: 'Journal', emoji: '📝', icon: icons.journal },
    { label: 'Full Chat', route: 'HuxleyChat', emoji: '💬', icon: icons.chat },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={require('../assets/images/huxley-avatar.png')}
          style={styles.huxleyAvatar}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Quick Help</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <X size={24} color={colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {quickActions.map((action) => (
        <TouchableOpacity
          key={action.route}
          style={styles.quickActionButton}
          onPress={() => handleRoutePress(action.route)}
        >
          {action.icon ? (
            <Image source={action.icon} style={styles.quickActionIconImage} />
          ) : (
            <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
          )}
          <Text style={styles.quickActionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Inline route-button below an assistant message that suggests navigation.
  const renderRouteButton = (message) => {
    if (!message.suggestedRoute) return null;
    return (
      <TouchableOpacity
        style={styles.routeButton}
        onPress={() => handleRoutePress(message.suggestedRoute)}
      >
        <Text style={styles.routeButtonText}>
          Go to {message.routeLabel || message.suggestedRoute} →
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ChatConversation
            messages={messages}
            isTyping={isLoading}
            onSend={handleSend}
            inputText={inputText}
            onInputTextChange={setInputText}
            inputPlaceholder="Ask Huxley anything..."
            inputDisabled={isLoading}
            header={renderHeader()}
            belowMessages={renderQuickActions()}
            renderMessageExtras={renderRouteButton}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  huxleyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  routeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  routeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionIconImage: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default HuxleyChatModal;
