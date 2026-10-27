import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';

interface OtpVerificationModalProps {
  visible: boolean;
  email: string;
  phone: string;
  isLoading?: boolean;
  onClose: () => void;
  onVerify: (otpData: { emailOtp: string; whatsappOtp: string }) => Promise<void>;
  onResendOtp: () => Promise<void>;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  visible,
  email,
  phone,
  isLoading = false,
  onClose,
  onVerify,
  onResendOtp,
}) => {
  const { colors, borderRadius } = useTheme();

  const [emailOtp, setEmailOtp] = useState('');
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (visible && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, resendCountdown]);

  // Reset inputs when modal opens
  useEffect(() => {
    if (visible) {
      setEmailOtp('');
      setWhatsappOtp('');
      setErrorMessage(null);
      setResendCountdown(60);
    }
  }, [visible]);

  const handleVerifyPress = async () => {
    setErrorMessage(null);
    const cleanEmailOtp = emailOtp.trim();
    const cleanWhatsappOtp = whatsappOtp.trim();

    if (!cleanEmailOtp) {
      setErrorMessage('Please enter the 6-digit OTP sent to your Email.');
      return;
    }
    if (!cleanWhatsappOtp) {
      setErrorMessage('Please enter the 6-digit OTP sent to your WhatsApp.');
      return;
    }

    try {
      await onVerify({
        emailOtp: cleanEmailOtp,
        whatsappOtp: cleanWhatsappOtp,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please check the OTP codes.');
    }
  };

  const handleResendPress = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await onResendOtp();
      setResendCountdown(60);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isVerifyDisabled =
    isLoading || !emailOtp.trim() || !whatsappOtp.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          {/* Top Bar with Close button */}
          <View style={styles.topBar}>
            <View style={styles.headerIconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerTexts}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Verify Your Account
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Enter the verification codes to activate your account
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Info Badge Cards */}
            <View style={styles.destinationRow}>
              <View
                style={[
                  styles.destinationBadge,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons name="mail" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text
                  style={[styles.destinationText, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </View>

              <View
                style={[
                  styles.destinationBadge,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={14}
                  color="#25D366"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.destinationText, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {phone}
                </Text>
              </View>
            </View>

            {/* Email OTP Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="mail-outline" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  Email OTP Code
                </Text>
              </View>
              <View
                style={[
                  styles.otpInputBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <TextInput
                  style={[styles.otpTextInput, { color: colors.textPrimary }]}
                  placeholder="Enter 6-digit Email OTP"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={emailOtp}
                  onChangeText={text => {
                    setEmailOtp(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>
            </View>

            {/* WhatsApp OTP Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons
                  name="logo-whatsapp"
                  size={15}
                  color="#25D366"
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  WhatsApp OTP Code
                </Text>
              </View>
              <View
                style={[
                  styles.otpInputBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <TextInput
                  style={[styles.otpTextInput, { color: colors.textPrimary }]}
                  placeholder="Enter 6-digit WhatsApp OTP"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={whatsappOtp}
                  onChangeText={text => {
                    setWhatsappOtp(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '12' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} style={{ marginRight: 6 }} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Resend OTP Row */}
            <View style={styles.resendRow}>
              <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>
                Didn't receive code?
              </Text>
              <TouchableOpacity
                onPress={handleResendPress}
                disabled={resendCountdown > 0 || isResending}
                activeOpacity={0.7}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
                ) : (
                  <Text
                    style={[
                      styles.resendAction,
                      {
                        color: resendCountdown > 0 ? colors.textTertiary : colors.primary,
                        fontWeight: resendCountdown > 0 ? '600' : '800',
                      },
                    ]}
                  >
                    {resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : 'Resend OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Validate Button */}
            <TouchableOpacity
              style={[
                styles.validateButton,
                {
                  backgroundColor: isVerifyDisabled ? colors.surfaceVariant : colors.primary,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={handleVerifyPress}
              disabled={isVerifyDisabled}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={isVerifyDisabled ? colors.textTertiary : '#FFFFFF'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.validateButtonText,
                      {
                        color: isVerifyDisabled ? colors.textTertiary : '#FFFFFF',
                      },
                    ]}
                  >
                    Validate OTP
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  destinationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
  },
  destinationText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  otpInputBox: {
    height: 50,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  otpTextInput: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  resendLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  resendAction: {
    fontSize: 13,
    marginLeft: 6,
  },
  validateButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
