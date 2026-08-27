import { SavedAddress } from '../types/address';

export const mockAddresses: SavedAddress[] = [
  {
    id: 'addr_1',
    name: 'Ramesh Kumar',
    phone: '9845012345',
    pincode: '600017',
    flatNo: 'Flat 402, Block B, Green Heights',
    streetArea: 'Usman Road, T. Nagar',
    landmark: 'Opp. Nilgiris Supermarket',
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'HOME',
    isDefault: true,
  },
  {
    id: 'addr_2',
    name: 'Ramesh Kumar',
    phone: '9845012345',
    pincode: '600096',
    flatNo: 'Tower 3, 5th Floor, Ascendas Tech Park',
    streetArea: 'Rajiv Gandhi Salai, Thoraipakkam, OMR',
    landmark: 'Near Toll Plaza',
    city: 'Chennai',
    state: 'Tamil Nadu',
    type: 'WORK',
    isDefault: false,
  },
];
