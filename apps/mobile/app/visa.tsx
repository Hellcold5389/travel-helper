import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, countryFlags } from '../src/theme/colors';
import { Card, Button, Loading, Badge } from '../src/components/ui';
import { useCountries, useVisa } from '../src/api/queries';

// Common nationalities
const NATIONALITIES = [
  { code: 'TW', label: '🇹🇼 台灣' },
  { code: 'HK', label: '🇭🇰 香港' },
  { code: 'MO', label: '🇲🇴 澳門' },
  { code: 'CN', label: '🇨🇳 中國' },
  { code: 'US', label: '🇺🇸 美國' },
  { code: 'JP', label: '🇯🇵 日本' },
  { code: 'KR', label: '🇰🇷 韓國' },
  { code: 'SG', label: '🇸🇬 新加坡' },
];

export default function VisaScreen() {
  const params = useLocalSearchParams<{ country?: string }>();
  const [nationality, setNationality] = useState('TW');
  const [destination, setDestination] = useState(params.country || '');
  const [searchText, setSearchText] = useState('');
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);

  // Queries
  const { data: countries, isLoading: loadingCountries } = useCountries();
  const { data: visa, isLoading: loadingVisa, refetch: fetchVisa } = useVisa(nationality, destination);

  const handleSearch = () => {
    if (!searchText.trim()) {
      Alert.alert('提示', '請輸入目的地國家代碼');
      return;
    }
    setDestination(searchText.toUpperCase());
  };

  const renderVisaResult = () => {
    if (!destination) return null;
    if (loadingVisa) return <Loading message="查詢簽證資訊..." />;
    if (!visa) return null;

    const requirementColors: Record<string, string> = {
      VISA_FREE: 'success',
      VISA_ON_ARRIVAL: 'info',
      E_VISA: 'info',
      ETA: 'info',
      VISA_REQUIRED: 'warning',
      VISA_RESTRICTED: 'error',
      VISA_SUSPENDED: 'error',
    };

    return (
      <Card style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.flag}>{countryFlags[visa.countryCode] || '🌍'}</Text>
          <View style={styles.resultTitleContainer}>
            <Text style={styles.countryName}>
              {visa.countryNameZh || visa.countryName}
            </Text>
            <Badge 
              text={visa.requirementText} 
              variant={requirementColors[visa.requirement] as 'success' | 'info' | 'warning' | 'error' | 'default'} 
            />
          </View>
        </View>

        <View style={styles.resultDetails}>
          {visa.durationDays && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏱ 停留期限</Text>
              <Text style={styles.detailValue}>
                {visa.durationDays} 天
                {visa.durationNote && ` (${visa.durationNote})`}
              </Text>
            </View>
          )}

          {visa.passportValidity && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📄 護照效期</Text>
              <Text style={styles.detailValue}>{visa.passportValidity}</Text>
            </View>
          )}

          {visa.processingTime && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🕐 處理時間</Text>
              <Text style={styles.detailValue}>{visa.processingTime}</Text>
            </View>
          )}

          {visa.fee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>💰 費用</Text>
              <Text style={styles.detailValue}>
                {visa.fee} {visa.feeCurrency}
              </Text>
            </View>
          )}

          {visa.documents && visa.documents.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>📋 所需文件</Text>
              {visa.documents.map((doc, index) => (
                <Text key={index} style={styles.listItem}>• {doc}</Text>
              ))}
            </View>
          )}

          {visa.notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>📌 注意事項</Text>
              <Text style={styles.notes}>{visa.notes}</Text>
            </View>
          )}
        </View>

        {visa.lastUpdated && (
          <Text style={styles.lastUpdated}>
            資料最後更新：{visa.lastUpdated}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📋 簽證查詢</Text>
          <Text style={styles.subtitle}>快速查詢各國簽證需求</Text>
        </View>

        {/* Nationality Selector */}
        <Card style={styles.selectorCard}>
          <Text style={styles.selectorLabel}>我的護照國籍</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowNationalityPicker(!showNationalityPicker)}
          >
            <Text style={styles.selectorValue}>
              {NATIONALITIES.find(n => n.code === nationality)?.label || '選擇國籍'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          {showNationalityPicker && (
            <View style={styles.pickerOptions}>
              {NATIONALITIES.map((n) => (
                <TouchableOpacity
                  key={n.code}
                  style={[
                    styles.pickerOption,
                    nationality === n.code && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setNationality(n.code);
                    setShowNationalityPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    nationality === n.code && styles.pickerOptionTextSelected,
                  ]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Search Input */}
        <Card style={styles.searchCard}>
          <Text style={styles.selectorLabel}>目的地國家</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="輸入國家代碼（如 JP, KR, TH）"
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="characters"
              maxLength={2}
            />
            <Button title="查詢" onPress={handleSearch} size="sm" />
          </View>
        </Card>

        {/* Quick Select */}
        <View style={styles.quickSelect}>
          <Text style={styles.quickSelectLabel}>快速選擇：</Text>
          <View style={styles.quickSelectButtons}>
            {['JP', 'KR', 'TH', 'SG', 'US', 'HK'].map((code) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.quickButton,
                  destination === code && styles.quickButtonActive,
                ]}
                onPress={() => {
                  setSearchText(code);
                  setDestination(code);
                }}
              >
                <Text style={styles.quickButtonFlag}>{countryFlags[code] || '🌍'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Result */}
        {renderVisaResult()}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          ⚠️ 簽證政策可能隨時變更，出發前請確認官方資訊
        </Text>
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
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  searchCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  quickSelect: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickSelectLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickSelectButtons: {
    flexDirection: 'row',
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
  resultCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flag: {
    fontSize: 48,
    marginRight: 16,
  },
  resultTitleContainer: {
    flex: 1,
  },
  countryName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  resultDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailSection: {
    marginTop: 8,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  notes: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lastUpdated: {
    marginTop: 16,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  disclaimer: {
    marginHorizontal: 20,
    marginBottom: 20,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});