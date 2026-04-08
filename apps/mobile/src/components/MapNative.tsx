// Native Map Component (iOS/Android only)
// This file is only loaded on native platforms
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../theme/colors';
import type { TripMapProps, MapPlace } from './Map';

const DEFAULT_REGION = {
  latitude: 23.5,
  longitude: 121,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

const TripMap: React.FC<TripMapProps> = ({
  places = [],
  initialRegion,
  onMarkerPress,
  onMapReady,
  showsUserLocation,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion || DEFAULT_REGION}
        showsUserLocation={showsUserLocation}
        onMapReady={onMapReady}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.lat,
              longitude: place.lng,
            }}
            onPress={() => onMarkerPress?.(place)}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>
                {place.day ? place.day.toString() : '📍'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default TripMap;
