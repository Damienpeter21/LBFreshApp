import React from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppHeader } from '../../../app';
import { useTheme } from '../../../theme';
import { Order } from '../types';

interface OrderDetailsScreenProps {
  order: Order;
  onBack: () => void;
}

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  order,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius } = useTheme();

  const getStatusConfig = () => {
    switch (order.status) {
      case 'in_transit':
        return {
          title: 'Out for Delivery',
          subtitle: `Arriving in ~${order.eta || '12 mins'} at your doorstep`,
          icon: 'bicycle',
          bg: '#E0F2FE',
          color: '#0284C7',
          step: 3,
        };
      case 'preparing':
        return {
          title: 'Packing at Local Hub',
          subtitle: 'Store partner is handpicking fresh produce',
          icon: 'cube',
          bg: '#FEF3C7',
          color: '#D97706',
          step: 2,
        };
      case 'delivered':
        return {
          title: 'Order Delivered',
          subtitle: `Delivered safely on ${order.date}, ${order.time}`,
          icon: 'checkmark-circle',
          bg: '#DCFCE7',
          color: '#16A34A',
          step: 4,
        };
      case 'cancelled':
        return {
          title: 'Order Cancelled',
          subtitle: 'This order was cancelled. Refund processed.',
          icon: 'close-circle',
          bg: '#FEE2E2',
          color: '#DC2626',
          step: 0,
        };
      default:
        return {
          title: 'Order Placed',
          subtitle: 'Order received and confirmed by store',
          icon: 'receipt',
          bg: colors.surfaceVariant,
          color: colors.primary,
          step: 1,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const partner = order.deliveryPartner;

  const handleCallPartner = () => {
    if (partner?.phone) {
      Linking.openURL(`tel:${partner.phone}`).catch(() => {
        Alert.alert('Call Delivery Partner', `Phone: ${partner.phone}`);
      });
    }
  };

  const handleSupport = () => {
    Alert.alert(
      'Order Help & Support',
      `Need assistance for ${order.orderNumber}? Our 24x7 support team is here to help.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () =>
            Linking.openURL('mailto:support@lbfresh.com?subject=Help with ' + order.orderNumber),
        },
      ]
    );
  };

  const handleDownloadInvoice = () => {
    Alert.alert(
      'Download Invoice',
      `Tax invoice for ${order.orderNumber} (₹${order.totalAmount}) downloaded successfully.`,
      [{ text: 'OK' }]
    );
  };

  const steps = [
    { label: 'Confirmed', desc: '09:15 AM' },
    { label: 'Packed', desc: '09:18 AM' },
    { label: 'Out for Delivery', desc: '09:23 AM' },
    { label: 'Delivered', desc: order.status === 'delivered' ? order.time : '~15 mins' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Order Details" onBack={onBack} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 30, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top Order Hero Status Card */}
        <View
          style={[
            styles.statusHeroCard,
            {
              backgroundColor: statusConfig.bg,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <View style={styles.statusHeroTop}>
            <View
              style={[
                styles.statusIconCircle,
                { backgroundColor: statusConfig.color },
              ]}
            >
              <Ionicons name={statusConfig.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.statusHeroTitle, { color: statusConfig.color }]}>
                {statusConfig.title}
              </Text>
              <Text style={[styles.statusHeroSub, { color: '#374151' }]}>
                {statusConfig.subtitle}
              </Text>
            </View>
          </View>

          {/* Order ID & Date Tag */}
          <View style={[styles.orderMetaTagRow, { borderTopColor: 'rgba(0,0,0,0.08)' }]}>
            <Text style={styles.orderIdText}>Order {order.orderNumber}</Text>
            <Text style={styles.orderDateText}>
              {order.date} • {order.time}
            </Text>
          </View>
        </View>

        {/* 2. 4-Step Delivery Progress Stepper (if not cancelled) */}
        {order.status !== 'cancelled' && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Delivery Timeline
            </Text>

            <View style={styles.stepperRow}>
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum <= statusConfig.step;
                const isCurrent = stepNum === statusConfig.step;

                return (
                  <View key={idx} style={styles.stepItem}>
                    <View style={styles.stepIndicatorRow}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor: isCompleted
                              ? colors.primary
                              : colors.surfaceVariant,
                            borderColor: isCompleted ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={11} color={colors.onPrimary} />
                        ) : (
                          <View
                            style={[
                              styles.pendingInnerDot,
                              { backgroundColor: colors.textTertiary },
                            ]}
                          />
                        )}
                      </View>
                      {idx < steps.length - 1 && (
                        <View
                          style={[
                            styles.stepConnector,
                            {
                              backgroundColor:
                                stepNum < statusConfig.step
                                  ? colors.primary
                                  : colors.border,
                            },
                          ]}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          color: isCurrent
                            ? colors.primary
                            : isCompleted
                            ? colors.textPrimary
                            : colors.textTertiary,
                          fontWeight: isCurrent ? '800' : '600',
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 3. Delivery Partner Info (for in_transit / delivered) */}
        {partner && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Delivery Partner
            </Text>

            <View style={styles.partnerRow}>
              <View style={[styles.partnerAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={22} color={colors.onPrimary} />
              </View>

              <View style={styles.partnerInfo}>
                <View style={styles.partnerNameRow}>
                  <Text style={[styles.partnerName, { color: colors.textPrimary }]}>
                    {partner.name}
                  </Text>
                  <View style={[styles.ratingPill, { backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name="star" size={11} color={colors.warning} style={{ marginRight: 3 }} />
                    <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                      {partner.rating}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.partnerVehicle, { color: colors.textSecondary }]}>
                  {partner.vehicle}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCallPartner}
                style={[
                  styles.callButton,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.primary },
                ]}
              >
                <Ionicons name="call" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4. Items in this Order (Detailed List) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
              Items in this Order ({order.itemCount})
            </Text>
            <View style={[styles.itemsCountBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.itemsCountBadgeText, { color: colors.primary }]}>
                {order.items.length} Products
              </Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  {
                    borderBottomColor: colors.divider,
                    borderBottomWidth: index === order.items.length - 1 ? 0 : 1,
                  },
                ]}
              >
                {/* Product Image Thumbnail */}
                {item.product.imageUrl ? (
                  <Image
                    source={{ uri: item.product.imageUrl }}
                    style={[
                      styles.productImage,
                      { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.productImagePlaceholder,
                      { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
                    ]}
                  >
                    <Ionicons name="basket-outline" size={20} color={colors.primary} />
                  </View>
                )}

                {/* Product Name & Unit Details */}
                <View style={styles.itemDetails}>
                  <Text
                    style={[styles.productName, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {item.product.name}
                  </Text>
                  <Text style={[styles.productUnit, { color: colors.textSecondary }]}>
                    {item.product.unit || 'Standard Pack'} • ₹{item.price} each
                  </Text>
                </View>

                {/* Quantity & Item Total Price */}
                <View style={styles.itemPriceBox}>
                  <Text style={[styles.itemTotalPrice, { color: colors.textPrimary }]}>
                    ₹{item.price * item.quantity}
                  </Text>
                  <View style={[styles.itemQtyBadge, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.itemQtyText, { color: colors.textPrimary }]}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Bill Details & Payment Breakdown */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Bill & Payment Summary
          </Text>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
              Items Total (MRP)
            </Text>
            <Text style={[styles.billValue, { color: colors.textPrimary }]}>
              ₹{order.totalAmount + (order.savings || 0)}
            </Text>
          </View>

          {order.savings > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.secondary }]}>
                Product Discounts & Coupons
              </Text>
              <Text style={[styles.billValue, { color: colors.secondary }]}>
                - ₹{order.savings}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
              Delivery Fee (15 Mins Doorstep)
            </Text>
            <Text style={[styles.billValue, { color: colors.secondary }]}>FREE</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
              Handling & Packaging
            </Text>
            <Text style={[styles.billValue, { color: colors.textPrimary }]}>₹5</Text>
          </View>

          <View style={[styles.billDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.billTotalRow}>
            <View>
              <Text style={[styles.totalPaidLabel, { color: colors.textPrimary }]}>
                Total Amount Paid
              </Text>
              <Text style={[styles.paymentMethodSub, { color: colors.textSecondary }]}>
                {order.paymentMode}
              </Text>
            </View>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              ₹{order.totalAmount}
            </Text>
          </View>
        </View>

        {/* 6. Delivery Address Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Delivery Address
          </Text>

          <View style={styles.addressRow}>
            <View style={[styles.addressPinCircle, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.addressFullText, { color: colors.textPrimary }]}>
                {order.deliveryAddress}
              </Text>
              <Text style={[styles.addressCityState, { color: colors.textSecondary }]}>
                Chennai, Tamil Nadu • 15 Mins Delivery Zone
              </Text>
            </View>
          </View>
        </View>

        {/* 7. Footer Actions: Invoice & Support */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDownloadInvoice}
            style={[
              styles.secondaryActionBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons
              name="download-outline"
              size={16}
              color={colors.textPrimary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.secondaryActionText, { color: colors.textPrimary }]}>
              Download Invoice
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSupport}
            style={[
              styles.primaryActionBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons
              name="headset-outline"
              size={16}
              color={colors.onPrimary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.primaryActionText, { color: colors.onPrimary }]}>
              Need Help?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statusHeroCard: {
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeroTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  statusHeroSub: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  orderMetaTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  orderIdText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  orderDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  sectionCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    zIndex: 2,
  },
  pendingInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepConnector: {
    position: 'absolute',
    top: 10,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: 1,
  },
  stepLabel: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 2,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  partnerVehicle: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemsCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  productUnit: {
    fontSize: 11.5,
    marginTop: 3,
  },
  itemPriceBox: {
    alignItems: 'flex-end',
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemQtyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  itemQtyText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  billValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    marginVertical: 10,
  },
  billTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalPaidLabel: {
    fontSize: 15,
    fontWeight: '900',
  },
  paymentMethodSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressPinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressFullText: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  addressCityState: {
    fontSize: 11.5,
    marginTop: 3,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
