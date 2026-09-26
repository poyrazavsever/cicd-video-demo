import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount } from '../src/discount.js';

test('1000 TL için yüzde 20 indirim sonucu 800 TL olmalı', () => {
  assert.equal(calculateDiscount(1000, 20), 800);
});
test('Yüzde 0 indirim fiyatı değiştirmemeli', () => {
  assert.equal(calculateDiscount(250, 0), 250);
});
test('Yüzde 100 indirim sonucu sıfır olmalı', () => {
  assert.equal(calculateDiscount(250, 100), 0);
});
test('Sonuç iki ondalık basamağa yuvarlanmalı', () => {
  assert.equal(calculateDiscount(99.99, 15), 84.99);
});
test('Sınır dışı değerler reddedilmeli', () => {
  assert.throws(() => calculateDiscount(-10, 20), RangeError);
  assert.throws(() => calculateDiscount(100, -1), RangeError);
  assert.throws(() => calculateDiscount(100, 101), RangeError);
});
test('Sayısal olmayan veya sonsuz değerler reddedilmeli', () => {
  assert.throws(() => calculateDiscount(NaN, 20), RangeError);
  assert.throws(() => calculateDiscount(100, Infinity), RangeError);
});
