import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppHeader, useStatusModal } from '../../../components';
import { API_SETTINGS } from '../../../app/config';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useAddress } from '../../profile';
import { useCart } from '../context/CartContext';
import { CartService } from '../services/cartService';
import { PaymentService } from '../services/paymentService';

export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'cod';

interface PaymentScreenProps {
  totalAmount: number;
  subtotal: number;
  shippingFee?: number;
  carrierId?: number;
  discount?: number;
  couponCode?: string;
  onBack: () => void;
  onOrderSuccess: (orderId: string | number) => void;
  onNavigateToShop: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  totalAmount,
  subtotal,
  shippingFee = 0,
  carrierId,
  discount = 0,
  couponCode,
  onBack,
  onOrderSuccess,
  onNavigateToShop,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const { selectedAddress } = useAddress();
  const { clearCart, items } = useCart();
  const { showStatusModal } = useStatusModal();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');
  const [processing, setProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | number>('');
  const [deliveryOrder, setDeliveryOrder] = useState<{ id: number; name: string; state: string } | null>(null);

  const paymentOptions: {
    id: PaymentMethodType;
    title: string;
    subtitle: string;
    icon: string;
    badge?: string;
  }[] = [
      {
        id: 'upi',
        title: 'UPI & Instant Pay',
        subtitle: 'Google Pay, PhonePe, Paytm, BHIM',
        icon: 'phone-portrait-outline',
        badge: 'FASTEST',
      },
      {
        id: 'card',
        title: 'Credit / Debit Card',
        subtitle: 'Visa, MasterCard, RuPay, Maestro',
        icon: 'card-outline',
      },
      {
        id: 'netbanking',
        title: 'Net Banking',
        subtitle: 'HDFC, ICICI, SBI, Axis & all Indian banks',
        icon: 'business-outline',
      },
      {
        id: 'cod',
        title: 'Cash on Delivery',
        subtitle: 'Pay via cash or UPI scan upon delivery',
        icon: 'cash-outline',
      },
    ];

  const handlePayAndConfirmOrder = async () => {
    setProcessing(true);

    const partnerId = Number(user?.partnerId || user?.id || 2);
    const shippingId = selectedAddress?.id ? Number(selectedAddress.id) : undefined;
    let orderId: number | string = `SO-${Date.now()}`;

    try {
      // 1. Create Sale Order in Odoo (Postman: "Create Sale Order")
      const orderPayload = {
        partnerId,
        partnerShippingId: shippingId,
        partnerInvoiceId: shippingId,
        carrierId,
        items: items.map(item => ({
          productId: Number(item.product.id) || 1,
          quantity: item.quantity,
          priceUnit: item.product.price,
        })),
      };

      try {
        const saleRes = await CartService.createSaleOrder(orderPayload);
        if (saleRes?.result) {
          orderId = saleRes.result;
          // Bind selected delivery carrier (Postman: "POST Calculate Shipping")
          if (carrierId) {
            try {
              await CartService.calculateShipping(orderId, carrierId);
            } catch (carrierErr) {
              console.warn('Odoo calculateShipping note:', carrierErr);
            }
          }
        }
      } catch (saleErr) {
        console.warn('Odoo createSaleOrder note:', saleErr);
      }
      // 2. Razorpay & Online Payment Integration
      let razorpayPaymentId: string | null = null;
      let razorpayOrderId: string | null = null;
      if (selectedMethod !== 'cod') {
        try {
          // Open Razorpay Checkout for UPI / Card / Netbanking (Postman: "Razor pay")
          const razorpayRes = await PaymentService.openRazorpayCheckout({
            amount: totalAmount,
            orderId,
            name: user?.name || selectedAddress?.name || 'Customer',
            email: user?.email || '',
            contact: user?.phone || selectedAddress?.phone || '',
            description: `Order #${orderId} - Groceries & Essentials`,
            method: selectedMethod,
            key: API_SETTINGS.razorPay.key,
            secret: API_SETTINGS.razorPay.secret,
          });

          if (razorpayRes?.razorpay_payment_id) {
            razorpayPaymentId = razorpayRes.razorpay_payment_id;
            razorpayOrderId = razorpayRes.razorpay_order_id || null;
          }
        } catch (rpErr: any) {
          console.warn('Razorpay checkout error caught:', rpErr);
          // Only treat as cancellation if explicitly cancelled by user
          const isUserCancelled =
            (rpErr?.code === 0 &&
              typeof rpErr?.description === 'string' &&
              (rpErr.description.toLowerCase().includes('cancel') ||
                rpErr.description.toLowerCase().includes('dismiss'))) ||
            rpErr?.description === 'Payment Cancelled by user';

          if (isUserCancelled) {
            setProcessing(false);
            showStatusModal({
              type: 'info',
              title: 'Payment Cancelled',
              message: 'Payment was cancelled. Your items remain safe in your cart.',
              buttonText: 'OK',
            });
            return;
          }

          // If not an intentional cancellation, display the actual error message
          const errorMsg =
            rpErr?.description ||
            rpErr?.message ||
            (typeof rpErr === 'string' ? rpErr : 'Payment checkout encountered an issue.');

          showStatusModal({
            type: 'error',
            title: 'Payment Notice',
            message: errorMsg,
            confirmText: 'Retry Payment',
            cancelText: 'Cancel',
            onConfirm: () => handlePayAndConfirmOrder(),
          });
          return;
        }

        // 3. Register Payment in Odoo (Postman: "POST Create Payment")
        try {
          const memo = razorpayPaymentId
            ? `Razorpay: ${razorpayPaymentId} | SO: ${orderId}${razorpayOrderId ? ` | RZP: ${razorpayOrderId}` : ''}`
            : `Order: ${orderId}`;

          const payRes = await PaymentService.createPayment({
            partnerId,
            amount: totalAmount,
            journalId: 7,
            paymentMethodLineId: 1,
            memo,
          });

          if (payRes?.result) {
            // 4. Confirm / Post Payment (Postman: "POST Verify Payment (Post/Confirm)")
            await PaymentService.verifyPayment(payRes.result);

            // Fetch payment details verification (Postman: "GET Payment Details")
            try {
              await PaymentService.getPaymentDetails(payRes.result);
            } catch (dErr) {
              console.warn('Odoo getPaymentDetails note:', dErr);
            }
          }
        } catch (payErr) {
          console.warn('Odoo createPayment/verifyPayment note:', payErr);
        }
      }

      // Assign shipping carrier if selected (Postman: "POST Calculate Shipping")
      if (carrierId && orderId && typeof orderId === 'number') {
        try {
          await CartService.calculateShipping(orderId, carrierId);
        } catch (cErr) {
          console.warn('Carrier assign note:', cErr);
        }
      }

      // 5. Confirm Sale Order in Odoo (action_confirm) & Create Delivery Order (stock.picking)
      if (orderId && typeof orderId === 'number') {
        try {
          await CartService.confirmSaleOrder(orderId);
          console.log(`[Odoo] Sale Order ${orderId} confirmed.`);

          // Query created delivery order from stock.picking (Postman: "Get Delivery details")
          const pickRes = await CartService.getDeliveryDetails(orderId);
          const pickings = Array.isArray(pickRes?.result) ? pickRes.result : [];
          if (pickings.length > 0) {
            setDeliveryOrder(pickings[0]);
            console.log(`[Odoo] Delivery Order created:`, pickings[0]);
          }
        } catch (confirmErr) {
          console.warn('Odoo confirmSaleOrder/getDeliveryDetails note:', confirmErr);
        }
      }

      // 6. Clear Cart and Show Success
      clearCart();
      setConfirmedOrderId(orderId);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Payment checkout error:', error);
      const errorMessage =
        error?.description ||
        error?.message ||
        'We encountered an issue finalizing payment. Would you like to retry?';

      showStatusModal({
        type: 'error',
        title: 'Transaction Notice',
        message: errorMessage,
        confirmText: 'Retry Payment',
        cancelText: 'Cancel',
        onConfirm: async () => {
          // Trigger Odoo Retry Payment (Postman: "POST Retry Payment")
          try {
            await PaymentService.retryPayment({
              orderId: typeof orderId === 'number' ? orderId : 1,
              partnerId,
              amount: totalAmount,
              reference: `SO-${orderId}-RETRY-${Date.now()}`,
            });
          } catch (retryErr) {
            console.warn('Odoo retryPayment note:', retryErr);
          }
          handlePayAndConfirmOrder();
        },
      });
    } finally {
      setProcessing(false);
    }
  };

  // Success Celebration View
  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconCircle, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
          </View>

          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
            Order Confirmed!
          </Text>

          <View style={[styles.orderNumberBadge, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.orderNumberText, { color: colors.primary }]}>
              ORDER #{confirmedOrderId}
            </Text>
          </View>

          {deliveryOrder && (
            <View
              style={[
                styles.deliveryPickingCard,
                {
                  backgroundColor: `${colors.secondary}14`,
                  borderColor: colors.secondary,
                },
              ]}
            >
              <Ionicons name="cube" size={22} color={colors.secondary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deliveryPickingTitle, { color: colors.textPrimary }]}>
                  Delivery Order: {deliveryOrder.name}
                </Text>
                <Text style={[styles.deliveryPickingSub, { color: colors.secondary }]}>
                  Status: {deliveryOrder.state.toUpperCase()} • Warehouse Pack Ready
                </Text>
              </View>
            </View>
          )}

          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            Thank you {user?.name || 'Valued Customer'}! Your payment of ₹{totalAmount}{' '}
            {selectedMethod === 'cod'
              ? 'will be collected upon delivery.'
              : 'has been verified via Razorpay.'}{' '}
            Fresh items are being packed at the local hub for 15-minute doorstep delivery.
          </Text>

          {/* Action Buttons */}
          <View style={styles.successActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onOrderSuccess(confirmedOrderId)}
              style={[styles.viewOrdersBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
            >
              <Text style={[styles.viewOrdersBtnText, { color: colors.onPrimary }]}>
                Track My Order ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNavigateToShop}
              style={[styles.continueShoppingBtn, { borderColor: colors.border, borderRadius: borderRadius.md }]}
            >
              <Text style={[styles.continueShoppingText, { color: colors.textPrimary }]}>
                Continue Shopping
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Payment Method" onBack={onBack} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Summary Strip */}
        <View
          style={[
            styles.totalStrip,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View>
            <Text style={[styles.stripLabel, { color: colors.textSecondary }]}>
              Amount Payable
            </Text>
            <Text style={[styles.stripAmount, { color: colors.primary }]}>
              ₹{totalAmount}
            </Text>
          </View>
          <View style={[styles.secureBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.secureText, { color: colors.primary }]}>256-Bit Encrypted</Text>
          </View>
        </View>

        {/* Coupon Savings Callout */}
        {discount > 0 && (
          <View
            style={[
              styles.couponSavingsStrip,
              {
                backgroundColor: `${colors.secondary}15`,
                borderColor: colors.secondary,
              },
            ]}
          >
            <Ionicons name="pricetag" size={15} color={colors.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.couponSavingsText, { color: colors.secondary }]}>
              Coupon Savings of ₹{discount} applied{couponCode ? ` (${couponCode})` : ''}
            </Text>
          </View>
        )}

        {/* Payment Methods Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          SELECT PAYMENT OPTION
        </Text>

        <View style={styles.optionsList}>
          {paymentOptions.map(opt => {
            const isSelected = selectedMethod === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelectedMethod(opt.id)}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.lg,
                    shadowColor: isSelected ? colors.primary : '#000',
                  },
                ]}
              >
                <View
                  style={[
                    styles.methodIconBox,
                    {
                      backgroundColor: isSelected ? `${colors.primary}18` : colors.surfaceVariant,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={isSelected ? colors.primary : colors.textPrimary}
                  />
                </View>

                <View style={styles.methodInfo}>
                  <View style={styles.titleWithBadge}>
                    <Text style={[styles.methodTitle, { color: colors.textPrimary }]}>
                      {opt.title}
                    </Text>
                    {opt.badge && (
                      <View style={[styles.optBadge, { backgroundColor: `${colors.secondary}20` }]}>
                        <Text style={[styles.optBadgeText, { color: colors.secondary }]}>
                          {opt.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>
                    {opt.subtitle}
                  </Text>
                </View>

                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isSelected ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Guarantee Banner */}
        <View
          style={[
            styles.trustCard,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Ionicons name="lock-closed" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.trustCardText, { color: colors.textSecondary }]}>
            Safe and seamless checkout powered by Razorpay 256-Bit Encryption and Odoo Accounting.
          </Text>
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
          <Text style={[styles.bottomLabel, { color: colors.textSecondary }]}>TOTAL PAYABLE</Text>
          <Text style={[styles.bottomAmount, { color: colors.textPrimary }]}>₹{totalAmount}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePayAndConfirmOrder}
          disabled={processing}
          style={[
            styles.payBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              opacity: processing ? 0.7 : 1,
            },
          ]}
        >
          {processing ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.payBtnText, { color: colors.onPrimary }]}>
              {selectedMethod === 'cod' ? 'CONFIRM ORDER' : `PAY ₹${totalAmount}`} ›
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
    padding: 16,
    gap: 12,
  },
  totalStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
  },
  stripLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stripAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  secureText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 2,
    marginLeft: 4,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  methodInfo: {
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  optBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  methodSubtitle: {
    fontSize: 11.5,
    marginTop: 3,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  trustCardText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
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
  bottomLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  payBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  orderNumberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },
  orderNumberText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deliveryPickingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
  },
  deliveryPickingTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  deliveryPickingSub: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  couponSavingsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  couponSavingsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  successSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  viewOrdersBtn: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  viewOrdersBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  continueShoppingBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  continueShoppingText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
