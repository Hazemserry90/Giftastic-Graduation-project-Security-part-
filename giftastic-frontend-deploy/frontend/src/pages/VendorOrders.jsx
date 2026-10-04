import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorSidebar from '../components/VendorSidebar';
import { orderService } from '../services/orderService';
import { getFriendlyErrorMessage } from '../services/api';
import commissionService from '../services/commissionService';
import { useAuthStore } from '../store/useAuthStore';
import OrderModal from '../components/modals/OrderModal';
import UserModal from '../components/modals/UserModal';
import { buildUserAccess, USER_CONTEXT } from '../ui/entities/user';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { patchEntityModel } from '../ui/entities/shared';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';
import {
  buildOrderAssistanceAccess,
  buildOrderAssistanceActions,
  getOrderAssistanceMessages,
  ORDER_ASSISTANCE_CONTEXT,
} from '../ui/entities/orderAssistance';
import {
  buildOrderAccess,
  getOrderStatusLabel,
  formatOrderMoney,
  getOrderStatusOptions,
  getOrderVisibleTotal,
  sumVisibleOrderTotals,
  VendorOrderRow,
  ORDER_CONTEXT,
} from '../ui/entities/order';

export default function VendorOrders() {
  const viewer = useAuthStore((state) => state.viewer);
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [assistanceLoading, setAssistanceLoading] = useState(true);
  const [assistanceMessage, setAssistanceMessage] = useState('');
  const [assistanceSubmitting, setAssistanceSubmitting] = useState(false);
  const [assistanceReplies, setAssistanceReplies] = useState({});
  const [assistanceReplyLoading, setAssistanceReplyLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchOrders();
    fetchAssistanceRequests();
  }, []);

  const focusedOrderId = searchParams.get('orderId');

  const adaptVendorOrder = (order) => adaptEntityFromNamedSource('adaptOrderVendorListRecord', {
    ...order,
    status: order.vendorStatuses?.[viewer?.supplierId] || order.status,
  });

  useEffect(() => {
    if (loading || !focusedOrderId || selectedOrder?.id === focusedOrderId) return;
    const focusedOrder = orders.find((order) => order.id === focusedOrderId);
    if (focusedOrder) setSelectedOrder(focusedOrder);
  }, [focusedOrderId, loading, orders, selectedOrder?.id]);

  const loadVendorOrders = async () => {
    const response = await orderService.getVendorOrders();
    return (response.content || []).map(adaptVendorOrder);
  };

  const fetchOrders = async () => {
    try {
      setOrders(await loadVendorOrders());
    } catch (error) {
      showNotification(getFriendlyErrorMessage(error, 'We could not load your orders. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistanceRequests = async () => {
    try {
      const response = await commissionService.getVendorAssistanceRequests();
      setAssistanceRequests((Array.isArray(response) ? response : [])
        .map((request) => adaptEntityFromNamedSource('adaptOrderAssistanceDto', request)));
    } catch (error) {
      showNotification(getFriendlyErrorMessage(error, 'We could not load assistance requests. Please try again.'), 'error');
    } finally {
      setAssistanceLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const closeSelectedOrder = () => {
    setSelectedOrder(null);
    if (!focusedOrderId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('orderId');
    setSearchParams(nextParams, { replace: true });
  };

  const handleRequestAssistance = async () => {
    if (!selectedOrder) return;

    const mapped = commandDraftToPayload('assistanceMessage', createCommandDraft('assistanceMessage', { mode: 'REQUEST', message: assistanceMessage }));
    if (!mapped.ok) { showNotification(mapped.errors.message, 'error'); return; }

    try {
      setAssistanceSubmitting(true);
      const request = await commissionService.requestOrderAssistance(
        selectedOrder.id,
        mapped.payload.message
      );
      setAssistanceRequests((current) => [
        adaptEntityFromNamedSource('adaptOrderAssistanceDto', request),
        ...current,
      ]);
      setAssistanceMessage('');
      showNotification('Assistance request sent.', 'success');
    } catch (error) {
      showNotification(getFriendlyErrorMessage(error, 'We could not send the assistance request. Please try again.'), 'error');
    } finally {
      setAssistanceSubmitting(false);
    }
  };

  const handleReplyAssistance = async (requestId) => {
    const message = assistanceReplies[requestId] || '';
    const mapped = commandDraftToPayload('assistanceMessage', createCommandDraft('assistanceMessage', { mode: 'REPLY', message }));
    if (!mapped.ok) { showNotification(mapped.errors.message, 'error'); return; }

    try {
      setAssistanceReplyLoading(true);
      const updated = await commissionService.addVendorAssistanceMessage(requestId, mapped.payload.message);
      setAssistanceRequests((current) => current.map((r) =>
        r.id === updated.id ? adaptEntityFromNamedSource('adaptOrderAssistanceDto', updated) : r));
      setAssistanceReplies((current) => ({ ...current, [requestId]: '' }));
      showNotification('Message sent.', 'success');
    } catch (error) {
      showNotification(getFriendlyErrorMessage(error, 'We could not send this reply. Please try again.'), 'error');
    } finally {
      setAssistanceReplyLoading(false);
    }
  };

  const handleResolutionFeedback = async (requestId, resolved) => {
    const message = assistanceReplies[requestId] || '';
    const mapped = commandDraftToPayload('assistanceMessage', createCommandDraft('assistanceMessage', { mode: 'RESOLUTION', message, resolved }));
    if (!mapped.ok) { showNotification(Object.values(mapped.errors)[0], 'error'); return; }
    try {
      setAssistanceReplyLoading(true);
      const updated = await commissionService.confirmVendorAssistanceResolution(
        requestId,
        mapped.payload.resolved,
        mapped.payload.message || null
      );
      setAssistanceRequests((current) => current.map((r) =>
        r.id === updated.id ? adaptEntityFromNamedSource('adaptOrderAssistanceDto', updated) : r));
      if (resolved) {
        setAssistanceReplies((current) => ({ ...current, [requestId]: '' }));
      }
      showNotification(resolved ? 'Request closed.' : 'Request reopened with your feedback.', 'success');
    } catch (error) {
      showNotification(getFriendlyErrorMessage(error, 'We could not update this request. Please try again.'), 'error');
    } finally {
      setAssistanceReplyLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      await orderService.updateVendorStatus(orderId, newStatus);
      const refreshedOrders = await loadVendorOrders();
      setOrders(refreshedOrders);
      const refreshedOrder = refreshedOrders.find((order) => order.id === orderId);
      const patchFallback = (order) => patchEntityModel(order, {
        status: newStatus,
        vendorStatuses: {
          ...(order.vendorStatuses || {}),
          [viewer?.supplierId]: newStatus,
        },
      });
      setSelectedOrder((current) => (
        current?.id === orderId ? (refreshedOrder || patchFallback(current)) : current
      ));
      showNotification(`Order status updated to ${getOrderStatusLabel(newStatus)}`, 'success');
    } catch (error) {
      showNotification(getFriendlyErrorMessage(error, 'We could not update this order status. Please try again.'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getAccess = (order) => buildOrderAccess({
    order,
    viewer,
    context: ORDER_CONTEXT.VENDOR,
  });

  const matchesDateFilter = (order) => {
    if (!dateFilter.start && !dateFilter.end) return true;
    const placedAt = Date.parse(order.placedAt);
    if (!Number.isFinite(placedAt)) return false;
    const start = dateFilter.start ? Date.parse(`${dateFilter.start}T00:00:00`) : null;
    const end = dateFilter.end ? Date.parse(`${dateFilter.end}T23:59:59.999`) : null;
    return (start === null || placedAt >= start) && (end === null || placedAt <= end);
  };

  const filteredOrders = orders.filter(matchesDateFilter);

  const getAssistanceForOrder = (orderId) => {
    return assistanceRequests.filter((request) => request.orderId === orderId);
  };

  const getAssistanceAccessMap = (requests) => new Map(requests.map((request) => [
    request.id,
    buildOrderAssistanceAccess({
      request,
      viewer,
      context: ORDER_ASSISTANCE_CONTEXT.VENDOR,
    }),
  ]));
  const getAssistanceActionsMap = (requests) => {
    const accessMap = getAssistanceAccessMap(requests);
    return new Map(requests.map((request) => [request.id, buildOrderAssistanceActions({
      request,
      access: accessMap.get(request.id),
      handlers: {
        reply: () => handleReplyAssistance(request.id),
        reopen: () => handleResolutionFeedback(request.id, false),
        close: () => handleResolutionFeedback(request.id, true),
      },
    })]));
  };
  const getAssistanceMessagesMap = (requests) => new Map(requests.map((request) => [
    request.id,
    getOrderAssistanceMessages(request),
  ]));

  const buildCustomerUser = (order) => adaptEntityFromNamedSource('adaptUserOrderCustomerSnapshot', {
    id: order.customerId,
    fullName: order.customerName,
    email: order.customerEmail,
    phoneNumber: order.customerPhone || order.guestInfo?.phone,
  });

  const getCustomerAccess = (customer) => buildUserAccess({
    user: customer,
    viewer,
    context: USER_CONTEXT.ORDER_VENDOR,
    relationship: { isParticipatingVendor: true },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="flex min-w-0 flex-col md:flex-row">
        <VendorSidebar />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-12">
          <header className="mb-8 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-display-xl text-display-xl text-primary mb-2">Boutique Orders</h1>
              <p className="text-on-surface-variant font-body-lg">Track and manage sales from your boutique.</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">Total Sales Volume</p>
              <p className="font-display-sm text-primary">
                {formatOrderMoney(sumVisibleOrderTotals(filteredOrders, getAccess))}
              </p>
            </div>
          </header>

          {notification && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${
              notification.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {notification.message}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-plum border border-surface-variant/30 overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-outline-variant/30 bg-surface-container-lowest px-8 py-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="font-headline-md text-primary">Filter orders by date</h2>
                  <p className="text-sm text-on-surface-variant">Use the order placed date.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="text-sm font-semibold text-on-surface-variant">
                    From
                    <input
                      type="date"
                      value={dateFilter.start}
                      onChange={(event) => setDateFilter((current) => ({ ...current, start: event.target.value }))}
                      className="mt-1 block rounded-lg border border-outline-variant px-3 py-2 text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="text-sm font-semibold text-on-surface-variant">
                    To
                    <input
                      type="date"
                      value={dateFilter.end}
                      onChange={(event) => setDateFilter((current) => ({ ...current, end: event.target.value }))}
                      className="mt-1 block rounded-lg border border-outline-variant px-3 py-2 text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  {(dateFilter.start || dateFilter.end) && (
                    <button
                      type="button"
                      onClick={() => setDateFilter({ start: '', end: '' })}
                      className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                  <tr>
                    <th className="px-8 py-5 text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em]">Order</th>
                    <th className="px-8 py-5 text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em]">Customer</th>
                    <th className="px-8 py-5 text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em] text-right">Value</th>
                    <th className="px-8 py-5 text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredOrders.map((order) => {
                    const access = getAccess(order);
                    const customer = buildCustomerUser(order);
                    return (
                      <VendorOrderRow
                        key={order.id}
                        order={order}
                        access={access}
                        customer={customer}
                        customerAccess={getCustomerAccess(customer)}
                        statusOptions={getOrderStatusOptions(order, access)}
                        updating={updating}
                        onOpen={setSelectedOrder}
                        onCustomerOpen={setSelectedCustomer}
                        onStatusChange={handleStatusUpdate}
                      />
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-20 text-center text-on-surface-variant italic font-body-md">
                        {orders.length === 0
                          ? 'No orders have been placed for your boutique yet.'
                          : 'No orders match the selected date range.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <OrderModal
        isOpen={!!selectedOrder}
        entity={selectedOrder}
        access={selectedOrder ? getAccess(selectedOrder) : null}
        onClose={closeSelectedOrder}
        getStatusOptions={(status) => getOrderStatusOptions(
          selectedOrder?.status === status ? selectedOrder : patchEntityModel(selectedOrder, { status }),
          selectedOrder ? getAccess(selectedOrder) : null,
        )}
        onStatusChange={handleStatusUpdate}
        statusLoading={updating}
        assistanceRequests={selectedOrder ? getAssistanceForOrder(selectedOrder.id) : []}
        assistanceActionsById={selectedOrder ? getAssistanceActionsMap(getAssistanceForOrder(selectedOrder.id)) : new Map()}
        assistanceMessagesById={selectedOrder ? getAssistanceMessagesMap(getAssistanceForOrder(selectedOrder.id)) : new Map()}
        assistanceLoading={assistanceLoading}
        assistanceMessage={assistanceMessage}
        onAssistanceMessageChange={setAssistanceMessage}
        onRequestAssistance={handleRequestAssistance}
        assistanceSubmitting={assistanceSubmitting}
        assistanceReplies={assistanceReplies}
        onAssistanceReplyChange={(requestId, value) => {
          setAssistanceReplies((current) => ({ ...current, [requestId]: value }));
        }}
        onAssistanceReply={handleReplyAssistance}
        onAssistanceResolutionFeedback={handleResolutionFeedback}
        assistanceReplyLoading={assistanceReplyLoading}
        customerEntity={selectedOrder ? buildCustomerUser(selectedOrder) : null}
        customerAccess={selectedOrder ? getCustomerAccess(buildCustomerUser(selectedOrder)) : null}
        onCustomerOpen={setSelectedCustomer}
      />

      <UserModal
        isOpen={!!selectedCustomer}
        entity={selectedCustomer}
        access={selectedCustomer ? getCustomerAccess(selectedCustomer) : null}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
        showPublicLink={Boolean(selectedCustomer?.id)}
      />

      <Footer />
    </div>
  );
}
