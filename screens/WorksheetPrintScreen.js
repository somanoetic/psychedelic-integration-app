/**
 * Worksheet Print Screen
 *
 * After choosing a worksheet from the library, this screen offers three ways
 * to get the page onto paper:
 *
 *   1. Email me      — opens the mail composer with the PDF attached.
 *   2. Share         — opens the iOS/Android share sheet (AirDrop, Files,
 *                      Messages, etc.). Best path for "send to my laptop and
 *                      print from there."
 *   3. Print         — opens the system print dialog directly (AirPrint /
 *                      Android print framework).
 *
 * All three start from the same PDF. We generate on first interaction (not
 * on screen mount) to avoid wasting work if the user backs out.
 *
 * Permissions: expo-mail-composer.isAvailableAsync() can return false on a
 * device with no configured mail account — we surface that as a disabled
 * button with explanatory text, not a silent failure.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import {
  ArrowLeft,
  Mail,
  Share2,
  Printer,
  FileText,
} from 'lucide-react-native';

import { getWorksheet } from '../content/worksheets';
import { renderWorksheetToPdf } from '../lib/worksheetPdfService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/colors';

export default function WorksheetPrintScreen({ route, navigation }) {
  const { worksheetId } = route.params ?? {};
  const worksheet = getWorksheet(worksheetId);
  const [busyAction, setBusyAction] = useState(null);

  if (!worksheet) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not found</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            That worksheet doesn't exist. It may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Each action regenerates the PDF. Cheap (~tens of ms) and avoids stale
  // file URIs if the user keeps the screen open across a long session.
  async function withPdf(actionKey, fn) {
    if (busyAction) return;
    setBusyAction(actionKey);
    try {
      const { uri } = await renderWorksheetToPdf(worksheet);
      await fn(uri);
    } catch (err) {
      console.error(`[WorksheetPrint] ${actionKey} failed:`, err);
      Alert.alert(
        'Something went wrong',
        err?.message ?? 'Please try again.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function onEmail() {
    return withPdf('email', async (uri) => {
      const available = await MailComposer.isAvailableAsync();
      if (!available) {
        Alert.alert(
          'No mail account',
          'Set up a mail account in your device settings, or use Share instead.',
        );
        return;
      }
      await MailComposer.composeAsync({
        subject: `${worksheet.title} — printable worksheet`,
        body:
          `Here's the "${worksheet.title}" worksheet to print and fill out by hand.\n\n` +
          'Once it\'s filled in, open Multitudes and tap the camera icon in your journal to scan it back in.',
        attachments: [uri],
      });
    });
  }

  async function onShare() {
    return withPdf('share', async (uri) => {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'Sharing is not supported on this device.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${worksheet.title} — share`,
        UTI: 'com.adobe.pdf',
      });
    });
  }

  async function onPrint() {
    return withPdf('print', async (uri) => {
      // Print.printAsync wants either html OR uri. We pass uri so the user
      // sees a preview of the actual rendered PDF, not a re-rendered HTML.
      await Print.printAsync({ uri });
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get printable</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewCard}>
          <FileText size={20} color={colors.primary} />
          <View style={styles.previewBody}>
            <Text style={styles.previewTitle}>{worksheet.title}</Text>
            <Text style={styles.previewSubtitle}>{worksheet.subtitle}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>How would you like to get this?</Text>

        <ActionButton
          icon={Mail}
          label="Email it to me"
          description="We'll open your mail app with the PDF attached. Print from your laptop."
          busy={busyAction === 'email'}
          disabled={!!busyAction}
          onPress={onEmail}
        />
        <ActionButton
          icon={Share2}
          label="Share"
          description="AirDrop, Files, Messages — whatever's easiest."
          busy={busyAction === 'share'}
          disabled={!!busyAction}
          onPress={onShare}
        />
        <ActionButton
          icon={Printer}
          label="Print now"
          description="Send straight to a connected printer."
          busy={busyAction === 'print'}
          disabled={!!busyAction}
          onPress={onPrint}
        />

        <Text style={styles.footnote}>
          After you fill it in, open the journal and tap the camera icon to
          scan it back in.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ icon: Icon, label, description, busy, disabled, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, disabled && !busy && styles.actionDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <View style={styles.actionIconWrap}>
        {busy
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <Icon size={22} color={colors.primary} />}
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.charcoal,
  },
  headerSpacer: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  previewBody: { marginLeft: spacing.md, flex: 1 },
  previewTitle: { fontSize: typography.lg, fontWeight: '600', color: colors.charcoal },
  previewSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: typography.xs,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  actionDisabled: { opacity: 0.5 },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(93,134,214,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionBody: { flex: 1 },
  actionLabel: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
  },

  footnote: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  notFound: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  notFoundText: { textAlign: 'center', color: colors.textSecondary, fontSize: typography.base },
});
