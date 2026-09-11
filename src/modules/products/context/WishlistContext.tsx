import React, { createContext, useContext, useState } from 'react';
import { Product } from '../types/product';
import { mapOdooProductToProduct } from '../utils/productMapper';

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isInWishlist: (productId: string | number) => boolean;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string | number) => void;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  const isInWishlist = (productId: string | number) => {
    return wishlist.some(p => String(p.id) === String(productId));
  };

  const addToWishlist = (incomingProduct: Product) => {
    const product = mapOdooProductToProduct(incomingProduct);
    if (!isInWishlist(product.id)) {
      setWishlist(prev => [product, ...prev]);
    }
  };

  const removeFromWishlist = (productId: string | number) => {
    setWishlist(prev => prev.filter(p => String(p.id) !== String(productId)));
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
