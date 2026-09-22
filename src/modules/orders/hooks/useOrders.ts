import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // Concurrency guard to prevent overlapping/infinite fetch loops
  const isFetchingRef = useRef(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    // Guard: Prevent overlapping fetches
    if (isFetchingRef.current) {
      return;
    }

    // Guard: Do not call Odoo API if user is not logged in
    if (!isAuthenticated || !partnerId) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    isFetchingRef.current = true;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Always fetch all orders for this partner to ensure accurate tab counts and instant tab switching
      const res = await OrderService.getAllOrders(partnerId, 100);

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

          // Batch-fetch product thumbnails so the mapper's Layer 2 (base64 image) strategy
          // has the image_256 / image_128 data it needs to build valid imageUrl values.
          const allProdIds = Array.from(
            new Set(
              linesList
                .map((l: any) => (Array.isArray(l.product_id) ? l.product_id[0] : l.product_id))
                .filter((id: any) => id && !isNaN(Number(id))),
            ),
          ) as (string | number)[];

          if (allProdIds.length > 0) {
            try {
              const thumbsRes = await OrderService.getOrderProductThumbnails(allProdIds);
              const thumbsList = Array.isArray(thumbsRes?.result)
                ? thumbsRes.result
                : Array.isArray(thumbsRes)
                ? thumbsRes
                : [];

              const thumbMap: Record<number, any> = {};
              thumbsList.forEach((t: any) => {
                thumbMap[t.id] = t;
              });

              // Merge base64 image fields into every line entry inside lineDetailsMap
              Object.keys(lineDetailsMap).forEach(oidKey => {
                lineDetailsMap[Number(oidKey)] = lineDetailsMap[Number(oidKey)].map((line: any) => {
                  const pid = Array.isArray(line.product_id) ? line.product_id[0] : line.product_id;
                  const thumb = thumbMap[pid];
                  if (!thumb) return line;
                  return {
                    ...line,
                    image_512: thumb.image_512 || undefined,
                    image_256: thumb.image_256 || undefined,
                    image_128: thumb.image_128 || undefined,
                    product_tmpl_id: thumb.product_tmpl_id || line.product_tmpl_id,
                  };
                });
              });
            } catch (thumbErr) {
              console.warn('Failed to fetch batch product thumbnails:', thumbErr);
            }
          }
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
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [partnerId, isAuthenticated]);

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

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders;
    if (selectedFilter === 'in_transit') {
      return orders.filter(o => o.status === 'in_transit' || o.status === 'preparing');
    }
    return orders.filter(o => o.status === selectedFilter);
  }, [orders, selectedFilter]);

  const getOrderById = useCallback(
    (orderId: string): Order | undefined => {
      return orders.find(o => o.id === orderId);
    },
    [orders],
  );

  const cancelOrder = useCallback(
    async (orderId: string | number, reason?: string) => {
      try {
        await OrderService.cancelOrder(orderId, reason);
        setOrders(prev =>
          prev.map(o =>
            o.id === String(orderId) || o.id === orderId
              ? { ...o, status: 'cancelled' as OrderStatus }
              : o,
          ),
        );
      } catch (err) {
        console.error('Error cancelling order:', err);
        throw err;
      }
    },
    [],
  );

  // Stable memoized refresh callback to prevent re-render loops in useFocusEffect
  const refreshOrders = useCallback(() => {
    return fetchOrders(true);
  }, [fetchOrders]);

  return {
    orders,
    filteredOrders,
    selectedFilter,
    setSelectedFilter,
    loading,
    refreshing,
    error,
    refreshOrders,
    getOrderById,
    cancelOrder,
  };
};
