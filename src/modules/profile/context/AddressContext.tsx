// src/modules/profile/context/AddressContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../auth';
import { CustomerService } from '../services/customerService';
import { SavedAddress } from '../types/address';
import {
  mapOdooPartnerToSavedAddress,
  mapSavedAddressToOdooPayload,
} from '../utils/addressMapper';

interface AddressContextType {
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
  loading: boolean;
  addAddress: (addr: Omit<SavedAddress, 'id'>) => Promise<SavedAddress>;
  updateAddress: (id: string, addr: Partial<SavedAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => void;
  refreshAddresses: () => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const partnerId = user?.partnerId || user?.id;

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await CustomerService.getCustomerAddresses(partnerId);
      const rawAddresses = Array.isArray(res?.result) ? res.result : [];

      if (rawAddresses.length > 0) {
        const mapped = rawAddresses.map((p: any, idx: number) =>
          mapOdooPartnerToSavedAddress(p, idx === 0),
        );
        setAddresses(mapped);

        // Keep or select default
        const defaultAddr = mapped.find((a: SavedAddress) => a.isDefault) || mapped[0];
        if (defaultAddr && !selectedAddressId) {
          setSelectedAddressId(defaultAddr.id);
        }
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.warn('Could not fetch Odoo customer addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [partnerId, isAuthenticated]);

  const addAddress = async (newAddr: Omit<SavedAddress, 'id'>): Promise<SavedAddress> => {
    let newId = `addr_${Date.now()}`;

    try {
      const odooPayload = mapSavedAddressToOdooPayload(newAddr);
      const res = await CustomerService.createCustomerAddress(partnerId, odooPayload);
      if (res?.result) {
        newId = String(res.result);
      }
    } catch (err) {
      console.warn('Odoo createCustomerAddress error, saving locally:', err);
    }

    const addressWithId: SavedAddress = {
      ...newAddr,
      id: newId,
    };

    setAddresses(prev => {
      if (newAddr.isDefault) {
        return [addressWithId, ...prev.map(a => ({ ...a, isDefault: false }))];
      }
      return [addressWithId, ...prev];
    });

    if (newAddr.isDefault || addresses.length === 0) {
      setSelectedAddressId(newId);
    }

    return addressWithId;
  };

  const updateAddress = async (id: string, updatedFields: Partial<SavedAddress>) => {
    try {
      const odooPayload = mapSavedAddressToOdooPayload(updatedFields);
      await CustomerService.updateCustomerAddress(id, odooPayload);
    } catch (err) {
      console.warn('Odoo updateCustomerAddress error, updating locally:', err);
    }

    setAddresses(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, ...updatedFields };
        }
        if (updatedFields.isDefault) {
          return { ...item, isDefault: false };
        }
        return item;
      }),
    );
  };

  const deleteAddress = async (id: string) => {
    try {
      await CustomerService.deleteCustomerAddress(id);
    } catch (err) {
      console.warn('Odoo deleteCustomerAddress error, deleting locally:', err);
    }

    setAddresses(prev => {
      const remaining = prev.filter(item => item.id !== id);
      if (selectedAddressId === id && remaining.length > 0) {
        setSelectedAddressId(remaining[0].id);
      }
      return remaining;
    });
  };

  const setDefaultAddress = async (id: string) => {
    const target = addresses.find(a => a.id === id);
    if (target) {
      try {
        const odooPayload = mapSavedAddressToOdooPayload(target);
        await CustomerService.setDefaultAddress(partnerId, odooPayload);
      } catch (err) {
        console.warn('Odoo setDefaultAddress error, setting locally:', err);
      }
    }

    setAddresses(prev =>
      prev.map(item => ({
        ...item,
        isDefault: item.id === id,
      })),
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
        loading,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        selectAddress,
        refreshAddresses: fetchAddresses,
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
