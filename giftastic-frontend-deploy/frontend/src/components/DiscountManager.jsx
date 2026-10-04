import { useState } from 'react';
import { discountService } from '../services/discountService';
import { createProductDiscountDraft, mapProductDiscountPayload } from '../ui/commands/productDiscount';

const DiscountManager = ({ productId, currentDiscount, onUpdate, initiallyOpen = false, onClose }) => {
  const [showModal, setShowModal] = useState(initiallyOpen);
  const [formData, setFormData] = useState(() => createProductDiscountDraft({
    discountPercentage: currentDiscount?.discountPercentage || '',
    startDate: currentDiscount?.startDate || '',
    endDate: currentDiscount?.endDate || ''
  }));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const mapped = mapProductDiscountPayload(formData);
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);
      await discountService.setDiscount(productId, mapped.payload);
      alert('Discount set successfully!');
      setShowModal(false);
      onClose?.();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to set discount:', error);
      alert('Failed to set discount');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove discount from this product?')) return;
    
    setLoading(true);
    try {
      await discountService.removeDiscount(productId);
      alert('Discount removed successfully!');
      setShowModal(false);
      onClose?.();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to remove discount:', error);
      alert('Failed to remove discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {currentDiscount ? 'Edit Discount' : 'Set Discount'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Manage Discount</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Discount Percentage (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Discount'}
                </button>
                
                {currentDiscount && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => { setShowModal(false); onClose?.(); }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DiscountManager;
