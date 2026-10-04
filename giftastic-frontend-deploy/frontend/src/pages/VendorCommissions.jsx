import { useState, useEffect } from 'react';
import commissionService from '../services/commissionService';
import VendorSidebar from '../components/VendorSidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EntityDialog from '../components/modals/EntityDialog';
import { useAuthStore } from '../store/useAuthStore';
import {
  buildCommissionAccess,
  COMMISSION_CONTEXT,
  formatCommissionMoney,
  sumCommissionAmounts,
} from '../ui/entities/commission';
import {
  buildCommissionPaymentRequestAccess,
  countPendingCommissionPaymentRequests,
  COMMISSION_PAYMENT_REQUEST_CONTEXT,
  PaymentWorkflowCard,
} from '../ui/entities/commissionPaymentRequest';
import PaymentRequestConversation from '../ui/entities/commissionPaymentRequest/PaymentRequestConversation';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';

export default function VendorCommissions() {
  const viewer = useAuthStore((state) => state.viewer);
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [detailWorkflow, setDetailWorkflow] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, history, requests] = await Promise.all([
        commissionService.getVendorPendingCommissions(),
        commissionService.getVendorCommissionHistory(),
        commissionService.getVendorPaymentRequests(),
      ]);
      setPendingCommissions((pending || []).map((commission) =>
        adaptEntityFromNamedSource('adaptCommissionDto', commission)));
      setCommissionHistory((history || []).map((commission) =>
        adaptEntityFromNamedSource('adaptCommissionDto', commission)));
      setPaymentRequests((requests || []).map((request) =>
        adaptEntityFromNamedSource('adaptCommissionPaymentRequestDto', request)));
    } catch (error) {
      console.error('Failed to load commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentMessage.trim()) {
      showNotification('Please enter the transaction ID, payment link, or payment details.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const mapped = commandDraftToPayload('commissionProof', createCommandDraft('commissionProof', {
        message: paymentMessage,
        proofImageUrl: null,
      }));
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);
      await commissionService.submitPayment(selectedCommission.id, mapped.payload);
      showNotification('Payment details submitted for review.', 'success');
      setShowPaymentModal(false);
      setPaymentMessage('');
      setSelectedCommission(null);
      loadData();
    } catch (error) {
      console.error('Failed to submit payment:', error);
      showNotification(error.response?.data?.message || error.response?.data?.error || 'Failed to submit payment details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (commission) => {
    setSelectedCommission(commission);
    setShowPaymentModal(true);
  };

  const handleUrgePayout = async (commission) => {
    try {
      await commissionService.urgePlatformPayment(commission.id);
      showNotification('Payout reminder sent to Giftastic.', 'success');
    } catch (error) { showNotification(error.response?.data?.message || 'Failed to request payout', 'error'); }
  };

  const handleReviewPayout = async (request, approved) => {
    try {
      const reason = approved ? null : (rejectionReasons[request.id] || '').trim();
      if (!approved && !reason) {
        showNotification('Add a reason before sending this back for follow-up.', 'error');
        return;
      }
      if (approved) await commissionService.approvePlatformPayment(request.id);
      else await commissionService.rejectPlatformPayment(request.id, reason);
      showNotification(approved ? 'Payment marked as received.' : 'Denied with feedback. Giftastic can submit corrected payment details.', 'success');
      setRejectionReasons((current) => ({ ...current, [request.id]: '' }));
      await loadData();
    } catch (error) { showNotification(error.response?.data?.message || 'Failed to review payout', 'error'); }
  };

  const totalOwed = sumCommissionAmounts(pendingCommissions);
  const pendingCommissionIds = new Set(pendingCommissions.map((commission) => commission.id));
  const visiblePaymentRequests = paymentRequests.filter((request) =>
    !(request.status === 'REJECTED' && pendingCommissionIds.has(request.commissionId)));
  const allCommissions = [...pendingCommissions, ...commissionHistory];
  const getPaymentRequestForCommission = (commissionId) =>
    paymentRequests
      .filter((request) => request.commissionId === commissionId)
      .sort((left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime())[0];
  const getCommissionForRequest = (request) =>
    allCommissions.find((commission) => commission.id === request?.commissionId);
  const selectedPaymentThread = selectedCommission
    ? getPaymentRequestForCommission(selectedCommission.id)
    : null;
  const selectedPaymentWorkflow = selectedCommission
    ? { commission: selectedCommission, request: selectedPaymentThread }
    : null;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 5000);
  };

  const renderPaymentWorkflow = ({ commission, request }, options = {}) => {
    const commissionAccess = commission ? buildCommissionAccess({
      commission,
      viewer,
      context: COMMISSION_CONTEXT.OWNER,
    }) : null;
    const requestAccess = request ? buildCommissionPaymentRequestAccess({
      request,
      viewer,
      context: COMMISSION_PAYMENT_REQUEST_CONTEXT.OWNER,
    }) : null;

    return (
      <PaymentWorkflowCard
        commission={commission}
        request={request}
        commissionAccess={commissionAccess}
        requestAccess={requestAccess}
        handlers={{
          submitPayment: openPaymentModal,
          urge: handleUrgePayout,
          approve: (entity) => handleReviewPayout(entity, true),
          reject: (entity) => handleReviewPayout(entity, false),
        }}
        reviewRejectionReason={request ? rejectionReasons[request.id] || '' : ''}
        onReviewRejectionReasonChange={(entity, value) => setRejectionReasons((current) => ({
          ...current,
          [entity.id]: value,
        }))}
        onDetails={options.showDetails === false ? undefined : setDetailWorkflow}
        showActions={options.showActions !== false}
        compact={options.compact}
      />
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-w-0 flex-col md:flex-row">
          <VendorSidebar />
          <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">Loading...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-w-0 flex-col md:flex-row">
        <VendorSidebar />
        <div className="min-w-0 flex-1 min-h-screen bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Commission Management</h1>
        {notification && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${
            notification.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600">Pending Commissions</p>
              <p className="text-2xl font-bold">{pendingCommissions.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Owed</p>
              <p className="text-2xl font-bold text-red-600">{formatCommissionMoney(totalOwed) || '-'}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Requests</p>
              <p className="text-2xl font-bold">{countPendingCommissionPaymentRequests(visiblePaymentRequests)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pending ({pendingCommissions.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'requests'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Payment Requests ({visiblePaymentRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                History
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Pending Commissions Tab */}
            {activeTab === 'pending' && (
              <div>
                {pendingCommissions.length === 0 ? (
                  <p className="text-gray-600">No pending commissions</p>
                ) : (
                  <div className="space-y-4">
                    {pendingCommissions.map((commission) => (
                      <div key={commission.id}>
                        {renderPaymentWorkflow({
                          commission,
                          request: getPaymentRequestForCommission(commission.id),
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                {visiblePaymentRequests.length === 0 ? (
                  <p className="text-gray-600">No payment requests</p>
                ) : (
                  <div className="space-y-4">
                    {visiblePaymentRequests.map((request) => (
                      <div key={request.id}>
                        {renderPaymentWorkflow({
                          commission: getCommissionForRequest(request),
                          request,
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                {commissionHistory.length === 0 ? (
                  <p className="text-gray-600">No commission history</p>
                ) : (
                  <div className="space-y-4">
                    {commissionHistory.map((commission) => (
                      <div key={commission.id}>
                        {renderPaymentWorkflow({
                          commission,
                          request: getPaymentRequestForCommission(commission.id),
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <EntityDialog
        isOpen={showPaymentModal}
        title="Submit Payment Details"
        eyebrow="Payment Workflow"
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentMessage('');
          setSelectedCommission(null);
        }}
        maxWidth="max-w-3xl"
      >
        {selectedPaymentWorkflow && (
          <div className="space-y-4">
            {renderPaymentWorkflow(selectedPaymentWorkflow, { showActions: false, showDetails: false, compact: true })}
            {selectedPaymentThread && <PaymentRequestConversation request={selectedPaymentThread} />}
            <div>
              <label className="block text-sm font-medium mb-2">Transaction IDs, links, or notes *</label>
              <textarea
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                className="w-full rounded border border-gray-300 p-3 text-sm"
                rows="5"
                placeholder="Enter transaction IDs, payment links, and any details the receiver needs to verify the payment."
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={submitting}
                className="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMessage('');
                  setSelectedCommission(null);
                }}
                className="flex-1 rounded border px-4 py-2 hover:bg-surface-container-low"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </EntityDialog>
      <EntityDialog
        isOpen={!!detailWorkflow}
        title="Payment Workflow Details"
        eyebrow="Payment Workflow"
        onClose={() => setDetailWorkflow(null)}
        maxWidth="max-w-3xl"
      >
        {detailWorkflow && (
          <div className="space-y-4">
            {renderPaymentWorkflow(detailWorkflow, { showDetails: false, compact: true })}
            {detailWorkflow.request && <PaymentRequestConversation request={detailWorkflow.request} />}
          </div>
        )}
      </EntityDialog>
        </div>
      </div>
      <Footer />
    </>
  );
}
