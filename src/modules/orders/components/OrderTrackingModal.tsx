import React from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { Order } from '../types';

interface OrderTrackingModalProps {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  visible,
  onClose,
}) => {
  const { colors, borderRadius } = useTheme();

  if (!order) return null;

  const partner = order.deliveryPartner || {
    name: 'Ravi Kumar',
    phone: '+91 98450 12345',
    vehicle: 'Electric Scooter (KA-01-EQ-4421)',
    rating: 4.9,
  };

  const handleCallPartner = () => {
    Alert.alert('Call Delivery Partner', `Calling ${partner.name} at ${partner.phone}...`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now' },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
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
                Live Order Tracking
              </Text>
              <Text style={[styles.orderNumberSub, { color: colors.primary }]}>
                {order.orderNumber} • Arriving in ~{order.eta || '12 mins'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
          >
            {/* Delivery Hero Card */}
            <View
              style={[
                styles.partnerCard,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <View style={[styles.partnerAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={22} color={colors.onPrimary} />
              </View>

              <View style={styles.partnerInfo}>
                <View style={styles.partnerNameRow}>
                  <Text style={[styles.partnerName, { color: colors.textPrimary }]}>
                    {partner.name}
                  </Text>
                  <View style={[styles.ratingPill, { backgroundColor: colors.surface }]}>
                    <Ionicons name="star" size={10} color={colors.warning} style={{ marginRight: 2 }} />
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
                activeOpacity={0.85}
                onPress={handleCallPartner}
                style={[styles.callBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="call" size={16} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            {/* 4-Step Delivery Progress Stepper */}
            <View
              style={[
                styles.stepperBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                Delivery Timeline
              </Text>

              {/* Step 1: Order Placed */}
              <View style={styles.stepRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={[styles.stepCircleActive, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                  </View>
                  <View style={[styles.stepLineActive, { backgroundColor: colors.primary }]} />
                </View>
                <View style={styles.stepTextColumn}>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    Order Confirmed & Payment Verified
                  </Text>
                  <Text style={[styles.stepTime, { color: colors.textSecondary }]}>
                    09:15 AM • Automated Instant Dispatch
                  </Text>
                </View>
              </View>

              {/* Step 2: Packed */}
              <View style={styles.stepRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={[styles.stepCircleActive, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                  </View>
                  <View style={[styles.stepLineActive, { backgroundColor: colors.primary }]} />
                </View>
                <View style={styles.stepTextColumn}>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    Packed & Quality Inspected
                  </Text>
                  <Text style={[styles.stepTime, { color: colors.textSecondary }]}>
                    09:18 AM • Sealed in temperature-safe basket
                  </Text>
                </View>
              </View>

              {/* Step 3: Out for Delivery */}
              <View style={styles.stepRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={[styles.stepCircleCurrent, { borderColor: colors.primary, backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name="bicycle" size={14} color={colors.primary} />
                  </View>
                  <View style={[styles.stepLinePending, { backgroundColor: colors.border }]} />
                </View>
                <View style={styles.stepTextColumn}>
                  <Text style={[styles.stepTitleCurrent, { color: colors.primary }]}>
                    Out for Delivery (Live)
                  </Text>
                  <Text style={[styles.stepTime, { color: colors.textSecondary }]}>
                    Ravi Kumar is 1.2 km away from your location
                  </Text>
                </View>
              </View>

              {/* Step 4: Doorstep Delivery */}
              <View style={styles.stepRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={[styles.stepCirclePending, { backgroundColor: colors.border }]}>
                    <Ionicons name="home" size={12} color={colors.textSecondary} />
                  </View>
                </View>
                <View style={styles.stepTextColumn}>
                  <Text style={[styles.stepTitlePending, { color: colors.textSecondary }]}>
                    Delivered to Doorstep
                  </Text>
                  <Text style={[styles.stepTime, { color: colors.textTertiary }]}>
                    Estimated by 09:35 AM
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Address Summary */}
            <View
              style={[
                styles.addressSummaryBox,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Ionicons name="location-sharp" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deliveringToLabel, { color: colors.textSecondary }]}>
                  Delivering to:
                </Text>
                <Text style={[styles.deliveryAddressText, { color: colors.textPrimary }]}>
                  {order.deliveryAddress}
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '85%',
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
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  orderNumberSub: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    maxHeight: 480,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  partnerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '800',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
  },
  partnerVehicle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBox: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepCircleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLineActive: {
    width: 2,
    height: 34,
    marginVertical: 2,
  },
  stepCircleCurrent: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLinePending: {
    width: 2,
    height: 34,
    marginVertical: 2,
  },
  stepCirclePending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextColumn: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepTime: {
    fontSize: 11.5,
    marginTop: 2,
  },
  stepTitleCurrent: {
    fontSize: 13,
    fontWeight: '900',
  },
  stepTitlePending: {
    fontSize: 13,
    fontWeight: '600',
  },
  addressSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  deliveringToLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  deliveryAddressText: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
});
