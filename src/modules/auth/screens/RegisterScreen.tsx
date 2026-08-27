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
import { GOOGLE_SETTINGS } from '../../../app/config';
import { useTheme } from '../../../theme';
import { AuthButton } from '../components/AuthButton';
import { AuthInput } from '../components/AuthInput';
import { AuthLogo } from '../components/AuthLogo';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { register, isLoading, error } = useAuth();

  const handleRegister = async () => {
    setValidationError(null);
    if (!name || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const success = await register({ name, email, password });
    if (success && onRegisterSuccess) {
      onRegisterSuccess();
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
        {/* Top Nav Row */}
        <View style={styles.topNavRow}>
          {onNavigateToLogin ? (
            <TouchableOpacity
              onPress={onNavigateToLogin}
              activeOpacity={0.7}
              style={[styles.backBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}

          <View style={[styles.badgePill, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.badgePillText, { color: colors.primary }]}>CREATE ACCOUNT</Text>
          </View>
        </View>

        {/* Brand Logo Header */}
        <AuthLogo size="medium" tagline="Create your account for faster checkout & tracking" />

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
            label="Full Name"
            iconName="person-outline"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AuthInput
            label="Confirm Password"
            iconName="shield-checkmark-outline"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={validationError || error || undefined}
          />

          <AuthButton
            title="Create LBFresh Account"
            loading={isLoading}
            disabled={!name || !email || !password || !confirmPassword}
            onPress={handleRegister}
          />

          {Boolean(GOOGLE_SETTINGS.androidClientId) && (
            <>
              <View style={styles.socialDividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                <Text style={[styles.dividerText, { color: colors.textTertiary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              </View>

              <GoogleSignInButton
                title="Sign up with Google"
                loading={isLoading}
                onPress={() => {
                  register({
                    name: 'Google User',
                    email: 'google.user@gmail.com',
                    password: 'google_auth_pass',
                  })
                    .then(() => onRegisterSuccess && onRegisterSuccess())
                    .catch(() => {});
                }}
              />
            </>
          )}
        </View>

        {onNavigateToLogin && (
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  socialDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  googleSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
