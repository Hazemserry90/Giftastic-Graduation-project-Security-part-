import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZoneSelector from '../components/ZoneSelector';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { orderService } from '../services/orderService';
import deliveryService from '../services/deliveryService';
import api, { getFriendlyErrorMessage } from '../services/api';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { commandDraftToPayload, mapCartToOrderDraft } from '../ui/commands';
import { formatOrderDeliveryCost, formatOrderMoney, sumOrderAmounts } from '../ui/entities/order';
import { buildUserAccess, getReadableUserField, USER_CONTEXT } from '../ui/entities/user';
import { addDecimals } from '../ui/entities/shared/decimal';
import { rememberGuestOrder } from '../utils/guestOrders';
import {
  getEgyptianPhoneError,
  getFullNameError,
  getInstapayRefundDetailsError,
  getStrictEgyptianPhoneError,
  normalizeFullName,
  normalizeInstapayRefundDetails,
  sanitizeDigitsOnly,
  sanitizeFullName,
} from '../utils/contactValidation';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, viewer } = useAuthStore();
  const { cart, getCartTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [instapayPhone, setInstapayPhone] = useState('');
  const selfAccess = user ? buildUserAccess({ user, viewer, context: USER_CONTEXT.SELF }) : null;
  const selfEmail = user
    ? getReadableUserField(user, 'email', selfAccess?.fields?.email).value
    : null;
  const [selectedZone, setSelectedZone] = useState(null);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryCostBreakdown, setDeliveryCostBreakdown] = useState({});
  const [vendorNames, setVendorNames] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    instapayRefundPhoneNumber: '',
    instapayRefundName: '',
    address: '',
    district: 'Sidi Gaber',
    paymentMethod: 'COD'
  });

  useEffect(() => {
    // Fetch Instapay phone number
    api.get('/payment/instapay/phone')
      .then(response => {
        setInstapayPhone(response.data?.phoneNumber || '');
      })
      .catch(() => setInstapayPhone(''));

    if (user) {
      // Fetch profile to pre-fill
      import('../services/userService').then(({ userService }) => {
        userService.getMyProfile().then((rawProfile) => {
          const profile = adaptEntityFromNamedSource('adaptUserMe', rawProfile);
          const access = buildUserAccess({ user: profile, viewer, context: USER_CONTEXT.EDIT });
          const read = (field) => getReadableUserField(profile, field, access.fields[field]).value;
          const savedRefundPhone = read('instapayRefundPhoneNumber') || '';
          const savedRefundName = read('instapayRefundName') || '';
          setFormData(prev => ({
            ...prev,
            fullName: read('fullName') || '',
            email: read('email') || '',
            phone: read('phoneNumber') || '',
            instapayRefundPhoneNumber: getStrictEgyptianPhoneError(savedRefundPhone, 'Refund phone number') ? '' : sanitizeDigitsOnly(savedRefundPhone),
            instapayRefundName: getFullNameError(savedRefundName, 'Refund name') ? '' : normalizeFullName(savedRefundName),
          }));
          setSavedAddresses(read('addresses') || []);
        });
      });
    }
  }, [user, viewer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'instapayRefundPhoneNumber'
      ? sanitizeDigitsOnly(value)
      : name === 'instapayRefundName'
        ? sanitizeFullName(value)
        : value;
    setFormData({ ...formData, [name]: nextValue });
  };

  const buildVendorProblemDetails = () => {
    const groups = new Map();
    (cart?.items || []).forEach((item) => {
      const vendorId = item.supplierId || 'unknown';
      const group = groups.get(vendorId) || {
        vendorName: item.storeName || item.vendorName || 'Unknown vendor',
        products: [],
      };
      group.products.push(item.productName || item.name || `Product ${item.productId}`);
      groups.set(vendorId, group);
    });

    return [...groups.values()]
      .map((group) => `${group.vendorName}: ${group.products.join(', ')}`)
      .join(' | ');
  };

  const getCheckoutErrorMessage = (error) => {
    const message = getFriendlyErrorMessage(error, 'We could not place your order. Please check your details and try again.');
    const vendorIssue = /vendor|supplier|product|stock|unavailable|insufficient/i.test(message);
    if (!vendorIssue) return message;

    const details = buildVendorProblemDetails();
    return details
      ? `${message}. Please review these vendor items: ${details}.`
      : message;
  };

  const handleZoneSelect = async (zoneId) => {
    // Find the zone object
    const zone = await deliveryService.getAllZones().then((zones) =>
      zones.map((value) => adaptEntityFromNamedSource('adaptDeliveryZoneResponse', value))
        .find((value) => value.id === zoneId)
    );
    
    setSelectedZone(zone);
    
    if (!zone) {
      return;
    }
    
    // Get unique vendor IDs from cart items
    const vendorIds = [...new Set((cart?.items || []).map(item => item.supplierId).filter(Boolean))];
    
    // Build vendor names map from cart items
    const names = {};
    (cart?.items || []).forEach(item => {
      if (item.supplierId && item.storeName) {
        names[item.supplierId] = item.storeName;
      }
    });
    setVendorNames(names);
    
    if (vendorIds.length > 0) {
      try {
        // Calculate delivery cost per vendor and build breakdown
        let totalCost = '0';
        const breakdown = {};
        
        for (const vendorId of vendorIds) {
          const cost = await deliveryService.getDeliveryCost(vendorId, zoneId);
          totalCost = addDecimals(totalCost, cost);
          breakdown[vendorId] = cost;
        }
        
        setDeliveryCost(totalCost);
        setDeliveryCostBreakdown(breakdown);
      } catch (error) {
        toast.error(getCheckoutErrorMessage(error?.message ? error : new Error('Failed to calculate delivery cost for a vendor or product')), { duration: 7000 });
        setDeliveryCost(0);
        setDeliveryCostBreakdown({});
        setVendorNames({});
      }
    } else {
      // No vendor IDs available, set default or zero
      setDeliveryCost(0);
      setDeliveryCostBreakdown({});
      setVendorNames({});
    }
  };

  const handleSelectAddress = (addr) => {
    setFormData({
      ...formData,
      address: addr.street,
      district: addr.city
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedZone) {
      toast.error('Please select a delivery zone');
      return;
    }
    const phoneError = getEgyptianPhoneError(formData.phone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    if (formData.paymentMethod === 'INSTAPAY' && !instapayPhone) {
      toast.error('Instapay is temporarily unavailable. Please choose another payment method.');
      return;
    }
    const refundDetails = normalizeInstapayRefundDetails(
      formData.instapayRefundPhoneNumber,
      formData.instapayRefundName,
    );
    if (formData.paymentMethod === 'INSTAPAY') {
      const refundError = getInstapayRefundDetailsError(refundDetails.phoneNumber, refundDetails.name);
      if (refundError) {
        toast.error(refundError);
        return;
      }
    }
    
    setLoading(true);

    try {
      if (user) {
        const draft = mapCartToOrderDraft(cart, {
          customerId: user.id,
          customerName: formData.fullName,
          customerEmail: formData.email || selfEmail,
          shippingAddress: `${formData.address}, ${selectedZone.zoneName}, Alexandria`,
          deliveryZoneId: selectedZone.id,
          paymentMethod: formData.paymentMethod,
          instapayPhoneNumber: formData.paymentMethod === 'INSTAPAY' ? instapayPhone : null,
          instapayRefundPhoneNumber: formData.paymentMethod === 'INSTAPAY' ? refundDetails.phoneNumber : null,
          instapayRefundName: formData.paymentMethod === 'INSTAPAY' ? refundDetails.name : null
        });
        const mapped = commandDraftToPayload('checkout', draft);
        if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);

        const createdOrder = await orderService.placeOrder(mapped.payload);
        await clearCart(user.id);
        toast.success('Order placed successfully! You have 15 minutes to change payment or cancel.');
        navigate(`/orders/${createdOrder.id}`);
        return;
      } else {
        const nameParts = formData.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        const draft = mapCartToOrderDraft(cart, {
          guestInfo: {
            firstName,
            lastName,
            email: formData.email,
            phone: formData.phone,
            shippingAddress: `${formData.address}, ${selectedZone.zoneName}, Alexandria`
          },
          deliveryZoneId: selectedZone.id,
          paymentMethod: formData.paymentMethod,
          instapayPhoneNumber: formData.paymentMethod === 'INSTAPAY' ? instapayPhone : null,
          instapayRefundPhoneNumber: formData.paymentMethod === 'INSTAPAY' ? refundDetails.phoneNumber : null,
          instapayRefundName: formData.paymentMethod === 'INSTAPAY' ? refundDetails.name : null
        });
        const mapped = commandDraftToPayload('checkout', draft);
        if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);

        const createdOrder = await orderService.placeGuestOrder(mapped.payload);
        await clearCart();
        rememberGuestOrder({
          orderId: createdOrder.id,
          email: formData.email,
          phone: formData.phone,
          placedAt: createdOrder.placedAt,
          status: createdOrder.status,
          totalAmount: createdOrder.totalAmount,
          paymentMethod: createdOrder.paymentMethod,
          items: createdOrder.items,
        });
        toast.success('Order placed successfully! You can find it in Order History.');
        navigate(`/orders/${createdOrder.id}`);
        return;
      }
      
      toast.success('Order placed successfully!');
      navigate('/');
    } catch (error) {
      toast.error(getCheckoutErrorMessage(error), { duration: 7000 });
    } finally {
      setLoading(false);
    }
  };

  const total = sumOrderAmounts([getCartTotal(), deliveryCost]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 py-10 sm:px-6 md:px-12 md:py-12 flex-grow">
        <div className="mb-12">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Secure Checkout</h1>
          <p className="font-body-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm fill">lock</span>
            Your information is encrypted and safe with Giftastic.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-start">
            {/* Shipping & Payment */}
            <div className="lg:col-span-8 space-y-12">
              {/* Shipping Address */}
              <section className="bg-surface-container-lowest p-4 rounded-xl shadow-plum sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">1</span>
                    <h2 className="font-headline-md text-headline-md text-primary">Contact & Shipping</h2>
                  </div>
                </div>

                {user && savedAddresses.length > 0 && (
                  <div className="mb-8">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3 ml-1">Use a saved address</p>
                    <div className="flex flex-wrap gap-3">
                      {savedAddresses.map((addr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectAddress(addr)}
                          className="px-4 py-2 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-xs font-medium"
                        >
                          {addr.label || 'Home'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1">Full Name</label>
                    <input 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all hover:border-primary/50" 
                      placeholder="Recipient's Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1">Email Address</label>
                    <input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required={!user}
                      className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all hover:border-primary/50" 
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1">Phone Number</label>
                    <input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all hover:border-primary/50" 
                      placeholder="+20 1XX XXX XXXX"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1">Street Address</label>
                    <input 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all hover:border-primary/50" 
                      placeholder="Building name, street, floor"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1">Delivery Zone</label>
                    <ZoneSelector 
                      selectedZoneId={selectedZone?.id}
                      onZoneSelect={handleZoneSelect}
                    />
                    {selectedZone && Object.keys(deliveryCostBreakdown).length > 0 && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs font-semibold text-primary mb-2">
                          Delivery Cost Breakdown for {selectedZone.zoneName}:
                        </p>
                        {Object.entries(deliveryCostBreakdown).map(([vendorId, cost]) => {
                          // Find vendor name from cart items
                          const vendorItems = cart?.items?.filter(item => item.supplierId === vendorId) || [];
                          const vendorName = vendorNames[vendorId] || 'Vendor';
                          const itemCount = vendorItems.length;
                          return (
                            <div key={vendorId} className="flex justify-between text-xs text-secondary mb-1">
                              <span>{vendorName} ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                              <span className={`font-bold ${cost === 0 ? 'text-tertiary' : ''}`}>
                                {formatOrderDeliveryCost(cost, 'Free delivery') || 'Unavailable'}
                              </span>
                            </div>
                          );
                        })}
                        <div className="border-t border-primary/20 mt-2 pt-2 flex justify-between text-sm font-bold text-primary">
                          <span>Total Delivery</span>
                          <span>{formatOrderDeliveryCost(deliveryCost) || 'Unavailable'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-surface-container-lowest p-4 rounded-xl shadow-plum sm:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">2</span>
                  <h2 className="font-headline-md text-headline-md text-primary">Payment Method</h2>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === 'COD'}
                      onChange={handleChange}
                      className="text-primary focus:ring-primary w-5 h-5"
                    />
                    <div className="ml-4 flex-1">
                      <span className="font-label-md text-on-surface">Cash on Delivery</span>
                      <p className="text-xs text-on-surface-variant mt-1">Pay when you receive your order</p>
                    </div>
                  </label>

                  {instapayPhone && <label className="flex items-center p-4 border border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      value="INSTAPAY"
                      checked={formData.paymentMethod === 'INSTAPAY'}
                      onChange={handleChange}
                      className="text-primary focus:ring-primary w-5 h-5"
                    />
                    <div className="ml-4 flex-1">
                      <span className="font-label-md text-on-surface">Instapay</span>
                      <p className="text-xs text-on-surface-variant mt-1">Transfer after checkout and enter up to four transaction IDs</p>
                    </div>
                  </label>}

                  {formData.paymentMethod === 'INSTAPAY' && (
                    <div className="mt-4 p-4 bg-secondary-container/10 border border-secondary rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-xl">info</span>
                        <div className="flex-1">
                          <p className="font-label-md text-on-surface mb-2">
                            After placing your order, transfer the full total and enter your transaction IDs on the order page.
                          </p>
                          <p className="text-xs text-on-surface-variant mb-3">
                            Send payment to: <span className="font-bold text-secondary">{instapayPhone}</span>
                          </p>
                          <div className="mb-3 grid gap-3 sm:grid-cols-2">
                            <input
                              name="instapayRefundPhoneNumber"
                              value={formData.instapayRefundPhoneNumber}
                              onChange={handleChange}
                              required
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="Refund phone number"
                              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                            />
                            <input
                              name="instapayRefundName"
                              value={formData.instapayRefundName}
                              onChange={handleChange}
                              required
                              placeholder="Refund account full name"
                              className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>Quick and secure payment confirmation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 sticky top-28">
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-plum border border-surface-container-high sm:p-8">
                <h2 className="font-headline-md text-headline-md text-primary mb-6">Order Summary</h2>
                <div className="border-t border-outline-variant/30 py-4 space-y-3">
                  <div className="flex justify-between text-on-surface-variant font-body-md">
                    <span>Subtotal</span>
                    <span>{formatOrderMoney(getCartTotal()) || 'Unavailable'}</span>
                  </div>
                  
                  {/* Delivery Cost Breakdown */}
                  {selectedZone && Object.keys(deliveryCostBreakdown).length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-on-surface-variant font-body-md font-semibold">Delivery:</div>
                      {Object.entries(deliveryCostBreakdown).map(([vendorId, cost]) => {
                        const vendorItems = cart?.items?.filter(item => item.supplierId === vendorId) || [];
                        const vendorName = vendorNames[vendorId] || 'Vendor';
                        const itemCount = vendorItems.length;
                        return (
                          <div key={vendorId} className="flex justify-between text-sm text-secondary pl-4">
                            <span>{vendorName} ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                            <span className={cost === 0 ? 'text-tertiary' : ''}>{formatOrderDeliveryCost(cost) || 'Unavailable'}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-on-surface-variant font-body-md font-semibold pl-4 pt-1 border-t border-outline-variant/20">
                        <span>Total Shipping</span>
                        <span>{formatOrderDeliveryCost(deliveryCost) || 'Unavailable'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-on-surface-variant font-body-md">
                      <span>Shipping</span>
                      <span className="text-secondary text-sm">Select zone</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-primary/20 pt-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="font-headline-md text-primary">Total</span>
                    <span className="font-headline-md text-primary">{formatOrderMoney(total) || 'Unavailable'}</span>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
