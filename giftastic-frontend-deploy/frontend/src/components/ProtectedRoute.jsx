import { Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { adminService } from '../services/adminService';
import { vendorService } from '../services/vendorService';
import { ADMIN_PERMISSION_SET, viewerHasCapability } from '../ui/entities/shared';
import { buildUserAccess, isUserBanned, USER_CONTEXT } from '../ui/entities/user';

export default function ProtectedRoute({ children, requiredRole }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const hydrateAdminFacet = useAuthStore((state) => state.hydrateAdminFacet);
  const requirements = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const requiresAdminProfile = requirements.some((requirement) =>
    requirement === 'ADMIN' || requirement === 'SUPER_ADMIN' || ADMIN_PERMISSION_SET.has(requirement));
  const requiresActiveVendor = requirements.includes('VENDOR');
  const [checkingAdminProfile, setCheckingAdminProfile] = useState(requiresAdminProfile);
  const [checkingVendorProfile, setCheckingVendorProfile] = useState(requiresActiveVendor);
  const [vendorIsActive, setVendorIsActive] = useState(!requiresActiveVendor);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !requiresAdminProfile) {
      setCheckingAdminProfile(false);
      return () => { active = false; };
    }

    setCheckingAdminProfile(true);
    adminService.getMyAdminProfile()
      .then((profile) => {
        if (active) hydrateAdminFacet(profile);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingAdminProfile(false);
      });
    return () => { active = false; };
  }, [isAuthenticated, requiresAdminProfile, hydrateAdminFacet]);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !requiresActiveVendor) {
      setCheckingVendorProfile(false);
      setVendorIsActive(true);
      return () => { active = false; };
    }

    setCheckingVendorProfile(true);
    vendorService.getMyVendorProfile()
      .then((profile) => {
        if (!active) return;
        setVendorIsActive(profile?.isVerified === true || profile?.verified === true);
      })
      .catch(() => {
        if (active) setVendorIsActive(false);
      })
      .finally(() => {
        if (active) setCheckingVendorProfile(false);
      });
    return () => { active = false; };
  }, [isAuthenticated, requiresActiveVendor]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (checkingAdminProfile || checkingVendorProfile) {
    return <div role="status" className="flex min-h-screen items-center justify-center">Checking permissions...</div>;
  }

  // Check if user is banned - but don't redirect if already on banned page
  const userAccess = buildUserAccess({ user, viewer, context: USER_CONTEXT.SELF });
  if (isUserBanned(user, userAccess) && !window.location.pathname.includes('/banned')) {
    return <Navigate to="/banned" replace />;
  }

  if (!viewerHasCapability(viewer, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  if (requiresActiveVendor && !vendorIsActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <section className="max-w-lg rounded-xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-amber-600" aria-hidden="true">pending_actions</span>
          <h1 className="mt-3 text-2xl font-bold text-primary">Vendor portal unavailable</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Your vendor profile is currently inactive. This can happen while your application is still being reviewed, or if Giftastic has deactivated vendor access for this account.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/my-vendor-applications" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">
              View application status
            </Link>
            <Link to="/" className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-primary">
              Back home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return children;
}
