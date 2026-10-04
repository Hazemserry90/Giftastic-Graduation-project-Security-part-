import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrderModal from '../components/modals/OrderModal';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';
import { buildOrderAccess, ORDER_CONTEXT } from '../ui/entities/order';
import { getOrderPaymentWindowState, isOrderPendingConfirmation } from '../ui/entities/order/orderSelectors';
import InstapayPaymentConversation from '../ui/entities/order/InstapayPaymentConversation';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { buildUserAccess, getReadableUserField, USER_CONTEXT } from '../ui/entities/user';
import { getGuestOrderRecord, rememberGuestOrder } from '../utils/guestOrders';
import {
  getFullNameError,
  getInstapayRefundDetailsError,
  getStrictEgyptianPhoneError,
  normalizeFullName,
  normalizeInstapayRefundDetails,
  sanitizeDigitsOnly,
  sanitizeFullName,
} from '../utils/contactValidation';

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const viewer = useAuthStore((state) => state.viewer);
  const user = useAuthStore((state) => state.user);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [transactionIds, setTransactionIds] = useState(['']);
  const [instapayRefundDetails, setInstapayRefundDetails] = useState({ phoneNumber: '', name: '' });
  const [paymentMethodDraft, setPaymentMethodDraft] = useState(null);
  const [guestRecord, setGuestRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, user?.id]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrder = async () => {
    try {
      const savedGuestRecord = user ? null : getGuestOrderRecord(orderId);
      if (!user && !savedGuestRecord) {
        setGuestRecord(null);
        throw new Error('Guest order not found in this browser.');
      }

      const data = user
        ? await orderService.getOrderById(orderId)
        : await orderService.trackGuestOrder(orderId, savedGuestRecord.email, savedGuestRecord.phone);
      if (!user) {
        rememberGuestOrder({
          orderId: data.id,
          email: savedGuestRecord.email,
          phone: savedGuestRecord.phone,
          placedAt: data.placedAt,
          status: data.status,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          items: data.items,
        });
      }
      const model = adaptEntityFromNamedSource('adaptOrderDomain', data);
      setOrder(model);
      setTransactionIds(['']);
      setGuestRecord(savedGuestRecord);
      setPaymentMethodDraft(null);
      let savedRefundPhone = '';
      let savedRefundName = '';
      if (user?.id === model.customerId) {
        try {
          const rawProfile = await userService.getMyProfile();
          const profile = adaptEntityFromNamedSource('adaptUserMe', rawProfile);
          const access = buildUserAccess({ user: profile, viewer, context: USER_CONTEXT.EDIT });
          const profileRefundPhone = getReadableUserField(profile, 'instapayRefundPhoneNumber', access.fields.instapayRefundPhoneNumber).value || '';
          const profileRefundName = getReadableUserField(profile, 'instapayRefundName', access.fields.instapayRefundName).value || '';
          savedRefundPhone = getStrictEgyptianPhoneError(profileRefundPhone, 'Refund phone number') ? '' : sanitizeDigitsOnly(profileRefundPhone);
          savedRefundName = getFullNameError(profileRefundName, 'Refund name') ? '' : normalizeFullName(profileRefundName);
        } catch {
          savedRefundPhone = '';
          savedRefundName = '';
        }
      }
      const orderRefundPhone = model.instapayRefundPhoneNumber || savedRefundPhone;
      const orderRefundName = model.instapayRefundName || savedRefundName;
      setInstapayRefundDetails({
        phoneNumber: sanitizeDigitsOnly(orderRefundPhone),
        name: getFullNameError(orderRefundName, 'Refund name') ? '' : normalizeFullName(orderRefundName),
      });
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError(user
        ? 'Could not find this order or you do not have permission to view it.'
        : 'This guest order is not saved in this browser, or the saved guest details no longer match.');
    } finally {
      setLoading(false);
    }
  };

  const { open: paymentWindowOpen, secondsLeft } = getOrderPaymentWindowState(order, now);
  const isRegisteredCustomer = Boolean(user?.id && order?.customerId === user.id);
  const isGuestCustomer = Boolean(!user && guestRecord && order && !order.customerId);
  const canUseCustomerPaymentFlow = isRegisteredCustomer || isGuestCustomer;
  const showInstapayRefundFields = paymentWindowOpen
    && isRegisteredCustomer
    && (order?.paymentMethod === 'INSTAPAY' || paymentMethodDraft === 'INSTAPAY');

  const updateInstapayRefundPhone = (value) => {
    setInstapayRefundDetails((current) => ({ ...current, phoneNumber: sanitizeDigitsOnly(value) }));
  };

  const updateInstapayRefundName = (value) => {
    setInstapayRefundDetails((current) => ({ ...current, name: sanitizeFullName(value) }));
  };

  const changePaymentMethod = async (paymentMethod) => {
    if (!user?.id) return;
    if (paymentMethod === 'INSTAPAY') {
      setPaymentMethodDraft('INSTAPAY');
    }
    const refundDetails = normalizeInstapayRefundDetails(
      instapayRefundDetails.phoneNumber,
      instapayRefundDetails.name,
    );
    if (paymentMethod === 'INSTAPAY') {
      const refundError = getInstapayRefundDetailsError(refundDetails.phoneNumber, refundDetails.name);
      if (refundError) {
        setActionError(refundError);
        return;
      }
    }
    try {
      setSaving(true);
      await orderService.changePaymentMethod(order.id, user.id, paymentMethod,
        paymentMethod === 'INSTAPAY' ? order.instapayPhoneNumber : null,
        paymentMethod === 'INSTAPAY' ? refundDetails.phoneNumber : null,
        paymentMethod === 'INSTAPAY' ? refundDetails.name : null);
      await fetchOrder();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not change the payment method.');
    } finally { setSaving(false); }
  };

  const cancelOrder = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      await orderService.cancelOrder(order.id, user.id);
      navigate('/orders');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not cancel the order.');
    } finally { setSaving(false); }
  };

  const submitTransactions = async () => {
    const ids = transactionIds.map((value) => value.trim()).filter(Boolean);
    if (!ids.length) { setActionError('Enter at least one transaction ID.'); return; }
    if (ids.length > remainingInstapayTransactionSlots) {
      setActionError(`Enter no more than ${remainingInstapayTransactionSlots} new transaction ID${remainingInstapayTransactionSlots === 1 ? '' : 's'}.`);
      return;
    }
    try {
      setSaving(true);
      if (isGuestCustomer) {
        await orderService.submitGuestInstapayTransactions(order.id, guestRecord.email, guestRecord.phone, ids);
      } else {
        await orderService.submitInstapayTransactions(order.id, user.id, ids);
      }
      await fetchOrder();
      setActionError('');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not save transaction IDs.');
    } finally { setSaving(false); }
  };

  const submittedInstapayTransactionCount = order?.instapayTransactionIds?.length || 0;
  const hasSubmittedInstapayTransactions = submittedInstapayTransactionCount > 0;
  const remainingInstapayTransactionSlots = Math.max(0, 4 - submittedInstapayTransactionCount);

  const updateTransactionId = (index, value) => {
    setTransactionIds((current) => current.map((item, i) => i === index ? value : item));
  };

  const addTransactionField = () => {
    setTransactionIds((current) => current.length >= remainingInstapayTransactionSlots ? current : [...current, '']);
  };

  const removeTransactionField = (index) => {
    setTransactionIds((current) => current.length <= 1 ? current : current.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
          <h2 className="font-headline-lg text-primary mb-2">Oops!</h2>
          <p className="text-on-surface-variant max-w-md mb-8">{error || 'Order not found.'}</p>
          <Link to="/orders" className="bg-primary text-white px-8 py-3 rounded-lg font-label-md">
            Back to My Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 md:px-12 py-12 flex-grow w-full">
        <header className="mb-8">
          <Link to="/orders" className="text-secondary font-label-sm flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to History
          </Link>
        </header>

        {isOrderPendingConfirmation(order) && canUseCustomerPaymentFlow && (
          <section className="mb-8 rounded-xl border border-primary/20 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary">Payment confirmation</h2>
            {actionError && <p className="mt-2 text-sm text-red-700">{actionError}</p>}
            <p className="mt-2 text-sm text-on-surface-variant">
              Payment method: <strong>{order.paymentMethod}</strong>
              {paymentWindowOpen && isRegisteredCustomer && ` - Change or cancel available for ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
            </p>
            {paymentWindowOpen && isRegisteredCustomer && <div className="mt-4 flex flex-wrap gap-3">
              {['COD', 'INSTAPAY'].map((method) => <button key={method} disabled={saving || order.paymentMethod === method}
                onClick={() => changePaymentMethod(method)}
                className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary disabled:opacity-40">
                Use {method}
              </button>)}
              <button disabled={saving} onClick={cancelOrder}
                className="rounded-lg border border-red-600 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-40">
                Cancel order
              </button>
            </div>}
            {paymentWindowOpen && isGuestCustomer && (
              <p className="mt-3 text-sm text-on-surface-variant">
                This guest order is saved in your Order History for this browser.
              </p>
            )}
            {showInstapayRefundFields && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={instapayRefundDetails.phoneNumber}
                  onChange={(event) => updateInstapayRefundPhone(event.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Instapay refund phone"
                  className="rounded-lg border p-3"
                />
                <input
                  value={instapayRefundDetails.name}
                  onChange={(event) => updateInstapayRefundName(event.target.value)}
                  placeholder="Refund account full name"
                  className="rounded-lg border p-3"
                />
              </div>
            )}
            {order.paymentMethod === 'INSTAPAY' && <div className="mt-6">
              <p className="font-semibold">Send {order.totalAmount} EGP to {order.instapayPhoneNumber || 'the configured Instapay number'}.</p>
              <div className="mt-4">
                <InstapayPaymentConversation order={order} />
              </div>
              {hasSubmittedInstapayTransactions && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Submitted transaction IDs are locked.</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-900">
                    {order.instapayTransactionIds.map((idValue) => <li key={idValue}>{idValue}</li>)}
                  </ul>
                </div>
              )}
              {remainingInstapayTransactionSlots > 0 ? (
                <>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    Enter a new transaction ID. You can submit up to {remainingInstapayTransactionSlots} more, for a maximum of four total.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {transactionIds.map((value, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          value={value}
                          onChange={(event) => updateTransactionId(index, event.target.value)}
                          placeholder={`Transaction ID ${index + 1}`}
                          className="min-w-0 flex-1 rounded-lg border p-3"
                        />
                        {transactionIds.length > 1 && (
                          <button type="button" onClick={() => removeTransactionField(index)} className="rounded-lg border border-red-200 px-3 text-red-700">
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {transactionIds.length < remainingInstapayTransactionSlots && (
                      <button type="button" onClick={addTransactionField} className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary">
                        Add another transaction
                      </button>
                    )}
                    <button disabled={saving} onClick={submitTransactions}
                      className="rounded-lg bg-primary px-5 py-2 text-white disabled:opacity-50">Submit transaction IDs</button>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">Maximum of four transaction IDs has been reached.</p>
              )}
            </div>}
          </section>
        )}

        <OrderModal
          entity={order}
          access={buildOrderAccess({
            order,
            viewer,
            context: ORDER_CONTEXT.CUSTOMER,
            relationship: isGuestCustomer ? { isGuestSessionAuthorized: true } : {},
          })}
        />
      </main>

      <Footer />
    </div>
  );
}

