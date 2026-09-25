import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppHeader, Skeleton, useStatusModal } from '../../../components';
import { useTheme } from '../../../theme';
import { Order } from '../types';
import { OrderService } from '../services/orderService';
import { useOrders } from '../hooks/useOrders';
import { mapOdooSaleOrderToOrder } from '../utils/orderMapper';

const CANCELLATION_REASONS = [
  'Ordered items by mistake',
  'Delivery time is taking too long',
  'Need to change delivery address or contact',
  'Forgot to add essential items to order',
  'Found a better price / ordered elsewhere',
  'Other reason (please specify)',
];

interface OrderDetailsScreenProps {
  order: Order;
  onBack: () => void;
}

// ── OrderItemRow ──────────────────────────────────────────────────────────────
// Separate component so useState (for image error fallback) is called at the
// component level — not inside a .map() callback which violates Rules of Hooks.
interface OrderItemRowProps {
  item: Order['items'][0];
  index: number;
  isLast: boolean;
  colors: any;
  borderRadius: any;
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({ item, index, isLast, colors, borderRadius }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <View
      style={[
        itemRowStyles.itemRow,
        {
          borderBottomColor: colors.divider,
          borderBottomWidth: isLast ? 0 : 1,
        },
      ]}
    >
      {/* Product Image Thumbnail with graceful error fallback */}
      {item.product.imageUrl && !imgError ? (
        <Image
          source={{ uri: item.product.imageUrl }}
          style={[
            itemRowStyles.productImage,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
          ]}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View
          style={[
            itemRowStyles.productImagePlaceholder,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
          ]}
        >
          <Ionicons name="basket-outline" size={22} color={colors.primary} />
        </View>
      )}

      {/* Product Name & Unit Details */}
      <View style={itemRowStyles.itemDetails}>
        <Text
          style={[itemRowStyles.productName, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {item.product.name}
        </Text>
        <Text style={[itemRowStyles.productUnit, { color: colors.textSecondary }]}>
          {item.product.unit || 'Standard Pack'} • ₹{item.price} each
        </Text>
      </View>

      {/* Quantity & Item Total Price */}
      <View style={itemRowStyles.itemPriceBox}>
        <Text style={[itemRowStyles.itemTotalPrice, { color: colors.textPrimary }]}>
          ₹{(item.price * item.quantity).toFixed(2).replace(/\.00$/, '')}
        </Text>
        <View style={[itemRowStyles.itemQtyBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[itemRowStyles.itemQtyText, { color: colors.textPrimary }]}>
            Qty: {item.quantity}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Styles shared by OrderItemRow (referenced before StyleSheet.create at bottom of file)
const itemRowStyles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productImage: {
    width: 52,
    height: 52,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 52,
    height: 52,
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
    lineHeight: 19,
  },
  productUnit: {
    fontSize: 11.5,
    marginTop: 3,
    fontWeight: '500',
  },
  itemPriceBox: {
    alignItems: 'flex-end',
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemQtyBadge: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  itemQtyText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
// ─────────────────────────────────────────────────────────────────────────────

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  order: initialOrder,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, isDark } = useTheme();
  const { cancelOrder } = useOrders();
  const { showStatusModal } = useStatusModal();

  const [order, setOrder] = useState<Order>(initialOrder);
  const [livePicking, setLivePicking] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  // Computes genuine MRP sum for all items to display accurate bill breakdown
  const itemsMRP = React.useMemo(() => {
    if (order.items && order.items.length > 0) {
      const itemsSum = order.items.reduce((sum, it) => {
        const orig = Number(it.product?.originalPrice || 0);
        const unit = orig > 0 ? orig : Number(it.price || 0);
        return sum + unit * Number(it.quantity || 1);
      }, 0);
      if (itemsSum > 0) return itemsSum;
    }
    const base = Math.max(0, order.totalAmount - (order.deliveryFee || 0) - 5);
    return base + (order.savings || 0);
  }, [order.items, order.totalAmount, order.deliveryFee, order.savings]);

  // 1. Fetch live order details & real lines from Odoo (Postman: "Get Particular Sale Order")
  useEffect(() => {
    let isMounted = true;
    if (!initialOrder?.id) return;

    setLoadingDetails(true);
    OrderService.getOrderDetails(initialOrder.id)
      .then(async res => {
        const details = Array.isArray(res?.result) ? res.result[0] : res?.result;
        if (isMounted && details) {
          let lineDetails: any[] = [];
          if (Array.isArray(details.order_line) && details.order_line.length > 0) {
            try {
              const linesRes = await OrderService.getOrderLines(details.order_line);
              lineDetails = Array.isArray(linesRes?.result)
                ? linesRes.result
                : Array.isArray(linesRes)
                ? linesRes
                : [];

              // Fetch product thumbnails
              const prodIds = lineDetails
                .map((l: any) => (Array.isArray(l.product_id) ? l.product_id[0] : l.product_id))
                .filter(Boolean);

              if (prodIds.length > 0) {
                const thumbsRes = await OrderService.getOrderProductThumbnails(prodIds);
                const thumbs = Array.isArray(thumbsRes?.result)
                  ? thumbsRes.result
                  : Array.isArray(thumbsRes)
                  ? thumbsRes
                  : [];
                const thumbMap: Record<number, any> = {};
                thumbs.forEach((t: any) => {
                  thumbMap[t.id] = t;
                });

                lineDetails = lineDetails.map((l: any) => {
                  const pid = Array.isArray(l.product_id) ? l.product_id[0] : l.product_id;
                  const thumb = thumbMap[pid];
                  return {
                    ...l,
                    image_512: thumb?.image_512 || undefined,
                    image_256: thumb?.image_256 || undefined,
                    image_128: thumb?.image_128 || undefined,
                    product_tmpl_id: thumb?.product_tmpl_id || undefined,
                  };
                });
              }
            } catch (lErr) {
              console.warn('Failed to load order lines in details:', lErr);
            }
          }

          if (isMounted) {
            const mapped = mapOdooSaleOrderToOrder({
              ...details,
              order_line_details: lineDetails,
            });
            setOrder(prev => ({
              ...mapped,
              deliveryFee:
                mapped.deliveryFee !== undefined && mapped.deliveryFee > 0
                  ? mapped.deliveryFee
                  : prev.deliveryFee,
            }));
          }
        }
      })
      .catch(err => console.warn('getOrderDetails error:', err))
      .finally(() => {
        if (isMounted) setLoadingDetails(false);
      });

    // 2. Fetch live delivery tracking (Postman: "Delivery Tracking particular sale")
    OrderService.getDeliveryTracking(initialOrder.id)
      .then(res => {
        const pickings = Array.isArray(res?.result) ? res.result : [];
        if (isMounted && pickings.length > 0) {
          setLivePicking(pickings[0]);
          const picking = pickings[0];
          const state = picking.state;

          if (state === 'done') {
            setOrder(prev => ({ ...prev, status: 'delivered' }));
          } else if (state === 'assigned') {
            if (picking.carrier_id) {
              setOrder(prev => ({ ...prev, status: 'in_transit' }));
            } else {
              setOrder(prev => ({ ...prev, status: 'preparing' }));
            }
          } else if (state === 'confirmed' || state === 'waiting') {
            setOrder(prev => ({ ...prev, status: 'confirmed' }));
          } else if (state === 'cancel') {
            setOrder(prev => ({ ...prev, status: 'cancelled' }));
          }

          // If carrier is assigned on stock.picking, enrich deliveryPartner
          if (picking.carrier_id) {
            const cName = Array.isArray(picking.carrier_id) ? picking.carrier_id[1] : String(picking.carrier_id);
            setOrder(prev => ({
              ...prev,
              deliveryPartner: {
                name: cName,
                phone: 'Support via App',
                vehicle: 'Express Doorstep Delivery',
                rating: 4.9,
              },
            }));
          }
        }
      })
      .catch(err => console.warn('getDeliveryTracking error:', err));

    // 3. Fetch delivery charge line specifically from sale.order.line
    // Postman / Odoo RPC: search_read where order_id = orderId and product_id.name ilike 'Delivery Charge'
    OrderService.getOrderDeliveryCharge(initialOrder.id)
      .then(res => {
        const lines = Array.isArray(res?.result)
          ? res.result
          : Array.isArray(res)
          ? res
          : [];
        if (isMounted && lines.length > 0) {
          const deliveryLine = lines[0];
          const fee = Number(
            deliveryLine.price_total ??
            deliveryLine.price_subtotal ??
            deliveryLine.price_unit ??
            0
          );
          if (fee >= 0) {
            setOrder(prev => ({
              ...prev,
              deliveryFee: fee,
            }));
          }
        }
      })
      .catch(err => console.warn('getOrderDeliveryCharge error:', err));


    return () => {
      isMounted = false;
    };
  }, [initialOrder?.id, initialOrder?.orderNumber]);

  const isOtherReason = selectedReason === 'Other reason (please specify)';
  const isReasonValid = isOtherReason
    ? customReasonText.trim().length >= 4
    : selectedReason.trim().length > 0;

  // Cancel order handler: opens structured reason modal
  const handleCancelOrder = () => {
    setSelectedReason('');
    setCustomReasonText('');
    setCancelModalVisible(true);
  };

  // Confirms cancellation after validating that a valid reason is chosen or entered
  const handleConfirmCancel = async () => {
    if (!isReasonValid || cancelling) return;
    const finalReason = isOtherReason ? customReasonText.trim() : selectedReason;
    setCancelling(true);
    try {
      await cancelOrder(order.id, finalReason);
      setOrder(prev => ({ ...prev, status: 'cancelled' }));
      setCancelModalVisible(false);
      showStatusModal({
        type: 'success',
        title: 'Order Cancelled',
        message: `Order ${order.orderNumber} has been successfully cancelled.\n\nReason: ${finalReason}`,
      });
    } catch (err: any) {
      showStatusModal({
        type: 'error',
        title: 'Cancellation Failed',
        message: err?.message || 'Failed to cancel order. Please contact support.',
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusConfig = () => {
    switch (order.status) {
      case 'confirmed':
        return {
          title: 'Order Confirmed',
          subtitle: 'Order received and confirmed by store',
          icon: 'receipt',
          bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
          color: '#16A34A',
          border: isDark ? 'rgba(34, 197, 94, 0.35)' : '#BBF7D0',
          step: 1,
        };
      case 'preparing':
        return {
          title: 'Order Packed',
          subtitle: 'Store partner has packed your order at local hub',
          icon: 'cube',
          bg: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
          color: '#D97706',
          border: isDark ? 'rgba(217, 119, 6, 0.35)' : '#FDE68A',
          step: 2,
        };
      case 'in_transit':
        return {
          title: 'Out for Delivery',
          subtitle: 'Your order is on the way for doorstep delivery',
          icon: 'bicycle',
          bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#F0F9FF',
          color: '#0284C7',
          border: isDark ? 'rgba(2, 132, 199, 0.35)' : '#BAE6FD',
          step: 3,
        };
      case 'delivered':
        return {
          title: 'Order Delivered',
          subtitle: `Delivered safely on ${order.date}, ${order.time}`,
          icon: 'checkmark-circle',
          bg: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
          color: '#16A34A',
          border: isDark ? 'rgba(22, 163, 74, 0.35)' : '#BBF7D0',
          step: 4,
        };
      case 'cancelled':
        return {
          title: 'Order Cancelled',
          subtitle: 'This order was cancelled. Full refund initiated.',
          icon: 'close-circle',
          bg: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2',
          color: '#DC2626',
          border: isDark ? 'rgba(220, 38, 38, 0.35)' : '#FECACA',
          step: 0,
        };
      default:
        return {
          title: 'Order Confirmed',
          subtitle: 'Order received and confirmed by store',
          icon: 'receipt',
          bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
          color: '#16A34A',
          border: isDark ? 'rgba(34, 197, 94, 0.35)' : '#BBF7D0',
          step: 1,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const partner = order.deliveryPartner;


  const steps = [
    { label: 'Confirmed', desc: order.time || 'Order Placed', icon: 'receipt-outline' },
    {
      label: 'Packed',
      desc:
        livePicking?.state === 'assigned' || livePicking?.state === 'done'
          ? 'Packed at Hub'
          : order.status === 'in_transit' || order.status === 'delivered'
          ? 'Hub Packed'
          : 'Processing',
      icon: 'cube-outline',
    },
    {
      label: 'On The Way',
      desc:
        livePicking?.carrier_id
          ? (Array.isArray(livePicking.carrier_id) ? livePicking.carrier_id[1] : String(livePicking.carrier_id))
          : 'Express Delivery',
      icon: 'bicycle-outline',
    },
    {
      label: 'Delivered',
      desc:
        order.status === 'delivered'
          ? (livePicking?.date_done ? String(livePicking.date_done).slice(11, 16) : order.time)
          : (livePicking?.scheduled_date ? String(livePicking.scheduled_date).slice(11, 16) : '~15 mins'),
      icon: 'home-outline',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Order Details"
        onBack={onBack}
        rightAction={
          loadingDetails ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
          ) : undefined
        }
      />

      {loadingDetails && (!order?.items || order.items.length === 0) ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 30, 40) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Hero Card Skeleton */}
          <View
            style={[
              styles.statusHeroCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <View style={styles.statusHeroTop}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Skeleton width="60%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="85%" height={13} borderRadius={4} />
              </View>
            </View>
          </View>

          {/* Timeline Skeleton */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
                paddingVertical: 18,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
              {[1, 2, 3, 4].map(s => (
                <View key={s} style={{ alignItems: 'center', width: 68 }}>
                  <Skeleton width={32} height={32} borderRadius={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={50} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                  <Skeleton width={36} height={10} borderRadius={4} />
                </View>
              ))}
            </View>
          </View>

          {/* Items Skeleton */}
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
            <Skeleton width={130} height={18} borderRadius={4} style={{ marginBottom: 16 }} />
            {[1, 2].map(i => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: i === 1 ? 1 : 0,
                  borderBottomColor: colors.divider,
                }}
              >
                <Skeleton width={52} height={52} borderRadius={borderRadius.md} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="70%" height={15} borderRadius={4} style={{ marginBottom: 6 }} />
                  <Skeleton width="40%" height={12} borderRadius={4} />
                </View>
                <Skeleton width={50} height={16} borderRadius={4} />
              </View>
            ))}
          </View>

          {/* Bill Summary Skeleton */}
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
            <Skeleton width={140} height={18} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={90} height={14} borderRadius={4} />
                <Skeleton width={50} height={14} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={80} height={14} borderRadius={4} />
                <Skeleton width={40} height={14} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider }}>
                <Skeleton width={100} height={16} borderRadius={4} />
                <Skeleton width={65} height={16} borderRadius={4} />
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
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
              borderColor: statusConfig.border,
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
              <Ionicons name={statusConfig.icon} size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.statusBadgePill}>
                <Text style={[styles.statusHeroTitle, { color: statusConfig.color }]}>
                  {statusConfig.title}
                </Text>
              </View>
              <Text style={[styles.statusHeroSub, { color: colors.textSecondary }]}>
                {statusConfig.subtitle}
              </Text>
            </View>
          </View>


          {/* Order ID & Date Tag Row */}
          <View style={[styles.orderMetaTagRow, { borderTopColor: colors.divider }]}>
            <View style={[styles.orderIdBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.orderIdText, { color: colors.textPrimary }]}>
                Order #{order.orderNumber.replace(/^#+/, '')}
              </Text>
            </View>
            <Text style={[styles.orderDateText, { color: colors.textSecondary }]}>
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
            <View style={styles.timelineHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Delivery Timeline
              </Text>
            </View>

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
                          <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                        ) : (
                          <Ionicons name={step.icon} size={11} color={colors.textTertiary} />
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
                    <Text
                      style={[styles.stepDesc, { color: colors.textTertiary }]}
                      numberOfLines={1}
                    >
                      {step.desc}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 3. Delivery Partner Info */}
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
            <View style={styles.deliveryMethodHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                Delivery Method
              </Text>
              {order.deliveryFee !== undefined && (
                <View
                  style={[
                    styles.methodFeeBadge,
                    {
                      backgroundColor:
                        order.deliveryFee > 0
                          ? isDark
                            ? 'rgba(59, 130, 246, 0.15)'
                            : '#EFF6FF'
                          : '#DCFCE7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.methodFeeBadgeText,
                      { color: order.deliveryFee > 0 ? '#2563EB' : '#16A34A' },
                    ]}
                  >
                    {order.deliveryFee > 0
                      ? `₹${order.deliveryFee.toFixed(2).replace(/\.00$/, '')} Express`
                      : 'FREE Delivery'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.partnerRow}>
              <View style={[styles.partnerAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="bicycle" size={22} color={colors.onPrimary} />
              </View>

              <View style={styles.partnerInfo}>
                <Text style={[styles.partnerName, { color: colors.textPrimary }]}>
                  {partner.name}
                </Text>
                <Text style={[styles.partnerVehicle, { color: colors.textSecondary }]}>
                  {partner.vehicle || 'Express Doorstep Delivery'}
                </Text>
              </View>
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
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                Items in this Order
              </Text>
              <Text style={[styles.itemsCountSubtitle, { color: colors.textSecondary }]}>
                {order.itemCount} Total Items
              </Text>
            </View>
            <View style={[styles.itemsCountBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.itemsCountBadgeText, { color: colors.primary }]}>
                {order.items.length} Products
              </Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <OrderItemRow
                key={index}
                item={item}
                index={index}
                isLast={index === order.items.length - 1}
                colors={colors}
                borderRadius={borderRadius}
              />
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
          <View style={styles.billHeaderRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
              Bill & Payment Summary
            </Text>
          </View>

          <View style={styles.billContent}>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
                Items Total (MRP)
              </Text>
              <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                ₹{itemsMRP.toFixed(2).replace(/\.00$/, '')}
              </Text>
            </View>

            {order.savings > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#16A34A' }]}>
                  Discounts & Offers
                </Text>
                <Text style={[styles.billValue, { color: '#16A34A', fontWeight: '700' }]}>
                  - ₹{order.savings.toFixed(2).replace(/\.00$/, '')}
                </Text>
              </View>
            )}

            <View style={styles.billRow}>
              <View style={styles.billLabelWithIcon}>
                <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
                  Delivery Fee
                </Text>
                <View
                  style={[
                    styles.deliveryFeeBadge,
                    {
                      backgroundColor:
                        order.deliveryFee && order.deliveryFee > 0
                          ? isDark
                            ? 'rgba(59, 130, 246, 0.15)'
                            : '#EFF6FF'
                          : '#DCFCE7',
                    },
                  ]}
                >
                  <Ionicons
                    name="bicycle-outline"
                    size={11}
                    color={order.deliveryFee && order.deliveryFee > 0 ? '#2563EB' : '#16A34A'}
                    style={{ marginRight: 3 }}
                  />
                  <Text
                    style={[
                      styles.deliveryFeeBadgeText,
                      {
                        color:
                          order.deliveryFee && order.deliveryFee > 0
                            ? '#2563EB'
                            : '#16A34A',
                      },
                    ]}
                  >
                    15 Mins Express
                  </Text>
                </View>
              </View>
              {order.deliveryFee && order.deliveryFee > 0 ? (
                <Text style={[styles.billValue, { color: colors.textPrimary, fontWeight: '700' }]}>
                  ₹{order.deliveryFee.toFixed(2).replace(/\.00$/, '')}
                </Text>
              ) : (
                <View style={styles.freeDeliveryBadge}>
                  <Text style={styles.freeDeliveryText}>FREE</Text>
                </View>
              )}
            </View>

            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.textSecondary }]}>
                Handling & Packaging Fee
              </Text>
              <Text style={[styles.billValue, { color: colors.textPrimary }]}>₹5</Text>
            </View>

            <View style={[styles.dashedDivider, { borderColor: colors.divider }]} />

            <View style={styles.billTotalRow}>
              <View>
                <Text style={[styles.totalPaidLabel, { color: colors.textPrimary }]}>
                  Total Amount Paid
                </Text>
                <View style={[styles.paymentMethodChip, { backgroundColor: colors.surfaceVariant }]}>
                  <Ionicons name="card-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.paymentMethodSub, { color: colors.textSecondary }]}>
                    {order.paymentMode}
                  </Text>
                </View>
              </View>
              <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
                ₹{order.totalAmount.toFixed(2).replace(/\.00$/, '')}
              </Text>
            </View>
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
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.addressFullText, { color: colors.textPrimary }]}>
                {order.deliveryAddress}
              </Text>
              <Text style={[styles.addressCityState, { color: colors.textSecondary }]}>
                Chennai, Tamil Nadu • 15 Mins Express Zone
              </Text>
            </View>
          </View>
        </View>


        {/* 8. Cancel Order Action (Only for active non-delivered orders) */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCancelOrder}
            disabled={cancelling}
            style={[
              styles.cancelOrderBtn,
              { borderRadius: borderRadius.lg },
            ]}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
      )}

      {/* Cancellation Reason Selection Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!cancelling) setCancelModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.cancelModalContent,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16) + 12,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Cancel Order
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Order #{order.orderNumber?.replace(/^#+/, '')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => !cancelling && setCancelModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? '#2D3748' : '#F1F5F9' },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 380 }}
            >
              <Text style={[styles.reasonPrompt, { color: colors.textSecondary }]}>
                Please choose a reason for cancellation (required):
              </Text>

              {CANCELLATION_REASONS.map((reason, idx) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => setSelectedReason(reason)}
                    style={[
                      styles.reasonRow,
                      {
                        borderColor: isSelected
                          ? colors.primary
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : '#E2E8F0',
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(76, 175, 80, 0.12)'
                            : '#F0FDF4'
                          : isDark
                          ? '#1E293B'
                          : '#F8FAFC',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected ? colors.primary : colors.textSecondary,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        {
                          color: isSelected ? colors.textPrimary : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Custom reason input if "Other" is selected */}
              {isOtherReason && (
                <View style={styles.customInputContainer}>
                  <Text style={[styles.customInputLabel, { color: colors.textPrimary }]}>
                    Specify your reason <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.customReasonInput,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        color: colors.textPrimary,
                        borderColor:
                          customReasonText.trim().length >= 4
                            ? colors.primary
                            : isDark
                            ? 'rgba(255,255,255,0.15)'
                            : '#CBD5E1',
                      },
                    ]}
                    placeholder="Please tell us why you are cancelling..."
                    placeholderTextColor={colors.textSecondary}
                    value={customReasonText}
                    onChangeText={setCustomReasonText}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />
                  <Text
                    style={[
                      styles.inputCharCount,
                      {
                        color:
                          customReasonText.trim().length >= 4
                            ? colors.textSecondary
                            : '#DC2626',
                      },
                    ]}
                  >
                    {customReasonText.trim().length < 4
                      ? `Enter at least ${4 - customReasonText.trim().length} more characters`
                      : `${customReasonText.length}/200`}
                  </Text>
                </View>
              )}

              {/* Notice note */}
              <View
                style={[
                  styles.cancelNoticeBox,
                  {
                    backgroundColor: isDark ? '#3E1F1F' : '#FEF2F2',
                    borderColor: '#FCA5A5',
                  },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={17} color="#DC2626" />
                <Text style={styles.cancelNoticeText}>
                  Cancellation is permanent. Any online payment will be refunded to your original payment method.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelling}
                style={[
                  styles.modalCancelBtn,
                  {
                    borderColor: isDark ? '#4A5568' : '#CBD5E1',
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>
                  Keep Order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirmCancel}
                disabled={!isReasonValid || cancelling}
                style={[
                  styles.modalConfirmBtn,
                  {
                    borderRadius: borderRadius.md,
                    backgroundColor: isReasonValid && !cancelling ? '#DC2626' : '#FCA5A5',
                  },
                ]}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    Confirm Cancellation
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statusHeroCard: {
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgePill: {
    marginBottom: 2,
  },
  statusHeroTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  statusHeroSub: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  liveMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  liveMapBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pulseIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveMapTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  liveMapSub: {
    fontSize: 11,
    marginTop: 1,
  },
  orderMetaTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  orderIdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderIdText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  orderDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0284C7',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 6,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepConnector: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    top: 10,
    zIndex: 1,
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 2,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partnerName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  partnerVehicle: {
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemsCountSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
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
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '700',
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
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 3,
  },
  itemQtyText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  deliveryMethodHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodFeeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodFeeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  billHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billContent: {
    gap: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billLabel: {
    fontSize: 13,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  deliveryFeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  deliveryFeeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  freeDeliveryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#DCFCE7',
  },
  freeDeliveryText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalPaidLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  paymentMethodSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  grandTotalValue: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  addressPinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressFullText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  addressCityState: {
    fontSize: 11.5,
    marginTop: 3,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    gap: 6,
  },
  cancelOrderBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  cancelModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonPrompt: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonText: {
    fontSize: 13.5,
    flex: 1,
  },
  customInputContainer: {
    marginTop: 6,
    marginBottom: 10,
  },
  customInputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  customReasonInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 13.5,
    minHeight: 76,
    textAlignVertical: 'top',
  },
  inputCharCount: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
  cancelNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 14,
    gap: 8,
  },
  cancelNoticeText: {
    fontSize: 11.5,
    color: '#DC2626',
    flex: 1,
    fontWeight: '500',
    lineHeight: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1.4,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
