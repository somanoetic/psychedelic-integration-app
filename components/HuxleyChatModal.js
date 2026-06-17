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
  Dimensions,
  Image,
  Keyboard,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // This is a Modal, which on Android renders in its own window that does NOT
  // participate in the host activity's adjustResize. So the inner
  // ChatConversation's "pad the content and let the window shrink" strategy
  // has nothing to push against — the keyboard just overlaps the bottom-anchored
  // sheet. We lift the whole sheet ourselves and tell ChatConversation to stand
  // down (disableKeyboardAvoiding).
  //
  // We measure the keyboard's ACTUAL on-screen occupancy as
  // (screenHeight - endCoordinates.screenY) rather than endCoordinates.height.
  // height includes/excludes the soft-nav inset inconsistently across devices;
  // the screenY top edge is exact, so this sidesteps the inset question and
  // lands the sheet flush on the keyboard.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => {
      const end = e?.endCoordinates;
      if (!end) return;
      const screenH = Dimensions.get('screen').height;
      const occupied = Math.max(screenH - end.screenY, 0);
      setKeyboardHeight(occupied);
    };
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    // Navigate FIRST, then close. Closing first dismisses the modal to reveal
    // whatever's underneath (usually Home, since the FAB is global) for the
    // duration of the timeout — a visible flash — before the nav lands.
    navigation.navigate(route === 'Education' ? 'Education' : route);
    onClose();
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

  // keyboardHeight is already the exact on-screen occupancy (measured from the
  // keyboard's top edge), so lift the sheet by it directly — no inset math.
  const keyboardOffset = keyboardHeight;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Keyboard handling for a Modal: unlike the SafeAreaView screens, a
          Modal renders in its own window and does NOT participate in the host
          activity's adjustResize, so neither a wrapping KeyboardAvoidingView
          (double-adjusts) nor ChatConversation's pad-the-content strategy works
          here. Instead we own it: ChatConversation stands down
          (disableKeyboardAvoiding) and we lift the sheet by padding the
          CONTAINER by the keyboard height. Padding the container (not the
          sheet) shrinks the available region, so the sheet's percentage
          maxHeight stays correct and can't overflow the top of the screen.
          See memory project-chat-keyboard-gap-android. */}
      <View style={[styles.modalContainer, { paddingBottom: keyboardOffset }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              paddingBottom: keyboardHeight > 0 ? 0 : Math.max(insets.bottom, 12),
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
            disableKeyboardAvoiding
            header={renderHeader()}
            belowMessages={renderQuickActions()}
            renderMessageExtras={renderRouteButton}
          />
        </Animated.View>
      </View>
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
