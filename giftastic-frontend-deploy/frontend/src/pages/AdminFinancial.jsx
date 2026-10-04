import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import CommissionModal from '../components/modals/CommissionModal';
import EntityDialog from '../components/modals/EntityDialog';
import {
  buildCommissionAccess,
  buildCommissionActions,
  CommissionSummary,
  COMMISSION_CONTEXT,
  formatCommissionMoney,
} from '../ui/entities/commission';
import {
  buildCommissionPaymentRequestAccess,
  buildCommissionPaymentRequestActions,
  CommissionPaymentRequestSummary,
  COMMISSION_PAYMENT_REQUEST_CONTEXT,
  PaymentWorkflowCard,
} from '../ui/entities/commissionPaymentRequest';
import PaymentRequestConversation from '../ui/entities/commissionPaymentRequest/PaymentRequestConversation';
import {
  buildCommissionRuleAccess,
  buildCommissionRuleActions,
  CommissionRuleSummary,
} from '../ui/entities/commissionRule';
import { viewerHasCapability } from '../ui/entities/shared';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { createCommissionRuleDraft, mapCommissionRulePayload } from '../ui/commands/commissionRule';
import { multiplyDecimal } from '../ui/entities/shared/decimal';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';
import { executeFinancialAction, loadFinancialSection } from '../ui/workflows/financialWorkflow';
import { selectFinancialMetricFormat as formatCurrency } from '../ui/projections/financialAnalytics/FinancialAnalyticsSelectors';
import { buildVendorAccess, VendorSummary, VENDOR_CONTEXT } from '../ui/entities/vendor';
import commissionService from '../services/commissionService';

export default function AdminFinancial() {
  const viewer = useAuthStore((state) => state.viewer);
  const [activeTab, setActiveTab] = useState('unpaid');
  const [loading, setLoading] = useState(true);

  // Data states
  const [unpaidCommissions, setUnpaidCommissions] = useState([]);
  const [instapayPayouts, setInstapayPayouts] = useState([]);
  const [instapayPaymentRequests, setInstapayPaymentRequests] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [commissionRules, setCommissionRules] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Modal states
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedKind, setSelectedKind] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestRejectionReasons, setRequestRejectionReasons] = useState({});
  const [notification, setNotification] = useState(null);
  const [threadMessages, setThreadMessages] = useState({});
  const [threadSubmitting, setThreadSubmitting] = useState(false);
  const [selectedPayoutWorkflow, setSelectedPayoutWorkflow] = useState(null);
  const [payoutMessage, setPayoutMessage] = useState('');
  const [invalidVendorFilter, setInvalidVendorFilter] = useState('');

  // Rule form states
  const [ruleType, setRuleType] = useState('GLOBAL');
  const [supplierId, setSupplierId] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const hasActiveCommissionRule = commissionRules.length > 0;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'unpaid' && viewerHasCapability(viewer, 'VIEW_FINANCIAL_DATA')) {
        setUnpaidCommissions(await loadFinancialSection('unpaid'));
      } else if (activeTab === 'instapay' && viewerHasCapability(viewer, 'VIEW_FINANCIAL_DATA')) {
        setInstapayPayouts(await loadFinancialSection('instapay'));
        if (viewerHasCapability(viewer, 'MANAGE_VENDOR_PAYOUTS')) {
          setInstapayPaymentRequests(await loadFinancialSection('instapayRequests'));
        } else {
          setInstapayPaymentRequests([]);
        }
      } else if (activeTab === 'requests' && viewerHasCapability(viewer, 'REVIEW_COMMISSION_PAYMENTS')) {
        setPaymentRequests(await loadFinancialSection('requests'));
      } else if (activeTab === 'rules' && viewerHasCapability(viewer, 'MANAGE_COMMISSIONS')) {
        setCommissionRules(await loadFinancialSection('rules'));
      } else if (activeTab === 'analytics' && viewerHasCapability(viewer, 'VIEW_FINANCIAL_ANALYTICS')) {
        setAnalytics(await loadFinancialSection('analytics'));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUrgePayment = async (commissionId) => {
    try {
      await executeFinancialAction('urge', commissionId);
      showNotification('Payment reminder sent.', 'success');
    } catch (error) {
      console.error('Failed to urge payment:', error);
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Failed to send reminder.', 'error');
    }
  };

  const handleApprovePayment = async (requestId) => {
    try {
      await executeFinancialAction('approve', requestId);
      showNotification('Payment marked as successful.', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to approve payment:', error);
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Failed to approve payment.', 'error');
    }
  };

  const handleRejectPayment = async (request = selectedItem, reasonOverride = rejectionReason) => {
    const mapped = commandDraftToPayload('moderationDecision', createCommandDraft('moderationDecision', {
      decision: 'REJECT', reason: reasonOverride,
    }));
    if (!mapped.ok) { showNotification(Object.values(mapped.errors)[0], 'error'); return; }
    try {
      await executeFinancialAction('reject', request.id, mapped.payload);
      showNotification('Denied with feedback. The sender can submit corrected payment details.', 'success');
      setRejectionReason('');
      setRequestRejectionReasons((current) => ({ ...current, [request.id]: '' }));
      if (selectedItem?.id === request.id) setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error('Failed to reject payment:', error);
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Failed to reject payment.', 'error');
    }
  };

  const handleCommissionModalAction = async (action, entity) => {
    if (action === 'urge') {
      await handleUrgePayment(entity.id);
    } else if (action === 'approve') {
      await handleApprovePayment(entity.id);
      setSelectedItem(null);
    } else if (action === 'reject') {
      await handleRejectPayment();
    } else if (action === 'deactivate') {
      await executeFinancialAction('deactivate', entity.id);
      setSelectedItem(null);
      loadData();
    }
  };

  const selectedAccess = selectedItem && selectedKind === 'commission'
    ? buildCommissionAccess({ commission: selectedItem, viewer, context: COMMISSION_CONTEXT.ADMIN })
    : selectedItem && selectedKind === 'paymentRequest'
      ? buildCommissionPaymentRequestAccess({ request: selectedItem, viewer, context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN })
      : selectedItem && selectedKind === 'rule'
        ? buildCommissionRuleAccess({ rule: selectedItem, viewer })
        : null;
  const selectedActions = !selectedItem || !selectedAccess ? []
    : selectedKind === 'commission'
      ? buildCommissionActions({ commission: selectedItem, access: selectedAccess, handlers: { urge: () => handleCommissionModalAction('urge', selectedItem) } })
      : selectedKind === 'paymentRequest'
        ? buildCommissionPaymentRequestActions({
          request: selectedItem,
          access: selectedAccess,
          handlers: {
            approve: (entity) => handleApprovePayment(entity.id),
            reject: (entity) => handleRejectPayment(entity, requestRejectionReasons[entity.id] || rejectionReason),
          },
        })
        : buildCommissionRuleActions({ rule: selectedItem, access: selectedAccess, handlers: { deactivate: () => handleCommissionModalAction('deactivate', selectedItem) } });

  const handleCreateRule = async () => {
    if (hasActiveCommissionRule) {
      showNotification('Only one custom commission rule can be active. Deactivate the current rule first.', 'error');
      return;
    }
    if (!rate || !startDate) {
      showNotification('Please fill in required fields.', 'error');
      return;
    }
    if (ruleType === 'SUPPLIER_SPECIFIC' && !supplierId) {
      showNotification('Please provide supplier ID.', 'error');
      return;
    }

    try {
      const mapped = mapCommissionRulePayload(createCommissionRuleDraft({
        type: ruleType,
        supplierId: ruleType === 'SUPPLIER_SPECIFIC' ? supplierId : null,
        rate: multiplyDecimal(rate, '0.01'),
        startDate,
        endDate: endDate || null,
      }));
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);
      await executeFinancialAction('createRule', null, mapped.payload);
      showNotification('Commission rule created.', 'success');
      setShowRuleModal(false);
      setRuleType('GLOBAL');
      setSupplierId('');
      setRate('');
      setStartDate('');
      setEndDate('');
      loadData();
    } catch (error) {
      console.error('Failed to create rule:', error);
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Failed to create rule', 'error');
    }
  };

  const handleAddThreadMessage = async (request) => {
    const message = (threadMessages[request.id] || '').trim();
    if (!message) {
      showNotification('Write a message before sending.', 'error');
      return;
    }
    try {
      setThreadSubmitting(true);
      const updated = await commissionService.addAdminPaymentRequestMessage(request.id, message);
      const adapted = adaptEntityFromNamedSource('adaptCommissionPaymentRequestDto', updated);
      setPaymentRequests((current) => current.map((item) => item.id === adapted.id ? adapted : item));
      setSelectedItem((current) => current?.id === adapted.id ? adapted : current);
      setThreadMessages((current) => ({ ...current, [request.id]: '' }));
      showNotification('Message sent.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Could not send message.', 'error');
    } finally {
      setThreadSubmitting(false);
    }
  };

  const getInstapayRequestForCommission = (commissionId) =>
    instapayPaymentRequests
      .filter((request) => request.commissionId === commissionId)
      .sort((left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime())[0];

  const openVendorPayoutModal = (commission) => {
    setSelectedPayoutWorkflow({
      commission,
      request: getInstapayRequestForCommission(commission.id),
    });
    setPayoutMessage('');
  };

  const handleSubmitVendorPayout = async () => {
    const commission = selectedPayoutWorkflow?.commission;
    const request = selectedPayoutRequest;
    const message = payoutMessage.trim();
    if (!commission) return;
    if (!message) {
      showNotification('Enter transaction IDs, links, or payout details before sending.', 'error');
      return;
    }
    try {
      const updated = request?.status === 'PENDING'
        ? await commissionService.addAdminPaymentRequestMessage(request.id, message)
        : await executeFinancialAction('submitVendorPayout', commission.id, { message, proofImageUrl: null });
      const adapted = adaptEntityFromNamedSource('adaptCommissionPaymentRequestDto', updated);
      setInstapayPaymentRequests((current) => [
        adapted,
        ...current.filter((item) => item.id !== adapted.id),
      ]);
      setSelectedPayoutWorkflow({ commission, request: adapted });
      showNotification(request?.status === 'PENDING' ? 'Message sent to vendor.' : 'Payout details sent to vendor.', 'success');
      setPayoutMessage('');
      loadData();
    } catch (error) {
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Failed to submit vendor payout.', 'error');
    }
  };

  const showFinancialDetails = ({ commission, request }) => {
    setSelectedItem(request || commission);
    setSelectedKind(request ? 'paymentRequest' : 'commission');
  };

  const renderInstapayPayoutWorkflow = ({ commission, request }, options = {}) => (
    <PaymentWorkflowCard
      commission={commission}
      request={request}
      commissionAccess={commission ? buildCommissionAccess({
        commission,
        viewer,
        context: COMMISSION_CONTEXT.ADMIN,
      }) : null}
      requestAccess={request ? buildCommissionPaymentRequestAccess({
        request,
        viewer,
        context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN,
      }) : null}
      handlers={{
        submitPayment: openVendorPayoutModal,
        message: () => openVendorPayoutModal(commission),
      }}
      onDetails={options.showDetails === false ? undefined : showFinancialDetails}
      showActions={options.showActions !== false}
      compact={options.compact}
    />
  );

  const selectedPayoutRequest = selectedPayoutWorkflow?.commission
    ? getInstapayRequestForCommission(selectedPayoutWorkflow.commission.id) || selectedPayoutWorkflow.request
    : null;
  const selectedPayoutModalWorkflow = selectedPayoutWorkflow
    ? { commission: selectedPayoutWorkflow.commission, request: selectedPayoutRequest }
    : null;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 5000);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const invalidVendorFilterTerm = invalidVendorFilter.trim().toLowerCase();
  const filteredInvalidVendorPortions = (analytics?.invalidVendorPortions || []).filter((row) => {
    if (!invalidVendorFilterTerm) return true;
    return [
      row.entity?.storeName,
      row.entity?.supplierId,
      row.latestReason,
      row.latestDetails,
    ].some((value) => String(value || '').toLowerCase().includes(invalidVendorFilterTerm));
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Financial Management</h1>
        {notification && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
            notification.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {viewerHasCapability(viewer, 'VIEW_FINANCIAL_DATA') && (
                <button
                  onClick={() => setActiveTab('unpaid')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeTab === 'unpaid'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Unpaid Commissions
                </button>
              )}
              {viewerHasCapability(viewer, 'REVIEW_COMMISSION_PAYMENTS') && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeTab === 'requests'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Payment Requests
                </button>
              )}
              {viewerHasCapability(viewer, 'VIEW_FINANCIAL_DATA') && (
                <button
                  onClick={() => setActiveTab('instapay')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeTab === 'instapay'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Instapay
                </button>
              )}
              {viewerHasCapability(viewer, 'MANAGE_COMMISSIONS') && (
                <button
                  onClick={() => setActiveTab('rules')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeTab === 'rules'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Commission Rules
                </button>
              )}
              {viewerHasCapability(viewer, 'VIEW_FINANCIAL_ANALYTICS') && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Analytics
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Unpaid Commissions Tab */}
            {activeTab === 'unpaid' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Unpaid Commissions (Oldest First)</h2>
                {unpaidCommissions.length === 0 ? (
                  <p className="text-gray-600">No unpaid commissions</p>
                ) : (
                  <div className="space-y-4">
                    {unpaidCommissions.map((commission) => (
                      <CommissionSummary
                        key={commission.id}
                        commission={commission}
                        access={buildCommissionAccess({
                          commission,
                          viewer,
                          context: COMMISSION_CONTEXT.ADMIN,
                        })}
                        handlers={{ urge: (entity) => handleUrgePayment(entity.id) }}
                        onDetails={(entity) => {
                          setSelectedItem(entity);
                          setSelectedKind('commission');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Payment Requests</h2>
                {paymentRequests.length === 0 ? (
                  <p className="text-gray-600">No pending payment requests</p>
                ) : (
                  <div className="space-y-4">
                    {paymentRequests.map((request) => (
                      <CommissionPaymentRequestSummary
                        key={request.id}
                        request={request}
                        access={buildCommissionPaymentRequestAccess({
                          request,
                          viewer,
                          context: COMMISSION_PAYMENT_REQUEST_CONTEXT.ADMIN,
                        })}
                        handlers={{
                          approve: (entity) => handleApprovePayment(entity.id),
                          reject: (entity) => handleRejectPayment(entity, requestRejectionReasons[entity.id] || ''),
                        }}
                        threadMessage={threadMessages[request.id] || ''}
                        onThreadMessageChange={(entity, value) => setThreadMessages((current) => ({ ...current, [entity.id]: value }))}
                        onThreadMessageSubmit={handleAddThreadMessage}
                        threadSubmitting={threadSubmitting}
                        reviewRejectionReason={requestRejectionReasons[request.id] || ''}
                        onReviewRejectionReasonChange={(entity, value) => setRequestRejectionReasons((current) => ({ ...current, [entity.id]: value }))}
                        onDetails={(entity) => {
                          setSelectedItem(entity);
                          setSelectedKind('paymentRequest');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Instapay Vendor Payouts Tab */}
            {activeTab === 'instapay' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Instapay Vendor Payouts</h2>
                {instapayPayouts.length === 0 ? (
                  <p className="text-gray-600">No eligible Instapay payouts</p>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-800">
                        Total net payout due: <span className="font-bold">{formatCommissionMoney(
                          instapayPayouts.reduce((sum, payout) => Number(sum) + Number(payout.payableAmount || 0), 0)
                        ) || '-'}</span>
                      </p>
                    </div>
                    {instapayPayouts.map((payout) => (
                      <div key={payout.id}>
                        {renderInstapayPayoutWorkflow({
                          commission: payout,
                          request: getInstapayRequestForCommission(payout.id),
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Commission Rules Tab */}
            {activeTab === 'rules' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Commission Rules</h2>
                  <button
                    onClick={() => setShowRuleModal(true)}
                    disabled={hasActiveCommissionRule}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create Rule
                  </button>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Only one custom commission rule can be active. If none is active, the default 10% commission applies.
                </p>
                {commissionRules.length === 0 ? (
                  <p className="text-gray-600">No commission rules</p>
                ) : (
                  <div className="space-y-4">
                    {commissionRules.map((rule) => (
                      <CommissionRuleSummary
                        key={rule.id}
                        rule={rule}
                        access={buildCommissionRuleAccess({
                          rule,
                          viewer,
                        })}
                        handlers={{
                          deactivate: async (entity) => {
                            await executeFinancialAction('deactivate', entity.id);
                            loadData();
                          },
                        }}
                        onDetails={(entity) => {
                          setSelectedItem(entity);
                          setSelectedKind('rule');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Financial Analytics</h2>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Items Subtotal</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalItemSubtotal)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Delivery Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalDeliveryCost)}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Customer Payments</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalCustomerPayments)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Platform Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalPlatformRevenue)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Vendor Earnings</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalVendorEarnings)}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Commissions Owed</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalCommissionsOwed)}</p>
                    <p className="text-xs text-gray-500 mt-1">Paid: {formatCurrency(analytics.totalCommissionsPaid)}</p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">COD Orders</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.codOrderValue)}</p>
                    <p className="text-xs text-gray-500 mt-1">{analytics.counts?.codOrderCount || 0} orders</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Instapay Orders</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.instapayOrderValue)}</p>
                    <p className="text-xs text-gray-500 mt-1">{analytics.counts?.instapayOrderCount || 0} orders</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Invalid / Failed</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.invalidOrFailedPayments)}</p>
                    <p className="text-xs text-gray-500 mt-1">{analytics.counts?.invalidOrFailedOrderCount || 0} orders</p>
                  </div>
                  <div className="bg-violet-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Vendor Payouts Due</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.pendingVendorPayouts)}</p>
                    <p className="text-xs text-gray-500 mt-1">Submitted: {formatCurrency(analytics.submittedVendorPayouts)} · Paid: {formatCurrency(analytics.completedVendorPayouts)}</p>
                  </div>
                </div>

                {/* Vendor Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">By Vendor</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Vendor</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Total Earnings</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Commissions Paid</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Commissions Owed</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Payouts Due</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Payouts Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {analytics.byVendor.map((vendor) => (
                          <tr key={vendor.entity.supplierId}>
                            <td className="px-4 py-2 text-sm"><VendorSummary model={vendor.entity} access={buildVendorAccess({ vendor: vendor.entity, viewer, context: VENDOR_CONTEXT.ADMIN_FINANCIAL })} /></td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(vendor.totalEarnings)}</td>
                            <td className="px-4 py-2 text-sm text-green-600">{formatCurrency(vendor.commissionsPaid)}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{formatCurrency(vendor.commissionsOwed)}</td>
                            <td className="px-4 py-2 text-sm text-violet-700">{formatCurrency(vendor.pendingPayouts)}</td>
                            <td className="px-4 py-2 text-sm text-emerald-700">{formatCurrency(vendor.completedPayouts)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invalid Vendor Portions */}
                <div className="mb-6">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold">Invalid Vendor Portions</h3>
                    <input
                      value={invalidVendorFilter}
                      onChange={(event) => setInvalidVendorFilter(event.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Filter by vendor, reason, or details"
                    />
                  </div>
                  {(analytics.invalidVendorPortions || []).length === 0 ? (
                    <p className="text-sm text-gray-600">No invalid vendor portions</p>
                  ) : filteredInvalidVendorPortions.length === 0 ? (
                    <p className="text-sm text-gray-600">No invalid vendor portions match this filter</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Vendor</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Invalid Portions</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Invalid Subtotal</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Latest Reason</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Latest Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredInvalidVendorPortions.map((vendor) => (
                            <tr key={vendor.entity.supplierId}>
                              <td className="px-4 py-2 text-sm"><VendorSummary model={vendor.entity} access={buildVendorAccess({ vendor: vendor.entity, viewer, context: VENDOR_CONTEXT.ADMIN_FINANCIAL })} /></td>
                              <td className="px-4 py-2 text-sm">{vendor.invalidatedPortions}</td>
                              <td className="px-4 py-2 text-sm text-red-600">{formatCurrency(vendor.invalidatedSubtotal)}</td>
                              <td className="px-4 py-2 text-sm">{vendor.latestReason || '-'}</td>
                              <td className="px-4 py-2 text-sm">{vendor.latestDetails || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Monthly Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">By Month</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Month</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Items Subtotal</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Delivery Total</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Customer Payments</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">COD</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Instapay</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Commissions Collected</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Payouts Paid</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Invalid / Failed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {analytics.byMonth.map((month) => (
                          <tr key={month.month}>
                            <td className="px-4 py-2 text-sm">{month.month}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.itemSubtotal)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.deliveryTotal)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.customerPayments)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.codOrderValue)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.instapayOrderValue)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.commissionsCollected)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.vendorPayoutsCompleted)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(month.invalidOrFailedPayments)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CommissionModal
        isOpen={!!selectedItem}
        entity={selectedItem}
        kind={selectedKind}
        access={selectedAccess}
        actions={selectedActions}
        onClose={() => {
          setSelectedItem(null);
          setSelectedKind(null);
          setRejectionReason('');
        }}
      >
        {selectedKind === 'paymentRequest' && selectedAccess?.canReview && (
          <label className="mb-4 grid gap-2 text-sm font-semibold text-gray-800">
            Rejection reason
            <textarea
              value={requestRejectionReasons[selectedItem.id] || rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value);
                setRequestRejectionReasons((current) => ({ ...current, [selectedItem.id]: event.target.value }));
              }}
              rows={3}
              className="rounded border border-gray-300 p-3 text-sm"
            />
          </label>
        )}
      </CommissionModal>

      <EntityDialog
        isOpen={!!selectedPayoutWorkflow}
        title="Send Vendor Payout Details"
        eyebrow="Instapay"
        onClose={() => {
          setSelectedPayoutWorkflow(null);
          setPayoutMessage('');
        }}
        maxWidth="max-w-3xl"
      >
        {selectedPayoutModalWorkflow && (
          <div className="space-y-4">
            {renderInstapayPayoutWorkflow(selectedPayoutModalWorkflow, {
              showActions: false,
              showDetails: false,
              compact: true,
            })}
            {selectedPayoutRequest && <PaymentRequestConversation request={selectedPayoutRequest} />}
            <label className="block text-sm font-medium">
              Message, transaction IDs, or payout links
              <textarea
                value={payoutMessage}
                onChange={(event) => setPayoutMessage(event.target.value)}
                rows={5}
                placeholder="Send transaction IDs, payment links, and any details the vendor needs to verify the payout."
                className="mt-2 w-full rounded border border-gray-300 p-3 text-sm"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={handleSubmitVendorPayout} className="flex-1 rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
                {selectedPayoutRequest?.status === 'PENDING' ? 'Send message' : 'Send payout details'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPayoutWorkflow(null);
                  setPayoutMessage('');
                }}
              className="flex-1 rounded border px-4 py-2 hover:bg-surface-container-low"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </EntityDialog>

      {/* Create Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create Commission Rule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rule Type *</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="GLOBAL">Global (All Vendors)</option>
                  <option value="SUPPLIER_SPECIFIC">Supplier Specific</option>
                </select>
              </div>
              {ruleType === 'SUPPLIER_SPECIFIC' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Supplier ID *</label>
                  <input
                    type="text"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="UUID"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Commission Rate (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="10.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date (optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateRule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  setRuleType('GLOBAL');
                  setSupplierId('');
                  setRate('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-surface-container-low"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
