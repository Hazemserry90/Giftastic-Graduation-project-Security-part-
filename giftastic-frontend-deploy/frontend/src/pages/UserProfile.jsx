import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { userService } from '../services/userService';
import { adminRequestService } from '../services/adminRequestService';
import { useAuthStore } from '../store/useAuthStore';
import AdminRequestModal from '../components/modals/AdminRequestModal';
import VendorApplicationModal from '../components/modals/VendorApplicationModal';
import {
  AdminRequestSummary,
  buildAdminRequestAccess,
  getAdminRequestSubmissionState,
  ADMIN_REQUEST_CONTEXT,
} from '../ui/entities/adminRequest';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import {
  buildVendorApplicationAccess,
  VendorApplicationSummary,
  VENDOR_APPLICATION_CONTEXT,
} from '../ui/entities/vendorApplication';
import { buildUserAccess, getReadableUserField, USER_CONTEXT } from '../ui/entities/user';
import { commandDraftToPayload, createCommandDraft } from '../ui/commands';
import {
  getFullNameError,
  getStrictEgyptianPhoneError,
  normalizeFullName,
  sanitizeDigitsOnly,
  sanitizeFullName,
} from '../utils/contactValidation';

export default function UserProfile() {
  const viewer = useAuthStore((state) => state.viewer);
  const sessionUser = useAuthStore((state) => state.user);
  const [profileEntity, setProfileEntity] = useState(sessionUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    instapayRefundPhoneNumber: '',
    instapayRefundName: '',
    birthday: ''
  });

  const [addresses, setAddresses] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [vendorApplications, setVendorApplications] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [selectedAdminRequest, setSelectedAdminRequest] = useState(null);
  const [selectedVendorApplication, setSelectedVendorApplication] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchAdminRequests();
    fetchVendorApplications();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getMyProfile();
      const entity = adaptEntityFromNamedSource('adaptUserMe', profile);
      const access = buildUserAccess({ user: entity, viewer, context: USER_CONTEXT.EDIT });
      const read = (field) => getReadableUserField(entity, field, access.fields[field]).value;
      const savedRefundPhone = read('instapayRefundPhoneNumber') || '';
      const savedRefundName = read('instapayRefundName') || '';
      setProfileEntity(entity);

      setFormData({
        fullName: read('fullName') || '',
        phoneNumber: read('phoneNumber') || '',
        instapayRefundPhoneNumber: getStrictEgyptianPhoneError(savedRefundPhone, 'Refund phone number') ? '' : sanitizeDigitsOnly(savedRefundPhone),
        instapayRefundName: getFullNameError(savedRefundName, 'Refund name') ? '' : normalizeFullName(savedRefundName),
        birthday: read('birthday') || ''
      });
      setAddresses(read('addresses') || []);
    } catch (err) {
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminRequests = async () => {
    try {
      const requests = await adminRequestService.getMyRequests();
      setAdminRequests((requests || []).map((request) =>
        adaptEntityFromNamedSource('adaptAdminRequestDto', request)));
    } catch (err) {
      console.error('Failed to load admin requests:', err);
    }
  };

  const fetchVendorApplications = async () => {
    try {
      const { vendorApplicationService } = await import('../services/vendorApplicationService');
      const applications = await vendorApplicationService.getMyApplications();
      setVendorApplications((applications || []).map((application) =>
        adaptEntityFromNamedSource('adaptVendorApplicationResponse', application)));
    } catch (err) {
      console.error('Failed to load vendor applications:', err);
    }
  };

  const handleSubmitAdminRequest = async (e) => {
    e.preventDefault();
    
    const mapped = commandDraftToPayload('adminRequestSubmission', createCommandDraft('adminRequestSubmission', { message: requestMessage }));
    if (!mapped.ok) { setError(mapped.errors.message); return; }

    setSubmittingRequest(true);
    setError('');
    setSuccess('');
    try {
      await adminRequestService.submitRequest(mapped.payload);
      setSuccess('Admin request submitted successfully!');
      setShowRequestModal(false);
      setRequestMessage('');
      fetchAdminRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit admin request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const mapped = commandDraftToPayload('userProfile', createCommandDraft('userProfile', formData));
    if (!mapped.ok) { setError(Object.values(mapped.errors)[0]); return; }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updatedProfile = await userService.updateMyProfile({
        fullName: mapped.payload.fullName,
        phoneNumber: mapped.payload.phoneNumber,
        birthday: mapped.payload.birthday,
      });
      const updated = await userService.updateMyInstapayRefundDetails({
        instapayRefundPhoneNumber: mapped.payload.instapayRefundPhoneNumber,
        instapayRefundName: mapped.payload.instapayRefundName,
      });
      if (updated || updatedProfile) setProfileEntity(adaptEntityFromNamedSource('adaptUserMe', updated || updatedProfile));
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setAddresses([...addresses, { label: '', street: '', city: '', state: '', zipCode: '', country: '', isDefault: addresses.length === 0 }]);
  };

  const handleAddressChange = (index, field, value) => {
    const newAddresses = [...addresses];
    newAddresses[index][field] = value;
    setAddresses(newAddresses);
  };

  const handleRemoveAddress = (index) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleSaveAddresses = async () => {
    const mapped = commandDraftToPayload('userAddresses', createCommandDraft('userAddresses', { addresses }));
    if (!mapped.ok) { setError(Object.values(mapped.errors)[0]); return; }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await userService.updateMyAddresses(mapped.payload);
      if (updated) setProfileEntity(adaptEntityFromNamedSource('adaptUserMe', updated));
      setSuccess('Addresses saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save addresses.');
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

  const profileAccess = buildUserAccess({ user: profileEntity, viewer, context: USER_CONTEXT.EDIT });
  const profileEmail = getReadableUserField(profileEntity, 'email', profileAccess.fields.email).value;

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="font-display-xl text-display-xl text-primary mb-2">My Profile</h1>
          <p className="text-on-surface-variant font-body-lg">Manage your personal details and delivery addresses.</p>
        </header>

        {error && <div className="mb-6 p-4 bg-error/10 text-error rounded-xl animate-in fade-in duration-300">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-xl animate-in fade-in duration-300">{success}</div>}

        <div className="space-y-12">
          {/* Personal Information */}
          <section className="bg-white rounded-2xl shadow-plum border border-surface-variant/30 overflow-hidden">
            <div className="p-8 border-b border-surface-variant/10">
              <h3 className="font-headline-md text-primary">Personal Information</h3>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1">
                  <label className="block font-label-md text-on-surface-variant mb-2">Email Address</label>
                  <input
                    value={profileEmail || ''}
                    disabled
                    className="w-full px-4 py-3 border border-stone-100 bg-stone-50 rounded-xl outline-none cursor-not-allowed opacity-70"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block font-label-md text-on-surface-variant mb-2">Full Name</label>
                  <input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all"
                    placeholder="Your Full Name"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-2">Phone Number</label>
                  <input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all"
                    placeholder="+20 1XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-2">Instapay Refund Phone</label>
                  <input
                    value={formData.instapayRefundPhoneNumber}
                    onChange={(e) => setFormData({ ...formData, instapayRefundPhoneNumber: sanitizeDigitsOnly(e.target.value) })}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all"
                    placeholder="Refund phone number"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-2">Instapay Refund Name</label>
                  <input
                    value={formData.instapayRefundName}
                    onChange={(e) => setFormData({ ...formData, instapayRefundName: sanitizeFullName(e.target.value) })}
                    className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all"
                    placeholder="Refund account full name"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container active:scale-95 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </section>

          {/* Address Management */}
          <section className="bg-white rounded-2xl shadow-plum border border-surface-variant/30 overflow-hidden">
            <div className="p-8 border-b border-surface-variant/10 flex justify-between items-center">
              <h3 className="font-headline-md text-primary">Saved Addresses</h3>
              <button 
                onClick={handleAddAddress}
                className="flex items-center gap-2 text-primary font-bold text-sm"
              >
                <span className="material-symbols-outlined">add_location</span>
                Add New
              </button>
            </div>
            <div className="p-8 space-y-8">
              {addresses.length === 0 ? (
                <p className="text-center text-on-surface-variant italic py-4">No addresses saved yet.</p>
              ) : (
                addresses.map((addr, idx) => (
                  <div key={idx} className="p-6 border border-surface-variant/20 rounded-xl space-y-4 relative bg-stone-50/30">
                    <button 
                      onClick={() => handleRemoveAddress(idx)}
                      className="absolute top-4 right-4 text-error hover:scale-110 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-secondary mb-1">Label (e.g. Home)</label>
                        <input
                          value={addr.label}
                          onChange={(e) => handleAddressChange(idx, 'label', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-variant/20 rounded-lg text-sm focus:ring-1 focus:ring-primary/20 hover:border-primary/30 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-secondary mb-1">Street</label>
                        <input
                          value={addr.street}
                          onChange={(e) => handleAddressChange(idx, 'street', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-variant/20 rounded-lg text-sm focus:ring-1 focus:ring-primary/20 hover:border-primary/30 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-secondary mb-1">City</label>
                        <input
                          value={addr.city}
                          onChange={(e) => handleAddressChange(idx, 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-variant/20 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-secondary mb-1">Zip Code</label>
                        <input
                          value={addr.zipCode}
                          onChange={(e) => handleAddressChange(idx, 'zipCode', e.target.value)}
                          className="w-full px-3 py-2 border border-surface-variant/20 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
              {addresses.length > 0 && (
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveAddresses} 
                    disabled={saving} 
                    className="px-8 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 active:scale-95 transition-all shadow-lg shadow-secondary/10 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Addresses'}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Admin Requests Section */}
          <section className="bg-white rounded-2xl shadow-plum border border-surface-variant/30 overflow-hidden">
            <div className="p-8 border-b border-surface-variant/10 flex justify-between items-center">
              <div>
                <h3 className="font-headline-md text-primary">Admin Role Requests</h3>
                <p className="text-sm text-on-surface-variant mt-1">Request to become an admin or view your request history</p>
              </div>
              {(() => {
                const requestStatus = getAdminRequestSubmissionState(adminRequests);
                return (
                  <button 
                    onClick={() => setShowRequestModal(true)}
                    disabled={!requestStatus.canSubmit}
                    className="flex items-center gap-2 text-primary font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    title={!requestStatus.canSubmit ? requestStatus.reason : 'Submit a new admin request'}
                  >
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                    Request Admin Role
                  </button>
                );
              })()}
            </div>
            <div className="p-8">
              {adminRequests.length === 0 ? (
                <p className="text-center text-on-surface-variant italic py-4">No admin requests submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {adminRequests.map((request) => (
                    <AdminRequestSummary
                      key={request.id}
                      request={request}
                      access={buildAdminRequestAccess({
                        request,
                        viewer,
                        context: ADMIN_REQUEST_CONTEXT.SELF,
                      })}
                      onSelect={setSelectedAdminRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Vendor Applications Section */}
          <section className="bg-white rounded-2xl shadow-plum border border-surface-variant/30 overflow-hidden">
            <div className="p-8 border-b border-surface-variant/10 flex justify-between items-center">
              <div>
                <h3 className="font-headline-md text-primary">Vendor Applications</h3>
                <p className="text-sm text-on-surface-variant mt-1">Apply to become a vendor or view your application history</p>
              </div>
              <button 
                onClick={() => window.location.href = '/become-vendor'}
                className="flex items-center gap-2 text-primary font-bold text-sm hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined">storefront</span>
                Apply to Become Vendor
              </button>
            </div>
            <div className="p-8">
              {vendorApplications.length === 0 ? (
                <p className="text-center text-on-surface-variant italic py-4">No vendor applications submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {vendorApplications.map((app) => (
                    <VendorApplicationSummary
                      key={app.id}
                      application={app}
                      access={buildVendorApplicationAccess({
                        application: app,
                        viewer,
                        context: VENDOR_APPLICATION_CONTEXT.SELF,
                      })}
                      onSelect={setSelectedVendorApplication}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Admin Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-surface-variant/10 flex justify-between items-center">
              <h3 className="font-headline-md text-primary">Request Admin Role</h3>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitAdminRequest} className="p-8 space-y-6">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-2">
                  Why do you want to become an admin? (50-1000 characters)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all resize-none"
                  placeholder="Explain your qualifications, experience, and why you would be a good admin..."
                />
                <p className="text-sm text-on-surface-variant mt-2">
                  {requestMessage.length} / 1000 characters {requestMessage.length < 50 && `(minimum 50)`}
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-3 border border-surface-variant/30 text-on-surface rounded-xl font-bold hover:bg-stone-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingRequest || requestMessage.trim().length < 50}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container active:scale-95 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminRequestModal
        isOpen={!!selectedAdminRequest}
        entity={selectedAdminRequest}
        access={selectedAdminRequest ? buildAdminRequestAccess({
          request: selectedAdminRequest,
          viewer,
          context: ADMIN_REQUEST_CONTEXT.SELF,
        }) : null}
        onClose={() => setSelectedAdminRequest(null)}
      />
      <VendorApplicationModal
        isOpen={!!selectedVendorApplication}
        entity={selectedVendorApplication}
        access={selectedVendorApplication ? buildVendorApplicationAccess({
          application: selectedVendorApplication,
          viewer,
          context: VENDOR_APPLICATION_CONTEXT.SELF,
        }) : null}
        onClose={() => setSelectedVendorApplication(null)}
      />

      <Footer />
    </div>
  );
}
