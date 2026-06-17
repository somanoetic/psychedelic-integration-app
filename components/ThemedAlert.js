import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert as RNAlert,
} from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

/**
 * Themed alert system for Huxley.
 *
 * Two ways to use:
 *
 * 1. GLOBAL OVERRIDE (recommended):
 *    - Mount <ThemedAlertHost /> once near the root of the app.
 *    - Call installThemedAlert() once at boot. Every Alert.alert(...) call
 *      anywhere in the app will then render through the themed UI.
 *
 * 2. LOCAL HOOK:
 *    - const { alert, alertNode } = useThemedAlert();
 *    - Render {alertNode} in the screen and call alert(title, message, buttons).
 *
 * Both paths support the same signature as React Native's Alert.alert:
 *   alert(title, message?, buttons?)
 * where buttons is an array of { text, onPress?, style?: 'default'|'cancel'|'destructive' }.
 */

// --- subscriber registry shared between host and override ---------------------

const listeners = new Set();
const queue = [];

const dispatch = (alertSpec) => {
  if (listeners.size === 0) {
    // No host mounted yet — buffer briefly. The host will drain on mount.
    queue.push(alertSpec);
    return;
  }
  listeners.forEach((fn) => fn(alertSpec));
};

const subscribe = (fn) => {
  listeners.add(fn);
  // Drain anything queued before mount
  if (queue.length > 0) {
    const drained = queue.splice(0);
    drained.forEach((spec) => fn(spec));
  }
  return () => listeners.delete(fn);
};

/**
 * Show a themed alert programmatically. Same signature as Alert.alert, with an
 * optional 4th `options` argument for themed-only extras:
 *   { variant: 'success' } — shows a celebratory check badge above the title.
 */
export const showThemedAlert = (title, message, buttons, options) => {
  dispatch({ title, message, buttons, variant: options?.variant });
};

/**
 * Patch React Native's Alert.alert so every existing call site renders
 * through the themed UI. Call once at app startup.
 */
let installed = false;
export const installThemedAlert = () => {
  if (installed) return;
  installed = true;
  RNAlert.alert = (title, message, buttons /*, options */) => {
    showThemedAlert(title, message, buttons);
  };
};

// --- visual component --------------------------------------------------------

const ThemedAlertView = ({ visible, title, message, buttons, variant, onClose }) => {
  const safeButtons = (buttons && buttons.length > 0)
    ? buttons
    : [{ text: 'OK' }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.cardWrapper}
          onPress={(e) => e?.stopPropagation && e.stopPropagation()}
        >
          <View style={styles.card}>
            {variant === 'success' ? (
              <View style={styles.successBadge}>
                <CheckCircle2 size={32} color={colors.success} strokeWidth={2.2} />
              </View>
            ) : null}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View
              style={[
                styles.buttonRow,
                safeButtons.length > 2 && styles.buttonColumn,
              ]}
            >
              {safeButtons.map((b, idx) => {
                const isCancel = b.style === 'cancel';
                const isDestructive = b.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={`${b.text}-${idx}`}
                    onPress={() => {
                      onClose();
                      // Defer onPress so the modal unmount completes first
                      if (b.onPress) setTimeout(b.onPress, 0);
                    }}
                    style={[
                      styles.button,
                      isCancel && styles.buttonCancel,
                      isDestructive && styles.buttonDestructive,
                      !isCancel && !isDestructive && styles.buttonPrimary,
                      safeButtons.length > 2 && styles.buttonStacked,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                        isDestructive && styles.buttonTextDestructive,
                        !isCancel && !isDestructive && styles.buttonTextPrimary,
                      ]}
                    >
                      {b.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/**
 * Mount this once near the root of the app. It listens for showThemedAlert()
 * dispatches and renders the themed modal.
 */
export const ThemedAlertHost = () => {
  const [state, setState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });
  const queueRef = useRef([]);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) setState({ ...next, visible: true });
  }, []);

  useEffect(() => {
    return subscribe((spec) => {
      queueRef.current.push(spec);
      // If nothing is currently showing, surface the next one immediately
      setState((current) => {
        if (current.visible) return current;
        const next = queueRef.current.shift();
        return next ? { ...next, visible: true } : current;
      });
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
    setTimeout(() => {
      if (queueRef.current.length > 0) showNext();
    }, 200);
  }, [showNext]);

  return (
    <ThemedAlertView
      visible={state.visible}
      title={state.title}
      message={state.message}
      buttons={state.buttons}
      variant={state.variant}
      onClose={close}
    />
  );
};

/**
 * Local hook variant — useful when a screen wants its own alert instance
 * independent of the global host (rare).
 */
export const useThemedAlert = () => {
  const [state, setState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });
  const queueRef = useRef([]);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) setState({ ...next, visible: true });
  }, []);

  const alert = useCallback((title, message, buttons, options) => {
    queueRef.current.push({ title, message, buttons, variant: options?.variant });
    setState((current) => {
      if (current.visible) return current;
      const next = queueRef.current.shift();
      return next ? { ...next, visible: true } : current;
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
    setTimeout(() => {
      if (queueRef.current.length > 0) showNext();
    }, 200);
  }, [showNext]);

  const alertNode = (
    <ThemedAlertView
      visible={state.visible}
      title={state.title}
      message={state.message}
      buttons={state.buttons}
      variant={state.variant}
      onClose={close}
    />
  );

  return { alert, alertNode };
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 31, 31, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  successBadge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(123, 157, 111, 0.14)', // colors.success @ ~14%
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonStacked: {
    flex: 0,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: colors.backgroundAlt,
  },
  buttonDestructive: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  buttonTextPrimary: {
    color: colors.textInverse,
  },
  buttonTextCancel: {
    color: colors.text,
  },
  buttonTextDestructive: {
    color: colors.textInverse,
  },
});

export default ThemedAlertView;
