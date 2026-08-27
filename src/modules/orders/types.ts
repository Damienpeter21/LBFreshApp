import { Product } from '../products/types/product';

export type OrderStatus = 'preparing' | 'in_transit' | 'delivered' | 'cancelled';

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface DeliveryPartner {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  status: OrderStatus;
  items: OrderItem[];
  itemCount: number;
  totalAmount: number;
  savings: number;
  paymentMode: string;
  deliveryAddress: string;
  eta?: string;
  deliveryPartner?: DeliveryPartner;
}
