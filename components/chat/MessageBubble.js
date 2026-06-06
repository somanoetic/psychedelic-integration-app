import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import FormattedText from '../FormattedText';
import { colors } from '../../theme/colors';
import { icons } from '../../lib/uiIcons';
import TypewriterText from './TypewriterText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HUXLEY_AVATAR = require('../../assets/images/huxley-avatar.png');

const resolveBulletIcon = (icon) => {
  if (!icon) return null;
  if (typeof icon === 'string') return icons[icon] || null;
  return icon;
};

const MessageBullets = ({ bullets }) => (
  <View style={styles.bulletList}>
    {bullets.map((bullet, i) => {
      const source = resolveBulletIcon(bullet.icon);
      return (
        <View key={i} style={styles.bulletRow}>
          {source ? (
            <Image source={source} style={styles.bulletIcon} resizeMode="contain" />
          ) : (
            <View style={styles.bulletIconPlaceholder} />
          )}
          <View style={styles.bulletText}>
            <Text style={styles.bulletLabel}>{bullet.label}</Text>
            {bullet.description ? (
              <Text style={styles.bulletDescription}>{bullet.description}</Text>
            ) : null}
          </View>
        </View>
      );
    })}
  </View>
);

// Strip markdown so the typewriter effect doesn't reveal raw ** and # chars.
// FormattedText handles the non-typewriter render path on its own.
const cleanMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s/gm, '');
};

/**
 * Single message row — assistant (Huxley avatar + cream bubble, left)
 * or user (blue bubble, right).
 *
 * `extras` is rendered inside the bubble below the text. That's where
 * inline chips live (theme/entity chips in TherapeuticIntegration, the
 * network-test button when ExperienceMapping hits an error, suggested-
 * route buttons in HuxleyChatModal, etc.).
 */
const MessageBubble = ({
  message,
  isLastMessage,
  typewriter,
  showHuxleyAvatar = true,
  onTypewriterComplete,
  extras,
}) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.messageContainer}>
        <View style={styles.userRow}>
          <View style={[styles.messageBubble, styles.userBubble]}>
            <Text style={[styles.messageText, styles.userText]}>
              {message.content}
            </Text>
            {extras ? <View style={styles.extrasContainer}>{extras}</View> : null}
          </View>
        </View>
      </View>
    );
  }

  const useTypewriter = typewriter && message.isTyping;

  return (
    <View style={styles.messageContainer}>
      <View style={styles.huxleyRow}>
        {showHuxleyAvatar && (
          <Image
            source={HUXLEY_AVATAR}
            style={styles.huxleyAvatar}
            resizeMode="contain"
          />
        )}
        <View style={styles.messageBubble}>
          {useTypewriter ? (
            <TypewriterText
              text={cleanMarkdown(message.content)}
              speed={15}
              style={styles.messageText}
              onComplete={onTypewriterComplete}
            />
          ) : (
            <FormattedText style={styles.messageText}>
              {message.content}
            </FormattedText>
          )}
          {message.bullets && message.bullets.length > 0 ? (
            <MessageBullets bullets={message.bullets} />
          ) : null}
          {message.contentAfter ? (
            <FormattedText style={[styles.messageText, styles.contentAfter]}>
              {message.contentAfter}
            </FormattedText>
          ) : null}
          {extras ? <View style={styles.extrasContainer}>{extras}</View> : null}
        </View>
      </View>
    </View>
  );
};

export const ThinkingBubble = ({ showHuxleyAvatar = true }) => (
  <View style={styles.messageContainer}>
    <View style={styles.huxleyRow}>
      {showHuxleyAvatar && (
        <Image
          source={HUXLEY_AVATAR}
          style={styles.huxleyAvatar}
          resizeMode="contain"
        />
      )}
      <View style={[styles.messageBubble, styles.thinkingBubble]}>
        <Text style={styles.thinkingText}>thinking...</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 20,
  },
  huxleyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  huxleyAvatar: {
    width: 96,
    height: 96,
    marginRight: 12,
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageBubble: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    flex: 0,
    maxWidth: SCREEN_WIDTH * 0.75,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 4,
  },
  thinkingBubble: {
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
  },
  userText: {
    color: '#fff',
  },
  thinkingText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  extrasContainer: {
    marginTop: 10,
  },
  bulletList: {
    marginTop: 12,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletIcon: {
    width: 32,
    height: 32,
    marginTop: 2,
  },
  bulletIconPlaceholder: {
    width: 32,
    height: 32,
  },
  bulletText: {
    flex: 1,
  },
  bulletLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  bulletDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  contentAfter: {
    marginTop: 14,
  },
});

export default MessageBubble;
