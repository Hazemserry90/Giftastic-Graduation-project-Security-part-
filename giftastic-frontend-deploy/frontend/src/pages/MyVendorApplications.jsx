import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorApplicationModal from '../components/modals/VendorApplicationModal';
import { vendorApplicationService } from '../services/vendorApplicationService';
import { useAuthStore } from '../store/useAuthStore';
import {
  buildVendorApplicationAccess,
  VendorApplicationSummary,
  VENDOR_APPLICATION_CONTEXT,
} from '../ui/entities/vendorApplication';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';

export default function MyVendorApplications() {
  const viewer = useAuthStore((state) => state.viewer);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await vendorApplicationService.getMyApplications();
        setApplications(data.map((application) => adaptEntityFromNamedSource('adaptVendorApplicationResponse', application)));
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B2C5E]" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4B2C5E] mb-2">My Vendor Applications</h1>
              <p className="text-stone-600">Track the status of your vendor applications</p>
            </div>
            {applications.length === 0 && (
              <Link
                to="/become-vendor"
                className="px-6 py-3 bg-[#4B2C5E] text-white rounded-lg font-medium hover:bg-[#3d2450] transition"
              >
                Apply Now
              </Link>
            )}
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">store</span>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">No Applications Yet</h3>
              <p className="text-stone-600 mb-6">Start your journey as a Vendor by submitting an application</p>
              <Link
                to="/become-vendor"
                className="inline-block px-6 py-3 bg-[#4B2C5E] text-white rounded-lg font-medium hover:bg-[#3d2450] transition"
              >
                Become a Vendor
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <VendorApplicationSummary
                  key={application.id}
                  application={application}
                  access={buildVendorApplicationAccess({
                    application,
                    viewer,
                    context: VENDOR_APPLICATION_CONTEXT.SELF,
                  })}
                  onSelect={setSelectedApplication}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <VendorApplicationModal
        isOpen={Boolean(selectedApplication)}
        entity={selectedApplication}
        access={selectedApplication ? buildVendorApplicationAccess({
          application: selectedApplication,
          viewer,
          context: VENDOR_APPLICATION_CONTEXT.SELF,
        }) : null}
        onClose={() => setSelectedApplication(null)}
      />
      <Footer />
    </div>
  );
}
