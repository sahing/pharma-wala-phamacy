/**
 * Pharmawala Pharmacy — Shared UI Components & Chrome
 * Renders slim single-row sticky header, categories mega-menu, footer,
 * WhatsApp-first product cards, skeleton loaders, mobile sticky bar,
 * enhanced sliding banner carousel, FAQ & toasts.
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
import { extractCategories, formatINR } from './products.js';

export const ICONS = {
  cross: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`,
  stethoscope: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  pill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  droplet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.7 6.3 9.4A7.5 7.5 0 1 0 17.7 9.4L12 2.7Z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  bandage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M10 10h.01M14 14h.01M14 10h.01M10 14h.01"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

export function getCategoryIcon(categoryName) {
  const lower = String(categoryName || '').toLowerCase();
  if (lower.includes('diabet')) return ICONS.droplet;
  if (lower.includes('vitamin') || lower.includes('nutrit')) return ICONS.sun;
  if (lower.includes('device') || lower.includes('monitor')) return ICONS.activity;
  if (lower.includes('ayurved') || lower.includes('herbal')) return ICONS.leaf;
  if (lower.includes('baby') || lower.includes('mother')) return ICONS.heart;
  if (lower.includes('first aid') || lower.includes('ortho')) return ICONS.bandage;
  if (lower.includes('personal') || lower.includes('skin')) return ICONS.shield;
  return ICONS.pill;
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function showToast(message) {
  let region = document.getElementById('pw-toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'pw-toast-region';
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  region.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2800);
}

export function renderHeader(activePage = '') {
  const target = document.getElementById('site-header-root');
  if (!target) return;

  const isClinic = activePage === 'clinic';
  const clinicHref = resolveHref(CONFIG.CLINIC_URL);
  const clinicTargetAttr = /^https?:/i.test(CONFIG.CLINIC_URL) ? ' target="_blank" rel="noopener noreferrer"' : '';
  const openNow = isStoreOpenNow();

  target.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="announcement-bar">
      <div class="container announcement-inner">
        <div class="announcement-text">
          <span class="store-status-pill ${openNow ? 'is-open' : 'is-closed'}" data-store-status>
            <span class="status-dot" aria-hidden="true"></span>
            ${openNow ? 'Open Now' : 'Closed Now'}
          </span>
          <span class="announcement-sep" aria-hidden="true">|</span>
          <span>Free home delivery in Baruipur above ${formatINR(CONFIG.FREE_DELIVERY_THRESHOLD)}</span>
          <span class="announcement-sep" aria-hidden="true">|</span>
          <span>${escapeHtml(isClinic ? CONFIG.CLINIC_TIMINGS : CONFIG.STORE_TIMINGS)}</span>
        </div>
        <div class="announcement-links">
          <a href="${resolveHref('prescription.html')}">Upload Prescription</a>
          <a href="${clinicHref}"${clinicTargetAttr}>${escapeHtml(CONFIG.CLINIC_NAME)}</a>
        </div>
      </div>
    </div>

    <header class="site-header" role="banner">
      <div class="container header-main header-main--single">
        <a class="brand-link" href="${resolveHref(isClinic ? 'clinic.html' : 'index.html')}" aria-label="${escapeHtml(isClinic ? CONFIG.CLINIC_NAME : CONFIG.BRAND_NAME)} Home">
          <span class="brand-mark">${isClinic ? ICONS.stethoscope : ICONS.cross}</span>
          <span class="brand-text">
            <span class="brand-name">${escapeHtml(isClinic ? CONFIG.CLINIC_NAME : CONFIG.BRAND_NAME)}</span>
            <span class="brand-sub">Baruipur · Kolkata-700144</span>
          </span>
        </a>

        <nav class="nav-inline" aria-label="Primary navigation">
          <ul class="nav-list nav-list--inline">
            <li class="nav-item">
              <a class="nav-link ${activePage === 'home' ? 'is-active' : ''}" href="${resolveHref('index.html')}">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'shop' ? 'is-active' : ''}" href="${resolveHref('shop.html')}">Catalogue</a>
            </li>
            <li class="nav-item" id="categories-mega-item">
              <button type="button" class="nav-link mega-trigger" id="categories-mega-btn" aria-label="Categories" aria-expanded="false" aria-controls="categories-mega-menu">
                Categories
                <span style="width:14px;height:14px;display:inline-flex;">${ICONS.chevronDown}</span>
              </button>
              <div class="mega-menu" id="categories-mega-menu" role="region" aria-label="Product categories">
                <div class="mega-grid" id="mega-categories-grid">
                  <a class="mega-link" href="${resolveHref('shop.html?category=Medicines')}"><span>Medicines</span></a>
                  <a class="mega-link" href="${resolveHref('shop.html?category=Diabetes%20Care')}"><span>Diabetes Care</span></a>
                  <a class="mega-link" href="${resolveHref('shop.html?category=Vitamins%20%26%20Nutrition')}"><span>Vitamins &amp; Nutrition</span></a>
                  <a class="mega-link" href="${resolveHref('shop.html?category=Healthcare%20Devices')}"><span>Healthcare Devices</span></a>
                </div>
              </div>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'prescription' ? 'is-active' : ''}" href="${resolveHref('prescription.html')}">Upload Rx</a>
            </li>
            <li class="nav-item">
              <a class="nav-link nav-link-clinic ${activePage === 'clinic' ? 'is-active' : ''}" href="${clinicHref}"${clinicTargetAttr}>
                Polyclinic
                <span class="sister-tag">Clinic</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'about' ? 'is-active' : ''}" href="${resolveHref('about.html')}">About</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'contact' ? 'is-active' : ''}" href="${resolveHref('contact.html')}">Contact</a>
            </li>
          </ul>
        </nav>

        <div class="header-actions">
          <a class="header-phone" href="${buildTelUrl()}" aria-label="Call Pharmawala Pharmacy at ${CONFIG.PHONE_RAW}">
            ${ICONS.phone}
            <span class="tabular-nums">${CONFIG.PHONE_RAW}</span>
          </a>
          <a
            class="header-wa-cta"
            href="${buildWhatsAppUrl(`Hello ${CONFIG.BRAND_NAME}, I would like to order medicines or enquire about availability.`)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${ICONS.whatsapp}
            <span>WhatsApp Order</span>
          </a>
          <button type="button" class="mobile-menu-btn" id="open-mobile-drawer" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-nav-drawer">
            ${ICONS.menu}
          </button>
        </div>
      </div>
    </header>

    <div class="mobile-drawer-backdrop" id="mobile-drawer-backdrop"></div>
    <aside class="mobile-drawer" id="mobile-nav-drawer" aria-label="Mobile navigation" aria-hidden="true">
      <div class="mobile-drawer-header">
        <span class="brand-name">${escapeHtml(CONFIG.BRAND_NAME)}</span>
        <button type="button" class="mobile-drawer-close" id="close-mobile-drawer" aria-label="Close navigation menu">
          ${ICONS.close}
        </button>
      </div>
      <nav class="mobile-nav-links">
        <a href="${resolveHref('index.html')}" class="${activePage === 'home' ? 'is-active' : ''}">Home</a>
        <a href="${resolveHref('shop.html')}" class="${activePage === 'shop' ? 'is-active' : ''}">Medicine Catalogue</a>
        <a href="${resolveHref('prescription.html')}" class="${activePage === 'prescription' ? 'is-active' : ''}">Upload Prescription</a>
        <a href="${clinicHref}"${clinicTargetAttr} class="${activePage === 'clinic' ? 'is-active' : ''}">
          <span>${escapeHtml(CONFIG.CLINIC_NAME)}</span>
          <span class="sister-tag">Sister Vertical</span>
        </a>
        <a href="${resolveHref('about.html')}" class="${activePage === 'about' ? 'is-active' : ''}">About Us</a>
        <a href="${resolveHref('contact.html')}" class="${activePage === 'contact' ? 'is-active' : ''}">Contact &amp; Location</a>
      </nav>
      <div class="mobile-drawer-footer">
        <div><strong>Store Timings:</strong> ${escapeHtml(CONFIG.STORE_TIMINGS)}</div>
        <div><strong>Call / WhatsApp:</strong> <a href="${buildTelUrl()}">${CONFIG.PHONE_RAW}</a></div>
        <div>${escapeHtml(CONFIG.ADDRESS)}</div>
      </div>
    </aside>

    <nav class="mobile-bottom-bar" aria-label="Quick mobile actions">
      <a class="mobile-bottom-item" href="${buildTelUrl()}">
        ${ICONS.phone}
        <span>Call</span>
      </a>
      <a class="mobile-bottom-item mobile-bottom-item--whatsapp" href="${buildWhatsAppUrl('Hello Pharmawala Pharmacy, I need assistance with medicines.')}" target="_blank" rel="noopener noreferrer">
        ${ICONS.whatsapp}
        <span>WhatsApp</span>
      </a>
      <a class="mobile-bottom-item mobile-bottom-item--primary" href="${resolveHref('prescription.html')}">
        ${ICONS.upload}
        <span>Upload Rx</span>
      </a>
    </nav>
  `;

  // Wire Categories Mega Menu
  const megaItem = document.getElementById('categories-mega-item');
  const megaBtn = document.getElementById('categories-mega-btn');

  if (megaItem && megaBtn) {
    megaBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = megaItem.classList.toggle('is-open');
      megaBtn.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!megaItem.contains(e.target)) {
        megaItem.classList.remove('is-open');
        megaBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        megaItem.classList.remove('is-open');
        megaBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Wire Mobile Drawer
  const openBtn = document.getElementById('open-mobile-drawer');
  const closeBtn = document.getElementById('close-mobile-drawer');
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');

  const setDrawer = (open) => {
    if (!drawer || !backdrop || !openBtn) return;
    drawer.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
  };

  openBtn?.addEventListener('click', () => setDrawer(true));
  closeBtn?.addEventListener('click', () => setDrawer(false));
  backdrop?.addEventListener('click', () => setDrawer(false));
}

export function populateMegaMenuCategories(products) {
  const grid = document.getElementById('mega-categories-grid');
  if (!grid || !Array.isArray(products) || !products.length) return;
  const categories = extractCategories(products);
  grid.innerHTML = categories
    .map(
      (cat) => `
    <a class="mega-link" href="${resolveHref(`shop.html?category=${encodeURIComponent(cat.name)}`)}">
      <span>${escapeHtml(cat.name)}</span>
      <span class="mega-count tabular-nums">${cat.count}</span>
    </a>`
    )
    .join('');
}

export function renderFooter() {
  const target = document.getElementById('site-footer-root');
  if (!target) return;

  const clinicHref = resolveHref(CONFIG.CLINIC_URL);
  const clinicTargetAttr = /^https?:/i.test(CONFIG.CLINIC_URL) ? ' target="_blank" rel="noopener noreferrer"' : '';

  target.innerHTML = `
    <footer class="site-footer" role="contentinfo">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <span class="brand-mark" style="width:34px;height:34px;">${ICONS.cross}</span>
              <span style="font-family:var(--font-display);font-size:18px;font-weight:700;color:#FFFFFF;">${escapeHtml(CONFIG.BRAND_NAME)}</span>
            </div>
            <p style="font-size:14px;line-height:1.6;color:#C2D6CC;max-width:34ch;">
              Your neighbourhood licensed pharmacy in Baruipur, Kolkata. 100% genuine medicines, honest pricing, and quick home delivery.
            </p>
            <div class="footer-meta-block">
              <div><strong>Address:</strong> ${escapeHtml(CONFIG.ADDRESS)}</div>
              <div><strong>Phone / WhatsApp:</strong> <a href="${buildTelUrl()}" style="color:#FFFFFF;font-weight:600;">${CONFIG.PHONE_RAW}</a></div>
              <div><strong>Pharmacy Email:</strong> <a href="${buildMailtoUrl(CONFIG.PHARMACY_EMAIL)}">${CONFIG.PHARMACY_EMAIL}</a></div>
              <div><strong>Timings:</strong> ${escapeHtml(CONFIG.STORE_TIMINGS)}</div>
            </div>
          </div>

          <div>
            <h2 class="footer-heading">Pharmacy Quick Links</h2>
            <ul class="footer-links">
              <li><a href="${resolveHref('index.html')}">Home</a></li>
              <li><a href="${resolveHref('shop.html')}">Medicines &amp; Health Catalogue</a></li>
              <li><a href="${resolveHref('prescription.html')}">Upload Prescription</a></li>
              <li><a href="${buildWhatsAppUrl(`Hello ${CONFIG.BRAND_NAME}, I would like to order medicines.`)}" target="_blank" rel="noopener noreferrer">Order on WhatsApp</a></li>
              <li><a href="${resolveHref('about.html')}">About Pharmawala</a></li>
              <li><a href="${resolveHref('contact.html')}">Contact &amp; Directions</a></li>
            </ul>
          </div>

          <div>
            <h2 class="footer-heading">${escapeHtml(CONFIG.CLINIC_NAME)}</h2>
            <p style="font-size:14px;color:#C2D6CC;margin-bottom:12px;">
              Our sister vertical offering General Physician consultations, basic diagnostics, and chronic care follow-ups in Baruipur.
            </p>
            <ul class="footer-links">
              <li><a href="${clinicHref}"${clinicTargetAttr} style="color:#93C5FD;font-weight:600;">Visit Pharmawala Polyclinic &rarr;</a></li>
              <li><a href="${buildTelUrl()}">Book Appointment: ${CONFIG.PHONE_RAW}</a></li>
              <li><a href="${buildMailtoUrl(CONFIG.POLYCLINIC_EMAIL, 'Doctor Appointment Request')}">${CONFIG.POLYCLINIC_EMAIL}</a></li>
            </ul>
          </div>

          <div>
            <h2 class="footer-heading">Policies &amp; Compliance</h2>
            <ul class="footer-links">
              <li><a href="${resolveHref('policies/privacy.html')}">Privacy Policy</a></li>
              <li><a href="${resolveHref('policies/terms.html')}">Terms &amp; Conditions</a></li>
              <li><a href="${resolveHref('policies/returns.html')}">Return &amp; Refund Policy</a></li>
              <li><a href="${resolveHref('policies/delivery.html')}">Delivery Information</a></li>
              <li><a href="${CONFIG.MAP_DIRECTIONS_URL}" target="_blank" rel="noopener noreferrer">View Store on Google Maps</a></li>
            </ul>
            <div class="footer-meta-block" style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
              <div><strong>Drug Licence:</strong> ${escapeHtml(CONFIG.DRUG_LICENCE_NO)}</div>
              <div><strong>Pharmacist:</strong> ${escapeHtml(CONFIG.PHARMACIST_REG)}</div>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div>&copy; ${new Date().getFullYear()} ${escapeHtml(CONFIG.BRAND_NAME)} (${escapeHtml(CONFIG.DOMAIN)}). All rights reserved.</div>
          <div>Serving Uttar Khodarbazar, Baruipur &amp; South 24 Parganas, Kolkata-700144</div>
        </div>
      </div>
    </footer>
  `;
}

export function renderFloatingDoctorButton(activePage = '') {
  if (activePage === 'clinic') return;
  if (document.getElementById('floating-doctor-cta')) return;

  const clinicHref = resolveHref(CONFIG.CLINIC_URL);
  const link = document.createElement('a');
  link.id = 'floating-doctor-cta';
  link.className = 'floating-doctor-btn';
  link.href = clinicHref;
  if (/^https?:/i.test(CONFIG.CLINIC_URL)) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  link.setAttribute('aria-label', 'Book a Doctor at Pharmawala Polyclinic');
  link.innerHTML = `${ICONS.stethoscope}<span>Book a Doctor</span>`;
  document.body.appendChild(link);
}

export function renderSkeletonGrid(count = 8) {
  return Array.from({ length: count })
    .map(
      () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-box skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-box skeleton-line short"></div>
        <div class="skeleton-box skeleton-line medium"></div>
        <div class="skeleton-box skeleton-line"></div>
      </div>
    </div>`
    )
    .join('');
}

export function renderProductCard(product) {
  const detailUrl = resolveHref(`product.html?id=${encodeURIComponent(product.id)}`);
  const imgUrl = resolveHref(product.image);
  const placeholderUrl = resolveHref('images/placeholder.svg');
  const metaText = [product.brand, product.pack_size].filter(Boolean).join(' · ');
  const waUrl = buildProductWhatsAppUrl(product);

  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}">
      <a class="product-card-media" href="${detailUrl}">
        <img
          src="${imgUrl}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null;this.src='${placeholderUrl}';"
        />
        <span class="product-badge-row">
          ${
            product.prescription_required
              ? '<span class="product-rx-flag" title="Valid doctor prescription required">Rx Required</span>'
              : '<span class="product-otc-flag">OTC</span>'
          }
          ${product.discount > 0 ? `<span class="product-discount-pill tabular-nums">${product.discount}% OFF</span>` : ''}
        </span>
        <span class="product-cat-pill">${escapeHtml(product.category)}</span>
      </a>
      <div class="product-card-body">
        ${metaText ? `<div class="product-card-meta">${escapeHtml(metaText)}</div>` : ''}
        <h3 class="product-card-title">
          <a href="${detailUrl}">${escapeHtml(product.name)}</a>
        </h3>
        ${product.composition ? `<p class="product-card-salt">${escapeHtml(product.composition)}</p>` : ''}
        <div class="product-card-footer">
          <div class="price-block">
            <div class="price-row tabular-nums">
              <span class="price-current">${formatINR(product.price)}</span>
              ${product.mrp > product.price ? `<span class="price-mrp">${formatINR(product.mrp)}</span>` : ''}
            </div>
            <span class="stock-status ${product.in_stock ? 'is-in-stock' : 'is-out'}">
              ${product.in_stock ? 'In Stock' : 'Out of stock'}
            </span>
          </div>
          <a
            class="btn btn-whatsapp-soft btn-sm product-wa-btn"
            href="${waUrl}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${product.in_stock ? 'Order' : 'Enquire about'} ${escapeHtml(product.name)} on WhatsApp"
          >
            ${ICONS.whatsapp}
            <span>${product.in_stock ? 'Order' : 'Enquire'}</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

export function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const nodes = document.querySelectorAll('.reveal');
  if (!nodes.length) return;

  document.documentElement.classList.add('js-reveal-ready');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );

  nodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      node.classList.add('is-visible');
    } else {
      observer.observe(node);
    }
  });
}

export function initAccordions() {
  document.querySelectorAll('[data-accordion]').forEach((list) => {
    list.addEventListener('click', (e) => {
      const trigger = e.target.closest('.faq-trigger');
      if (!trigger) return;
      const item = trigger.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  });
}

export function initCarousel(carouselId, { intervalMs = 5200, slideSelector = '[data-carousel-slide]' } = {}) {
  const root = document.getElementById(carouselId);
  if (!root) return;
  const track = root.querySelector('[data-carousel-track]');
  const slides = Array.from(root.querySelectorAll(slideSelector));
  const dots = Array.from(root.querySelectorAll('.carousel-dot'));
  const prevBtn = root.querySelector('[data-carousel-prev]');
  const nextBtn = root.querySelector('[data-carousel-next]');
  const counterEl = root.querySelector('[data-carousel-counter]');
  if (!track || slides.length <= 1) return;

  let index = 0;
  let timer = null;
  let touchStartX = 0;

  const goTo = (nextIdx) => {
    index = (nextIdx + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === index)));
    if (counterEl) {
      counterEl.textContent = `${index + 1} / ${slides.length}`;
    }
  };

  const startAuto = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stopAuto();
    timer = setInterval(() => goTo(index + 1), intervalMs);
  };

  const stopAuto = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  prevBtn?.addEventListener('click', () => {
    goTo(index - 1);
    startAuto();
  });
  nextBtn?.addEventListener('click', () => {
    goTo(index + 1);
    startAuto();
  });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAuto();
    });
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      goTo(index - 1);
      startAuto();
    } else if (e.key === 'ArrowRight') {
      goTo(index + 1);
      startAuto();
    }
  });

  root.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0]?.clientX ?? 0;
      stopAuto();
    },
    { passive: true }
  );

  root.addEventListener(
    'touchend',
    (e) => {
      const touchEndX = e.changedTouches[0]?.clientX ?? 0;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        goTo(diff > 0 ? index + 1 : index - 1);
      }
      startAuto();
    },
    { passive: true }
  );

  root.addEventListener('mouseenter', stopAuto);
  root.addEventListener('mouseleave', startAuto);
  root.addEventListener('focusin', stopAuto);
  root.addEventListener('focusout', startAuto);

  goTo(0);
  startAuto();
}
