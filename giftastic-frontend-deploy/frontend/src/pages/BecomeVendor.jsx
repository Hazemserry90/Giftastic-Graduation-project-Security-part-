import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorApplicationService } from '../services/vendorApplicationService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import {
  createVendorApplicationDraft,
  mapVendorApplicationPayload,
  validateVendorApplicationDraft,
} from '../ui/commands/vendorApplication';

export default function BecomeVendor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => createVendorApplicationDraft({
    storeName: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    websiteUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    workingHours: ''
  }));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateVendorApplicationDraft(formData);
    if (!formData.storeName.trim() || !validation.valid) {
      toast.error(!formData.storeName.trim() ? 'Store name is required' : Object.values(validation.errors)[0]);
      return;
    }
    const mapped = mapVendorApplicationPayload(formData);
    if (!mapped.ok) {
      toast.error(Object.values(mapped.errors)[0]);
      return;
    }

    try {
      setLoading(true);
      await vendorApplicationService.submitApplication(mapped.payload);
      toast.success('Application submitted successfully!');
      navigate('/my-vendor-applications');
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-[#4B2C5E] mb-4">
              Become a Vendor
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Join our curated marketplace and share your unique products with customers across Alexandria
            </p>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
            <div className="space-y-6">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                  placeholder="Your Store Name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Store Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                  placeholder="Tell us about your store and products..."
                />
              </div>

              {/* Logo and Banner URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Banner URL
                  </label>
                  <input
                    type="url"
                    name="bannerUrl"
                    value={formData.bannerUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                    placeholder="contact@store.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                    placeholder="+20 xxx xxx xxxx"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Store Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                  placeholder="Street, City, Country"
                />
              </div>

              {/* Social Media */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Working Hours
                </label>
                <input
                  type="text"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#4B2C5E] focus:border-transparent"
                  placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#4B2C5E] text-white py-3 rounded-lg font-medium hover:bg-[#3d2450] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
