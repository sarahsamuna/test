
/* ===================== PARAMÈTRES À MODIFIER =====================
   1. Remplace le numéro ci-dessous par ton numéro WhatsApp international,
      sans espaces, sans + et sans le premier zéro local.
      Exemple indicatif RDC : 243XXXXXXXXX
   2. Tu peux modifier les noms, descriptions et catégories dans les cartes HTML.
   3. Pour changer les couleurs, modifie les variables dans :root au début du CSS.
   4. Modifie HOLIDAY_PROMO_ACTIVE à false hors campagne de Noël / Nouvel An.
================================================================== */
const WHATSAPP_NUMBER = "243981812631"; // SMS — numéro international sans + ni espaces
const INSTAGRAM_URL = "https://www.instagram.com/sms_makers/";
const TIKTOK_URL = "https://www.tiktok.com/@sms_makers";
// Activer uniquement pendant la campagne Noël & Nouvel An.
const HOLIDAY_PROMO_ACTIVE = false; // Passer à true au début de la campagne, puis remettre false après les fêtes.
const HOLIDAY_DISCOUNT_PERCENT = 20;
const HOLIDAY_MIN_ITEMS = 3;
const holidayBanner = document.querySelector('.holiday-promo');
if (holidayBanner) holidayBanner.hidden = !HOLIDAY_PROMO_ACTIVE;

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const searchToggle = document.getElementById('searchToggle');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('siteSearch');
const productCards = [...document.querySelectorAll('.product-card')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
let activeFilter = 'all';

menuToggle?.addEventListener('click', () => {
  const opened = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(opened));
  menuToggle.textContent = opened ? '×' : '☰';
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.textContent = '☰';
}));
searchToggle?.addEventListener('click', () => {
  searchPanel.classList.toggle('open');
  if (searchPanel.classList.contains('open')) searchInput.focus();
});
function filterProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase('fr');
  let visible = 0;
  productCards.forEach(card => {
    const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
    const searchable = (card.dataset.search + ' ' + card.innerText).toLocaleLowerCase('fr');
    const queryMatch = !query || searchable.includes(query);
    const show = categoryMatch && queryMatch;
    card.hidden = !show;
    if (show) visible++;
  });
  document.getElementById('noResults')?.classList.toggle('show', visible === 0);
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  activeFilter = button.dataset.filter;
  filterProducts();
}));
searchInput.addEventListener('input', filterProducts);
document.querySelectorAll('.order-link').forEach(link => link.addEventListener('click', () => {
  const choice = document.getElementById("productChoice"); if (choice) choice.value = link.dataset.product;
}));
document.getElementById('orderForm')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const message = `Bonjour SMS ! Je souhaite demander une création personnalisée.\nNom : ${data.get('name')}\nContact : ${data.get('contact') || 'Non précisé'}\nCréation : ${data.get('product')}\nMon idée : ${data.get('details') || 'À discuter ensemble'}`;
  const note = document.getElementById('formNote');
  if (WHATSAPP_NUMBER.trim()) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    note.textContent = 'Votre demande WhatsApp est prête. Vérifiez le message avant de l’envoyer.';
  } else {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        note.textContent = 'Votre demande a été copiée. Ajoutez votre numéro WhatsApp dans WHATSAPP_NUMBER pour activer l’envoi direct.';
      }).catch(() => { note.textContent = message; });
    } else {
      note.textContent = message;
    }
  }
});

// ===== LIENS DE CONTACT ET PANIER =====
function setSocialLink(id, url) {
  const element = document.getElementById(id);
  if (!element) return;
  if (url && url.trim()) {
    element.href = url;
    element.style.display = '';
  } else {
    element.href = '#contact';
    element.addEventListener('click', event => {
      event.preventDefault();
      alert('Ajoutez votre lien de profil dans INSTAGRAM_URL ou TIKTOK_URL, en haut du JavaScript.');
    });
  }
}
['instagramLink','cartInstagram','footerInstagram'].forEach(id => setSocialLink(id, INSTAGRAM_URL));
['tiktokLink','cartTikTok','footerTikTok'].forEach(id => setSocialLink(id, TIKTOK_URL));
const waHref = WHATSAPP_NUMBER.trim() ? `https://wa.me/${WHATSAPP_NUMBER}` : '';
const waLink = document.getElementById('whatsappLink');
if (waLink) {
  waLink.href = waHref || '#contact';
  waLink.addEventListener('click', event => {
    if (!waHref) { event.preventDefault(); alert('Ajoutez votre numéro dans WHATSAPP_NUMBER pour activer WhatsApp.'); }
  });
}
const PRODUCT_OPTIONS = {
 'Magazine personnalisé': [
  ['Magazine numérique · 14 pages · sans QR',10],['Magazine numérique · 14 pages · avec QR',15],
  ['Magazine imprimé · 16 pages · sans QR',12],['Magazine imprimé · 16 pages · avec QR',15]],
 'Journal surprise': [['Journal surprise numérique',5],['Journal surprise imprimé',8]],
 'Cadre personnalisé': [['Cadre photo A5',10.60],['Cadre photo A4',14],['Cadre photo A3',17]],
 'Mini-album complet': [['Mini-album complet imprimé',10]],
 'Carte postale ou carte de vœux': [['Carte de vœux digitale',5],['Carte postale digitale',7],['Carte de vœux imprimée',5],['Carte postale imprimée',7]],
 'QR code imprimable': [['QR code numérique simple',7],['QR code numérique avec design personnalisé',10],['QR code imprimable',8]],
 'Invitation électronique': [['Invitation électronique simple',5],['Invitation électronique animée',8]]
};
// Ajouter un sélecteur de format/prix à chaque fiche produit.
document.querySelectorAll('[data-add-product]').forEach(button => {
 const name=button.dataset.addProduct, options=PRODUCT_OPTIONS[name]||[];
 if(!options.length) return;
 const select=document.createElement('select'); select.className='product-variant'; select.setAttribute('aria-label','Choisir le format et le tarif');
 options.forEach((opt,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=opt[0]+' — '+opt[1].toLocaleString('fr-FR',{minimumFractionDigits:opt[1]%1?2:0})+' $';select.appendChild(o);});
 button.parentNode.insertBefore(select,button);
});
const cart=[];
const cartToggle=document.getElementById('cartToggle');
const cartDrawer=document.getElementById('cartDrawer');
const cartOverlay=document.getElementById('cartOverlay');
const cartCount=document.getElementById('cartCount');
const cartItems=document.getElementById('cartItems');
const cartSummary=document.getElementById('cartSummary');
function openCart(){cartDrawer.classList.add('open');cartOverlay.classList.add('open');cartDrawer.setAttribute('aria-hidden','false');}
function closeCart(){cartDrawer.classList.remove('open');cartOverlay.classList.remove('open');cartDrawer.setAttribute('aria-hidden','true');}
cartToggle.addEventListener('click',openCart);
document.getElementById('cartClose').addEventListener('click',closeCart);
cartOverlay.addEventListener('click',closeCart);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCart();});
function cartItemCount(){return cart.reduce((sum,item)=>sum+item.quantity,0);}
function isHolidayDiscountEligible(){return HOLIDAY_PROMO_ACTIVE&&cartItemCount()>=HOLIDAY_MIN_ITEMS;}
function money(value){return value.toLocaleString('fr-FR',{minimumFractionDigits:value%1?2:0,maximumFractionDigits:2})+' $';}
function renderCart(){
 const count=cartItemCount();cartCount.textContent=count;cartItems.innerHTML='';cartSummary.hidden=cart.length===0;
 if(!cart.length){cartItems.innerHTML='<div class="cart-empty">Votre panier est vide pour le moment.<br>Ajoutez les créations qui vous intéressent.</div>';return;}
 cart.forEach((item,index)=>{
  const row=document.createElement('div');row.className='cart-item';
  const info=document.createElement('div');const title=document.createElement('strong');title.textContent=item.name;const detail=document.createElement('small');detail.textContent=money(item.price)+' / article';
  const controls=document.createElement('div');controls.className='cart-controls';
  [['−','minus','Diminuer'],['+','plus','Augmenter'],['Retirer','remove','Retirer']].forEach(([label,action,aria])=>{const btn=document.createElement('button');btn.type='button';btn.dataset.cartAction=action;btn.dataset.index=index;btn.textContent=label;btn.setAttribute('aria-label',aria);if(action==='remove')btn.className='cart-remove';controls.appendChild(btn);});
  info.append(title,detail,controls);const price=document.createElement('div');price.className='cart-item-price';price.textContent=money(item.price*item.quantity);row.append(info,price);cartItems.appendChild(row);
 });
 const subtotal=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);const discount=isHolidayDiscountEligible()?subtotal*HOLIDAY_DISCOUNT_PERCENT/100:0;const total=subtotal-discount;
 document.getElementById('promoStatus').innerHTML=HOLIDAY_PROMO_ACTIVE?(isHolidayDiscountEligible()?'<strong>Réduction de 20 % appliquée !</strong>':'<strong>Offre Noël & Nouvel An : −20 %</strong>Ajoutez encore '+(HOLIDAY_MIN_ITEMS-count)+' article(s) pour bénéficier de la réduction.'):'<strong>Promotion saisonnière désactivée</strong>La réduction de 20 % s’applique uniquement pendant la campagne de Noël & Nouvel An, dès 3 articles.';
 const summary=document.querySelector('#cartSummary > p');summary.textContent='Sous-total : '+money(subtotal)+' · Réduction : −'+money(discount)+' · Total hors livraison : '+money(total)+'. Les frais de livraison sont calculés séparément selon votre lieu.';
}
document.addEventListener('click',event=>{
 const add=event.target.closest('[data-add-product]');
 if(add){const name=add.dataset.addProduct;const select=add.parentNode.querySelector('.product-variant');const option=(PRODUCT_OPTIONS[name]||[])[Number(select?.value||0)];if(!option)return;const key=name+'|'+option[0];const found=cart.find(item=>item.key===key);if(found)found.quantity++;else cart.push({key,name:option[0],price:option[1],quantity:1});renderCart();openCart();return;}
 const action=event.target.closest('[data-cart-action]');if(!action)return;const item=cart[Number(action.dataset.index)];if(!item)return;
 if(action.dataset.cartAction==='plus')item.quantity++;if(action.dataset.cartAction==='minus')item.quantity--;if(action.dataset.cartAction==='remove'||item.quantity<=0)cart.splice(Number(action.dataset.index),1);renderCart();
});
function buildCartMessage(){
 const subtotal=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);const discount=isHolidayDiscountEligible()?subtotal*HOLIDAY_DISCOUNT_PERCENT/100:0;
 const lines=cart.map(item=>'- '+item.name+' × '+item.quantity+' = '+money(item.price*item.quantity));
 return 'Bonjour SMS Makers ! Je souhaite commander :\n'+lines.join('\n')+'\nSous-total : '+money(subtotal)+'\nRéduction Noël & Nouvel An : −'+money(discount)+'\nTotal hors livraison : '+money(subtotal-discount)+'\nMerci de confirmer les délais et les frais de livraison selon mon adresse.';
}
document.getElementById('cartWhatsApp').addEventListener('click',()=>{
 if(!cart.length)return;const message=buildCartMessage();window.open('https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
});
document.getElementById('year').textContent = new Date().getFullYear();

