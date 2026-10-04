import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrderModal from '../components/modals/OrderModal';
import { orderService } from '../services/orderService';
import { getFriendlyErrorMessage } from '../services/api';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { buildOrderAccess, ORDER_CONTEXT } from '../ui/entities/order';
import { createViewer } from '../ui/entities/shared/viewer';

function readSavedTracking(orderId) {
  try {
    const saved = JSON.parse(sessionStorage.getItem('giftastic_guest_order_tracking') || '{}');
    return saved?.orderId === orderId ? saved : {};
  } catch {
    sessionStorage.removeItem('giftastic_guest_order_tracking');
    return {};
  }
}

export default function GuestOrderTracking() {
  const { orderId = '' } = useParams();
  const saved = readSavedTracking(orderId);
  const [formData, setFormData] = useState({
    orderReference: orderId,
    email: saved.email || '',
    phone: saved.phone || '',
  });
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactionIds, setTransactionIds] = useState(['']);
  const viewer = createViewer();

  const loadOrder = async (event) => {
    event?.preventDefault();
    if (!formData.orderReference.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Enter your order reference, email, and phone number to track the order.');
      return;
    }
    setLoading(true);
    try {
      const data = await orderService.trackGuestOrder(
        formData.orderReference.trim(),
        formData.email.trim(),
        formData.phone.trim(),
      );
      setOrder(adaptEntityFromNamedSource('adaptOrderDomain', data));
      setTransactionIds(['']);
      sessionStorage.setItem('giftastic_guest_order_tracking', JSON.stringify({
        orderId: formData.orderReference.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      }));
    } catch (error) {
      setOrder(null);
      const message = error?.response?.status === 403
        ? 'Those guest order details do not match. Check the order reference, email, and phone number.'
        : getFriendlyErrorMessage(error, 'We could not find an order matching those guest details.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId && saved.email && saved.phone) {
      void loadOrder();
    }
  }, [orderId]);

  const submitTransactions = async () => {
    const ids = transactionIds.map((value) => value.trim()).filter(Boolean);
    if (!ids.length) {
      toast.error('Enter at least one Instapay transaction ID.');
      return;
    }
    if (ids.length > remainingInstapayTransactionSlots) {
      toast.error(`Enter no more than ${remainingInstapayTransactionSlots} new Instapay transaction ID${remainingInstapayTransactionSlots === 1 ? '' : 's'}.`);
      return;
    }
    setLoading(true);
    try {
      await orderService.submitGuestInstapayTransactions(
        formData.orderReference.trim(),
        formData.email.trim(),
        formData.phone.trim(),
        ids,
      );
      toast.success('Transaction IDs saved. Your payment is pending admin review.');
      setTransactionIds(['']);
      await loadOrder();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not save those transaction IDs. Please check them and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const access = order ? buildOrderAccess({
    order,
    viewer,
    context: ORDER_CONTEXT.CUSTOMER,
    relationship: { isGuestSessionAuthorized: true },
  }) : null;
  const submittedInstapayTransactionCount = order?.instapayTransactionIds?.length || 0;
  const hasSubmittedInstapayTransactions = submittedInstapayTransactionCount > 0;
  const remainingInstapayTransactionSlots = Math.max(0, 4 - submittedInstapayTransactionCount);

  const updateTransactionId = (index, value) => {
    setTransactionIds((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  };

  const addTransactionField = () => {
    setTransactionIds((current) => current.length >= remainingInstapayTransactionSlots ? current : [...current, '']);
  };

  const removeTransactionField = (index) => {
    setTransactionIds((current) => current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-display-xl text-headline-lg text-primary">Track guest order</h1>
          <p className="mt-2 text-on-surface-variant">
            Use the order reference plus the same email and phone number used at checkout.
          </p>
        </header>

        <form onSubmit={loadOrder} className="mb-8 grid gap-3 rounded-2xl border border-outline-variant bg-white p-4 shadow-sm sm:grid-cols-3">
          <input
            value={formData.orderReference}
            onChange={(event) => setFormData((current) => ({ ...current, orderReference: event.target.value }))}
            placeholder="Order reference"
            className="rounded-lg border border-outline-variant px-3 py-2"
            required
          />
          <input
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            placeholder="Guest email"
            className="rounded-lg border border-outline-variant px-3 py-2"
            required
          />
          <input
            value={formData.phone}
            onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
            placeholder="Guest phone"
            className="rounded-lg border border-outline-variant px-3 py-2"
            required
          />
          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 font-bold text-white disabled:opacity-50 sm:col-span-3">
            {loading ? 'Checking...' : 'Track order'}
          </button>
        </form>

        {order && (
          <div className="space-y-6">
            {order.paymentMethod === 'INSTAPAY' && order.status === 'PENDING_CONFIRMATION' && (
              <section className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-primary">Instapay payment confirmation</h2>
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
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Enter a new transaction ID after transferring the payment. You may submit up to {remainingInstapayTransactionSlots} more, for a maximum of four total.
                    </p>
                    <div className="mt-4 grid gap-2">
                      {transactionIds.map((value, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            value={value}
                            onChange={(event) => updateTransactionId(index, event.target.value)}
                            placeholder={`Transaction ID ${index + 1}`}
                            className="min-w-0 flex-1 rounded-lg border border-outline-variant px-3 py-2"
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
                      <button type="button" disabled={loading} onClick={submitTransactions} className="rounded-lg bg-primary px-5 py-2 font-bold text-white disabled:opacity-50">
                        Submit transaction IDs
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-on-surface-variant">Maximum of four transaction IDs has been reached.</p>
                )}
              </section>
            )}
            <OrderModal entity={order} access={access} />
          </div>
        )}

        {!order && (
          <div className="rounded-2xl border border-outline-variant bg-white p-8 text-center">
            <p className="text-on-surface-variant">Enter your guest order details to view the latest status.</p>
            <Link to="/products" className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2 font-bold text-white">Continue shopping</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
