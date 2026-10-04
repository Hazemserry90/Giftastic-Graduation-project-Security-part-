import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorModal from '../components/modals/VendorModal';
import VendorSummaryCard from '../components/modals/VendorSummaryCard';
import { vendorService } from '../services/vendorService';
import { useAuthStore } from '../store/useAuthStore';
import { buildVendorAccess, VENDOR_CONTEXT } from '../ui/entities/vendor';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';

export default function VendorCatalog() {
  const viewer = useAuthStore((state) => state.viewer);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await vendorService.getAllVendors();
      setVendors((data || []).map((vendor) =>
        adaptEntityFromNamedSource('adaptVendorPublicListRecord', vendor)));
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      setVendors([]);
      setLoadError('We could not load boutique partners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-16 sm:px-6 lg:px-12">
        <section className="mb-16">
          <h1 className="font-display-xl text-display-xl text-primary mb-4">Our Boutique Partners</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Discover the artisans and boutiques that make Alexandria's gifting scene unique. 
            From local craftsmen to luxury retailers, browse our curated list of verified partners.
          </p>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-surface-container h-64 rounded-xl"></div>
            ))}
          </div>
        ) : loadError ? (
          <div className="py-20 text-center">
            <p className="text-error">{loadError}</p>
            <button type="button" onClick={fetchVendors} className="mt-4 rounded-lg bg-primary px-5 py-2 text-white">
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vendors.map((vendor) => (
              <VendorSummaryCard
                key={vendor.userId || vendor.supplierId}
                entity={vendor}
                access={buildVendorAccess({ vendor, viewer, context: VENDOR_CONTEXT.PUBLIC })}
                onPreview={setSelectedVendor}
              />
            ))}
          </div>
        )}

        {!loading && !loadError && vendors.length === 0 && (
          <div className="text-center py-20 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
            <p className="text-on-surface-variant font-body-md">Our partner network is currently expanding. Check back soon!</p>
          </div>
        )}
      </main>

      <VendorModal
        isOpen={!!selectedVendor}
        entity={selectedVendor}
        access={selectedVendor ? buildVendorAccess({
          vendor: selectedVendor,
          viewer,
          context: VENDOR_CONTEXT.PUBLIC,
        }) : null}
        onClose={() => setSelectedVendor(null)}
        showPublicLink={Boolean(selectedVendor?.supplierId)}
      />

      <Footer />
    </div>
  );
}
