// currency.js
async function detectAndSetCurrency() {
  let currency = localStorage.getItem('preferredCurrency');

  if (!currency) {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      currency = (data.currency === 'AUD') ? 'AUD' : 'AED';
    } catch (error) {
      currency = 'AED';
    }
    localStorage.setItem('preferredCurrency', currency);
  }

  // Update all currency symbols
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = currency;
  });

  // Update dropdown
  const select = document.getElementById('currency-select');
  if (select) select.value = currency;

  // Update Snipcart
  if (window.Snipcart) {
    Snipcart.api.session.setCurrency(currency);
  }

  // Update projected price if exists
  const projected = document.getElementById('projected');
  if (projected && window.getPrice) {
    const qty = parseInt(document.getElementById('qty-input')?.value || 1);
    projected.textContent = (window.getPrice() * qty).toFixed(2) + ' ' + currency;
  }
}

window.addEventListener('DOMContentLoaded', detectAndSetCurrency);

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('currency-select');
  if (!select) return;

  select.addEventListener('change', (e) => {
    const newCurrency = e.target.value;
    localStorage.setItem('preferredCurrency', newCurrency);

    document.querySelectorAll('.currency-symbol').forEach(el => {
      el.textContent = newCurrency;
    });

    if (window.Snipcart) {
      Snipcart.api.session.setCurrency(newCurrency);
    }

    // Update projected price on change
    const projected = document.getElementById('projected');
    if (projected && window.getPrice) {
      const qty = parseInt(document.getElementById('qty-input')?.value || 1);
      projected.textContent = (window.getPrice() * qty).toFixed(2) + ' ' + newCurrency;
    }
  });
});