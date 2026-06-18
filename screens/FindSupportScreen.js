import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Compass,
  UserSearch,
  Users,
  HeartPulse,
  Flame,
  FlaskConical,
  HandHeart,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme/colors';

// Maps the legacy icon names stored in the resource data
// to Lucide components.
const RESOURCE_ICON_MAP = {
  phone: Phone,
  textsms: MessageSquare,
  explore: Compass,
  'person-search': UserSearch,
  groups: Users,
  healing: HeartPulse,
  'local-fire-department': Flame,
  science: FlaskConical,
  'volunteer-activism': HandHeart,
};

const CRISIS_RESOURCES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    description: '24/7 crisis support by phone or chat',
    action: 'tel:988',
    actionLabel: 'Call 988',
    icon: 'phone',
    urgent: true,
  },
  {
    name: 'Crisis Text Line',
    description: 'Text-based crisis support',
    action: 'sms:741741?body=HOME',
    actionLabel: 'Text HOME to 741741',
    icon: 'textsms',
    urgent: true,
  },
  {
    name: 'SAMHSA National Helpline',
    description: 'Mental health & substance abuse referrals',
    action: 'tel:18006624357',
    actionLabel: 'Call 1-800-662-4357',
    icon: 'phone',
    urgent: true,
  },
];

const THERAPIST_DIRECTORIES = [
  {
    name: 'MAPS Psychedelic Therapy Directory',
    description: 'Find therapists trained in psychedelic-assisted therapy',
    url: 'https://integration.maps.org/',
    icon: 'explore',
  },
  {
    name: 'Psychology Today',
    description: 'Search therapists by specialty, insurance, and location',
    url: 'https://www.psychologytoday.com/us/therapists',
    icon: 'person-search',
  },
  {
    name: 'IFS Institute Directory',
    description: 'Find Internal Family Systems trained therapists',
    url: 'https://ifs-institute.com/practitioners',
    icon: 'groups',
  },
  {
    name: 'Psychedelic Support',
    description: 'Integration therapists and harm reduction specialists',
    url: 'https://psychedelic.support/network/',
    icon: 'healing',
  },
  {
    name: 'Fireside Project',
    description: 'Psychedelic peer support line (call or text 62-FIRESIDE)',
    url: 'https://firesideproject.org/',
    icon: 'local-fire-department',
  },
];

const EDUCATIONAL_RESOURCES = [
  {
    name: 'MAPS (Multidisciplinary Association for Psychedelic Studies)',
    description: 'Research, education, and advocacy',
    url: 'https://maps.org/',
    icon: 'science',
  },
  {
    name: 'Zendo Project',
    description: 'Psychedelic harm reduction and peer support training',
    url: 'https://zfrproject.org/',
    icon: 'volunteer-activism',
  },
];

const FindSupportScreen = ({ navigation }) => {
  const handleLink = (url) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Unable to Open', 'Could not open this link on your device.');
      }
    });
  };

  const ResourceCard = ({ item, urgent }) => {
    const ResourceIcon = RESOURCE_ICON_MAP[item.icon] || Compass;
    return (
      <TouchableOpacity
        style={[styles.resourceCard, urgent && styles.urgentCard]}
        onPress={() => handleLink(item.action || item.url)}
        activeOpacity={0.7}
      >
        <View style={[styles.resourceIcon, urgent && styles.urgentIcon]}>
          <ResourceIcon
            size={24}
            color={urgent ? '#dc2626' : colors.primary}
            strokeWidth={2}
          />
        </View>
        <View style={styles.resourceText}>
          <Text style={[styles.resourceName, urgent && styles.urgentName]}>
            {item.name}
          </Text>
          <Text style={styles.resourceDescription}>{item.description}</Text>
          {item.actionLabel && (
            <Text style={[styles.resourceAction, urgent && styles.urgentAction]}>
              {item.actionLabel}
            </Text>
          )}
        </View>
        <ExternalLink
          size={18}
          color={colors.textLight}
          strokeWidth={2}
        />
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={gradients.standard}
      start={gradients.standardStart}
      end={gradients.standardEnd}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Support</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content}>
          {/* Crisis */}
          <Text style={styles.sectionHeader}>Immediate Help</Text>
          <View style={styles.card}>
            {CRISIS_RESOURCES.map((item, i) => (
              <React.Fragment key={item.name}>
                {i > 0 && <View style={styles.separator} />}
                <ResourceCard item={item} urgent />
              </React.Fragment>
            ))}
          </View>

          {/* Directories */}
          <Text style={styles.sectionHeader}>Find a Therapist</Text>
          <View style={styles.card}>
            {THERAPIST_DIRECTORIES.map((item, i) => (
              <React.Fragment key={item.name}>
                {i > 0 && <View style={styles.separator} />}
                <ResourceCard item={item} />
              </React.Fragment>
            ))}
          </View>

          {/* Education */}
          <Text style={styles.sectionHeader}>Learn More</Text>
          <View style={styles.card}>
            {EDUCATIONAL_RESOURCES.map((item, i) => (
              <React.Fragment key={item.name}>
                {i > 0 && <View style={styles.separator} />}
                <ResourceCard item={item} />
              </React.Fragment>
            ))}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Info size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.disclaimerText}>
              Multitudes provides these links as resources. We do not endorse,
              verify, or guarantee any provider. Always verify credentials and
              fit before beginning a therapeutic relationship.
            </Text>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.soft,
    overflow: 'hidden',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  urgentCard: {
    // styled via children
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentIcon: {
    backgroundColor: '#dc262615',
  },
  resourceText: {
    flex: 1,
  },
  resourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  urgentName: {
    color: '#dc2626',
  },
  resourceDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resourceAction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  urgentAction: {
    color: '#dc2626',
  },
  separator: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginLeft: 72,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}08`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  footer: {
    height: spacing.xxl * 2,
  },
});

export default FindSupportScreen;
