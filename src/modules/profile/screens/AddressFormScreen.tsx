import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_SETTINGS } from '../../../app/config';
import { AppHeader, useStatusModal } from '../../../components';
import { useLocation } from '../../location';
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
  const { addAddress, updateAddress, setDefaultAddress, selectAddress } = useAddress();
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

  const handleLocateMe = async () => {
    try {
      setIsLocating(true);
      const liveLoc = await fetchLiveGpsLocation();
      if (liveLoc) {
        const resolvedStreet =
          liveLoc.street ||
          liveLoc.subLocality ||
          liveLoc.locality ||
          liveLoc.shortAddress;
        if (resolvedStreet) {
          setStreetArea(resolvedStreet);
        }
        if (liveLoc.city) {
          setCity(liveLoc.city);
        }
        if (liveLoc.state) {
          setState(liveLoc.state);
        }
        if (liveLoc.postalCode) {
          setPincode(liveLoc.postalCode);
        }
        if (liveLoc.houseNumber && !flatNo) {
          setFlatNo(liveLoc.houseNumber);
        }

        // Clear any validation errors for auto-populated fields
        setErrors(prev => {
          const next = { ...prev };
          delete next.streetArea;
          delete next.city;
          delete next.state;
          delete next.pincode;
          if (liveLoc.houseNumber) delete next.flatNo;
          return next;
        });
      }
    } catch (err) {
      console.warn('handleLocateMe error:', err);
    } finally {
      setIsLocating(false);
    }
  };

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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 140, 160) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* 🗺️ Interactive Simulated Map Canvas (Flipkart/Swiggy Standard) */}
          <View
            style={[
              styles.mapCanvas,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
            ]}
          >
            {/* Grid Pattern Simulation */}
            <View style={styles.mapGridPattern}>
              <View style={[styles.mapRoadH, { borderColor: colors.border }]} />
              <View style={[styles.mapRoadH2, { borderColor: colors.border }]} />
              <View style={[styles.mapRoadV, { borderColor: colors.border }]} />
              <View style={[styles.mapRoadV2, { borderColor: colors.border }]} />
              <View style={[styles.mapLandmarkZone, { backgroundColor: colors.divider }]} />
            </View>

            {/* Pulsing Delivery Radius Circle */}
            <View
              style={[
                styles.pulseCircle,
                { borderColor: colors.primary, backgroundColor: colors.surfaceVariant },
              ]}
            />

            {/* Central Location Pin Marker */}
            <View style={styles.centerPinMarker}>
              <View style={[styles.pinBubble, { backgroundColor: colors.primary }]}>
                <Ionicons name="basket" size={16} color={colors.onPrimary} />
              </View>
              <View style={[styles.pinPoint, { borderTopColor: colors.primary }]} />
              <View style={[styles.pinShadow, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
            </View>

            {/* Floating Live GPS Re-center Button */}
            <TouchableOpacity
              onPress={handleLocateMe}
              activeOpacity={0.8}
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

            {/* Verified Location Pill */}
            <View
              style={[styles.verifiedLocationPill, { backgroundColor: colors.primaryVariant }]}
            >
              <Ionicons
                name="shield-checkmark"
                size={12}
                color={colors.secondary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.verifiedText, { color: colors.onPrimary }]} numberOfLines={1}>
                {streetArea ? `📍 ${streetArea}` : '15 Mins Fast Delivery Area'}
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
            onPress={handleSave}
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
              {isEditing ? 'Update Delivery Address' : 'Save Address & Confirm'}
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.onPrimary}
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
    height: 170,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
