import {
  createVendorModel,
  normalizeVendorRelation,
  normalizeVendorRelationList,
  setVendorValue,
} from './vendorModel.js';
import { validateCanonicalModel } from '../shared/modelValidation.js';

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function assignAlias(model, path, input, aliases, transform = (value) => value) {
  for (const alias of aliases) {
    if (hasOwn(input, alias)) {
      setVendorValue(model, path, transform(input[alias]));
      return true;
    }
  }
  return false;
}

export function adaptVendor(input = {}, {
  source = 'unknown',
  products,
  giftFlows,
  ownerUser,
  complete = false,
} = {}) {
  if (input?.entityType === 'vendor' && input?.meta?.loadedFields instanceof Set) return input;
  const model = createVendorModel({ source });

  assignAlias(model, 'userId', input, ['userId']);
  assignAlias(model, 'supplierId', input, ['supplierId', 'vendorId', 'id']);
  assignAlias(model, 'storeName', input, ['storeName', 'supplierName', 'vendorStoreName']);
  assignAlias(model, 'description', input, ['description']);
  assignAlias(model, 'logoUrl', input, ['logoUrl']);
  assignAlias(model, 'bannerUrl', input, ['bannerUrl']);
  assignAlias(model, 'contactEmail', input, ['contactEmail']);
  assignAlias(model, 'contactPhone', input, ['contactPhone']);
  assignAlias(model, 'address', input, ['address']);
  assignAlias(model, 'websiteUrl', input, ['websiteUrl']);
  assignAlias(model, 'instagramUrl', input, ['instagramUrl']);
  assignAlias(model, 'facebookUrl', input, ['facebookUrl']);
  assignAlias(model, 'workingHours', input, ['workingHours']);
  assignAlias(model, 'isVerified', input, ['isVerified', 'verified']);

  if (products !== undefined) {
    setVendorValue(model, 'relations.products', normalizeVendorRelationList('product', products));
  }
  if (giftFlows !== undefined) {
    setVendorValue(model, 'relations.giftFlows', normalizeVendorRelationList('giftFlow', giftFlows));
  }
  if (ownerUser !== undefined) {
    setVendorValue(model, 'relations.ownerUser', normalizeVendorRelation('user', ownerUser));
  }

  const knownFields = new Set([
    'userId', 'supplierId', 'vendorId', 'id', 'storeName', 'supplierName', 'vendorStoreName',
    'description', 'logoUrl', 'bannerUrl', 'contactEmail', 'contactPhone', 'address',
    'websiteUrl', 'instagramUrl', 'facebookUrl', 'workingHours', 'isVerified', 'verified',
  ]);
  model.meta.unknownFields = Object.keys(input || {}).filter((field) => !knownFields.has(field));

  model.meta.isPartial = !complete;
  return validateCanonicalModel(model);
}

export const adaptDomainVendor = (vendor) => adaptVendor(vendor, {
  source: 'vendor-domain',
  complete: true,
});

export const adaptPublicVendor = (vendor, relations = {}) => adaptVendor(vendor, {
  source: 'public-vendor',
  ...relations,
  complete: true,
});

export const adaptVendorSearchResult = (vendor) => adaptVendor(vendor, {
  source: 'vendor-search',
});
