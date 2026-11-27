/**
 * Pharmawala Pharmacy — Central Business Configuration
 * Edit values here to update phone numbers, emails, timings, clinic URL,
 * free delivery threshold, and licence placeholders across the entire website.
 */

export const CONFIG = {
  BRAND_NAME: 'Pharmawala Pharmacy',
  CLINIC_NAME: 'Pharmawala Polyclinic',
  DOMAIN: 'pharmawalapharmacy.com',
  PHONE_DISPLAY: '+91 82820 82425',
  PHONE_RAW: '8282082425',
  WHATSAPP_NUMBER: '918282082425',
  PHARMACY_EMAIL: 'pharmawalapharmacy@gmail.com',
  POLYCLINIC_EMAIL: 'pharmawalapolyclinic@gmail.com',
  ADDRESS: 'Uttar Khodarbazar, Baruipur-Kalyanpur Road, Baruipur, Kolkata-700144',
  PINCODE: '700144',
  CITY: 'Baruipur, Kolkata',

  // Change CLINIC_URL to an external domain (e.g. 'https://clinic.pharmawalapharmacy.com')
  // whenever the polyclinic gets its own standalone website.
  CLINIC_URL: 'clinic.html',

  // Commerce Settings
  FREE_DELIVERY_THRESHOLD: 499,
  DELIVERY_FEE: 35,
  ITEMS_PER_PAGE: 24,
  CURRENCY_SYMBOL: '₹',

  // Store & Clinic Placeholders (replace before going live)
  STORE_TIMINGS: 'Open Daily: 8:00 AM – 10:30 PM',
  CLINIC_TIMINGS: 'Mon–Sat: 9:00 AM – 8:30 PM · Sun: 9:30 AM – 2:00 PM',
  DRUG_LICENCE_NO: 'WB/24PGS(S)/RET/20B & 21B — [Add Official Licence No.]',
  PHARMACIST_REG: 'Registered Pharmacist — WBPC Reg. No. [Add Reg. No.]',

  MAP_EMBED_URL:
    'https://maps.google.com/maps?q=Uttar+Khodarbazar,+Baruipur-Kalyanpur+Road,+Baruipur,+Kolkata-700144&t=&z=15&ie=UTF8&iwloc=&output=embed',
  MAP_DIRECTIONS_URL:
    'https://www.google.com/maps/search/?api=1&query=Uttar+Khodarbazar,+Baruipur-Kalyanpur+Road,+Baruipur,+Kolkata-700144',
};

/**
 * Computes relative root prefix so links and assets resolve cleanly
 * both from root pages (index.html) and nested folders (/policies/privacy.html).
 */
export function getBasePath() {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname || '';
  return path.includes('/policies/') ? '../' : '';
}

export function resolveHref(relativePath) {
  if (!relativePath) return '#';
  if (/^(https?:|mailto:|tel:|#)/i.test(relativePath)) {
    return relativePath;
  }
  return `${getBasePath()}${relativePath.replace(/^\//, '')}`;
}

export function buildWhatsAppUrl(message) {
  const encoded = encodeURIComponent(message || '');
  return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}${encoded ? `?text=${encoded}` : ''}`;
}

export function buildTelUrl() {
  return `tel:+91${CONFIG.PHONE_RAW}`;
}

export function buildMailtoUrl(email, subject, body) {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString();
  return `mailto:${email}${query ? `?${query}` : ''}`;
}

export function buildProductWhatsAppUrl(product) {
  if (!product) {
    return buildWhatsAppUrl(`Hello ${CONFIG.BRAND_NAME}, I would like to enquire about medicines.`);
  }
  const pack = product.pack_size ? ` (${product.pack_size})` : '';
  const priceText = product.price ? ` — ${CONFIG.CURRENCY_SYMBOL}${Number(product.price).toLocaleString('en-IN')}` : '';
  const action = product.in_stock === false
    ? 'is this currently back in stock or available on request?'
    : 'please confirm availability for home delivery / store pickup.';
  const rxNote = product.prescription_required ? ' (I have a valid prescription ready.)' : '';
  return buildWhatsAppUrl(
    `Hello ${CONFIG.BRAND_NAME}, I would like to order ${product.name}${pack}${priceText} — ${action}${rxNote}`
  );
}

/**
 * Checks if the pharmacy is open during daily store hours (8:00 AM – 10:30 PM IST).
 */
export function isStoreOpenNow(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    const minutes = hour * 60 + minute;
    return minutes >= 8 * 60 && minutes <= 22 * 60 + 30;
  } catch {
    const minutes = date.getHours() * 60 + date.getMinutes();
    return minutes >= 8 * 60 && minutes <= 22 * 60 + 30;
  }
}
