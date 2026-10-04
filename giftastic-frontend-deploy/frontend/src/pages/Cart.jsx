import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { getFriendlyErrorMessage } from '../services/api';
import {
  buildCartAccess,
  CART_CONTEXT,
  CartGroupView,
  formatCartMoney,
  getCartStockIssues,
  getCartTotal,
  groupCartItems,
} from '../ui/entities/cart';

export default function Cart() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { cart, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const access = cart ? buildCartAccess({
    cart,
    viewer,
    context: isAuthenticated ? CART_CONTEXT.OWNER : CART_CONTEXT.GUEST_LOCAL,
  }) : null;

  const describeStockIssue = (item, reason) => {
    const productName = item.productName || item.name || 'This product';
    const vendorName = item.storeName || item.vendorName;
    const vendorText = vendorName ? ` from ${vendorName}` : '';
    if (reason === 'unavailable') {
      return `Stock information for "${productName}"${vendorText} is unavailable. Please refresh before checkout.`;
    }
    if (reason === 'outOfStock') {
      return `"${productName}"${vendorText} is out of stock. Please remove it before checkout.`;
    }
    return `"${productName}"${vendorText} only has ${item.stockQuantity} available, but you requested ${item.quantity}. Please adjust the quantity.`;
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCart(user.id);
    } else {
      fetchCart();
    }
  }, [isAuthenticated, user]);

  const handleUpdateQuantity = async (productId, newQuantity, groupId) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(user?.id, productId, newQuantity, groupId);
      toast.success('Quantity updated');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not update this cart quantity. Please try again.'));
    }
  };

  const handleRemove = async (productId, groupId) => {
    try {
      await removeFromCart(user?.id, productId, groupId);
      toast.success('Item removed');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not remove this item from your cart. Please try again.'));
    }
  };

  const handleCheckout = () => {
    // Validate stock for all items
    const stockIssues = getCartStockIssues(cart);

    if (stockIssues.unavailable.length > 0) {
      toast.error(describeStockIssue(stockIssues.unavailable[0], 'unavailable'));
      return;
    }
    
    if (stockIssues.outOfStock.length > 0) {
      toast.error(describeStockIssue(stockIssues.outOfStock[0], 'outOfStock'));
      return;
    }
    
    if (stockIssues.insufficient.length > 0) {
      toast.error(describeStockIssue(stockIssues.insufficient[0], 'insufficient'));
      return;
    }
    
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-12 lg:py-12 flex-grow">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-8">Shopping Cart</h1>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !cart || !access?.canRead || cart.items?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-on-surface-variant mb-4">Your cart is empty</p>
            <Link to="/products" className="bg-primary text-on-primary px-6 py-3 rounded-lg inline-block">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              {groupCartItems(cart).map((group) => (
                <CartGroupView
                  key={group.key}
                  group={group}
                  onUpdateQuantity={(productId, quantity) => handleUpdateQuantity(productId, quantity, null)}
                  onRemoveItem={(productId) => handleRemove(productId, null)}
                  onRemoveGroup={(groupId) => handleRemove(null, groupId)}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg p-6 shadow-plum sticky top-24">
                <h2 className="font-headline-md text-headline-md text-primary mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span>{formatCartMoney(getCartTotal(cart)) || '-'}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant text-sm">
                    <span>Shipping</span>
                    <span className="text-secondary">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-outline-variant pt-3 flex justify-between font-bold text-primary text-lg">
                    <span>Subtotal</span>
                    <span>{formatCartMoney(getCartTotal(cart)) || '-'}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full bg-primary text-on-primary py-4 rounded-lg font-label-md hover:bg-primary-container active:scale-98 transition-all shadow-lg"
                >
                  Proceed to Checkout
                </button>
                
                <Link 
                  to="/products"
                  className="block text-center mt-4 text-primary hover:underline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
