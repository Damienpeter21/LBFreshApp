import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppHeader, EmptyState, Skeleton } from '../../../components';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { OrderCard } from '../components/OrderCard';
import { useOrders } from '../hooks/useOrders';
import { Order, OrderStatus } from '../types';

interface OrdersScreenProps {
  onBack: () => void;
  onNavigateToShop: () => void;
  onNavigateToOrderDetails: (order: Order) => void;
  onNavigateToLogin?: () => void;
}

type OrderFilter = 'all' | 'in_transit' | 'delivered' | 'cancelled';

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onBack,
  onNavigateToShop,
  onNavigateToOrderDetails,
  onNavigateToLogin,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    orders,
    filteredOrders,
    selectedFilter,
    setSelectedFilter,
    loading,
    refreshing,
    refreshOrders,
  } = useOrders();

  // Automatically refresh orders when screen gains focus (e.g., returning from cancelling an order or after placing an order)
  const isFirstMountRef = React.useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      refreshOrders();
    }, [refreshOrders])
  );

  const tabs: { id: OrderFilter; label: string; count: number; icon: string }[] = useMemo(() => [
    { id: 'all', label: 'All Orders', count: orders.length, icon: 'receipt-outline' },
    {
      id: 'in_transit',
      label: 'Active',
      count: orders.filter(o => o.status === 'in_transit' || o.status === 'preparing' || o.status === 'confirmed').length,
      icon: 'bicycle-outline',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      count: orders.filter(o => o.status === 'delivered').length,
      icon: 'checkmark-circle-outline',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: orders.filter(o => o.status === 'cancelled').length,
      icon: 'close-circle-outline',
    },
  ], [orders]);

  // Real-time search filter across order ID, product name, or address
  const displayedOrders = useMemo(() => {
    if (!searchQuery.trim()) return filteredOrders;
    const q = searchQuery.toLowerCase().trim();
    return filteredOrders.filter(
      order =>
        order.orderNumber.toLowerCase().includes(q) ||
        order.items.some(it => it.product.name.toLowerCase().includes(q)) ||
        order.deliveryAddress.toLowerCase().includes(q)
    );
  }, [filteredOrders, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="My Orders" onBack={onBack} />

      {/* Quick Search Bar */}
      {orders.length > 0 && (
        <View style={[styles.searchSection, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textSecondary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by order ID, item name..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Horizontal Order Filter Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item.id as OrderStatus | 'all')}
                activeOpacity={0.75}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isSelected ? colors.onPrimary : colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isSelected ? colors.onPrimary : colors.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isSelected ? colors.onPrimary : colors.textSecondary },
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List / Skeleton Loading / Empty State */}
      {loading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: borderRadius.xl,
                },
              ]}
            >
              <View style={styles.skeletonHeader}>
                <Skeleton width={110} height={20} borderRadius={6} />
                <Skeleton width={85} height={22} borderRadius={12} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14 }}>
                <Skeleton width={48} height={48} borderRadius={10} />
                <Skeleton width={48} height={48} borderRadius={10} />
                <Skeleton width={48} height={48} borderRadius={10} />
              </View>
              <Skeleton width="80%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="50%" height={14} borderRadius={4} style={{ marginBottom: 14 }} />
              <View style={styles.skeletonFooter}>
                <Skeleton width={90} height={22} borderRadius={6} />
                <Skeleton width={120} height={36} borderRadius={10} />
              </View>
            </View>
          ))}
        </View>
      ) : displayedOrders.length === 0 ? (
        !isAuthenticated ? (
          <EmptyState
            iconName="person-outline"
            badgeIcon="sparkles"
            title="Sign In to View Orders"
            description="Please sign in to view your live orders, delivery tracking, and purchase history."
            actionLabel={onNavigateToLogin ? 'Sign In / Register' : 'Start Shopping'}
            onAction={onNavigateToLogin ? onNavigateToLogin : onNavigateToShop}
            secondaryActionLabel={onNavigateToLogin ? 'Start Shopping' : undefined}
            onSecondaryAction={onNavigateToLogin ? onNavigateToShop : undefined}
          />
        ) : (
          <EmptyState
            iconName="receipt-outline"
            badgeIcon="sparkles"
            title={searchQuery.trim() ? 'No Matching Orders' : 'No Orders Found'}
            description={
              searchQuery.trim()
                ? `No orders matching "${searchQuery}". Check your search term or clear the filter.`
                : selectedFilter === 'all'
                ? "You haven't placed any orders yet. Discover our fresh catalog and enjoy instant doorstep delivery!"
                : `No orders found in the "${selectedFilter}" category.`
            }
            actionLabel={searchQuery.trim() ? 'Clear Search' : 'Start Shopping'}
            onAction={searchQuery.trim() ? () => setSearchQuery('') : onNavigateToShop}
          />
        )
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 40, 50) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshOrders}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onTrackOrder={order => onNavigateToOrderDetails(order)}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  tabsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 12.5,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  skeletonCard: {
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
});
