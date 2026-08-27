import React, { createContext, useContext, useState } from 'react';
import { mockAddresses } from '../data/mockAddresses';
import { SavedAddress } from '../types/address';

interface AddressContextType {
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
  addAddress: (addr: Omit<SavedAddress, 'id'>) => SavedAddress;
  updateAddress: (id: string, addr: Partial<SavedAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  selectAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>(mockAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    mockAddresses.find(a => a.isDefault)?.id || mockAddresses[0]?.id || ''
  );

  const addAddress = (newAddr: Omit<SavedAddress, 'id'>): SavedAddress => {
    const id = `addr_${Date.now()}`;
    const addressWithId: SavedAddress = {
      ...newAddr,
      id,
    };

    setAddresses(prev => {
      if (newAddr.isDefault) {
        return [addressWithId, ...prev.map(a => ({ ...a, isDefault: false }))];
      }
      return [addressWithId, ...prev];
    });

    if (newAddr.isDefault || addresses.length === 0) {
      setSelectedAddressId(id);
    }

    return addressWithId;
  };

  const updateAddress = (id: string, updatedFields: Partial<SavedAddress>) => {
    setAddresses(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, ...updatedFields };
        }
        if (updatedFields.isDefault) {
          return { ...item, isDefault: false };
        }
        return item;
      })
    );
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => {
      const remaining = prev.filter(item => item.id !== id);
      if (selectedAddressId === id && remaining.length > 0) {
        setSelectedAddressId(remaining[0].id);
      }
      return remaining;
    });
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(prev =>
      prev.map(item => ({
        ...item,
        isDefault: item.id === id,
      }))
    );
    setSelectedAddressId(id);
  };

  const selectAddress = (id: string) => {
    setSelectedAddressId(id);
  };

  const selectedAddress =
    addresses.find(a => a.id === selectedAddressId) ||
    addresses.find(a => a.isDefault) ||
    addresses[0] ||
    null;

  return (
    <AddressContext.Provider
      value={{
        addresses,
        selectedAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        selectAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = (): AddressContextType => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};
