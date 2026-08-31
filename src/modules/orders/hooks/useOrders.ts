import { useState, useCallback } from 'react';
import { mockOrders } from '../data/mockOrders';
import { Order, OrderStatus } from '../types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = orders.filter(order =>
    selectedFilter === 'all' ? true : order.status === selectedFilter
  );

  const getOrderById = useCallback(
    (orderId: string): Order | undefined => {
      return orders.find(o => o.id === orderId);
    },
    [orders]
  );

  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o
      )
    );
  }, []);

  return {
    orders,
    filteredOrders,
    selectedFilter,
    setSelectedFilter,
    getOrderById,
    cancelOrder,
  };
};
