import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAddress } from '../../modules/profile/context/AddressContext';
import { SavedAddress } from '../../modules/profile/types/address';
import { useTheme } from '../../theme';
import { useLocation } from './LocationContext';

export const LocationPickerModal: React.FC = () => {
  const { colors, borderRadius } = useTheme();
  const {
    location,
    isPickerVisible,
    closeLocationPicker,
    fetchLiveGpsLocation,
    setManualLocation,
  } = useLocation();
  const { addresses, selectedAddress, selectAddress } = useAddress();

  const handleUseGps = async () => {
    await fetchLiveGpsLocation();
    closeLocationPicker();
  };

  const handleSelectSavedAddress = (item: SavedAddress) => {
    selectAddress(item.id);
    const shortAddr = `${item.flatNo}, ${item.streetArea}`;
    const fullAddr = `${item.flatNo}, ${item.streetArea}, ${item.city}, ${item.state} - ${item.pincode}`;
    setManualLocation(shortAddr, fullAddr);
    closeLocationPicker();
  };

  return (
    <Modal
      visible={isPickerVisible}
      transparent
      animationType="slide"
      onRequestClose={closeLocationPicker}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={closeLocationPicker}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: borderRadius.xl + 4,
              borderTopRightRadius: borderRadius.xl + 4,
            },
          ]}
        >
          {/* Sheet Handle */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Delivery Location
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                Select your live GPS position or saved address
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeLocationPicker}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Live GPS Button Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleUseGps}
            style={[
              styles.gpsButtonCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: location.isLiveGps ? colors.primary : colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.gpsIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              {location.isLoading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Ionicons name="navigate" size={18} color={colors.onPrimary} />
              )}
            </View>

            <View style={styles.gpsInfoBox}>
              <View style={styles.gpsTitleRow}>
                <Text style={[styles.gpsCardTitle, { color: colors.textPrimary }]}>
                  Detect Live Current Location
                </Text>
                {location.isLiveGps && (
                  <View style={[styles.livePill, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.livePillText, { color: colors.onSecondary }]}>
                      ACTIVE GPS
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.gpsCardSub, { color: colors.textSecondary }]} numberOfLines={2}>
                {location.isLoading
                  ? 'Detecting current delivery address...'
                  : location.isLiveGps
                  ? location.formattedAddress
                  : 'Tap to use your live current location for 15-min delivery'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* Saved Addresses Section */}
          {addresses && addresses.length > 0 && (
            <>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                <Text style={[styles.dividerLabel, { color: colors.textTertiary }]}>
                  SAVED ADDRESSES
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.locationsList}
              >
                {addresses.map(item => {
                  const isSelected = selectedAddress?.id === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectSavedAddress(item)}
                      style={[
                        styles.locationItemRow,
                        {
                          borderBottomColor: colors.divider,
                          backgroundColor: isSelected
                            ? colors.surfaceVariant
                            : 'transparent',
                          borderRadius: borderRadius.md,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.locPinCircle,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.surfaceVariant,
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.type === 'WORK' ? 'briefcase' : 'home'}
                          size={16}
                          color={isSelected ? colors.onPrimary : colors.primary}
                        />
                      </View>

                      <View style={styles.locTextBox}>
                        <View style={styles.savedTypeRow}>
                          <Text
                            style={[
                              styles.locTitle,
                              {
                                color: isSelected ? colors.primary : colors.textPrimary,
                                fontWeight: isSelected ? '800' : '700',
                              },
                            ]}
                          >
                            {item.type}
                          </Text>
                          {item.isDefault && (
                            <View style={[styles.defaultPill, { backgroundColor: colors.secondary }]}>
                              <Text style={[styles.defaultPillText, { color: colors.onSecondary }]}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[styles.locArea, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {item.flatNo}, {item.streetArea}, {item.city}
                        </Text>
                      </View>

                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsButtonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  gpsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gpsInfoBox: {
    flex: 1,
    marginRight: 8,
  },
  gpsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  livePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  livePillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  gpsCardSub: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  locationsList: {
    maxHeight: 220,
  },
  locationItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  locPinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locTextBox: {
    flex: 1,
    marginRight: 8,
  },
  savedTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locTitle: {
    fontSize: 13.5,
  },
  defaultPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  locArea: {
    fontSize: 11.5,
    marginTop: 2,
  },
});
