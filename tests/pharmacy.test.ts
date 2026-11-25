import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeProduct,
  extractCategories,
  extractBrands,
  filterProducts,
  sortProducts,
  paginateProducts,
} from '../js/products.js';
import {
  addItemToCartList,
  calculateCartSummary,
  validateCheckoutForm,
  buildWhatsAppOrderMessage,
} from '../js/cart.js';
import { getInstantSuggestions } from '../js/search.js';

test('normalizeProduct maps missing fields defensively and auto-computes discount', () => {
  const normalized = normalizeProduct({
    sku: 'test-1',
    title: 'Paracetamol 500',
    manufacturer: 'Cipla',
    salt: 'Paracetamol IP 500mg',
    price: 80,
    mrp: 100,
    rx: 'true',
  });

  assert.equal(normalized.id, 'test-1');
  assert.equal(normalized.name, 'Paracetamol 500');
  assert.equal(normalized.brand, 'Cipla');
  assert.equal(normalized.composition, 'Paracetamol IP 500mg');
  assert.equal(normalized.discount, 20);
  assert.equal(normalized.prescription_required, true);
  assert.equal(normalized.in_stock, true);
  assert.equal(normalized.image, 'images/placeholder.svg');
});

test('filterProducts, sortProducts, extractCategories and paginateProducts work together', () => {
  const catalog = [
    normalizeProduct({ id: '1', name: 'Dolo 650', brand: 'Micro Labs', category: 'Medicines', price: 30, mrp: 35, prescription_required: false, in_stock: true }),
    normalizeProduct({ id: '2', name: 'Glycomet GP 1', brand: 'USV', category: 'Diabetes Care', price: 120, mrp: 150, prescription_required: true, in_stock: true }),
    normalizeProduct({ id: '3', name: 'Nebulizer', brand: 'Omron', category: 'Healthcare Devices', price: 2100, mrp: 2500, prescription_required: false, in_stock: false }),
  ];

  assert.equal(extractCategories(catalog).length, 3);
  assert.deepEqual(extractBrands(catalog), ['Micro Labs', 'Omron', 'USV']);

  const rxOnly = filterProducts(catalog, { rxMode: 'rx' });
  assert.equal(rxOnly.length, 1);
  assert.equal(rxOnly[0].id, '2');

  const inStockOnly = filterProducts(catalog, { inStockOnly: true });
  assert.equal(inStockOnly.length, 2);

  const sortedDesc = sortProducts(catalog, 'price-desc');
  assert.equal(sortedDesc[0].id, '3');

  const page = paginateProducts(catalog, 1, 2);
  assert.equal(page.items.length, 2);
  assert.equal(page.totalPages, 2);
});

test('getInstantSuggestions ranks exact name matches above salt/category matches', () => {
  const catalog = [
    normalizeProduct({ id: '1', name: 'Pan 40', composition: 'Pantoprazole', category: 'Medicines', price: 140, mrp: 165 }),
    normalizeProduct({ id: '2', name: 'Dolo 650', composition: 'Paracetamol 650 mg', category: 'Medicines', price: 29, mrp: 34 }),
  ];

  const matches = getInstantSuggestions(catalog, 'Paracetamol');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, '2');
});

test('cart calculations compute savings, free delivery threshold, and Rx flag accurately', () => {
  const p1 = normalizeProduct({ id: '1', name: 'Dolo 650', price: 100, mrp: 120, prescription_required: false });
  const p2 = normalizeProduct({ id: '2', name: 'Telma 40', price: 250, mrp: 300, prescription_required: true });

  let cart = addItemToCartList([], p1, 2); // 200 (MRP 240)
  let summary = calculateCartSummary(cart, 499, 35);
  assert.equal(summary.subtotal, 200);
  assert.equal(summary.savings, 40);
  assert.equal(summary.shipping, 35);
  assert.equal(summary.qualifiesFreeDelivery, false);
  assert.equal(summary.amountToFreeDelivery, 299);
  assert.equal(summary.hasRx, false);

  cart = addItemToCartList(cart, p2, 2); // +500 => subtotal 700
  summary = calculateCartSummary(cart, 499, 35);
  assert.equal(summary.subtotal, 700);
  assert.equal(summary.shipping, 0);
  assert.equal(summary.qualifiesFreeDelivery, true);
  assert.equal(summary.hasRx, true);
});

test('validateCheckoutForm rejects invalid inputs and builds formatted WhatsApp order text', () => {
  const invalid = validateCheckoutForm({ name: 'A', phone: '123', address: 'Short', pincode: '700' });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.address);
  assert.ok(invalid.errors.pincode);

  const valid = validateCheckoutForm({
    name: 'Arindam Sen',
    phone: '9830011223',
    address: '14 Station Road, Uttar Khodarbazar, Baruipur',
    pincode: '700144',
    notes: 'Call on arrival',
  });
  assert.equal(valid.isValid, true);

  const msg = buildWhatsAppOrderMessage({
    orderRef: 'PW-2026-12345',
    customer: valid.cleaned,
    items: [{ id: '1', name: 'Dolo 650', pack_size: 'Strip of 15', price: 29, mrp: 34, quantity: 2, prescription_required: false }],
    summary: { subtotal: 58, shipping: 35, grandTotal: 93, hasRx: false },
  });
  assert.ok(msg.includes('PW-2026-12345'));
  assert.ok(msg.includes('Dolo 650'));
  assert.ok(msg.includes('Arindam Sen'));
  assert.ok(msg.includes('700144'));
});
