import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReportButton from '../components/ReportButton';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import VendorModal from '../components/modals/VendorModal';
import GiftFlowModalController from '../components/controllers/GiftFlowModalController';
import { vendorService } from '../services/vendorService';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { buildVendorAccess, getVendorName, VENDOR_CONTEXT, withVendorRelations } from '../ui/entities/vendor';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { buildProductAccess, PRODUCT_CONTEXT } from '../ui/entities/product';
import { buildGiftFlowAccess, GIFT_FLOW_CONTEXT } from '../ui/entities/giftFlow';

export default function VendorProfile() {
  const { supplierId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { viewer, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (supplierId) {
      fetchVendorData();
    }
  }, [supplierId]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      // Fetch all vendors to find this one (since we don't have getVendorById public yet)
      const allVendors = await vendorService.getAllVendors();
      const currentVendorPayload = allVendors.find(v => v.supplierId === supplierId);

      if (currentVendorPayload) {
        const [vendorProducts, vendorFlows] = await Promise.all([
          vendorService.getVendorProducts(supplierId),
          vendorService.getVendorFlows(supplierId)
        ]);
        const productEntities = (Array.isArray(vendorProducts) ? vendorProducts : []).map((product) =>
          adaptEntityFromNamedSource('adaptProductDomain', product));
        const flowEntities = (vendorFlows || []).map((flow) =>
          adaptEntityFromNamedSource('adaptGiftFlowResponse', flow));
        setVendor(withVendorRelations(
          adaptEntityFromNamedSource('adaptVendorPublicListRecord', currentVendorPayload),
          { products: productEntities, giftFlows: flowEntities },
        ));
      } else {
        setVendor(null);
      }
    } catch (error) {
      console.error('Failed to fetch vendor data:', error);
      setVendor(null);
      setLoadError('We could not load this boutique. Please try again.');
    } finally {
      setLoading(false);
    }
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

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 p-12 text-center">
          <h2 className="font-display-lg text-primary">Boutique unavailable</h2>
          <p className="text-on-surface-variant">{loadError}</p>
          <button type="button" onClick={fetchVendorData} className="rounded-lg bg-primary px-6 py-3 text-white">
            Try again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-display-lg text-primary mb-4">Boutique Not Found</h2>
          <p className="text-on-surface-variant mb-8">The boutique you are looking for does not exist or is currently inactive.</p>
          <Link to="/vendors" className="bg-primary text-white px-8 py-3 rounded-lg">Browse All Vendors</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex-grow w-full">
        <VendorModal
          entity={vendor}
          access={buildVendorAccess({ vendor, viewer, context: VENDOR_CONTEXT.PUBLIC })}
          showProductsPreview
          showFlowsPreview
          productAccessFor={(product) => buildProductAccess({
            product,
            viewer,
            context: PRODUCT_CONTEXT.PUBLIC,
          })}
          flowAccessFor={(flow) => buildGiftFlowAccess({
            flow,
            viewer,
            context: GIFT_FLOW_CONTEXT.PUBLIC,
          })}
          renderFlowModal={(flow, onClose) => (
            <GiftFlowModalController
              isOpen={!!flow}
              flow={flow}
              viewer={viewer}
              context="public"
              onClose={onClose}
              showPublicLink={Boolean(flow?.id)}
            />
          )}
          headerAction={(
            <ReportButton 
              entityType="VENDOR" 
              entityId={vendor.userId || vendor.supplierId}
              entityName={getVendorName(vendor)}
            />
          )}
          reviewsSlot={(
            <section className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-label-md text-sm font-bold uppercase tracking-[0.18em] text-primary">
                    Customer Reviews
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    See what customers are saying about {getVendorName(vendor)}.
                  </p>
                </div>
              </div>

              {isAuthenticated && !showReviewForm && (
                <div className="mb-8 flex justify-center">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-[#341547] text-white py-3 px-8 rounded-lg font-plus-jakarta font-semibold hover:bg-[#4b2c5e] active:scale-[0.98] transition-all"
                  >
                    Write a Review
                  </button>
                </div>
              )}

              {showReviewForm && (
                <div className="mb-8">
                  <ReviewForm
                    entityId={supplierId}
                    reviewType="VENDOR"
                    onSuccess={() => {
                      setShowReviewForm(false);
                      toast.success('Review submitted successfully!');
                    }}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              <ReviewList entityId={supplierId} reviewType="VENDOR" />
            </section>
          )}
        />
      </main>

      <Footer />
    </div>
  );
}
