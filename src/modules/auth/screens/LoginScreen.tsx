import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';
import { AuthButton } from '../components/AuthButton';
import { AuthInput } from '../components/AuthInput';
import { AuthLogo } from '../components/AuthLogo';
import { useAuth } from '../hooks/useAuth';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  onLoginSuccess?: () => void;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onLoginSuccess,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return;
    const success = await login({ email, password });
    if (success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: Math.max(insets.bottom + 20, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Navigation Row */}
        <View style={styles.topNavRow}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}

          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.skipPill}>
              <Text style={[styles.skipText, { color: colors.primary }]}>Skip for now ›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Brand Logo Header */}
        <AuthLogo size="large" tagline="Sign in for exclusive deals, orders & fast checkout" />

        {/* Trust Badges */}
        <View style={[styles.trustRow, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.trustText, { color: colors.textPrimary }]}>100% Genuine</Text>
          </View>
          <View style={[styles.trustDivider, { backgroundColor: colors.border }]} />
          <View style={styles.trustItem}>
            <Ionicons name="flash-outline" size={14} color={colors.secondary} style={{ marginRight: 4 }} />
            <Text style={[styles.trustText, { color: colors.textPrimary }]}>Express Delivery</Text>
          </View>
          <View style={[styles.trustDivider, { backgroundColor: colors.border }]} />
          <View style={styles.trustItem}>
            <Ionicons name="refresh-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.trustText, { color: colors.textPrimary }]}>Easy Returns</Text>
          </View>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <AuthInput
            label="Email Address"
            iconName="mail-outline"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AuthInput
            label="Password"
            iconName="lock-closed-outline"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={error || undefined}
          />

          {onNavigateToForgotPassword && (
            <TouchableOpacity
              onPress={onNavigateToForgotPassword}
              style={styles.forgotPassBtn}
            >
              <Text style={[styles.forgotPassText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          <AuthButton
            title="Sign In to LBFresh"
            loading={isLoading}
            disabled={!email || !password}
            onPress={handleLogin}
          />
        </View>

        {/* Switch to Register */}
        {onNavigateToRegister && (
          <View style={styles.registerPrompt}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Disclaimer Terms */}
        <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
          By continuing, you agree to LBFresh Terms of Service & Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  skipPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerSection: {
    marginBottom: 16,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  organicPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  organicText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainHeadline: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 6,
  },
  subHeadline: {
    fontSize: 14,
    lineHeight: 20,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trustDivider: {
    width: 1,
    height: 14,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: '700',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
