// Map Components - Web Compatible Version
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

// Default region (Taiwan)
const DEFAULT_REGION = {
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
  places?: MapPlace[];
  initialRegion?: typeof DEFAULT_REGION;
  onMarkerPress?: (place: MapPlace) => void;
  onMapReady?: () => void;
  showsUserLocation?: boolean;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  style?: any;
}

export type Region = typeof DEFAULT_REGION;

// ============================================
// Web Map Placeholder
// ============================================
const WebMap: React.FC<TripMapProps> = ({ places = [], style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>🗺️</Text>
        <Text style={styles.placeholderTitle}>地圖視圖</Text>
        <Text style={styles.placeholderSubtext}>
          請在手機 App 中查看地圖
        </Text>
        {places.length > 0 && (
          <View style={styles.placesList}>
            <Text style={styles.placesTitle}>景點列表 ({places.length})</Text>
            {places.slice(0, 5).map((place, index) => (
              <View key={place.id} style={styles.placeItem}>
                <Text style={styles.placeName}>• {place.name}</Text>
                {place.address && (
                  <Text style={styles.placeAddress}>{place.address}</Text>
                )}
              </View>
            ))}
            {places.length > 5 && (
              <Text style={styles.morePlaces}>還有 {places.length - 5} 個景點...</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ============================================
// Native Map (iOS/Android) - Lazy loaded
// Not available in Expo Go
// ============================================
let NativeMapComponent: React.FC<TripMapProps> | null = null;

// Only load on native platforms and when NOT running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    const NativeMap = require('./MapNative').default;
    NativeMapComponent = NativeMap;
  } catch (e) {
    console.warn('Native map not available:', e);
  }
}

// ============================================
// Main Export
// ============================================
const TripMap: React.FC<TripMapProps> = (props) => {
  // Always use WebMap on web platform
  if (Platform.OS === 'web') {
    return <WebMap {...props} />;
  }
  
  // Use native map on iOS/Android
  if (NativeMapComponent) {
    return <NativeMapComponent {...props} />;
  }
  
  // Fallback to web map if native failed to load
  return <WebMap {...props} />;
};

export default TripMap;

// ============================================
// MapLegend Component
// ============================================
export const MapLegend: React.FC = () => {
  if (Platform.OS === 'web') return null;
  
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>景點</Text>
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  placesList: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  placesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  placeItem: {
    marginBottom: 8,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  morePlaces: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
});
