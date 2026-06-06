/**
 * Worksheet Library Screen
 *
 * Browse the catalog of printable worksheets. Tapping one opens the
 * WorksheetPrintScreen for that worksheet, where the user picks how to get
 * the PDF onto paper (email / share / print).
 *
 * Layout: standalone worksheets at the top, then sections grouped by
 * collection (Pre-Treatment Baseline Log, Daily Check-In, etc.). Within a
 * collection, items are sorted by collection.order. This matches the
 * structure of Becky's printed journal so users can think of the app like
 * a digital version of the same book.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react-native';

import { getWorksheetsGroupedByCollection } from '../content/worksheets';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/colors';

export default function WorksheetLibraryScreen({ navigation }) {
  const { standalone, collections } = getWorksheetsGroupedByCollection();

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
        <Text style={styles.headerTitle}>Printable worksheets</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Pages to print and fill out by hand. When you're done, scan them
          back in from the journal.
        </Text>

        {standalone.length > 0 && (
          <View style={styles.section}>
            {standalone.map((w) => (
              <WorksheetCard key={w.id} worksheet={w} navigation={navigation} />
            ))}
          </View>
        )}

        {collections.map(({ collection, items }) => (
          <View key={collection.id} style={styles.section}>
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionTitle}>{collection.title}</Text>
              {collection.description ? (
                <Text style={styles.sectionDescription}>{collection.description}</Text>
              ) : null}
            </View>
            {items.map((w) => (
              <WorksheetCard key={w.id} worksheet={w} navigation={navigation} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function WorksheetCard({ worksheet, navigation }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WorksheetPrint', { worksheetId: worksheet.id })}
      activeOpacity={0.75}
    >
      <View style={styles.iconWrap}>
        <FileText size={20} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{worksheet.title}</Text>
        <Text style={styles.cardSubtitle}>{worksheet.subtitle}</Text>
      </View>
      <ChevronRight size={18} color={colors.textLight} style={styles.chevron} />
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
  intro: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: typography.base * typography.relaxed,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderWrap: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.relaxed,
    fontStyle: 'italic',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(93,134,214,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.charcoal,
  },
  cardSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  chevron: { marginLeft: spacing.xs },
});
