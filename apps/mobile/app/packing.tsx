import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../src/api/client';
import { colors } from '../src/constants/colors';

interface PackingItem {
  item: string;
  checked: boolean;
  essential: boolean;
}

interface PackingList {
  [category: string]: PackingItem[];
}

interface PackingResponse {
  success: boolean;
  data: {
    destination: string;
    days: number;
    packingList: PackingList;
    totalItems: number;
    essentialItems: number;
  };
}

const COUNTRIES = [
  { code: 'JP', name: '日本', flag: '🇯🇵' },
  { code: 'KR', name: '韓國', flag: '🇰🇷' },
  { code: 'TH', name: '泰國', flag: '🇹🇭' },
  { code: 'SG', name: '新加坡', flag: '🇸🇬' },
  { code: 'MY', name: '馬來西亞', flag: '🇲🇾' },
  { code: 'VN', name: '越南', flag: '🇻🇳' },
  { code: 'HK', name: '香港', flag: '🇭🇰' },
  { code: 'US', name: '美國', flag: '🇺🇸' },
];

const SEASONS = [
  { value: 'spring', label: '春季', icon: '🌸' },
  { value: 'summer', label: '夏季', icon: '☀️' },
  { value: 'autumn', label: '秋季', icon: '🍂' },
  { value: 'winter', label: '冬季', icon: '❄️' },
];

const TRIP_TYPES = [
  { value: 'leisure', label: '休閒', icon: '🏖️' },
  { value: 'business', label: '商務', icon: '💼' },
  { value: 'adventure', label: '冒險', icon: '🏔️' },
  { value: 'shopping', label: '購物', icon: '🛍️' },
];

const CATEGORY_LABELS: Record<string, string> = {
  essentials: '📋 必備物品',
  clothing: '👕 衣物',
  toiletries: '🧴 盥洗用品',
  electronics: '📱 電子產品',
  medicine: '💊 藥品',
  documents: '📄 文件',
  business: '💼 商務用品',
  adventure: '🏔️ 冒險裝備',
  special: '⭐ 特殊需求',
};

export default function PackingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'country' | 'days' | 'season' | 'type' | 'result'>('country');
  const [country, setCountry] = useState('');
  const [days, setDays] = useState('');
  const [season, setSeason] = useState('summer');
  const [tripType, setTripType] = useState('leisure');
  const [packingList, setPackingList] = useState<PackingList>({});
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const generateMutation = useMutation({
    mutationFn: async (): Promise<PackingResponse> => {
      const response = await api.post('/api/packing-list', {
        destination: country,
        countryCode: country,
        days: parseInt(days, 10),
        season,
        tripType: [tripType],
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setPackingList(data.data.packingList);
        setStep('result');
      }
    },
  });

  const toggleItem = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  const renderCountrySelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>要去哪裡？</Text>
      <View style={styles.countryGrid}>
        {COUNTRIES.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[styles.countryButton, country === c.code && styles.countryButtonActive]}
            onPress={() => {
              setCountry(c.code);
              setStep('days');
            }}
          >
            <Text style={styles.countryFlag}>{c.flag}</Text>
            <Text style={styles.countryName}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDaysInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>去幾天？</Text>
      <TextInput
        style={styles.input}
        value={days}
        onChangeText={setDays}
        placeholder="輸入天數 (1-30)"
        keyboardType="numeric"
        maxLength={2}
      />
      <View style={styles.quickDays}>
        {[3, 5, 7, 10].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.quickDayButton, days === String(d) && styles.quickDayButtonActive]}
            onPress={() => setDays(String(d))}
          >
            <Text style={styles.quickDayText}>{d} 天</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => days && setStep('season')}
        disabled={!days}
      >
        <Text style={styles.nextButtonText}>下一步</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSeasonSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>什麼季節？</Text>
      <View style={styles.optionsGrid}>
        {SEASONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.optionButton, season === s.value && styles.optionButtonActive]}
            onPress={() => setSeason(s.value)}
          >
            <Text style={styles.optionIcon}>{s.icon}</Text>
            <Text style={styles.optionLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.nextButton} onPress={() => setStep('type')}>
        <Text style={styles.nextButtonText}>下一步</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>旅遊類型？</Text>
      <View style={styles.optionsGrid}>
        {TRIP_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.optionButton, tripType === t.value && styles.optionButtonActive]}
            onPress={() => setTripType(t.value)}
          >
            <Text style={styles.optionIcon}>{t.icon}</Text>
            <Text style={styles.optionLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.generateButton}
        onPress={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
      >
        {generateMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.generateButtonText}>🎒 生成打包清單</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => {
    const totalItems = Object.values(packingList).flat().length;
    const checkedCount = checkedItems.size;

    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>🎒 打包清單</Text>
          <Text style={styles.resultSubtitle}>
            {COUNTRIES.find((c) => c.code === country)?.name} · {days} 天
          </Text>
          <Text style={styles.progressText}>
            已打包 {checkedCount} / {totalItems} 項
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(checkedCount / totalItems) * 100}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView style={styles.listContainer}>
          {Object.entries(packingList).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {CATEGORY_LABELS[category] || category}
              </Text>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={`${category}-${index}`}
                  style={styles.itemRow}
                  onPress={() => toggleItem(item.item)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checkedItems.has(item.item) && styles.checkboxChecked,
                    ]}
                  >
                    {checkedItems.has(item.item) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.itemText,
                      item.essential && styles.itemEssential,
                      checkedItems.has(item.item) && styles.itemChecked,
                    ]}
                  >
                    {item.item}
                  </Text>
                  {item.essential && <Text style={styles.essentialBadge}>必備</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setStep('country');
            setCountry('');
            setDays('');
            setCheckedItems(new Set());
          }}
        >
          <Text style={styles.resetButtonText}>重新生成</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>打包清單</Text>
        <View style={{ width: 50 }} />
      </View>

      {step === 'country' && renderCountrySelection()}
      {step === 'days' && renderDaysInput()}
      {step === 'season' && renderSeasonSelection()}
      {step === 'type' && renderTypeSelection()}
      {step === 'result' && renderResult()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  countryButton: {
    width: '48%',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  countryFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  countryName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  quickDays: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  quickDayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 20,
  },
  quickDayButtonActive: {
    backgroundColor: colors.primary,
  },
  quickDayText: {
    color: colors.text,
    fontWeight: '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionButton: {
    width: '48%',
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  resultSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  itemEssential: {
    fontWeight: '500',
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  essentialBadge: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
});