/**
 * Pharmawala Pharmacy — Debounced Instant Search Widget
 * Searches name, brand, composition, and category with keyboard support.
 */

import { resolveHref } from './config.js';
import { extractCategories, formatINR, loadProducts, scoreSearchMatch } from './products.js';

export function debounce(fn, delayMs = 200) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

export function getInstantSuggestions(products, query, limit = 6) {
  const q = String(query || '').trim();
  if (!q) return [];
  return products
    .map((product) => ({ product, score: scoreSearchMatch(product, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Binds instant search dropdown behavior to any search container
 * containing [data-search-input], [data-search-form], and [data-search-dropdown].
 */
export function initSearchWidget(container) {
  if (!container) return;
  const form = container.querySelector('[data-search-form]');
  const input = container.querySelector('[data-search-input]');
  const dropdown = container.querySelector('[data-search-dropdown]');
  if (!form || !input || !dropdown) return;

  let activeIndex = -1;
  let productsRef = [];

  loadProducts()
    .then((products) => {
      productsRef = products;
    })
    .catch(() => {
      productsRef = [];
    });

  const closeDropdown = () => {
    dropdown.classList.remove('is-open');
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  };

  const openDropdown = () => {
    dropdown.classList.add('is-open');
    input.setAttribute('aria-expanded', 'true');
  };

  const renderCategorySuggestions = () => {
    const categories = extractCategories(productsRef).slice(0, 6);
    if (!categories.length) {
      closeDropdown();
      return;
    }
    dropdown.innerHTML = `
      <div class="search-dropdown-heading">Popular categories in Baruipur</div>
      <div class="search-quick-cats">
        ${categories
          .map(
            (cat) => `
          <a class="search-cat-btn" href="${resolveHref(`shop.html?category=${encodeURIComponent(cat.name)}`)}">
            ${escapeHtml(cat.name)}
          </a>`
          )
          .join('')}
      </div>
    `;
    openDropdown();
  };

  const renderMatches = (query) => {
    const q = query.trim();
    if (!q) {
      renderCategorySuggestions();
      return;
    }

    const matches = getInstantSuggestions(productsRef, q, 6);
    if (!matches.length) {
      dropdown.innerHTML = `
        <div class="search-dropdown-heading">No exact matches for "${escapeHtml(q)}"</div>
        <div style="padding: 14px; font-size: 14px; color: var(--ink-secondary);">
          Can't find your medicine? <a href="${resolveHref('prescription.html')}" style="color: var(--color-primary); font-weight: 600; text-decoration: underline;">Upload your prescription</a> and our Baruipur pharmacist will arrange it.
        </div>
      `;
      openDropdown();
      return;
    }

    dropdown.innerHTML = `
      <div class="search-dropdown-heading">Medicines &amp; health products</div>
      ${matches
        .map(
          (item) => `
        <a class="search-result-item" role="option" href="${resolveHref(`product.html?id=${encodeURIComponent(item.id)}`)}">
          <img class="search-result-thumb" src="${resolveHref(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='${resolveHref('images/placeholder.svg')}'" />
          <div class="search-result-info">
            <div class="search-result-name">${escapeHtml(item.name)}${item.prescription_required ? ' · Rx' : ''}</div>
            <div class="search-result-meta">${escapeHtml([item.brand, item.composition].filter(Boolean).join(' · '))}</div>
          </div>
          <div class="search-result-price tabular-nums">${formatINR(item.price)}</div>
        </a>`
        )
        .join('')}
      <a class="search-result-item" href="${resolveHref(`shop.html?q=${encodeURIComponent(q)}`)}" style="justify-content: center; font-weight: 600; color: var(--color-primary);">
        View all results for "${escapeHtml(q)}"
      </a>
    `;
    activeIndex = -1;
    openDropdown();
  };

  const debouncedRender = debounce((val) => renderMatches(val), 200);

  input.addEventListener('focus', () => {
    if (productsRef.length) {
      renderMatches(input.value);
    }
  });

  input.addEventListener('input', (e) => {
    debouncedRender(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    const options = Array.from(dropdown.querySelectorAll('.search-result-item'));
    if (!options.length || !dropdown.classList.contains('is-open')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % options.length;
      options.forEach((el, idx) => el.classList.toggle('is-active', idx === activeIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + options.length) % options.length;
      options.forEach((el, idx) => el.classList.toggle('is-active', idx === activeIndex));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      options[activeIndex].click();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    const target = q
      ? resolveHref(`shop.html?q=${encodeURIComponent(q)}`)
      : resolveHref('shop.html');
    window.location.href = target;
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      closeDropdown();
    }
  });
}
