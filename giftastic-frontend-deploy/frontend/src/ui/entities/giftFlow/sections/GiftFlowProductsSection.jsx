// Canonical Gift Flow presentation section.
import { useMemo } from 'react';
import GiftFlowSection from './GiftFlowSection';

function getProductName(productId, productMap) {
  return productMap.get(productId)?.name || `Product ${productId?.substring?.(0, 8) || 'unknown'}`;
}

function getProductImage(productId, productMap) {
  const product = productMap.get(productId);
  return product?.images?.[0]?.url || product?.primaryImageUrl || product?.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop';
}

export default function GiftFlowProductsSection({ config, products = [], onProductOpen }) {
  const productMap = useMemo(() => new Map(products.map((product) => [product.id || product.productId, product])), [products]);
  const steps = config?.steps || [];
  const hasProducts = steps.some((step) => (step.products || []).length > 0);

  if (!hasProducts) return null;

  return (
    <GiftFlowSection title="Product Options" icon="inventory_2">
      <div className="grid gap-4">
        {steps.map((step, index) => {
          const refs = step.products || [];
          if (refs.length === 0) return null;

          return (
            <article key={step.id || index} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="font-bold text-primary">{step.title || `Step ${index + 1}`}</h4>
                <span className="text-xs font-bold text-on-surface-variant">{refs.length} options</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {refs.map((ref) => {
                  const product = productMap.get(ref.productId) || { id: ref.productId };
                  return (
                    <button
                      key={ref.productId}
                      type="button"
                      onClick={() => onProductOpen?.(product)}
                      className="flex min-w-0 gap-3 rounded-lg border border-stone-200 bg-white p-3 text-left hover:border-primary/30 hover:bg-primary/5"
                    >
                      <img
                        src={getProductImage(ref.productId, productMap)}
                        alt={getProductName(ref.productId, productMap)}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-primary">{getProductName(ref.productId, productMap)}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Min {ref.min || 0} / Max {ref.max || 1}
                        </p>
                        {ref.required && (
                          <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                            Required
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

    </GiftFlowSection>
  );
}
