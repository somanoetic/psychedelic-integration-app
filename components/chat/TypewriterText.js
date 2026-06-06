import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

/**
 * Character-by-character text reveal.
 *
 * Lifted from the typewriter effect in HuxleyChatScreen. Opt-in via the
 * `typewriter` prop on ChatConversation — most surfaces leave it off so
 * clinical responses render instantly.
 */
const TypewriterText = ({ text, onComplete, speed = 30, style }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <Text style={style}>
      {displayedText}
      {!isComplete && <Text style={styles.cursor}>|</Text>}
    </Text>
  );
};

const styles = StyleSheet.create({
  cursor: {
    color: colors.textSecondary,
    fontWeight: '300',
  },
});

export default TypewriterText;
