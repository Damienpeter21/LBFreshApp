import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_SETTINGS } from '../../../app/config';
import { AppHeader } from '../../../components';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useAddress } from '../../profile';
import { useCart } from '../context/CartContext';
import { CartService } from '../services/cartService';
import { LoyaltyService, LoyaltyCoupon } from '../services/loyaltyService';

export interface ShippingCarrier {
  id: number;
  name: string;
  fixed_price?: number;
  delivery_type?: string;
  free_over?: number;
}

interface CheckoutScreenProps {
  onBack: () => void;
  onNavigateToAddresses: () => void;
  onNavigateToPayment: (params: {
    totalAmount: number;
    subtotal: number;
    shippingFee: number;
    carrierId?: number;
    discount: number;
    couponCode?: string;
  }) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onBack,
  onNavigateToAddresses,
  onNavigateToPayment,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { selectedAddress, addresses } = useAddress();
  const { items, totalAmount, totalQuantity } = useCart();

  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<ShippingCarrier | null>(null);
  const [loadingCarriers, setLoadingCarriers] = useState<boolean>(true);
  const [validating, setValidating] = useState<boolean>(false);

  // Loyalty Coupon state (Postman: "loyalty.card" search_read)
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<LoyaltyCoupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<LoyaltyCoupon[]>([]);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  // Load available coupons for customer (Postman: "loyalty.card" partner_id = X)
  useEffect(() => {
    let isMounted = true;
    const rawUser = user as any;
    const partnerId = user?.partnerId || rawUser?.partner_id
      ? Array.isArray(rawUser?.partner_id)
        ? rawUser.partner_id[0]
        : (user?.partnerId ?? rawUser?.partner_id)
      : undefined;

    LoyaltyService.getCustomerCoupons(partnerId)
      .then(coupons => {
        if (isMounted) {
          setAvailableCoupons(coupons);
        }
      })
      .catch(err => console.warn('Coupons load note:', err));

    return () => {
      isMounted = false;
    };
  }, [user?.partnerId]);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim();
    if (!code) {
      Alert.alert('Coupon Code Required', 'Please enter a coupon code.');
      return;
    }

    setValidatingCoupon(true);
    const rawUser = user as any;
    const partnerId = user?.partnerId || rawUser?.partner_id
      ? Array.isArray(rawUser?.partner_id)
        ? rawUser.partner_id[0]
        : (user?.partnerId ?? rawUser?.partner_id)
      : undefined;

    const res = await LoyaltyService.validateCouponCode(code, partnerId);
    setValidatingCoupon(false);

    if (res.success && res.coupon) {
      setAppliedCoupon(res.coupon);
      setCouponCodeInput(res.coupon.code);
      Alert.alert('Coupon Applied', `Coupon ${res.coupon.code} applied! You saved ₹${res.coupon.points}.`);
    } else {
      Alert.alert('Invalid Coupon', res.message || 'Could not apply coupon.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
  };

  // Fetch Shipping Methods (Postman: "GET Shipping Methods")
  useEffect(() => {
    let isMounted = true;
    const loadShippingCarriers = async () => {
      try {
        setLoadingCarriers(true);
        const res = await CartService.getShippingMethods();
        const list = Array.isArray(res?.result) ? res.result : [];
        if (isMounted) {
          if (list.length > 0) {
            setCarriers(list);
            setSelectedCarrier(list[0]);
          } else {
            // Enterprise default fallback carriers
            const fallback: ShippingCarrier[] = [
              {
                id: 1,
                name: '15-Minute Express Delivery',
                fixed_price: 0,
                delivery_type: 'fixed',
              },
              {
                id: 2,
                name: 'Standard Doorstep Delivery',
                fixed_price: 0,
                delivery_type: 'fixed',
              },
            ];
            setCarriers(fallback);
            setSelectedCarrier(fallback[0]);
          }
        }
      } catch (err) {
        console.warn('Error loading shipping methods, using default carrier:', err);
        if (isMounted) {
          const fallback: ShippingCarrier[] = [
            {
              id: 1,
              name: '15-Minute Express Delivery',
              fixed_price: 0,
            },
          ];
          setCarriers(fallback);
          setSelectedCarrier(fallback[0]);
        }
      } finally {
        if (isMounted) {
          setLoadingCarriers(false);
        }
      }
    };

    loadShippingCarriers();
    return () => {
      isMounted = false;
    };
  }, []);

  const discountAmount = appliedCoupon?.points ? Math.min(appliedCoupon.points, totalAmount) : 0;
  const shippingPrice = selectedCarrier?.fixed_price ?? 0;
  const handlingFee = items.length > 0 ? 5 : 0;
  const grandTotal = Math.max(0, totalAmount - discountAmount + shippingPrice + handlingFee);

  const handleProceedToPayment = async () => {
    if (!selectedAddress) {
      Alert.alert(
        'Delivery Address Required',
        'Please select or add a delivery address to continue with your checkout.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Address', onPress: onNavigateToAddresses },
        ]
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert('Cart is Empty', 'Please add items before proceeding to checkout.');
      return;
    }

    setValidating(true);
    try {
      // Validate checkout prerequisites (Postman: "POST Validate Checkout")
      onNavigateToPayment({
        totalAmount: grandTotal,
        subtotal: totalAmount,
        shippingFee: shippingPrice,
        carrierId: selectedCarrier?.id,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Checkout Summary" onBack={onBack} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Delivery Address Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Delivery Address
              </Text>
            </View>

            <TouchableOpacity
              onPress={onNavigateToAddresses}
              activeOpacity={0.7}
              style={styles.actionLinkBtn}
            >
              <Text style={[styles.actionLinkText, { color: colors.primary }]}>
                {selectedAddress ? 'CHANGE' : '+ ADD'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressDetails}>
              <View style={styles.addressBadgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                    {selectedAddress.type?.toUpperCase() || 'DELIVERY'}
                  </Text>
                </View>
                <Text style={[styles.recipientName, { color: colors.textPrimary }]}>
                  {selectedAddress.name}
                </Text>
              </View>
              <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                {selectedAddress.flatNo ? `${selectedAddress.flatNo}, ` : ''}
                {selectedAddress.streetArea}, {selectedAddress.city} - {selectedAddress.pincode}
              </Text>
              {selectedAddress.phone && (
                <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                  📞 {selectedAddress.phone}
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={onNavigateToAddresses}
              style={[styles.noAddressBox, { borderColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.noAddressText, { color: colors.primary }]}>
                Add or Select Delivery Address
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Shipping / Delivery Method Selection (delivery.carrier) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="bicycle" size={18} color={colors.secondary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Delivery Options
              </Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>FAST & SECURE</Text>
            </View>
          </View>

          {loadingCarriers ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.carriersList}>
              {carriers.map(carrier => {
                const isSelected = selectedCarrier?.id === carrier.id;
                return (
                  <TouchableOpacity
                    key={carrier.id}
                    onPress={() => setSelectedCarrier(carrier)}
                    activeOpacity={0.8}
                    style={[
                      styles.carrierOption,
                      {
                        backgroundColor: isSelected ? `${colors.primary}12` : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? colors.primary : colors.textTertiary}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.carrierName,
                          {
                            color: colors.textPrimary,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {carrier.name}
                      </Text>
                      <Text style={[styles.carrierSub, { color: colors.textSecondary }]}>
                        {carrier.name.toLowerCase().includes('express')
                          ? '15 Mins doorstep express delivery guarantee'
                          : 'Standard slot delivery at your doorstep'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.carrierPrice,
                        {
                          color: carrier.fixed_price && carrier.fixed_price > 0 ? colors.textPrimary : colors.secondary,
                        },
                      ]}
                    >
                      {carrier.fixed_price && carrier.fixed_price > 0
                        ? `₹${carrier.fixed_price}`
                        : 'FREE'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. Items Summary */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="basket" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Items in Basket ({totalQuantity})
              </Text>
            </View>
            <Text style={[styles.subtotalHint, { color: colors.textSecondary }]}>
              ₹{totalAmount}
            </Text>
          </View>

          {items.map((item, idx) => {
            const rawName = item.product.name || 'Fresh Product';
            const cleanName = rawName.replace(/^\[.*?\]\s*/, '').trim() || rawName;
            const baseUrl = (API_SETTINGS?.baseUrl || 'https://lbfreshbasket.com').replace(/\/+$/, '');
            const imageUrl =
              item.product.imageUrl ||
              `${baseUrl}/web/image/product.product/${item.product.id}/image_512`;

            return (
              <View
                key={`${item.product.id}_${idx}`}
                style={[
                  styles.itemRow,
                  {
                    borderBottomColor: colors.divider,
                    borderBottomWidth: idx === items.length - 1 ? 0 : 1,
                  },
                ]}
              >
                {/* Product Thumbnail */}
                <View
                  style={[
                    styles.itemImageBox,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Info Column */}
                <View style={styles.itemInfoCol}>
                  <Text
                    style={[styles.itemNameText, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {cleanName}
                  </Text>
                  <View style={styles.itemMetaRow}>
                    <Text
                      style={[
                        styles.itemQtyPill,
                        { color: colors.primary, backgroundColor: `${colors.primary}15` },
                      ]}
                    >
                      {item.quantity}x
                    </Text>
                    <Text style={[styles.itemUnitText, { color: colors.textSecondary }]}>
                      ₹{item.product.price} {item.product.unit ? `• ${item.product.unit}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Price Column */}
                <View style={styles.itemPriceCol}>
                  <Text style={[styles.itemPriceText, { color: colors.textPrimary }]}>
                    ₹{item.product.price * item.quantity}
                  </Text>
                  {item.product.originalPrice > item.product.price && (
                    <Text style={[styles.itemOriginalPriceText, { color: colors.textTertiary }]}>
                      ₹{item.product.originalPrice * item.quantity}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 4. Coupons & Offers (Postman: loyalty.card search_read) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: appliedCoupon ? colors.primary : colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconHeadingRow}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="pricetag" size={17} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {appliedCoupon ? 'Coupon Applied' : 'Coupons & Offers'}
              </Text>
            </View>
            {appliedCoupon && (
              <TouchableOpacity onPress={handleRemoveCoupon} activeOpacity={0.7}>
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '800' }}>REMOVE</Text>
              </TouchableOpacity>
            )}
          </View>

          {appliedCoupon ? (
            <View
              style={[
                styles.appliedCouponBanner,
                {
                  backgroundColor: `${colors.secondary}15`,
                  borderColor: colors.secondary,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.appliedCouponCode, { color: colors.textPrimary }]}>
                  {appliedCoupon.code}
                </Text>
                <Text style={[styles.appliedCouponSub, { color: colors.secondary }]}>
                  ₹{appliedCoupon.points} discount applied from loyalty points!
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Coupon Input Box */}
              <View style={[styles.couponInputWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                <TextInput
                  style={[styles.couponTextInput, { color: colors.textPrimary }]}
                  placeholder="Enter coupon code (e.g. 044e-9c16-490a)"
                  placeholderTextColor={colors.textTertiary}
                  value={couponCodeInput}
                  onChangeText={setCouponCodeInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => handleApplyCoupon()}
                  disabled={validatingCoupon}
                  style={[styles.applyCouponBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  {validatingCoupon ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.applyCouponBtnText, { color: colors.onPrimary }]}>APPLY</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Select Available Coupons */}
              {availableCoupons.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.availableCouponsTitle, { color: colors.textSecondary }]}>
                    AVAILABLE COUPONS
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                    {availableCoupons.map(coupon => (
                      <TouchableOpacity
                        key={`coupon_${coupon.id}`}
                        onPress={() => handleApplyCoupon(coupon.code)}
                        style={[
                          styles.couponChip,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.primary,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="sparkles" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.couponChipText, { color: colors.primary }]}>
                          {coupon.code} (₹{coupon.points} OFF)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>

        {/* 5. Bill Breakdown */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
            Bill Details
          </Text>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Item Subtotal</Text>
            <Text style={[styles.billVal, { color: colors.textPrimary }]}>₹{totalAmount}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.secondary, fontWeight: '700' }]}>
                Coupon Savings ({appliedCoupon?.code})
              </Text>
              <Text style={[styles.billVal, { color: colors.secondary, fontWeight: '800' }]}>
                - ₹{discountAmount}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
              Delivery & Shipping
            </Text>
            <Text
              style={[
                styles.billVal,
                { color: shippingPrice > 0 ? colors.textPrimary : colors.secondary, fontWeight: '800' },
              ]}
            >
              {shippingPrice > 0 ? `₹${shippingPrice}` : 'FREE'}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
              Platform & Packaging Fee
            </Text>
            <Text style={[styles.billVal, { color: colors.textPrimary }]}>₹{handlingFee}</Text>
          </View>

          <View style={[styles.billDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.billRow}>
            <Text style={[styles.totalToPayLabel, { color: colors.textPrimary }]}>Total to Pay</Text>
            <Text style={[styles.totalToPayValue, { color: colors.primary }]}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <View>
          <Text style={[styles.bottomBarTotalLabel, { color: colors.textSecondary }]}>
            TOTAL TO PAY
          </Text>
          <Text style={[styles.bottomBarTotal, { color: colors.textPrimary }]}>
            ₹{grandTotal}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleProceedToPayment}
          disabled={validating}
          style={[
            styles.proceedBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              opacity: validating ? 0.7 : 1,
            },
          ]}
        >
          {validating ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.proceedBtnText, { color: colors.onPrimary }]}>
              SELECT PAYMENT ›
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionLinkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '800',
  },
  addressDetails: {
    marginTop: 4,
  },
  addressBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  noAddressBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  noAddressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  carriersList: {
    gap: 8,
    marginTop: 4,
  },
  carrierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
  },
  carrierName: {
    fontSize: 13.5,
  },
  carrierSub: {
    fontSize: 11,
    marginTop: 2,
  },
  carrierPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  subtotalHint: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemImageBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  itemQtyPill: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemUnitText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemOriginalPriceText: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  appliedCouponBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appliedCouponSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  couponInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  couponTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 6,
  },
  applyCouponBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  applyCouponBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  availableCouponsTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  couponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  couponChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  couponSub: {
    fontSize: 11,
    marginTop: 2,
  },
  couponAction: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  billVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    marginVertical: 8,
  },
  totalToPayLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalToPayValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomBarTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBarTotal: {
    fontSize: 20,
    fontWeight: '800',
  },
  proceedBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  proceedBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
