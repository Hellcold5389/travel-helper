import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, countryFlags } from '../src/theme/colors';
import { Card, Button } from '../src/components/ui';

// Nationality options
const NATIONALITIES = [
  { code: 'TW', label: '🇹🇼 台灣' },
  { code: 'HK', label: '🇭🇰 香港' },
  { code: 'MO', label: '🇲🇴 澳門' },
  { code: 'CN', label: '🇨🇳 中國' },
  { code: 'US', label: '🇺🇸 美國' },
  { code: 'JP', label: '🇯🇵 日本' },
  { code: 'KR', label: '🇰🇷 韓國' },
  { code: 'SG', label: '🇸🇬 新加坡' },
  { code: 'MY', label: '🇲🇾 馬來西亞' },
];

// Currency options
const CURRENCIES = [
  { code: 'TWD', label: '🇹🇼 TWD 新台幣' },
  { code: 'HKD', label: '🇭🇰 HKD 港幣' },
  { code: 'USD', label: '🇺🇸 USD 美金' },
  { code: 'JPY', label: '🇯🇵 JPY 日圓' },
];

export default function SettingsScreen() {
  // Settings state (would come from API in production)
  const [nationality, setNationality] = useState('TW');
  const [currency, setCurrency] = useState('TWD');
  const [language, setLanguage] = useState('zh');
  const [visaExpiry, setVisaExpiry] = useState(true);
  const [policyChanges, setPolicyChanges] = useState(true);
  const [tripReminders, setTripReminders] = useState(true);
  
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const handleSave = () => {
    // TODO: Save to API
    Alert.alert('成功', '設定已儲存');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Nationality */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🛂 護照國籍</Text>
          <Text style={styles.cardSubtitle}>影響簽證查詢結果</Text>
          
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

        {/* Language & Currency */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🌐 語言與貨幣</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>語言</Text>
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleButton, language === 'zh' && styles.toggleButtonActive]}
                onPress={() => setLanguage('zh')}
              >
                <Text style={[styles.toggleText, language === 'zh' && styles.toggleTextActive]}>
                  中文
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, language === 'en' && styles.toggleButtonActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.toggleText, language === 'en' && styles.toggleTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.settingLabel}>預設貨幣</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          >
            <Text style={styles.selectorValue}>
              {CURRENCIES.find(c => c.code === currency)?.label || '選擇貨幣'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          {showCurrencyPicker && (
            <View style={styles.pickerOptions}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.pickerOption,
                    currency === c.code && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setCurrency(c.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    currency === c.code && styles.pickerOptionTextSelected,
                  ]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🔔 通知設定</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>簽證到期提醒</Text>
              <Text style={styles.settingHint}>護照到期前提醒換發</Text>
            </View>
            <Switch
              value={visaExpiry}
              onValueChange={setVisaExpiry}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={visaExpiry ? colors.primary : colors.gray100}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>政策變更通知</Text>
              <Text style={styles.settingHint}>簽證政策變更時通知</Text>
            </View>
            <Switch
              value={policyChanges}
              onValueChange={setPolicyChanges}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={policyChanges ? colors.primary : colors.gray100}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>行程提醒</Text>
              <Text style={styles.settingHint}>出發前提醒準備事項</Text>
            </View>
            <Switch
              value={tripReminders}
              onValueChange={setTripReminders}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={tripReminders ? colors.primary : colors.gray100}
            />
          </View>
        </Card>

        {/* Save Button */}
        <View style={styles.saveButton}>
          <Button title="儲存設定" onPress={handleSave} />
        </View>

        {/* Version */}
        <Text style={styles.version}>Travel Helper v0.1.0</Text>
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
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginTop: 8,
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
    maxHeight: 200,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: 4,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  version: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
});