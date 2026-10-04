import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReportButton from '../components/ReportButton';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import GiftFlowModalController from '../components/controllers/GiftFlowModalController';
import { productService } from '../services/productService';
import { giftFlowService } from '../services/giftFlowService';
import { favoriteService } from '../services/favoriteService';
import { getFriendlyErrorMessage } from '../services/api';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { buildProductAccess, getProductImageWithFallback, PRODUCT_CONTEXT, ProductPublicDetails } from '../ui/entities/product';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { buildFavoriteAccess, buildFavoriteToggleAction } from '../ui/entities/favorite';
import { buildGiftFlowAccess, GiftFlowReferenceButton } from '../ui/entities/giftFlow';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [productFlows, setProductFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const addingToCartRef = useRef(false);
  const { addToCart } = useCartStore();
  const { user, viewer, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchProduct();
    checkFavoriteStatus();
  }, [id, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProductById(id);
      const model = adaptEntityFromNamedSource('adaptProductDomain', data);
      setProduct(model);

      if (model.supplierId) {
        const flows = await giftFlowService.getFlowsByVendor(model.supplierId);
        const matchingFlows = (flows || [])
          .map((flow) => adaptEntityFromNamedSource('adaptGiftFlowResponse', flow))
          .filter((flow) => flow.productIds.includes(model.id));
        setProductFlows(matchingFlows);
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not load this product. Please refresh and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favorites = await favoriteService.getFavorites();
      setFavorite(favorites
        .map((record) => adaptEntityFromNamedSource('adaptFavoriteLegacyRecord', record))
        .find((record) => buildFavoriteAccess({ favorite: record, viewer }).canRead && record.productId === id) || null);
    } catch {
      setFavorite(null);
    }
  };

  const handleAddToCart = async () => {
    if (addingToCartRef.current) return;
    addingToCartRef.current = true;
    setAddingToCart(true);
    try {
      const added = await addToCart(user?.id, product.id, quantity);
      if (added !== false) {
        toast.success('Added to cart!');
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not add this product to your cart. Please try again.'));
    } finally {
      addingToCartRef.current = false;
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const action = buildFavoriteToggleAction({
        favorite,
        access: favorite ? buildFavoriteAccess({ favorite, viewer }) : null,
        target: { type: 'product', id: product.id },
        viewer,
        handlers: {
          remove: async () => { await favoriteService.removeProductFavorite(product.id); setFavorite(null); toast.success('Removed from favorites'); },
          add: async () => { const created = await favoriteService.addProductFavorite(product.id); setFavorite(adaptEntityFromNamedSource('adaptFavoriteLegacyRecord', created)); toast.success('Added to favorites'); },
        },
      });
      await action?.onSelect();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not update your favorites. Please try again.'));
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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-on-surface-variant">Product not found</p>
        </div>
        <Footer />
      </div>
    );
  }
  const access = buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.PUBLIC });
  const stockQuantity = Number.isFinite(Number(product.stockQuantity))
    ? Math.max(0, Math.floor(Number(product.stockQuantity)))
    : null;
  const inStock = stockQuantity === null || stockQuantity > 0;
  const canIncreaseQuantity = stockQuantity === null || quantity < stockQuantity;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-12 lg:py-16 flex-grow">
        <ProductPublicDetails
          product={product}
          access={access}
          imageFallback={getProductImageWithFallback(product)}
          favoriteAction={(
            <button
                onClick={handleToggleFavorite}
                className={`p-3 rounded-full shadow-lg transition-all transform active:scale-90 ${
                  favorite ? 'bg-error text-white' : 'bg-white text-on-surface hover:text-error'
                }`}
              >
                <Heart className={`w-6 h-6 ${favorite ? 'fill-current' : ''}`} />
              </button>
          )}
          reportAction={(
            <ReportButton
                    entityType="PRODUCT" 
                    entityId={product.id} 
                    entityName={product.name} 
                  />
          )}
          relatedFlows={productFlows.length > 0 ? (
                <div className="bg-surface-container-low rounded-lg p-4 space-y-3">
                  <p className="font-label-md text-primary">Also available in gift flows</p>
                  <div className="flex flex-wrap gap-2">
                    {productFlows.map((flow) => (
                      <GiftFlowReferenceButton
                        key={flow.id}
                        flow={flow}
                        access={buildGiftFlowAccess({ flow, viewer })}
                        onSelect={setSelectedFlow}
                      />
                    ))}
                  </div>
                </div>
          ) : null}
          quantityControl={(
              <div className="flex items-center gap-4">
                <label className="font-label-md text-on-surface">Quantity:</label>
                <div className="flex items-center border border-outline-variant rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-surface-container transition-colors"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-outline-variant">{quantity}</span>
                  <button 
                    onClick={() => setQuantity((current) => stockQuantity === null ? current + 1 : Math.min(stockQuantity, current + 1))}
                    disabled={!canIncreaseQuantity}
                    className="px-4 py-2 hover:bg-surface-container transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                {stockQuantity !== null && (
                  <span className="text-sm text-on-surface-variant">Available: {stockQuantity}</span>
                )}
              </div>
          )}
          primaryAction={(
            <div className="flex flex-col space-y-4 pt-6">
              <button 
                onClick={handleAddToCart}
                disabled={!access.canRead || addingToCart || !inStock}
                className="bg-primary text-on-primary font-label-md py-4 rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex justify-center items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">shopping_bag</span>
                <span>{addingToCart ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>
            </div>
          )}
        />

        {/* Reviews Section */}
        <div className="mt-16 space-y-8">
          {isAuthenticated && !showReviewForm && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-[#341547] text-white py-3 px-8 rounded-lg font-plus-jakarta font-semibold hover:bg-[#4b2c5e] active:scale-[0.98] transition-all"
              >
                Write a Review
              </button>
            </div>
          )}

          {showReviewForm && (
            <ReviewForm
              entityId={product.id}
              reviewType="PRODUCT"
              onSuccess={() => {
                setShowReviewForm(false);
                toast.success('Review submitted successfully!');
                fetchProduct();
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          <ReviewList entityId={product.id} reviewType="PRODUCT" />
        </div>
      </main>

      <GiftFlowModalController
        isOpen={!!selectedFlow}
        flow={selectedFlow}
        viewer={viewer}
        onClose={() => setSelectedFlow(null)}
        showPublicLink={Boolean(selectedFlow?.id)}
      />

      <Footer />
    </div>
  );
}
