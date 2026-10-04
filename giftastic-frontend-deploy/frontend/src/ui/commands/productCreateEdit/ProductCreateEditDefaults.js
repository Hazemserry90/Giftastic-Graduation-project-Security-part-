import { PRODUCT_DETAIL_FIELDS } from '../../entities/product/productModel.js';

const falseFields = new Set([
  'allowsEngraving', 'allowsCustomMessage', 'allowsColorChoice', 'allowsSizeChoice',
  'allowsGiftWrap', 'isGiftWrapped', 'includesGiftBox', 'includesRibbon',
  'requiresDeliveryDate', 'allowsScheduledDelivery', 'isPerishable',
  'requiresRecipientInfo', 'requiresRecipientName', 'requiresRecipientEmail',
  'requiresRecipientPhone', 'requiresRecipientAddress', 'isContainer', 'containsLetter',
  'containsCard', 'containsFlowers', 'containsChocolates', 'containsFood',
  'isFeatured', 'isBestseller', 'handmade', 'madeToOrder', 'customizable',
]);
const trueFields = new Set(['allowsGiftReceipt', 'allowsAnonymousGift', 'isNewArrival']);

export const defaultProductDetails = Object.freeze(Object.fromEntries(
  PRODUCT_DETAIL_FIELDS.map((field) => [field,
    falseFields.has(field) ? false : trueFields.has(field) ? true : field === 'gender' ? 'UNISEX' : '']),
));
