import { Order } from '../types';
import { Product } from '../../products/types/product';

const createOrderProduct = (id: string, name: string, price: number, category: string, unit: string): Product => ({
  id,
  name,
  price,
  originalPrice: price,
  discountPercentage: 0,
  category,
  unit,
  rating: 4.8,
  reviewsCount: 120,
  inStock: true,
  deliveryTime: '15 mins',
  description: name,
});

const sampleBroccoli = createOrderProduct('4875', 'Fresh Organic Broccoli', 89, 'Vegetables', '500g');
const sampleStrawberry = createOrderProduct('4907', 'Sweet Strawberries Pack', 149, 'Fruits', '250g');
const sampleRice = createOrderProduct('5207', 'Organic Basmati Rice', 234, 'Grocery', '1 kg');
const sampleMango = createOrderProduct('5348', 'Ratnagiri Alphonso Mangoes', 299, 'Fruits', '1 kg (4 pcs)');
const sampleSpinach = createOrderProduct('5512', 'Baby Spinach Leaves', 45, 'Vegetables', '250g');
const sampleMilk = createOrderProduct('5513', 'Organic Fresh A2 Milk', 68, 'Dairy', '1 L');
const sampleOil = createOrderProduct('5761', 'Cold Pressed Coconut Oil', 280, 'Grocery', '500 ml');
const sampleCashews = createOrderProduct('5762', 'Whole Cashews Jumbo W240', 325, 'Grocery', '250g');
const sampleEggs = createOrderProduct('5763', 'Farm Fresh Free-Range Eggs', 89, 'Dairy', '6 pcs');
const sampleMushrooms = createOrderProduct('5764', 'Button Mushrooms Pack', 55, 'Vegetables', '200g');
const sampleAvocado = createOrderProduct('5765', 'Hass Avocados Imported', 189, 'Fruits', '2 pcs (approx. 400g)');

export const mockOrders: Order[] = [
  {
    id: 'ord_1',
    orderNumber: '#LB-98421',
    date: 'Today',
    time: '09:15 AM',
    status: 'in_transit',
    items: [
      { product: sampleBroccoli, quantity: 2, price: sampleBroccoli.price },
      { product: sampleStrawberry, quantity: 1, price: sampleStrawberry.price },
      { product: sampleRice, quantity: 1, price: sampleRice.price },
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
      { product: sampleMango, quantity: 1, price: sampleMango.price },
      { product: sampleSpinach, quantity: 2, price: sampleSpinach.price },
      { product: sampleMilk, quantity: 2, price: sampleMilk.price },
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
      { product: sampleOil, quantity: 1, price: sampleOil.price },
      { product: sampleCashews, quantity: 1, price: sampleCashews.price },
      { product: sampleEggs, quantity: 1, price: sampleEggs.price },
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
      { product: sampleMushrooms, quantity: 1, price: sampleMushrooms.price },
      { product: sampleAvocado, quantity: 2, price: sampleAvocado.price },
    ],
    itemCount: 3,
    totalAmount: 433,
    savings: 95,
    paymentMode: 'Refunded to Source (UPI)',
    deliveryAddress: 'Flat 402, Usman Road, T. Nagar, Chennai',
  },
];
