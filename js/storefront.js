/**
 * Pharmawala Pharmacy — Classic (Non-Module) Storefront Fallback
 * Ensures products, categories, filters, product details, mega-menu,
 * prescription upload, and enquiry forms work seamlessly even when opened
 * directly via file:// (where <script type="module"> and fetch() are blocked by CORS).
 */
(function () {
  var CONFIG = {
    BRAND_NAME: 'Pharmawala Pharmacy',
    CLINIC_NAME: 'Pharmawala Polyclinic',
    PHONE_RAW: '8282082425',
    WHATSAPP_NUMBER: '918282082425',
    PHARMACY_EMAIL: 'pharmawalapharmacy@gmail.com',
    POLYCLINIC_EMAIL: 'pharmawalapolyclinic@gmail.com',
    CLINIC_URL: 'clinic.html',
    ITEMS_PER_PAGE: 24,
    CURRENCY_SYMBOL: '₹',
  };

  var ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
    droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.7 6.3 9.4A7.5 7.5 0 1 0 17.7 9.4L12 2.7Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    bandage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M10 10h.01M14 14h.01M14 10h.01M10 14h.01"/></svg>',
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatINR(amount) {
    var num = Number(amount) || 0;
    return CONFIG.CURRENCY_SYMBOL + num.toLocaleString('en-IN');
  }

  function buildWhatsAppUrl(message) {
    var encoded = encodeURIComponent(message || '');
    return 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER + (encoded ? '?text=' + encoded : '');
  }

  function buildTelUrl() {
    return 'tel:+91' + CONFIG.PHONE_RAW;
  }

  function buildMailtoUrl(email, subject, body) {
    var params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    var q = params.toString();
    return 'mailto:' + email + (q ? '?' + q : '');
  }

  function buildProductWhatsAppUrl(product) {
    if (!product) {
      return buildWhatsAppUrl('Hello ' + CONFIG.BRAND_NAME + ', I would like to enquire about medicines.');
    }
    var pack = product.pack_size ? ' (' + product.pack_size + ')' : '';
    var priceText = product.price ? ' — ' + formatINR(product.price) : '';
    var action = product.in_stock === false
      ? 'is this currently back in stock or available on request?'
      : 'please confirm availability for home delivery / store pickup.';
    var rxNote = product.prescription_required ? ' (I have a valid prescription ready.)' : '';
    return buildWhatsAppUrl(
      'Hello ' + CONFIG.BRAND_NAME + ', I would like to order ' + product.name + pack + priceText + ' — ' + action + rxNote
    );
  }

  function isStoreOpenNow(date) {
    var d = date || new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(d);
      var hour = Number((parts.find(function (p) { return p.type === 'hour'; }) || {}).value || 0);
      var minute = Number((parts.find(function (p) { return p.type === 'minute'; }) || {}).value || 0);
      var mins = hour * 60 + minute;
      return mins >= 8 * 60 && mins <= 22 * 60 + 30;
    } catch (e) {
      var localMins = d.getHours() * 60 + d.getMinutes();
      return localMins >= 8 * 60 && localMins <= 22 * 60 + 30;
    }
  }

  function getCategoryIcon(categoryName) {
    var lower = String(categoryName || '').toLowerCase();
    if (lower.indexOf('diabet') !== -1) return ICONS.droplet;
    if (lower.indexOf('vitamin') !== -1 || lower.indexOf('nutrit') !== -1) return ICONS.sun;
    if (lower.indexOf('device') !== -1 || lower.indexOf('monitor') !== -1) return ICONS.activity;
    if (lower.indexOf('ayurved') !== -1 || lower.indexOf('herbal') !== -1) return ICONS.leaf;
    if (lower.indexOf('baby') !== -1 || lower.indexOf('mother') !== -1) return ICONS.heart;
    if (lower.indexOf('first aid') !== -1 || lower.indexOf('ortho') !== -1) return ICONS.bandage;
    if (lower.indexOf('personal') !== -1 || lower.indexOf('skin') !== -1) return ICONS.shield;
    return ICONS.pill;
  }

  function normalizeProduct(raw, index) {
    var item = raw && typeof raw === 'object' ? raw : {};
    var id = String(item.id != null ? item.id : (item.sku != null ? item.sku : 'pw-item-' + (index + 1))).trim();
    var name = String(item.name || item.title || 'Healthcare Product').trim();
    var brand = String(item.brand || item.manufacturer || '').trim();
    var category = String(item.category || item.department || 'General Healthcare').trim();
    var composition = String(item.composition || item.salt || '').trim();
    var packSize = String(item.pack_size || item.packSize || '').trim();
    var mrpRaw = Number(item.mrp != null ? item.mrp : (item.price != null ? item.price : 0));
    var priceRaw = Number(item.price != null ? item.price : (item.mrp != null ? item.mrp : 0));
    var mrp = isFinite(mrpRaw) && mrpRaw > 0 ? Math.round(mrpRaw) : Math.max(0, Math.round(priceRaw));
    var price = isFinite(priceRaw) && priceRaw > 0 ? Math.round(priceRaw) : mrp;
    var safeMrp = mrp >= price ? mrp : price;
    var discount = Number(item.discount);
    if (!isFinite(discount) || discount < 0) {
      discount = safeMrp > price && safeMrp > 0 ? Math.round(((safeMrp - price) / safeMrp) * 100) : 0;
    } else {
      discount = Math.round(discount);
    }
    var rawImage = String(item.image || item.img || '').trim();
    var image = rawImage
      ? (rawImage.indexOf('http') === 0 || rawImage.indexOf('/') === 0 || rawImage.indexOf('images/') === 0
          ? rawImage
          : 'images/products/' + rawImage)
      : 'images/placeholder.svg';

    return {
      id: id,
      name: name,
      brand: brand,
      category: category,
      composition: composition,
      pack_size: packSize,
      price: price,
      mrp: safeMrp,
      discount: discount,
      image: image,
      description: String(item.description || '').trim(),
      uses: String(item.uses || '').trim(),
      dosage: String(item.dosage || '').trim(),
      side_effects: String(item.side_effects || '').trim(),
      storage: String(item.storage || '').trim(),
      prescription_required: item.prescription_required === true || String(item.prescription_required).toLowerCase() === 'true',
      in_stock: item.in_stock === undefined ? true : Boolean(item.in_stock),
      featured: Boolean(item.featured),
    };
  }

  function getCatalog() {
    var list = Array.isArray(window.__PHARMAWALA_PRODUCTS__) ? window.__PHARMAWALA_PRODUCTS__ : [];
    return list.map(normalizeProduct);
  }

  function extractCategories(products) {
    var counts = new Map();
    products.forEach(function (p) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(function (entry) { return { name: entry[0], count: entry[1] }; })
      .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
  }

  function extractBrands(products) {
    var set = new Set();
    products.forEach(function (p) {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort(function (a, b) { return a.localeCompare(b); });
  }

  function filterProducts(products, filters) {
    var catLower = String(filters.category || '').trim().toLowerCase();
    var brandLower = String(filters.brand || '').trim().toLowerCase();
    var minPrice = filters.minPrice;
    var maxPrice = filters.maxPrice;
    var rxMode = filters.rxMode || 'all';
    var inStockOnly = Boolean(filters.inStockOnly);

    return products.filter(function (p) {
      if (catLower && p.category.toLowerCase() !== catLower) return false;
      if (brandLower && p.brand.toLowerCase() !== brandLower) return false;
      if (minPrice !== '' && minPrice != null && isFinite(Number(minPrice)) && p.price < Number(minPrice)) return false;
      if (maxPrice !== '' && maxPrice != null && isFinite(Number(maxPrice)) && p.price > Number(maxPrice)) return false;
      if (rxMode === 'rx' && !p.prescription_required) return false;
      if (rxMode === 'otc' && p.prescription_required) return false;
      if (inStockOnly && !p.in_stock) return false;
      return true;
    });
  }

  function sortProducts(products, sortBy) {
    var list = products.slice();
    switch (sortBy) {
      case 'price-asc':
        return list.sort(function (a, b) { return a.price - b.price || a.name.localeCompare(b.name); });
      case 'price-desc':
        return list.sort(function (a, b) { return b.price - a.price || a.name.localeCompare(b.name); });
      case 'discount-desc':
        return list.sort(function (a, b) { return b.discount - a.discount || a.price - b.price; });
      case 'name-asc':
        return list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      default:
        return list.sort(function (a, b) { return Number(b.featured) - Number(a.featured) || Number(b.in_stock) - Number(a.in_stock); });
    }
  }

  function paginateProducts(products, page, perPage) {
    var safePerPage = Math.max(1, Number(perPage) || 24);
    var totalItems = products.length;
    var totalPages = Math.max(1, Math.ceil(totalItems / safePerPage));
    var currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    var start = (currentPage - 1) * safePerPage;
    return {
      items: products.slice(start, start + safePerPage),
      currentPage: currentPage,
      totalPages: totalPages,
      totalItems: totalItems,
    };
  }

  function renderProductCard(product) {
    var detailUrl = 'product.html?id=' + encodeURIComponent(product.id);
    var metaText = [product.brand, product.pack_size].filter(Boolean).join(' · ');
    var waUrl = buildProductWhatsAppUrl(product);

    return (
      '<article class="product-card" data-product-id="' + escapeHtml(product.id) + '">' +
        '<a class="product-card-media" href="' + detailUrl + '">' +
          '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'images/placeholder.svg\';" />' +
          '<span class="product-badge-row">' +
            (product.prescription_required
              ? '<span class="product-rx-flag" title="Valid doctor prescription required">Rx Required</span>'
              : '<span class="product-otc-flag">OTC</span>') +
            (product.discount > 0 ? '<span class="product-discount-pill tabular-nums">' + product.discount + '% OFF</span>' : '') +
          '</span>' +
          '<span class="product-cat-pill">' + escapeHtml(product.category) + '</span>' +
        '</a>' +
        '<div class="product-card-body">' +
          (metaText ? '<div class="product-card-meta">' + escapeHtml(metaText) + '</div>' : '') +
          '<h3 class="product-card-title"><a href="' + detailUrl + '">' + escapeHtml(product.name) + '</a></h3>' +
          (product.composition ? '<p class="product-card-salt">' + escapeHtml(product.composition) + '</p>' : '') +
          '<div class="product-card-footer">' +
            '<div class="price-block">' +
              '<div class="price-row tabular-nums">' +
                '<span class="price-current">' + formatINR(product.price) + '</span>' +
                (product.mrp > product.price ? '<span class="price-mrp">' + formatINR(product.mrp) + '</span>' : '') +
              '</div>' +
              '<span class="stock-status ' + (product.in_stock ? 'is-in-stock' : 'is-out') + '">' +
                (product.in_stock ? 'In Stock' : 'Out of stock') +
              '</span>' +
            '</div>' +
            '<a class="btn btn-whatsapp-soft btn-sm product-wa-btn" href="' + waUrl + '" target="_blank" rel="noopener noreferrer" aria-label="' + (product.in_stock ? 'Order ' : 'Enquire about ') + escapeHtml(product.name) + ' on WhatsApp">' +
              ICONS.whatsapp +
              '<span>' + (product.in_stock ? 'Order' : 'Enquire') + '</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function interleaveByImage(pool, limit) {
    var buckets = new Map();
    pool.forEach(function (p) {
      var key = p.image || 'default';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(p);
    });
    var interleaved = [];
    var lists = Array.from(buckets.values());
    var added = true;
    while (interleaved.length < limit && added) {
      added = false;
      lists.forEach(function (list) {
        if (list.length && interleaved.length < limit) {
          interleaved.push(list.shift());
          added = true;
        }
      });
    }
    return interleaved;
  }

  function initAccordions() {
    document.querySelectorAll('[data-accordion]').forEach(function (list) {
      list.addEventListener('click', function (e) {
        var trigger = e.target.closest('.faq-trigger');
        if (!trigger) return;
        var item = trigger.closest('.faq-item');
        if (!item) return;
        var isOpen = item.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  function initHome(products) {
    initAccordions();
    var categories = extractCategories(products);
    var catGrid = document.getElementById('home-categories-grid');
    if (catGrid) {
      catGrid.innerHTML = categories
        .slice(0, 8)
        .map(function (cat) {
          return (
            '<a class="category-card" href="shop.html?category=' + encodeURIComponent(cat.name) + '">' +
              '<span class="category-icon">' + getCategoryIcon(cat.name) + '</span>' +
              '<div>' +
                '<div class="category-name">' + escapeHtml(cat.name) + '</div>' +
                '<div class="category-meta tabular-nums">' + cat.count + ' ' + (cat.count === 1 ? 'item' : 'items') + '</div>' +
              '</div>' +
            '</a>'
          );
        })
        .join('');
    }

    var featuredTabs = document.getElementById('home-featured-tabs');
    var featuredGrid = document.getElementById('home-featured-grid');
    if (!featuredGrid) return;

    function renderFeatured(activeCat) {
      var filtered = activeCat
        ? products.filter(function (p) { return p.category === activeCat && p.in_stock; })
        : products.filter(function (p) { return p.featured && p.in_stock; });
      var pool = filtered.length >= 4 || activeCat ? filtered : products.filter(function (p) { return p.in_stock; });
      var items = activeCat ? pool.slice(0, 8) : interleaveByImage(pool, 8);
      featuredGrid.innerHTML = items.length
        ? items.map(renderProductCard).join('')
        : '<div class="state-card" style="grid-column: 1 / -1;"><p>No in-stock items in this category right now.</p></div>';
    }

    if (featuredTabs) {
      var topCats = categories.slice(0, 5);
      featuredTabs.innerHTML =
        '<button type="button" class="category-pill is-active" data-home-cat="">Featured</button>' +
        topCats
          .map(function (cat) {
            return '<button type="button" class="category-pill" data-home-cat="' + escapeHtml(cat.name) + '">' + escapeHtml(cat.name) + '</button>';
          })
          .join('');

      featuredTabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-home-cat]');
        if (!btn) return;
        var selected = btn.getAttribute('data-home-cat') || '';
        featuredTabs.querySelectorAll('.category-pill').forEach(function (pill) {
          pill.classList.toggle('is-active', pill === btn);
        });
        renderFeatured(selected);
      });
    }

    renderFeatured('');
  }

  function initShop(allProducts) {
    var grid = document.getElementById('shop-products-grid');
    if (!grid) return;

    var countEl = document.getElementById('shop-results-count');
    var paginationEl = document.getElementById('shop-pagination');
    var headingEl = document.getElementById('shop-page-heading');
    var categoryPillsEl = document.getElementById('shop-category-pills');
    var catSelect = document.getElementById('shop-filter-category');
    var brandSelect = document.getElementById('shop-filter-brand');
    var minInput = document.getElementById('shop-filter-min');
    var maxInput = document.getElementById('shop-filter-max');
    var inStockCheck = document.getElementById('shop-filter-stock');
    var sortSelect = document.getElementById('shop-sort');
    var resetBtn = document.getElementById('shop-reset-filters');
    var rxBtns = Array.prototype.slice.call(document.querySelectorAll('[data-rx-filter]'));

    var params = new URLSearchParams(window.location.search);
    var state = {
      category: params.get('category') || '',
      brand: params.get('brand') || '',
      minPrice: params.get('min') || '',
      maxPrice: params.get('max') || '',
      rxMode: params.get('rx') || 'all',
      inStockOnly: params.get('stock') === '1',
      sortBy: params.get('sort') || 'featured',
      page: Math.max(1, Number(params.get('page')) || 1),
    };

    var categories = extractCategories(allProducts);
    var brands = extractBrands(allProducts);

    if (categoryPillsEl) {
      categoryPillsEl.innerHTML =
        '<button type="button" class="category-pill ' + (state.category === '' ? 'is-active' : '') + '" data-cat-pill="">All (' + allProducts.length + ')</button>' +
        categories
          .map(function (c) {
            return '<button type="button" class="category-pill ' + (state.category === c.name ? 'is-active' : '') + '" data-cat-pill="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + ' (' + c.count + ')</button>';
          })
          .join('');
    }

    if (catSelect) {
      catSelect.innerHTML =
        '<option value="">All Categories (' + allProducts.length + ')</option>' +
        categories.map(function (c) { return '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + ' (' + c.count + ')</option>'; }).join('');
      catSelect.value = state.category;
    }

    if (brandSelect) {
      brandSelect.innerHTML =
        '<option value="">All Brands (' + brands.length + ')</option>' +
        brands.map(function (b) { return '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + '</option>'; }).join('');
      brandSelect.value = state.brand;
    }

    if (minInput) minInput.value = state.minPrice;
    if (maxInput) maxInput.value = state.maxPrice;
    if (inStockCheck) inStockCheck.checked = state.inStockOnly;
    if (sortSelect) sortSelect.value = state.sortBy;

    function syncCategoryControls() {
      if (catSelect) catSelect.value = state.category;
      if (categoryPillsEl) {
        categoryPillsEl.querySelectorAll('[data-cat-pill]').forEach(function (pill) {
          pill.classList.toggle('is-active', (pill.getAttribute('data-cat-pill') || '') === state.category);
        });
      }
    }

    function syncRxButtons() {
      rxBtns.forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-rx-filter') === state.rxMode));
      });
    }
    syncRxButtons();

    function resetAll() {
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
    }

    function renderShop() {
      var filtered = filterProducts(allProducts, state);
      var sorted = sortProducts(filtered, state.sortBy);
      var pageData = paginateProducts(sorted, state.page, CONFIG.ITEMS_PER_PAGE);
      state.page = pageData.currentPage;

      if (headingEl) headingEl.textContent = state.category || 'All Medicines & Health Products';
      if (countEl) {
        countEl.textContent = 'Showing ' + pageData.items.length + ' of ' + pageData.totalItems + ' ' + (pageData.totalItems === 1 ? 'product' : 'products');
      }

      if (!pageData.items.length) {
        grid.innerHTML =
          '<div class="state-card" style="grid-column: 1 / -1;">' +
            '<h3>No matching items in this filter</h3>' +
            '<p>Try resetting filters or upload your doctor\'s prescription and our Baruipur pharmacist will arrange your medicines.</p>' +
            '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
              '<button type="button" class="btn btn-secondary" id="empty-reset-btn">Reset All Filters</button>' +
              '<a class="btn btn-primary" href="prescription.html">Upload Prescription</a>' +
            '</div>' +
          '</div>';
        var emptyBtn = document.getElementById('empty-reset-btn');
        if (emptyBtn) emptyBtn.addEventListener('click', resetAll);
      } else {
        grid.innerHTML = pageData.items.map(renderProductCard).join('');
      }

      if (paginationEl) {
        if (pageData.totalPages <= 1) {
          paginationEl.innerHTML = '';
        } else {
          paginationEl.innerHTML =
            '<button type="button" class="btn btn-secondary btn-sm" id="page-prev" ' + (pageData.currentPage <= 1 ? 'disabled' : '') + '>Previous</button>' +
            '<span class="tabular-nums" style="font-size:14px;color:var(--ink-secondary);">Page ' + pageData.currentPage + ' of ' + pageData.totalPages + '</span>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="page-next" ' + (pageData.currentPage >= pageData.totalPages ? 'disabled' : '') + '>Next</button>';
          var prevBtn = document.getElementById('page-prev');
          var nextBtn = document.getElementById('page-next');
          if (prevBtn) prevBtn.addEventListener('click', function () {
            state.page = Math.max(1, state.page - 1);
            renderShop();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          if (nextBtn) nextBtn.addEventListener('click', function () {
            state.page = Math.min(pageData.totalPages, state.page + 1);
            renderShop();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
      }
    }

    if (categoryPillsEl) {
      categoryPillsEl.addEventListener('click', function (e) {
        var pill = e.target.closest('[data-cat-pill]');
        if (!pill) return;
        state.category = pill.getAttribute('data-cat-pill') || '';
        state.page = 1;
        syncCategoryControls();
        renderShop();
      });
    }
    if (catSelect) catSelect.addEventListener('change', function (e) { state.category = e.target.value; state.page = 1; syncCategoryControls(); renderShop(); });
    if (brandSelect) brandSelect.addEventListener('change', function (e) { state.brand = e.target.value; state.page = 1; renderShop(); });
    if (minInput) minInput.addEventListener('input', function (e) { state.minPrice = e.target.value; state.page = 1; renderShop(); });
    if (maxInput) maxInput.addEventListener('input', function (e) { state.maxPrice = e.target.value; state.page = 1; renderShop(); });
    if (inStockCheck) inStockCheck.addEventListener('change', function (e) { state.inStockOnly = e.target.checked; state.page = 1; renderShop(); });
    if (sortSelect) sortSelect.addEventListener('change', function (e) { state.sortBy = e.target.value; state.page = 1; renderShop(); });
    rxBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.rxMode = btn.getAttribute('data-rx-filter') || 'all';
        state.page = 1;
        syncRxButtons();
        renderShop();
      });
    });
    if (resetBtn) resetBtn.addEventListener('click', resetAll);

    renderShop();
  }

  function initProduct(products) {
    var root = document.getElementById('pdp-root');
    var relatedRoot = document.getElementById('pdp-related-grid');
    if (!root) return;

    var id = new URLSearchParams(window.location.search).get('id');
    var product = products.find(function (p) { return p.id === id; }) || (!id ? products[0] : null);
    if (!product) {
      root.innerHTML =
        '<div class="state-card">' +
          '<h1>Product not found</h1>' +
          '<p>This medicine may have moved or been updated in our Baruipur catalogue.</p>' +
          '<a class="btn btn-primary" href="shop.html">Browse All Medicines</a>' +
        '</div>';
      return;
    }

    document.title = product.name + ' | ' + CONFIG.BRAND_NAME;
    var waBuyUrl = buildProductWhatsAppUrl(product);
    var detailBlocks = [
      { title: 'Overview & Description', body: product.description },
      { title: 'Key Uses', body: product.uses },
      { title: 'Dosage Guidance', body: product.dosage },
      { title: 'Safety & Side Effects Note', body: product.side_effects },
      { title: 'Storage Instructions', body: product.storage },
    ].filter(function (b) { return b.body; });

    root.innerHTML =
      '<nav class="breadcrumb" aria-label="Breadcrumb">' +
        '<a href="index.html">Home</a>' +
        '<span aria-hidden="true">/</span>' +
        '<a href="shop.html?category=' + encodeURIComponent(product.category) + '">' + escapeHtml(product.category) + '</a>' +
        '<span aria-hidden="true">/</span>' +
        '<span aria-current="page">' + escapeHtml(product.name) + '</span>' +
      '</nav>' +
      '<div class="pdp-grid">' +
        '<div class="pdp-gallery">' +
          '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'images/placeholder.svg\';" />' +
          '<span class="product-badge-row">' +
            (product.prescription_required ? '<span class="product-rx-flag">Rx Required</span>' : '<span class="product-otc-flag">OTC</span>') +
          '</span>' +
        '</div>' +
        '<div class="pdp-module">' +
          '<div class="pdp-meta-line">' + escapeHtml([product.brand, product.category, product.pack_size].filter(Boolean).join(' · ')) + '</div>' +
          '<h1 class="pdp-title">' + escapeHtml(product.name) + '</h1>' +
          (product.composition ? '<p class="pdp-composition"><strong>Composition:</strong> ' + escapeHtml(product.composition) + '</p>' : '') +
          '<div class="pdp-price-box">' +
            '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;" class="tabular-nums">' +
              '<span class="pdp-price-main">' + formatINR(product.price) + '</span>' +
              (product.mrp > product.price ? '<span class="price-mrp" style="font-size:16px;">MRP ' + formatINR(product.mrp) + '</span>' : '') +
              (product.discount > 0 ? '<span class="price-discount" style="font-size:15px;">Save ' + product.discount + '% (' + formatINR(product.mrp - product.price) + ')</span>' : '') +
            '</div>' +
            '<div style="font-size:13px;color:var(--ink-muted);margin-top:6px;">Inclusive of all taxes · ' + (product.in_stock ? 'In stock at our Baruipur store' : 'Currently out of stock') + '</div>' +
          '</div>' +
          (product.prescription_required
            ? '<div class="rx-notice-box" role="note"><strong>Prescription Required (Schedule H / H1):</strong> A valid doctor\'s prescription is required before dispatch. You can share it on WhatsApp or via our <a href="prescription.html" style="text-decoration:underline;font-weight:600;">Upload Prescription</a> page.</div>'
            : '') +
          '<div class="pdp-actions">' +
            '<a class="btn btn-whatsapp btn-lg" href="' + waBuyUrl + '" target="_blank" rel="noopener noreferrer">' + ICONS.whatsapp + '<span>' + (product.in_stock ? 'Order on WhatsApp' : 'Enquire Restock on WhatsApp') + '</span></a>' +
            '<a class="btn btn-secondary btn-lg" href="' + buildTelUrl() + '">' + ICONS.phone + '<span>Call ' + CONFIG.PHONE_RAW + '</span></a>' +
            (product.prescription_required ? '<a class="btn btn-soft btn-lg" href="prescription.html">Upload Prescription</a>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      (detailBlocks.length
        ? '<div class="pdp-details-grid">' +
            detailBlocks.map(function (block) {
              return '<section class="info-panel"><h3>' + escapeHtml(block.title) + '</h3><p>' + escapeHtml(block.body) + '</p></section>';
            }).join('') +
          '</div>'
        : '') +
      '<div class="disclaimer-box" role="note"><strong>Medical Disclaimer:</strong> Product information on ' + escapeHtml(CONFIG.BRAND_NAME) + ' is provided for general reference only and is not a substitute for qualified medical advice, diagnosis, or treatment. Always consult a registered medical practitioner before starting, stopping, or changing any medication.</div>';

    if (relatedRoot) {
      var sameCat = products.filter(function (p) { return p.id !== product.id && p.category === product.category && p.in_stock; });
      var rest = products.filter(function (p) { return p.id !== product.id && p.category !== product.category && p.in_stock; });
      var related = sameCat.concat(rest).slice(0, 4);
      relatedRoot.innerHTML = related.map(renderProductCard).join('');
    }
  }

  function initPrescription() {
    var form = document.getElementById('prescription-form');
    var dropzone = document.getElementById('rx-dropzone');
    var fileInput = document.getElementById('rx-file-input');
    var previewEl = document.getElementById('rx-file-preview');
    var resultEl = document.getElementById('rx-submit-result');
    if (!form || !dropzone || !fileInput) return;

    var selectedFile = null;
    function handleFile(file) {
      if (!file) return;
      var allowed = ['image/jpeg', 'image/png', 'application/pdf'];
      if (allowed.indexOf(file.type) === -1 && !/\.(jpe?g|png|pdf)$/i.test(file.name)) return;
      selectedFile = file;
      if (!previewEl) return;
      var sizeKb = Math.max(1, Math.round(file.size / 1024));
      function showPreview(thumbHtml) {
        previewEl.innerHTML =
          '<div class="preview-card">' + thumbHtml +
            '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(file.name) + '</div>' +
            '<div style="font-size:13px;color:var(--ink-muted);">' + sizeKb + ' KB · Ready to share on WhatsApp or Email</div></div>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-clear-file>Remove</button>' +
          '</div>';
        var clearBtn = previewEl.querySelector('[data-clear-file]');
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            selectedFile = null;
            fileInput.value = '';
            previewEl.innerHTML = '';
          });
        }
      }
      if (file.type.indexOf('image/') === 0) {
        var reader = new FileReader();
        reader.onload = function () { showPreview('<img class="preview-thumb" src="' + reader.result + '" alt="Prescription preview" />'); };
        reader.readAsDataURL(file);
      } else {
        showPreview('<div class="preview-thumb">PDF</div>');
      }
    }

    dropzone.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () { handleFile(fileInput.files && fileInput.files[0]); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('rx-patient-name');
      var phoneInput = document.getElementById('rx-patient-phone');
      var notesInput = document.getElementById('rx-patient-notes');
      var errName = document.getElementById('rx-err-name');
      var errPhone = document.getElementById('rx-err-phone');
      var name = String((nameInput && nameInput.value) || '').trim();
      var phone = String((phoneInput && phoneInput.value) || '').replace(/\D/g, '');
      var notes = String((notesInput && notesInput.value) || '').trim();
      var nameErr = name.length < 2 ? 'Please enter the patient name.' : '';
      var phoneErr = phone.length !== 10 ? 'Please enter a valid 10-digit mobile number.' : '';
      if (nameInput) nameInput.classList.toggle('is-invalid', Boolean(nameErr));
      if (phoneInput) phoneInput.classList.toggle('is-invalid', Boolean(phoneErr));
      if (errName) errName.textContent = nameErr;
      if (errPhone) errPhone.textContent = phoneErr;
      if (nameErr || phoneErr || !resultEl) return;

      var msg = [
        'Hello ' + CONFIG.BRAND_NAME + ', I am sending a prescription for medicine order.',
        'Patient Name: ' + name,
        'Phone: ' + phone,
        selectedFile ? 'File Selected: ' + selectedFile.name + ' (attaching in chat)' : 'Attaching prescription photo in chat',
        notes ? 'Notes: ' + notes : '',
      ].filter(Boolean).join('\n');

      resultEl.hidden = false;
      resultEl.innerHTML =
        '<div class="info-panel" style="margin-top:20px;background:var(--color-primary-soft);border-color:var(--color-primary-border);">' +
          '<h3 style="color:var(--color-primary-dark);">Ready to send your prescription</h3>' +
          '<p style="margin-bottom:14px;">Tap WhatsApp or Email below and attach your prescription file' + (selectedFile ? ' (<strong>' + escapeHtml(selectedFile.name) + '</strong>)' : '') + '. Our pharmacist will verify stock and call you with the exact bill before dispatch.</p>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
            '<a class="btn btn-whatsapp" href="' + buildWhatsAppUrl(msg) + '" target="_blank" rel="noopener noreferrer">Send via WhatsApp</a>' +
            '<a class="btn btn-secondary" href="' + buildMailtoUrl(CONFIG.PHARMACY_EMAIL, 'Prescription Order - ' + name + ' (' + phone + ')', msg) + '">Send via Email (' + CONFIG.PHARMACY_EMAIL + ')</a>' +
          '</div>' +
        '</div>';
    });
  }

  function initEnquiryForm(formId, targetEmail, defaultSubject) {
    var form = document.getElementById(formId);
    if (!form) return;
    var output = document.getElementById(formId + '-result');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl = form.querySelector('[name="name"]');
      var phoneEl = form.querySelector('[name="phone"]');
      var msgEl = form.querySelector('[name="message"]');
      var errEl = form.querySelector('[data-form-error]');
      var name = String((nameEl && nameEl.value) || '').trim();
      var phone = String((phoneEl && phoneEl.value) || '').replace(/\D/g, '');
      var message = String((msgEl && msgEl.value) || '').trim();
      if (name.length < 2 || phone.length !== 10 || message.length < 5) {
        if (errEl) errEl.textContent = 'Please enter your name, a valid 10-digit phone number, and a short message.';
        return;
      }
      if (errEl) errEl.textContent = '';
      var body = defaultSubject + '\nName: ' + name + '\nPhone: ' + phone + '\nMessage: ' + message;
      if (output) {
        output.hidden = false;
        output.innerHTML =
          '<div class="info-panel" style="margin-top:16px;background:var(--color-primary-soft);border-color:var(--color-primary-border);">' +
            '<h3>Enquiry prepared</h3>' +
            '<p style="margin-bottom:12px;">Choose WhatsApp for fastest response or send via email to ' + escapeHtml(targetEmail) + '.</p>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
              '<a class="btn btn-whatsapp btn-sm" href="' + buildWhatsAppUrl(body) + '" target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>' +
              '<a class="btn btn-secondary btn-sm" href="' + buildMailtoUrl(targetEmail, defaultSubject + ' — ' + name, body) + '">Send via Email</a>' +
            '</div>' +
          '</div>';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.__PHARMAWALA_APP_READY__ || window.__PHARMAWALA_STOREFRONT_READY__) return;
    window.__PHARMAWALA_STOREFRONT_READY__ = true;

    var openNow = isStoreOpenNow();
    document.querySelectorAll('[data-store-status-card]').forEach(function (el) {
      el.classList.toggle('is-open', openNow);
      el.classList.toggle('is-closed', !openNow);
      el.innerHTML = '<span class="status-dot" aria-hidden="true"></span>' + (openNow ? 'Store Open Now · Until 10:30 PM' : 'Currently Closed · Opens 8:00 AM');
    });

    var products = getCatalog();
    var page = document.body.getAttribute('data-page') || 'home';
    if (page === 'home') initHome(products);
    else if (page === 'shop') initShop(products);
    else if (page === 'product') initProduct(products);
    else if (page === 'prescription') initPrescription();
    else if (page === 'clinic') initEnquiryForm('clinic-appointment-form', CONFIG.POLYCLINIC_EMAIL, 'Pharmawala Polyclinic Appointment Request');
    else if (page === 'contact') initEnquiryForm('contact-enquiry-form', CONFIG.PHARMACY_EMAIL, 'Pharmawala Pharmacy Website Enquiry');
  });
})();
