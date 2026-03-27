import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, countryFlags } from '../src/theme/colors';
import { Card, Loading, Empty, Badge, Button } from '../src/components/ui';
import { useCountries, useLegalInfo } from '../src/api/queries';

// Severity colors
const SEVERITY_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
  INFO: 'default',
};

// Severity labels
const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: '🔴 高風險',
  HIGH: '🔴 高風險',
  MEDIUM: '🟠 中風險',
  LOW: '🟡 低風險',
  INFO: 'ℹ️ 資訊',
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  PROHIBITED_ITEMS: '禁帶物品',
  RESTRICTED_ITEMS: '限制物品',
  MEDICATION: '藥品',
  FOOD_PRODUCTS: '食品',
  CURRENCY: '現金/貨幣',
  BEHAVIOR: '行為禁忌',
  PHOTOGRAPHY: '攝影限制',
  DRESS_CODE: '服裝規定',
  CUSTOMS: '海關規定',
  OTHER: '其他',
};

export default function LegalScreen() {
  const [selectedCountry, setSelectedCountry] = useState('JP');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Queries
  const { data: countries } = useCountries();
  const { data: legalInfo, isLoading } = useLegalInfo(selectedCountry);

  const selectedCountryData = countries?.find(c => c.code === selectedCountry);

  // Filter by category
  const filteredRestrictions = selectedCategory
    ? legalInfo?.restrictions.filter(r => r.category === selectedCategory)
    : legalInfo?.restrictions;

  // Get unique categories
  const categories = Array.from(
    new Set(legalInfo?.restrictions.map(r => r.category) || [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚖️ 法律禁忌</Text>
          <Text style={styles.subtitle}>了解當地法律與禁帶物品</Text>
        </View>

        {/* Country Selector */}
        <Card style={styles.selectorCard}>
          <Text style={styles.selectorLabel}>選擇國家</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={styles.selectorValue}>
              {countryFlags[selectedCountry] || '🌍'}{' '}
              {selectedCountryData?.nameZh || selectedCountryData?.name || '選擇國家'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          {showCountryPicker && (
            <View style={styles.pickerOptions}>
              {countries?.slice(0, 20).map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.pickerOption,
                    selectedCountry === country.code && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCountry(country.code);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    selectedCountry === country.code && styles.pickerOptionTextSelected,
                  ]}>
                    {countryFlags[country.code] || '🌍'} {country.nameZh || country.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Quick Select */}
        <View style={styles.quickSelect}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickSelectScroll}
          >
            {['JP', 'KR', 'TH', 'SG', 'HK', 'TW', 'US', 'MY'].map((code) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.quickButton,
                  selectedCountry === code && styles.quickButtonActive,
                ]}
                onPress={() => setSelectedCountry(code)}
              >
                <Text style={styles.quickButtonFlag}>{countryFlags[code] || '🌍'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Filter */}
        {categories.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilter}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}>
                全部
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}>
                  {CATEGORY_LABELS[category] || category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Restrictions */}
        {isLoading ? (
          <Loading message="載入法律資訊..." />
        ) : !legalInfo || legalInfo.restrictions.length === 0 ? (
          <Empty 
            icon="📭" 
            message="暫無法律禁忌資料" 
          />
        ) : (
          <View style={styles.restrictionsContainer}>
            {/* Summary */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryCount}>
                    {legalInfo.restrictions.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length}
                  </Text>
                  <Text style={styles.summaryLabel}>高風險</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryCount}>
                    {legalInfo.restrictions.filter(r => r.severity === 'MEDIUM').length}
                  </Text>
                  <Text style={styles.summaryLabel}>中風險</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryCount}>{legalInfo.total}</Text>
                  <Text style={styles.summaryLabel}>總計</Text>
                </View>
              </View>
            </Card>

            {/* Restrictions List */}
            {filteredRestrictions?.map((restriction) => (
              <Card key={restriction.id} style={styles.restrictionCard}>
                <View style={styles.restrictionHeader}>
                  <Badge 
                    text={SEVERITY_LABELS[restriction.severity] || restriction.severity}
                    variant={SEVERITY_COLORS[restriction.severity] || 'default'}
                  />
                  <Text style={styles.restrictionCategory}>
                    {CATEGORY_LABELS[restriction.category] || restriction.category}
                  </Text>
                </View>

                <Text style={styles.restrictionTitle}>{restriction.title}</Text>
                <Text style={styles.restrictionDescription}>{restriction.description}</Text>

                {restriction.items && restriction.items.length > 0 && (
                  <View style={styles.itemsSection}>
                    <Text style={styles.itemsLabel}>具體物品：</Text>
                    <Text style={styles.itemsText}>
                      {restriction.items.slice(0, 5).join('、')}
                      {restriction.items.length > 5 && ' 等'}
                    </Text>
                  </View>
                )}

                {(restriction.penalty || restriction.imprisonment) && (
                  <View style={styles.penaltySection}>
                    <Text style={styles.penaltyLabel}>⚠️ 處罰：</Text>
                    {restriction.imprisonment && (
                      <Text style={styles.penaltyText}>刑責：{restriction.imprisonment}</Text>
                    )}
                    {restriction.penalty && (
                      <Text style={styles.penaltyText}>{restriction.penalty}</Text>
                    )}
                  </View>
                )}

                {restriction.permitRequired && restriction.permitInfo && (
                  <View style={styles.permitSection}>
                    <Text style={styles.permitLabel}>📋 許可資訊：</Text>
                    <Text style={styles.permitText}>{restriction.permitInfo}</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          ⚠️ 法律資訊可能隨時變更，請以當地官方公告為準。
          違反規定可能面臨罰款、監禁等處罰。
        </Text>

        {legalInfo?.lastUpdated && (
          <Text style={styles.lastUpdated}>
            資料最後更新：{legalInfo.lastUpdated}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectorCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  selectorValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  selectorArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pickerOptions: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 250,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  quickSelect: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickSelectScroll: {
    gap: 8,
  },
  quickButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  quickButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  quickButtonFlag: {
    fontSize: 24,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  restrictionsContainer: {
    paddingHorizontal: 20,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray200,
  },
  restrictionCard: {
    marginBottom: 12,
  },
  restrictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  restrictionCategory: {
    fontSize: 12,
    color: colors.textMuted,
  },
  restrictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  restrictionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  itemsSection: {
    backgroundColor: colors.gray50,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemsText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  penaltySection: {
    backgroundColor: colors.error + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.error,
    marginBottom: 4,
  },
  penaltyText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  permitSection: {
    backgroundColor: colors.info + '10',
    padding: 12,
    borderRadius: 8,
  },
  permitLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.info,
    marginBottom: 4,
  },
  permitText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  disclaimer: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 16,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  lastUpdated: {
    marginHorizontal: 20,
    marginBottom: 20,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});