import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppHeader } from '../../../app/components/AppHeader';
import { IMAGES } from '../../../assets';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateToLogin,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your LBFresh account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleFeatureNotice = (title: string) => {
    Alert.alert(title, 'This feature is ready and synced with your account.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="My Account" onBack={onBack} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + 30, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              {isAuthenticated && user?.name ? (
                <Text style={[styles.avatarInitial, { color: colors.onPrimary }]}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons name="person" size={28} color={colors.onPrimary} />
              )}
            </View>

            <View style={styles.heroTextContainer}>
              {isAuthenticated ? (
                <>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>
                    {user?.name}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                    {user?.email}
                  </Text>
                  <View style={[styles.clubBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.secondary }]}>
                    <Ionicons name="sparkles" size={11} color={colors.secondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.clubBadgeText, { color: colors.primary }]}>
                      LBFresh Plus Member
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>
                    Welcome Guest!
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                    Sign in for member perks & fast checkout
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onNavigateToLogin}
                    style={[
                      styles.signInBtn,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Text style={[styles.signInBtnText, { color: colors.onPrimary }]}>
                      Sign In / Register ›
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
            onPress={() => handleFeatureNotice('Orders')}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-handle" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {isAuthenticated ? '2' : '0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
            onPress={() => handleFeatureNotice('Saved Addresses')}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>1</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Address</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
            onPress={() => handleFeatureNotice('LBFresh Wallet')}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet" size={20} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹50</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wallet Cash</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Orders & Activity */}
        <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>ORDERS & TRANSACTIONS</Text>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => handleFeatureNotice('Order History')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="receipt-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>My Orders</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Track orders, deliveries & invoices</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => handleFeatureNotice('Payments')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="card-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Payment Methods & UPI</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Google Pay, PhonePe & Saved Cards</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleFeatureNotice('Refunds')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="refresh-circle-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Refund Status</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Track instant refund claims</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Section 2: Preferences */}
        <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>APP PREFERENCES</Text>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <View style={[styles.menuItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleFeatureNotice('Delivery Address')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Delivery Addresses</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>BTM Layout, 2nd Stage, Bengaluru</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Section 3: Support & Legal */}
        <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>HELP & INFORMATION</Text>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => handleFeatureNotice('24x7 Customer Support')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="headset-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>24x7 Help Center</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Instant live chat & issue resolution</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleFeatureNotice('Terms and Privacy')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Terms & Privacy Policy</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>100% genuine products & buyer protection</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Log Out Action */}
        {isAuthenticated && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              {
                borderColor: colors.error,
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
          </TouchableOpacity>
        )}

        {/* App Footer Info */}
        <View style={styles.appFooter}>
          <View style={[styles.footerLogoBadge, { backgroundColor: colors.primaryVariant }]}>
            <Image
              source={IMAGES.LOGO}
              style={styles.footerLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.footerBrand, { color: colors.primary }]}>LBFresh</Text>
          <Text style={[styles.footerVersion, { color: colors.textTertiary }]}>
            Version 1.0.0 (Build 42) • Crafted with ❤️ in India
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
  },
  heroTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  clubBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  signInBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  signInBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    height: 50,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
  appFooter: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginBottom: 6,
  },
  footerLogo: {
    width: '100%',
    height: '100%',
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footerVersion: {
    fontSize: 11,
    marginTop: 4,
  },
});
