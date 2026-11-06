/* ===================== PARAMÈTRES À MODIFIER =====================
   1. Numéro WhatsApp au format international, sans espaces, sans +.
   2. Pour changer un prix, modifier PRODUCT_OPTIONS ci-dessous ET la ligne
      correspondante dans tarifs.html.
   3. Pour changer les couleurs, modifier les variables au début de style.css.
   4. Mettre HOLIDAY_PROMO_ACTIVE à true au début de la campagne de Noël et du
      Nouvel An, puis le remettre à false après les fêtes.
================================================================== */
const WHATSAPP_NUMBER = '243981812631';
const INSTAGRAM_URL = 'https://www.instagram.com/sms_makers/';
const TIKTOK_URL = 'https://www.tiktok.com/@sms_makers';
const HOLIDAY_PROMO_ACTIVE = false;
const HOLIDAY_DISCOUNT_PERCENT = 20;
const HOLIDAY_MIN_ITEMS = 3;

const PRODUCT_OPTIONS = {
  'Magazine personnalisé': [
    ['Magazine numérique, 14 pages, sans QR', 10], ['Magazine numérique, 14 pages, avec QR', 15],
    ['Magazine imprimé, 16 pages, sans QR', 12], ['Magazine imprimé, 16 pages, avec QR', 15]],
  'Journal surprise': [['Journal surprise numérique', 5], ['Journal surprise imprimé', 8]],
  'Cadre personnalisé': [['Cadre photo A5', 10.60], ['Cadre photo A4', 14], ['Cadre photo A3', 17]],
  'Mini-album complet': [['Mini-album complet imprimé', 10]],
  'Carte postale ou carte de vœux': [['Carte de vœux digitale', 5], ['Carte postale digitale', 7], ['Carte de vœux imprimée', 5], ['Carte postale imprimée', 7]],
  'QR code imprimable': [['QR code numérique simple', 7], ['QR code numérique avec design personnalisé', 10], ['QR code imprimable', 8]],
  'Invitation électronique': [['Invitation électronique simple', 5], ['Invitation électronique animée', 8]]
};

// Sert aux suggestions de recherche, sur toutes les pages.
const CATALOG = [
  { name: 'Magazines personnalisés', product: 'Magazine personnalisé', category: 'magazines', words: 'magazine couverture anniversaire mariage couple star' },
  { name: 'Journaux surprises', product: 'Journal surprise', category: 'journaux', words: 'journal faux journal surprise anniversaire histoire cadeau' },
  { name: 'Cadres personnalisés', product: 'Cadre personnalisé', category: 'cadres', words: 'cadre photo decoration cadeau anniversaire mariage couple fetes noel merci' },
  { name: 'Mini-albums complets', product: 'Mini-album complet', category: 'albums', words: 'album mini photo souvenir scrapbooking anniversaire mariage couple' },
  { name: 'Cartes postales et vœux', product: 'Carte postale ou carte de vœux', category: 'cartes', words: 'carte postale voeux felicitations merci anniversaire couple fetes noel nouvel an' },
  { name: 'QR codes imprimables', product: 'QR code imprimable', category: 'qr', words: 'qr code lien video musique photo message' },
  { name: 'Invitations électroniques', product: 'Invitation électronique', category: 'invitations', words: 'invitation mariage anniversaire evenement save the date' }
];

const OCCASIONS = {
  anniversaire: 'Anniversaire', mariage: 'Mariage', couple: 'En couple',
  fetes: 'Noël et Nouvel An', merci: 'Merci et félicitations', evenement: 'Événement'
};

/* ===== Outils ===== */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const normalize = text => String(text).toLocaleLowerCase('fr').replace(/œ/g, 'oe').normalize('NFD').replace(/\p{M}/gu, '');
const money = value => value.toLocaleString('fr-FR', { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' $';
const whatsappUrl = message => `https://wa.me/${WHATSAPP_NUMBER}${message ? '?text=' + encodeURIComponent(message) : ''}`;
const params = new URLSearchParams(location.search);
const closeIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

$$('[data-wa]').forEach(link => { link.href = whatsappUrl(link.dataset.wa); });
$$('[data-instagram]').forEach(link => { link.href = INSTAGRAM_URL; });
$$('[data-tiktok]').forEach(link => { link.href = TIKTOK_URL; });
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
$$('input[type="date"]').forEach(input => { input.min = new Date().toISOString().slice(0, 10); });

const holidayBanner = $('.holiday-promo');
if (holidayBanner) holidayBanner.hidden = !HOLIDAY_PROMO_ACTIVE;

/* ===== Message de confirmation ===== */
const toast = $('#toast');
const toastText = $('#toastText');
const toastAction = $('#toastAction');
let toastTimer;
let toastCallback;
let activeSheet = null;

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.remove('is-visible');
}
function armToast() {
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4500);
}
function showToast(message, action) {
  // Une fenêtre ouverte passe au-dessus de toute la page : le message doit s'y placer.
  const host = activeSheet ? activeSheet.dialog : document.body;
  if (toast.parentElement !== host) host.append(toast);
  toastText.textContent = message;
  toastAction.hidden = !action;
  toastAction.textContent = action ? action.label : '';
  toastCallback = action ? action.run : null;
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  armToast();
}
toastAction.addEventListener('click', () => {
  const run = toastCallback;
  hideToast();
  run?.();
});
toast.addEventListener('pointerenter', () => clearTimeout(toastTimer));
toast.addEventListener('pointerleave', armToast);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearTimeout(toastTimer);
  else if (toast.classList.contains('is-visible')) armToast();
});

/* ===== Feuilles : tiroir, fenêtre, et glissement au doigt sur mobile ===== */
const SHEET_MODE = matchMedia('(max-width: 43.75rem)');
const project = velocity => (velocity / 1000) * 0.998 / (1 - 0.998); // Point d'arrivée d'un geste lancé
const rubberband = (over, size) => (over * size * 0.55) / (size + 0.55 * Math.abs(over));

function createSheet(dialog) {
  const panel = $('.sheet-panel', dialog);
  const scrim = $('.sheet-scrim', dialog);
  const grab = $('.sheet-grab', dialog);
  let closeTimer;

  const sheet = {
    dialog,
    open() {
      clearTimeout(closeTimer);
      activeSheet = sheet;
      hideToast();
      if (!dialog.open) dialog.showModal();
      dialog.getBoundingClientRect();
      dialog.classList.add('is-open');
    },
    close(duration = 240) {
      if (activeSheet === sheet) activeSheet = null;
      if (toast.parentElement === dialog) document.body.append(toast);
      dialog.classList.remove('is-open');
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => { if (dialog.open) dialog.close(); panel.style.removeProperty('--sheet-dur'); }, duration + 20);
    }
  };

  $$('[data-sheet-close]', dialog).forEach(el => el.addEventListener('click', () => sheet.close()));
  dialog.addEventListener('cancel', event => { event.preventDefault(); sheet.close(); });
  dialog.addEventListener('close', () => { dialog.classList.remove('is-open'); if (activeSheet === sheet) activeSheet = null; });

  // Le doigt suit la feuille, puis le geste décide : fermer ou revenir.
  let drag = null;
  grab.addEventListener('pointerdown', event => {
    if (!SHEET_MODE.matches || drag || event.button !== 0 || event.target.closest('button, a')) return;
    grab.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, start: event.clientY, height: panel.offsetHeight, history: [{ y: event.clientY, t: event.timeStamp }] };
    panel.classList.add('is-dragging');
    scrim.style.transition = 'none';
  });
  grab.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = event.clientY - drag.start;
    const y = delta < 0 ? rubberband(delta, drag.height) : delta;
    panel.style.transform = `translateY(${y}px)`;
    scrim.style.opacity = String(1 - Math.max(0, y) / drag.height);
    drag.history.push({ y: event.clientY, t: event.timeStamp });
    if (drag.history.length > 6) drag.history.shift();
  });
  const endDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const { start, height, history } = drag;
    drag = null;
    const first = history[0];
    const last = history[history.length - 1];
    const elapsed = Math.max(1, last.t - first.t);
    const velocity = event.type === 'pointercancel' ? 0 : ((last.y - first.y) / elapsed) * 1000;
    const offset = Math.max(0, last.y - start);
    const dismiss = offset + project(velocity) > height * 0.4 && velocity >= -50;
    // Plus le geste est rapide, plus l'animation qui suit est courte : pas de cassure à la sortie du doigt.
    const remaining = dismiss ? height - offset : offset;
    const duration = Math.round(Math.min(320, Math.max(160, Math.abs(velocity) > 50 ? (remaining / Math.abs(velocity)) * 1800 : 300)));
    panel.style.setProperty('--sheet-dur', duration + 'ms');
    panel.classList.remove('is-dragging');
    panel.style.removeProperty('transform');
    scrim.style.removeProperty('transition');
    scrim.style.removeProperty('opacity');
    if (dismiss) sheet.close(duration);
    else setTimeout(() => panel.style.removeProperty('--sheet-dur'), duration + 20);
  };
  grab.addEventListener('pointerup', endDrag);
  grab.addEventListener('pointercancel', endDrag);
  return sheet;
}

/* ===== Panier : conservé d'une page à l'autre ===== */
const CART_KEY = 'sms-panier-v1';
const cartToggle = $('#cartToggle');
const cartCount = $('#cartCount');
const cartList = $('#cartList');
const cartEmpty = $('#cartEmpty');
const cartFoot = $('#cartFoot');
const cartDetails = $('#cartDetails');
const cartPromo = $('#cartPromo');
const cartSheet = createSheet($('#cartSheet'));
let cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    // Les prix viennent toujours de PRODUCT_OPTIONS, jamais de la sauvegarde.
    return saved.flatMap(item => {
      const option = (PRODUCT_OPTIONS[item.product] || []).find(([label]) => label === item.label);
      return option && item.quantity > 0 ? [{ product: item.product, label: option[0], price: option[1], quantity: item.quantity }] : [];
    });
  } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart.map(({ product, label, quantity }) => ({ product, label, quantity })))); } catch { /* Navigation privée : le panier reste valable sur cette page. */ }
}
const cartQuantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);
function cartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const eligible = HOLIDAY_PROMO_ACTIVE && cartQuantity() >= HOLIDAY_MIN_ITEMS;
  const discount = eligible ? subtotal * HOLIDAY_DISCOUNT_PERCENT / 100 : 0;
  return { subtotal, discount, total: subtotal - discount };
}
function bumpBadge() {
  if (reducedMotion.matches) return;
  cartCount.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: .35 }, { transform: 'scale(1)' }], { duration: 340, easing: 'cubic-bezier(.23,1,.32,1)' });
}
function renderCart() {
  const quantity = cartQuantity();
  cartCount.textContent = quantity;
  cartCount.dataset.empty = String(quantity === 0);
  cartToggle.setAttribute('aria-label', quantity ? `Ouvrir le panier, ${quantity} article${quantity > 1 ? 's' : ''}` : 'Ouvrir le panier, vide');
  cartEmpty.hidden = cart.length > 0;
  cartFoot.hidden = cart.length === 0;
  cartDetails.hidden = cart.length === 0;
  cartList.replaceChildren(...cart.map((item, index) => {
    const row = document.createElement('li');
    row.className = 'cart-item';
    row.dataset.index = index;
    row.innerHTML = `<div><strong></strong><small></small></div><div class="cart-item-price"></div>
      <div class="cart-controls">
        <button class="qty-btn" type="button" data-cart-action="minus" aria-label="Retirer un exemplaire">−</button>
        <span class="qty-value" aria-live="polite"></span>
        <button class="qty-btn" type="button" data-cart-action="plus" aria-label="Ajouter un exemplaire">+</button>
        <button class="cart-remove" type="button" data-cart-action="remove">Retirer</button>
      </div>`;
    $('strong', row).textContent = item.label;
    $('small', row).textContent = money(item.price) + " l'unité";
    $('.cart-item-price', row).textContent = money(item.price * item.quantity);
    $('.qty-value', row).textContent = item.quantity;
    return row;
  }));
  const { subtotal, discount, total } = cartTotals();
  $('#cartSubtotalRow').hidden = discount === 0;
  $('#cartDiscountRow').hidden = discount === 0;
  $('#cartSubtotal').textContent = money(subtotal);
  $('#cartDiscount').textContent = '−' + money(discount);
  $('#cartTotal').textContent = money(total);
  cartPromo.hidden = !HOLIDAY_PROMO_ACTIVE || cart.length === 0;
  if (HOLIDAY_PROMO_ACTIVE) {
    const missing = HOLIDAY_MIN_ITEMS - quantity;
    cartPromo.textContent = missing > 0
      ? `Ajoutez encore ${missing} article${missing > 1 ? 's' : ''} pour profiter de −${HOLIDAY_DISCOUNT_PERCENT} %.`
      : `Réduction de ${HOLIDAY_DISCOUNT_PERCENT} % appliquée.`;
  }
}
function addToCart(product, optionIndex, quantity = 1) {
  const option = (PRODUCT_OPTIONS[product] || [])[optionIndex];
  if (!option) return;
  const found = cart.find(item => item.label === option[0] && item.product === product);
  if (found) found.quantity += quantity;
  else cart.push({ product, label: option[0], price: option[1], quantity });
  saveCart();
  renderCart();
  bumpBadge();
  showToast('Ajouté au panier', { label: 'Voir le panier', run: () => cartSheet.open() });
}
function removeRow(index, row) {
  const [removed] = cart.splice(index, 1);
  const finish = () => {
    saveCart();
    renderCart();
    bumpBadge();
    showToast('Article retiré', {
      label: 'Annuler',
      run: () => { cart.splice(Math.min(index, cart.length), 0, removed); saveCart(); renderCart(); }
    });
    (($$('.cart-item')[index] || $$('.cart-item')[index - 1])?.querySelector('.cart-remove') || $('.sheet-close', cartSheet.dialog)).focus({ preventScroll: true });
  };
  if (reducedMotion.matches) return finish();
  row.style.pointerEvents = 'none';
  row.animate([{ opacity: 1, height: row.offsetHeight + 'px' }, { opacity: 0, height: '0px', paddingBlock: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
  setTimeout(finish, 180); // Le panier est mis à jour même si l'animation est suspendue.
}
cartToggle.addEventListener('click', () => cartSheet.open());
cartList.addEventListener('click', event => {
  const button = event.target.closest('[data-cart-action]');
  if (!button) return;
  const row = button.closest('.cart-item');
  const index = Number(row.dataset.index);
  const item = cart[index];
  const action = button.dataset.cartAction;
  if (action === 'remove' || (action === 'minus' && item.quantity === 1)) return removeRow(index, row);
  item.quantity += action === 'plus' ? 1 : -1;
  saveCart();
  renderCart();
  bumpBadge();
  $(`.cart-item[data-index="${index}"] [data-cart-action="${action}"]`).focus({ preventScroll: true });
});
$('#cartClear').addEventListener('click', () => {
  const previous = cart;
  cart = [];
  saveCart();
  renderCart();
  showToast('Panier vidé', { label: 'Annuler', run: () => { cart = previous; saveCart(); renderCart(); } });
});
window.addEventListener('storage', event => {
  if (event.key === CART_KEY) { cart = loadCart(); renderCart(); }
});

const formatDate = value => value ? new Date(value + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
function buildCartMessage() {
  const { subtotal, discount, total } = cartTotals();
  const lines = ['Bonjour SMS Makers ! Je souhaite commander :', ...cart.map(item => `- ${item.label} × ${item.quantity} = ${money(item.price * item.quantity)}`)];
  const occasion = $('#cartOccasion').value;
  const date = formatDate($('#cartDate').value);
  if (occasion) lines.push(`Occasion : ${occasion}`);
  if (date) lines.push(`Date de l'événement : ${date}`);
  if (discount) lines.push(`Sous-total : ${money(subtotal)}`, `Réduction Noël et Nouvel An : −${money(discount)}`);
  lines.push(`Total hors livraison : ${money(total)}`, 'Merci de confirmer les délais et les frais de livraison selon mon adresse.');
  return lines.join('\n');
}
// Petite pluie dorée : réservée au moment où la commande part, jamais ailleurs.
function celebrate(origin) {
  if (reducedMotion.matches) return;
  const box = origin.getBoundingClientRect();
  const host = activeSheet ? activeSheet.dialog : document.body;
  const colors = ['#d7a65e', '#f3dcb4', '#a83a61', '#74142f'];
  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('span');
    const angle = -Math.PI * (0.1 + 0.8 * Math.random());
    const distance = 70 + Math.random() * 110;
    dot.style.cssText = `position:fixed;z-index:95;pointer-events:none;width:7px;height:${5 + Math.random() * 6}px;left:${box.left + box.width * Math.random()}px;top:${box.top + box.height / 2}px;background:${colors[i % 4]};border-radius:1px;`;
    host.append(dot);
    dot.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .65 },
      { transform: `translate(${Math.cos(angle) * distance * 1.1}px, ${Math.sin(angle) * distance * .8 + 40}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }
    ], { duration: 780 + Math.random() * 240, easing: 'cubic-bezier(.23,1,.32,1)' }).onfinish = () => dot.remove();
  }
}
$('#cartWhatsApp').addEventListener('click', event => {
  if (!cart.length) return;
  window.open(whatsappUrl(buildCartMessage()), '_blank', 'noopener,noreferrer');
  celebrate(event.currentTarget);
  showToast('Votre commande est prête dans WhatsApp. Vérifiez-la, puis envoyez-la.');
});

/* ===== Choix du format ===== */
const productSheet = createSheet($('#productSheet'));
const choiceOptions = $('#choiceOptions');
const choiceAdd = $('#choiceAdd');
const choiceQty = $('#choiceQty');
let choice = { product: '', option: 0, quantity: 1 };

function updateChoice() {
  const option = PRODUCT_OPTIONS[choice.product][choice.option];
  choiceQty.textContent = choice.quantity;
  $('#choiceAddLabel').textContent = `Ajouter pour ${money(option[1] * choice.quantity)}`;
}
function openProduct(card) {
  const product = card.dataset.product;
  choice = { product, option: 0, quantity: 1 };
  $('#choiceTitle').textContent = $('h3', card).textContent;
  $('#choiceDesc').textContent = $('.product-info p', card).textContent;
  const art = $('.product-art', card);
  const target = $('#choiceArt');
  target.replaceChildren(...[...art.children].map(node => node.cloneNode(true)));
  target.style.background = getComputedStyle(art).backgroundColor;
  $$('.choice', choiceOptions).forEach(node => node.remove());
  PRODUCT_OPTIONS[product].forEach(([label, price], index) => {
    const row = document.createElement('label');
    row.className = 'choice';
    row.innerHTML = `<input type="radio" name="choiceOption" value="${index}" ${index === 0 ? 'checked' : ''}><span></span><strong></strong>`;
    $('span', row).textContent = label;
    $('strong', row).textContent = money(price);
    choiceOptions.append(row);
  });
  $('#choiceCustom').href = 'commander.html?produit=' + encodeURIComponent(product);
  updateChoice();
  productSheet.open();
  $('.sheet-body', productSheet.dialog).scrollTop = 0;
}
choiceOptions.addEventListener('change', event => { choice.option = Number(event.target.value); updateChoice(); });
$('#choiceMinus').addEventListener('click', () => { choice.quantity = Math.max(1, choice.quantity - 1); updateChoice(); });
$('#choicePlus').addEventListener('click', () => { choice.quantity += 1; updateChoice(); });
choiceAdd.addEventListener('click', () => {
  productSheet.close();
  addToCart(choice.product, choice.option, choice.quantity);
});

document.addEventListener('click', event => {
  const add = event.target.closest('[data-add-product]');
  if (add) return addToCart(add.dataset.addProduct, Number(add.dataset.option));
  const opener = event.target.closest('[data-open-product], .product-art');
  if (opener && opener.closest('.product-card')) openProduct(opener.closest('.product-card'));
});

/* ===== En-tête, menu mobile et recherche ===== */
const header = $('.site-header');
const announcement = $('.announcement');
if (announcement) new IntersectionObserver(([entry]) => header.classList.toggle('is-stuck', !entry.isIntersecting)).observe(announcement);

const menuToggle = $('#menuToggle');
const navLinks = $('#navLinks');
const searchToggle = $('#searchToggle');
const searchPanel = $('#searchPanel');
const searchInput = $('#siteSearch');
const searchResults = $('#searchResults');
const searchEmpty = $('#searchEmpty');
const productCards = $$('.product-card');
const isCatalogPage = !!$('#filters');

function setMenu(open) {
  navLinks.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
}
function setSearch(open) {
  searchPanel.classList.toggle('is-open', open);
  searchToggle.setAttribute('aria-expanded', String(open));
  searchToggle.setAttribute('aria-label', open ? 'Fermer la recherche' : 'Ouvrir la recherche');
  if (open) searchInput.focus();
}
menuToggle.addEventListener('click', () => { setSearch(false); setMenu(!navLinks.classList.contains('is-open')); });
searchToggle.addEventListener('click', () => { setMenu(false); setSearch(!searchPanel.classList.contains('is-open')); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || activeSheet) return;
  if (searchPanel.classList.contains('is-open')) { setSearch(false); searchToggle.focus(); }
  if (navLinks.classList.contains('is-open')) { setMenu(false); menuToggle.focus(); }
});
document.addEventListener('pointerdown', event => {
  if (header.contains(event.target)) return;
  setMenu(false);
  if (!isCatalogPage || !searchInput.value) setSearch(false);
});

function renderSuggestions() {
  const query = normalize(searchInput.value.trim());
  const matches = query ? CATALOG.filter(item => normalize(item.name + ' ' + item.words).includes(query)) : [];
  searchResults.replaceChildren(...matches.map(item => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    const from = Math.min(...PRODUCT_OPTIONS[item.product].map(option => option[1]));
    link.href = 'creations.html?categorie=' + item.category;
    link.textContent = item.name;
    const price = document.createElement('span');
    price.textContent = 'dès ' + money(from);
    link.append(price);
    li.append(link);
    return li;
  }));
  searchEmpty.hidden = !query || matches.length > 0;
}
searchInput.addEventListener('input', () => {
  if (isCatalogPage) { filterState.query = searchInput.value; applyFilters(); } // Saisie au clavier : pas d'animation.
  else renderSuggestions();
});
$('#searchForm').addEventListener('submit', event => {
  if (!isCatalogPage) return; // Sur les autres pages, le formulaire ouvre creations.html?q=…
  event.preventDefault();
  setSearch(false);
});

/* ===== Catalogue : catégories, occasions et recherche ===== */
const filterState = { category: 'all', occasion: '', query: '' };
let runningTransition = null;

function matchCard(card) {
  const category = filterState.category === 'all' || card.dataset.category === filterState.category;
  const occasion = !filterState.occasion || (card.dataset.occasions || '').split(' ').includes(filterState.occasion);
  const query = normalize(filterState.query.trim());
  return category && occasion && (!query || normalize(`${card.dataset.search} ${card.dataset.occasions} ${card.textContent}`).includes(query));
}
function updateCatalog() {
  let visible = 0;
  productCards.forEach(card => {
    const show = matchCard(card);
    card.hidden = !show;
    if (show) visible++;
  });
  $('#resultCount').textContent = visible ? `${visible} création${visible > 1 ? 's' : ''}` : 'Aucune création';
  $('#noResults').hidden = visible > 0;
  const tag = $('#occasionTag');
  tag.hidden = !filterState.occasion;
  if (filterState.occasion) $('#occasionLabel').textContent = OCCASIONS[filterState.occasion];
  $$('#filters .chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filter === filterState.category)));
}
function applyFilters(animate = false) {
  if (!animate || !document.startViewTransition || reducedMotion.matches) return updateCatalog();
  runningTransition?.skipTransition();
  productCards.forEach((card, index) => { card.style.viewTransitionName = `card-${index}`; });
  document.documentElement.classList.add('is-filtering');
  const transition = document.startViewTransition(updateCatalog);
  runningTransition = transition;
  transition.ready.catch(() => {}); // Une transition interrompue n'est pas une erreur.
  transition.finished.catch(() => {}).finally(() => {
    if (runningTransition !== transition) return;
    runningTransition = null;
    productCards.forEach(card => { card.style.viewTransitionName = ''; });
    document.documentElement.classList.remove('is-filtering');
  });
}
function syncUrl() {
  const url = new URL(location.href);
  [['categorie', filterState.category === 'all' ? '' : filterState.category], ['occasion', filterState.occasion]].forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  });
  history.replaceState(null, '', url);
}
if (isCatalogPage) {
  const category = params.get('categorie');
  if ($(`#filters [data-filter="${CSS.escape(category || '')}"]`)) filterState.category = category;
  if (OCCASIONS[params.get('occasion')]) filterState.occasion = params.get('occasion');
  filterState.query = params.get('q') || '';
  searchInput.value = filterState.query;
  updateCatalog();
  $('#filters').addEventListener('click', event => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    filterState.category = chip.dataset.filter;
    chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    syncUrl();
    applyFilters(true);
  });
  $('#occasionClear').addEventListener('click', () => { filterState.occasion = ''; syncUrl(); applyFilters(true); });
  $('#resetFilters').addEventListener('click', () => {
    Object.assign(filterState, { category: 'all', occasion: '', query: '' });
    searchInput.value = '';
    syncUrl();
    applyFilters(true);
  });
}

/* ===== Tarifs : digital, imprimé ou tout ===== */
const segmented = $('#segmented');
if (segmented) {
  const buttons = $$('button', segmented);
  const thumb = $('.segmented-thumb', segmented);
  const grid = $('#priceGrid');
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    const view = button.dataset.view;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    thumb.style.transform = `translateX(${index * 100}%)`;
    grid.dataset.view = view;
    $$('[data-panel]', grid).forEach(panel => { panel.hidden = view !== 'all' && panel.dataset.panel !== view; });
  }));
}

/* ===== Formulaire de commande ===== */
const orderForm = $('#orderForm');
if (orderForm) {
  const productField = $('#productChoice');
  const requested = params.get('produit');
  if (requested && [...productField.options].some(option => option.value === requested)) productField.value = requested;

  const messages = { customerName: 'Indiquez votre nom pour que nous sachions à qui répondre.', productChoice: 'Choisissez une création, ou « Autre projet ».' };
  const showError = (field, message) => {
    const error = $(`#${field.id}Error`);
    field.setAttribute('aria-invalid', String(!!message));
    if (message) field.setAttribute('aria-describedby', error.id); else field.removeAttribute('aria-describedby');
    error.textContent = message;
    error.hidden = !message;
  };
  const check = field => { const message = field.value.trim() ? '' : messages[field.id]; showError(field, message); return !message; };
  const required = [$('#customerName'), productField];
  required.forEach(field => {
    field.addEventListener('blur', () => { if (field.getAttribute('aria-invalid') === 'true' || field.value) check(field); });
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') check(field); });
  });

  const swapLabel = (label, text) => {
    label.classList.add('is-changing');
    setTimeout(() => { label.textContent = text; label.classList.remove('is-changing'); }, 140);
  };
  let labelTimer;
  orderForm.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = required.filter(field => !check(field));
    if (invalid.length) return invalid[0].focus();
    const data = new FormData(orderForm);
    const date = formatDate(data.get('date'));
    const message = [
      'Bonjour SMS ! Je souhaite demander une création personnalisée.',
      `Nom : ${data.get('name')}`,
      `Contact : ${data.get('contact') || 'Non précisé'}`,
      `Création : ${data.get('product')}`,
      data.get('occasion') && `Occasion : ${data.get('occasion')}`,
      date && `Date de l'événement : ${date}`,
      `Mon idée : ${data.get('details') || 'À discuter ensemble'}`
    ].filter(Boolean).join('\n');
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
    const button = $('button[type="submit"]', orderForm);
    const note = $('#formNote');
    note.textContent = 'Votre demande est prête dans WhatsApp. Vérifiez-la, puis envoyez-la avec vos photos.';
    note.classList.add('is-success');
    celebrate(button);
    const label = $('.btn-label', button);
    swapLabel(label, 'Demande préparée');
    clearTimeout(labelTimer);
    labelTimer = setTimeout(() => swapLabel(label, 'Préparer ma demande WhatsApp'), 3000);
  });
}

/* ===== Hero : les créations suivent légèrement le pointeur, avec un ressort ===== */
const hero = $('.hero');
const stage = $('.stage');
if (hero && stage && matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  const layers = $$('[data-depth]', stage).map(el => ({ el, depth: Number(el.dataset.depth) }));
  const spring = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  let frame = 0;
  let last = 0;
  const step = time => {
    const dt = Math.min(0.032, (time - last) / 1000 || 0.016);
    last = time;
    ['x', 'y'].forEach(axis => {
      const velocity = 'v' + axis;
      spring[velocity] += (120 * (spring['t' + axis] - spring[axis]) - 18 * spring[velocity]) * dt;
      spring[axis] += spring[velocity] * dt;
    });
    layers.forEach(({ el, depth }) => { el.style.translate = `${(spring.x * depth).toFixed(2)}px ${(spring.y * depth).toFixed(2)}px`; });
    const moving = Math.abs(spring.tx - spring.x) + Math.abs(spring.ty - spring.y) + Math.abs(spring.vx) + Math.abs(spring.vy) > 0.01;
    frame = moving ? requestAnimationFrame(step) : 0;
  };
  const wake = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); } };
  hero.addEventListener('pointermove', event => {
    const box = hero.getBoundingClientRect();
    spring.tx = (event.clientX - box.left) / box.width - 0.5;
    spring.ty = (event.clientY - box.top) / box.height - 0.5;
    wake();
  });
  hero.addEventListener('pointerleave', () => { spring.tx = 0; spring.ty = 0; wake(); });
}

renderCart();
