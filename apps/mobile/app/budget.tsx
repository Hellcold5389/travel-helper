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
import { Svg, Circle, Path, G } from 'react-native-svg';
import { api } from '../src/api/client';
import { colors } from '../src/constants/colors';

interface BudgetBreakdown {
  accommodation: { label: string; amount: number; percentage: number };
  food: { label: string; amount: number; percentage: number };
  transport: { label: string; amount: number; percentage: number };
  activities: { label: string; amount: number; percentage: number };
  shopping: { label: string; amount: number; percentage: number };
  flight: { label: string; amount: number; percentage: number };
}

interface BudgetResponse {
  success: boolean;
  data: {
    destination: string;
    countryCode: string;
    days: number;
    travelers: number;
    budgetLevel: string;
    currency: string;
    currencySymbol: string;
    breakdown: BudgetBreakdown;
    totalPerPerson: number;
    grandTotal: number;
    tips: string[];
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

const BUDGET_LEVELS = [
  { value: 'low', label: '省錢', icon: '💰', desc: '背包客、青年旅館' },
  { value: 'medium', label: '一般', icon: '💵', desc: '舒適飯店、餐廳用餐' },
  { value: 'high', label: '豪華', icon: '💎', desc: '精品酒店、私人導遊' },
];

const CURRENCIES = [
  { value: 'TWD', label: '台幣', symbol: 'NT$', flag: '🇹🇼' },
  { value: 'HKD', label: '港幣', symbol: 'HK$', flag: '🇭🇰' },
  { value: 'USD', label: '美金', symbol: 'US$', flag: '🇺🇸' },
];

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: '#3B82F6',
  food: '#F59E0B',
  transport: '#10B981',
  activities: '#8B5CF6',
  shopping: '#EC4899',
  flight: '#6366F1',
};

const PieChart = ({ data, size = 120 }: { data: { key: string; value: number; color: string }[]; size?: number }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90;

  const paths = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return { path: pathD, color: item.color, key: item.key, percentage: Math.round(percentage * 100) };
  });

  return (
    <Svg width={size} height={size}>
      <G>
        {paths.map((p, i) => (
          <Path key={i} d={p.path} fill={p.color} />
        ))}
        <Circle cx={centerX} cy={centerY} r={radius * 0.4} fill={colors.card} />
      </G>
    </Svg>
  );
};

export default function BudgetScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'country' | 'details' | 'level' | 'result'>('country');
  const [country, setCountry] = useState('');
  const [days, setDays] = useState('5');
  const [travelers, setTravelers] = useState('2');
  const [budgetLevel, setBudgetLevel] = useState('medium');
  const [currency, setCurrency] = useState('TWD');
  const [includeFlights, setIncludeFlights] = useState(true);
  const [result, setResult] = useState<BudgetResponse['data'] | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (): Promise<BudgetResponse> => {
      const response = await api.post('/api/budget', {
        destination: country,
        countryCode: country,
        days: parseInt(days, 10),
        travelers: parseInt(travelers, 10),
        budgetLevel,
        currency,
        includeFlights,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setResult(data.data);
        setStep('result');
      }
    },
  });

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
              setStep('details');
            }}
          >
            <Text style={styles.countryFlag}>{c.flag}</Text>
            <Text style={styles.countryName}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetailsInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>行程細節</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>天數</Text>
        <View style={styles.row}>
          {[3, 5, 7, 10, 14].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayButton, days === String(d) && styles.dayButtonActive]}
              onPress={() => setDays(String(d))}
            >
              <Text style={[styles.dayText, days === String(d) && styles.dayTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>人數</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.dayButton, travelers === String(t) && styles.dayButtonActive]}
              onPress={() => setTravelers(String(t))}
            >
              <Text style={[styles.dayText, travelers === String(t) && styles.dayTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>顯示貨幣</Text>
        <View style={styles.row}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.currencyButton, currency === c.value && styles.currencyButtonActive]}
              onPress={() => setCurrency(c.value)}
            >
              <Text style={styles.currencyFlag}>{c.flag}</Text>
              <Text style={[styles.currencyLabel, currency === c.value && styles.currencyLabelActive]}>
                {c.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => setIncludeFlights(!includeFlights)}
        >
          <Text style={styles.switchLabel}>✈️ 包含機票費用</Text>
          <View style={[styles.switch, includeFlights && styles.switchActive]}>
            <View style={[styles.switchDot, includeFlights && styles.switchDotActive]} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={() => setStep('level')}>
        <Text style={styles.nextButtonText}>下一步</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLevelSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>預算等級</Text>
      <View style={styles.levelContainer}>
        {BUDGET_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[styles.levelButton, budgetLevel === level.value && styles.levelButtonActive]}
            onPress={() => setBudgetLevel(level.value)}
          >
            <Text style={styles.levelIcon}>{level.icon}</Text>
            <Text style={styles.levelLabel}>{level.label}</Text>
            <Text style={styles.levelDesc}>{level.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.calculateButton}
        onPress={() => calculateMutation.mutate()}
        disabled={calculateMutation.isPending}
      >
        {calculateMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.calculateButtonText}>💰 試算預算</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <View style={styles.resultContainer}>
        <ScrollView>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>💰 預算試算結果</Text>
            <Text style={styles.resultSubtitle}>
              {COUNTRIES.find((c) => c.code === country)?.name} · {result.days} 天 · {result.travelers} 人
            </Text>
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>總預算</Text>
            <Text style={styles.totalAmount}>
              {result.currencySymbol} {result.grandTotal.toLocaleString()}
            </Text>
            <Text style={styles.perPerson}>
              每人 {result.currencySymbol} {result.totalPerPerson.toLocaleString()}
            </Text>
          </View>

          <View style={styles.breakdownSection}>
            <Text style={styles.breakdownTitle}>費用明細</Text>
            {Object.entries(result.breakdown)
              .filter(([_, value]) => value.amount > 0)
              .map(([key, value]) => (
                <View key={key} style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View
                      style={[
                        styles.breakdownDot,
                        { backgroundColor: CATEGORY_COLORS[key] || colors.primary },
                      ]}
                    />
                    <Text style={styles.breakdownLabel}>{value.label}</Text>
                  </View>
                  <Text style={styles.breakdownAmount}>
                    {result.currencySymbol} {value.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>費用比例</Text>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={Object.entries(result.breakdown)
                  .filter(([_, value]) => value.amount > 0)
                  .map(([key, value]) => ({
                    key,
                    value: value.amount,
                    color: CATEGORY_COLORS[key] || colors.primary,
                  }))
                }
                size={140}
              />
            </View>
            <View style={styles.legendContainer}>
              {Object.entries(result.breakdown)
                .filter(([_, value]) => value.amount > 0)
                .map(([key, value]) => (
                  <View key={key} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[key] || colors.primary }]} />
                    <Text style={styles.legendLabel}>{value.label}</Text>
                    <Text style={styles.legendPercentage}>
                      {Math.round((value.amount / (result.totalPerPerson || 1)) * 100)}%
                    </Text>
                  </View>
                ))}
            </View>
          </View>

          {result.tips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 小撇步</Text>
              {result.tips.map((tip, index) => (
                <Text key={index} style={styles.tipText}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setStep('country');
            setCountry('');
            setResult(null);
          }}
        >
          <Text style={styles.resetButtonText}>重新試算</Text>
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
        <Text style={styles.headerTitle}>預算試算</Text>
        <View style={{ width: 50 }} />
      </View>

      {step === 'country' && renderCountrySelection()}
      {step === 'details' && renderDetailsInput()}
      {step === 'level' && renderLevelSelection()}
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
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextActive: {
    color: 'white',
  },
  currencyButton: {
    width: 70,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  currencyFlag: {
    fontSize: 20,
    marginBottom: 4,
  },
  currencyLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  currencyLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  switchDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  switchDotActive: {
    transform: [{ translateX: 22 }],
  },
  nextButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  levelContainer: {
    gap: 12,
  },
  levelButton: {
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  levelIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  levelDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  calculateButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  calculateButtonText: {
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
  totalCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  perPerson: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  breakdownSection: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  breakdownLabel: {
    fontSize: 16,
    color: colors.text,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chartSection: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.text,
  },
  legendPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  tipsSection: {
    margin: 16,
    padding: 16,
    backgroundColor: `${colors.warning}15`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 4,
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