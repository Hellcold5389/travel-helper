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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { Button, Card, Badge, Loading, SectionHeader, Empty } from '../src/components/ui';
import {
  useFlightSearch,
  useTrackedFlights,
  useTrackFlight,
  useUntrackFlight,
  useUpdateFlightNotifications,
} from '../src/api/queries';
import type { FlightSearchResult, TrackedFlight } from '../src/api/types';

// Status emoji map
const STATUS_EMOJI: Record<string, string> = {
  SCHEDULED: '📅',
  ACTIVE: '🛫',
  LANDED: '✅',
  CANCELLED: '❌',
  DELAYED: '⏰',
  DIVERTED: '↪️',
  UNKNOWN: '❓',
};

// Status color map
const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: colors.info,
  ACTIVE: colors.primary,
  LANDED: colors.success,
  CANCELLED: colors.error,
  DELAYED: colors.warning,
  DIVERTED: colors.warning,
  UNKNOWN: colors.gray500,
};

// Status text map (Chinese)
const STATUS_TEXT: Record<string, string> = {
  SCHEDULED: '準時',
  ACTIVE: '飛行中',
  LANDED: '已降落',
  CANCELLED: '已取消',
  DELAYED: '延誤',
  DIVERTED: '轉降',
  UNKNOWN: '未知',
};

// Popular airlines
const POPULAR_AIRLINES = [
  { code: 'CI', name: '中華航空', country: '台灣' },
  { code: 'BR', name: '長榮航空', country: '台灣' },
  { code: 'JL', name: '日本航空', country: '日本' },
  { code: 'NH', name: '全日空', country: '日本' },
  { code: 'KE', name: '大韓航空', country: '韓國' },
  { code: 'OZ', name: '韓亞航空', country: '韓國' },
  { code: 'SQ', name: '新加坡航空', country: '新加坡' },
  { code: 'CX', name: '國泰航空', country: '香港' },
];

// Temp user ID for demo
const TEMP_USER_ID = 'mobile-user-temp';

export default function FlightScreen() {
  const [view, setView] = useState<'search' | 'tracked'>('tracked');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<FlightSearchResult | null>(null);

  // Queries
  const { data: trackedData, isLoading: loadingTracked, refetch } = useTrackedFlights(TEMP_USER_ID);
  const { data: searchResult, isLoading: searching, refetch: doSearch } = useFlightSearch(
    searchQuery,
    searchDate || undefined
  );

  // Mutations
  const trackFlight = useTrackFlight();
  const untrackFlight = useUntrackFlight();
  const updateNotifications = useUpdateFlightNotifications();

  // Tracked flights
  const trackedFlights = trackedData?.flights || [];

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchQuery.length >= 2) {
      doSearch();
    }
  }, [searchQuery, searchDate, doSearch]);

  // Handle track flight
  const handleTrackFlight = async () => {
    if (!selectedFlight) return;

    try {
      await trackFlight.mutateAsync({
        telegramId: TEMP_USER_ID,
        flightNumber: selectedFlight.flightIata || searchQuery,
        flightDate: searchDate || new Date().toISOString().split('T')[0],
      });
      Alert.alert('成功', '已開始追蹤航班');
      setSelectedFlight(null);
      setSearchQuery('');
      setView('tracked');
    } catch (error) {
      Alert.alert('錯誤', '追蹤失敗，請稍後再試');
    }
  };

  // Handle untrack flight
  const handleUntrackFlight = (flight: TrackedFlight) => {
    Alert.alert(
      '取消追蹤',
      `確定要取消追蹤 ${flight.flightNumber} 嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            try {
              await untrackFlight.mutateAsync({
                flightId: flight.id,
                telegramId: TEMP_USER_ID,
              });
            } catch (error) {
              Alert.alert('錯誤', '取消追蹤失敗');
            }
          },
        },
      ]
    );
  };

  // Render tracked flights list
  const renderTrackedFlights = () => {
    if (loadingTracked) {
      return <Loading message="載入航班列表..." />;
    }

    if (trackedFlights.length === 0) {
      return (
        <Empty
          icon="✈️"
          message="尚未追蹤任何航班"
          action={{
            label: '搜尋航班',
            onPress: () => setView('search'),
          }}
        />
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {trackedFlights.map((flight) => (
          <Card key={flight.id} style={styles.flightCard}>
            <View style={styles.flightHeader}>
              <View style={styles.flightNumberRow}>
                <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
                <Badge
                  text={STATUS_TEXT[flight.status] || flight.status}
                  variant={
                    flight.status === 'LANDED' ? 'success' :
                    flight.status === 'CANCELLED' ? 'error' :
                    flight.status === 'DELAYED' ? 'warning' : 'info'
                  }
                />
              </View>
              <TouchableOpacity onPress={() => handleUntrackFlight(flight)}>
                <Text style={styles.untrackButton}>取消追蹤</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.flightRoute}>
              <View style={styles.airportInfo}>
                <Text style={styles.airportCode}>{flight.departureAirport}</Text>
                <Text style={styles.airportTime}>
                  {flight.departureTime
                    ? new Date(flight.departureTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </Text>
              </View>
              
              <View style={styles.routeLine}>
                <View style={styles.routeDot} />
                <Text style={styles.routeArrow}>✈️</Text>
                <View style={styles.routeDot} />
              </View>
              
              <View style={styles.airportInfo}>
                <Text style={styles.airportCode}>{flight.arrivalAirport}</Text>
                <Text style={styles.airportTime}>
                  {flight.arrivalTime
                    ? new Date(flight.arrivalTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </Text>
              </View>
            </View>

            <View style={styles.flightDetails}>
              <Text style={styles.flightDate}>📅 {flight.flightDate}</Text>
              {flight.departureGate && (
                <Text style={styles.gateInfo}>🚪 登機門: {flight.departureGate}</Text>
              )}
              {flight.delayMinutes && flight.delayMinutes > 0 && (
                <Text style={styles.delayInfo}>⚠️ 延誤 {flight.delayMinutes} 分鐘</Text>
              )}
            </View>

            {/* Notification toggles */}
            <View style={styles.notificationToggles}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>延誤通知</Text>
                <Switch
                  value={flight.notifyDelay}
                  onValueChange={(value) => {
                    updateNotifications.mutate({
                      flightId: flight.id,
                      telegramId: TEMP_USER_ID,
                      notifyDelay: value,
                    });
                  }}
                  trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                  thumbColor={flight.notifyDelay ? colors.primary : colors.gray100}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>登機門變更</Text>
                <Switch
                  value={flight.notifyGate}
                  onValueChange={(value) => {
                    updateNotifications.mutate({
                      flightId: flight.id,
                      telegramId: TEMP_USER_ID,
                      notifyGate: value,
                    });
                  }}
                  trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                  thumbColor={flight.notifyGate ? colors.primary : colors.gray100}
                />
              </View>
            </View>
          </Card>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  // Render search view
  const renderSearchView = () => (
    <KeyboardAvoidingView
      style={styles.searchContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchLabel}>航班號</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="例如：CI123、BR892"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchLabel}>日期（選填）</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.gray400}
            value={searchDate}
            onChangeText={setSearchDate}
          />
        </View>

        <Button
          title="搜尋航班"
          onPress={handleSearch}
          disabled={searchQuery.length < 2}
          loading={searching}
          style={styles.searchButton}
        />

        {/* Popular airlines */}
        <SectionHeader title="熱門航空" style={styles.sectionHeader} />
        <View style={styles.airlinesGrid}>
          {POPULAR_AIRLINES.map((airline) => (
            <TouchableOpacity
              key={airline.code}
              style={styles.airlineChip}
              onPress={() => setSearchQuery(airline.code)}
            >
              <Text style={styles.airlineCode}>{airline.code}</Text>
              <Text style={styles.airlineName}>{airline.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search result */}
        {searchResult && (
          <View style={styles.searchResult}>
            <SectionHeader title="搜尋結果" />
            <Card style={styles.resultCard}>
              <View style={styles.flightHeader}>
                <Text style={styles.flightNumber}>{searchResult.flightIata}</Text>
                <Badge
                  text={STATUS_TEXT[searchResult.status] || searchResult.status}
                  variant={
                    searchResult.status === 'LANDED' ? 'success' :
                    searchResult.status === 'CANCELLED' ? 'error' :
                    searchResult.status === 'DELAYED' ? 'warning' : 'info'
                  }
                />
              </View>

              {searchResult.airline && (
                <Text style={styles.airlineText}>{searchResult.airline}</Text>
              )}

              <View style={styles.flightRoute}>
                <View style={styles.airportInfo}>
                  <Text style={styles.airportCode}>{searchResult.departure?.iata || '---'}</Text>
                  <Text style={styles.airportName} numberOfLines={1}>
                    {searchResult.departure?.airport || ''}
                  </Text>
                </View>
                
                <Text style={styles.routeArrow}>→</Text>
                
                <View style={styles.airportInfo}>
                  <Text style={styles.airportCode}>{searchResult.arrival?.iata || '---'}</Text>
                  <Text style={styles.airportName} numberOfLines={1}>
                    {searchResult.arrival?.airport || ''}
                  </Text>
                </View>
              </View>

              {/* Departure details */}
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>🛫 出發</Text>
                {searchResult.departure?.scheduled && (
                  <Text style={styles.detailText}>
                    時間：{new Date(searchResult.departure.scheduled).toLocaleString('zh-TW')}
                  </Text>
                )}
                {searchResult.departure?.gate && (
                  <Text style={styles.detailText}>登機門：{searchResult.departure.gate}</Text>
                )}
                {searchResult.departure?.terminal && (
                  <Text style={styles.detailText}>航廈：{searchResult.departure.terminal}</Text>
                )}
              </View>

              {/* Arrival details */}
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>🛬 抵達</Text>
                {searchResult.arrival?.scheduled && (
                  <Text style={styles.detailText}>
                    時間：{new Date(searchResult.arrival.scheduled).toLocaleString('zh-TW')}
                  </Text>
                )}
                {searchResult.arrival?.gate && (
                  <Text style={styles.detailText}>登機門：{searchResult.arrival.gate}</Text>
                )}
                {searchResult.arrival?.terminal && (
                  <Text style={styles.detailText}>航廈：{searchResult.arrival.terminal}</Text>
                )}
              </View>

              <Button
                title="追蹤此航班"
                onPress={handleTrackFlight}
                loading={trackFlight.isPending}
                style={styles.trackButton}
              />
            </Card>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tab selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, view === 'tracked' && styles.tabActive]}
          onPress={() => setView('tracked')}
        >
          <Text style={[styles.tabText, view === 'tracked' && styles.tabTextActive]}>
            我的航班
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'search' && styles.tabActive]}
          onPress={() => setView('search')}
        >
          <Text style={[styles.tabText, view === 'search' && styles.tabTextActive]}>
            搜尋航班
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {view === 'tracked' ? renderTrackedFlights() : renderSearchView()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Tracked flights
  flightCard: {
    marginBottom: 12,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flightNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flightNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  untrackButton: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  airportInfo: {
    alignItems: 'center',
    flex: 1,
  },
  airportCode: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  airportTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  airportName: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray300,
  },
  routeArrow: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  flightDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  flightDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  gateInfo: {
    fontSize: 14,
    color: colors.info,
    fontWeight: '500',
  },
  delayInfo: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '600',
  },
  notificationToggles: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Search
  searchContainer: {
    flex: 1,
  },
  searchBox: {
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  searchButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  airlinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  airlineChip: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  airlineCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  airlineName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchResult: {
    marginTop: 8,
  },
  resultCard: {
    marginBottom: 16,
  },
  airlineText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  detailSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  trackButton: {
    marginTop: 16,
  },
  bottomPadding: {
    height: 40,
  },
});