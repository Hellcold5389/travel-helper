// Map Components
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

// Default region (Taiwan)
const DEFAULT_REGION: Region = {
  latitude: 23.5,
  longitude: 121,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

// ============================================
// Types
// ============================================

export interface MapPlace {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  type?: string;
  day?: number;
  time?: string;
  rating?: number;
  imageUrl?: string;
}

export interface TripMapProps {
  places: MapPlace[];
  initialRegion?: Region;
  onMarkerPress?: (place: MapPlace) => void;
  onMapReady?: () => void;
  showsUserLocation?: boolean;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  style?: any;
}

// ============================================
// Type Colors
// ============================================

const TYPE_COLORS: Record<string, string> = {
  ATTRACTION: '#EF4444',
  RESTAURANT: '#F59E0B',
  CAFE: '#8B5CF6',
  HOTEL: '#3B82F6',
  TRANSPORT: '#10B981',
  SHOPPING: '#EC4899',
  ACTIVITY: '#06B6D4',
  OTHER: '#6B7280',
};

const TYPE_EMOJIS: Record<string, string> = {
  ATTRACTION: '🏛️',
  RESTAURANT: '🍜',
  CAFE: '☕',
  HOTEL: '🏨',
  TRANSPORT: '🚗',
  SHOPPING: '🛍️',
  ACTIVITY: '🎯',
  OTHER: '📍',
};

// ============================================
// Trip Map Component
// ============================================

export function TripMap({
  places,
  initialRegion,
  onMarkerPress,
  onMapReady,
  showsUserLocation = false,
  style,
}: TripMapProps) {
  const mapRef = useRef<MapView>(null);

  // Fit to markers when places change
  useEffect(() => {
    if (places.length > 0 && mapRef.current) {
      const coordinates = places.map(p => ({
        latitude: p.lat,
        longitude: p.lng,
      }));

      if (coordinates.length === 1) {
        mapRef.current.animateToRegion({
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 500);
      } else {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [places]);

  const handleMarkerPress = (place: MapPlace) => {
    if (onMarkerPress) {
      onMarkerPress(place);
    }
  };

  // Calculate initial region from places
  const getInitialRegion = (): Region => {
    if (initialRegion) return initialRegion;
    if (places.length === 0) return DEFAULT_REGION;

    const lats = places.map(p => p.lat);
    const lngs = places.map(p => p.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.5) * 1.5,
      longitudeDelta: Math.max(maxLng - minLng, 0.5) * 1.5,
    };
  };

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={getInitialRegion()}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsUserLocation}
      showsCompass={true}
      showsScale={true}
      onMapReady={onMapReady}
      toolbarEnabled={false}
    >
      {places.map((place, index) => (
        <Marker
          key={place.id}
          coordinate={{ latitude: place.lat, longitude: place.lng }}
          onPress={() => handleMarkerPress(place)}
          pinColor={TYPE_COLORS[place.type || 'OTHER'] || TYPE_COLORS.OTHER}
        >
          <Callout tooltip style={styles.callout}>
            <View style={styles.calloutContainer}>
              <View style={styles.calloutHeader}>
                <Text style={styles.calloutEmoji}>
                  {TYPE_EMOJIS[place.type || 'OTHER'] || '📍'}
                </Text>
                {place.day && (
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayText}>Day {place.day}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.calloutTitle} numberOfLines={2}>
                {place.name}
              </Text>
              {place.address && (
                <Text style={styles.calloutAddress} numberOfLines={1}>
                  {place.address}
                </Text>
              )}
              {place.time && (
                <Text style={styles.calloutTime}>🕐 {place.time}</Text>
              )}
              {place.rating && (
                <Text style={styles.calloutRating}>⭐ {place.rating.toFixed(1)}</Text>
              )}
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

// ============================================
// Mini Map Component (for cards/previews)
// ============================================

interface MiniMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  style?: any;
}

export function MiniMap({ latitude, longitude, title, style }: MiniMapProps) {
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={[styles.miniMapContainer, style]}>
      <MapView
        style={styles.miniMap}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
        />
      </MapView>
    </View>
  );
}

// ============================================
// Map Legend Component
// ============================================

interface MapLegendProps {
  types?: string[];
}

export function MapLegend({ types }: MapLegendProps) {
  const displayTypes = types || Object.keys(TYPE_COLORS);

  return (
    <View style={styles.legend}>
      {displayTypes.map(type => (
        <View key={type} style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.OTHER },
            ]}
          />
          <Text style={styles.legendText}>
            {TYPE_EMOJIS[type] || '📍'} {type}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ============================================
// Place List with Map
// ============================================

interface PlaceListMapProps {
  places: MapPlace[];
  selectedPlaceId?: string;
  onPlaceSelect: (place: MapPlace) => void;
}

export function PlaceListMap({ places, selectedPlaceId, onPlaceSelect }: PlaceListMapProps) {
  const selectedPlace = places.find(p => p.id === selectedPlaceId);

  return (
    <View style={styles.container}>
      <TripMap
        places={places}
        onMarkerPress={onPlaceSelect}
        style={styles.halfMap}
      />
      
      {/* Place List */}
      <View style={styles.placeList}>
        <Text style={styles.placeListTitle}>
          {places.length} 個景點
        </Text>
        
        <View style={styles.placeListContent}>
          {places.map(place => (
            <TouchableOpacity
              key={place.id}
              style={[
                styles.placeItem,
                selectedPlaceId === place.id && styles.placeItemSelected,
              ]}
              onPress={() => onPlaceSelect(place)}
            >
              <Text style={styles.placeEmoji}>
                {TYPE_EMOJIS[place.type || 'OTHER'] || '📍'}
              </Text>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {place.name}
                </Text>
                {place.day && (
                  <Text style={styles.placeDay}>Day {place.day}</Text>
                )}
              </View>
              <Text style={styles.placeArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  halfMap: {
    height: '50%',
  },
  
  // Callout
  callout: {
    backgroundColor: 'transparent',
  },
  calloutContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    maxWidth: 200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calloutEmoji: {
    fontSize: 20,
  },
  dayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  calloutTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  calloutRating: {
    fontSize: 11,
    color: colors.warning,
    marginTop: 2,
  },
  
  // Mini Map
  miniMapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniMap: {
    width: '100%',
    height: 120,
  },
  
  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Place List
  placeList: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  placeListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  placeListContent: {
    flex: 1,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  placeItemSelected: {
    backgroundColor: colors.primary + '10',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  placeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  placeDay: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeArrow: {
    fontSize: 20,
    color: colors.gray400,
  },
});