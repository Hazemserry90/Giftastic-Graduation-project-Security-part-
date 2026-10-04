import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { favoriteService } from '../services/favoriteService';
import { getGiftFlowExecutionSteps, parseGiftFlowRouteId } from '../utils/giftFlowExecution';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import {
  buildProductAccess,
  formatProductMoney,
  getProductStockState,
  PRODUCT_CONTEXT,
  ProductFlowReferenceCard,
  sumProductPrices,
} from '../ui/entities/product';
import { buildGiftFlowAccess, GiftFlowExecutionHeader } from '../ui/entities/giftFlow';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { createIsoTimestamp } from '../ui/entities/shared/date';
import { mapGiftFlowCartItems } from '../ui/commands';
import { buildFavoriteAccess, buildFavoriteToggleAction } from '../ui/entities/favorite';
import {
  authorizeEntityHydration,
  hydrateEntitiesById,
  hydrateEntityById,
} from '../ui/entities/shared/productionHydration';

function createEmptySelection() {
  return {
    productIds: [],
    note: ''
  };
}

function getProductStockQuantity(product) {
  const quantity = Number(product?.stockQuantity);
  return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : null;
}

function getConfiguredProductMin(productConfig) {
  const min = Number(productConfig?.min);
  const normalized = Number.isFinite(min) ? Math.max(0, Math.floor(min)) : 0;
  return productConfig?.required ? Math.max(1, normalized) : normalized;
}

function getSelectedProductMin(productConfig) {
  return Math.max(1, getConfiguredProductMin(productConfig));
}

function getConfiguredProductMax(productConfig) {
  const max = Number(productConfig?.max);
  return Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 1;
}

function getProductStepMax(productConfig, product) {
  const stockQuantity = getProductStockQuantity(product);
  const configuredMax = getConfiguredProductMax(productConfig);
  return stockQuantity === null ? configuredMax : Math.min(configuredMax, stockQuantity);
}

function getStepMaxQuantity(step, products = []) {
  if (!step || step.type === 'note') return 0;
  return (step.products || []).reduce((total, productConfig) => {
    const product = products.find((item) => item.id === productConfig.productId);
    return total + Math.max(0, getProductStepMax(productConfig, product));
  }, 0);
}

function createInitialSelection(step, products = []) {
  const selection = createEmptySelection();
  if (!step || step.type === 'note') return selection;
  (step.products || []).forEach((productConfig) => {
    if (!productConfig.required) return;
    const product = products.find((item) => item.id === productConfig.productId);
    const min = getConfiguredProductMin(productConfig);
    const max = getProductStepMax(productConfig, product);
    if (min > 0 && min <= max) {
      selection.productIds.push(...Array(min).fill(productConfig.productId));
    }
  });
  return selection;
}

export default function GiftFlowStep() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const { user, viewer } = useAuthStore();
  const { addItemsToCart } = useCartStore();

  const [flow, setFlow] = useState(null);
  const [config, setConfig] = useState({ steps: [] });
  const [productsByStep, setProductsByStep] = useState({});
  const [selections, setSelections] = useState({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [maxUnlockedStepIndex, setMaxUnlockedStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flowFavorite, setFlowFavorite] = useState(null);
  const [error, setError] = useState('');

  const steps = getGiftFlowExecutionSteps(config);
  const activeStep = steps[activeStepIndex];

  useEffect(() => {
    void loadFlow();
  }, [flowId]);

  useEffect(() => {
    if (!flow?.id) { setFlowFavorite(null); return; }
    favoriteService.getFavorites().then((records) => {
      const match = (records || []).map((record) => adaptEntityFromNamedSource('adaptFavoriteLegacyRecord', record))
        .find((favorite) => favorite.flowId === flow.id && buildFavoriteAccess({ favorite, viewer }).canRead);
      setFlowFavorite(match || null);
    }).catch(() => setFlowFavorite(null));
  }, [flow?.id, viewer]);

  const loadFlow = async () => {
    setLoading(true);
    setError('');

    try {
      const routeFlowId = parseGiftFlowRouteId(flowId);
      if (!routeFlowId) throw new Error('INVALID_FLOW_ID');

      const flowModel = await hydrateEntityById('giftFlow', routeFlowId, {
        authorized: authorizeEntityHydration('giftFlow', { id: routeFlowId, viewer }),
      });
      if (!flowModel) throw new Error('Gift Flow hydration was not authorized');
      const parsedConfig = flowModel.parsedConfiguration;
      const executionSteps = getGiftFlowExecutionSteps(parsedConfig);
      if (executionSteps.length === 0) throw new Error('EMPTY_FLOW');

      const productIds = executionSteps.flatMap((step) => step.type === 'note' ? [] : (step.products || []).map((product) => product.productId));
      const hydratedProducts = await hydrateEntitiesById('product', productIds, {
        authorized: productIds.every((id) => authorizeEntityHydration('product', { id, viewer })),
      });
      if (hydratedProducts.length !== new Set(productIds.map(String)).size) {
        throw new Error('MISSING_FLOW_PRODUCTS');
      }
      const productsById = new Map(hydratedProducts.map((product) => [product.id, product]));
      const productFetchTasks = executionSteps.map(async (step) => {
        if (step.type === 'note' || !step.products?.length) {
          return [step.id, []];
        }

        const products = step.products.map((product) => productsById.get(String(product.productId)) || null);

        return [step.id, products.filter(Boolean)];
      });

      const stepProducts = Object.fromEntries(await Promise.all(productFetchTasks));
      const hasUnavailableProduct = executionSteps.some((step) => {
        if (step.type === 'note') return false;
        return (step.products || []).some((productConfig) => {
          const product = (stepProducts[step.id] || []).find((item) => item.id === productConfig.productId);
          const stock = getProductStockState(product);
          const max = getProductStepMax(productConfig, product);
          const requiredMin = getConfiguredProductMin(productConfig);
          return !product || product.status !== 'APPROVED' || !stock.canSelect || max < requiredMin;
        });
      });
      if (hasUnavailableProduct) {
        throw new Error('FLOW_PRODUCTS_UNAVAILABLE');
      }
      const initialSelections = Object.fromEntries(executionSteps.map((step) => [
        step.id,
        createInitialSelection(step, stepProducts[step.id] || [])
      ]));

      setFlow(flowModel);
      setConfig(parsedConfig);
      setProductsByStep(stepProducts);
      setSelections(initialSelections);
      setActiveStepIndex(0);
      setMaxUnlockedStepIndex(0);
    } catch (loadError) {
      setFlow(null);
      setConfig({ steps: [] });
      setProductsByStep({});
      setSelections({});
      if (loadError?.message === 'INVALID_FLOW_ID') {
        setError('This Gift Flow link is invalid.');
      } else if (loadError?.message === 'EMPTY_FLOW') {
        setError('This Gift Flow does not have any customization steps yet.');
      } else if (loadError?.message === 'MISSING_FLOW_PRODUCTS') {
        setError('Some customization options could not be loaded. Please try again.');
      } else if (loadError?.message === 'FLOW_PRODUCTS_UNAVAILABLE') {
        setError('This Gift Flow is unavailable because one or more products are no longer available.');
      } else {
        setError('Failed to load this Gift Flow. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSelection = (stepId) => selections[stepId] || createEmptySelection();

  const validateStep = (step) => {
    const selection = getSelection(step.id);

    if (step.type === 'note') {
      if (step.required && !selection.note?.trim()) {
        return 'This note is required.';
      }
      return null;
    }

    const selectedCount = selection.productIds.length;
    const stepProducts = productsByStep[step.id] || [];
    const stepMax = Math.max(1, getStepMaxQuantity(step, stepProducts));
    if (selectedCount > stepMax) {
      return `You can select at most ${stepMax} product(s) for this step.`;
    }
    
    // Check per-product requirements first
    if (step.products) {
      for (const p of step.products) {
        const pCount = selection.productIds.filter(id => id === p.productId).length;
        const requiredMin = getConfiguredProductMin(p);
        const selectedMin = getSelectedProductMin(p);
        const productDetails = stepProducts.find(prod => prod.id === p.productId);
        const pMax = getProductStepMax(p, productDetails);
        
        if (p.required && pCount < requiredMin) {
          return `You must select at least ${requiredMin} of ${productDetails?.name || 'a required product'}.`;
        }
        if (pCount > 0 && pCount < selectedMin) {
          return `Minimum selection for ${productDetails?.name || 'this product'} is ${selectedMin}.`;
        }
        if (pCount > pMax) {
          return `${productDetails?.name || 'This product'} only has ${pMax} available.`;
        }
      }
    }

    const stepMin = Math.max(1, step.minSelections || 1);
    if (step.required && selectedCount < stepMin) {
      return `Please select at least ${stepMin} product(s) for this step.`;
    }

    return null;
  };

  const isStepComplete = (step) => {
    return validateStep(step) === null;
  };

  const canMoveNext = useMemo(() => {
    if (!activeStep) {
      return false;
    }
    return isStepComplete(activeStep);
  }, [activeStep, selections, productsByStep]);

  const totalPrice = useMemo(() => {
    const selectedProducts = [];
    for (const step of steps) {
      if (step.type === 'note') {
        continue;
      }

      const selectedIds = getSelection(step.id).productIds;
      const products = productsByStep[step.id] || [];
      
      for (const productId of selectedIds) {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        selectedProducts.push(product);
      }
    }
    return sumProductPrices(selectedProducts);
  }, [steps, selections, productsByStep]);

  const adjustProductQuantity = (step, productId, delta) => {
    setSelections((current) => {
      const currentSelection = current[step.id] || createEmptySelection();
      const selected = [...currentSelection.productIds];
      const pConf = step.products?.find(p => p.productId === productId);
      const product = productsByStep[step.id]?.find((item) => item.id === productId);
      const pMin = getSelectedProductMin(pConf);
      const pMax = getProductStepMax(pConf, product);
      const stepMax = Math.max(1, getStepMaxQuantity(step, productsByStep[step.id] || []));
      
      const currentQty = selected.filter(id => id === productId).length;

      let nextIds = [];
      if (delta > 0) {
        if (pMax <= 0) return current;
        if (currentQty === 0) {
          const initialQuantity = Math.min(pMin, pMax, Math.max(0, stepMax - selected.length));
          if (initialQuantity <= 0 || initialQuantity < pMin) return current;
          nextIds = [...selected, ...Array(initialQuantity).fill(productId)];
        } else if (currentQty < pMax) {
          if (selected.length >= stepMax) return current;
          nextIds = [...selected, productId];
        } else {
          return current; // already at max
        }
      } else if (delta < 0) {
        if (delta === -9999) {
          if (pConf?.required) return current;
          nextIds = selected.filter(id => id !== productId);
        } else if (pConf?.required && currentQty <= pMin) {
          return current;
        } else if (currentQty <= pMin) {
          // Completely unselect the product (drop to 0)
          nextIds = selected.filter(id => id !== productId);
        } else if (currentQty > 0) {
          // Decrement quantity by 1
          const idx = selected.lastIndexOf(productId);
          if (idx > -1) {
            const copy = [...selected];
            copy.splice(idx, 1);
            nextIds = copy;
          } else {
            nextIds = selected;
          }
        } else {
          return current; // already at 0
        }
      }

      return {
        ...current,
        [step.id]: {
          ...currentSelection,
          productIds: nextIds
        }
      };
    });
  };

  const updateNote = (step, value) => {
    setSelections((current) => ({
      ...current,
      [step.id]: {
        ...(current[step.id] || createEmptySelection()),
        note: value
      }
    }));
  };

  const goToStep = (targetStepIndex) => {
    if (targetStepIndex > maxUnlockedStepIndex) {
      return;
    }
    setActiveStepIndex(targetStepIndex);
  };

  const goNext = () => {
    const errorMsg = validateStep(activeStep);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    if (activeStepIndex < steps.length - 1) {
      const nextIndex = activeStepIndex + 1;
      setMaxUnlockedStepIndex((current) => Math.max(current, nextIndex));
      setActiveStepIndex(nextIndex);
    }
  };

  const goBack = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const addFlowToCart = async () => {
    // Validate all steps and find the first error
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const errorMsg = validateStep(step);
      if (errorMsg) {
        toast.error(`Step "${step.title}": ${errorMsg}`);
        setActiveStepIndex(i); // Automatically navigate user to the incomplete step!
        return;
      }
    }

    const selectedItems = [];
    const notes = {};

    steps.forEach((step) => {
      const selection = getSelection(step.id);
      if (step.type === 'note') {
        if (selection.note?.trim()) {
          notes[step.metadataKey || `note_${step.id}`] = selection.note.trim();
        }
        return;
      }

      const productGroups = {};
      selection.productIds.forEach((productId) => {
        if (!productGroups[productId]) {
          productGroups[productId] = { stepId: step.id, stepTitle: step.title, productId, count: 0 };
        }
        productGroups[productId].count += 1;
      });

      Object.values(productGroups).forEach(group => {
        selectedItems.push(group);
      });
    });

    if (selectedItems.length === 0) {
      setError('Select at least one product before adding this flow to cart.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const groupId = crypto.randomUUID();

      const mapped = mapGiftFlowCartItems({
        flowId: flow.id,
        flowName: flow.name,
        selectedItems,
        notes,
        selections,
        selectedAt: createIsoTimestamp(),
        groupId,
      });
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);

      await addItemsToCart(user?.id, mapped.payload);
      navigate('/cart');
    } catch {
      setError('Failed to add this gift flow to cart.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFlowFavorite = async () => {
    try {
      const wasFavorite = Boolean(flowFavorite);
      const action = buildFavoriteToggleAction({
        favorite: flowFavorite,
        access: flowFavorite ? buildFavoriteAccess({ favorite: flowFavorite, viewer }) : null,
        target: { type: 'giftFlow', id: flow.id },
        viewer,
        handlers: {
          add: async () => { const created = await favoriteService.addFlowFavorite(flow.id); setFlowFavorite(adaptEntityFromNamedSource('adaptFavoriteLegacyRecord', created)); },
          remove: async () => { await favoriteService.removeFlowFavorite(flow.id); setFlowFavorite(null); },
        },
      });
      await action?.onSelect();
      toast.success(wasFavorite ? 'Flow removed from favorites' : 'Flow added to favorites!');
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">Loading gift flow...</div>
        <Footer />
      </div>
    );
  }

  if (error && !flow) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-error">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={loadFlow}
              className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => navigate('/gift-flow')}
              className="rounded-lg border border-stone-300 px-5 py-2.5 font-semibold text-stone-700"
            >
              Browse Gift Flows
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const activeProducts = activeStep?.type === 'note' ? [] : (productsByStep[activeStep?.id] || []);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 py-10 grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-8 space-y-8">
          {/* Header */}
          <GiftFlowExecutionHeader
            flow={flow}
            access={buildGiftFlowAccess({ flow, viewer })}
            favoriteAction={(
              <button
              onClick={handleToggleFlowFavorite}
              className={`p-3 rounded-full bg-white border border-stone-200 hover:text-error hover:border-error hover:bg-error/5 shadow-sm transition-all duration-300 transform hover:scale-105 ${flowFavorite ? 'text-error' : 'text-stone-600'}`}
            >
              <Heart className="w-5 h-5 fill-current" />
            </button>
            )}
          />

          {/* Stepper Progress Bar */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
            <div className="relative flex items-center justify-between">
              {/* Progress Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-stone-100 rounded-full z-0">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(maxUnlockedStepIndex / (steps.length - 1 || 1)) * 100}%` }}
                />
              </div>

              {steps.map((step, index) => {
                const locked = index > maxUnlockedStepIndex;
                const complete = isStepComplete(step);
                const isActive = index === activeStepIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={locked}
                    onClick={() => goToStep(index)}
                    className="relative z-10 flex flex-col items-center focus:outline-none group disabled:cursor-not-allowed"
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border transition-all duration-300 ${
                        isActive
                          ? 'bg-primary text-white border-primary ring-4 ring-primary/20 shadow-md transform scale-110'
                          : complete
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : locked
                          ? 'bg-stone-50 text-stone-300 border-stone-200'
                          : 'bg-white text-stone-600 border-stone-300 hover:border-primary hover:text-primary shadow-sm'
                      }`}
                    >
                      {complete ? (
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-semibold tracking-wide uppercase transition-colors hidden sm:block ${
                      isActive ? 'text-primary font-bold' : complete ? 'text-emerald-600' : 'text-stone-400'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Panel */}
          <article className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h2 className="flex items-center gap-3 font-headline-md text-xl md:text-2xl font-bold text-stone-900">
                  {activeStep?.title}
                  {activeStep?.required && (
                    <span className="px-2.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full font-bold uppercase tracking-wider">Required Step</span>
                  )}
                </h2>
                <p className="text-sm text-stone-500 mt-1">{activeStep?.description}</p>
              </div>
              {activeStep && activeStep.type !== 'note' && (
                <div className="bg-stone-50 px-4 py-2 rounded-xl border border-stone-200/60 text-xs font-medium text-stone-600">
                  Selections: <span className="font-semibold text-primary">{getSelection(activeStep.id).productIds.length}</span> / {Math.max(1, getStepMaxQuantity(activeStep, activeProducts))}
                </div>
              )}
            </div>

            {activeStep?.type === 'note' ? (
              <textarea
                value={getSelection(activeStep.id).note}
                onChange={(event) => updateNote(activeStep, event.target.value)}
                className="w-full rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-3 outline-none transition-all resize-none"
                rows="6"
                placeholder={activeStep.placeholder || 'Write a note...'}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProducts.length === 0 ? (
                  <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    No product options are currently available for this step.
                  </div>
                ) : activeProducts.map((product) => {
                  const qty = getSelection(activeStep.id).productIds.filter(id => id === product.id).length;
                  const selectedCount = getSelection(activeStep.id).productIds.length;
                  const selected = qty > 0;
                  const pConf = activeStep.products?.find(p => p.productId === product.id);
                  const stock = getProductStockState(product);
                  const stockQuantity = getProductStockQuantity(product);
                  const pMin = getSelectedProductMin(pConf);
                  const pMax = getProductStepMax(pConf, product);
                  const stepMax = Math.max(1, getStepMaxQuantity(activeStep, activeProducts));
                  const productUnavailable = product.status !== 'APPROVED' || !stock.canSelect || pMax <= 0;
                  const addDisabled = productUnavailable || qty >= pMax || selectedCount >= stepMax;
                  const removeDisabled = qty === 0 || (pConf?.required && qty <= pMin);
                  
                  return (
                    <ProductFlowReferenceCard
                      key={product.id}
                      product={product}
                      access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.PUBLIC })}
                      selected={selected}
                      required={pConf?.required}
                      disabled={productUnavailable}
                      onSelect={() => {
                        if (productUnavailable) return;
                        if (selected) adjustProductQuantity(activeStep, product.id, -9999);
                        else if (!addDisabled) adjustProductQuantity(activeStep, product.id, 1);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustProductQuantity(activeStep, product.id, -1);
                          }}
                          disabled={removeDisabled}
                          className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center disabled:opacity-30 disabled:border-stone-100 disabled:text-stone-300 transition-colors hover:bg-stone-50 hover:border-stone-300 active:bg-stone-100"
                        >
                          <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="font-bold text-stone-850 w-5 text-center text-sm">{qty}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustProductQuantity(activeStep, product.id, 1);
                          }}
                          disabled={addDisabled}
                          className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center disabled:opacity-30 disabled:border-stone-100 disabled:text-stone-300 transition-colors hover:bg-stone-50 hover:border-stone-300 active:bg-stone-100"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      </div>
                      {stockQuantity !== null && (
                        <p className="mt-2 text-xs text-stone-500">Available: {stockQuantity}. Limit for this step: {pMax}</p>
                      )}
                      
                      {activeStep.type === 'single' && selected && (
                        <div className="mt-3 text-primary">
                           <span className="material-symbols-outlined text-[24px]">check_circle</span>
                        </div>
                      )}
                    </ProductFlowReferenceCard>
                  );
                })}
              </div>
            )}

            {/* Step Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-stone-100">
              <button
                type="button"
                onClick={goBack}
                disabled={activeStepIndex === 0}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 hover:border-stone-300 active:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-stone-200 transition-all"
              >
                Back
              </button>

              {activeStepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold shadow-sm transition-all"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const errorMsg = validateStep(activeStep);
                    if (errorMsg) {
                      toast.error(errorMsg);
                      return;
                    }
                    addFlowToCart();
                  }}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold shadow-sm disabled:opacity-40 transition-all"
                >
                  {submitting ? 'Adding...' : 'Add Flow To Cart'}
                </button>
              )}
            </div>
          </article>

          {error && <p className="text-error text-sm font-semibold">{error}</p>}
        </section>

        {/* Sidebar Summary */}
        <aside className="xl:col-span-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-6 sticky top-24 shadow-sm">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-headline-md text-lg font-extrabold text-stone-900 tracking-tight">Box Summary</h3>
            </div>
            
            <div className="space-y-4">
              {steps.map((step, index) => {
                const selection = getSelection(step.id);
                const selectedProducts = selection.productIds.length;
                const isNote = step.type === 'note';
                const isSelected = isNote ? Boolean(selection.note?.trim()) : selectedProducts > 0;

                return (
                  <div key={step.id} className="flex justify-between gap-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-stone-500 font-medium">Step {index + 1}: {step.title}</p>
                      <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-stone-400'}`}>
                        {isNote
                          ? (isSelected ? 'Note added' : 'Pending response')
                          : (isSelected ? `${selectedProducts} product(s) selected` : 'Pending selection')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-4">
              <div className="flex justify-between items-center font-bold text-stone-900 bg-stone-50 p-4 rounded-xl border border-stone-150">
                <span className="text-sm">Total Selected Value</span>
                <span className="text-primary text-lg">{formatProductMoney(totalPrice) || '-'}</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed text-center">
                All selected items will be packaged and grouped inside your premium custom gift box.
              </p>
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
