export function calculateDiscount(price, percent) {
  if (!Number.isFinite(price) || !Number.isFinite(percent) ||
      price < 0 || percent < 0 || percent > 100) {
    throw new RangeError('Fiyat pozitif veya sıfır, indirim 0–100 arasında olmalı.');
  }

  return Math.round(price * (1 - percent / 100) * 100) / 100;
}
