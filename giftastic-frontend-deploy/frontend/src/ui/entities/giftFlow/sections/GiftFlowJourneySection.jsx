// Canonical Gift Flow presentation section.
import { useMemo } from 'react';
import GiftFlowSection from './GiftFlowSection';

function productName(productId, productMap) {
  const product = productMap.get(productId);
  return product?.name || `Product ${productId?.substring?.(0, 8) || 'unknown'}`;
}

function productImage(productId, productMap) {
  const product = productMap.get(productId);
  return product?.images?.[0]?.url || product?.primaryImageUrl || product?.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop';
}

export default function GiftFlowJourneySection({ config, products = [], onProductOpen }) {
  const steps = config?.steps || [];
  const productMap = useMemo(() => new Map(products.map((product) => [product.id || product.productId, product])), [products]);

  if (steps.length === 0) {
    return (
      <GiftFlowSection title="Journey" icon="route">
        <p className="text-sm italic text-on-surface-variant">No configured steps were found.</p>
      </GiftFlowSection>
    );
  }

  return (
    <GiftFlowSection title="Journey" icon="route">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const refs = step.products || [];

          return (
            <article key={step.id || index} className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
              <div className="border-b border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                      Step {index + 1}
                    </p>
                    <h4 className="mt-1 break-words [overflow-wrap:anywhere] font-bold text-primary">{step.title}</h4>
                    {step.description && (
                      <p className="mt-2 break-words [overflow-wrap:anywhere] text-sm leading-6 text-on-surface-variant">{step.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold text-primary">
                      {step.type === 'multiple' ? 'Multiple choice' : 'Single choice'}
                    </span>
                    {step.required !== false && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {refs.length > 0 ? (
                <div className="grid gap-3 p-4 sm:grid-cols-2">
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
                          src={productImage(ref.productId, productMap)}
                          alt={productName(ref.productId, productMap)}
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-primary">{productName(ref.productId, productMap)}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Min {ref.min || 0} / Max {ref.max || 1}
                          </p>
                          {ref.required && (
                            <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                              Required product
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-sm italic text-on-surface-variant">This step has no product options.</p>
              )}
            </article>
          );
        })}
      </div>

    </GiftFlowSection>
  );
}
