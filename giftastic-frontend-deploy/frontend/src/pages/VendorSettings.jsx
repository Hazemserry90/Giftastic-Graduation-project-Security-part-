import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorSidebar from '../components/VendorSidebar';
import { vendorService } from '../services/vendorService';
import { useAuthStore } from '../store/useAuthStore';
import VendorModal from '../components/modals/VendorModal';
import { buildVendorAccess, VENDOR_CONTEXT } from '../ui/entities/vendor';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { createVendorProfileDraft, mapVendorProfilePayload } from '../ui/commands/vendorProfile';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function VendorSettings() {
  const { viewer } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendorRecord, setVendorRecord] = useState(null);
  const [showEntityPreview, setShowEntityPreview] = useState(false);
  const [profileImages, setProfileImages] = useState([]);
  const [uploadingType, setUploadingType] = useState('');
  
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [myProfile, images] = await Promise.all([
        vendorService.getMyVendorProfile(),
        vendorService.getMyProfileImages().catch(() => []),
      ]);
      if (myProfile) {
        setVendorRecord(adaptEntityFromNamedSource('adaptVendorMe', myProfile));
        setProfileImages(images || []);
        setFormData({
          storeName: myProfile.storeName || '',
          description: myProfile.description || '',
          logoUrl: myProfile.logoUrl || '',
          bannerUrl: myProfile.bannerUrl || '',
          contactEmail: myProfile.contactEmail || '',
          contactPhone: myProfile.contactPhone || '',
          address: myProfile.address || '',
          websiteUrl: myProfile.websiteUrl || '',
          instagramUrl: myProfile.instagramUrl || '',
          facebookUrl: myProfile.facebookUrl || '',
          workingHours: myProfile.workingHours || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setVendorRecord(null);
      setLoadError('We could not load your boutique profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.name === 'contactPhone'
      ? e.target.value.replace(/\D/g, '')
      : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const uploadProfileImage = async (type, file) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('Only JPG, JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }

    setError('');
    setSuccess('');
    setUploadingType(type);
    try {
      const uploaded = await vendorService.uploadProfileImage(type, file);
      setProfileImages((current) => [...current, uploaded]);
      if (type === 'LOGO') setFormData((current) => ({ ...current, logoUrl: uploaded.url }));
      if (type === 'BANNER') setFormData((current) => ({ ...current, bannerUrl: uploaded.url }));
      setSuccess('Image uploaded successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to upload image.');
    } finally {
      setUploadingType('');
    }
  };

  const deleteProfileImage = async (imageId) => {
    setError('');
    setSuccess('');
    try {
      await vendorService.deleteProfileImage(imageId);
      await fetchProfile();
      setSuccess('Image deleted successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete image.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const mapped = mapVendorProfilePayload(createVendorProfileDraft(formData));
      if (!mapped.ok) {
        const [field, message] = Object.entries(mapped.errors)[0];
        const labels = {
          storeName: 'Store name',
          logoUrl: 'Logo URL',
          bannerUrl: 'Banner URL',
          websiteUrl: 'Website',
          instagramUrl: 'Instagram',
          facebookUrl: 'Facebook page',
        };
        throw new Error(`${labels[field] || field}: ${message}`);
      }
      const updated = await vendorService.updateVendorProfile(mapped.payload);
      setVendorRecord(adaptEntityFromNamedSource('adaptVendorMe', updated));
      setFormData((current) => ({
        ...current,
        logoUrl: updated.logoUrl || '',
        bannerUrl: updated.bannerUrl || '',
        websiteUrl: updated.websiteUrl || '',
        instagramUrl: updated.instagramUrl || '',
        facebookUrl: updated.facebookUrl || '',
      }));
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="flex min-w-0 flex-col md:flex-row">
        <VendorSidebar />
        
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-12">
          <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display-xl text-display-xl text-primary mb-2">Boutique Profile</h1>
              <p className="text-on-surface-variant font-body-lg">Manage your public presence and operational details.</p>
            </div>
            {vendorRecord && (
              <button
                type="button"
                onClick={() => setShowEntityPreview(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5"
              >
                <span className="material-symbols-outlined">visibility</span>
                Preview Vendor Entity
              </button>
            )}
          </header>

          <div className="max-w-4xl">
            {loadError && (
              <div className="mb-6 rounded-xl border border-error/20 bg-error/10 p-4 text-error">
                <p>{loadError}</p>
                <button type="button" onClick={fetchProfile} className="mt-3 font-semibold underline">
                  Try again
                </button>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined">check_circle</span>
                {success}
              </div>
            )}

            {!loadError && <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-plum border border-surface-variant/30 overflow-hidden">
              <div className="p-8 space-y-12">
                {/* Store Identity */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-surface-variant/10 pb-4">
                    <span className="material-symbols-outlined text-primary">storefront</span>
                    <h3 className="font-headline-md text-primary">Store Identity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block font-label-md text-on-surface-variant mb-2">Store Name</label>
                      <input
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-label-md text-on-surface-variant mb-2">About the Boutique</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        placeholder="Tell your customers about your story and products..."
                      />
                    </div>
                  </div>
                </section>

                {/* Brand Visuals */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-surface-variant/10 pb-4">
                    <span className="material-symbols-outlined text-primary">image</span>
                    <h3 className="font-headline-md text-primary">Brand Visuals</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <VendorImageUploadSlot
                      label="Logo"
                      type="LOGO"
                      images={profileImages.filter((image) => image.type === 'LOGO')}
                      uploading={uploadingType === 'LOGO'}
                      onUpload={uploadProfileImage}
                      onDelete={deleteProfileImage}
                    />
                    <VendorImageUploadSlot
                      label="Banner"
                      type="BANNER"
                      images={profileImages.filter((image) => image.type === 'BANNER')}
                      uploading={uploadingType === 'BANNER'}
                      onUpload={uploadProfileImage}
                      onDelete={deleteProfileImage}
                    />
                    <VendorImageUploadSlot
                      label="Gallery"
                      type="GALLERY"
                      images={profileImages.filter((image) => image.type === 'GALLERY')}
                      uploading={uploadingType === 'GALLERY'}
                      onUpload={uploadProfileImage}
                      onDelete={deleteProfileImage}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant">JPG, PNG, or WebP. Up to 8 store/profile images total, 10 MB each.</p>
                </section>

                {/* Operations & Social */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-surface-variant/10 pb-4">
                    <span className="material-symbols-outlined text-primary">public</span>
                    <h3 className="font-headline-md text-primary">Operations & Social Presence</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block font-label-md text-on-surface-variant mb-2">Working Hours</label>
                      <input
                        name="workingHours"
                        value={formData.workingHours}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="e.g. Mon-Fri: 9AM - 10PM, Sat: 10AM - 6PM"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-2">Official Website</label>
                      <input
                        name="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="https://www.yourstore.com"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-2">Instagram Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">@</span>
                        <input
                          name="instagramUrl"
                          value={formData.instagramUrl}
                          onChange={handleChange}
                          className="w-full pl-8 pr-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                          placeholder="username"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-2">Facebook Page</label>
                      <input
                        name="facebookUrl"
                        value={formData.facebookUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="https://facebook.com/yourstore"
                      />
                    </div>
                  </div>
                </section>

                {/* Contact & Support */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-surface-variant/10 pb-4">
                    <span className="material-symbols-outlined text-primary">contact_support</span>
                    <h3 className="font-headline-md text-primary">Contact & Support</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-2">Contact Email</label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-label-md text-on-surface-variant mb-2">Business Address</label>
                      <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="bg-surface-container-low p-8 border-t border-surface-variant/10 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-12 py-4 bg-primary text-on-primary rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving Changes...' : 'Update Profile'}
                </button>
              </div>
            </form>}
          </div>
        </main>
      </div>
      <VendorModal
        isOpen={showEntityPreview}
        entity={vendorRecord}
        access={vendorRecord ? buildVendorAccess({
          vendor: vendorRecord,
          viewer,
          context: VENDOR_CONTEXT.OWNER_MANAGEMENT,
        }) : null}
        title="Vendor Entity Preview"
        showPublicLink={Boolean(vendorRecord?.supplierId)}
        onClose={() => setShowEntityPreview(false)}
      />
      <Footer />
    </div>
  );
}

function VendorImageUploadSlot({ label, type, images, uploading, onUpload, onDelete }) {
  return (
    <div className="rounded-xl border border-surface-variant/30 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-label-md text-primary">{label}</span>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-primary/30 bg-white px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5">
          <span className="material-symbols-outlined text-sm">upload</span>
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              onUpload(type, event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
      </div>
      <div className="space-y-3">
        {images.length === 0 && (
          <div className="flex aspect-video items-center justify-center rounded-lg bg-white text-sm text-on-surface-variant">
            No image
          </div>
        )}
        {images.map((image) => (
          <div key={image.id} className="overflow-hidden rounded-lg border border-white bg-white">
            <div className="aspect-video">
              <img src={image.url} alt={`${label} image`} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="truncate text-xs text-on-surface-variant">{image.filename || label}</span>
              <button type="button" onClick={() => onDelete(image.id)} className="text-error">
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
