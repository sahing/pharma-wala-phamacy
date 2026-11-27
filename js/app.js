/**
 * Pharmawala Pharmacy — Main Page Controller & Router
 * Initializes shared header/footer, sliding banners, visual category tabs,
 * and WhatsApp / Prescription / Polyclinic flows (no cart, no search).
 */

import {
  CONFIG,
  buildMailtoUrl,
  buildProductWhatsAppUrl,
  buildTelUrl,
  buildWhatsAppUrl,
  isStoreOpenNow,
  resolveHref,
} from './config.js';
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
import {
  ICONS,
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

  const openNow = isStoreOpenNow();
  document.querySelectorAll('[data-store-status-card]').forEach((el) => {
    el.classList.toggle('is-open', openNow);
    el.classList.toggle('is-closed', !openNow);
    el.innerHTML = `<span class="status-dot" aria-hidden="true"></span>${openNow ? 'Store Open Now · Until 10:30 PM' : 'Currently Closed · Opens 8:00 AM'}`;
  });
}

function interleaveByImage(pool, limit = 8) {
  const buckets = new Map();
  pool.forEach((p) => {
    const key = p.image || 'default';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(p);
  });
  const interleaved = [];
  const lists = Array.from(buckets.values());
  let added = true;
  while (interleaved.length < limit && added) {
    added = false;
    for (const list of lists) {
      if (list.length && interleaved.length < limit) {
        interleaved.push(list.shift());
        added = true;
      }
    }
  }
  return interleaved;
}

/* ==========================================================================
   HOME PAGE CONTROLLER
   ========================================================================== */
async function initHomePage() {
  initCarousel('hero-banner-carousel', { intervalMs: 4500 });
  initAccordions();

  const catGrid = document.getElementById('home-categories-grid');
  const featuredTabs = document.getElementById('home-featured-tabs');
  const featuredGrid = document.getElementById('home-featured-grid');

  if (featuredGrid) {
    featuredGrid.innerHTML = renderSkeletonGrid(8);
  }

  try {
    const products = await loadProducts();
    populateMegaMenuCategories(products);

    const categories = extractCategories(products);

    if (catGrid) {
      catGrid.innerHTML = categories
        .slice(0, 8)
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
      const renderFeaturedByCategory = (activeCat = '') => {
        const filtered = activeCat
          ? products.filter((p) => p.category === activeCat && p.in_stock)
          : products.filter((p) => p.featured && p.in_stock);
        const pool = filtered.length >= 4 || activeCat ? filtered : products.filter((p) => p.in_stock);
        const items = activeCat ? pool.slice(0, 8) : interleaveByImage(pool, 8);
        featuredGrid.innerHTML = items.length
          ? items.map(renderProductCard).join('')
          : `<div class="state-card" style="grid-column: 1 / -1;"><p>No in-stock items in this category right now.</p></div>`;
      };

      if (featuredTabs) {
        const topCats = categories.slice(0, 5);
        featuredTabs.innerHTML = [
          `<button type="button" class="category-pill is-active" data-home-cat="">Featured</button>`,
          ...topCats.map(
            (cat) =>
              `<button type="button" class="category-pill" data-home-cat="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</button>`
          ),
        ].join('');

        featuredTabs.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-home-cat]');
          if (!btn) return;
          const selected = btn.getAttribute('data-home-cat') || '';
          featuredTabs.querySelectorAll('.category-pill').forEach((pill) => {
            pill.classList.toggle('is-active', pill === btn);
          });
          renderFeaturedByCategory(selected);
        });
      }

      renderFeaturedByCategory('');
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
   CATALOGUE PAGE CONTROLLER (shop.html — Visual Category Browse, No Search)
   ========================================================================== */
async function initShopPage() {
  const grid = document.getElementById('shop-products-grid');
  const countEl = document.getElementById('shop-results-count');
  const paginationEl = document.getElementById('shop-pagination');
  const headingEl = document.getElementById('shop-page-heading');
  const categoryPillsEl = document.getElementById('shop-category-pills');
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
    category: params.get('category') || '',
    brand: params.get('brand') || '',
    minPrice: params.get('min') || '',
    maxPrice: params.get('max') || '',
    rxMode: params.get('rx') || 'all',
    inStockOnly: params.get('stock') === '1',
    sortBy: params.get('sort') || 'featured',
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

  const categories = extractCategories(allProducts);
  const brands = extractBrands(allProducts);

  if (categoryPillsEl) {
    categoryPillsEl.innerHTML = [
      `<button type="button" class="category-pill ${state.category === '' ? 'is-active' : ''}" data-cat-pill="">All (${allProducts.length})</button>`,
      ...categories.map(
        (c) =>
          `<button type="button" class="category-pill ${state.category === c.name ? 'is-active' : ''}" data-cat-pill="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.count})</button>`
      ),
    ].join('');
  }

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

  if (minInput) minInput.value = state.minPrice;
  if (maxInput) maxInput.value = state.maxPrice;
  if (inStockCheck) inStockCheck.checked = state.inStockOnly;
  if (sortSelect) sortSelect.value = state.sortBy;

  const syncCategoryControls = () => {
    if (catSelect) catSelect.value = state.category;
    categoryPillsEl?.querySelectorAll('[data-cat-pill]').forEach((pill) => {
      pill.classList.toggle('is-active', (pill.getAttribute('data-cat-pill') || '') === state.category);
    });
  };

  const syncRxButtons = () => {
    rxBtns.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-rx-filter') === state.rxMode));
    });
  };
  syncRxButtons();

  const renderShop = () => {
    const filtered = filterProducts(allProducts, state);
    const sorted = sortProducts(filtered, state.sortBy);
    const pageData = paginateProducts(sorted, state.page, CONFIG.ITEMS_PER_PAGE);
    state.page = pageData.currentPage;

    if (headingEl) {
      headingEl.textContent = state.category || 'All Medicines & Health Products';
    }

    if (countEl) {
      countEl.textContent = `Showing ${pageData.items.length} of ${pageData.totalItems} ${
        pageData.totalItems === 1 ? 'product' : 'products'
      }`;
    }

    if (!pageData.items.length) {
      grid.innerHTML = `
        <div class="state-card" style="grid-column: 1 / -1;">
          <h3>No matching items in this filter</h3>
          <p>Try resetting filters or upload your doctor's prescription and our Baruipur pharmacist will arrange your medicines.</p>
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
    state.category = '';
    state.brand = '';
    state.minPrice = '';
    state.maxPrice = '';
    state.rxMode = 'all';
    state.inStockOnly = false;
    state.sortBy = 'featured';
    state.page = 1;
    syncCategoryControls();
    if (brandSelect) brandSelect.value = '';
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
    if (inStockCheck) inStockCheck.checked = false;
    if (sortSelect) sortSelect.value = 'featured';
    syncRxButtons();
    renderShop();
  };

  categoryPillsEl?.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-cat-pill]');
    if (!pill) return;
    state.category = pill.getAttribute('data-cat-pill') || '';
    state.page = 1;
    syncCategoryControls();
    renderShop();
  });

  catSelect?.addEventListener('change', (e) => {
    state.category = e.target.value;
    state.page = 1;
    syncCategoryControls();
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
    const waBuyUrl = buildProductWhatsAppUrl(product);

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
          <span class="product-badge-row">
            ${
              product.prescription_required
                ? '<span class="product-rx-flag">Rx Required</span>'
                : '<span class="product-otc-flag">OTC</span>'
            }
          </span>
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
                  <strong>Prescription Required (Schedule H / H1):</strong> A valid doctor's prescription is required before dispatch. You can share it on WhatsApp or via our <a href="${resolveHref('prescription.html')}" style="text-decoration:underline;font-weight:600;">Upload Prescription</a> page.
                </div>`
              : ''
          }

          <div class="pdp-actions">
            <a class="btn btn-whatsapp btn-lg" href="${waBuyUrl}" target="_blank" rel="noopener noreferrer">
              ${ICONS.whatsapp}
              <span>${product.in_stock ? 'Order on WhatsApp' : 'Enquire Restock on WhatsApp'}</span>
            </a>
            <a class="btn btn-secondary btn-lg" href="${buildTelUrl()}">
              ${ICONS.phone}
              <span>Call ${CONFIG.PHONE_RAW}</span>
            </a>
            ${
              product.prescription_required
                ? `<a class="btn btn-soft btn-lg" href="${resolveHref('prescription.html')}">Upload Prescription</a>`
                : ''
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

    if (relatedRoot) {
      const related = getRelatedProducts(products, product, 4);
      relatedRoot.innerHTML = related.map(renderProductCard).join('');
    }
  } catch (err) {
    root.innerHTML = `<div class="state-card"><h1>Unable to load product</h1><p>${escapeHtml(err.message)}</p></div>`;
  }
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
if (typeof window !== 'undefined') {
  window.__PHARMAWALA_APP_READY__ = true;
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.getAttribute('data-page') || 'home';

  renderHeader(page);
  renderFooter();
  renderFloatingDoctorButton(page);
  hydrateConfigBindings();
  initScrollReveal();

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
