import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { productService } from '../services/productService';
import { getFriendlyErrorMessage } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import VendorSidebar from '../components/VendorSidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductModal from '../components/modals/ProductModal';
import DiscountManager from '../components/DiscountManager';
import {
  buildProductAccess,
  buildProductActions,
  getProductInventoryStats,
  ProductInventoryRow,
  PRODUCT_CONTEXT,
} from '../ui/entities/product';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { patchEntityModel } from '../ui/entities/shared';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, viewer } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [discountProduct, setDiscountProduct] = useState(null);

  useEffect(() => {
    if (!viewer.supplierId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    fetchProducts();
  }, [viewer.supplierId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await productService.getVendorProducts();
      setProducts((Array.isArray(response) ? response : []).map((product) =>
        adaptEntityFromNamedSource('adaptProductDomain', product)));
    } catch {
      setProducts([]);
      setLoadError('We could not load your inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not delete this product. Please try again.'));
    }
  };

  const handleRequestReview = async (product) => {
    if (!viewer.supplierId) {
      toast.error('Vendor profile is not active yet.');
      return;
    }
    const message = window.prompt('Optional message for Super Admin about why this product should be reactivated:');
    if (message === null) return;
    const reviewPatch = {
      status: 'PENDING_APPROVAL',
      reviewRequestStatus: 'PENDING',
      reviewRequestedFromStatus: product.status,
      reviewRequestedAt: new Date().toISOString(),
      reviewRequestMessage: message.trim() || null,
      reviewRejectionReason: null,
    };

    try {
      await productService.submitForApproval(product.id, viewer.supplierId, message.trim() || null);
      setProducts((current) => current.map((item) => (
        item.id === product.id ? patchEntityModel(item, reviewPatch) : item
      )));
      setSelectedProduct((current) => (
        current?.id === product.id ? patchEntityModel(current, reviewPatch) : current
      ));
      toast.success('Product sent for review.');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not send this product for review. Please try again.'));
    }
  };

  const inventoryStats = getProductInventoryStats(products);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-w-0 flex-col md:flex-row">
        <VendorSidebar />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-12">
          <header className="mb-8 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
                Ahlan, {user?.fullName}
              </h2>
              <p className="font-body-lg text-body-lg text-secondary">
                Hereâ€™s the inventory tied to your vendor profile.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link to="/vendor/flows" className="flex items-center gap-2 px-6 py-3 border border-outline rounded-lg font-label-md active:scale-98 transition-transform">
                <span className="material-symbols-outlined">auto_awesome</span>
                Gift Flows
              </Link>
              <Link to="/vendor/products/new" className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md active:scale-98 transition-transform">
                <span className="material-symbols-outlined">add</span>
                New Product
              </Link>
            </div>
          </header>

          {/* Summary Cards */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-4 lg:mb-12 lg:gap-8">
            <div className="col-span-1 rounded-xl border border-surface-variant/30 bg-white p-5 shadow-plum sm:p-8 md:col-span-2">
              <span className="font-label-sm text-secondary uppercase tracking-widest mb-4 block">
                Total Products
              </span>
              <h3 className="font-display-xl text-display-xl text-primary">{inventoryStats.total}</h3>
              <div className="mt-6 flex items-center gap-2 text-emerald-600 font-label-md">
                <span className="material-symbols-outlined">inventory_2</span>
                <span>{inventoryStats.approved} approved and visible in the store</span>
              </div>
            </div>
            <div className="rounded-xl border border-surface-variant/30 bg-white p-5 shadow-plum sm:p-8">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container mb-6">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <span className="font-label-sm text-secondary uppercase tracking-widest mb-2 block">
                Pending Review
              </span>
              <h3 className="font-headline-lg text-headline-lg text-primary">{inventoryStats.pending}</h3>
            </div>
            <div className="rounded-xl border border-surface-variant/30 bg-white p-5 shadow-plum sm:p-8">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-6">
                <span className="material-symbols-outlined">draft</span>
              </div>
              <span className="font-label-sm text-secondary uppercase tracking-widest mb-2 block">
                Drafts
              </span>
              <h3 className="font-headline-lg text-headline-lg text-primary">{inventoryStats.drafts}</h3>
            </div>
          </section>

          {/* Product Table */}
          <section className="bg-white rounded-xl shadow-plum border border-surface-variant/30 overflow-hidden">
            <div className="px-8 py-6 border-b border-surface-variant/10 flex justify-between items-center">
              <h4 className="font-headline-md text-headline-md text-primary">Current Inventory</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-surface-container-low text-on-surface-variant font-label-sm">
                  <tr>
                    <th className="px-8 py-4 font-semibold uppercase">Product</th>
                    <th className="px-8 py-4 font-semibold uppercase">Categories</th>
                    <th className="px-8 py-4 font-semibold uppercase">Price</th>
                    <th className="px-8 py-4 font-semibold uppercase">Status</th>
                    <th className="px-8 py-4 font-semibold uppercase">Updated</th>
                    <th className="px-8 py-4 font-semibold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/10">
                  {loading ? (
                    <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                  ) : loadError ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-error">
                        {loadError}
                        <button type="button" onClick={fetchProducts} className="ml-3 font-semibold underline">
                          Try again
                        </button>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8">No products yet</td></tr>
                  ) : (
                    products.map((product) => {
                      const access = buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.OWNER_MANAGEMENT });
                      const actions = buildProductActions({
                        product,
                        access,
                        handlers: {
                          delete: () => handleDelete(product.id),
                          requestReview: () => handleRequestReview(product),
                        },
                      });
                      return (
                        <ProductInventoryRow
                          key={product.id}
                          product={product}
                          access={access}
                          actions={actions}
                          onDetails={setSelectedProduct}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      <ProductModal
        isOpen={!!selectedProduct}
        entity={selectedProduct}
        access={selectedProduct ? buildProductAccess({
          product: selectedProduct,
          viewer,
          context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
        }) : null}
        actions={selectedProduct ? buildProductActions({
          product: selectedProduct,
          access: buildProductAccess({
            product: selectedProduct,
            viewer,
            context: PRODUCT_CONTEXT.OWNER_MANAGEMENT,
          }),
          handlers: {
            manageDiscount: () => setDiscountProduct(selectedProduct),
            requestReview: () => handleRequestReview(selectedProduct),
            delete: () => handleDelete(selectedProduct.id),
          },
        }) : []}
        onClose={() => setSelectedProduct(null)}
        showPublicLink={Boolean(selectedProduct?.id)}
      />
      {discountProduct && (
        <DiscountManager
          productId={discountProduct.id}
          currentDiscount={discountProduct}
          initiallyOpen
          onClose={() => setDiscountProduct(null)}
          onUpdate={() => {
            setDiscountProduct(null);
            fetchProducts();
          }}
        />
      )}
      <Footer />
    </div>
  );
}
