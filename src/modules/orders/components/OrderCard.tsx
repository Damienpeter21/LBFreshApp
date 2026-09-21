import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { Order } from '../types';

interface OrderCardProps {
  order: Order;
  onTrackOrder: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onTrackOrder,
}) => {
  const { colors, borderRadius, isDark } = useTheme();

  const getStatusConfig = () => {
    switch (order.status) {
      case 'in_transit':
        return {
          label: 'Out for Delivery',
          icon: 'bicycle-outline',
          bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
          color: '#0284C7',
          border: isDark ? 'rgba(2, 132, 199, 0.3)' : '#BAE6FD',
        };
      case 'preparing':
        return {
          label: 'Packing Order',
          icon: 'cube-outline',
          bg: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
          color: '#D97706',
          border: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          icon: 'checkmark-circle-outline',
          bg: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7',
          color: '#16A34A',
          border: isDark ? 'rgba(22, 163, 74, 0.3)' : '#BBF7D0',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: 'close-circle-outline',
          bg: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
          color: '#DC2626',
          border: isDark ? 'rgba(220, 38, 38, 0.3)' : '#FECACA',
        };
      default:
        return {
          label: 'Order Confirmed',
          icon: 'receipt-outline',
          bg: colors.surfaceVariant,
          color: colors.primary,
          border: colors.border,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const primaryItem = order.items[0];
  const additionalItemsCount = order.items.length - 1;

  const otherItemsSummary = order.items
    .slice(1)
    .map(i => i.product.name)
    .join(', ');

  const previewItems = order.items.slice(0, 4);
  const remainingThumbCount = order.items.length - 4;
  const isSingleItemOrder = order.items.length <= 1;

  // Format order number cleanly without double ##
  const cleanOrderNumber = order.orderNumber.replace(/^#+/, '');

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onTrackOrder(order)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: borderRadius.xl,
        },
      ]}
    >
      {/* 1. Header: Order Number & Status Badge */}
      <View style={[styles.headerRow, { borderBottomColor: colors.divider }]}>
        <View style={styles.orderIdentity}>
          <View style={[styles.orderNumberBadge, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.orderNumberText, { color: colors.textPrimary }]}>
              #{cleanOrderNumber}
            </Text>
          </View>
          <Text style={[styles.orderDateTime, { color: colors.textSecondary }]}>
            {order.date} • {order.time}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.border,
            },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={13}
            color={statusConfig.color}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* 2. Middle Content Section */}
      {isSingleItemOrder ? (
        /* ── Case A: Single Item Order (Side-by-side layout: Image on left, full details on right) ── */
        <View style={styles.sideBySideRow}>
          {/* Left: 66x66 Product Thumbnail */}
          <View
            style={[
              styles.singleThumbBox,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            {primaryItem?.product?.imageUrl ? (
              <Image
                source={{ uri: primaryItem.product.imageUrl }}
                style={[styles.singleThumbImage, { borderRadius: borderRadius.lg }]}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.singleThumbPlaceholder}>
                <Ionicons name="basket-outline" size={26} color={colors.primary} />
              </View>
            )}
            {primaryItem && primaryItem.quantity > 1 && (
              <View
                style={[
                  styles.thumbQtyPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.thumbQtyText, { color: colors.textPrimary }]}>
                  x{primaryItem.quantity}
                </Text>
              </View>
            )}
          </View>

          {/* Right: Product Title, Unit, Meta Chips, and Delivery Address */}
          <View style={styles.sideBySideDetails}>
            <View style={styles.primaryTitleRow}>
              <Text
                style={[styles.productTitleText, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {primaryItem ? primaryItem.product.name : 'Grocery Item'}
              </Text>
              {primaryItem && primaryItem.quantity > 1 && (
                <View
                  style={[
                    styles.qtyUnitsPill,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.qtyUnitsText, { color: colors.textPrimary }]}>
                    {primaryItem.quantity} units
                  </Text>
                </View>
              )}
            </View>

            {primaryItem?.product?.unit && (
              <Text style={[styles.productUnitText, { color: colors.textSecondary }]}>
                {primaryItem.product.unit}
              </Text>
            )}

            {/* Meta Tags Row */}
            <View style={styles.metaBadgeRow}>
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Ionicons name="cart-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                  {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>

              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Ionicons name="card-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                  {order.paymentMode}
                </Text>
              </View>
            </View>

            {/* Address Row */}
            <View style={styles.addressLineContainer}>
              <Ionicons
                name="location-sharp"
                size={12}
                color={colors.primary}
                style={{ marginTop: 2, marginRight: 4 }}
              />
              <Text
                style={[styles.addressLine, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {order.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* ── Case B: Multiple Items Order (Thumbnails strip + full width description) ── */
        <View style={styles.multiItemSection}>
          <View style={styles.thumbnailStrip}>
            {previewItems.map((it, idx) => (
              <View
                key={idx}
                style={[
                  styles.multiThumbBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                {it.product.imageUrl ? (
                  <Image
                    source={{ uri: it.product.imageUrl }}
                    style={[styles.multiThumbImage, { borderRadius: borderRadius.md }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.singleThumbPlaceholder}>
                    <Ionicons name="basket-outline" size={18} color={colors.primary} />
                  </View>
                )}
                {it.quantity > 1 && (
                  <View
                    style={[
                      styles.thumbQtyPill,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.thumbQtyText, { color: colors.textPrimary }]}>
                      x{it.quantity}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {remainingThumbCount > 0 && (
              <View
                style={[
                  styles.moreThumbBadge,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text style={[styles.moreThumbText, { color: colors.primary }]}>
                  +{remainingThumbCount}
                </Text>
                <Text style={[styles.moreThumbSub, { color: colors.textSecondary }]}>
                  more
                </Text>
              </View>
            )}
          </View>

          <View style={styles.multiItemDetails}>
            <Text
              style={[styles.productTitleText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {primaryItem ? primaryItem.product.name : 'Grocery Items'}
            </Text>
            {additionalItemsCount > 0 && (
              <Text
                style={[styles.otherItemsText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                + {additionalItemsCount} other items ({otherItemsSummary})
              </Text>
            )}

            {/* Meta Tags Row */}
            <View style={styles.metaBadgeRow}>
              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Ionicons name="cart-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                  {order.itemCount} items
                </Text>
              </View>

              <View
                style={[
                  styles.metaChip,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Ionicons name="card-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                  {order.paymentMode}
                </Text>
              </View>
            </View>

            {/* Address Row */}
            <View style={styles.addressLineContainer}>
              <Ionicons
                name="location-sharp"
                size={12}
                color={colors.primary}
                style={{ marginTop: 2, marginRight: 4 }}
              />
              <Text
                style={[styles.addressLine, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {order.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 3. Bottom Footer: Price, Savings & "View Details" Button */}
      <View style={[styles.footerRow, { borderTopColor: colors.divider }]}>
        <View>
          <View style={styles.priceContainer}>
            <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>
              ₹{order.totalAmount}
            </Text>
            {order.savings > 0 && (
              <View style={[styles.savingsBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7' }]}>
                <Text style={styles.savingsText}>Saved ₹{order.savings}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.taxInclusiveText, { color: colors.textTertiary }]}>
            Inclusive of all taxes
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onTrackOrder(order)}
          style={[
            styles.viewDetailsBtn,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Ionicons
            name="receipt-outline"
            size={14}
            color={colors.textPrimary}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.viewDetailsBtnText,
              { color: colors.textPrimary },
            ]}
          >
            View Details
          </Text>
          <Ionicons
            name="chevron-forward"
            size={13}
            color={colors.textSecondary}
            style={{ marginLeft: 3 }}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  orderIdentity: {
    flex: 1,
    marginRight: 8,
  },
  orderNumberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 3,
  },
  orderNumberText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  orderDateTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* ── Side-by-side Presentation for Single Item Orders ── */
  sideBySideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  singleThumbBox: {
    width: 66,
    height: 66,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleThumbImage: {
    width: '100%',
    height: '100%',
  },
  singleThumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBySideDetails: {
    flex: 1,
    marginLeft: 12,
  },
  primaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
    lineHeight: 19,
  },
  productUnitText: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  qtyUnitsPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  qtyUnitsText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* ── Multiple Items Presentation ── */
  multiItemSection: {
    paddingVertical: 10,
  },
  thumbnailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  multiThumbBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiThumbImage: {
    width: '100%',
    height: '100%',
  },
  moreThumbBadge: {
    width: 50,
    height: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreThumbText: {
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 14,
  },
  moreThumbSub: {
    fontSize: 8.5,
    fontWeight: '600',
  },
  multiItemDetails: {
    marginTop: 2,
  },
  otherItemsText: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },

  /* ── Common Meta & Address Rows ── */
  thumbQtyPill: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
  },
  thumbQtyText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    gap: 4,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addressLineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  addressLine: {
    fontSize: 11.5,
    flex: 1,
    fontWeight: '500',
  },

  /* ── Footer Row ── */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  savingsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  taxInclusiveText: {
    fontSize: 10.5,
    marginTop: 2,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  viewDetailsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
