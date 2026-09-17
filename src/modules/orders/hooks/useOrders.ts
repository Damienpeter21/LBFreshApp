import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { OrderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';
import { mapOdooSaleOrderToOrder } from '../utils/orderMapper';

export const useOrders = () => {
  const { user, isAuthenticated } = useAuth();
  const partnerId = user?.partnerId || user?.id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let res: any;
      if (selectedFilter === 'in_transit') {
        res = await OrderService.getActiveOrders(partnerId);
      } else if (selectedFilter === 'delivered') {
        res = await OrderService.getDeliveredOrders(partnerId);
      } else if (selectedFilter === 'cancelled') {
        res = await OrderService.getCancelledOrders(partnerId);
      } else {
        res = await OrderService.getAllOrders(partnerId);
      }

      const rawOrders: any[] = Array.isArray(res?.result)
        ? res.result
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      const mapped = rawOrders
        .map((o: any) => {
          try {
            return mapOdooSaleOrderToOrder(o);
          } catch (itemErr) {
            console.warn('Failed to map order item:', o, itemErr);
            return null;
          }
        })
        .filter((o: Order | null): o is Order => o !== null);

      setOrders(mapped);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, partnerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order =>
    selectedFilter === 'all' ? true : order.status === selectedFilter,
  );

  const getOrderById = useCallback(
    (orderId: string): Order | undefined => {
      return orders.find(o => o.id === orderId);
    },
    [orders],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      try {
        await OrderService.cancelOrder(orderId);
        setOrders(prev =>
          prev.map(o =>
            o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o,
          ),
        );
      } catch (err) {
        console.error('Error cancelling order:', err);
        throw err;
      }
    },
    [],
  );

  return {
    orders,
    filteredOrders,
    selectedFilter,
    setSelectedFilter,
    loading,
    refreshing,
    error,
    refreshOrders: () => fetchOrders(true),
    getOrderById,
    cancelOrder,
  };
};
