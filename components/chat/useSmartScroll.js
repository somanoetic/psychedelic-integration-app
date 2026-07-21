import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Smart auto-scroll for chat surfaces.
 *
 * Stays put when the user has scrolled up to read history. Only snaps to
 * the bottom when (a) the user is already within 80px of the end, or
 * (b) the keyboard just opened (they're about to type). Sending does NOT
 * force-scroll — callers can still nudge via scrollIfNearBottom() if they
 * want the "snap when at bottom" behavior on send.
 *
 * Mirrors the pattern at HuxleyChatScreen.js:189-227 (the canonical version
 * that landed across the 5 chat files in the recent scroll-bug fix).
 */
export default function useSmartScroll() {
  const scrollViewRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const handleScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const nearBottom = distanceFromBottom < 80;
    isNearBottomRef.current = nearBottom;
    setShowScrollToBottom((prev) => (prev === nearBottom ? !nearBottom : prev));
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (isNearBottomRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const scrollIfNearBottom = useCallback(() => {
    if (isNearBottomRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, []);

  useEffect(() => {
    // Scroll on keyboardDidShow (fires AFTER the show animation + layout have
    // settled) on both platforms — NOT keyboardWillShow. The old will-show +
    // fixed-150ms path fired mid-animation: it scrolled to the content bottom
    // as it was at t=150ms, then the keyboard-avoidance padding kept growing
    // underneath (iOS KAV behavior="padding" ~250ms; Android keyboardPad
    // listener also on didShow), pushing the newest reply back under the
    // keyboard. Waiting for didShow means the ScrollView's final content
    // height (with padding applied) is what scrollToEnd targets.
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      isNearBottomRef.current = true;
      // rAF-style double-tap: scroll once now, then again on the next frame in
      // case the avoidance padding lands a frame after didShow (it's applied
      // via an Animated value / layout pass, not synchronously with the event).
      scrollViewRef.current?.scrollToEnd({ animated: true });
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    });
    return () => sub.remove();
  }, []);

  return {
    scrollViewRef,
    showScrollToBottom,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
    scrollIfNearBottom,
  };
}
