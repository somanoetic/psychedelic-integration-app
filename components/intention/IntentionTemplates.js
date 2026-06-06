import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Lightbulb,
  Star,
  Brain,
  Tag,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/colors';
import FrameworkSelector from './FrameworkSelector';
import SessionTypeSelector from './SessionTypeSelector';

/**
 * IntentionTemplates - Browse and select intention templates
 *
 * Features:
 * - Filter by framework and session type
 * - Template cards with preview
 * - "Use this template" action
 * - Featured templates highlighted
 * - Empty state
 */
const IntentionTemplates = ({
  templates,
  framework,
  sessionType,
  onSelectTemplate,
  onFilterChange,
  loading,
}) => {
  const [expandedId, setExpandedId] = useState(null);

  /**
   * Handle framework filter change
   */
  const handleFrameworkChange = (newFramework) => {
    onFilterChange(newFramework, sessionType);
  };

  /**
   * Handle session type filter change
   */
  const handleSessionTypeChange = (newSessionType) => {
    onFilterChange(framework, newSessionType);
  };

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Lightbulb size={64} color={colors.lightGray} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>No Templates Found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your filters or browse all templates
      </Text>
      <TouchableOpacity
        style={styles.clearFiltersButton}
        onPress={() => onFilterChange(null, null)}
        activeOpacity={0.7}
      >
        <Text style={styles.clearFiltersText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render template card
   */
  const renderTemplate = ({ item }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.templateCard,
          item.is_featured && styles.featuredCard
        ]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.8}
      >
        {/* Featured Badge */}
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Star size={12} color={colors.golden} fill={colors.golden} strokeWidth={2} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.templateTitle}>{item.title}</Text>

        {/* Metadata */}
        <View style={styles.templateMeta}>
          {item.framework && (
            <View style={styles.metaChip}>
              <Brain size={14} color={colors.primary} strokeWidth={2} />
              <Text style={styles.metaText}>{formatFramework(item.framework)}</Text>
            </View>
          )}
          {item.session_type && (
            <View style={styles.metaChip}>
              <Tag size={14} color={colors.sage} strokeWidth={2} />
              <Text style={styles.metaText}>{formatSessionType(item.session_type)}</Text>
            </View>
          )}
        </View>

        {/* Description (when collapsed) */}
        {!isExpanded && item.description && (
          <Text style={styles.templateDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.description && (
              <Text style={styles.templateDescriptionFull}>
                {item.description}
              </Text>
            )}

            {/* Intention Text */}
            <View style={styles.intentionPreview}>
              <Text style={styles.intentionLabel}>Intention Example:</Text>
              <Text style={styles.intentionText}>{item.intention_text}</Text>
            </View>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 5).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Use Template Button */}
            <TouchableOpacity
              style={styles.useButton}
              onPress={() => onSelectTemplate(item)}
              activeOpacity={0.7}
            >
              <PlusCircle size={20} color={colors.textInverse} strokeWidth={2} />
              <Text style={styles.useButtonText}>Use This Template</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expand/Collapse Indicator */}
        <View style={styles.expandIndicator}>
          {isExpanded ? (
            <ChevronUp size={24} color={colors.textSecondary} strokeWidth={2} />
          ) : (
            <ChevronDown size={24} color={colors.textSecondary} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Format framework name
   */
  const formatFramework = (fw) => {
    const map = {
      ifs: 'IFS',
      somatic: 'Somatic',
      existential: 'Existential',
      healing: 'Healing',
      integration: 'Integration',
    };
    return map[fw] || fw;
  };

  /**
   * Format session type name
   */
  const formatSessionType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Intention Templates</Text>
        <Text style={styles.headerSubtitle}>
          Browse examples to inspire your own intention
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Framework</Text>
        <FrameworkSelector
          selectedFramework={framework}
          onSelectFramework={handleFrameworkChange}
          allowNull
        />

        <Text style={styles.filterLabel}>Session Type</Text>
        <SessionTypeSelector
          selectedType={sessionType}
          onSelectType={handleSessionTypeChange}
          allowNull
        />
      </View>

      {/* Templates Count */}
      {templates && templates.length > 0 && (
        <Text style={styles.countText}>
          {templates.length} template{templates.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      )}

      {/* Templates List */}
      {!loading && (
        <FlatList
          data={templates}
          renderItem={renderTemplate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  filters: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  countText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    ...shadows.soft,
  },
  featuredCard: {
    borderColor: colors.golden,
    borderWidth: 2,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.golden,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
    textTransform: 'uppercase',
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  templateMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  templateDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  templateDescriptionFull: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  expandedContent: {
    marginTop: spacing.sm,
  },
  intentionPreview: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  intentionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  intentionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tagText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  useButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
  expandIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
});

export default IntentionTemplates;
