import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Image,
  KeyboardAvoidingView,
  Linking,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_SETTINGS, GOOGLE_SETTINGS } from '../../../app/config';
import { AppHeader, useStatusModal } from '../../../components';
import { useLocation, LocationCoordinates, UserLocation } from '../../location';
import { reverseGeocodeCoordinates } from '../../location/services/geocodingService';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useAddress } from '../context/AddressContext';
import { AddressType, SavedAddress } from '../types/address';

interface AddressFormScreenProps {
  addressToEdit?: SavedAddress;
  onBack: () => void;
  onAddressSaved: () => void;
}

export const AddressFormScreen: React.FC<AddressFormScreenProps> = ({
  addressToEdit,
  onBack,
  onAddressSaved,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { location, fetchLiveGpsLocation, setManualLocation } = useLocation();
  const { addresses, addAddress, updateAddress, setDefaultAddress, selectAddress } = useAddress();
  const { showStatusModal } = useStatusModal();

  const scrollViewRef = useRef<any>(null);

  const isEditing = Boolean(addressToEdit);

  // Form State
  const [receiverName, setReceiverName] = useState<string>(
    addressToEdit?.name || user?.name || ''
  );
  const [receiverPhone, setReceiverPhone] = useState<string>(
    addressToEdit?.phone || user?.phone || ''
  );
  const [pincode, setPincode] = useState<string>(
    addressToEdit?.pincode || location.postalCode || API_SETTINGS.defaultPostalCode
  );
  const [city, setCity] = useState<string>(
    addressToEdit?.city || location.city || API_SETTINGS.defaultCity
  );
  const [state, setState] = useState<string>(
    addressToEdit?.state || location.state || API_SETTINGS.defaultState
  );
  const [flatNo, setFlatNo] = useState<string>(addressToEdit?.flatNo || '');
  const [streetArea, setStreetArea] = useState<string>(
    addressToEdit?.streetArea || location.locality || location.shortAddress
  );
  const [landmark, setLandmark] = useState<string>(addressToEdit?.landmark || '');
  const [addressType, setAddressType] = useState<AddressType>(
    addressToEdit?.type || 'HOME'
  );
  const [isDefault, setIsDefault] = useState<boolean>(
    addressToEdit ? addressToEdit.isDefault : true
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  // Dynamic Map Coordinates & Zoom State
  const [mapCoords, setMapCoords] = useState<LocationCoordinates>(
    location.coordinates || API_SETTINGS.defaultCoordinates
  );
  const [zoomLevel, setZoomLevel] = useState<number>(16);

  const pan = useRef(new Animated.ValueXY()).current;
  const pinLift = useRef(new Animated.Value(0)).current;

  const mapCoordsRef = useRef(mapCoords);
  mapCoordsRef.current = mapCoords;
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  const googleApiKey = (
    (API_SETTINGS as any).googleMap?.key ||
    GOOGLE_SETTINGS.mapsApiKey ||
    ''
  ).trim();

  // Primary Google key from App Settings with backup Google key
  const fallbackGoogleKey = 'AIzaSyDfNOU_zv2QAESamCNM8UM8M1FyAXXORZc';
  const [activeGoogleKey, setActiveGoogleKey] = useState<string>(googleApiKey || fallbackGoogleKey);

  useEffect(() => {
    if (googleApiKey) {
      setActiveGoogleKey(googleApiKey);
    }
  }, [googleApiKey]);

  // Official Google Static Maps API centered on the pinned location
  const googleMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCoords.latitude},${mapCoords.longitude}&zoom=${zoomLevel}&size=600x350&scale=2&maptype=roadmap&key=${activeGoogleKey}`;

  // Reusable helper: Binds reverse-geocoded location data directly to form fields
  const bindLocationToFields = (loc: Partial<UserLocation>) => {
    const resolvedStreet =
      loc.street ||
      loc.subLocality ||
      loc.locality ||
      loc.shortAddress ||
      '';

    if (resolvedStreet) {
      setStreetArea(resolvedStreet);
    }
    if (loc.city) {
      setCity(loc.city);
    }
    if (loc.state) {
      setState(loc.state);
    }
    if (loc.postalCode) {
      setPincode(loc.postalCode);
    }
    if (loc.houseNumber) {
      setFlatNo(loc.houseNumber);
    }

    // Clear validation errors for auto-populated fields
    setErrors(prev => {
      const next = { ...prev };
      delete next.streetArea;
      delete next.city;
      delete next.state;
      delete next.pincode;
      if (loc.houseNumber) delete next.flatNo;
      return next;
    });
  };

  // PanResponder to enable smooth dragging and pinpointing without stealing child button taps
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onPanResponderGrant: () => {
        setIsAdjusting(true);
        Animated.spring(pinLift, {
          toValue: -14,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: async (_, gestureState) => {
        Animated.spring(pinLift, {
          toValue: 0,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }).start();

        const currentC = mapCoordsRef.current;
        const currentZ = zoomLevelRef.current;

        const metersPerPixel =
          (156543.03392 * Math.cos((currentC.latitude * Math.PI) / 180)) /
          Math.pow(2, currentZ);
        const deltaLat = (gestureState.dy * metersPerPixel) / 111320;
        const deltaLng =
          -(gestureState.dx * metersPerPixel) /
          (111320 * Math.cos((currentC.latitude * Math.PI) / 180));

        const newLat = Number((currentC.latitude + deltaLat).toFixed(6));
        const newLng = Number((currentC.longitude + deltaLng).toFixed(6));

        const updatedCoords: LocationCoordinates = {
          latitude: newLat,
          longitude: newLng,
        };

        pan.setValue({ x: 0, y: 0 });
        setMapCoords(updatedCoords);
        setIsAdjusting(false);

        // Reverse geocode the adjusted pin location and bind to fields
        try {
          const geocoded = await reverseGeocodeCoordinates(updatedCoords);
          bindLocationToFields(geocoded);
        } catch (e) {
          console.log('Reverse geocode error after adjust:', e);
        }
      },
    })
  ).current;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 13));
  };

  const waitingForGpsEnable = useRef(false);
  const handleLocateMeRef = useRef<(isUserClick?: boolean) => Promise<void>>(async () => {});

  const showGpsTurnOnModal = () => {
    showStatusModal({
      type: 'warning',
      iconName: 'location-outline',
      title: 'Turn On GPS',
      message:
        'Your GPS / Location service is turned off. Please turn on GPS so we can accurately pinpoint and detect your delivery address.',
      confirmText: 'Turn On GPS',
      cancelText: 'Cancel',
      onConfirm: () => {
        waitingForGpsEnable.current = true;
        if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
            Linking.openSettings().catch(() => {});
          });
        } else {
          Linking.openURL('App-Prefs:root=Privacy&path=LOCATION').catch(() => {
            Linking.openSettings().catch(() => {});
          });
        }
      },
    });
  };

  const handleLocateMe = async (isUserClick: boolean = true) => {
    try {
      setIsLocating(true);

      // Check if GPS / Location services are enabled on the device
      let isGpsEnabled = true;
      try {
        isGpsEnabled = await DeviceInfo.isLocationEnabled();
      } catch (checkErr) {
        console.warn('DeviceInfo.isLocationEnabled error:', checkErr);
      }

      if (!isGpsEnabled) {
        setIsLocating(false);
        if (isUserClick) {
          showGpsTurnOnModal();
        }
        return;
      }

      const liveLoc = await fetchLiveGpsLocation();
      if (liveLoc) {
        if (liveLoc.coordinates) {
          setMapCoords(liveLoc.coordinates);
        }
        bindLocationToFields(liveLoc);
      } else {
        const stillEnabled = await DeviceInfo.isLocationEnabled().catch(() => true);
        if (!stillEnabled) {
          if (isUserClick) {
            showGpsTurnOnModal();
          }
        } else if (isUserClick) {
          showStatusModal({
            type: 'warning',
            title: 'Location Unavailable',
            message:
              'Unable to acquire current GPS fix. Please verify location permissions or drag the map pin to select your address.',
            buttonText: 'OK',
          });
        }
      }
    } catch (err) {
      console.warn('handleLocateMe error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  handleLocateMeRef.current = handleLocateMe;

  // Auto-detect when user returns from system Settings after turning on GPS
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (nextAppState === 'active' && waitingForGpsEnable.current) {
        waitingForGpsEnable.current = false;
        try {
          const isEnabled = await DeviceInfo.isLocationEnabled();
          if (isEnabled) {
            handleLocateMeRef.current(false);
          }
        } catch (e) {
          console.log('Error checking location status on resume:', e);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Automatically capture current GPS location and bind fields when creating a new address
  useEffect(() => {
    if (!isEditing) {
      handleLocateMe(false);
    }
  }, []);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!receiverName.trim()) errs.receiverName = 'Full name is required';
    if (!receiverPhone.trim()) {
      errs.receiverPhone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(receiverPhone.replace(/\D/g, ''))) {
      errs.receiverPhone = 'Enter a valid 10-digit mobile number';
    }
    if (!pincode.trim() || pincode.length < 6) {
      errs.pincode = 'Enter a valid 6-digit Pincode';
    }
    if (!flatNo.trim()) errs.flatNo = 'House / Flat / Building No. is required';
    if (!streetArea.trim()) errs.streetArea = 'Road / Street / Area is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    if (!isEditing && addresses.length >= 5) {
      showStatusModal({
        type: 'warning',
        title: 'Address Limit Reached',
        message:
          'You can save a maximum of 5 delivery addresses. Please remove an unused address before adding a new one.',
        buttonText: 'OK',
      });
      return;
    }

    if (isEditing && addressToEdit) {
      await updateAddress(addressToEdit.id, {
        name: receiverName.trim(),
        phone: receiverPhone.trim(),
        pincode: pincode.trim(),
        flatNo: flatNo.trim(),
        streetArea: streetArea.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        type: addressType,
        isDefault,
      });
      if (isDefault) {
        await setDefaultAddress(addressToEdit.id);
      }
      selectAddress(addressToEdit.id);
    } else {
      const saved = await addAddress({
        name: receiverName.trim(),
        phone: receiverPhone.trim(),
        pincode: pincode.trim(),
        flatNo: flatNo.trim(),
        streetArea: streetArea.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        type: addressType,
        isDefault,
      });
      selectAddress(saved.id);
      if (isDefault) {
        await setDefaultAddress(saved.id);
      }
    }

    // Update active GPS location state
    const shortAddr = `${flatNo.trim()}, ${streetArea.trim()}`;
    const fullAddr = `${flatNo.trim()}, ${landmark ? landmark.trim() + ', ' : ''}${streetArea.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`;
    setManualLocation(shortAddr, fullAddr);

    showStatusModal({
      type: 'success',
      title: isEditing ? 'Address Updated' : 'Address Saved',
      message: 'Your delivery address has been saved successfully!',
      buttonText: 'OK',
      onConfirm: onAddressSaved,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={isEditing ? 'Edit Address' : 'Add Delivery Address'}
        onBack={onBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          scrollEnabled={!isAdjusting}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 140, 160) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* 🗺️ Interactive Adjustable Live Map Canvas */}
          <View
            style={[
              styles.mapCanvas,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
            ]}
          >
            {/* 1. Drag & Gesture Surface (PanResponder isolated to map background) */}
            <View
              style={StyleSheet.absoluteFill}
              {...panResponder.panHandlers}
            >
              {/* Base Grid Pattern */}
              <View style={styles.mapGridPattern}>
                <View style={[styles.mapRoadH, { borderColor: colors.border }]} />
                <View style={[styles.mapRoadH2, { borderColor: colors.border }]} />
                <View style={[styles.mapRoadV, { borderColor: colors.border }]} />
                <View style={[styles.mapRoadV2, { borderColor: colors.border }]} />
                <View style={[styles.mapLandmarkZone, { backgroundColor: colors.divider }]} />
              </View>

              {/* Draggable Map Layer with Pan animation */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                  },
                ]}
              >
                <Image
                  key={`${mapCoords.latitude}-${mapCoords.longitude}-${zoomLevel}-${activeGoogleKey}`}
                  source={{
                    uri: googleMapUrl,
                  }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  onError={() => {
                    if (activeGoogleKey !== fallbackGoogleKey) {
                      setActiveGoogleKey(fallbackGoogleKey);
                    }
                  }}
                />
              </Animated.View>
            </View>

            {/* 2. Central Animated Location Pin Marker */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.centerPinMarker,
                {
                  transform: [{ translateY: pinLift }],
                },
              ]}
            >
              <View style={[styles.pinBubble, { backgroundColor: colors.primary }]}>
                <Ionicons name="basket" size={16} color={colors.onPrimary} />
              </View>
              <View style={[styles.pinPoint, { borderTopColor: colors.primary }]} />
              <View style={[styles.pinShadow, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
            </Animated.View>

            {/* 3. Floating Zoom Controls (+ / -) - Higher zIndex for instant touch response */}
            <View style={styles.zoomControls}>
              <TouchableOpacity
                onPress={handleZoomIn}
                activeOpacity={0.7}
                style={[styles.zoomBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleZoomOut}
                activeOpacity={0.7}
                style={[styles.zoomBtn, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 4 }]}
              >
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 4. Floating Live GPS Re-center Button */}
            <TouchableOpacity
              onPress={() => handleLocateMe(true)}
              activeOpacity={0.7}
              disabled={isLocating || location.isLoading}
              style={[
                styles.recenterBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {isLocating || location.isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.recenterText, { color: colors.primary }]}>
                    Detecting Location...
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="locate" size={16} color={colors.primary} />
                  <Text style={[styles.recenterText, { color: colors.primary }]}>
                    Use Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* 5. Verified Location & Drag Hint Pill */}
            <View
              pointerEvents="none"
              style={[styles.verifiedLocationPill, { backgroundColor: colors.primaryVariant }]}
            >
              <Ionicons
                name={isAdjusting ? 'hand-right' : 'shield-checkmark'}
                size={12}
                color={colors.secondary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.verifiedText, { color: colors.onPrimary }]} numberOfLines={1}>
                {isAdjusting
                  ? 'Moving Pin...'
                  : streetArea
                  ? `📍 ${streetArea}`
                  : 'Drag map to pinpoint location'}
              </Text>
            </View>
          </View>

          {/* Form Fields Card */}
          <View
            style={[
              styles.formContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.formSectionHeading, { color: colors.textPrimary }]}>
              Contact Details
            </Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Full Name *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: errors.receiverName ? colors.error : colors.border,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={colors.inputPlaceholder}
                value={receiverName}
                onChangeText={text => {
                  setReceiverName(text);
                  if (errors.receiverName) setErrors(prev => ({ ...prev, receiverName: '' }));
                }}
              />
              {errors.receiverName ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.receiverName}
                </Text>
              ) : null}
            </View>

            {/* 10-Digit Mobile */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                10-Digit Mobile Number *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: errors.receiverPhone ? colors.error : colors.border,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                placeholder="e.g. 9845012345"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
                maxLength={10}
                value={receiverPhone}
                onChangeText={text => {
                  setReceiverPhone(text);
                  if (errors.receiverPhone) setErrors(prev => ({ ...prev, receiverPhone: '' }));
                }}
              />
              {errors.receiverPhone ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.receiverPhone}
                </Text>
              ) : null}
            </View>

            <Text
              style={[
                styles.formSectionHeading,
                { color: colors.textPrimary, marginTop: 16 },
              ]}
            >
              Address Details
            </Text>

            {/* Pincode & City Row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Pincode *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: errors.pincode ? colors.error : colors.border,
                      color: colors.textPrimary,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  placeholder="600017"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pincode}
                  onChangeText={text => {
                    setPincode(text);
                    if (errors.pincode) setErrors(prev => ({ ...prev, pincode: '' }));
                  }}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  City *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  placeholder="Chennai"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            {/* House / Flat / Building No. */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                House / Flat / Floor / Building No. *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: errors.flatNo ? colors.error : colors.border,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                placeholder="e.g. Flat 402, Block B, Green Heights"
                placeholderTextColor={colors.inputPlaceholder}
                value={flatNo}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 280, animated: true });
                  }, 150);
                }}
                onChangeText={text => {
                  setFlatNo(text);
                  if (errors.flatNo) setErrors(prev => ({ ...prev, flatNo: '' }));
                }}
              />
              {errors.flatNo ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.flatNo}
                </Text>
              ) : null}
            </View>

            {/* Road / Street / Area */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Road / Street / Area / Colony *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: errors.streetArea ? colors.error : colors.border,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                placeholder="e.g. Usman Road, T. Nagar"
                placeholderTextColor={colors.inputPlaceholder}
                value={streetArea}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 380, animated: true });
                  }, 150);
                }}
                onChangeText={text => {
                  setStreetArea(text);
                  if (errors.streetArea) setErrors(prev => ({ ...prev, streetArea: '' }));
                }}
              />
              {errors.streetArea ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.streetArea}
                </Text>
              ) : null}
            </View>

            {/* Nearby Landmark */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Nearby Landmark (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                placeholder="e.g. Opp. Nilgiris Supermarket or Post Office"
                placeholderTextColor={colors.inputPlaceholder}
                value={landmark}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
                onChangeText={setLandmark}
              />
            </View>

            {/* Address Type Tag Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Type of Address
              </Text>
              <View style={styles.typeChipsRow}>
                {(['HOME', 'WORK', 'OTHER'] as AddressType[]).map(type => {
                  const isSelected = addressType === type;
                  const iconName =
                    type === 'HOME' ? 'home' : type === 'WORK' ? 'briefcase' : 'location';

                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setAddressType(type)}
                      activeOpacity={0.8}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: borderRadius.full,
                        },
                      ]}
                    >
                      <Ionicons
                        name={iconName}
                        size={14}
                        color={isSelected ? colors.onPrimary : colors.primary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          {
                            color: isSelected ? colors.onPrimary : colors.textPrimary,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Default Address Switch */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                  Set as Default Address
                </Text>
                <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                  Automatically select this address for 1-click checkout
                </Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            </View>
          </View>
        </ScrollView>

        {/* Floating Save Button inside KeyboardAvoidingView */}
        <View
          style={[
            styles.bottomActionContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!isEditing && addresses.length >= 5}
            onPress={handleSave}
            style={[
              styles.saveButton,
              {
                backgroundColor: !isEditing && addresses.length >= 5 ? colors.surfaceVariant : colors.primary,
                borderRadius: borderRadius.lg,
                opacity: !isEditing && addresses.length >= 5 ? 0.65 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.saveButtonText,
                { color: !isEditing && addresses.length >= 5 ? colors.textSecondary : colors.onPrimary },
              ]}
            >
              {!isEditing && addresses.length >= 5
                ? 'Address Limit Reached (Max 5 Saved)'
                : isEditing
                ? 'Update Delivery Address'
                : 'Save Address & Confirm'}
            </Text>
            <Ionicons
              name={!isEditing && addresses.length >= 5 ? 'lock-closed' : 'checkmark-circle'}
              size={18}
              color={!isEditing && addresses.length >= 5 ? colors.textSecondary : colors.onPrimary}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  mapCanvas: {
    height: 205,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoomControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    zIndex: 10,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  mapGridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  mapRoadH: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    height: 24,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  mapRoadH2: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    height: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  mapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 80,
    width: 28,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
  },
  mapRoadV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 90,
    width: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  mapLandmarkZone: {
    position: 'absolute',
    top: 55,
    left: 120,
    width: 70,
    height: 45,
    borderRadius: 6,
  },
  pulseCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 2,
    opacity: 0.4,
    position: 'absolute',
  },
  centerPinMarker: {
    alignItems: 'center',
    zIndex: 3,
  },
  pinBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  pinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  pinShadow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    gap: 4,
    zIndex: 4,
  },
  recenterText: {
    fontSize: 11,
    fontWeight: '800',
  },
  verifiedLocationPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  formContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  formSectionHeading: {
    fontSize: 14.5,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 6,
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  switchSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  bottomActionContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
