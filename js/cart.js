/**
 * Pharmawala Pharmacy — Cart & WhatsApp Order Engine
 * Persists cart in localStorage and builds formatted WhatsApp order summaries.
 */

import { CONFIG, buildWhatsAppUrl } from './config.js';
import { formatINR } from './products.js';

export const CART_STORAGE_KEY = 'pharmawala_cart_v1';

export function getCart(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && item.id && Number(item.quantity) > 0)
      .map((item) => ({
        id: String(item.id),
        name: String(item.name || 'Product'),
        brand: String(item.brand || ''),
        pack_size: String(item.pack_size || ''),
        price: Math.max(0, Number(item.price) || 0),
        mrp: Math.max(Number(item.price) || 0, Number(item.mrp) || 0),
        image: String(item.image || 'images/placeholder.svg'),
        prescription_required: Boolean(item.prescription_required),
        quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
      }));
  } catch {
    return [];
  }
}

export function saveCart(items, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (storage) {
    try {
      storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('pharmawala:cart-updated', { detail: { items } }));
  }
  return items;
}

export function addItemToCartList(cart, product, qty = 1) {
  const safeQty = Math.max(1, Math.min(99, Math.floor(Number(qty) || 1)));
  const existingIndex = cart.findIndex((i) => i.id === product.id);
  const next = cart.map((i) => ({ ...i }));

  if (existingIndex >= 0) {
    next[existingIndex].quantity = Math.min(99, next[existingIndex].quantity + safeQty);
  } else {
    next.push({
      id: product.id,
      name: product.name,
      brand: product.brand || '',
      pack_size: product.pack_size || '',
      price: Number(product.price) || 0,
      mrp: Math.max(Number(product.price) || 0, Number(product.mrp) || 0),
      image: product.image || 'images/placeholder.svg',
      prescription_required: Boolean(product.prescription_required),
      quantity: safeQty,
    });
  }
  return next;
}

export function addToCart(product, qty = 1) {
  const current = getCart();
  const next = addItemToCartList(current, product, qty);
  return saveCart(next);
}

export function updateQuantity(productId, quantity) {
  const current = getCart();
  const nextQty = Math.floor(Number(quantity));
  const next =
    nextQty <= 0
      ? current.filter((item) => item.id !== productId)
      : current.map((item) =>
          item.id === productId ? { ...item, quantity: Math.min(99, nextQty) } : item
        );
  return saveCart(next);
}

export function removeFromCart(productId) {
  const current = getCart();
  return saveCart(current.filter((item) => item.id !== productId));
}

export function clearCart() {
  return saveCart([]);
}

export function calculateCartSummary(items, freeThreshold = CONFIG.FREE_DELIVERY_THRESHOLD, deliveryFee = CONFIG.DELIVERY_FEE) {
  let itemCount = 0;
  let mrpTotal = 0;
  let subtotal = 0;
  let hasRx = false;

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.price) || 0);
    const mrp = Math.max(price, Number(item.mrp) || price);
    itemCount += qty;
    subtotal += price * qty;
    mrpTotal += mrp * qty;
    if (item.prescription_required) hasRx = true;
  }

  const savings = Math.max(0, mrpTotal - subtotal);
  const qualifiesFreeDelivery = subtotal >= freeThreshold || subtotal === 0;
  const amountToFreeDelivery = subtotal > 0 && subtotal < freeThreshold ? freeThreshold - subtotal : 0;
  const shipping = subtotal === 0 || qualifiesFreeDelivery ? 0 : deliveryFee;
  const grandTotal = subtotal + shipping;
  const progressPercent = subtotal === 0 ? 0 : Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  return {
    itemCount,
    mrpTotal,
    subtotal,
    savings,
    shipping,
    grandTotal,
    hasRx,
    qualifiesFreeDelivery,
    amountToFreeDelivery,
    progressPercent,
    freeThreshold,
  };
}

export function validateCheckoutForm(fields) {
  const errors = {};
  const name = String(fields.name || '').trim();
  const phone = String(fields.phone || '').replace(/\D/g, '');
  const address = String(fields.address || '').trim();
  const pincode = String(fields.pincode || '').replace(/\D/g, '');

  if (name.length < 2) {
    errors.name = 'Please enter the patient or recipient full name.';
  }
  if (phone.length !== 10) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
  }
  if (address.length < 8) {
    errors.address = 'Please enter your complete delivery address and landmark.';
  }
  if (pincode.length !== 6) {
    errors.pincode = 'Please enter a valid 6-digit pincode (e.g. 700144).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      name,
      phone,
      address,
      pincode,
      notes: String(fields.notes || '').trim(),
      prescriptionFileName: String(fields.prescriptionFileName || '').trim(),
    },
  };
}

export function generateOrderRef() {
  const now = new Date();
  const code = String(now.getTime()).slice(-5);
  return `PW-${now.getFullYear()}-${code}`;
}

export function buildWhatsAppOrderMessage({ orderRef, customer, items, summary }) {
  const lines = [
    `Hello ${CONFIG.BRAND_NAME}, I would like to place a medicine order.`,
    `Order Ref: ${orderRef}`,
    '',
    'ITEMS:',
  ];

  items.forEach((item, idx) => {
    const rxTag = item.prescription_required ? ' [Rx]' : '';
    const pack = item.pack_size ? ` (${item.pack_size})` : '';
    lines.push(
      `${idx + 1}. ${item.name}${pack}${rxTag} × ${item.quantity} = ${formatINR(item.price * item.quantity)}`
    );
  });

  lines.push(
    '',
    `Subtotal: ${formatINR(summary.subtotal)}`,
    `Delivery: ${summary.shipping === 0 ? 'FREE' : formatINR(summary.shipping)}`,
    `Estimated Total: ${formatINR(summary.grandTotal)}`,
    '',
    'DELIVERY DETAILS:',
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.address}, PIN - ${customer.pincode}`
  );

  if (customer.notes) {
    lines.push(`Notes: ${customer.notes}`);
  }
  if (summary.hasRx || customer.prescriptionFileName) {
    lines.push(
      `Prescription: ${
        customer.prescriptionFileName
          ? `Selected (${customer.prescriptionFileName}) — I will attach the prescription photo/PDF in this chat.`
          : 'Rx item included — I will share my prescription in this chat.'
      }`
    );
  }

  return lines.join('\n');
}

export function getWhatsAppOrderUrl(payload) {
  return buildWhatsAppUrl(buildWhatsAppOrderMessage(payload));
}
