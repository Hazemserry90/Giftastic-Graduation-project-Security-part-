import { create } from 'zustand';
import { cartService } from '../services/cartService';
import { getFriendlyErrorMessage } from '../services/api';
import { getCartItemCount, getCartTotal } from '../ui/entities/cart';
import { getProductPrimaryImage } from '../ui/entities/product';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { authorizeEntityHydration, hydrateEntityById } from '../ui/entities/shared/productionHydration';
import { serializeCartMetadata } from '../ui/commands';
const loadProduct = (productId) => hydrateEntityById('product', productId, {
  authorized: authorizeEntityHydration('product', { id: productId }),
});
const readGuestCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('guest_cart') || '{"items":[]}');
    return parsed && Array.isArray(parsed.items) ? parsed : { items: [] };
  } catch {
    localStorage.removeItem('guest_cart');
    return { items: [] };
  }
};
const adaptResponseCart = (cart) => adaptEntityFromNamedSource('adaptCartResponse', cart);
const adaptGuestCart = (cart) => adaptEntityFromNamedSource('adaptGuestCart', cart);
const pendingAddKeys = new Set();

export const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,
  error: null,
  
  fetchCart: async (customerId) => {
    set({ loading: true, error: null });
    try {
      if (customerId) {
        const cart = await cartService.getCart(customerId);
        const items = await Promise.all((cart.items || []).map(async (item) => {
          try {
            const product = await loadProduct(item.productId);
            return {
              ...item,
              stockQuantity: product.stockQuantity,
              supplierId: item.supplierId || product.supplierId,
              imageUrl: item.imageUrl || getProductPrimaryImage(product),
            };
          } catch {
            return { ...item, stockQuantity: null };
          }
        }));
        set({
          cart: adaptResponseCart({ ...cart, items }),
          loading: false,
        });
      } else {
        set({ cart: adaptGuestCart(readGuestCart()), loading: false });
      }
    } catch (error) {
      set({ error: getFriendlyErrorMessage(error, 'We could not load your cart. Please refresh and try again.'), loading: false });
    }
  },
  
  addToCart: async (customerId, productId, quantity = 1, groupId, metadata) => {
    const addKey = `${customerId || 'guest'}:${productId}:${groupId || 'single'}`;
    if (pendingAddKeys.has(addKey)) return false;
    pendingAddKeys.add(addKey);
    set({ loading: true, error: null });
    try {
      if (customerId) {
        await cartService.addItem(customerId, productId, quantity, groupId, metadata);
        await get().fetchCart(customerId);
      } else {
        // Guest cart
        const product = await loadProduct(productId);
        const guestCart = readGuestCart();
        
        // Look for matching item
        const existingItem = guestCart.items.find(
          (item) => item.productId === productId && item.groupId === (groupId || null)
        );
        
        if (existingItem) {
          existingItem.quantity = quantity;
          existingItem.metadata = serializeCartMetadata(metadata);
          existingItem.stockQuantity = product.stockQuantity;
        } else {
          const imageUrl = getProductPrimaryImage(product) || '';
          guestCart.items.push({
            productId: product.id,
            productName: product.name,
            imageUrl: imageUrl,
            quantity: quantity,
            price: product.price,
            supplierId: product.supplierId,
            groupId: groupId || null,
            metadata: serializeCartMetadata(metadata),
            stockQuantity: product.stockQuantity
          });
        }
        
        localStorage.setItem('guest_cart', JSON.stringify(guestCart));
        set({ cart: adaptGuestCart(guestCart), loading: false });
      }
      return true;
    } catch (error) {
      set({ error: getFriendlyErrorMessage(error, 'We could not add this item to your cart. Please try again.'), loading: false });
      throw error;
    } finally {
      pendingAddKeys.delete(addKey);
    }
  },

  addItemsToCart: async (customerId, items) => {
    set({ loading: true, error: null });
    try {
      if (customerId) {
        await cartService.addItems(customerId, items);
        await get().fetchCart(customerId);
      } else {
        const guestCart = readGuestCart();
        
        for (const item of items) {
          const product = await loadProduct(item.productId);
          const existingItem = guestCart.items.find(
            (it) => it.productId === item.productId && it.groupId === (item.groupId || null)
          );
          
          if (existingItem) {
            existingItem.quantity = item.quantity;
            existingItem.metadata = serializeCartMetadata(item.metadata);
            existingItem.stockQuantity = product.stockQuantity;
          } else {
            const imageUrl = getProductPrimaryImage(product) || '';
            guestCart.items.push({
              productId: product.id,
              productName: product.name,
              imageUrl: imageUrl,
              quantity: item.quantity,
              price: product.price,
              supplierId: product.supplierId,
              groupId: item.groupId || null,
              metadata: serializeCartMetadata(item.metadata),
              stockQuantity: product.stockQuantity
            });
          }
        }
        
        localStorage.setItem('guest_cart', JSON.stringify(guestCart));
        set({ cart: adaptGuestCart(guestCart), loading: false });
      }
    } catch (error) {
      set({ error: getFriendlyErrorMessage(error, 'We could not add these items to your cart. Please try again.'), loading: false });
      throw error;
    }
  },
  
  updateQuantity: async (customerId, productId, quantity, groupId) => {
    set({ loading: true, error: null });
    try {
      if (customerId) {
        await cartService.updateItemQuantity(customerId, productId, quantity, groupId);
        await get().fetchCart(customerId);
      } else {
        const guestCart = readGuestCart();
        
        const existingItem = guestCart.items.find(
          (item) => item.productId === productId && item.groupId === (groupId || null)
        );
        
        if (existingItem) {
          existingItem.quantity = quantity;
          localStorage.setItem('guest_cart', JSON.stringify(guestCart));
        }
        
        set({ cart: adaptGuestCart(guestCart), loading: false });
      }
    } catch (error) {
      set({ error: getFriendlyErrorMessage(error, 'We could not update your cart. Please try again.'), loading: false });
      throw error;
    }
  },
  
  removeFromCart: async (customerId, productId, groupId) => {
    set({ loading: true, error: null });
    try {
      if (customerId) {
        if (productId) {
          await cartService.removeItem(customerId, productId, groupId);
        } else if (groupId) {
          await cartService.removeGroup(customerId, groupId);
        }
        await get().fetchCart(customerId);
      } else {
        const guestCart = readGuestCart();
        
        if (productId) {
          guestCart.items = guestCart.items.filter(
            (item) => !(item.productId === productId && item.groupId === (groupId || null))
          );
        } else if (groupId) {
          guestCart.items = guestCart.items.filter((item) => item.groupId !== groupId);
        }
        
        localStorage.setItem('guest_cart', JSON.stringify(guestCart));
        set({ cart: adaptGuestCart(guestCart), loading: false });
      }
    } catch (error) {
      set({ error: getFriendlyErrorMessage(error, 'We could not remove this cart item. Please try again.'), loading: false });
      throw error;
    }
  },
  
  clearCart: async (customerId) => {
    set({ loading: true, error: null });
    try {
      if (customerId) {
        await cartService.clearCart(customerId);
      } else {
        localStorage.removeItem('guest_cart');
      }
      set({ cart: null, loading: false });
    } catch (error) {
      set({ error: getFriendlyErrorMessage(error, 'We could not clear your cart. Please try again.'), loading: false });
      throw error;
    }
  },
  
  getCartItemCount: () => {
    return getCartItemCount(get().cart) ?? 0;
  },
  
  getCartTotal: () => {
    return getCartTotal(get().cart);
  }
}));
