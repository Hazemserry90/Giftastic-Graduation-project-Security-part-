import { useState } from 'react';
import { createDeliveryEstimateDraft, mapDeliveryEstimatePayload } from '../ui/commands/deliveryEstimate';
import { createDeliveryDelayDraft, mapDeliveryDelayPayload } from '../ui/commands/deliveryDelay';

const DeliveryEstimateManager = ({ currentEstimate, actions = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('update'); // 'update' or 'delay'
  const [formData, setFormData] = useState({
    estimatedDeliveryDate: currentEstimate || '',
    notes: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateEstimate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const mapped = mapDeliveryEstimatePayload(createDeliveryEstimateDraft({
        estimatedDeliveryDate: formData.estimatedDeliveryDate,
        notes: formData.notes
      }));
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);
      await actions.find((candidate) => candidate.key === 'updateEstimate')?.onSelect(mapped.payload);
      alert('Delivery estimate updated successfully!');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to update estimate:', error);
      alert('Failed to update estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyDelay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const mapped = mapDeliveryDelayPayload(createDeliveryDelayDraft({
        reason: formData.reason,
        newEstimatedDate: formData.estimatedDeliveryDate
      }));
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);
      await actions.find((candidate) => candidate.key === 'notifyDelay')?.onSelect(mapped.payload);
      alert('Delay notification sent to customer!');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to notify delay:', error);
      alert('Failed to notify delay');
    } finally {
      setLoading(false);
    }
  };

  const delayReasons = [
    'High order volume',
    'Supply chain delays',
    'Weather conditions',
    'Custom order processing',
    'Quality control checks',
    'Shipping carrier delays'
  ];

  return (
    <>
      <div className="flex gap-2">
        {actions.some((candidate) => candidate.key === 'updateEstimate') && <button
          onClick={() => {
            setAction('update');
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update Estimate
        </button>}
        {actions.some((candidate) => candidate.key === 'notifyDelay') && <button
          onClick={() => {
            setAction('delay');
            setShowModal(true);
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Notify Delay
        </button>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {action === 'update' ? 'Update Delivery Estimate' : 'Notify Customer of Delay'}
            </h2>
            
            <form onSubmit={action === 'update' ? handleUpdateEstimate : handleNotifyDelay}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {action === 'update' ? 'New Estimated Delivery Date' : 'New Delivery Date'}
                </label>
                <input
                  type="datetime-local"
                  value={formData.estimatedDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              {action === 'delay' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Reason for Delay
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded mb-2"
                    required
                  >
                    <option value="">Select a reason...</option>
                    {delayReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details (optional)"
                    className="w-full px-3 py-2 border rounded"
                    rows="3"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information..."
                    className="w-full px-3 py-2 border rounded"
                    rows="3"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : action === 'update' ? 'Update' : 'Send Notification'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>

            {action === 'delay' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ This will send a notification to the customer about the delay.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryEstimateManager;
