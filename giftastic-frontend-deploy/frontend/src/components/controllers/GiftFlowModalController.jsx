import { useEffect, useMemo, useState } from 'react';
import GiftFlowModal from '../modals/GiftFlowModal';
import ProductModal from '../modals/ProductModal';
import { adaptEntityFromNamedSource } from '../../ui/entities/namedAdapters';
import {
  buildGiftFlowAccess,
  buildGiftFlowActions,
  GIFT_FLOW_CONTEXT,
} from '../../ui/entities/giftFlow';
import { buildProductAccess, PRODUCT_CONTEXT } from '../../ui/entities/product';
import { hasLoadedEntityField } from '../../ui/entities/shared';
import {
  authorizeEntityHydration,
  hydrateEntitiesById,
  hydrateEntityById,
} from '../../ui/entities/shared/productionHydration';

const CONTEXT_MAP = {
  public: GIFT_FLOW_CONTEXT.PUBLIC,
  vendor: GIFT_FLOW_CONTEXT.OWNER,
  admin: GIFT_FLOW_CONTEXT.ADMIN,
  system: GIFT_FLOW_CONTEXT.SYSTEM,
};
const EMPTY_PRODUCTS = Object.freeze([]);

export default function GiftFlowModalController({
  flow,
  flowId,
  isOpen = true,
  onClose,
  viewer,
  context = 'public',
  title,
  showPublicLink = false,
  products = EMPTY_PRODUCTS,
  hydrateProducts = true,
  onAction,
  actionLoading = false,
}) {
  const [entity, setEntity] = useState(() => flow
    ? adaptEntityFromNamedSource('adaptGiftFlowResponse', flow)
    : null);
  const [productEntities, setProductEntities] = useState(() => products.map((product) =>
    adaptEntityFromNamedSource('adaptProductDomain', product)));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const id = flowId || entity?.id;
  const access = useMemo(() => entity ? buildGiftFlowAccess({
    flow: entity,
    viewer,
    context: CONTEXT_MAP[context] || context,
  }) : null, [context, entity, viewer]);

  useEffect(() => {
    setEntity(flow ? adaptEntityFromNamedSource('adaptGiftFlowResponse', flow) : null);
  }, [flow]);

  useEffect(() => {
    setProductEntities(products.map((product) =>
      adaptEntityFromNamedSource('adaptProductDomain', product)));
  }, [products]);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !id || (entity && hasLoadedEntityField(entity, 'configuration'))) return undefined;
    setLoading(true);
    setLoadError('');
    const hydrationCandidate = entity || adaptEntityFromNamedSource('adaptGiftFlowResponse', { id });
    const authorized = authorizeEntityHydration('giftFlow', {
      entity: hydrationCandidate,
      id,
      viewer,
      context: CONTEXT_MAP[context] || context,
    });
    hydrateEntityById('giftFlow', id, { authorized })
      .then((model) => {
        if (!cancelled && model) setEntity(model);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Full gift flow details could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [context, entity, id, isOpen, viewer]);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !hydrateProducts || !entity?.productIds?.length) return undefined;
    const existing = new Set(productEntities.map((product) => product.id));
    const missing = entity.productIds.filter((productId) => !existing.has(productId));
    if (!missing.length) return undefined;
    setProductsLoading(true);
    hydrateEntitiesById('product', missing, { authorized: Boolean(access?.canRead) })
      .then((results) => {
        if (!cancelled) {
          setProductEntities((current) => [
            ...current,
            ...results,
          ]);
        }
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => { cancelled = true; };
  }, [access?.canRead, entity, hydrateProducts, isOpen, productEntities]);

  const actions = useMemo(() => entity && access ? buildGiftFlowActions({
    flow: entity,
    access,
    handlers: {
      edit: onAction ? () => onAction('edit', entity) : undefined,
      delete: onAction ? () => onAction('delete', entity) : undefined,
    },
  }) : [], [access, entity, onAction]);

  return (
    <>
      <GiftFlowModal
        entity={entity}
        access={access}
        actions={actions}
        products={productEntities}
        isOpen={isOpen}
        onClose={onClose}
        onProductOpen={setSelectedProduct}
        title={title}
        showPublicLink={showPublicLink}
        loading={loading}
        productsLoading={productsLoading}
        loadError={loadError}
        actionLoading={actionLoading}
      />
      <ProductModal
        isOpen={!!selectedProduct}
        entity={selectedProduct}
        access={selectedProduct ? buildProductAccess({
          product: selectedProduct,
          viewer,
          context: context === 'admin' ? PRODUCT_CONTEXT.ADMIN_MODERATION : PRODUCT_CONTEXT.PUBLIC,
        }) : null}
        onClose={() => setSelectedProduct(null)}
        showPublicLink={Boolean(selectedProduct?.id)}
      />
    </>
  );
}
