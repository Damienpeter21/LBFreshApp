import { mapOdooProductToProduct } from '../src/modules/products/utils/productMapper';
import { mapOdooSaleOrderToOrder, mapOdooStateToOrderStatus } from '../src/modules/orders/utils/orderMapper';
import { mapOdooPartnerToSavedAddress, mapSavedAddressToOdooPayload } from '../src/modules/profile/utils/addressMapper';

describe('API Integration Mappers', () => {
  describe('productMapper', () => {
    it('correctly maps raw Odoo product.template to standard Product model', () => {
      const rawProduct = {
        id: 4855,
        name: 'Fresh Organic Apples 1kg',
        list_price: 180,
        mrp_price: 220,
        discount_percentage: 18,
        discounted_price: 180,
        categ_id: [14, 'Fruits / Fresh Fruits'],
        qty_available: 45,
        uom_id: [1, 'Kg'],
        uom_name: 'Kg',
        delivery_time_days: 0,
        description_sale: 'Crisp and juicy handpicked apples.',
        lb_rating_avg: 4.8,
        lb_review_count: 24,
      };

      const mapped = mapOdooProductToProduct(rawProduct);

      expect(mapped.id).toBe('4855');
      expect(mapped.name).toBe('Fresh Organic Apples 1kg');
      expect(mapped.category).toBe('Fresh Fruits');
      expect(mapped.price).toBe(180);
      expect(mapped.originalPrice).toBe(220);
      expect(mapped.rating).toBe(4.8);
      expect(mapped.reviewsCount).toBe(24);
      expect(mapped.deliveryTime).toBe('15 mins');
      expect(mapped.inStock).toBe(true);
    });
  });

  describe('orderMapper', () => {
    it('correctly maps Odoo state and delivery_status to OrderStatus', () => {
      expect(mapOdooStateToOrderStatus('draft')).toBe('preparing');
      expect(mapOdooStateToOrderStatus('sale', 'partial')).toBe('in_transit');
      expect(mapOdooStateToOrderStatus('sale', 'full')).toBe('delivered');
      expect(mapOdooStateToOrderStatus('cancel')).toBe('cancelled');
    });

    it('correctly maps Odoo sale.order to Order interface', () => {
      const rawOrder = {
        id: 23,
        name: 'S00023',
        partner_id: [2, 'Damien Peter'],
        date_order: '2026-09-16 10:30:00',
        amount_untaxed: 200,
        amount_tax: 25,
        amount_total: 225,
        state: 'sale',
        delivery_status: 'partial',
        order_line: [101, 102],
      };

      const mapped = mapOdooSaleOrderToOrder(rawOrder);

      expect(mapped.id).toBe('23');
      expect(mapped.orderNumber).toBe('#S00023');
      expect(mapped.status).toBe('in_transit');
      expect(mapped.totalAmount).toBe(225);
      expect(mapped.itemCount).toBe(2);
      expect(mapped.deliveryAddress).toBe('Damien Peter');
    });
  });

  describe('addressMapper', () => {
    it('correctly maps Odoo res.partner to SavedAddress', () => {
      const rawPartner = {
        id: 3,
        name: 'Home Address',
        type: 'delivery',
        street: '123 Main Street',
        street2: 'Apartment 4B',
        city: 'Chennai',
        zip: '600001',
        phone: '+91 9876543210',
      };

      const mapped = mapOdooPartnerToSavedAddress(rawPartner);

      expect(mapped.id).toBe('3');
      expect(mapped.name).toBe('Home Address');
      expect(mapped.flatNo).toBe('123 Main Street');
      expect(mapped.streetArea).toBe('Apartment 4B');
      expect(mapped.city).toBe('Chennai');
      expect(mapped.pincode).toBe('600001');
      expect(mapped.phone).toBe('+91 9876543210');
    });

    it('correctly converts SavedAddress to Odoo CustomerAddressPayload', () => {
      const addr = {
        name: 'Office Address',
        phone: '9845012345',
        pincode: '600096',
        flatNo: 'Tower 3, 5th Floor',
        streetArea: 'OMR, Thoraipakkam',
        city: 'Chennai',
      };

      const payload = mapSavedAddressToOdooPayload(addr);

      expect(payload.name).toBe('Office Address');
      expect(payload.street).toBe('Tower 3, 5th Floor');
      expect(payload.street2).toBe('OMR, Thoraipakkam');
      expect(payload.zip).toBe('600096');
      expect(payload.city).toBe('Chennai');
    });
  });
});
