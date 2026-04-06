/**
 * Grid Home Screen
 *
 * Clean tile-based navigation with floating Huxley assistant
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, gradients } from '../theme/colors';
import FloatingHuxleyButton from './FloatingHuxleyButton';
import HuxleyChatModal from './HuxleyChatModal';
import SubMenuModal from './SubMenuModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 16;
const TILE_WIDTH = (SCREEN_WIDTH - 48 - TILE_GAP) / 2; // 48 = 24px padding on each side
const BUTTON_COLOR = colors.primary;

const GridHomeScreen = ({ navigation }) => {
  const [huxleyModalVisible, setHuxleyModalVisible] = useState(false);
  const [trackMenuVisible, setTrackMenuVisible] = useState(false);

  // Track Hub options
  const trackOptions = [
    { id: 'nervous', title: 'Nervous System Check-in', description: 'How is your nervous system right now?', emoji: '💚', route: 'NervousSystemCheckin' },
    { id: 'glimmer', title: 'Glimmer Tracker', description: 'Log a positive moment', emoji: '✨', route: 'GlimmerTracker' },
    { id: 'trigger', title: 'Trigger Tracker', description: 'Log when you were triggered', emoji: '⚡', route: 'TriggerTracker' },
    { id: 'parts', title: 'Parts Check-in', description: 'Check in with your inner parts', emoji: '🎭', route: 'PartsCheckin' },
    { id: 'habits', title: 'Habit Tracker', description: 'Track your daily practices', emoji: '📊', route: 'HabitTracker' },
  ];

  const smallTiles = [
    {
      id: 'track',
      title: 'Track',
      emoji: '💭',
      color: BUTTON_COLOR,
      isSubmenu: true,
      onPress: () => setTrackMenuVisible(true),
    },
    {
      id: 'journal',
      title: 'Journal',
      emoji: '📝',
      color: BUTTON_COLOR,
      route: 'DailyJournal',
    },
    {
      id: 'learn',
      title: 'Learn',
      emoji: '📚',
      color: BUTTON_COLOR,
      route: 'Learn',
    },
    {
      id: 'sessions',
      title: 'Sessions',
      emoji: '📋',
      color: BUTTON_COLOR,
      route: 'History',
    },
  ];

  const largeTiles = [
    {
      id: 'prepare',
      title: 'Prepare for a Journey',
      emoji: '🧭',
      color: BUTTON_COLOR,
      route: 'SessionPreparation',
    },
    {
      id: 'process',
      title: 'Process and Integrate',
      emoji: '🧩',
      color: BUTTON_COLOR,
      route: 'ProcessIntegrate',
    },
    {
      id: 'innerwork',
      title: 'Inner Work',
      emoji: '🔍',
      color: BUTTON_COLOR,
      route: 'InnerWork',
    },
    {
      id: 'practice',
      title: 'Practice',
      emoji: '🎮',
      color: BUTTON_COLOR,
      route: 'Practice',
    },
  ];

  const handleTilePress = (tile) => {
    if (tile.isSubmenu && tile.onPress) {
      tile.onPress();
    } else if (tile.route) {
      navigation.navigate(tile.route);
    }
  };

  const handleHuxleyPress = () => {
    setHuxleyModalVisible(true);
  };

  const handleSubMenuSelect = (route, params) => {
    navigation.navigate(route, params);
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with chat and SOS buttons */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('HuxleyChat')}
          >
            <MaterialIcons name="chat-bubble" size={28} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="settings" size={26} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, styles.sosButton]}
            onPress={() => navigation.navigate('TriggeredSupport')}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Small Tiles Grid (2x2) */}
        <View style={styles.smallTilesContainer}>
          {smallTiles.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.smallTile, { backgroundColor: tile.color }]}
              onPress={() => handleTilePress(tile)}
              activeOpacity={0.8}
            >
              <Text style={styles.tileEmoji}>{tile.emoji}</Text>
              <Text style={styles.smallTileTitle}>{tile.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Large Tiles */}
        <View style={styles.largeTilesContainer}>
          {largeTiles.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.largeTile, { backgroundColor: tile.color }]}
              onPress={() => handleTilePress(tile)}
              activeOpacity={0.8}
            >
              <Text style={styles.largeTileEmoji}>{tile.emoji}</Text>
              <Text style={styles.largeTileTitle}>{tile.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing for floating button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Huxley Button */}
      <FloatingHuxleyButton onPress={handleHuxleyPress} />

      {/* Huxley Chat Modal */}
      <HuxleyChatModal
        visible={huxleyModalVisible}
        onClose={() => setHuxleyModalVisible(false)}
        onNavigate={handleSubMenuSelect}
        navigation={navigation}
      />

      {/* Track SubMenu */}
      <SubMenuModal
        visible={trackMenuVisible}
        onClose={() => setTrackMenuVisible(false)}
        title="Track"
        options={trackOptions}
        onSelect={handleSubMenuSelect}
      />

      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    backgroundColor: '#E57373',
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  debugScreenName: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    fontFamily: 'monospace',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  smallTilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  smallTile: {
    width: TILE_WIDTH,
    aspectRatio: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: TILE_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tileEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  smallTileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  largeTilesContainer: {
    marginBottom: 16,
  },
  largeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginBottom: TILE_GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeTileEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  largeTileTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default GridHomeScreen;
