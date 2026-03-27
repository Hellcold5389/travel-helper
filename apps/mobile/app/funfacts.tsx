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
import { Card, Loading, Empty, Badge } from '../src/components/ui';
import { useCountries, useFunFacts } from '../src/api/queries';

// Category colors
const CATEGORY_COLORS: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  CULTURE: 'info',
  HISTORY: 'default',
  FOOD: 'success',
  NATURE: 'success',
  LANGUAGE: 'info',
  ETIQUETTE: 'warning',
  STATISTICS: 'default',
  TRIVIA: 'info',
  OTHER: 'default',
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  CULTURE: '文化',
  HISTORY: '歷史',
  FOOD: '美食',
  NATURE: '自然',
  LANGUAGE: '語言',
  ETIQUETTE: '禮儀',
  STATISTICS: '統計',
  TRIVIA: '趣聞',
  OTHER: '其他',
};

export default function FunFactsScreen() {
  const [selectedCountry, setSelectedCountry] = useState('JP');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Queries
  const { data: countries } = useCountries();
  const { data: funFacts, isLoading, refetch } = useFunFacts(selectedCountry);

  const selectedCountryData = countries?.find(c => c.code === selectedCountry);

  // Group facts by category
  const factsByCategory = funFacts?.facts.reduce((acc, fact) => {
    if (!acc[fact.category]) {
      acc[fact.category] = [];
    }
    acc[fact.category].push(fact);
    return acc;
  }, {} as Record<string, typeof funFacts.facts>);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎭 趣聞探索</Text>
          <Text style={styles.subtitle}>發現世界各地的有趣知識</Text>
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
            {['JP', 'KR', 'TH', 'SG', 'HK', 'TW', 'US', 'FR'].map((code) => (
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

        {/* Facts */}
        {isLoading ? (
          <Loading message="載入趣聞中..." />
        ) : !funFacts || funFacts.facts.length === 0 ? (
          <Empty 
            icon="📭" 
            message="暫無趣聞資料" 
          />
        ) : (
          <View style={styles.factsContainer}>
            {factsByCategory && Object.entries(factsByCategory).map(([category, facts]) => (
              <View key={category} style={styles.categorySection}>
                <Badge 
                  text={CATEGORY_LABELS[category] || category} 
                  variant={CATEGORY_COLORS[category] || 'default'}
                />
                <View style={styles.factsList}>
                  {facts.map((fact) => (
                    <Card key={fact.id} style={styles.factCard}>
                      {fact.title && (
                        <Text style={styles.factTitle}>{fact.title}</Text>
                      )}
                      <Text style={styles.factContent}>{fact.content}</Text>
                      {fact.source && (
                        <Text style={styles.factSource}>來源：{fact.source}</Text>
                      )}
                    </Card>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        {funFacts?.lastUpdated && (
          <Text style={styles.lastUpdated}>
            資料最後更新：{funFacts.lastUpdated}
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
  factsContainer: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 20,
  },
  factsList: {
    marginTop: 12,
    gap: 12,
  },
  factCard: {
    padding: 16,
  },
  factTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  factContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  factSource: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    fontStyle: 'italic',
  },
  lastUpdated: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});