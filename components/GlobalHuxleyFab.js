/**
 * Global Huxley FAB
 *
 * A single floating launcher mounted once over the whole navigator (see
 * App.js), replacing the old per-screen FloatingHuxleyButton and the bottom
 * tab bar's quick access. Tapping fans out a radial menu of four actions:
 *
 *   Home  · Huxley · Journal · Track
 *
 * It can be tucked away: drag it to the right edge and it collapses to a thin
 * peeking tab; tap the tab to pop it back out. Navigation is done through the
 * NavigationContainer ref (the overlay lives outside any screen, so it has no
 * navigation prop of its own).
 *
 * Owns the Huxley chat modal so it's reachable anywhere the FAB is visible;
 * Journal/Track/Home navigate to their screens.
 */

import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home as HomeIcon, Pencil, Compass, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import HuxleyChatModal from './HuxleyChatModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FAB_SIZE = 76;
const ACTION_SIZE = 52;
const ACTION_GAP = 14;       // spacing between stacked actions
const EDGE_PEEK = 14;        // how much of the tab pokes out when tucked
const DRAG_HIDE_THRESHOLD = 60; // px of rightward drag to trigger tuck

const GlobalHuxleyFab = ({ navigationRef }) => {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [huxleyVisible, setHuxleyVisible] = useState(false);

  // Radial fan animation (0 = collapsed, 1 = fanned out).
  const fan = useRef(new Animated.Value(0)).current;
  // Horizontal tuck offset: 0 = resting, positive = slid toward the edge.
  const tuckX = useRef(new Animated.Value(0)).current;

  const navigate = (route, params) => {
    if (navigationRef?.isReady()) navigationRef.navigate(route, params);
  };

  const animateFan = (toValue) =>
    Animated.spring(fan, { toValue, useNativeDriver: true, tension: 60, friction: 8 }).start();

  const collapse = () => {
    animateFan(0);
    setExpanded(false);
  };

  const toggleExpanded = () => {
    if (expanded) {
      collapse();
    } else {
      setExpanded(true);
      animateFan(1);
    }
  };

  const tuckAway = () => {
    collapse();
    Animated.spring(tuckX, {
      toValue: FAB_SIZE - EDGE_PEEK,
      useNativeDriver: true,
      tension: 50,
      friction: 9,
    }).start(() => setHidden(true));
  };

  const popOut = () => {
    setHidden(false);
    Animated.spring(tuckX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 9,
    }).start();
  };

  // Drag-to-edge: only meaningful while not tucked. A rightward drag past the
  // threshold tucks the FAB; otherwise it springs back.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_evt, g) => {
        if (g.dx > 0) tuckX.setValue(g.dx);
      },
      onPanResponderRelease: (_evt, g) => {
        if (g.dx > DRAG_HIDE_THRESHOLD) {
          tuckAway();
        } else {
          Animated.spring(tuckX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const runAction = (fn) => {
    collapse();
    fn();
  };

  // Radial actions, nearest-to-FAB first. They stack vertically above the FAB.
  // The Huxley action mirrors the main FAB: its avatar spills out the top of
  // the circle (buttonStyle adds overflow:'visible'), so it doesn't get clipped
  // inside the smaller action circle like the lucide-icon actions do.
  const actions = [
    { key: 'huxley', label: 'Huxley', buttonStyle: styles.actionButtonSpill, render: <Image source={require('../assets/images/huxley-avatar.png')} style={styles.huxleyAvatar} resizeMode="contain" />, onPress: () => setHuxleyVisible(true) },
    { key: 'journal', label: 'Journal', render: <Pencil size={24} color={colors.primary} strokeWidth={2} />, onPress: () => navigate('Journal') },
    { key: 'track', label: 'Track', render: <Compass size={24} color={colors.primary} strokeWidth={2} />, onPress: () => navigate('TrackHub') },
    { key: 'home', label: 'Home', render: <HomeIcon size={24} color={colors.primary} strokeWidth={2} />, onPress: () => navigate('Home') },
  ];

  return (
    <>
      {/* Backdrop closes the fan when tapped (only while expanded). */}
      {expanded && (
        <Pressable style={styles.backdrop} onPress={collapse} />
      )}

      <Animated.View
        style={[
          styles.root,
          // Lift above the device's bottom safe-area / gesture bar so the
          // circle isn't clipped on gesture-nav devices.
          { bottom: insets.bottom + 24, transform: [{ translateX: tuckX }] },
        ]}
        pointerEvents="box-none"
      >
        {/* Tucked tab: tap to pop back out. */}
        {hidden ? (
          <TouchableOpacity style={styles.tuckTab} onPress={popOut} activeOpacity={0.85}>
            <Image
              source={require('../assets/images/huxley-avatar.png')}
              style={styles.tuckTabImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.stack} pointerEvents="box-none">
            {/* Radial actions. Each is laid out at its FINAL resting position
                (static `bottom`) so its touch target matches where it's drawn —
                animating via transform alone leaves the hit box down at the FAB
                on Android, so taps fall through to the backdrop. We only animate
                opacity + a small pop-up translate for feel. */}
            {actions.map((action, i) => {
              const restBottom = FAB_SIZE / 2 + ACTION_SIZE / 2 + ACTION_GAP + i * (ACTION_SIZE + ACTION_GAP);
              return (
                <Animated.View
                  key={action.key}
                  pointerEvents={expanded ? 'auto' : 'none'}
                  style={[
                    styles.action,
                    { bottom: restBottom },
                    {
                      opacity: fan,
                      transform: [
                        { translateY: fan.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                        { scale: fan.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <TouchableOpacity
                    style={[styles.actionButton, action.buttonStyle]}
                    activeOpacity={0.85}
                    onPress={() => runAction(action.onPress)}
                  >
                    {action.render}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            {/* Main FAB (draggable). Long-press is the explicit tuck affordance. */}
            <Animated.View {...panResponder.panHandlers}>
              <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.9}
                onPress={toggleExpanded}
                onLongPress={tuckAway}
              >
                {expanded ? (
                  <X size={26} color={colors.primary} strokeWidth={2.5} />
                ) : (
                  <Image
                    source={require('../assets/images/huxley-avatar.png')}
                    style={styles.fabImage}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </Animated.View>

      {/* Huxley chat modal — navigation shim forwards to the container ref.
          Track now navigates to the TrackHub screen (no submenu modal). */}
      <HuxleyChatModal
        visible={huxleyVisible}
        onClose={() => setHuxleyVisible(false)}
        onNavigate={navigate}
        navigation={{ navigate }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  root: {
    position: 'absolute',
    right: 20,
    // `bottom` is set dynamically from the safe-area inset (see render).
    zIndex: 1000,
  },
  stack: {
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    // Let Huxley spill out the top of the circle (matches the old FAB look).
    overflow: 'visible',
  },
  fabImage: {
    width: FAB_SIZE + 30,
    height: FAB_SIZE + 30,
    marginBottom: 10,
  },
  action: {
    position: 'absolute',
    // `bottom` is set dynamically per index (see render). Center the action
    // circle horizontally under the (wider) FAB.
    right: (FAB_SIZE - ACTION_SIZE) / 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    position: 'absolute',
    right: ACTION_SIZE + 10,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'hidden',
  },
  // Huxley action: let the avatar spill out the top of its circle, mirroring
  // the main FAB (so it isn't clipped inside the smaller action circle).
  actionButtonSpill: {
    overflow: 'visible',
  },
  huxleyAvatar: {
    width: ACTION_SIZE + 20,
    height: ACTION_SIZE + 20,
    marginBottom: 8,
  },
  // Tucked-away peeking tab
  tuckTab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    opacity: 0.92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'hidden',
  },
  tuckTabImage: {
    width: FAB_SIZE + 30,
    height: FAB_SIZE + 30,
    marginBottom: 6,
  },
});

export default GlobalHuxleyFab;
