import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../theme';

interface AuthInputProps extends TextInputProps {
  label: string;
  iconName?: string;
  error?: string;
  /** Set to true to highlight border red without displaying an error message below */
  hasError?: boolean;
  /** Optional prefix text such as +91 for phone inputs */
  prefix?: string;
  /** Optional custom right-hand component (e.g. verified badge, verify button) */
  rightComponent?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  iconName,
  error,
  hasError,
  prefix,
  rightComponent,
  secureTextEntry,
  style,
  ...props
}) => {
  const { colors, borderRadius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error || hasError
              ? colors.error
              : isFocused
              ? colors.primary
              : colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={19}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leadingIcon}
          />
        )}

        {prefix && (
          <View style={styles.prefixContainer}>
            <Text style={[styles.prefixText, { color: colors.textPrimary }]}>{prefix}</Text>
            <View style={[styles.prefixDivider, { backgroundColor: colors.divider }]} />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
            },
            style,
          ]}
          placeholderTextColor={colors.inputPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {rightComponent}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.error} style={{ marginRight: 4 }} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    height: 52,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  leadingIcon: {
    marginRight: 10,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  prefixDivider: {
    width: 1,
    height: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
