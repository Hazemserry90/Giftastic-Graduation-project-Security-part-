import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { giftFlowService } from '../services/giftFlowService';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/useAuthStore';
import VendorSidebar from '../components/VendorSidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import commissionService from '../services/commissionService';
import VendorPricingChoice from '../ui/entities/product/VendorPricingChoice';
import GiftFlowModalController from '../components/controllers/GiftFlowModalController';
import {
  buildProductAccess,
  getProductStockState,
  isProductApproved,
  PRODUCT_STOCK_STATE,
  PRODUCT_CONTEXT,
  ProductFlowReferenceCard,
} from '../ui/entities/product';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import {
  buildGiftFlowAccess,
  buildGiftFlowActions,
  GiftFlowEditorListItem,
  GIFT_FLOW_CONTEXT,
} from '../ui/entities/giftFlow';
import {
  createGiftFlowEditorDraft,
  mapGiftFlowEditorPayload,
} from '../ui/commands/giftFlowEditor';
import {
  MAX_FLOW_STEPS,
  buildDefaultFlowConfig,
  normalizeFlowConfig,
  serializeFlowConfiguration,
  validateFlowConfig
} from '../utils/giftFlowConfig';

function buildDefaultDraft(maxSteps = MAX_FLOW_STEPS) {
  return {
    id: null,
    name: '',
    description: '',
    imageUrl: '',
    config: buildDefaultFlowConfig(maxSteps)
  };
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const createImagePreview = (file) => ({
  file,
  previewUrl: URL.createObjectURL(file),
});

export default function VendorGiftFlows() {
  const viewer = useAuthStore((state) => state.viewer);
  const [flows, setFlows] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const [previewFlow, setPreviewFlow] = useState(null);
  const [draft, setDraft] = useState(buildDefaultDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [commissionRate, setCommissionRate] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [flowLimits, setFlowLimits] = useState({
    maxGiftFlowsPerVendor: 10,
    maxGiftFlowSteps: MAX_FLOW_STEPS,
  });
  const coverImageRef = useRef(null);
  const maxGiftFlows = flowLimits.maxGiftFlowsPerVendor || 10;
  const maxFlowSteps = flowLimits.maxGiftFlowSteps || MAX_FLOW_STEPS;
  const reachedFlowLimit = flows.length >= maxGiftFlows;

  useEffect(() => {
    if (!viewer.supplierId) {
      setLoading(false);
      return;
    }

    void loadData();
  }, [viewer.supplierId]);

  useEffect(() => {
    if (viewer.supplierId) commissionService.getCurrentRate(viewer.supplierId)
      .then((response) => setCommissionRate(response.rate)).catch(() => setCommissionRate(null));
  }, [viewer.supplierId]);

  useEffect(() => {
    coverImageRef.current = coverImage;
  }, [coverImage]);

  useEffect(() => () => {
    if (coverImageRef.current?.previewUrl) URL.revokeObjectURL(coverImageRef.current.previewUrl);
  }, []);

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) || null,
    [flows, selectedFlowId]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [vendorFlows, vendorProducts, limits] = await Promise.all([
        giftFlowService.getFlowsByVendor(viewer.supplierId),
        productService.getVendorProducts(),
        giftFlowService.getFlowLimits()
      ]);
      const nextLimits = {
        maxGiftFlowsPerVendor: limits?.maxGiftFlowsPerVendor || 10,
        maxGiftFlowSteps: limits?.maxGiftFlowSteps || MAX_FLOW_STEPS,
      };

      setFlowLimits(nextLimits);
      setFlows((vendorFlows || []).map((flow) =>
        adaptEntityFromNamedSource('adaptGiftFlowResponse', flow)));
      setProducts((vendorProducts || []).map((product) =>
        adaptEntityFromNamedSource('adaptProductDomain', product))
        .filter(isProductApproved));

      if (vendorFlows?.length > 0) {
        openFlow(vendorFlows[0], nextLimits.maxGiftFlowSteps);
      } else {
        setDraft(buildDefaultDraft(nextLimits.maxGiftFlowSteps));
      }
    } catch (loadError) {
      setError('Failed to load gift flow data.');
    } finally {
      setLoading(false);
    }
  };

  const openFlow = (flow, maxSteps = maxFlowSteps) => {
    const model = adaptEntityFromNamedSource('adaptGiftFlowResponse', flow);
    setSelectedFlowId(model.id);
    setDraft({
      id: model.id,
      name: model.name || '',
      description: model.description || '',
      imageUrl: model.imageUrl || '',
      config: normalizeFlowConfig(model.parsedConfiguration, maxSteps)
    });
    clearPendingCoverImage();
  };

  const startNewFlow = () => {
    if (reachedFlowLimit) {
      setError(`You can create up to ${maxGiftFlows} gift flows.`);
      return;
    }
    setSelectedFlowId(null);
    setDraft(buildDefaultDraft(maxFlowSteps));
    clearPendingCoverImage();
  };

  const updateDraftField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const clearPendingCoverImage = () => {
    setCoverImage((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const handleCoverImageSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('Only JPG, JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    clearPendingCoverImage();
    setCoverImage(createImagePreview(file));
    setError('');
  };

  const uploadPendingCoverImage = async (flowId) => {
    if (!coverImage?.file) return null;
    const image = await giftFlowService.uploadFlowImage(flowId, coverImage.file);
    clearPendingCoverImage();
    return image;
  };

  const deleteCoverImage = async () => {
    if (coverImage) {
      clearPendingCoverImage();
      return;
    }
    if (!draft.id) {
      setDraft((current) => ({ ...current, imageUrl: '' }));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await giftFlowService.deleteFlowImage(draft.id);
      setDraft((current) => ({ ...current, imageUrl: '' }));
      setFlows((current) => current.map((flow) =>
        flow.id === draft.id ? { ...flow, imageUrl: '' } : flow));
    } catch {
      setError('Failed to delete gift flow image.');
    } finally {
      setSaving(false);
    }
  };

  const updateStep = (index, key, value) => {
    setDraft((current) => {
      const steps = [...current.config.steps];
      const currentStep = { ...steps[index], [key]: value };

      steps[index] = currentStep;

      return {
        ...current,
        config: normalizeFlowConfig({ ...current.config, steps }, maxFlowSteps)
      };
    });
  };

  const addStep = () => {
    setDraft((current) => {
      if (current.config.steps.length >= maxFlowSteps) {
        return current;
      }

      const nextIndex = current.config.steps.length + 1;
      const steps = [
        ...current.config.steps,
        {
          id: `step-${nextIndex}`,
          title: `Step ${nextIndex}`,
          description: '',
          type: 'single',
          required: true,
          minSelections: 1,
          maxSelections: 1,
          products: []
        }
      ];

      return {
        ...current,
        config: normalizeFlowConfig({ ...current.config, steps }, maxFlowSteps)
      };
    });
  };

  const removeStep = (index) => {
    setDraft((current) => {
      if (current.config.steps.length <= 1) {
        return current;
      }

      const steps = current.config.steps.filter((_, stepIndex) => stepIndex !== index);
      return {
        ...current,
        config: normalizeFlowConfig({ ...current.config, steps }, maxFlowSteps)
      };
    });
  };

  const saveFlow = async () => {
    if (!viewer.supplierId) {
      return;
    }

    if (!draft.id && reachedFlowLimit) {
      setError(`You can create up to ${maxGiftFlows} gift flows.`);
      return;
    }

    const validationError = validateFlowConfig(draft.config, maxFlowSteps);
    if (!draft.name.trim()) {
      setError('Flow name is required.');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    const mapped = mapGiftFlowEditorPayload(createGiftFlowEditorDraft({
      name: draft.name.trim(),
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim(),
      configuration: serializeFlowConfiguration(draft.config, maxFlowSteps)
    }));
    if (!mapped.ok) {
      setError(Object.values(mapped.errors)[0]);
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (draft.id) {
        const updated = await giftFlowService.updateFlow(draft.id, viewer.supplierId, mapped.payload);
        const uploadedImage = await uploadPendingCoverImage(updated.id);
        const nextUpdated = uploadedImage ? { ...updated, imageUrl: uploadedImage.url } : updated;
        setFlows((current) => current.map((flow) =>
          flow.id === nextUpdated.id
            ? adaptEntityFromNamedSource('adaptGiftFlowResponse', nextUpdated)
            : flow));
        openFlow(nextUpdated);
      } else {
        const created = await giftFlowService.createFlow(viewer.supplierId, mapped.payload);
        const uploadedImage = await uploadPendingCoverImage(created.id);
        const nextCreated = uploadedImage ? { ...created, imageUrl: uploadedImage.url } : created;
        setFlows((current) => [
          adaptEntityFromNamedSource('adaptGiftFlowResponse', nextCreated),
          ...current,
        ]);
        openFlow(nextCreated);
      }
    } catch {
      setError('Failed to save gift flow.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedFlow = async () => {
    if (!selectedFlow || !viewer.supplierId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await giftFlowService.deleteFlow(selectedFlow.id, viewer.supplierId);
      const nextFlows = flows.filter((flow) => flow.id !== selectedFlow.id);
      setFlows(nextFlows);
      if (nextFlows.length > 0) {
        openFlow(nextFlows[0]);
      } else {
        startNewFlow();
      }
    } catch {
      setError('Failed to delete gift flow.');
    } finally {
      setSaving(false);
    }
  };

  const selectedAccess = selectedFlow ? buildGiftFlowAccess({
    flow: selectedFlow,
    viewer,
    context: GIFT_FLOW_CONTEXT.OWNER,
  }) : null;
  const selectedActions = selectedFlow && selectedAccess ? buildGiftFlowActions({
    flow: selectedFlow,
    access: selectedAccess,
    handlers: { delete: deleteSelectedFlow },
  }) : [];
  const deleteAction = selectedActions.find((action) => action.key === 'delete');
  const canSave = !selectedFlow || selectedAccess?.canManage;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading gift flows...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="flex min-w-0 flex-col md:flex-row">
        <VendorSidebar />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-12">
          <header className="flex items-start justify-between gap-4 mb-12">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Gift Flow Studio</h2>
              <p className="font-body-lg text-body-lg text-secondary">
                Build guided gift journeys with clear steps and product choices.
              </p>
            </div>
            <button
              type="button"
              onClick={startNewFlow}
              disabled={reachedFlowLimit}
              className="px-5 py-3 bg-primary text-on-primary rounded-lg font-label-md active:scale-95 transition-transform disabled:cursor-not-allowed disabled:opacity-40"
            >
              New Flow
            </button>
          </header>

          <div className="mb-8">
            <VendorPricingChoice rate={commissionRate} showOptions={false} />
            <p className="mt-2 text-sm text-on-surface-variant">
              A Gift Flow has no separate price. Each selected product keeps its own pricing choice, and commission is calculated from your products in the final order.
            </p>
            <p className="mt-2 text-sm font-semibold text-primary">
              Gift flow limits: {flows.length}/{maxGiftFlows} flows used. Each flow can have up to {maxFlowSteps} steps.
            </p>
          </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <aside className="xl:col-span-3 bg-white rounded-xl border border-surface-container p-4 space-y-3 h-fit">
            <h3 className="font-headline-md text-primary px-2">Saved Flows ({flows.length}/{maxGiftFlows})</h3>
            {flows.length === 0 ? (
              <p className="text-sm text-secondary px-2">No flows yet. Create your first one.</p>
            ) : (
              flows.map((flow) => (
                <GiftFlowEditorListItem
                  key={flow.id}
                  flow={flow}
                  access={buildGiftFlowAccess({ flow, viewer, context: GIFT_FLOW_CONTEXT.OWNER })}
                  selected={selectedFlowId === flow.id}
                  onSelect={openFlow}
                />
              ))
            )}
          </aside>

          <div className="xl:col-span-9 bg-white rounded-xl border border-surface-container p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Flow Name</label>
                <input
                  value={draft.name}
                  onChange={(event) => updateDraftField('name', event.target.value)}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all hover:border-primary/50"
                  placeholder="e.g. Build a Luxury Gift Box"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-sm font-semibold text-secondary mb-2">Description</label>
                <input
                  value={draft.description}
                  onChange={(event) => updateDraftField('description', event.target.value)}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all hover:border-primary/50"
                  placeholder="Short summary for shoppers"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-secondary mb-2">Cover Photo</label>
                <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-stone-50 p-4 sm:flex-row sm:items-center">
                  <div className="h-32 w-full overflow-hidden rounded-lg bg-white sm:w-48">
                    {coverImage?.previewUrl || draft.imageUrl ? (
                      <img
                        src={coverImage?.previewUrl || draft.imageUrl}
                        alt={draft.name || 'Gift flow cover'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-secondary">
                        No cover photo
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary px-4 py-2 font-semibold text-primary hover:bg-primary/5">
                      <span className="material-symbols-outlined text-base">upload</span>
                      Select photo
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverImageSelect} />
                    </label>
                    {(coverImage || draft.imageUrl) && (
                      <button type="button" onClick={deleteCoverImage} className="inline-flex items-center gap-2 rounded-lg border border-error px-4 py-2 font-semibold text-error">
                        <span className="material-symbols-outlined text-base">delete</span>
                        Remove
                      </button>
                    )}
                    <p className="basis-full text-xs text-secondary">JPG, PNG, or WebP. Up to 10 MB. The photo uploads when the flow is saved.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-primary">
                Steps ({draft.config.steps.length}/{maxFlowSteps})
              </h3>
              <button
                type="button"
                onClick={addStep}
                disabled={draft.config.steps.length >= maxFlowSteps}
                className="px-4 py-2 rounded-lg border border-outline text-on-surface disabled:opacity-40"
              >
                Add Step
              </button>
            </div>

            <div className="space-y-4">
              {draft.config.steps.map((step, index) => (
                <article key={step.id} className="border border-surface-container rounded-lg p-4 space-y-4 bg-surface-container-lowest">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-primary">Step {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      disabled={draft.config.steps.length <= 1}
                      className="text-error text-sm disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-secondary mb-1">Title</label>
                      <input
                        value={step.title}
                        onChange={(event) => updateStep(index, 'title', event.target.value)}
                        className="w-full px-3 py-2 border border-outline-variant rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-secondary mb-1">Step Type (Automatically Inferred)</label>
                      <div className="px-3 py-2 border border-outline-variant rounded-lg bg-stone-50 font-semibold text-primary">
                        {step.type === 'multiple' ? 'Multiple Products Selection' : 'Single Product Selection'}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        ({step.products?.length || 0} product(s) assigned)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-secondary mb-1">Description</label>
                    <input
                      value={step.description || ''}
                      onChange={(event) => updateStep(index, 'description', event.target.value)}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={step.required}
                        onChange={(event) => updateStep(index, 'required', event.target.checked)}
                        className="rounded text-primary focus:ring-primary border-outline-variant w-4 h-4 shadow-sm"
                      />
                      Make this entire step required for customization
                    </label>
                  </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-secondary mb-3">Include Products & Configure Limits</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-2 border border-outline-variant/60 rounded-xl p-4 bg-stone-50/50">
                            {products.map((product) => {
                              const stepProducts = step.products || [];
                              const prodConfigIndex = stepProducts.findIndex(p => p.productId === product.id);
                              const isIncluded = prodConfigIndex !== -1;
                              const prodConfig = isIncluded ? stepProducts[prodConfigIndex] : null;
                              const stock = getProductStockState(product);
                              const stockUnavailable = stock.key === PRODUCT_STOCK_STATE.UNAVAILABLE;
                              const isOutOfStock = stock.key === PRODUCT_STOCK_STATE.OUT_OF_STOCK;
                              const isLowStock = stock.key === PRODUCT_STOCK_STATE.LOW_STOCK;
                              const stockQuantity = stock.quantity;

                              return (
                                <ProductFlowReferenceCard
                                  key={product.id}
                                  product={product}
                                  access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.OWNER_MANAGEMENT })}
                                  selected={isIncluded}
                                  onSelect={() => {
                                    if (!stock.canSelect) return;
                                    const nextProducts = [...stepProducts];
                                    if (isIncluded) nextProducts.splice(prodConfigIndex, 1);
                                    else nextProducts.push({
                                      productId: product.id,
                                      required: false,
                                      min: 0,
                                      max: Math.max(1, stockQuantity || 1),
                                    });
                                    updateStep(index, 'products', nextProducts);
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      {stockUnavailable ? (
                                        <p className="text-xs text-on-surface-variant font-bold mt-1">Stock unavailable</p>
                                      ) : isOutOfStock ? (
                                        <p className="text-xs text-error font-bold mt-1">Out of Stock</p>
                                      ) : isLowStock ? (
                                        <p className="text-xs text-tertiary font-bold mt-1">Only {stockQuantity} left</p>
                                      ) : (
                                        <p className="text-xs text-on-surface-variant mt-1">Stock: {stockQuantity}</p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (stockUnavailable || isOutOfStock) return;
                                        let nextProducts = [...stepProducts];
                                        if (isIncluded) {
                                          nextProducts.splice(prodConfigIndex, 1);
                                        } else {
                                          nextProducts.push({
                                            productId: product.id,
                                            required: false,
                                            min: 0,
                                            max: Math.max(1, stockQuantity || 1)
                                          });
                                        }
                                        updateStep(index, 'products', nextProducts);
                                      }}
                                      disabled={stockUnavailable || isOutOfStock}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        stockUnavailable || isOutOfStock
                                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                          : isIncluded
                                          ? 'bg-primary text-white hover:bg-primary-hover shadow-sm'
                                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                      }`}
                                    >
                                      {stockUnavailable ? 'Unavailable' : isOutOfStock ? 'No Stock' : isIncluded ? 'Included' : 'Include'}
                                    </button>
                                  </div>

                                  {/* Config Section - Only shown when included */}
                                  {isIncluded && prodConfig && (
                                    <div className="mt-4 pt-3 border-t border-primary/10 space-y-3 bg-white/60 p-3 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-secondary cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={prodConfig.required}
                                            onChange={(e) => {
                                              const next = [...stepProducts];
                                              const isChecked = e.target.checked;
                                              const nextMin = isChecked ? Math.max(1, prodConfig.min) : 0;
                                              next[prodConfigIndex] = {
                                                ...prodConfig,
                                                required: isChecked,
                                                min: nextMin,
                                                max: Math.min(Math.max(prodConfig.max, nextMin), stockQuantity || Math.max(prodConfig.max, nextMin))
                                              };
                                              updateStep(index, 'products', next);
                                            }}
                                            className="rounded text-primary focus:ring-primary border-stone-300 w-3.5 h-3.5"
                                          />
                                          Required Product
                                        </label>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-1">Min Select</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max={Math.min(prodConfig.max, stockQuantity)}
                                            value={prodConfig.min}
                                            onChange={(e) => {
                                              const next = [...stepProducts];
                                              const val = parseInt(e.target.value) || 0;
                                              next[prodConfigIndex] = {
                                                ...prodConfig,
                                                min: Math.min(val, prodConfig.max, stockQuantity)
                                              };
                                              updateStep(index, 'products', next);
                                            }}
                                            className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-1">Max Select</label>
                                          <input
                                            type="number"
                                            min={Math.max(1, prodConfig.min)}
                                            max={stockQuantity}
                                            value={prodConfig.max}
                                            onChange={(e) => {
                                              const next = [...stepProducts];
                                              const val = parseInt(e.target.value) || 1;
                                              next[prodConfigIndex] = {
                                                ...prodConfig,
                                                max: Math.min(Math.max(val, prodConfig.min), stockQuantity)
                                              };
                                              updateStep(index, 'products', next);
                                            }}
                                            className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                          />
                                        </div>
                                      </div>
                                      <p className="text-[10px] text-secondary">Max limited by available stock: {stockQuantity}</p>
                                    </div>
                                  )}
                                </ProductFlowReferenceCard>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                </article>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {selectedFlow && (
                <button
                  type="button"
                  onClick={() => setPreviewFlow(selectedFlow)}
                  className="px-6 py-3 border border-primary text-primary rounded-lg font-semibold disabled:opacity-50"
                >
                  Preview Details
                </button>
              )}
              <button
                type="button"
                onClick={saveFlow}
                disabled={saving || !canSave}
                className="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : draft.id ? 'Update Flow' : 'Create Flow'}
              </button>
              {deleteAction && (
                <button
                  type="button"
                  onClick={() => deleteAction.onSelect(selectedFlow)}
                  disabled={saving}
                  className="px-6 py-3 border border-error text-error rounded-lg font-semibold disabled:opacity-50"
                >
                  Delete Flow
                </button>
              )}
            </div>
          </div>
        </section>
        </main>
      </div>
      <GiftFlowModalController
        isOpen={!!previewFlow}
        flow={previewFlow}
        viewer={viewer}
        context="vendor"
        onClose={() => setPreviewFlow(null)}
        showPublicLink={Boolean(previewFlow?.id)}
      />
      <Footer />
    </div>
  );
}
