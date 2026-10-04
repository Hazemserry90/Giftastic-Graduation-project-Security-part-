import { useEffect, useRef, useState } from 'react';
import { recommendationService } from '../services/recommendationService';
import {
  buildProductAccess,
  PRODUCT_CONTEXT,
  ProductSummary,
} from '../ui/entities/product';
import { useAuthStore } from '../store/useAuthStore';
import { adaptRecommendationsProjection } from '../ui/projections';
import { selectRecommendationsData } from '../ui/projections/recommendations/RecommendationsSelectors';

export default function ProductRecommendations({ type = 'trending', limit = 8, title, productId }) {
  const viewer = useAuthStore((state) => state.viewer);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestGeneration = useRef(0);

  useEffect(() => {
    const generation = ++requestGeneration.current;
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        let response;
        switch (type) {
          case 'most-bought':
            response = await recommendationService.getMostFrequentlyBought(limit);
            break;
          case 'what-others-buying':
            response = await recommendationService.getWhatOthersAreBuying(limit);
            break;
          case 'similar':
            response = await recommendationService.getSimilarProducts(productId, limit);
            break;
          case 'personalized':
            response = await recommendationService.getPersonalizedRecommendations(limit);
            break;
          case 'trending':
          default:
            response = await recommendationService.getTrending(limit);
            break;
        }
        if (generation !== requestGeneration.current) return;
        setProducts(selectRecommendationsData(adaptRecommendationsProjection(response)).products);
      } catch {
        if (generation === requestGeneration.current) setProducts([]);
      } finally {
        if (generation === requestGeneration.current) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      requestGeneration.current += 1;
    };
  }, [type, limit, productId]);

  if (loading) {
    return (
      <div className="py-12 text-center" role="status" aria-label="Loading recommendations">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-stone-50 py-12" aria-labelledby="product-recommendations-title">
      <div className="mx-auto max-w-7xl px-4">
        <h2 id="product-recommendations-title" className="mb-8 font-display-xl text-3xl font-bold text-primary">
          {title || 'Recommended for You'}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductSummary
              key={product.id}
              product={product}
              access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.SUMMARY })}
              to={`/products/${product.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
