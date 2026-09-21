// src/modules/orders/screens/OrdersScreen.tsx
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, EmptyState } from '../../../components';
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
  const { colors, borderRadius } = useTheme();
  const { isAuthenticated } = useAuth();

  const {
    orders,
    filteredOrders,
    selectedFilter,
    setSelectedFilter,
    loading,
    refreshing,
    refreshOrders,
  } = useOrders();

  const tabs: { id: OrderFilter; label: string; count: number }[] = useMemo(() => [
    { id: 'all', label: 'All Orders', count: orders.length },
    {
      id: 'in_transit',
      label: 'Active',
      count: orders.filter(o => o.status === 'in_transit' || o.status === 'preparing').length,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      count: orders.filter(o => o.status === 'delivered').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: orders.filter(o => o.status === 'cancelled').length,
    },
  ], [orders]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="My Orders" onBack={onBack} />

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
                        ? colors.surface
                        : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isSelected ? colors.primary : colors.textSecondary },
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

      {/* Orders List / Loading / Empty State */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your orders from Odoo...
          </Text>
        </View>
      ) : filteredOrders.length === 0 ? (
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
            title="No Orders Found"
            description={
              selectedFilter === 'all'
                ? "You haven't placed any orders yet. Discover our fresh catalog and enjoy instant doorstep delivery!"
                : `No orders found in the "${selectedFilter}" category.`
            }
            actionLabel="Start Shopping"
            onAction={onNavigateToShop}
          />
        )
      ) : (
        <FlatList
          data={filteredOrders}
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    gap: 6,
  },
  tabLabel: {
    fontSize: 12.5,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
});
