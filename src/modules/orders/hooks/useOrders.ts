import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { OrderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';
import { mapOdooSaleOrderToOrder } from '../utils/orderMapper';

export const useOrders = () => {
  const { user, isAuthenticated } = useAuth();
  const partnerId = user?.partnerId || user?.id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(isAuthenticated && partnerId));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    // Guard: Do not call Odoo API if user is not logged in
    if (!isAuthenticated || !partnerId) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

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

      // Collect all order line IDs for batch fetching from Odoo
      const allLineIds: number[] = [];
      rawOrders.forEach(o => {
        if (Array.isArray(o.order_line)) {
          o.order_line.forEach((lid: any) => {
            const n = Number(lid);
            if (!isNaN(n) && n > 0) allLineIds.push(n);
          });
        }
      });

      let lineDetailsMap: Record<number, any[]> = {};
      if (allLineIds.length > 0) {
        try {
          const linesRes = await OrderService.getOrderLines(allLineIds);
          const linesList = Array.isArray(linesRes?.result)
            ? linesRes.result
            : Array.isArray(linesRes)
            ? linesRes
            : [];

          linesList.forEach((line: any) => {
            const oid = Array.isArray(line.order_id) ? line.order_id[0] : line.order_id;
            if (oid) {
              if (!lineDetailsMap[oid]) lineDetailsMap[oid] = [];
              lineDetailsMap[oid].push(line);
            }
          });
        } catch (lineErr) {
          console.warn('Failed to fetch batch order lines:', lineErr);
        }
      }

      const mapped = rawOrders
        .map((o: any) => {
          try {
            const enrichedOrder = {
              ...o,
              order_line_details: lineDetailsMap[o.id] || o.order_line_details,
            };
            return mapOdooSaleOrderToOrder(enrichedOrder);
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
  }, [selectedFilter, partnerId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && partnerId) {
      fetchOrders();
    } else {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
    }
  }, [fetchOrders, isAuthenticated, partnerId]);

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
