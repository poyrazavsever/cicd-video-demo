import './style.css';
import { calculateDiscount } from './discount.js';

const form = document.querySelector('#calculator');
const result = document.querySelector('#result');
const currency = new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY',
});

function updateResult() {
  try {
    const price = Number(document.querySelector('#price').value);
    const percent = Number(document.querySelector('#discount').value);
    result.textContent = currency.format(calculateDiscount(price, percent));
  } catch (error) {
    result.textContent = error.message;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  updateResult();
});
updateResult();
