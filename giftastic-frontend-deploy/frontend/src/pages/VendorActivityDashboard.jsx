import { useState, useEffect } from 'react';
import { Activity, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorSidebar from '../components/VendorSidebar';
import vendorActivityService from '../services/vendorActivityService';
import { useAuthStore } from '../store/useAuthStore';
import {
  buildVendorActivityAccess,
  VendorActivitySummary,
} from '../ui/entities/vendorActivity';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';

const ACTIVITY_TYPES = [
  { value: '', label: 'All Activities' },
  { value: 'ORDER_RECEIVED', label: 'Orders Received' },
  { value: 'ORDER_SHIPPED', label: 'Orders Shipped' },
  { value: 'ORDER_DELIVERED', label: 'Orders Delivered' },
  { value: 'PRODUCT_CREATED', label: 'Products Created' },
  { value: 'PRODUCT_UPDATED', label: 'Products Updated' },
  { value: 'PRODUCT_APPROVED', label: 'Products Approved' },
  { value: 'PRODUCT_STOCK_UPDATED', label: 'Stock Updates' },
  { value: 'PRODUCT_OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'REVIEW_RECEIVED', label: 'Reviews Received' },
  { value: 'DELIVERY_PRICING_UPDATED', label: 'Delivery Pricing' }
];

const VendorActivityDashboard = () => {
  const viewer = useAuthStore((state) => state.viewer);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (viewer.supplierId) loadActivities();
  }, [page, filterType, viewer.supplierId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await vendorActivityService.getActivities(
        viewer.supplierId,
        page,
        20,
        filterType || null
      );
      setActivities((data.content || [])
        .map((activity) => adaptEntityFromNamedSource('adaptVendorActivityResponse', activity))
        .filter((activity) => buildVendorActivityAccess({ activity, viewer }).canRead));
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f6] flex flex-col">
      <Navbar />
      
      <div className="flex min-w-0 flex-1 flex-col md:flex-row">
        <VendorSidebar />
        
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="font-noto-serif text-4xl font-bold text-[#341547] mb-2">
                Activity Dashboard
              </h1>
              <p className="text-[#4b444d] font-manrope">
                Track all activities related to your store
              </p>
            </div>

            {/* Filter */}
            <div className="mb-6 bg-white rounded-xl shadow-[0_2px_8px_rgba(52,21,71,0.08)] p-4">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-[#341547]" />
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setPage(0);
                  }}
                  className="flex-1 px-4 py-2 border border-[#705a49] rounded-lg font-manrope text-[#1b1c1a] focus:outline-none focus:border-[#341547] focus:ring-2 focus:ring-[#341547]/20 transition-all"
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Activities List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#341547]"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(52,21,71,0.08)] p-12 text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 text-[#4b444d] opacity-50" />
                <p className="text-[#4b444d] font-manrope">
                  No activities found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <VendorActivitySummary
                    key={activity.id}
                    activity={activity}
                    access={buildVendorActivityAccess({ activity, viewer })}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg border border-[#341547] text-[#341547] font-plus-jakarta font-semibold hover:bg-[#f4d9ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="px-4 py-2 font-manrope text-[#4b444d]">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg border border-[#341547] text-[#341547] font-plus-jakarta font-semibold hover:bg-[#f4d9ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default VendorActivityDashboard;
