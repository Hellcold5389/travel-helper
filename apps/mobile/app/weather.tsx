import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../src/api/client';
import { colors } from '../src/constants/colors';

interface ForecastDay {
  date: string;
  dayOfWeek: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
  description: string;
  icon: string;
  uvIndex: number;
  windSpeed: number;
}

interface WeatherResponse {
  success: boolean;
  data: {
    location: {
      country: string;
      city: string;
      countryCode: string;
    };
    current: {
      temperature: number;
      humidity: number;
      weatherCode: number;
      description: string;
      icon: string;
      windSpeed: number;
    };
    forecast: ForecastDay[];
    timezone: string;
    tips: string[];
  };
}

const COUNTRIES = [
  { code: 'JP', name: '日本', city: '東京', flag: '🇯🇵' },
  { code: 'KR', name: '韓國', city: '首爾', flag: '🇰🇷' },
  { code: 'TH', name: '泰國', city: '曼谷', flag: '🇹🇭' },
  { code: 'SG', name: '新加坡', city: '新加坡', flag: '🇸🇬' },
  { code: 'MY', name: '馬來西亞', city: '吉隆坡', flag: '🇲🇾' },
  { code: 'VN', name: '越南', city: '河內', flag: '🇻🇳' },
  { code: 'HK', name: '香港', city: '香港', flag: '🇭🇰' },
  { code: 'TW', name: '台灣', city: '台北', flag: '🇹🇼' },
  { code: 'US', name: '美國', city: '紐約', flag: '🇺🇸' },
  { code: 'GB', name: '英國', city: '倫敦', flag: '🇬🇧' },
];

const { width } = Dimensions.get('window');

export default function WeatherScreen() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<WeatherResponse>({
    queryKey: ['weather', selectedCountry],
    queryFn: async () => {
      const response = await api.get(`/api/weather/${selectedCountry}?days=7`);
      return response.data;
    },
    enabled: !!selectedCountry,
  });

  const weather = data?.data;

  const getTempColor = (temp: number): string => {
    if (temp <= 0) return '#3B82F6'; // Blue - Freezing
    if (temp <= 10) return '#60A5FA'; // Light blue - Cold
    if (temp <= 20) return '#34D399'; // Green - Mild
    if (temp <= 30) return '#F59E0B'; // Orange - Warm
    return '#EF4444'; // Red - Hot
  };

  const renderCountrySelection = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.selectionTitle}>選擇目的地</Text>
      <Text style={styles.selectionSubtitle}>查看 7 天天氣預報</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.countryList}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={styles.countryCard}
              onPress={() => setSelectedCountry(country.code)}
            >
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{country.name}</Text>
                <Text style={styles.countryCity}>{country.city}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderWeather = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>載入天氣資訊...</Text>
        </View>
      );
    }

    if (error || !weather) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>載入失敗</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>重試</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const country = COUNTRIES.find((c) => c.code === selectedCountry);

    return (
      <View style={styles.weatherContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Current Weather */}
          <View style={styles.currentSection}>
            <View style={styles.locationRow}>
              <Text style={styles.countryFlagLarge}>{country?.flag}</Text>
              <View>
                <Text style={styles.cityName}>{weather.location.city}</Text>
                <Text style={styles.countryNameSmall}>{weather.location.country}</Text>
              </View>
            </View>

            <View style={styles.currentMain}>
              <Text style={styles.currentIcon}>{weather.current.icon}</Text>
              <Text
                style={[
                  styles.currentTemp,
                  { color: getTempColor(weather.current.temperature) },
                ]}
              >
                {Math.round(weather.current.temperature)}°
              </Text>
              <Text style={styles.currentDesc}>{weather.current.description}</Text>
            </View>

            <View style={styles.currentDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💧</Text>
                <Text style={styles.detailValue}>{weather.current.humidity}%</Text>
                <Text style={styles.detailLabel}>濕度</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💨</Text>
                <Text style={styles.detailValue}>{Math.round(weather.current.windSpeed)}</Text>
                <Text style={styles.detailLabel}>風速 km/h</Text>
              </View>
            </View>
          </View>

          {/* 7-Day Forecast */}
          <View style={styles.forecastSection}>
            <Text style={styles.sectionTitle}>📅 7 天預報</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {weather.forecast.map((day, index) => (
                <View
                  key={day.date}
                  style={[
                    styles.forecastCard,
                    index === 0 && styles.forecastCardToday,
                  ]}
                >
                  <Text style={styles.forecastDay}>
                    {index === 0 ? '今天' : day.dayOfWeek}
                  </Text>
                  <Text style={styles.forecastIcon}>{day.icon}</Text>
                  <Text style={styles.forecastDesc}>{day.description}</Text>
                  <View style={styles.forecastTemps}>
                    <Text
                      style={[
                        styles.forecastMax,
                        { color: getTempColor(day.maxTemp) },
                      ]}
                    >
                      {Math.round(day.maxTemp)}°
                    </Text>
                    <Text style={styles.forecastMin}>{Math.round(day.minTemp)}°</Text>
                  </View>
                  {day.precipitation > 20 && (
                    <View style={styles.rainBadge}>
                      <Text style={styles.rainText}>☔ {day.precipitation}%</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Temperature Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>🌡️ 溫度趨勢</Text>
            <View style={styles.tempChart}>
              {weather.forecast.slice(0, 7).map((day, index) => {
                const maxTemp = Math.max(...weather.forecast.map((d) => d.maxTemp));
                const minTemp = Math.min(...weather.forecast.map((d) => d.minTemp));
                const range = maxTemp - minTemp;
                const highHeight = range > 0 ? ((day.maxTemp - minTemp) / range) * 80 + 20 : 50;
                const lowHeight = range > 0 ? ((day.minTemp - minTemp) / range) * 80 + 20 : 30;

                return (
                  <View key={day.date} style={styles.tempBar}>
                    <View style={styles.tempBarColumn}>
                      <View
                        style={[
                          styles.tempBarFill,
                          {
                            height: highHeight,
                            backgroundColor: getTempColor(day.maxTemp),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.tempBarDay}>
                      {index === 0 ? '今' : day.dayOfWeek}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Tips */}
          {weather.tips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>💡 旅行建議</Text>
              {weather.tips.map((tip, index) => (
                <Text key={index} style={styles.tipText}>
                  {tip}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.backToList}
          onPress={() => setSelectedCountry(null)}
        >
          <Text style={styles.backToListText}>← 選擇其他城市</Text>
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
        <Text style={styles.headerTitle}>天氣查詢</Text>
        <View style={{ width: 50 }} />
      </View>

      {selectedCountry ? renderWeather() : renderCountrySelection()}
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
  selectionContainer: {
    flex: 1,
    padding: 20,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  selectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  countryList: {
    gap: 12,
  },
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  countryFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  countryCity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  weatherContainer: {
    flex: 1,
  },
  currentSection: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryFlagLarge: {
    fontSize: 40,
    marginRight: 12,
  },
  cityName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  countryNameSmall: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  currentMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  currentTemp: {
    fontSize: 72,
    fontWeight: '200',
  },
  currentDesc: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },
  currentDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  forecastSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  forecastCard: {
    width: 90,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  forecastCardToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  forecastDay: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  forecastIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  forecastDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  forecastTemps: {
    flexDirection: 'row',
    gap: 8,
  },
  forecastMax: {
    fontSize: 16,
    fontWeight: '600',
  },
  forecastMin: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  rainBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 8,
  },
  rainText: {
    fontSize: 12,
    color: colors.primary,
  },
  chartSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  tempChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 16,
  },
  tempBar: {
    alignItems: 'center',
  },
  tempBarColumn: {
    width: 20,
    height: 100,
    backgroundColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  tempBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  tempBarDay: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  tipsSection: {
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: `${colors.warning}15`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  backToList: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backToListText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
});