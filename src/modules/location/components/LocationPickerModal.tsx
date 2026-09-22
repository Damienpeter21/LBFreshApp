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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../../navigation/types';
import { useAddress } from '../../profile/context/AddressContext';
import { SavedAddress } from '../../profile/types/address';
import { useTheme } from '../../../theme';
import { useLocation } from '../hooks/useLocation';

export const LocationPickerModal: React.FC = () => {
  const { colors, borderRadius } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
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

  const handleAddNewAddress = () => {
    closeLocationPicker();
    navigation.navigate('AddressForm');
  };

  const handleSelectSavedAddress = (item: SavedAddress) => {
    selectAddress(item.id);
    const shortAddr = `${item.flatNo ? item.flatNo + ', ' : ''}${item.streetArea}`;
    const fullAddr = `${item.flatNo ? item.flatNo + ', ' : ''}${item.streetArea}, ${item.city}, ${item.state} - ${item.pincode}`;
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

          {/* Top Actions Row: Dual Cards (Current Location & Add New) */}
          <View style={styles.topActionsRow}>
            {/* Card 1: Current Location */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUseGps}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: location.isLiveGps ? colors.primary : colors.border,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <View
                style={[
                  styles.actionCardIconBox,
                  { backgroundColor: location.isLiveGps ? colors.primary : `${colors.primary}20` },
                ]}
              >
                {location.isLoading ? (
                  <ActivityIndicator size="small" color={location.isLiveGps ? colors.onPrimary : colors.primary} />
                ) : (
                  <Ionicons
                    name="navigate"
                    size={18}
                    color={location.isLiveGps ? colors.onPrimary : colors.primary}
                  />
                )}
              </View>

              <View style={styles.actionCardTextBox}>
                <View style={styles.actionCardHeader}>
                  <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    Current Location
                  </Text>
                  {location.isLiveGps && (
                    <View style={[styles.activeDot, { backgroundColor: colors.secondary }]} />
                  )}
                </View>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {location.isLiveGps ? 'GPS Active' : 'Use Live GPS'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Add New */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={addresses && addresses.length >= 5}
              onPress={handleAddNewAddress}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                  opacity: addresses && addresses.length >= 5 ? 0.6 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.actionCardIconBox,
                  {
                    backgroundColor:
                      addresses && addresses.length >= 5 ? colors.surfaceVariant : `${colors.secondary}22`,
                  },
                ]}
              >
                <Ionicons
                  name={addresses && addresses.length >= 5 ? 'lock-closed' : 'add'}
                  size={18}
                  color={addresses && addresses.length >= 5 ? colors.textTertiary : colors.secondary}
                />
              </View>

              <View style={styles.actionCardTextBox}>
                <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {addresses && addresses.length >= 5 ? 'Limit (5/5)' : 'Add New'}
                </Text>
                <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {addresses && addresses.length >= 5 ? 'Max 5 saved' : 'New Address'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Saved Addresses Section */}
          {addresses && addresses.length > 0 ? (
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
                          {item.flatNo ? `${item.flatNo}, ` : ''}{item.streetArea}, {item.city}
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
          ) : (
            <View style={styles.emptyAddressBox}>
              <Ionicons name="location-outline" size={30} color={colors.textTertiary} />
              <Text style={[styles.emptyAddressText, { color: colors.textSecondary }]}>
                No saved addresses yet. Tap 'Add New' to add your delivery address.
              </Text>
            </View>
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
  topActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
  },
  actionCardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionCardTextBox: {
    flex: 1,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  actionCardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyAddressBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyAddressText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
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
