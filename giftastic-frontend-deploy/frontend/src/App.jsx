import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import HomePage from './pages/HomePage';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import GiftFlowStep from './pages/GiftFlowStep';
import GiftFlowCatalog from './pages/GiftFlowCatalog';
import UserDashboard from './pages/UserDashboard';
import VendorDashboard from './pages/VendorDashboard';
import UploadProduct from './pages/UploadProduct';
import EditProduct from './pages/EditProduct';
import VendorGiftFlows from './pages/VendorGiftFlows';
import VendorOrders from './pages/VendorOrders';
import VendorSettings from './pages/VendorSettings';
import VendorDeliveryPricing from './pages/VendorDeliveryPricing';
import VendorActivityDashboard from './pages/VendorActivityDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import VendorCatalog from './pages/VendorCatalog';
import VendorProfile from './pages/VendorProfile';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import UserProfile from './pages/UserProfile';
import Favorites from './pages/Favorites';
import Notifications from './pages/Notifications';
import PublicUserProfile from './pages/PublicUserProfile';
import AdminReports from './pages/AdminReports';
import ModeratorReviews from './pages/ModeratorReviews';
import MyReviews from './pages/MyReviews';
import VendorAnalytics from './pages/VendorAnalytics';
import BecomeVendor from './pages/BecomeVendor';
import MyVendorApplications from './pages/MyVendorApplications';
import AdminVendorApplications from './pages/AdminVendorApplications';
import BannedUser from './pages/BannedUser';
import VendorCommissions from './pages/VendorCommissions';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  // Sync auth state on app mount to ensure consistency
  useEffect(() => {
    const syncSession = useAuthStore.getState().syncSession;
    syncSession();
  }, []);

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Banned User Route */}
        <Route path="/banned" element={<BannedUser />} />
        
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductCatalog />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/gift-flow" element={<GiftFlowCatalog />} />
        <Route path="/vendors" element={<VendorCatalog />} />
        <Route path="/vendors/:supplierId" element={<VendorProfile />} />
        <Route path="/users/:userId" element={<PublicUserProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Customer Routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        <Route path="/guest-orders" element={<Orders />} />
        <Route path="/guest-orders/:orderId" element={<OrderDetails />} />
        <Route path="/gift-flow/:flowId" element={<GiftFlowStep />} />
        <Route path="/gift-flow/:flowId/customize" element={<GiftFlowStep />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/my-reviews" element={
          <ProtectedRoute>
            <MyReviews />
          </ProtectedRoute>
        } />
        
        {/* Vendor Application Routes */}
        <Route path="/become-vendor" element={
          <ProtectedRoute>
            <BecomeVendor />
          </ProtectedRoute>
        } />
        <Route path="/my-vendor-applications" element={
          <ProtectedRoute>
            <MyVendorApplications />
          </ProtectedRoute>
        } />
        
        {/* Protected Vendor Routes */}
        <Route path="/vendor/dashboard" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/vendor/products" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/vendor/products/new" element={
          <ProtectedRoute requiredRole="VENDOR">
            <UploadProduct />
          </ProtectedRoute>
        } />
        <Route path="/vendor/products/:id/edit" element={
          <ProtectedRoute requiredRole="VENDOR">
            <EditProduct />
          </ProtectedRoute>
        } />
        <Route path="/vendor/flows" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorGiftFlows />
          </ProtectedRoute>
        } />
        <Route path="/vendor/orders" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorOrders />
          </ProtectedRoute>
        } />
        <Route path="/vendor/profile" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorSettings />
          </ProtectedRoute>
        } />
        <Route path="/vendor/delivery-pricing" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorDeliveryPricing />
          </ProtectedRoute>
        } />
        <Route path="/vendor/activity" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorActivityDashboard />
          </ProtectedRoute>
        } />
        <Route path="/vendor/analytics" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/vendor/commissions" element={
          <ProtectedRoute requiredRole="VENDOR">
            <VendorCommissions />
          </ProtectedRoute>
        } />
        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute requiredRole={['SUPER_ADMIN', 'MANAGE_REPORTS']}>
            <AdminReports />
          </ProtectedRoute>
        } />
        <Route path="/admin/reviews" element={
          <ProtectedRoute requiredRole={['SUPER_ADMIN', 'VIEW_REVIEWS', 'MODERATE_REVIEWS', 'VIEW_VENDOR_FEEDBACK', 'MUTE_USERS']}>
            <ModeratorReviews />
          </ProtectedRoute>
        } />
        <Route path="/admin/vendor-applications" element={
          <ProtectedRoute requiredRole={['SUPER_ADMIN', 'MAKE_VENDORS', 'ACTIVATE_VENDORS']}>
            <AdminVendorApplications />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
