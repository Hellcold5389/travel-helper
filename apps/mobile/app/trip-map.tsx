import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { Button, Card, Badge, SectionHeader, Loading } from '../src/components/ui';
import { TripMap, MapLegend, MapPlace } from '../src/components/Map';
// Region type is handled by Map component

const { width } = Dimensions.get('window');

// Demo trip data for preview
const DEMO_TRIP = {
  id: 'demo-trip-1',
  title: '東京 5 日遊',
  destination: '東京',
  countryCode: 'JP',
  startDate: '2026-04-15',
  endDate: '2026-04-19',
  places: [
    {
      id: '1',
      name: '淺草寺',
      address: '東京都台東區淺草',
      lat: 35.7148,
      lng: 139.7967,
      type: 'ATTRACTION',
      day: 1,
      time: '09:00 - 11:00',
      rating: 4.5,
    },
    {
      id: '2',
      name: '東京晴空塔',
      address: '東京都墨田區押上',
      lat: 35.7101,
      lng: 139.8107,
      type: 'ATTRACTION',
      day: 1,
      time: '14:00 - 16:00',
      rating: 4.3,
    },
    {
      id: '3',
      name: '築地市場',
      address: '東京都中央區築地',
      lat: 35.6654,
      lng: 139.7707,
      type: 'RESTAURANT',
      day: 2,
      time: '08:00 - 10:00',
      rating: 4.6,
    },
    {
      id: '4',
      name: '澀谷十字路口',
      address: '東京都澀谷區',
      lat: 35.6595,
      lng: 139.7004,
      type: 'ATTRACTION',
      day: 2,
      time: '15:00 - 17:00',
      rating: 4.2,
    },
    {
      id: '5',
      name: '新宿御苑',
      address: '東京都新宿區',
      lat: 35.6852,
      lng: 139.7100,
      type: 'ATTRACTION',
      day: 3,
      time: '09:00 - 12:00',
      rating: 4.4,
    },
    {
      id: '6',
      name: '一蘭拉麵 新宿店',
      address: '東京都新宿區',
      lat: 35.6910,
      lng: 139.7010,
      type: 'RESTAURANT',
      day: 3,
      time: '18:00 - 19:00',
      rating: 4.1,
    },
    {
      id: '7',
      name: '東京迪士尼樂園',
      address: '千葉縣浦安市',
      lat: 35.6329,
      lng: 139.8804,
      type: 'ACTIVITY',
      day: 4,
      time: '09:00 - 21:00',
      rating: 4.7,
    },
    {
      id: '8',
      name: '銀座購物區',
      address: '東京都中央區銀座',
      lat: 35.6717,
      lng: 139.7650,
      type: 'SHOPPING',
      day: 5,
      time: '10:00 - 14:00',
      rating: 4.3,
    },
  ],
};

// Day tabs
const DAYS = ['全部', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

export default function TripMapScreen() {
  const [selectedDay, setSelectedDay] = useState<string>('全部');
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'split'>('split');

  // Filter places by day
  const filteredPlaces = useMemo(() => {
    if (selectedDay === '全部') {
      return DEMO_TRIP.places;
    }
    const dayNum = parseInt(selectedDay.replace('Day ', ''));
    return DEMO_TRIP.places.filter(p => p.day === dayNum);
  }, [selectedDay]);

  // Get unique types for legend
  const placeTypes = useMemo(() => {
    const types = new Set(DEMO_TRIP.places.map(p => p.type || 'OTHER'));
    return Array.from(types);
  }, []);

  // Handle marker press
  const handleMarkerPress = (place: MapPlace) => {
    setSelectedPlace(place);
  };

  // Open in Google Maps
  const openInGoogleMaps = (place: MapPlace) => {
    Alert.alert(
      '開啟導航',
      `是否要在 Google Maps 中查看 ${place.name}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '開啟',
          onPress: () => {
            // In a real app, this would use Linking.openURL
            // const url = Platform.select({
            //   ios: `maps://app?saddr=&daddr=${place.lat},${place.lng}`,
            //   android: `google.navigation:q=${place.lat},${place.lng}`,
            // });
            Alert.alert('提示', '導航功能需要實際裝置支援');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{DEMO_TRIP.title}</Text>
            <Text style={styles.subtitle}>
              {DEMO_TRIP.startDate} ~ {DEMO_TRIP.endDate}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'map' ? 'split' : 'map')}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === 'map' ? '📋 列表' : '🗺️ 全螢幕'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayTabs}
          contentContainerStyle={styles.dayTabsContent}
        >
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayTab, selectedDay === day && styles.dayTabActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={viewMode === 'map' ? styles.fullMap : styles.splitMap}>
        <TripMap
          places={filteredPlaces}
          onMarkerPress={handleMarkerPress}
          style={styles.map}
        />

        {/* Legend overlay */}
        <View style={styles.legendOverlay}>
          <MapLegend types={placeTypes} />
        </View>

        {/* Place count */}
        <View style={styles.placeCountBadge}>
          <Text style={styles.placeCountText}>
            {filteredPlaces.length} 個景點
          </Text>
        </View>
      </View>

      {/* Place list (split view) */}
      {viewMode === 'split' && (
        <View style={styles.placeList}>
          <SectionHeader title="景點列表" />
          <ScrollView style={styles.placeListScroll}>
            {filteredPlaces.map((place, index) => (
              <TouchableOpacity
                key={place.id}
                style={[
                  styles.placeCard,
                  selectedPlace?.id === place.id && styles.placeCardSelected,
                ]}
                onPress={() => setSelectedPlace(place)}
              >
                <View style={styles.placeCardHeader}>
                  <Text style={styles.placeCardDay}>Day {place.day}</Text>
                  <Badge text={place.type || '景點'} variant="default" />
                </View>
                <Text style={styles.placeCardName}>{place.name}</Text>
                <View style={styles.placeCardDetails}>
                  <Text style={styles.placeCardTime}>🕐 {place.time}</Text>
                  {place.rating && (
                    <Text style={styles.placeCardRating}>⭐ {place.rating}</Text>
                  )}
                </View>
                <View style={styles.placeCardActions}>
                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => openInGoogleMaps(place)}
                  >
                    <Text style={styles.navigateButtonText}>📍 導航</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Selected place detail (full map view) */}
      {viewMode === 'map' && selectedPlace && (
        <View style={styles.selectedPlaceCard}>
          <Card style={styles.selectedPlaceContent}>
            <View style={styles.selectedPlaceHeader}>
              <View>
                <Text style={styles.selectedPlaceDay}>Day {selectedPlace.day}</Text>
                <Text style={styles.selectedPlaceName}>{selectedPlace.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPlace(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedPlace.address && (
              <Text style={styles.selectedPlaceAddress}>{selectedPlace.address}</Text>
            )}
            <View style={styles.selectedPlaceInfo}>
              <Text style={styles.selectedPlaceTime}>🕐 {selectedPlace.time}</Text>
              {selectedPlace.rating && (
                <Text style={styles.selectedPlaceRating}>⭐ {selectedPlace.rating}</Text>
              )}
            </View>
            <Button
              title="開啟導航"
              onPress={() => openInGoogleMaps(selectedPlace)}
              style={styles.navigateButtonFull}
            />
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewToggle: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },

  // Day tabs
  dayTabs: {
    marginHorizontal: -16,
  },
  dayTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.gray100,
    borderRadius: 20,
    marginRight: 8,
  },
  dayTabActive: {
    backgroundColor: colors.primary,
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayTabTextActive: {
    color: colors.white,
  },

  // Map
  fullMap: {
    flex: 1,
  },
  splitMap: {
    height: '45%',
  },
  map: {
    flex: 1,
  },
  legendOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  placeCountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Place list
  placeList: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  placeListScroll: {
    flex: 1,
  },
  placeCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  placeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  placeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeCardDay: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  placeCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  placeCardDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  placeCardTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  placeCardRating: {
    fontSize: 13,
    color: colors.warning,
  },
  placeCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  navigateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navigateButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
  },

  // Selected place card (full map view)
  selectedPlaceCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  selectedPlaceContent: {
    padding: 16,
  },
  selectedPlaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  selectedPlaceDay: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  selectedPlaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedPlaceAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  selectedPlaceInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  selectedPlaceTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedPlaceRating: {
    fontSize: 14,
    color: colors.warning,
  },
  navigateButtonFull: {
    marginTop: 4,
  },
});