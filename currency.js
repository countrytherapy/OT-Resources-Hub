// currency.js - Updated for $ symbol in AUD (before number)

const BASE_CURRENCY = 'AED';
const BASE_PRICE = 2.50;

const COUNTRY_TO_CURRENCY = {
  'AU': 'AUD', 'US': 'USD', 'GB': 'GBP', 'CA': 'CAD',
  'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
  'AE': 'AED', 'IN': 'INR', 'SG': 'SGD', 'NZ': 'NZD',
  'JP': 'JPY', 'CH': 'CHF'
};

const SUPPORTED_CURRENCIES = ['AED', 'AUD', 'USD', 'GBP', 'EUR', 'CAD', 'SGD', 'INR', 'NZD', 'JPY', 'CHF'];

let rates = {};
let currentCurrency = BASE_CURRENCY;

async function fetchRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/AED');
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    if (data.result !== 'success') throw new Error('API error');
    rates = data.rates;
    console.log('Rates fetched successfully for base AED');
  } catch (err) {
    console.error('Rates fetch error:', err);
    rates = Object.fromEntries(SUPPORTED_CURRENCIES.map(c => [c, 1]));
  }
}

function getConvertedPrice(currency = currentCurrency) {
  const rate = rates[currency] || 1;
  return (BASE_PRICE * rate).toFixed(2);
}

function getCurrencySymbol(currency) {
  const symbols = {
    AED: 'د.إ', 
    AUD: '$',          // ← Changed: Just $ for AUD (Australian standard)
    USD: '$',          // Same as AUD, but context distinguishes
    GBP: '£', 
    EUR: '€',
    CAD: '$',          // Or 'C$' if you prefer disambiguation
    SGD: '$', 
    INR: '₹', 
    NZD: '$', 
    JPY: '¥', 
    CHF: 'CHF'
  };
  return symbols[currency] || currency;
}

function formatPrice(priceStr, currency) {
  const symbol = getCurrencySymbol(currency);
  // For AUD (and similar $ currencies), symbol BEFORE number, no space
  return `${symbol}${priceStr}`;
}

function applyCurrency(currency) {
  currentCurrency = currency;
  const priceNum = getConvertedPrice();
  const formatted = formatPrice(priceNum, currency);

  console.log(`Applying ${currency}: ${formatted}`);

  // Update main price
  document.querySelectorAll('.price').forEach(el => {
    el.innerHTML = `${formatted} <span class="currency-symbol"></span>`;  // symbol span empty now, since we include it in formatted
  });

  // Update projected
  const qty = parseInt(document.getElementById('qty-input')?.value || 1, 10);
  const projected = document.getElementById('projected');
  if (projected) {
    const totalNum = (parseFloat(priceNum) * qty).toFixed(2);
    const totalFormatted = formatPrice(totalNum, currency);
    projected.innerHTML = `${totalFormatted} <span class="currency-symbol"></span>`;
  }

  // Update Snipcart buttons (still use numeric priceStr, Snipcart handles display)
  document.querySelectorAll('.snipcart-add-item').forEach(btn => {
    btn.setAttribute('data-item-price', priceNum);
  });

  if (window.Snipcart) {
    Snipcart.api.session.setCurrency(currency.toLowerCase());
  }

  // Update dropdown
  const select = document.getElementById('currency-select');
  if (select) select.value = currency;
}

async function initCurrency() {
  await fetchRates();

  let currency = localStorage.getItem('preferredCurrency');
  if (!currency) {
    try {
      const geoRes = await fetch('https://ipapi.co/json/');
      const geo = await geoRes.json();
      currency = COUNTRY_TO_CURRENCY[geo.country_code] || BASE_CURRENCY;
      console.log('Detected:', geo.country_code, '→', currency);
    } catch {
      currency = BASE_CURRENCY;
    }
    localStorage.setItem('preferredCurrency', currency);
  }

  applyCurrency(currency);
}
function populateDropdown() {
  const select = document.getElementById('currency-select');
  if (!select || select.options.length > 1) return; // already populated or not found

  // Clear placeholder if present
  select.innerHTML = '';

  SUPPORTED_CURRENCIES.forEach(cur => {
    const opt = document.createElement('option');
    opt.value = cur;
    opt.textContent = `${cur} (${getCurrencySymbol(cur)})`; // e.g. "AUD ($)", "USD ($)"
    if (cur === currentCurrency) opt.selected = true;
    select.appendChild(opt);
  });

  console.log('Dropdown populated with', SUPPORTED_CURRENCIES.length, 'options');
}

// In initCurrency(), add the call after setting currency:
async function initCurrency() {
  await fetchRates();

  let currency = localStorage.getItem('preferredCurrency');
  if (!currency) {
    try {
      const geoRes = await fetch('https://ipapi.co/json/');
      const geo = await geoRes.json();
      currency = COUNTRY_TO_CURRENCY[geo.country_code] || BASE_CURRENCY;
      console.log('Detected:', geo.country_code, '→', currency);
    } catch {
      currency = BASE_CURRENCY;
    }
    localStorage.setItem('preferredCurrency', currency);
  }

  populateDropdown();  // ← ADD THIS LINE
  applyCurrency(currency);
}

// At the very bottom, expose it too (for safety calls):
window.populateDropdown = populateDropdown;
window.initCurrency = initCurrency;
window.applyCurrency = applyCurrency;
window.getCurrentPrice = () => parseFloat(getConvertedPrice());
