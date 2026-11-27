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
  buildProductWhatsAppUrl,
  isStoreOpenNow,
} from '../js/config.js';

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

test('filterProducts, sortProducts, extractCategories and paginateProducts work without search', () => {
  const catalog = [
    normalizeProduct({ id: '1', name: 'Dolo 650', brand: 'Micro Labs', category: 'Medicines', price: 30, mrp: 35, prescription_required: false, in_stock: true }),
    normalizeProduct({ id: '2', name: 'Glycomet GP 1', brand: 'USV', category: 'Diabetes Care', price: 120, mrp: 150, prescription_required: true, in_stock: true }),
    normalizeProduct({ id: '3', name: 'Nebulizer', brand: 'Omron', category: 'Healthcare Devices', price: 2100, mrp: 2500, prescription_required: false, in_stock: false }),
  ];

  assert.equal(extractCategories(catalog).length, 3);
  assert.deepEqual(extractBrands(catalog), ['Micro Labs', 'Omron', 'USV']);

  const byCategory = filterProducts(catalog, { category: 'Diabetes Care' });
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].id, '2');

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

test('buildProductWhatsAppUrl encodes product name, pack size, price, and Rx note', () => {
  const product = normalizeProduct({
    id: 'pw-003',
    name: 'Telma 40 Tablet',
    pack_size: 'Strip of 30 tablets',
    price: 212,
    mrp: 250,
    prescription_required: true,
    in_stock: true,
  });

  const url = buildProductWhatsAppUrl(product);
  assert.ok(url.startsWith('https://wa.me/918282082425?text='));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes('Telma 40 Tablet'));
  assert.ok(decoded.includes('Strip of 30 tablets'));
  assert.ok(decoded.includes('212'));
  assert.ok(decoded.includes('valid prescription'));
});

test('isStoreOpenNow accurately checks 8:00 AM to 10:30 PM IST hours', () => {
  // 10:00 AM IST = 04:30 UTC
  assert.equal(isStoreOpenNow(new Date('2026-11-27T04:30:00Z')), true);
  // 11:00 PM IST = 17:30 UTC
  assert.equal(isStoreOpenNow(new Date('2026-11-27T17:30:00Z')), false);
});
