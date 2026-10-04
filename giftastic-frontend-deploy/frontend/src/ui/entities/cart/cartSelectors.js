import { hasLoadedEntityField } from '../shared/entityModel.js';
import { addDecimals, formatMoney, multiplyDecimal } from '../shared/decimal.js';

export function getCartItemCount(cart) {
  if (!cart) return 0;
  if (!hasLoadedEntityField(cart, 'items')) return null;
  let count = 0;
  for (const item of cart.items) {
    if (item.quantity === null || item.quantity === undefined) return null;
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity)) return null;
    count += quantity;
  }
  return count;
}

export function getCartItemTotal(item) {
  if (item?.price === null || item?.price === undefined
    || item?.quantity === null || item?.quantity === undefined) return null;
  return Number.isSafeInteger(item.quantity) ? multiplyDecimal(item.price, String(item.quantity)) : null;
}

export function getCartItemsTotal(items = []) {
  let total = '0';
  for (const item of items) {
    const itemTotal = getCartItemTotal(item);
    if (itemTotal === null) return null;
    total = addDecimals(total, itemTotal);
  }
  return total;
}

export function getCartTotal(cart) {
  if (!cart) return 0;
  if (hasLoadedEntityField(cart, 'total')) return cart.total;
  if (!hasLoadedEntityField(cart, 'items')) return null;
  return getCartItemsTotal(cart.items);
}

export function groupCartItems(cart) {
  if (!cart || !hasLoadedEntityField(cart, 'items')) return [];
  const groups = new Map();
  for (const item of cart.items) {
    const groupId = item.groupId || null;
    const key = groupId || `product:${item.productId}`;
    if (!groups.has(key)) groups.set(key, { key, groupId, items: [] });
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}

export function getCartStockIssues(cart) {
  const issues = { unavailable: [], outOfStock: [], insufficient: [] };
  if (!cart || !hasLoadedEntityField(cart, 'items')) return issues;
  for (const item of cart.items) {
    if (item.stockQuantity === null || item.stockQuantity === undefined) {
      issues.unavailable.push(item);
    } else if (Number(item.stockQuantity) === 0) {
      issues.outOfStock.push(item);
    } else if (Number(item.quantity) > Number(item.stockQuantity)) {
      issues.insufficient.push(item);
    }
  }
  return issues;
}

export const formatCartMoney = (value) => formatMoney(value);
