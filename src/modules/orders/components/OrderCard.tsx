import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const { colors, borderRadius } = useTheme();

  const getStatusConfig = () => {
    switch (order.status) {
      case 'in_transit':
        return {
          label: 'Out for Delivery',
          icon: 'bicycle',
          bg: '#E0F2FE',
          color: '#0284C7',
        };
      case 'preparing':
        return {
          label: 'Packing Order',
          icon: 'cube',
          bg: '#FEF3C7',
          color: '#D97706',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          icon: 'checkmark-circle',
          bg: '#DCFCE7',
          color: '#16A34A',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: 'close-circle',
          bg: '#FEE2E2',
          color: '#DC2626',
        };
      default:
        return {
          label: 'Processing',
          icon: 'time',
          bg: colors.surfaceVariant,
          color: colors.primary,
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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
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
      {/* Top Header Row */}
      <View style={[styles.headerRow, { borderBottomColor: colors.divider }]}>
        <View>
          <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
            {order.orderNumber}
          </Text>
          <Text style={[styles.orderDateTime, { color: colors.textSecondary }]}>
            {order.date} • {order.time}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Ionicons
            name={statusConfig.icon}
            size={12}
            color={statusConfig.color}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Body: Multi-Item Count Presentation */}
      <View style={styles.bodySection}>
        {/* Primary Item Name with Quantity */}
        <View style={styles.primaryItemRow}>
          <Text
            style={[styles.primaryItemTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {primaryItem ? primaryItem.product.name : 'Grocery Items'}
          </Text>

          {primaryItem && primaryItem.quantity > 1 && (
            <View
              style={[
                styles.qtyPill,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.qtyPillText, { color: colors.textPrimary }]}>
                x{primaryItem.quantity}
              </Text>
            </View>
          )}
        </View>

        {/* If Multiple Items: Multi-Item Count Pill & Names */}
        {additionalItemsCount > 0 && (
          <View style={styles.moreItemsRow}>
            <View
              style={[
                styles.moreItemsPill,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.moreItemsCount, { color: colors.primary }]}>
                +{additionalItemsCount} more {additionalItemsCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <Text
              style={[styles.otherItemsText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              ({otherItemsSummary})
            </Text>
          </View>
        )}

        {/* Meta summary: total items, payment & delivery address */}
        <View style={styles.metaRow}>
          <Text style={[styles.itemSummaryText, { color: colors.textSecondary }]}>
            Total {order.itemCount} items • {order.paymentMode}
          </Text>
          <Text
            style={[styles.addressLine, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            📍 {order.deliveryAddress}
          </Text>
        </View>

        {/* Live In-Transit ETA Banner */}
        {order.status === 'in_transit' && order.eta && (
          <View
            style={[
              styles.etaBanner,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.primary,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Ionicons name="flash" size={15} color={colors.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.etaText, { color: colors.primary }]}>
              Arriving in ~{order.eta}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Footer Row */}
      <View style={[styles.footerRow, { borderTopColor: colors.divider }]}>
        <View>
          <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>
            ₹{order.totalAmount}
          </Text>
          {order.savings > 0 && (
            <Text style={[styles.savingsText, { color: colors.secondary }]}>
              Saved ₹{order.savings}
            </Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onTrackOrder(order)}
          style={[
            styles.trackButton,
            {
              backgroundColor:
                order.status === 'in_transit'
                  ? colors.primary
                  : colors.surfaceVariant,
              borderColor:
                order.status === 'in_transit' ? colors.primary : colors.border,
              borderWidth: order.status === 'in_transit' ? 0 : 1,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Ionicons
            name={order.status === 'in_transit' ? 'navigate' : 'receipt-outline'}
            size={14}
            color={
              order.status === 'in_transit'
                ? colors.onPrimary
                : colors.textPrimary
            }
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.trackButtonText,
              {
                color:
                  order.status === 'in_transit'
                    ? colors.onPrimary
                    : colors.textPrimary,
              },
            ]}
          >
            {order.status === 'in_transit' ? 'Track Order' : 'View Details'}
          </Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  orderDateTime: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bodySection: {
    paddingVertical: 12,
  },
  primaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryItemTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  qtyPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  qtyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  moreItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  moreItemsPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  moreItemsCount: {
    fontSize: 11,
    fontWeight: '800',
  },
  otherItemsText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  metaRow: {
    marginTop: 8,
  },
  itemSummaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addressLine: {
    fontSize: 11.5,
    marginTop: 3,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '900',
  },
  savingsText: {
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 1,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
