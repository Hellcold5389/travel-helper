import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, countryFlags } from '../src/theme/colors';
import { Button, Card, Badge, Loading, SectionHeader } from '../src/components/ui';
import {
  useCountries,
  useCreateDraft,
  useUpdateDraft,
  useGenerateTrip,
} from '../src/api/queries';
import type { TripPlanResult, Country } from '../src/api/types';

// Steps in the trip planning flow
type Step = 'destination' | 'days' | 'budget' | 'styles' | 'generating' | 'result';

// Budget levels
const BUDGET_OPTIONS = [
  { value: 'LOW', label: '省錢', emoji: '💰', desc: '背包客風格' },
  { value: 'MEDIUM', label: '舒適', emoji: '💎', desc: '平衡品質與預算' },
  { value: 'HIGH', label: '奢華', emoji: '👑', desc: '享受頂級體驗' },
];

// Travel styles
const TRAVEL_STYLES = [
  { value: 'CULTURE', label: '文化探索', emoji: '🏛️' },
  { value: 'FOOD', label: '美食之旅', emoji: '🍜' },
  { value: 'NATURE', label: '自然景觀', emoji: '🏔️' },
  { value: 'SHOPPING', label: '購物血拼', emoji: '🛍️' },
  { value: 'ADVENTURE', label: '冒險活動', emoji: '🎯' },
  { value: 'RELAXATION', label: '休閒度假', emoji: '🏖️' },
  { value: 'NIGHTLIFE', label: '夜生活', emoji: '🌙' },
  { value: 'PHOTOGRAPHY', label: '攝影打卡', emoji: '📸' },
];

// Day options
const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 21];

// Popular destinations for quick select
const POPULAR_DESTINATIONS = [
  { code: 'JP', name: '日本', cities: ['東京', '大阪', '京都', '北海道', '沖繩'] },
  { code: 'KR', name: '韓國', cities: ['首爾', '釜山', '濟州'] },
  { code: 'TH', name: '泰國', cities: ['曼谷', '清邁', '普吉島'] },
  { code: 'SG', name: '新加坡', cities: ['新加坡'] },
  { code: 'HK', name: '香港', cities: ['香港'] },
  { code: 'VN', name: '越南', cities: ['河內', '胡志明市', '峴港'] },
];

export default function TripScreen() {
  // State
  const [step, setStep] = useState<Step>('destination');
  const [destination, setDestination] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [days, setDays] = useState<number>(3);
  const [budget, setBudget] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['CULTURE', 'FOOD']);
  const [tripResult, setTripResult] = useState<TripPlanResult | null>(null);
  const [destinationSuggestions, setDestinationSuggestions] = useState<typeof POPULAR_DESTINATIONS>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  // Queries & Mutations
  const { data: countries, isLoading: loadingCountries } = useCountries();
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const generateTrip = useGenerateTrip();

  // Match destination input to country
  const matchDestination = useCallback((input: string): Country | null => {
    if (!countries || !input.trim()) return null;
    
    const searchTerm = input.toLowerCase().trim();
    
    // Try exact match on country code
    const codeMatch = countries.find(c => c.code.toLowerCase() === searchTerm);
    if (codeMatch) return codeMatch;
    
    // Try match on name (English or Chinese)
    const nameMatch = countries.find(c => 
      c.name.toLowerCase().includes(searchTerm) ||
      (c.nameZh && c.nameZh.includes(searchTerm)) ||
      (c.nameZhHant && c.nameZhHant.includes(searchTerm))
    );
    if (nameMatch) return nameMatch;
    
    // Try match on popular destinations
    const popularMatch = POPULAR_DESTINATIONS.find(p => 
      p.name.includes(searchTerm) || 
      p.cities.some(city => city.includes(searchTerm))
    );
    if (popularMatch) {
      return countries.find(c => c.code === popularMatch.code) || null;
    }
    
    return null;
  }, [countries]);

  // Handle destination input change
  const handleDestinationChange = (text: string) => {
    setDestination(text);
    
    if (text.length >= 1) {
      const suggestions = POPULAR_DESTINATIONS.filter(p => 
        p.name.includes(text) || 
        p.cities.some(c => c.includes(text)) ||
        p.code.toLowerCase().includes(text.toLowerCase())
      );
      setDestinationSuggestions(suggestions);
    } else {
      setDestinationSuggestions(POPULAR_DESTINATIONS);
    }
  };

  // Select a destination
  const selectDestination = async (country: Country) => {
    setSelectedCountry(country);
    setDestination(country.nameZh || country.name);
    
    // Create draft
    try {
      const draft = await createDraft.mutateAsync('mobile-user-temp');
      setDraftId(draft.id);
      
      // Update draft with destination
      await updateDraft.mutateAsync({
        telegramUserId: 'mobile-user-temp',
        step: 'DAYS',
        destination: country.name,
        countryCode: country.code,
      });
      
      setStep('days');
    } catch (error) {
      console.error('Error creating draft:', error);
      // Still proceed even if API fails
      setStep('days');
    }
  };

  // Select days
  const selectDays = async (selectedDays: number) => {
    setDays(selectedDays);
    
    if (draftId) {
      try {
        await updateDraft.mutateAsync({
          telegramUserId: 'mobile-user-temp',
          step: 'BUDGET',
          days: selectedDays,
        });
      } catch (error) {
        console.error('Error updating draft:', error);
      }
    }
    
    setStep('budget');
  };

  // Select budget
  const selectBudget = async (selectedBudget: 'LOW' | 'MEDIUM' | 'HIGH') => {
    setBudget(selectedBudget);
    
    if (draftId) {
      try {
        await updateDraft.mutateAsync({
          telegramUserId: 'mobile-user-temp',
          step: 'STYLES',
          budget: selectedBudget,
        });
      } catch (error) {
        console.error('Error updating draft:', error);
      }
    }
    
    setStep('styles');
  };

  // Toggle travel style
  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  // Generate trip
  const handleGenerateTrip = async () => {
    if (!draftId) return;
    
    setStep('generating');
    
    try {
      // Update draft with styles
      await updateDraft.mutateAsync({
        telegramUserId: 'mobile-user-temp',
        step: 'GENERATING',
        travelStyles: selectedStyles,
      });
      
      // Generate trip
      const result = await generateTrip.mutateAsync('mobile-user-temp');
      setTripResult(result);
      setStep('result');
    } catch (error) {
      console.error('Error generating trip:', error);
      Alert.alert('生成失敗', '無法生成行程，請稍後再試');
      setStep('styles');
    }
  };

  // Start over
  const handleStartOver = () => {
    setStep('destination');
    setDestination('');
    setSelectedCountry(null);
    setDays(3);
    setBudget('MEDIUM');
    setSelectedStyles(['CULTURE', 'FOOD']);
    setTripResult(null);
    setDraftId(null);
  };

  // Render destination selection
  const renderDestinationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>你想去哪裡？</Text>
      <Text style={styles.stepSubtitle}>輸入國家或城市名稱</Text>
      
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="例如：日本、首爾、泰國..."
          placeholderTextColor={colors.gray400}
          value={destination}
          onChangeText={handleDestinationChange}
          autoFocus
        />
        {destination.length > 0 && (
          <TouchableOpacity onPress={() => setDestination('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick select */}
      <SectionHeader title="熱門目的地" style={styles.sectionHeader} />
      <View style={styles.countriesGrid}>
        {POPULAR_DESTINATIONS.map((dest) => (
          <TouchableOpacity
            key={dest.code}
            style={styles.countryCard}
            onPress={() => {
              const country = countries?.find(c => c.code === dest.code);
              if (country) selectDestination(country);
            }}
          >
            <Text style={styles.countryFlag}>{countryFlags[dest.code] || '🌍'}</Text>
            <Text style={styles.countryName}>{dest.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Destination suggestions */}
      {destination.length >= 1 && destinationSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {destinationSuggestions.map((dest) => (
            <TouchableOpacity
              key={dest.code}
              style={styles.suggestionItem}
              onPress={() => {
                const country = countries?.find(c => c.code === dest.code);
                if (country) selectDestination(country);
              }}
            >
              <Text style={styles.suggestionFlag}>{countryFlags[dest.code] || '🌍'}</Text>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionName}>{dest.name}</Text>
                <Text style={styles.suggestionCities}>{dest.cities.slice(0, 3).join(' • ')}</Text>
              </View>
              <Text style={styles.suggestionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // Render days selection
  const renderDaysStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('destination')}>
        <Text style={styles.backIcon}>←</Text>
        <Text style={styles.backText}>返回</Text>
      </TouchableOpacity>
      
      <View style={styles.selectedDest}>
        <Text style={styles.selectedFlag}>{selectedCountry ? countryFlags[selectedCountry.code] : '🌍'}</Text>
        <Text style={styles.selectedName}>{selectedCountry?.nameZh || selectedCountry?.name}</Text>
      </View>
      
      <Text style={styles.stepTitle}>計劃旅行幾天？</Text>
      <Text style={styles.stepSubtitle}>選擇你的旅程天數</Text>
      
      <View style={styles.daysGrid}>
        {DAY_OPTIONS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayOption, days === day && styles.dayOptionSelected]}
            onPress={() => selectDays(day)}
          >
            <Text style={[styles.dayText, days === day && styles.dayTextSelected]}>
              {day} 天
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render budget selection
  const renderBudgetStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('days')}>
        <Text style={styles.backIcon}>←</Text>
        <Text style={styles.backText}>返回</Text>
      </TouchableOpacity>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryFlag}>{selectedCountry ? countryFlags[selectedCountry.code] : '🌍'}</Text>
        <Text style={styles.summaryDest}>{selectedCountry?.nameZh || selectedCountry?.name}</Text>
        <Text style={styles.summaryDivider}>•</Text>
        <Text style={styles.summaryDays}>{days} 天</Text>
      </View>
      
      <Text style={styles.stepTitle}>你的預算等級？</Text>
      <Text style={styles.stepSubtitle}>選擇適合你的旅遊預算</Text>
      
      <View style={styles.budgetOptions}>
        {BUDGET_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.budgetCard, budget === option.value && styles.budgetCardSelected]}
            onPress={() => selectBudget(option.value as 'LOW' | 'MEDIUM' | 'HIGH')}
          >
            <Text style={styles.budgetEmoji}>{option.emoji}</Text>
            <Text style={[styles.budgetLabel, budget === option.value && styles.budgetLabelSelected]}>
              {option.label}
            </Text>
            <Text style={styles.budgetDesc}>{option.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render styles selection
  const renderStylesStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('budget')}>
        <Text style={styles.backIcon}>←</Text>
        <Text style={styles.backText}>返回</Text>
      </TouchableOpacity>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryFlag}>{selectedCountry ? countryFlags[selectedCountry.code] : '🌍'}</Text>
        <Text style={styles.summaryDest}>{selectedCountry?.nameZh || selectedCountry?.name}</Text>
        <Text style={styles.summaryDivider}>•</Text>
        <Text style={styles.summaryDays}>{days} 天</Text>
        <Text style={styles.summaryDivider}>•</Text>
        <Text style={styles.summaryBudget}>
          {BUDGET_OPTIONS.find(b => b.value === budget)?.label}
        </Text>
      </View>
      
      <Text style={styles.stepTitle}>旅遊風格？</Text>
      <Text style={styles.stepSubtitle}>選擇你喜歡的旅遊方式（可多選）</Text>
      
      <View style={styles.stylesGrid}>
        {TRAVEL_STYLES.map((style) => (
          <TouchableOpacity
            key={style.value}
            style={[
              styles.styleCard,
              selectedStyles.includes(style.value) && styles.styleCardSelected,
            ]}
            onPress={() => toggleStyle(style.value)}
          >
            <Text style={styles.styleEmoji}>{style.emoji}</Text>
            <Text style={[
              styles.styleLabel,
              selectedStyles.includes(style.value) && styles.styleLabelSelected,
            ]}>
              {style.label}
            </Text>
            {selectedStyles.includes(style.value) && (
              <View style={styles.styleCheckmark}>
                <Text style={styles.styleCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <Button
        title="生成行程 ✨"
        onPress={handleGenerateTrip}
        loading={generateTrip.isPending}
        disabled={selectedStyles.length === 0}
        style={styles.generateButton}
      />
    </View>
  );

  // Render generating state
  const renderGeneratingStep = () => (
    <View style={styles.generatingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.generatingTitle}>AI 正在規劃你的旅程...</Text>
      <Text style={styles.generatingSubtitle}>
        🌍 {selectedCountry?.nameZh || selectedCountry?.name} • {days} 天
      </Text>
      <Text style={styles.generatingHint}>這可能需要幾秒鐘，請稍候...</Text>
    </View>
  );

  // Render trip result
  const renderResultStep = () => {
    if (!tripResult) return null;
    
    return (
      <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultFlag}>{countryFlags[tripResult.countryCode] || '🌍'}</Text>
          <Text style={styles.resultTitle}>{tripResult.destination}</Text>
          <View style={styles.resultMeta}>
            <Badge text={`${tripResult.days} 天`} variant="info" />
            <Badge 
              text={BUDGET_OPTIONS.find(b => b.value === tripResult.budget)?.label || tripResult.budget} 
              variant="success" 
            />
          </View>
        </View>
        
        {/* Travel styles */}
        {tripResult.travelStyles && tripResult.travelStyles.length > 0 && (
          <View style={styles.resultSection}>
            <SectionHeader title="旅遊風格" />
            <View style={styles.stylesRow}>
              {tripResult.travelStyles.map((style) => (
                <Badge
                  key={style}
                  text={TRAVEL_STYLES.find(s => s.value === style)?.label || style}
                  variant="default"
                />
              ))}
            </View>
          </View>
        )}
        
        {/* Itinerary */}
        <View style={styles.resultSection}>
          <SectionHeader title="行程安排" />
          <Card style={styles.itineraryCard}>
            <Text style={styles.itineraryText}>{tripResult.itineraryText}</Text>
          </Card>
        </View>
        
        {/* Fun Facts */}
        {tripResult.funFacts && tripResult.funFacts.length > 0 && (
          <View style={styles.resultSection}>
            <SectionHeader title="趣味知識" />
            {tripResult.funFacts.map((fact, index) => (
              <Card key={index} style={styles.factCard}>
                <Text style={styles.factCategory}>{fact.category}</Text>
                <Text style={styles.factContent}>{fact.content}</Text>
              </Card>
            ))}
          </View>
        )}
        
        {/* Warnings */}
        {tripResult.warnings && tripResult.warnings.length > 0 && (
          <View style={styles.resultSection}>
            <SectionHeader title="⚠️ 注意事項" />
            {tripResult.warnings.map((warning, index) => (
              <Card key={index} style={styles.warningCard}>
                <Text style={styles.warningTitle}>{warning.title}</Text>
                <Text style={styles.warningDesc}>{warning.description}</Text>
              </Card>
            ))}
          </View>
        )}
        
        {/* Actions */}
        <View style={styles.resultActions}>
          <Button
            title="重新規劃"
            onPress={handleStartOver}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="儲存行程"
            onPress={() => Alert.alert('功能開發中', '儲存功能即將推出')}
            style={styles.actionButton}
          />
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  // Main render
  const renderStep = () => {
    switch (step) {
      case 'destination':
        return renderDestinationStep();
      case 'days':
        return renderDaysStep();
      case 'budget':
        return renderBudgetStep();
      case 'styles':
        return renderStylesStep();
      case 'generating':
        return renderGeneratingStep();
      case 'result':
        return renderResultStep();
      default:
        return renderDestinationStep();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  
  // Step container
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  
  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 20,
    color: colors.primary,
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.gray400,
    padding: 4,
  },
  
  // Countries grid
  sectionHeader: {
    marginTop: 24,
  },
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  countryCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 80,
  },
  countryFlag: {
    fontSize: 32,
    marginBottom: 4,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  
  // Suggestions
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  suggestionCities: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  suggestionArrow: {
    fontSize: 18,
    color: colors.gray400,
  },
  
  // Selected destination
  selectedDest: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  
  // Days grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  dayOption: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dayOptionSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.white,
  },
  
  // Summary row
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  summaryDest: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryDivider: {
    fontSize: 14,
    color: colors.gray400,
    marginHorizontal: 8,
  },
  summaryDays: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryBudget: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Budget options
  budgetOptions: {
    gap: 12,
    marginTop: 8,
  },
  budgetCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  budgetCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  budgetEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  budgetLabelSelected: {
    color: colors.primary,
  },
  budgetDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Styles grid
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  styleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  styleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  styleLabelSelected: {
    color: colors.primary,
  },
  styleCheckmark: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleCheckText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  
  // Generate button
  generateButton: {
    marginTop: 24,
  },
  
  // Generating
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  generatingHint: {
    fontSize: 14,
    color: colors.textMuted,
  },
  
  // Result
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  resultFlag: {
    fontSize: 64,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  resultSection: {
    marginTop: 20,
  },
  stylesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itineraryCard: {
    padding: 20,
  },
  itineraryText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  factCard: {
    marginTop: 8,
  },
  factCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  factContent: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  warningCard: {
    marginTop: 8,
    backgroundColor: colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});