/**
 * Pharmawala Pharmacy — Main Page Controller & Router
 * Initializes shared header/footer/search and page-specific interactive flows.
 */

import {
  CONFIG,
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsAppUrl,
  resolveHref,
} from './config.js';
import {
  addToCart,
  calculateCartSummary,
  clearCart,
  generateOrderRef,
  getCart,
  getWhatsAppOrderUrl,
  removeFromCart,
  updateQuantity,
  validateCheckoutForm,
} from './cart.js';
import {
  extractBrands,
  extractCategories,
  filterProducts,
  formatINR,
  getRelatedProducts,
  loadProducts,
  paginateProducts,
  sortProducts,
} from './products.js';
import { debounce, initSearchWidget } from './search.js';
import {
  bindAddToCartButtons,
  escapeHtml,
  getCategoryIcon,
  initAccordions,
  initCarousel,
  initScrollReveal,
  populateMegaMenuCategories,
  renderFloatingDoctorButton,
  renderFooter,
  renderHeader,
  renderProductCard,
  renderSkeletonGrid,
  showToast,
  updateCartBadges,
} from './ui.js';

function hydrateConfigBindings() {
  document.querySelectorAll('[data-config-clinic-href]').forEach((el) => {
    el.setAttribute('href', resolveHref(CONFIG.CLINIC_URL));
    if (/^https?:/i.test(CONFIG.CLINIC_URL)) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
  document.querySelectorAll('[data-config-tel]').forEach((el) => {
    el.setAttribute('href', buildTelUrl());
  });
  document.querySelectorAll('[data-config-map]').forEach((el) => {
    el.setAttribute('src', CONFIG.MAP_EMBED_URL);
  });
}

/* ==========================================================================
   HOME PAGE CONTROLLER
   ========================================================================== */
async function initHomePage() {
  const heroSearch = document.getElementById('hero-search-widget');
  if (heroSearch) initSearchWidget(heroSearch);

  initCarousel('offers-carousel');
  initAccordions();

  const catGrid = document.getElementById('home-categories-grid');
  const featuredGrid = document.getElementById('home-featured-grid');

  if (featuredGrid) {
    featuredGrid.innerHTML = renderSkeletonGrid(8);
  }

  try {
    const products = await loadProducts();
    populateMegaMenuCategories(products);

    if (catGrid) {
      const categories = extractCategories(products).slice(0, 8);
      catGrid.innerHTML = categories
        .map(
          (cat) => `
        <a class="category-card" href="${resolveHref(`shop.html?category=${encodeURIComponent(cat.name)}`)}">
          <span class="category-icon">${getCategoryIcon(cat.name)}</span>
          <div>
            <div class="category-name">${escapeHtml(cat.name)}</div>
            <div class="category-meta tabular-nums">${cat.count} ${cat.count === 1 ? 'item' : 'items'}</div>
          </div>
        </a>`
        )
        .join('');
    }

    if (featuredGrid) {
      const featured = products.filter((p) => p.featured && p.in_stock);
      const pool = featured.length >= 4 ? featured : products.filter((p) => p.in_stock);
      // Interleave by image asset so adjacent cards show varied studio photography
      const buckets = new Map();
      pool.forEach((p) => {
        const key = p.image || 'default';
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(p);
      });
      const interleaved = [];
      const lists = Array.from(buckets.values());
      let added = true;
      while (interleaved.length < 8 && added) {
        added = false;
        for (const list of lists) {
          if (list.length && interleaved.length < 8) {
            interleaved.push(list.shift());
            added = true;
          }
        }
      }
      featuredGrid.innerHTML = interleaved.map(renderProductCard).join('');
      bindAddToCartButtons(featuredGrid, products);
    }
  } catch (err) {
    if (featuredGrid) {
      featuredGrid.innerHTML = `
        <div class="state-card" style="grid-column: 1 / -1;">
          <h3>Unable to load medicines right now</h3>
          <p>${escapeHtml(err.message || 'Please check your connection or order directly on WhatsApp.')}</p>
          <a class="btn btn-whatsapp" href="${buildWhatsAppUrl('Hello Pharmawala Pharmacy, I would like to order medicines.')}" target="_blank" rel="noopener noreferrer">Order via WhatsApp</a>
        </div>
      `;
    }
  }
}

/* ==========================================================================
   SHOP PAGE CONTROLLER
   ========================================================================== */
async function initShopPage() {
  const grid = document.getElementById('shop-products-grid');
  const countEl = document.getElementById('shop-results-count');
  const paginationEl = document.getElementById('shop-pagination');
  const headingEl = document.getElementById('shop-page-heading');
  const queryInput = document.getElementById('shop-filter-query');
  const catSelect = document.getElementById('shop-filter-category');
  const brandSelect = document.getElementById('shop-filter-brand');
  const minInput = document.getElementById('shop-filter-min');
  const maxInput = document.getElementById('shop-filter-max');
  const inStockCheck = document.getElementById('shop-filter-stock');
  const sortSelect = document.getElementById('shop-sort');
  const resetBtn = document.getElementById('shop-reset-filters');
  const rxBtns = Array.from(document.querySelectorAll('[data-rx-filter]'));

  if (!grid) return;
  grid.innerHTML = renderSkeletonGrid(9);

  const params = new URLSearchParams(window.location.search);
  const state = {
    query: params.get('q') || '',
    category: params.get('category') || '',
    brand: params.get('brand') || '',
    minPrice: params.get('min') || '',
    maxPrice: params.get('max') || '',
    rxMode: params.get('rx') || 'all',
    inStockOnly: params.get('stock') === '1',
    sortBy: params.get('sort') || 'relevance',
    page: Math.max(1, Number(params.get('page')) || 1),
  };

  let allProducts = [];

  try {
    allProducts = await loadProducts();
    populateMegaMenuCategories(allProducts);
  } catch (err) {
    grid.innerHTML = `
      <div class="state-card" style="grid-column: 1 / -1;">
        <h2>Catalogue temporarily unavailable</h2>
        <p>${escapeHtml(err.message)}</p>
        <a class="btn btn-whatsapp" href="${buildWhatsAppUrl('Hello Pharmawala Pharmacy, please help me order medicines.')}" target="_blank" rel="noopener noreferrer">Order via WhatsApp</a>
      </div>`;
    return;
  }

  // Populate dynamic categories & brands from data.json
  const categories = extractCategories(allProducts);
  const brands = extractBrands(allProducts);

  if (catSelect) {
    catSelect.innerHTML =
      `<option value="">All Categories (${allProducts.length})</option>` +
      categories
        .map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.count})</option>`)
        .join('');
    catSelect.value = state.category;
  }

  if (brandSelect) {
    brandSelect.innerHTML =
      `<option value="">All Brands (${brands.length})</option>` +
      brands.map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
    brandSelect.value = state.brand;
  }

  if (queryInput) queryInput.value = state.query;
  if (minInput) minInput.value = state.minPrice;
  if (maxInput) maxInput.value = state.maxPrice;
  if (inStockCheck) inStockCheck.checked = state.inStockOnly;
  if (sortSelect) sortSelect.value = state.sortBy;

  const syncRxButtons = () => {
    rxBtns.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-rx-filter') === state.rxMode));
    });
  };
  syncRxButtons();

  const renderShop = () => {
    const filtered = filterProducts(allProducts, state);
    const sorted = sortProducts(filtered, state.sortBy, state.query);
    const pageData = paginateProducts(sorted, state.page, CONFIG.ITEMS_PER_PAGE);
    state.page = pageData.currentPage;

    if (headingEl) {
      headingEl.textContent = state.category
        ? state.category
        : state.query
          ? `Search results for "${state.query}"`
          : 'All Medicines & Health Products';
    }

    if (countEl) {
      countEl.textContent = `Showing ${pageData.items.length} of ${pageData.totalItems} ${
        pageData.totalItems === 1 ? 'product' : 'products'
      }`;
    }

    if (!pageData.items.length) {
      grid.innerHTML = `
        <div class="state-card" style="grid-column: 1 / -1;">
          <h3>No matching medicines found</h3>
          <p>Try clearing some filters, searching by salt composition, or upload your prescription and we will arrange it for you in Baruipur.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary" id="empty-reset-btn">Reset All Filters</button>
            <a class="btn btn-primary" href="${resolveHref('prescription.html')}">Upload Prescription</a>
          </div>
        </div>
      `;
      document.getElementById('empty-reset-btn')?.addEventListener('click', resetAll);
    } else {
      grid.innerHTML = pageData.items.map(renderProductCard).join('');
    }

    if (paginationEl) {
      if (pageData.totalPages <= 1) {
        paginationEl.innerHTML = '';
      } else {
        paginationEl.innerHTML = `
          <button type="button" class="btn btn-secondary btn-sm" id="page-prev" ${pageData.currentPage <= 1 ? 'disabled' : ''}>Previous</button>
          <span class="tabular-nums" style="font-size:14px;color:var(--ink-secondary);">Page ${pageData.currentPage} of ${pageData.totalPages}</span>
          <button type="button" class="btn btn-secondary btn-sm" id="page-next" ${pageData.currentPage >= pageData.totalPages ? 'disabled' : ''}>Next</button>
        `;
        document.getElementById('page-prev')?.addEventListener('click', () => {
          state.page = Math.max(1, state.page - 1);
          renderShop();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        document.getElementById('page-next')?.addEventListener('click', () => {
          state.page = Math.min(pageData.totalPages, state.page + 1);
          renderShop();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
  };

  const resetAll = () => {
    state.query = '';
    state.category = '';
    state.brand = '';
    state.minPrice = '';
    state.maxPrice = '';
    state.rxMode = 'all';
    state.inStockOnly = false;
    state.sortBy = 'relevance';
    state.page = 1;
    if (queryInput) queryInput.value = '';
    if (catSelect) catSelect.value = '';
    if (brandSelect) brandSelect.value = '';
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
    if (inStockCheck) inStockCheck.checked = false;
    if (sortSelect) sortSelect.value = 'relevance';
    syncRxButtons();
    renderShop();
  };

  bindAddToCartButtons(grid, allProducts);

  queryInput?.addEventListener(
    'input',
    debounce((e) => {
      state.query = e.target.value;
      state.page = 1;
      renderShop();
    }, 200)
  );
  catSelect?.addEventListener('change', (e) => {
    state.category = e.target.value;
    state.page = 1;
    renderShop();
  });
  brandSelect?.addEventListener('change', (e) => {
    state.brand = e.target.value;
    state.page = 1;
    renderShop();
  });
  minInput?.addEventListener('input', (e) => {
    state.minPrice = e.target.value;
    state.page = 1;
    renderShop();
  });
  maxInput?.addEventListener('input', (e) => {
    state.maxPrice = e.target.value;
    state.page = 1;
    renderShop();
  });
  inStockCheck?.addEventListener('change', (e) => {
    state.inStockOnly = e.target.checked;
    state.page = 1;
    renderShop();
  });
  sortSelect?.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    state.page = 1;
    renderShop();
  });
  rxBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.rxMode = btn.getAttribute('data-rx-filter') || 'all';
      state.page = 1;
      syncRxButtons();
      renderShop();
    });
  });
  resetBtn?.addEventListener('click', resetAll);

  renderShop();
}

/* ==========================================================================
   PRODUCT DETAIL PAGE CONTROLLER
   ========================================================================== */
async function initProductPage() {
  const root = document.getElementById('pdp-root');
  const relatedRoot = document.getElementById('pdp-related-grid');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  try {
    const products = await loadProducts();
    populateMegaMenuCategories(products);

    const product = products.find((p) => p.id === id) || (!id ? products[0] : null);
    if (!product) {
      root.innerHTML = `
        <div class="state-card">
          <h1>Product not found</h1>
          <p>This medicine may have moved or been updated in our Baruipur catalogue.</p>
          <a class="btn btn-primary" href="${resolveHref('shop.html')}">Browse All Medicines</a>
        </div>`;
      return;
    }

    document.title = `${product.name} | ${CONFIG.BRAND_NAME}`;
    const placeholderUrl = resolveHref('images/placeholder.svg');
    const waBuyUrl = buildWhatsAppUrl(
      `Hello ${CONFIG.BRAND_NAME}, I would like to order:\n${product.name}${
        product.pack_size ? ` (${product.pack_size})` : ''
      } — ${formatINR(product.price)}. Please confirm availability.`
    );

    const detailBlocks = [
      { title: 'Overview & Description', body: product.description },
      { title: 'Key Uses', body: product.uses },
      { title: 'Dosage Guidance', body: product.dosage },
      { title: 'Safety & Side Effects Note', body: product.side_effects },
      { title: 'Storage Instructions', body: product.storage },
    ].filter((b) => b.body);

    root.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${resolveHref('index.html')}">Home</a>
        <span aria-hidden="true">/</span>
        <a href="${resolveHref(`shop.html?category=${encodeURIComponent(product.category)}`)}">${escapeHtml(product.category)}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHtml(product.name)}</span>
      </nav>

      <div class="pdp-grid">
        <div class="pdp-gallery">
          <img
            src="${resolveHref(product.image)}"
            alt="${escapeHtml(product.name)}"
            referrerpolicy="no-referrer"
            onerror="this.onerror=null;this.src='${placeholderUrl}';"
          />
        </div>

        <div class="pdp-module">
          <div class="pdp-meta-line">
            ${escapeHtml([product.brand, product.category, product.pack_size].filter(Boolean).join(' · '))}
          </div>
          <h1 class="pdp-title">${escapeHtml(product.name)}</h1>
          ${product.composition ? `<p class="pdp-composition"><strong>Composition:</strong> ${escapeHtml(product.composition)}</p>` : ''}

          <div class="pdp-price-box">
            <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;" class="tabular-nums">
              <span class="pdp-price-main">${formatINR(product.price)}</span>
              ${product.mrp > product.price ? `<span class="price-mrp" style="font-size:16px;">MRP ${formatINR(product.mrp)}</span>` : ''}
              ${product.discount > 0 ? `<span class="price-discount" style="font-size:15px;">Save ${product.discount}% (${formatINR(product.mrp - product.price)})</span>` : ''}
            </div>
            <div style="font-size:13px;color:var(--ink-muted);margin-top:6px;">
              Inclusive of all taxes · ${product.in_stock ? 'In stock at our Baruipur store' : 'Currently out of stock'}
            </div>
          </div>

          ${
            product.prescription_required
              ? `<div class="rx-notice-box" role="note">
                  <strong>Prescription Required (Schedule H / H1):</strong> A valid doctor's prescription is required before dispatch. You can share your prescription during checkout or on the <a href="${resolveHref('prescription.html')}" style="text-decoration:underline;font-weight:600;">Upload Prescription</a> page.
                </div>`
              : ''
          }

          <div class="pdp-actions">
            ${
              product.in_stock
                ? `
              <div class="qty-stepper" aria-label="Quantity selector">
                <button type="button" class="qty-btn" id="pdp-qty-dec" aria-label="Decrease quantity">−</button>
                <span class="qty-value tabular-nums" id="pdp-qty-val">1</span>
                <button type="button" class="qty-btn" id="pdp-qty-inc" aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="btn btn-primary btn-lg" id="pdp-add-btn">Add to Cart</button>
              <a class="btn btn-whatsapp btn-lg" href="${waBuyUrl}" target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>
            `
                : `
              <a class="btn btn-whatsapp btn-lg" href="${waBuyUrl}" target="_blank" rel="noopener noreferrer">Enquire Restock on WhatsApp</a>
            `
            }
          </div>
        </div>
      </div>

      ${
        detailBlocks.length
          ? `<div class="pdp-details-grid">
              ${detailBlocks
                .map(
                  (block) => `
                <section class="info-panel">
                  <h3>${escapeHtml(block.title)}</h3>
                  <p>${escapeHtml(block.body)}</p>
                </section>`
                )
                .join('')}
            </div>`
          : ''
      }

      <div class="disclaimer-box" role="note">
        <strong>Medical Disclaimer:</strong> Product information on ${escapeHtml(CONFIG.BRAND_NAME)} is provided for general reference only and is not a substitute for qualified medical advice, diagnosis, or treatment. Always consult a registered medical practitioner before starting, stopping, or changing any medication.
      </div>
    `;

    let qty = 1;
    const qtyVal = document.getElementById('pdp-qty-val');
    document.getElementById('pdp-qty-dec')?.addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      if (qtyVal) qtyVal.textContent = String(qty);
    });
    document.getElementById('pdp-qty-inc')?.addEventListener('click', () => {
      qty = Math.min(20, qty + 1);
      if (qtyVal) qtyVal.textContent = String(qty);
    });
    document.getElementById('pdp-add-btn')?.addEventListener('click', () => {
      addToCart(product, qty);
      updateCartBadges(true);
      showToast(`Added ${qty} × ${product.name} to cart`);
    });

    if (relatedRoot) {
      const related = getRelatedProducts(products, product, 4);
      relatedRoot.innerHTML = related.map(renderProductCard).join('');
      bindAddToCartButtons(relatedRoot, products);
    }
  } catch (err) {
    root.innerHTML = `<div class="state-card"><h1>Unable to load product</h1><p>${escapeHtml(err.message)}</p></div>`;
  }
}

/* ==========================================================================
   CART PAGE CONTROLLER
   ========================================================================== */
function initCartPage() {
  const root = document.getElementById('cart-page-root');
  if (!root) return;

  const renderCart = () => {
    const items = getCart();
    const summary = calculateCartSummary(items);
    const placeholderUrl = resolveHref('images/placeholder.svg');

    if (!items.length) {
      root.innerHTML = `
        <div class="state-card">
          <h2>Your medicine cart is empty</h2>
          <p>Search our Baruipur catalogue or upload your doctor's prescription for quick home delivery.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a class="btn btn-primary" href="${resolveHref('shop.html')}">Browse Medicines</a>
            <a class="btn btn-secondary" href="${resolveHref('prescription.html')}">Upload Prescription</a>
          </div>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="cart-layout">
        <div>
          <div class="delivery-progress">
            <div style="font-size:15px;font-weight:600;color:var(--color-primary-dark);">
              ${
                summary.qualifiesFreeDelivery
                  ? 'You unlocked FREE home delivery in Baruipur!'
                  : `Add <span class="tabular-nums">${formatINR(summary.amountToFreeDelivery)}</span> more for FREE home delivery (orders above ${formatINR(summary.freeThreshold)})`
              }
            </div>
            <div class="progress-track" aria-hidden="true">
              <div class="progress-fill" style="width:${summary.progressPercent}%;"></div>
            </div>
          </div>

          ${
            summary.hasRx
              ? `<div class="rx-notice-box" style="margin-top:0;margin-bottom:18px;">
                  <strong>Prescription Notice:</strong> One or more medicines in your cart require a valid doctor's prescription. You will be prompted to share it on WhatsApp at checkout.
                </div>`
              : ''
          }

          <div class="cart-list">
            ${items
              .map(
                (item) => `
              <article class="cart-item" data-cart-row="${escapeHtml(item.id)}">
                <img class="cart-item-img" src="${resolveHref(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='${placeholderUrl}';" />
                <div>
                  <a href="${resolveHref(`product.html?id=${encodeURIComponent(item.id)}`)}" style="font-family:var(--font-display);font-weight:700;font-size:16px;">
                    ${escapeHtml(item.name)}
                  </a>
                  <div style="font-size:13px;color:var(--ink-muted);margin-top:2px;">
                    ${escapeHtml([item.brand, item.pack_size, item.prescription_required ? 'Rx Required' : ''].filter(Boolean).join(' · '))}
                  </div>
                  <div style="margin-top:8px;display:flex;align-items:baseline;gap:8px;" class="tabular-nums">
                    <strong>${formatINR(item.price)}</strong>
                    ${item.mrp > item.price ? `<span class="price-mrp">${formatINR(item.mrp)}</span>` : ''}
                  </div>
                </div>
                <div class="cart-item-actions" style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                  <div class="qty-stepper">
                    <button type="button" class="qty-btn" data-qty-dec="${escapeHtml(item.id)}" aria-label="Decrease quantity of ${escapeHtml(item.name)}">−</button>
                    <span class="qty-value tabular-nums">${item.quantity}</span>
                    <button type="button" class="qty-btn" data-qty-inc="${escapeHtml(item.id)}" aria-label="Increase quantity of ${escapeHtml(item.name)}">+</button>
                  </div>
                  <button type="button" class="text-link" style="font-size:13px;color:var(--color-danger);background:none;border:0;padding:2px;" data-remove-item="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)} from cart">
                    Remove
                  </button>
                </div>
              </article>`
              )
              .join('')}
          </div>
        </div>

        <aside class="summary-card" aria-label="Order summary">
          <h2 style="font-size:20px;margin-bottom:14px;">Order Summary</h2>
          <div class="summary-row tabular-nums">
            <span>Items (${summary.itemCount})</span>
            <span>${formatINR(summary.mrpTotal)}</span>
          </div>
          ${
            summary.savings > 0
              ? `<div class="summary-row tabular-nums" style="color:var(--color-primary-dark);font-weight:600;">
                  <span>Total Savings</span>
                  <span>− ${formatINR(summary.savings)}</span>
                </div>`
              : ''
          }
          <div class="summary-row tabular-nums">
            <span>Delivery Fee</span>
            <span>${summary.shipping === 0 ? 'FREE' : formatINR(summary.shipping)}</span>
          </div>
          <div class="summary-row summary-row--total tabular-nums">
            <span>Estimated Total</span>
            <span>${formatINR(summary.grandTotal)}</span>
          </div>
          <div style="display:grid;gap:10px;margin-top:20px;">
            <a class="btn btn-primary btn-lg btn-block" href="${resolveHref('checkout.html')}">Proceed to Checkout</a>
            <a class="btn btn-secondary btn-block" href="${resolveHref('shop.html')}">Continue Shopping</a>
          </div>
          <p style="font-size:13px;color:var(--ink-muted);margin-top:14px;">
            Pay via Cash on Delivery or UPI upon delivery in Baruipur. No online card details required.
          </p>
        </aside>
      </div>
    `;
  };

  root.addEventListener('click', (e) => {
    const dec = e.target.closest('[data-qty-dec]');
    const inc = e.target.closest('[data-qty-inc]');
    const rem = e.target.closest('[data-remove-item]');
    const cart = getCart();

    if (dec) {
      const id = dec.getAttribute('data-qty-dec');
      const found = cart.find((i) => i.id === id);
      if (found) {
        updateQuantity(id, found.quantity - 1);
        updateCartBadges(false);
        renderCart();
      }
    } else if (inc) {
      const id = inc.getAttribute('data-qty-inc');
      const found = cart.find((i) => i.id === id);
      if (found) {
        updateQuantity(id, found.quantity + 1);
        updateCartBadges(false);
        renderCart();
      }
    } else if (rem) {
      const id = rem.getAttribute('data-remove-item');
      removeFromCart(id);
      updateCartBadges(false);
      showToast('Item removed from cart');
      renderCart();
    }
  });

  renderCart();
}

/* ==========================================================================
   CHECKOUT PAGE CONTROLLER
   ========================================================================== */
function initCheckoutPage() {
  const root = document.getElementById('checkout-page-root');
  if (!root) return;

  const items = getCart();
  if (!items.length) {
    root.innerHTML = `
      <div class="state-card">
        <h2>No items to check out</h2>
        <p>Add medicines to your cart first, or send your prescription directly to our Baruipur pharmacy.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a class="btn btn-primary" href="${resolveHref('shop.html')}">Shop Medicines</a>
          <a class="btn btn-secondary" href="${resolveHref('prescription.html')}">Upload Prescription</a>
        </div>
      </div>
    `;
    return;
  }

  const summary = calculateCartSummary(items);
  let selectedRxFileName = '';

  root.innerHTML = `
    <div class="cart-layout">
      <form class="form-card" id="checkout-form" novalidate>
        <h2 style="font-size:22px;margin-bottom:6px;">Delivery &amp; Patient Details</h2>
        <p style="color:var(--ink-secondary);font-size:15px;margin-bottom:22px;">
          Complete your details below to generate your confirmed WhatsApp order summary for our Baruipur pharmacy counter.
        </p>

        ${
          summary.hasRx
            ? `<div class="rx-notice-box" style="margin-top:0;margin-bottom:20px;">
                <strong>Prescription Required:</strong> Your order contains prescription medicines. Select your prescription below to preview it, then attach the image/PDF in the WhatsApp chat.
              </div>`
            : ''
        }

        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="co-name">Full Name *</label>
            <input class="form-input" id="co-name" name="name" type="text" required placeholder="e.g. Subhajit Mondal" />
            <span class="field-error" id="err-name" role="alert"></span>
          </div>

          <div class="form-field">
            <label class="form-label" for="co-phone">Mobile Number (10 digits) *</label>
            <input class="form-input" id="co-phone" name="phone" type="tel" inputmode="numeric" required placeholder="e.g. 9830012345" />
            <span class="field-error" id="err-phone" role="alert"></span>
          </div>

          <div class="form-field form-field--full">
            <label class="form-label" for="co-address">Complete Delivery Address &amp; Landmark *</label>
            <textarea class="form-textarea" id="co-address" name="address" required placeholder="House/Flat No., Street, Para / Landmark, Baruipur"></textarea>
            <span class="field-error" id="err-address" role="alert"></span>
          </div>

          <div class="form-field">
            <label class="form-label" for="co-pincode">Pincode *</label>
            <input class="form-input" id="co-pincode" name="pincode" type="text" inputmode="numeric" value="700144" required placeholder="700144" />
            <span class="field-error" id="err-pincode" role="alert"></span>
          </div>

          <div class="form-field">
            <label class="form-label" for="co-notes">Delivery Notes (Optional)</label>
            <input class="form-input" id="co-notes" name="notes" type="text" placeholder="e.g. Call before arriving, evening delivery" />
          </div>

          <div class="form-field form-field--full">
            <label class="form-label" for="co-rx-file">Prescription Attachment Preview (${summary.hasRx ? 'Recommended for Rx items' : 'Optional'})</label>
            <input class="form-input" id="co-rx-file" type="file" accept=".jpg,.jpeg,.png,.pdf" style="padding:8px;" />
            <div id="co-rx-preview"></div>
          </div>
        </div>

        <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
          <button type="submit" class="btn btn-whatsapp btn-lg">Place Order via WhatsApp</button>
          <a class="btn btn-secondary btn-lg" href="${buildTelUrl()}">Call to Order (${CONFIG.PHONE_RAW})</a>
        </div>
      </form>

      <aside class="summary-card">
        <h2 style="font-size:20px;margin-bottom:14px;">Items in Your Order</h2>
        <div style="display:grid;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--border-hairline);margin-bottom:10px;">
          ${items
            .map(
              (item) => `
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;">
              <span>${escapeHtml(item.name)} × ${item.quantity}${item.prescription_required ? ' (Rx)' : ''}</span>
              <strong class="tabular-nums">${formatINR(item.price * item.quantity)}</strong>
            </div>`
            )
            .join('')}
        </div>
        <div class="summary-row tabular-nums"><span>Subtotal</span><span>${formatINR(summary.subtotal)}</span></div>
        <div class="summary-row tabular-nums"><span>Delivery</span><span>${summary.shipping === 0 ? 'FREE' : formatINR(summary.shipping)}</span></div>
        <div class="summary-row summary-row--total tabular-nums"><span>Total Payable</span><span>${formatINR(summary.grandTotal)}</span></div>
      </aside>
    </div>
  `;

  const fileInput = document.getElementById('co-rx-file');
  const previewBox = document.getElementById('co-rx-preview');
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) {
      selectedRxFileName = '';
      if (previewBox) previewBox.innerHTML = '';
      return;
    }
    selectedRxFileName = file.name;
    renderFilePreview(file, previewBox, () => {
      selectedRxFileName = '';
      fileInput.value = '';
      if (previewBox) previewBox.innerHTML = '';
    });
  });

  const form = document.getElementById('checkout-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const result = validateCheckoutForm({
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      pincode: formData.get('pincode'),
      notes: formData.get('notes'),
      prescriptionFileName: selectedRxFileName,
    });

    ['name', 'phone', 'address', 'pincode'].forEach((key) => {
      const input = document.getElementById(`co-${key}`);
      const errEl = document.getElementById(`err-${key}`);
      const msg = result.errors[key] || '';
      if (input) input.classList.toggle('is-invalid', Boolean(msg));
      if (errEl) errEl.textContent = msg;
    });

    if (!result.isValid) {
      showToast('Please check the highlighted fields.');
      return;
    }

    const orderRef = generateOrderRef();
    const waUrl = getWhatsAppOrderUrl({
      orderRef,
      customer: result.cleaned,
      items,
      summary,
    });

    clearCart();
    updateCartBadges(false);

    root.innerHTML = `
      <div class="state-card" style="max-width:680px;text-align:left;padding:36px;">
        <div class="section-kicker">Order Request Ready</div>
        <h2 style="font-size:26px;margin-bottom:8px;">Thank you, ${escapeHtml(result.cleaned.name)}!</h2>
        <p style="margin-bottom:16px;">
          Your order reference is <strong class="tabular-nums">${escapeHtml(orderRef)}</strong> (Total: <strong class="tabular-nums">${formatINR(summary.grandTotal)}</strong>). Tap the green button below to send this order summary to our Baruipur pharmacist on WhatsApp for instant confirmation.
        </p>
        ${
          selectedRxFileName || summary.hasRx
            ? `<div class="rx-notice-box" style="margin-top:0;margin-bottom:18px;">
                <strong>Reminder:</strong> Please attach your prescription photo/PDF${selectedRxFileName ? ` (${escapeHtml(selectedRxFileName)})` : ''} directly inside the WhatsApp chat once it opens.
              </div>`
            : ''
        }
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;">
          <a class="btn btn-whatsapp btn-lg" href="${waUrl}" target="_blank" rel="noopener noreferrer" id="confirm-wa-order-link">
            Send Order on WhatsApp Now
          </a>
          <a class="btn btn-secondary btn-lg" href="${buildTelUrl()}">
            Call to Confirm (${CONFIG.PHONE_RAW})
          </a>
          <a class="btn btn-soft btn-lg" href="${resolveHref('shop.html')}">
            Back to Shop
          </a>
        </div>
      </div>
    `;
  });
}

/* ==========================================================================
   PRESCRIPTION UPLOAD PAGE CONTROLLER
   ========================================================================== */
function renderFilePreview(file, container, onRemove) {
  if (!container || !file) return;
  const isImage = file.type.startsWith('image/');
  const sizeKb = Math.max(1, Math.round(file.size / 1024));

  const renderHtml = (thumbHtml) => {
    container.innerHTML = `
      <div class="preview-card">
        ${thumbHtml}
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.name)}</div>
          <div style="font-size:13px;color:var(--ink-muted);">${sizeKb} KB · Ready to share on WhatsApp or Email</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-clear-file>Remove</button>
      </div>
    `;
    container.querySelector('[data-clear-file]')?.addEventListener('click', onRemove);
  };

  if (isImage) {
    const reader = new FileReader();
    reader.onload = () => {
      renderHtml(`<img class="preview-thumb" src="${reader.result}" alt="Prescription preview" />`);
    };
    reader.readAsDataURL(file);
  } else {
    renderHtml(`<div class="preview-thumb">PDF</div>`);
  }
}

function initPrescriptionPage() {
  const form = document.getElementById('prescription-form');
  const dropzone = document.getElementById('rx-dropzone');
  const fileInput = document.getElementById('rx-file-input');
  const previewEl = document.getElementById('rx-file-preview');
  const resultEl = document.getElementById('rx-submit-result');
  if (!form || !dropzone || !fileInput) return;

  let selectedFile = null;

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type) && !/\.(jpe?g|png|pdf)$/i.test(file.name)) {
      showToast('Please choose a JPG, PNG, or PDF prescription file.');
      return;
    }
    selectedFile = file;
    renderFilePreview(file, previewEl, () => {
      selectedFile = null;
      fileInput.value = '';
      if (previewEl) previewEl.innerHTML = '';
    });
  };

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', () => handleFile(fileInput.files?.[0]));

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    handleFile(e.dataTransfer?.files?.[0]);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('rx-patient-name');
    const phoneInput = document.getElementById('rx-patient-phone');
    const notesInput = document.getElementById('rx-patient-notes');
    const errName = document.getElementById('rx-err-name');
    const errPhone = document.getElementById('rx-err-phone');

    const name = String(nameInput?.value || '').trim();
    const phone = String(phoneInput?.value || '').replace(/\D/g, '');
    const notes = String(notesInput?.value || '').trim();

    const nameErr = name.length < 2 ? 'Please enter the patient name.' : '';
    const phoneErr = phone.length !== 10 ? 'Please enter a valid 10-digit mobile number.' : '';

    nameInput?.classList.toggle('is-invalid', Boolean(nameErr));
    phoneInput?.classList.toggle('is-invalid', Boolean(phoneErr));
    if (errName) errName.textContent = nameErr;
    if (errPhone) errPhone.textContent = phoneErr;

    if (nameErr || phoneErr) {
      showToast('Please fill in valid patient name and 10-digit phone number.');
      return;
    }

    const msg = [
      `Hello ${CONFIG.BRAND_NAME}, I am sending a prescription for medicine order.`,
      `Patient Name: ${name}`,
      `Phone: ${phone}`,
      selectedFile ? `File Selected: ${selectedFile.name} (attaching in chat)` : 'Attaching prescription photo in chat',
      notes ? `Notes: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const waUrl = buildWhatsAppUrl(msg);
    const mailUrl = buildMailtoUrl(CONFIG.PHARMACY_EMAIL, `Prescription Order - ${name} (${phone})`, msg);

    if (resultEl) {
      resultEl.hidden = false;
      resultEl.innerHTML = `
        <div class="info-panel" style="margin-top:20px;background:var(--color-primary-soft);border-color:var(--color-primary-border);">
          <h3 style="color:var(--color-primary-dark);">Ready to send your prescription</h3>
          <p style="margin-bottom:14px;">
            Tap WhatsApp or Email below and attach your prescription file${selectedFile ? ` (<strong>${escapeHtml(selectedFile.name)}</strong>)` : ''}. Our pharmacist will verify stock and call you with the exact bill before dispatch.
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a class="btn btn-whatsapp" href="${waUrl}" target="_blank" rel="noopener noreferrer">Send via WhatsApp</a>
            <a class="btn btn-secondary" href="${mailUrl}">Send via Email (${CONFIG.PHARMACY_EMAIL})</a>
          </div>
        </div>
      `;
    }
  });
}

/* ==========================================================================
   CONTACT & CLINIC ENQUIRY FORMS
   ========================================================================== */
function initEnquiryForm(formId, targetEmail, defaultSubject) {
  const form = document.getElementById(formId);
  if (!form) return;
  const output = document.getElementById(`${formId}-result`);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = form.querySelector('[name="name"]');
    const phoneEl = form.querySelector('[name="phone"]');
    const msgEl = form.querySelector('[name="message"]');
    const errEl = form.querySelector('[data-form-error]');

    const name = String(nameEl?.value || '').trim();
    const phone = String(phoneEl?.value || '').replace(/\D/g, '');
    const message = String(msgEl?.value || '').trim();

    if (name.length < 2 || phone.length !== 10 || message.length < 5) {
      if (errEl) {
        errEl.textContent = 'Please enter your name, a valid 10-digit phone number, and a short message.';
      }
      return;
    }
    if (errEl) errEl.textContent = '';

    const body = `${defaultSubject}\nName: ${name}\nPhone: ${phone}\nMessage: ${message}`;
    const waUrl = buildWhatsAppUrl(body);
    const mailUrl = buildMailtoUrl(targetEmail, `${defaultSubject} — ${name}`, body);

    if (output) {
      output.hidden = false;
      output.innerHTML = `
        <div class="info-panel" style="margin-top:16px;background:var(--color-primary-soft);border-color:var(--color-primary-border);">
          <h3>Enquiry prepared</h3>
          <p style="margin-bottom:12px;">Choose WhatsApp for fastest response or send via email to ${escapeHtml(targetEmail)}.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a class="btn btn-whatsapp btn-sm" href="${waUrl}" target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>
            <a class="btn btn-secondary btn-sm" href="${mailUrl}">Send via Email</a>
          </div>
        </div>
      `;
    }
  });
}

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.getAttribute('data-page') || 'home';

  renderHeader(page);
  renderFooter();
  renderFloatingDoctorButton(page);
  hydrateConfigBindings();
  initScrollReveal();

  window.addEventListener('pharmawala:cart-updated', () => updateCartBadges(false));
  window.addEventListener('storage', () => updateCartBadges(false));

  // Populate mega menu categories asynchronously on non-catalog pages too
  if (page !== 'home' && page !== 'shop' && page !== 'product') {
    loadProducts()
      .then((products) => populateMegaMenuCategories(products))
      .catch(() => {});
  }

  switch (page) {
    case 'home':
      initHomePage();
      break;
    case 'shop':
      initShopPage();
      break;
    case 'product':
      initProductPage();
      break;
    case 'cart':
      initCartPage();
      break;
    case 'checkout':
      initCheckoutPage();
      break;
    case 'prescription':
      initPrescriptionPage();
      break;
    case 'clinic':
      initEnquiryForm('clinic-appointment-form', CONFIG.POLYCLINIC_EMAIL, 'Pharmawala Polyclinic Appointment Request');
      break;
    case 'contact':
      initEnquiryForm('contact-enquiry-form', CONFIG.PHARMACY_EMAIL, 'Pharmawala Pharmacy Website Enquiry');
      break;
    default:
      break;
  }
});
