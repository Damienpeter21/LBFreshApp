import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, EmptyState } from '../../../app';
import { useTheme } from '../../../theme';
import { OrderCard } from '../components/OrderCard';
import { mockOrders } from '../data/mockOrders';
import { Order } from '../types';

interface OrdersScreenProps {
  onBack: () => void;
  onNavigateToShop: () => void;
  onNavigateToOrderDetails: (order: Order) => void;
}

type OrderFilter = 'all' | 'in_transit' | 'delivered' | 'cancelled';

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onBack,
  onNavigateToShop,
  onNavigateToOrderDetails,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState<OrderFilter>('all');

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return mockOrders;
    return mockOrders.filter(o => o.status === selectedFilter);
  }, [selectedFilter]);

  const tabs: { id: OrderFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Orders', count: mockOrders.length },
    {
      id: 'in_transit',
      label: 'Active',
      count: mockOrders.filter(o => o.status === 'in_transit').length,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      count: mockOrders.filter(o => o.status === 'delivered').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: mockOrders.filter(o => o.status === 'cancelled').length,
    },
  ];

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
                onPress={() => setSelectedFilter(item.id)}
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

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
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
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 40, 50) },
          ]}
          showsVerticalScrollIndicator={false}
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
});
