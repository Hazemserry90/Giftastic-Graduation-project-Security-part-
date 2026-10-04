import { adaptEntity, consumeEntitySourceField, createEntityReference, markDerivedFieldInvalid, markEntityFieldInvalid, safeParseJson, setEntityValue } from '../shared/entityModel.js';
import { createCartModel } from './cartModel.js';
import { adaptEmbeddedValue, applyEmbeddedResult } from '../shared/embeddedAdapters.js';
import { adaptProduct } from '../product/productAdapters.js';
import { adaptVendor } from '../vendor/vendorAdapters.js';

export function adaptCart(input = {}, { source = 'cart', complete = false } = {}) {
  if (input?.entityType === 'cart' && input?.meta?.loadedFields instanceof Set) return input;
  const model = adaptEntity(input, createCartModel({ source }), {
    id: ['id', 'cartId'],
    customerId: ['customerId'],
    total: ['total'],
    updatedAt: ['updatedAt'],
  });
  if (Object.hasOwn(input, 'items')) {
    consumeEntitySourceField(model, 'items');
    if (!Array.isArray(input.items)) {
      markEntityFieldInvalid(model, 'items', input.items, 'Expected Cart Item array');
      model.meta.isPartial = !complete;
      return model;
    }
    setEntityValue(model, 'items', input.items.map((item, index) => {
      const root = `items.${index}`;
      const result = adaptEmbeddedValue('cartItem', item, { path: root });
      const metadata = safeParseJson(item.metadata);
      const normalized = applyEmbeddedResult(model, root, result);
      normalized.parsedMetadata = metadata.value;
      if (Object.hasOwn(item, 'metadata')) model.meta.derivedFields.add(`${root}.parsedMetadata`);
      const productSnapshot = adaptProduct(item, { source: 'cart-item-product-snapshot', complete: false });
      normalized.product = createEntityReference('product', normalized.productId, productSnapshot);
      const vendorSnapshot = adaptVendor({ supplierId: normalized.supplierId, storeName: normalized.storeName }, { source: 'cart-item-vendor-snapshot', complete: false });
      normalized.vendor = createEntityReference('vendor', normalized.supplierId, vendorSnapshot);
      if (!metadata.ok) markDerivedFieldInvalid(model, `${root}.parsedMetadata`, item.metadata, metadata.reason);
      return normalized;
    }));
  }
  model.meta.isPartial = !complete;
  return model;
}
