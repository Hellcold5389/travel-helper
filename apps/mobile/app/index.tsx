import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, countryFlags } from '../src/theme/colors';
import { Card, SectionHeader } from '../src/components/ui';

// Quick actions for home screen
const QUICK_ACTIONS = [
  { icon: '✈️', title: 'AI 行程規劃', subtitle: '讓 AI 幫你規劃完美旅程', href: '/trip' as const },
  { icon: '📋', title: '簽證查詢', subtitle: '快速查詢簽證需求', href: '/visa' as const },
  { icon: '⚖️', title: '法律禁忌', subtitle: '了解當地法律禁忌', href: '/legal' as const },
  { icon: '🎭', title: '趣聞探索', subtitle: '發現當地有趣知識', href: '/funfacts' as const },
];

// Popular destinations
const POPULAR_DESTINATIONS = [
  { code: 'JP', name: '日本', nameZh: '日本' },
  { code: 'KR', name: '韓國', nameZh: '韓國' },
  { code: 'TH', name: '泰國', nameZh: '泰國' },
  { code: 'SG', name: '新加坡', nameZh: '新加坡' },
  { code: 'HK', name: '香港', nameZh: '香港' },
  { code: 'VN', name: '越南', nameZh: '越南' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>你好，旅行家 👋</Text>
          <Text style={styles.subtitle}>今天想去哪裡探險？</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="快速功能" />
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action, index) => (
              <Link key={index} href={action.href} asChild>
                <TouchableOpacity style={styles.actionCard}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <SectionHeader 
            title="熱門目的地" 
            action={{ label: '查看全部', onPress: () => {} }}
          />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destinationsScroll}
          >
            {POPULAR_DESTINATIONS.map((dest) => (
              <Link key={dest.code} href={`/visa?country=${dest.code}`} asChild>
                <TouchableOpacity style={styles.destinationCard}>
                  <Text style={styles.destinationFlag}>
                    {countryFlags[dest.code] || '🌍'}
                  </Text>
                  <Text style={styles.destinationName}>{dest.nameZh}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>

        {/* Recent Trips Placeholder */}
        <View style={styles.section}>
          <SectionHeader 
            title="最近行程" 
            action={{ label: '查看全部', onPress: () => {} }}
          />
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>還沒有行程紀錄</Text>
            <Text style={styles.emptyHint}>使用 AI 行程規劃開始你的旅程</Text>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by AI • Made with ❤️
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  destinationsScroll: {
    gap: 12,
  },
  destinationCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  destinationFlag: {
    fontSize: 36,
    marginBottom: 4,
  },
  destinationName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});