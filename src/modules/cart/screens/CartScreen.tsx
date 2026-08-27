import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppHeader } from '../../../app/components/AppHeader';
import { EmptyState } from '../../../app/components/EmptyState';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useCart } from '../context/CartContext';
import { CartItem } from '../types';

interface CartScreenProps {
  onBack: () => void;
  onNavigateToShop: () => void;
  onRequireAuthForCheckout: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onBack,
  onNavigateToShop,
  onRequireAuthForCheckout,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { items, totalAmount, totalQuantity, updateQuantity, clearCart } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number>(0);

  const deliveryFee = 0; // Free delivery
  const handlingFee = items.length > 0 ? 5 : 0;
  const totalSavings = items.reduce(
    (acc, item) => acc + (item.product.originalPrice - item.product.price) * item.quantity,
    0
  ) + couponDiscount;

  const finalTotal = Math.max(0, totalAmount - couponDiscount + deliveryFee + handlingFee + selectedTip);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (code === 'FRESH30') {
      const discount = Math.min(Math.round(totalAmount * 0.3), 100);
      setCouponDiscount(discount);
      setCouponCode('FRESH30');
      Alert.alert('Coupon Applied', `FRESH30 applied: You saved ₹${discount}`);
    } else {
      Alert.alert('Invalid Coupon', 'Please enter a valid coupon code like FRESH30');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      onRequireAuthForCheckout();
      return;
    }

    clearCart();
    Alert.alert(
      'Order Placed Successfully',
      `Thank you ${user?.name || ''}! Your order of ₹${finalTotal} is on the way in 15 mins.`,
      [{ text: 'View Order', onPress: onNavigateToShop }]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      <View style={[styles.itemImageBox, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
        {item.product.imageUrl ? (
          <Image
            source={{ uri: item.product.imageUrl }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name={
              item.product.category === 'vegetables'
                ? 'leaf-outline'
                : item.product.category === 'fruits'
                  ? 'nutrition-outline'
                  : item.product.category === 'grocery'
                    ? 'basket-outline'
                    : item.product.category === 'electronics'
                      ? 'headset-outline'
                      : item.product.category === 'dairy'
                        ? 'cafe-outline'
                        : 'fast-food-outline'
            }
            size={24}
            color={colors.primary}
          />
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text style={[styles.itemUnit, { color: colors.textSecondary }]}>
          {item.product.unit}
        </Text>
        <View style={styles.itemPriceRow}>
          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
            ₹{item.product.price * item.quantity}
          </Text>
          {item.product.originalPrice > item.product.price && (
            <Text style={[styles.itemOriginalPrice, { color: colors.textTertiary }]}>
              ₹{item.product.originalPrice * item.quantity}
            </Text>
          )}
        </View>
      </View>

      {/* Stepper */}
      <View
        style={[
          styles.stepper,
          {
            borderColor: colors.primary,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.sm,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
          style={styles.stepperAction}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={14} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.quantityNumber, { color: colors.primary }]}>
          {item.quantity}
        </Text>
        <TouchableOpacity
          onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
          style={styles.stepperAction}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={`My Cart (${totalQuantity})`} onBack={onBack} />

      {items.length === 0 ? (
        <EmptyState
          iconName="cart-outline"
          badgeIcon="sparkles"
          title="Your Cart is Empty"
          description="Looks like you haven't added anything to your cart yet. Discover all genuine products from different brands at the best prices!"
          actionLabel="Start Shopping"
          onAction={onNavigateToShop}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => item.product.id}
            renderItem={renderCartItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: Math.max(insets.bottom + 100, 120) },
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              /* Delivery Address Snippet */
              <View
                style={[
                  styles.addressCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={styles.addressLeft}>
                  <View style={[styles.addressIconCircle, { backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name="location-sharp" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                      Delivering to Home (15 Mins)
                    </Text>
                    <Text style={[styles.addressSubtitle, { color: colors.textSecondary }]}>
                      BTM Layout, 2nd Stage, Bengaluru - 560076
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.changeBtn}>
                  <Text style={[styles.changeText, { color: colors.primary }]}>CHANGE</Text>
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={
              <View style={styles.footerContainer}>
                {/* Coupon Box */}
                <View
                  style={[
                    styles.couponCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: borderRadius.lg,
                    },
                  ]}
                >
                  <View style={styles.couponInputRow}>
                    <Ionicons name="pricetag-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.couponInput, { color: colors.textPrimary }]}
                      placeholder="Enter Coupon Code"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={couponCode}
                      onChangeText={setCouponCode}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      onPress={() => handleApplyCoupon()}
                      disabled={!couponCode}
                      style={[styles.applyBtn, { backgroundColor: couponCode ? colors.primary : colors.surfaceVariant }]}
                    >
                      <Text
                        style={[
                          styles.applyText,
                          { color: couponCode ? colors.onPrimary : colors.textTertiary },
                        ]}
                      >
                        APPLY
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Coupon Chip */}
                  <TouchableOpacity
                    onPress={() => handleApplyCoupon('FRESH30')}
                    style={[styles.quickCouponChip, { backgroundColor: colors.surfaceVariant, borderColor: colors.secondary }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="sparkles" size={13} color={colors.secondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.quickCouponText, { color: colors.textPrimary }]}>
                      Use <Text style={{ fontWeight: '800', color: colors.primary }}>FRESH30</Text> for 30% OFF
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Delivery Tip Selector */}
                <View
                  style={[
                    styles.tipCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: borderRadius.lg,
                    },
                  ]}
                >
                  <View style={styles.tipHeaderRow}>
                    <Ionicons name="heart-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>
                      Tip your delivery partner
                    </Text>
                  </View>
                  <Text style={[styles.tipSubtitle, { color: colors.textSecondary }]}>
                    100% of the tip goes directly to your partner
                  </Text>
                  <View style={styles.tipOptionsRow}>
                    {[10, 20, 30, 50].map(amount => (
                      <TouchableOpacity
                        key={amount}
                        onPress={() => setSelectedTip(selectedTip === amount ? 0 : amount)}
                        style={[
                          styles.tipPill,
                          {
                            backgroundColor: selectedTip === amount ? colors.primary : colors.surfaceVariant,
                            borderColor: selectedTip === amount ? colors.primary : colors.border,
                            borderRadius: borderRadius.md,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tipPillText,
                            { color: selectedTip === amount ? colors.onPrimary : colors.textPrimary },
                          ]}
                        >
                          ₹{amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bill Breakdown */}
                <View
                  style={[
                    styles.billCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: borderRadius.lg,
                    },
                  ]}
                >
                  <Text style={[styles.billTitle, { color: colors.textPrimary }]}>
                    Bill Details
                  </Text>

                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Items Total</Text>
                    <Text style={[styles.billValue, { color: colors.textPrimary }]}>₹{totalAmount}</Text>
                  </View>

                  {couponDiscount > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: colors.primary, fontWeight: '700' }]}>Coupon Savings</Text>
                      <Text style={{ color: colors.primary, fontWeight: '800' }}>-₹{couponDiscount}</Text>
                    </View>
                  )}

                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
                    <Text style={{ color: colors.secondary, fontWeight: '800' }}>FREE</Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Handling Fee</Text>
                    <Text style={[styles.billValue, { color: colors.textPrimary }]}>₹{handlingFee}</Text>
                  </View>

                  {selectedTip > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Delivery Tip</Text>
                      <Text style={[styles.billValue, { color: colors.textPrimary }]}>₹{selectedTip}</Text>
                    </View>
                  )}

                  <View style={[styles.billDivider, { backgroundColor: colors.divider }]} />

                  <View style={styles.billRow}>
                    <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>To Pay</Text>
                    <Text style={[styles.totalValue, { color: colors.primary }]}>₹{finalTotal}</Text>
                  </View>

                  {totalSavings > 0 && (
                    <View style={[styles.savingsPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.secondary }]}>
                      <Ionicons name="sparkles" size={14} color={colors.secondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.savingsPillText, { color: colors.primary }]}>
                        You saved ₹{totalSavings} on this order!
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            }
          />

          {/* Sticky Checkout Bar */}
          <View
            style={[
              styles.checkoutBar,
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
              <Text style={[styles.checkoutTotalLabel, { color: colors.textSecondary }]}>
                {isAuthenticated ? 'TOTAL TO PAY' : 'GUEST CHECKOUT'}
              </Text>
              <Text style={[styles.checkoutTotal, { color: colors.textPrimary }]}>
                ₹{finalTotal}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCheckout}
              style={[
                styles.checkoutButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text style={[styles.checkoutButtonText, { color: colors.onPrimary }]}>
                {isAuthenticated ? 'PROCEED TO PAY' : 'LOGIN TO CHECKOUT ›'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  addressIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  addressSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImageBox: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  itemOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  stepperAction: {
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  quantityNumber: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  footerContainer: {
    gap: 12,
    marginTop: 4,
  },
  couponCard: {
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  applyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyText: {
    fontSize: 12,
    fontWeight: '800',
  },
  quickCouponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
  },
  quickCouponText: {
    fontSize: 12,
  },
  tipCard: {
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  tipSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 10,
  },
  tipOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tipPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  tipPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  billCard: {
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  savingsPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  shopNowButton: {
    paddingHorizontal: 28,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shopNowText: {
    fontSize: 16,
    fontWeight: '800',
  },
  checkoutBar: {
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
  checkoutTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  checkoutTotal: {
    fontSize: 22,
    fontWeight: '800',
  },
  checkoutButton: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
