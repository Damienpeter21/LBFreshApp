import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  forwardGeocodeAddress,
  reverseGeocodeCoordinates,
} from '../../modules/location/services/geocodingService';
import { useTheme } from '../../theme';
import {
  InteractiveGoogleMap,
  InteractiveGoogleMapRef,
} from './InteractiveGoogleMap';

export interface SelectedLocationData {
  latitude: number;
  longitude: number;
  address?: string;
  street?: string;
  locality?: string;
  subLocality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  houseNumber?: string;
  shortAddress?: string;
}

export interface InteractiveMapPickerModalProps {
  visible: boolean;
  initialLocation?: { latitude: number; longitude: number };
  initialAddressText?: string;
  onClose: () => void;
  onSelectLocation: (location: SelectedLocationData) => void;
}

export const InteractiveMapPickerModal: React.FC<InteractiveMapPickerModalProps> = ({
  visible,
  initialLocation,
  initialAddressText,
  onClose,
  onSelectLocation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<InteractiveGoogleMapRef>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
  }>(() => {
    return initialLocation || { latitude: 13.0827, longitude: 80.2707 };
  });

  const [resolvedDetails, setResolvedDetails] = useState<SelectedLocationData>({
    latitude: initialLocation?.latitude || 13.0827,
    longitude: initialLocation?.longitude || 80.2707,
    address: initialAddressText || 'Detecting delivery location...',
  });

  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  const geocodeDebounceTimer = useRef<any>(null);

  // Sync initial location when modal opens
  useEffect(() => {
    if (visible && initialLocation?.latitude && initialLocation?.longitude) {
      setSelectedCoords(initialLocation);
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    }
  }, [visible, initialLocation?.latitude, initialLocation?.longitude]);

  // Reverse Geocoding helper
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    setIsGeocoding(true);
    try {
      const geo = await reverseGeocodeCoordinates({ latitude: lat, longitude: lon });
      if (geo) {
        setResolvedDetails({
          latitude: lat,
          longitude: lon,
          address: geo.formattedAddress || `${geo.street || ''}, ${geo.city || ''}`,
          street: geo.street,
          locality: geo.locality,
          subLocality: geo.subLocality,
          city: geo.city,
          state: geo.state,
          postalCode: geo.postalCode,
          houseNumber: geo.houseNumber,
          shortAddress: geo.shortAddress,
        });
      }
    } catch (e) {
      console.warn('Modal reverse geocode error:', e);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Called whenever coordinates change through panning, dragging, or tapping
  const handleLocationChange = useCallback(
    (loc: { latitude: number; longitude: number; address?: string }) => {
      setSelectedCoords({ latitude: loc.latitude, longitude: loc.longitude });

      if (loc.address) {
        setResolvedDetails(prev => ({
          ...prev,
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
        }));
      }

      // Debounce API reverse geocoding to avoid excessive calls during fast panning
      if (geocodeDebounceTimer.current) {
        clearTimeout(geocodeDebounceTimer.current);
      }
      geocodeDebounceTimer.current = setTimeout(() => {
        reverseGeocode(loc.latitude, loc.longitude);
      }, 450);
    },
    [reverseGeocode]
  );

  // Handle Search Input submit
  const handleSearchSubmit = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    Keyboard.dismiss();
    setIsSearching(true);
    try {
      // 1. Tell WebView map to search first
      mapRef.current?.searchAddress(query);

      // 2. Also forward geocode via API for immediate coords and details
      const result = await forwardGeocodeAddress(query);
      if (result && result.coordinates) {
        const { latitude, longitude } = result.coordinates;
        setSelectedCoords({ latitude, longitude });
        mapRef.current?.setCenter(latitude, longitude, 17);
        setResolvedDetails({
          latitude,
          longitude,
          address: result.formattedAddress || query,
          street: result.street,
          locality: result.locality,
          subLocality: result.subLocality,
          city: result.city,
          state: result.state,
          postalCode: result.postalCode,
          houseNumber: result.houseNumber,
          shortAddress: result.shortAddress,
        });
      }
    } catch (err) {
      console.warn('Search submit error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Recenter to user's device live GPS
  const handleRecenterToGps = () => {
    setIsLocating(true);
    Geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setSelectedCoords({ latitude, longitude });
        mapRef.current?.recenter(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      err => {
        setIsLocating(false);
        console.warn('Map picker GPS locate error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Toggle Satellite / Roadmap
  const toggleMapType = () => {
    const next = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(next);
    mapRef.current?.setMapType(next);
  };

  // Confirm selection
  const handleConfirm = () => {
    onSelectLocation(resolvedDetails);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Full-Screen Interactive Google Map */}
        <View style={StyleSheet.absoluteFill}>
          <InteractiveGoogleMap
            ref={mapRef}
            mode="picker"
            initialLocation={{
              latitude: selectedCoords.latitude,
              longitude: selectedCoords.longitude,
            }}
            initialZoom={16}
            interactive={true}
            showPin={true}
            showControls={false}
            onLocationSelect={handleLocationChange}
            height="100%"
          />
        </View>

        {/* Top Floating Header & Search Bar */}
        <View
          style={[
            styles.topHeaderContainer,
            { paddingTop: Math.max(insets.top + 8, 20) },
          ]}
        >
          {/* Header Bar */}
          <View
            style={[
              styles.searchBarBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#000',
              },
            ]}
          >
            {/* Back Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Address Search Input */}
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search area, street, landmark..."
              placeholderTextColor={colors.inputPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />

            {/* Clear Query Button */}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            {/* Search Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSearchSubmit}
              style={[styles.searchSubmitBtn, { backgroundColor: colors.primary }]}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="search" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating Controls (Map Type & GPS Recenter) */}
        <View style={styles.floatingActionCol}>
          {/* Map Layer Switch (Satellite vs Normal) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleMapType}
            style={[
              styles.floatingCircleBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name={mapType === 'satellite' ? 'map' : 'earth'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          {/* Recenter Live GPS Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRecenterToGps}
            disabled={isLocating}
            style={[
              styles.floatingCircleBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 },
            ]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Floating Address Confirmation Dock */}
        <View
          style={[
            styles.bottomDock,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom + 12, 20),
              borderTopColor: colors.border,
            },
          ]}
        >
          {/* Selected Location Pill & Tip */}
          <View style={styles.dockHeaderRow}>
            <View style={[styles.badgePill, { backgroundColor: `${colors.primary}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.badgePillText, { color: colors.primary }]}>
                DELIVERY PIN LOCATION
              </Text>
            </View>

            {isGeocoding && (
              <View style={styles.geocodingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.geocodingText, { color: colors.textSecondary }]}>
                  Resolving...
                </Text>
              </View>
            )}
          </View>

          {/* Address Details Box */}
          <View style={styles.addressInfoRow}>
            <View style={[styles.pinIconCircle, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="location" size={24} color={colors.primary} />
            </View>

            <View style={styles.addressTextCol}>
              <Text style={[styles.addressTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {resolvedDetails.street ||
                  resolvedDetails.locality ||
                  resolvedDetails.subLocality ||
                  'Pinned Location'}
              </Text>
              <Text style={[styles.addressSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                {resolvedDetails.address ||
                  (resolvedDetails.city
                    ? `${resolvedDetails.city}, ${resolvedDetails.state} - ${resolvedDetails.postalCode}`
                    : 'Drag the map to pinpoint exact delivery spot')}
              </Text>
            </View>
          </View>

          {/* Interactive Hint */}
          <Text style={[styles.hintText, { color: colors.textTertiary }]}>
            💡 Move or pinch the map to place the marker at your exact building / doorstep.
          </Text>

          {/* Confirm Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleConfirm}
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>Select Location & Auto-Fill</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  topHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    zIndex: 50,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 52,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 6,
  },
  clearBtn: {
    padding: 6,
    marginRight: 4,
  },
  searchSubmitBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingActionCol: {
    position: 'absolute',
    right: 14,
    top: 130,
    zIndex: 40,
  },
  floatingCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 18,
    zIndex: 50,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  dockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  geocodingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geocodingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressTextCol: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  addressSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
