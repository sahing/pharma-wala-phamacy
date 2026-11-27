/**
 * Pharmawala Pharmacy — Product Catalog Engine
 * Defensively maps arbitrary data.json fields, computes discounts,
 * extracts categories & brands, and runs filtering, sorting & pagination.
 */

import { CONFIG, resolveHref } from './config.js';

let cachedProducts = null;

/**
 * Defensively normalizes a raw product object from data.json.
 * Handles missing keys, alternate key names, and computes discount from MRP & price.
 */
export function normalizeProduct(raw, index = 0) {
  const item = raw && typeof raw === 'object' ? raw : {};

  const id = String(
    item.id ?? item.sku ?? item.product_id ?? `pw-item-${index + 1}`
  ).trim();

  const name = String(
    item.name ?? item.title ?? item.product_name ?? 'Healthcare Product'
  ).trim();

  const brand = String(
    item.brand ?? item.manufacturer ?? item.company ?? ''
  ).trim();

  const category = String(
    item.category ?? item.department ?? 'General Healthcare'
  ).trim();

  const composition = String(
    item.composition ?? item.salt ?? item.generic_name ?? item.ingredients ?? ''
  ).trim();

  const pack_size = String(
    item.pack_size ?? item.packSize ?? item.unit ?? item.quantity_label ?? ''
  ).trim();

  const mrpRaw = Number(item.mrp ?? item.original_price ?? item.price ?? 0);
  const priceRaw = Number(item.price ?? item.selling_price ?? item.mrp ?? 0);

  const mrp = Number.isFinite(mrpRaw) && mrpRaw > 0 ? Math.round(mrpRaw) : Math.max(0, Math.round(priceRaw));
  const price = Number.isFinite(priceRaw) && priceRaw > 0 ? Math.round(priceRaw) : mrp;
  const safeMrp = mrp >= price ? mrp : price;

  let discount = Number(item.discount);
  if (!Number.isFinite(discount) || discount < 0) {
    discount = safeMrp > price && safeMrp > 0
      ? Math.round(((safeMrp - price) / safeMrp) * 100)
      : 0;
  } else {
    discount = Math.round(discount);
  }

  const rawImage = String(item.image ?? item.img ?? item.thumbnail ?? '').trim();
  const image = rawImage
    ? rawImage.startsWith('http') || rawImage.startsWith('/') || rawImage.startsWith('images/')
      ? rawImage
      : `images/products/${rawImage}`
    : 'images/placeholder.svg';

  const rxVal = item.prescription_required ?? item.rx ?? item.requires_prescription ?? false;
  const prescription_required =
    rxVal === true || String(rxVal).toLowerCase() === 'true' || String(rxVal).toLowerCase() === 'yes';

  const stockVal = item.in_stock ?? item.inStock ?? item.available;
  const in_stock =
    stockVal === undefined
      ? true
      : stockVal === true || String(stockVal).toLowerCase() === 'true' || Number(stockVal) > 0;

  return {
    id,
    name,
    brand,
    category,
    composition,
    pack_size,
    price,
    mrp: safeMrp,
    discount,
    image,
    description: String(item.description ?? item.summary ?? '').trim(),
    uses: String(item.uses ?? item.indications ?? '').trim(),
    dosage: String(item.dosage ?? '').trim(),
    side_effects: String(item.side_effects ?? item.sideEffects ?? '').trim(),
    storage: String(item.storage ?? '').trim(),
    prescription_required,
    in_stock,
    featured: Boolean(item.featured),
  };
}

/**
 * Fetches and caches normalized products from data/data.json.
 * Supports root JSON array or wrapped shapes ({ products: [...] } / { items: [...] }).
 */
export async function loadProducts({ forceReload = false } = {}) {
  if (cachedProducts && !forceReload) {
    return cachedProducts;
  }

  const dataUrl = resolveHref('data/data.json');
  const response = await fetch(dataUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Unable to load medicine catalogue (HTTP ${response.status}).`);
  }

  const json = await response.json();
  const rawList = Array.isArray(json)
    ? json
    : Array.isArray(json?.products)
      ? json.products
      : Array.isArray(json?.items)
        ? json.items
        : [];

  cachedProducts = rawList.map((entry, idx) => normalizeProduct(entry, idx));
  return cachedProducts;
}

export function extractCategories(products) {
  const counts = new Map();
  for (const p of products) {
    counts.set(p.category, (counts.get(p.category) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function extractBrands(products) {
  const set = new Set();
  for (const p of products) {
    if (p.brand) set.add(p.brand);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterProducts(products, filters = {}) {
  const {
    category = '',
    brand = '',
    minPrice = null,
    maxPrice = null,
    rxMode = 'all', // 'all' | 'rx' | 'otc'
    inStockOnly = false,
  } = filters;

  const catLower = String(category || '').trim().toLowerCase();
  const brandLower = String(brand || '').trim().toLowerCase();

  return products.filter((p) => {
    if (catLower && p.category.toLowerCase() !== catLower) return false;
    if (brandLower && p.brand.toLowerCase() !== brandLower) return false;
    if (minPrice !== null && minPrice !== '' && Number.isFinite(Number(minPrice)) && p.price < Number(minPrice)) {
      return false;
    }
    if (maxPrice !== null && maxPrice !== '' && Number.isFinite(Number(maxPrice)) && p.price > Number(maxPrice)) {
      return false;
    }
    if (rxMode === 'rx' && !p.prescription_required) return false;
    if (rxMode === 'otc' && p.prescription_required) return false;
    if (inStockOnly && !p.in_stock) return false;
    return true;
  });
}

export function sortProducts(products, sortBy = 'featured') {
  const list = [...products];
  switch (sortBy) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    case 'discount-desc':
      return list.sort((a, b) => b.discount - a.discount || a.price - b.price);
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'featured':
    case 'relevance':
    default:
      return list.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.in_stock) - Number(a.in_stock));
  }
}

export function paginateProducts(products, page = 1, perPage = CONFIG.ITEMS_PER_PAGE) {
  const safePerPage = Math.max(1, Number(perPage) || 24);
  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePerPage));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * safePerPage;
  return {
    items: products.slice(start, start + safePerPage),
    currentPage,
    totalPages,
    totalItems,
  };
}

export function getRelatedProducts(products, currentProduct, limit = 4) {
  if (!currentProduct) return [];
  const sameCategory = products.filter(
    (p) => p.id !== currentProduct.id && p.category === currentProduct.category && p.in_stock
  );
  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }
  const rest = products.filter(
    (p) => p.id !== currentProduct.id && p.category !== currentProduct.category && p.in_stock
  );
  return [...sameCategory, ...rest].slice(0, limit);
}

export function formatINR(amount) {
  const num = Number(amount) || 0;
  return `${CONFIG.CURRENCY_SYMBOL}${num.toLocaleString('en-IN')}`;
}
