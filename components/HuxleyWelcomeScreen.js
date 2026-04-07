/**
 * Huxley Welcome Screen
 *
 * Full-screen welcoming animation introducing Huxley before the chat
 * Features sequential fade-in/fade-out text animations
 */

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Rotating description texts
const DESCRIPTION_TEXTS = [
  "I can help you process non-ordinary states of consciousness, like psychedelics or ketamine therapy.",
  "I use Internal Family Systems (IFS), polyvagal theory, and somatic approaches to support your healing.",
  "Whether you're preparing for a journey, integrating an experience, or working through daily challenges...",
  "I'm here to help you develop lasting insights and nervous system regulation.",
];

const HuxleyWelcomeScreen = ({ onComplete }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showTapPrompt, setShowTapPrompt] = useState(false);
  const [canTap, setCanTap] = useState(false);

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const nameFade = useRef(new Animated.Value(0)).current;
  const descriptionFade = useRef(new Animated.Value(0)).current;
  const promptFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate description text sequence
  const animateDescription = (index) => {
    if (index >= DESCRIPTION_TEXTS.length) {
      // All descriptions shown, show tap prompt
      setShowTapPrompt(true);
      setCanTap(true);
      Animated.timing(promptFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Start pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
      return;
    }

    setCurrentTextIndex(index);

    // Fade in
    Animated.timing(descriptionFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      // Hold for reading time (based on text length)
      const readingTime = Math.max(2000, DESCRIPTION_TEXTS[index].length * 35);

      setTimeout(() => {
        // Fade out
        Animated.timing(descriptionFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          // Next description
          setTimeout(() => {
            animateDescription(index + 1);
          }, 300);
        });
      }, readingTime);
    });
  };

  useEffect(() => {
    // Initial animation sequence
    Animated.sequence([
      // Huxley fades in and scales up
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Name fades in
      Animated.delay(300),
      Animated.timing(nameFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start description sequence after a brief pause
      setTimeout(() => {
        animateDescription(0);
      }, 800);
    });
  }, []);

  const handleTap = () => {
    if (!canTap) return;

    // Fade out animation before completing
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nameFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(descriptionFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(promptFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleTap}
      style={styles.touchable}
    >
      <LinearGradient
        colors={gradients.standard}
        start={gradients.standardStart}
        end={gradients.standardEnd}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Huxley Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              {
                opacity: fadeIn,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require('../assets/images/huxley-avatar.png')}
              style={styles.huxleyImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Name */}
          <Animated.View style={{ opacity: nameFade }}>
            <Text style={styles.name}>Hi, I'm Huxley</Text>
          </Animated.View>

          {/* Rotating Description Text */}
          <View style={styles.descriptionContainer}>
            <Animated.View style={{ opacity: descriptionFade }}>
              <Text style={styles.description}>
                {DESCRIPTION_TEXTS[currentTextIndex]}
              </Text>
            </Animated.View>
          </View>

          {/* Tap to continue */}
          {showTapPrompt && (
            <Animated.View
              style={[
                styles.promptContainer,
                {
                  opacity: promptFade,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.tapPrompt}>Tap anywhere to begin</Text>
            </Animated.View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  avatarContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  huxleyImage: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    maxWidth: 240,
    maxHeight: 240,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  descriptionContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 17,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 26,
  },
  promptContainer: {
    position: 'absolute',
    bottom: 80,
  },
  tapPrompt: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HuxleyWelcomeScreen;
