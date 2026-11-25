/* =========================================================
   DOCE ENCANTO — script.js
   Menu mobile, header on scroll, reveal on scroll,
   fallback de imagens + carrinho e dados do cliente (localStorage)
   ========================================================= */

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const header = document.getElementById('header');
if (header) {
  const onScroll = () => {
    header.style.boxShadow = window.scrollY > 12
      ? '0 12px 30px -20px rgba(122,43,74,.35)'
      : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const revealTargets = document.querySelectorAll('.product-card, .about-item');
if (revealTargets.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1)';
    observer.observe(el);
  });
}

const IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23FBE3EC'/%3E%3Cpath d='M200 95c-28 0-43 21-43 40 0 9 4 15 9 19-15 6-26 19-26 36 0 23 24 38 60 38s60-15 60-38c0-17-11-30-26-36 5-4 9-10 9-19 0-19-15-40-43-40z' fill='%23C24A78' opacity='.85'/%3E%3Ctext x='200' y='262' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%237A2B4A'%3EDoce Encanto%3C/text%3E%3C/svg%3E";

function applyImageFallback(img) {
  if (!img || img.dataset.fallbackBound) return;
  img.dataset.fallbackBound = '1';

  img.addEventListener('error', function onImgError() {
    const src = img.getAttribute('src') || '';
    if (!img.dataset.triedAltExt && /\.jpe?g$/i.test(src)) {
      img.dataset.triedAltExt = '1';
      img.src = /\.jpeg$/i.test(src)
        ? src.replace(/\.jpeg$/i, '.jpg')
        : src.replace(/\.jpg$/i, '.jpeg');
      return;
    }
    img.removeEventListener('error', onImgError);
    img.src = IMG_PLACEHOLDER;
  });
}

document.querySelectorAll('img').forEach(applyImageFallback);

const CART_KEY = 'doce_encanto_cart_v1';
const CLIENTE_KEY = 'doce_encanto_cliente_v1';

function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(raw)) return [];
    return raw.map(item => ({
      id: String(item.id ?? ''),
      nome: String(item.nome || 'Produto'),
      preco: Number(item.preco) || 0,
      img: item.img ? String(item.img) : '',
      qtd: Math.max(1, Number(item.qtd) || 1)
    }));
  } catch (e) {
    return [];
  }
}

function setCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Não foi possível salvar o carrinho no localStorage:', e);
  }
  updateCartCount();
}

function getCliente() {
  try {
    return JSON.parse(localStorage.getItem(CLIENTE_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function setCliente(dados) {
  try {
    localStorage.setItem(CLIENTE_KEY, JSON.stringify(dados));
  } catch (e) {
    console.warn('Não foi possível salvar os dados do cliente:', e);
  }
}

function clearCliente() {
  try {
    localStorage.removeItem(CLIENTE_KEY);
  } catch (e) { /* ignora */ }
}

function updateCartCount() {
  const badges = document.querySelectorAll('.cart-count');
  if (!badges.length) return;
  const count = getCart().reduce((acc, item) => acc + item.qtd, 0);
  badges.forEach(b => {
    b.textContent = count;
    const btn = b.closest('.cart-btn');
    if (btn) {
      btn.classList.add('bump');
      setTimeout(() => btn.classList.remove('bump'), 320);
    }
  });
}

function addToCart(prod) {
  const cart = getCart();
  const prodId = String(prod.id);
  const idx = cart.findIndex(p => String(p.id) === prodId);
  if (idx >= 0) {
    cart[idx].qtd += 1;
    if (prod.img && !cart[idx].img) cart[idx].img = prod.img;
  } else {
    cart.push({
      id: prodId,
      nome: prod.nome,
      preco: Number(prod.preco) || 0,
      img: prod.img || '',
      qtd: 1
    });
  }
  setCart(cart);
}

function money(n) {
  return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',');
}

document.addEventListener('DOMContentLoaded', updateCartCount);
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) updateCartCount();
});

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.dataset.originalHtml = btn.innerHTML;

  btn.addEventListener('click', () => {
    const id = btn.dataset.id || String(Date.now());
    const nome = btn.dataset.nome || 'Produto';
    const preco = Number(btn.dataset.preco || 0);
    const img = btn.dataset.img || '';

    addToCart({ id, nome, preco, img });

    clearTimeout(btn._resetTimer);
    btn.classList.add('added');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg> Adicionado';

    btn._resetTimer = setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = btn.dataset.originalHtml;
    }, 1400);
  });
});

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
