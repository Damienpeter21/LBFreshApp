import { mockProducts } from '../../products/data/mockProducts';
import { Order } from '../types';

export const mockOrders: Order[] = [
  {
    id: 'ord_1',
    orderNumber: '#LB-98421',
    date: 'Today',
    time: '09:15 AM',
    status: 'in_transit',
    items: [
      { product: mockProducts[0], quantity: 2, price: mockProducts[0].price }, // Broccoli
      { product: mockProducts[6], quantity: 1, price: mockProducts[6].price }, // Strawberries
      { product: mockProducts[10], quantity: 1, price: mockProducts[10].price }, // Basmati Rice
    ],
    itemCount: 4,
    totalAmount: 472,
    savings: 112,
    paymentMode: 'Paid via UPI (Google Pay)',
    deliveryAddress: 'Flat 402, Usman Road, T. Nagar, Chennai',
    eta: '12 mins (09:35 AM)',
    deliveryPartner: {
      name: 'Ravi Kumar',
      phone: '+91 98450 12345',
      vehicle: 'Electric Scooter (TN-09-EQ-4421)',
      rating: 4.9,
    },
  },
  {
    id: 'ord_2',
    orderNumber: '#LB-97814',
    date: '25 Aug 2026',
    time: '06:40 PM',
    status: 'delivered',
    items: [
      { product: mockProducts[7], quantity: 1, price: mockProducts[7].price }, // Alphonso Mangoes
      { product: mockProducts[1], quantity: 2, price: mockProducts[1].price }, // Baby Spinach
      { product: mockProducts[16], quantity: 2, price: mockProducts[16].price }, // A2 Milk
    ],
    itemCount: 5,
    totalAmount: 545,
    savings: 145,
    paymentMode: 'Paid via Credit Card',
    deliveryAddress: 'Flat 402, Usman Road, T. Nagar, Chennai',
    deliveryPartner: {
      name: 'Karthik Raja',
      phone: '+91 97412 88765',
      vehicle: 'Hero Electric (TN-01-AB-7890)',
      rating: 4.8,
    },
  },
  {
    id: 'ord_3',
    orderNumber: '#LB-95620',
    date: '21 Aug 2026',
    time: '11:10 AM',
    status: 'delivered',
    items: [
      { product: mockProducts[11], quantity: 1, price: mockProducts[11].price }, // Virgin Coconut Oil
      { product: mockProducts[13], quantity: 1, price: mockProducts[13].price }, // Cashews
      { product: mockProducts[18], quantity: 1, price: mockProducts[18].price }, // Free-range eggs
    ],
    itemCount: 3,
    totalAmount: 694,
    savings: 186,
    paymentMode: 'Cash on Delivery',
    deliveryAddress: 'Flat 402, Usman Road, T. Nagar, Chennai',
    deliveryPartner: {
      name: 'Murugan S',
      phone: '+91 98860 45678',
      vehicle: 'Ather 450X (TN-07-MK-3312)',
      rating: 5.0,
    },
  },
  {
    id: 'ord_4',
    orderNumber: '#LB-93109',
    date: '15 Aug 2026',
    time: '04:20 PM',
    status: 'cancelled',
    items: [
      { product: mockProducts[3], quantity: 1, price: mockProducts[3].price }, // Mushrooms
      { product: mockProducts[8], quantity: 2, price: mockProducts[8].price }, // Avocados
    ],
    itemCount: 3,
    totalAmount: 433,
    savings: 95,
    paymentMode: 'Refunded to Source (UPI)',
    deliveryAddress: 'Flat 402, Usman Road, T. Nagar, Chennai',
  },
];
