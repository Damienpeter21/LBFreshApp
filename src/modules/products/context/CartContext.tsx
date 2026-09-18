import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ODOO_CONFIG, API_SETTINGS } from '../../../app/config';
import { storage } from '../../../storage/AsyncStorage';
import { CartService } from '../services/cartService';
import { CartContextType, CartItem } from '../types/cart';
import { Product } from '../types/product';
import { mapOdooProductToProduct } from '../utils/productMapper';

const CART_STORAGE_KEY = '@lb_fresh_cart_items';
const CART_ORDER_ID_KEY = '@lb_fresh_cart_order_id';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOrderId, setCartOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;

  const cartOrderIdRef = useRef<number | null>(cartOrderId);
  cartOrderIdRef.current = cartOrderId;

  // ── Initial Mount: Restore Local Storage & Sync with Server ─────────────
  useEffect(() => {
    let isMounted = true;

    const restoreCart = async () => {
      try {
        setIsLoading(true);
        // 1. Immediately read locally saved items
        const savedItems = await storage.getJson<CartItem[]>(CART_STORAGE_KEY);
        const savedOrderIdStr = await storage.getString(CART_ORDER_ID_KEY);

        let initialItems: CartItem[] = [];
        if (savedItems && Array.isArray(savedItems)) {
          initialItems = savedItems;
          if (isMounted) setItems(savedItems);
        }

        let initialOrderId: number | null = null;
        if (savedOrderIdStr) {
          const parsed = Number(savedOrderIdStr);
          if (!isNaN(parsed) && parsed > 0) {
            initialOrderId = parsed;
            if (isMounted) setCartOrderId(parsed);
          }
        }

        // 2. Perform background server reconciliation non-blockingly
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            const partnerId = Number(ODOO_CONFIG.UID || 2);

            if (initialOrderId) {
              try {
                const detailRes = await CartService.fetchCartDetails(initialOrderId);
                const activeOrder = Array.isArray(detailRes?.result) ? detailRes.result[0] : null;
                if (!activeOrder && isMounted) {
                  setCartOrderId(null);
                  await storage.delete(CART_ORDER_ID_KEY);
                  initialOrderId = null;
                }
              } catch (vErr) {
                console.warn('Odoo draft cart verification note:', vErr);
              }
            }

            // If local cart was empty, attempt to restore any existing active draft cart from server
            if (!initialOrderId && initialItems.length === 0 && isMounted) {
              try {
                const cartsRes = await CartService.fetchAllCarts(partnerId);
                const draftCarts = Array.isArray(cartsRes?.result) ? cartsRes.result : [];
                if (draftCarts.length > 0 && isMounted) {
                  const latestCart = draftCarts[0];
                  if (latestCart?.id && Array.isArray(latestCart.order_line) && latestCart.order_line.length > 0) {
                    setCartOrderId(latestCart.id);
                    await storage.set(CART_ORDER_ID_KEY, String(latestCart.id));

                    const linesRes = await CartService.fetchCartLines(latestCart.order_line);
                    const lines = Array.isArray(linesRes?.result) ? linesRes.result : [];
                    if (lines.length > 0 && isMounted) {
                      const baseUrl = (API_SETTINGS?.baseUrl || 'https://lbfreshbasket.com').replace(/\/+$/, '');
                      const restoredItems: CartItem[] = lines.map((line: any) => {
                        const prodId = Array.isArray(line.product_id) ? line.product_id[0] : line.product_id;
                        const prodName = Array.isArray(line.product_id)
                          ? line.product_id[1]
                          : line.name || 'Product';
                        return {
                          product: {
                            id: String(prodId),
                            name: prodName,
                            price: Number(line.price_unit) || 0,
                            originalPrice: Number(line.price_unit) || 0,
                            rating: 4.5,
                            reviewsCount: 10,
                            imageUrl: `${baseUrl}/web/image/product.product/${prodId}/image_512`,
                            category: 'grocery',
                            unit: '1 pc',
                            inStock: true,
                          },
                          quantity: Number(line.product_uom_qty) || 1,
                          lineId: Number(line.id),
                        };
                      });
                      if (restoredItems.length > 0 && isMounted) {
                        setItems(restoredItems);
                        await storage.setJson(CART_STORAGE_KEY, restoredItems);
                      }
                    }
                  }
                }
              } catch (fetchErr) {
                console.warn('Odoo fetchAllCarts initial restore note:', fetchErr);
              }
            }
          } catch (bgErr) {
            console.warn('Background cart restore note:', bgErr);
          }
        }, 1200);
      } catch (err) {
        console.warn('CartContext restoreCart error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreCart();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Helper: Save items to AsyncStorage ──────────────────────────────────
  const persistItems = async (newItems: CartItem[]) => {
    await storage.setJson(CART_STORAGE_KEY, newItems);
  };

  // ── Add to Cart (Instant Local + Background Odoo API) ────────────────────
  const addToCart = async (incomingProduct: Product, quantity = 1) => {
    const product = mapOdooProductToProduct(incomingProduct);
    const prodIdStr = String(product.id);

    // 1. Optimistic state & local storage update
    let updatedItems: CartItem[] = [];
    let existingItem: CartItem | undefined;

    setItems(prev => {
      const idx = prev.findIndex(it => String(it.product.id) === prodIdStr);
      if (idx > -1) {
        updatedItems = [...prev];
        existingItem = updatedItems[idx];
        updatedItems[idx] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
        };
        return updatedItems;
      }
      const newItem: CartItem = { product, quantity };
      updatedItems = [...prev, newItem];
      return updatedItems;
    });

    await persistItems(updatedItems);

    // 2. Synchronize with Odoo Cart API
    try {
      const partnerId = Number(ODOO_CONFIG.UID || 2);
      let activeOrderId = cartOrderIdRef.current;

      if (!activeOrderId) {
        // Check if there is an existing draft cart order on server
        try {
          const cartsRes = await CartService.fetchAllCarts(partnerId);
          const draftCarts = Array.isArray(cartsRes?.result) ? cartsRes.result : [];
          if (draftCarts.length > 0 && draftCarts[0]?.id) {
            activeOrderId = draftCarts[0].id;
            setCartOrderId(activeOrderId);
            await storage.set(CART_ORDER_ID_KEY, String(activeOrderId));
          }
        } catch (cErr) {
          console.warn('fetchAllCarts check error:', cErr);
        }
      }

      if (activeOrderId) {
        if (existingItem?.lineId) {
          // Update line quantity (PUT Update Cart Item)
          await CartService.updateCartItem(
            existingItem.lineId,
            existingItem.quantity + quantity,
          );
        } else {
          // Add new line to existing cart (Post Add to Cart)
          const addRes = await CartService.addCartItem(activeOrderId, product.id, quantity);
          if (addRes?.result) {
            const newLineId = Number(addRes.result);
            setItems(curr => {
              const next = curr.map(it =>
                String(it.product.id) === prodIdStr ? { ...it, lineId: newLineId } : it,
              );
              persistItems(next);
              return next;
            });
          }
        }
      } else {
        // No draft cart exists, create a new draft Sale Order (Create Sale Order)
        const createRes = await CartService.createSaleOrder({
          partnerId,
          items: [
            {
              productId: Number(product.id),
              quantity,
              priceUnit: product.price,
            },
          ],
        });

        if (createRes?.result) {
          const newOrderId = Number(createRes.result);
          setCartOrderId(newOrderId);
          await storage.set(CART_ORDER_ID_KEY, String(newOrderId));

          try {
            const detailRes = await CartService.fetchCartDetails(newOrderId);
            const lines = detailRes?.result?.[0]?.order_line;
            if (Array.isArray(lines) && lines.length > 0) {
              const createdLineId = Number(lines[lines.length - 1]);
              setItems(curr => {
                const next = curr.map(it =>
                  String(it.product.id) === prodIdStr ? { ...it, lineId: createdLineId } : it,
                );
                persistItems(next);
                return next;
              });
            }
          } catch (rErr) {
            console.warn('fetchCartDetails for lineId error:', rErr);
          }
        }
      }
    } catch (apiErr) {
      console.warn('Odoo addToCart API sync note:', apiErr);
    }
  };

  // ── Update Quantity (Instant Local + Background Odoo API) ────────────────
  const updateQuantity = async (productId: string, quantity: number) => {
    const prodIdStr = String(productId);

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    let lineIdToUpdate: number | undefined;
    let updatedItems: CartItem[] = [];

    setItems(prev => {
      updatedItems = prev.map(item => {
        if (String(item.product.id) === prodIdStr) {
          lineIdToUpdate = item.lineId;
          return { ...item, quantity };
        }
        return item;
      });
      return updatedItems;
    });

    await persistItems(updatedItems);

    // Sync to Odoo API
    try {
      if (lineIdToUpdate) {
        // PUT Update Cart Item
        await CartService.updateCartItem(lineIdToUpdate, quantity);
      } else if (cartOrderIdRef.current) {
        // Line ID not yet linked, add item
        const addRes = await CartService.addCartItem(
          cartOrderIdRef.current,
          productId,
          quantity,
        );
        if (addRes?.result) {
          const newLineId = Number(addRes.result);
          setItems(curr => {
            const next = curr.map(it =>
              String(it.product.id) === prodIdStr ? { ...it, lineId: newLineId } : it,
            );
            persistItems(next);
            return next;
          });
        }
      }
    } catch (err) {
      console.warn('Odoo updateQuantity API sync note:', err);
    }
  };

  // ── Remove from Cart (Instant Local + Background Odoo API) ───────────────
  const removeFromCart = async (productId: string) => {
    const prodIdStr = String(productId);
    let lineIdToRemove: number | undefined;
    let updatedItems: CartItem[] = [];

    setItems(prev => {
      const target = prev.find(it => String(it.product.id) === prodIdStr);
      if (target) {
        lineIdToRemove = target.lineId;
      }
      updatedItems = prev.filter(it => String(it.product.id) !== prodIdStr);
      return updatedItems;
    });

    await persistItems(updatedItems);

    // Sync to Odoo API (DELETE Remove Cart Item)
    if (lineIdToRemove) {
      try {
        await CartService.removeCartItem(lineIdToRemove);
      } catch (err) {
        console.warn('Odoo removeCartItem API sync note:', err);
      }
    }
  };

  // ── Clear Cart (Instant Local + Background Odoo API) ─────────────────────
  const clearCart = async () => {
    const currentOrderId = cartOrderIdRef.current;
    setItems([]);
    setCartOrderId(null);
    await storage.delete(CART_STORAGE_KEY);
    await storage.delete(CART_ORDER_ID_KEY);

    // Sync to Odoo API (DELETE Clear Cart)
    if (currentOrderId) {
      try {
        await CartService.clearCart(currentOrderId);
      } catch (err) {
        console.warn('Odoo clearCart API sync note:', err);
      }
    }
  };

  // ── Refresh Cart from API ───────────────────────────────────────────────
  const refreshCartFromApi = async () => {
    try {
      const partnerId = Number(ODOO_CONFIG.UID || 2);
      const cartsRes = await CartService.fetchAllCarts(partnerId);
      const draftCarts = Array.isArray(cartsRes?.result) ? cartsRes.result : [];
      if (draftCarts.length > 0) {
        const activeCart = draftCarts[0];
        setCartOrderId(activeCart.id);
        await storage.set(CART_ORDER_ID_KEY, String(activeCart.id));

        if (Array.isArray(activeCart.order_line) && activeCart.order_line.length > 0) {
          const linesRes = await CartService.fetchCartLines(activeCart.order_line);
          const lines = Array.isArray(linesRes?.result) ? linesRes.result : [];
          if (lines.length > 0) {
            const baseUrl = (API_SETTINGS?.baseUrl || 'https://lbfreshbasket.com').replace(/\/+$/, '');
            const freshItems: CartItem[] = lines.map((line: any) => {
              const prodId = Array.isArray(line.product_id) ? line.product_id[0] : line.product_id;
              const prodName = Array.isArray(line.product_id)
                ? line.product_id[1]
                : line.name || 'Product';
              return {
                product: {
                  id: String(prodId),
                  name: prodName,
                  price: Number(line.price_unit) || 0,
                  originalPrice: Number(line.price_unit) || 0,
                  rating: 4.5,
                  reviewsCount: 10,
                  imageUrl: `${baseUrl}/web/image/product.template/${prodId}/image_512`,
                  category: 'grocery',
                  unit: '1 pc',
                  inStock: true,
                },
                quantity: Number(line.product_uom_qty) || 1,
                lineId: Number(line.id),
              };
            });
            setItems(freshItems);
            await persistItems(freshItems);
          }
        }
      }
    } catch (err) {
      console.warn('refreshCartFromApi error:', err);
    }
  };

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        totalAmount,
        cartOrderId,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCartFromApi,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

