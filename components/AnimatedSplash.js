import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Image, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const AnimatedSplash = ({ onAnimationFinish }) => {
  const animationRef = useRef(null);
  const [error, setError] = useState(null);
  const [showStaticImage, setShowStaticImage] = useState(false);
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Auto-play animation when component mounts
    if (animationRef.current) {
      animationRef.current.play();
    }

    // Fallback timeout in case animation doesn't load (extended to include static image time)
    const timeout = setTimeout(() => {
      console.log('Splash timeout - moving to app');
      onAnimationFinish();
    }, 10000); // Total 10 seconds max

    return () => clearTimeout(timeout);
  }, []);

  const handleLottieFinish = () => {
    console.log('Lottie animation finished - showing static image');
    setShowStaticImage(true);

    // Fade in the static image smoothly
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300, // 300ms fade in
      useNativeDriver: true,
    }).start();

    // Show static image for 3-4 seconds, then move to login
    setTimeout(() => {
      console.log('Static image timeout - moving to app');
      onAnimationFinish();
    }, 3500); // 3.5 seconds
  };

  // If there's an error loading the animation, show fallback
  if (error) {
    useEffect(() => {
      const timeout = setTimeout(onAnimationFinish, 1500);
      return () => clearTimeout(timeout);
    }, []);

    return (
      <View style={styles.container}>
        <Text style={styles.fallbackText}>Psycheteleos</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('../design/splash3-canva.json')}
        autoPlay
        loop={false}
        style={styles.animation}
        onAnimationFinish={handleLottieFinish}
        onAnimationFailure={(error) => {
          console.error('Lottie animation error:', error);
          setError(error);
        }}
        resizeMode="cover"
      />
      {showStaticImage && (
        <Animated.Image
          source={require('../design/splash3-canva-static.png')}
          style={[styles.staticImage, { opacity: imageOpacity }]}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8', // Warm cream background
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  staticImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#D4725C', // Terra cotta
    letterSpacing: 2,
  },
});

export default AnimatedSplash;
