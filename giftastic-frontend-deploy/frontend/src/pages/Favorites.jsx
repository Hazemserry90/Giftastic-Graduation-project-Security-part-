import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GiftFlowModalController from '../components/controllers/GiftFlowModalController';
import { favoriteService } from '../services/favoriteService';
import { getFriendlyErrorMessage } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  buildFavoriteAccess,
  FavoriteRemoveButton,
  getFavoriteTarget,
  isValidFavorite,
} from '../ui/entities/favorite';
import {
  buildGiftFlowAccess,
  GiftFlowSummary,
  GIFT_FLOW_CONTEXT,
} from '../ui/entities/giftFlow';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { buildProductAccess, ProductSummary, PRODUCT_CONTEXT } from '../ui/entities/product';
import { authorizeEntityHydration, hydrateEntitiesById } from '../ui/entities/shared/productionHydration';

export default function Favorites() {
  const { viewer } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [flows, setFlows] = useState([]);
  const [favoriteByTarget, setFavoriteByTarget] = useState(new Map());
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [viewer?.isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoriteService.getFavorites();
      
      const favorites = data
        .map((favorite) => adaptEntityFromNamedSource('adaptFavoriteLegacyRecord', favorite))
        .filter((favorite) => isValidFavorite(favorite)
          && buildFavoriteAccess({ favorite, viewer }).canRead);
      const targets = favorites.map(getFavoriteTarget);
      setFavoriteByTarget(new Map(favorites.map((favorite) => {
        const target = getFavoriteTarget(favorite);
        return [`${target.type}:${target.id}`, favorite];
      })));
      const productIds = targets.filter((target) => target.type === 'product').map((target) => target.id);
      const flowIds = targets.filter((target) => target.type === 'giftFlow').map((target) => target.id);

      const [productDetails, flowDetails] = await Promise.all([
        hydrateEntitiesById('product', productIds, {
          authorized: productIds.every((id) => authorizeEntityHydration('product', { id, viewer })),
        }),
        hydrateEntitiesById('giftFlow', flowIds, {
          authorized: flowIds.every((id) => authorizeEntityHydration('giftFlow', { id, viewer })),
        })
      ]);
      
      setProducts(productDetails);
      setFlows(flowDetails);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not load your favorites. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (productId) => {
    try {
      await favoriteService.removeProductFavorite(productId);
      setProducts(products.filter(p => p.id !== productId));
      setFavoriteByTarget((current) => {
        const next = new Map(current);
        next.delete(`product:${productId}`);
        return next;
      });
      toast.success('Removed product from favorites');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not remove this favorite. Please try again.'));
    }
  };

  const removeFlow = async (flowId) => {
    try {
      await favoriteService.removeFlowFavorite(flowId);
      setFlows(flows.filter(f => f.id !== flowId));
      setFavoriteByTarget((current) => {
        const next = new Map(current);
        next.delete(`giftFlow:${flowId}`);
        return next;
      });
      toast.success('Removed flow from favorites');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not remove this favorite. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-error fill-error" />
            <h1 className="font-display-xl text-headline-lg text-primary">My Favorites</h1>
          </div>
          <p className="font-body-md text-on-surface-variant max-w-2xl">
            Keep track of the gifts and journeys you love. Your personal collection of artisanal treasures.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-16">
            {(products.length === 0 && flows.length === 0) ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-outline-variant shadow-sm">
                <div className="bg-error/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-error/30" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Your wishlist is empty</h3>
                <p className="text-on-surface-variant font-body-md mb-8 max-w-sm mx-auto">Found something you like? Click the heart icon to save it here.</p>
                <Link to="/products" className="bg-primary text-on-primary px-10 py-3 rounded-xl font-label-md hover:bg-primary-container transition-all shadow-lg shadow-primary/20">
                  Explore Collection
                </Link>
              </div>
            ) : (
              <>
                {/* Favorited Flows */}
                {flows.length > 0 && (
                  <section>
                    <h2 className="font-headline-md text-primary mb-8 flex items-center gap-2">
                      Gift Journeys
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{flows.length}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {flows.map((flow) => (
                        <GiftFlowSummary
                          key={flow.id}
                          flow={flow}
                          access={buildGiftFlowAccess({ flow, viewer, context: GIFT_FLOW_CONTEXT.PUBLIC })}
                          to={`/gift-flow/${flow.id}`}
                          onPreview={setSelectedFlow}
                          favoriteAction={(
                            <FavoriteRemoveButton
                              favorite={favoriteByTarget.get(`giftFlow:${flow.id}`)}
                              access={buildFavoriteAccess({
                                favorite: favoriteByTarget.get(`giftFlow:${flow.id}`),
                                viewer,
                              })}
                              onRemove={() => removeFlow(flow.id)}
                              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-error shadow-sm hover:bg-error hover:text-white"
                            />
                          )}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Favorited Products */}
                {products.length > 0 && (
                  <section>
                    <h2 className="font-headline-md text-primary mb-8 flex items-center gap-2">
                      Individual Gifts
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{products.length}</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {products.map((product) => (
                        <ProductSummary
                          key={product.id}
                          product={product}
                          access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.PUBLIC })}
                          to={`/products/${product.id}`}
                          action={(
                            <FavoriteRemoveButton
                              favorite={favoriteByTarget.get(`product:${product.id}`)}
                              access={buildFavoriteAccess({
                                favorite: favoriteByTarget.get(`product:${product.id}`),
                                viewer,
                              })}
                              onRemove={() => removeProduct(product.id)}
                              className="mt-3 rounded-lg border border-error px-3 py-2 text-error"
                            />
                          )}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
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
