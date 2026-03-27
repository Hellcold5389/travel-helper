// UI Components
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

// ============================================
// Button
// ============================================

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
    disabled && styles.buttonText_disabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// Card
// ============================================

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ============================================
// Badge
// ============================================

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  style?: ViewStyle;
}

export function Badge({ text, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], style]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>{text}</Text>
    </View>
  );
}

// ============================================
// Loading
// ============================================

interface LoadingProps {
  message?: string;
}

export function Loading({ message = '載入中...' }: LoadingProps) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
}

// ============================================
// Empty
// ============================================

interface EmptyProps {
  icon?: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function Empty({ icon = '📭', message, action }: EmptyProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action && (
        <Button title={action.label} onPress={action.onPress} variant="outline" size="sm" />
      )}
    </View>
  );
}

// ============================================
// Divider
// ============================================

interface DividerProps {
  text?: string;
  style?: ViewStyle;
}

export function Divider({ text, style }: DividerProps) {
  if (text) {
    return (
      <View style={[styles.dividerWithText, style]}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{text}</Text>
        <View style={styles.dividerLine} />
      </View>
    );
  }
  return <View style={[styles.divider, style]} />;
}

// ============================================
// Section Header
// ============================================

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  button_md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  button_lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  button_disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonText_primary: {
    color: colors.white,
  },
  buttonText_secondary: {
    color: colors.white,
  },
  buttonText_outline: {
    color: colors.primary,
  },
  buttonText_ghost: {
    color: colors.primary,
  },
  buttonText_sm: {
    fontSize: 14,
  },
  buttonText_md: {
    fontSize: 16,
  },
  buttonText_lg: {
    fontSize: 18,
  },
  buttonText_disabled: {
    color: colors.gray400,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badge_default: {
    backgroundColor: colors.gray100,
  },
  badge_success: {
    backgroundColor: '#D1FAE5',
  },
  badge_warning: {
    backgroundColor: '#FEF3C7',
  },
  badge_error: {
    backgroundColor: '#FEE2E2',
  },
  badge_info: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeText_default: {
    color: colors.gray600,
  },
  badgeText_success: {
    color: colors.success,
  },
  badgeText_warning: {
    color: colors.warning,
  },
  badgeText_error: {
    color: colors.error,
  },
  badgeText_info: {
    color: colors.info,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 16,
  },
  dividerWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textMuted,
    fontSize: 12,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionAction: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});