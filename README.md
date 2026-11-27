# Pharmawala Pharmacy (`pharmawalapharmacy.com`)

Static HTML5, CSS3, and vanilla ES6+ JavaScript storefront for **Pharmawala Pharmacy** and its sister vertical **Pharmawala Polyclinic** in Baruipur, Kolkata.

## Folder Structure
- `index.html`, `shop.html`, `product.html`, `prescription.html`, `clinic.html`, `about.html`, `contact.html`
- `policies/` — `privacy.html`, `terms.html`, `returns.html`, `delivery.html`
- `css/` — `style.css`, `responsive.css`
- `js/` — `config.js`, `products.js`, `ui.js`, `app.js`
- `data/data.json` — dynamic product catalogue
- `images/` — logo, hero photography, polyclinic photography, product imagery, and placeholder SVG
- `sitemap.xml` & `robots.txt`

## 1. Replacing `data/data.json`
Replace `/data/data.json` with your own JSON array (or `{ "products": [...] }`). Place product images inside `/images/products/` and reference them by filename or relative path. Missing fields are handled defensively (placeholder image fallback, auto-computed discount from `mrp` and `price`, hidden empty sections).

## 2. Editing Business Settings (`js/config.js`)
Open `/js/config.js` to update:
- `CLINIC_URL` (set to an external URL whenever Pharmawala Polyclinic gets its own domain)
- `STORE_TIMINGS` and `CLINIC_TIMINGS`
- `DRUG_LICENCE_NO` and `PHARMACIST_REG`
- `FREE_DELIVERY_THRESHOLD` and `DELIVERY_FEE`

## 3. Deploying to Any Static Host
Upload all files (preserving the folder structure) to **Netlify**, **Vercel**, **GitHub Pages**, or **cPanel `public_html`**. No build step or backend database is required.
