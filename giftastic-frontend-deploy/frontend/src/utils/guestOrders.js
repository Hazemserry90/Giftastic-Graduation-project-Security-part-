const GUEST_ORDERS_KEY = 'giftastic_guest_orders';

const normalizeText = (value) => String(value || '').trim();

export const normalizeGuestPhone = (value) => normalizeText(value).replace(/\D/g, '');

export function readGuestOrderRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_ORDERS_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((record) => record?.orderId && record?.email && record?.phone)
      : [];
  } catch {
    localStorage.removeItem(GUEST_ORDERS_KEY);
    return [];
  }
}

const normalizeGuestOrderItems = (items) => (Array.isArray(items) ? items : []).map((item) => ({
  productId: normalizeText(item.productId),
  productName: normalizeText(item.productName || item.name || 'Gift item'),
  imageUrl: item.imageUrl || null,
  quantity: Number.isSafeInteger(item.quantity) ? item.quantity : null,
  price: item.price ?? null,
  supplierId: item.supplierId || null,
})).filter((item) => item.productId || item.productName);

export function rememberGuestOrder({
  orderId,
  email,
  phone,
  placedAt,
  status,
  totalAmount,
  paymentMethod,
  items,
}) {
  const record = {
    orderId: normalizeText(orderId),
    email: normalizeText(email).toLowerCase(),
    phone: normalizeGuestPhone(phone),
    placedAt: placedAt || new Date().toISOString(),
    status: normalizeText(status) || 'PENDING_CONFIRMATION',
    totalAmount: totalAmount ?? null,
    paymentMethod: paymentMethod || null,
    items: normalizeGuestOrderItems(items),
  };

  if (!record.orderId || !record.email || !record.phone) {
    return null;
  }

  const existing = readGuestOrderRecords().filter((item) => item.orderId !== record.orderId);
  localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify([record, ...existing].slice(0, 25)));
  return record;
}

export function getGuestOrderRecord(orderId) {
  const normalizedOrderId = normalizeText(orderId);
  return readGuestOrderRecords().find((record) => record.orderId === normalizedOrderId) || null;
}

export function guestOrderRecordToOrder(record) {
  return {
    id: record.orderId,
    customerId: null,
    guestInfo: { email: record.email, phone: record.phone },
    status: record.status || 'PENDING_CONFIRMATION',
    totalAmount: record.totalAmount ?? null,
    placedAt: record.placedAt,
    paymentMethod: record.paymentMethod || null,
    items: normalizeGuestOrderItems(record.items),
  };
}

export function getGuestOrderContacts() {
  const contacts = new Map();
  readGuestOrderRecords().forEach((record) => {
    const key = `${record.email}:${record.phone}`;
    if (!contacts.has(key)) {
      contacts.set(key, { email: record.email, phone: record.phone });
    }
  });
  return [...contacts.values()];
}
