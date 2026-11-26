(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return '$' + (n % 1 ? n.toFixed(2) : n.toFixed(0)); };
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ===== CONFIGURA AQUÍ =====
     WHATSAPP: tu número con código de país, sin signos (ej. '50370001234').
     Archivos junto a index.html: hero-pc.mp4, hero.mp4, foto1.jpg..foto3.jpg,
     jabon1.jpg..jabon6.jpg (y opcional jabon1-2.jpg, jabon1-3.jpg para más fotos). */
  var WHATSAPP = '';
  var products = [
    { id: 'lavanda', name: 'Lavender & oat', price: 4.5, color: '#c9b8ec', cat: 'body', isNew: false, desc: 'Gentle cold-process bar with oats and lavender.' },
    { id: 'naranja', name: 'Orange & honey', price: 4.5, color: '#f2c96a', cat: 'body', isNew: true, desc: 'Bright citrus scent with a touch of honey.' },
    { id: 'carbon', name: 'Charcoal & mint', price: 5, color: '#9aa8a2', cat: 'face', isNew: false, desc: 'Deep-cleansing bar with activated charcoal.' },
    { id: 'rosa', name: 'Rose & clay', price: 5, color: '#f0b9b0', cat: 'face', isNew: true, desc: 'Soft rose clay for sensitive skin.' },
    { id: 'cafe', name: 'Coffee & cinnamon', price: 4.75, color: '#b58f73', cat: 'body', isNew: false, desc: 'Exfoliating bar with ground coffee.' },
    { id: 'sabila', name: 'Aloe & cucumber', price: 4.5, color: '#b8d8c3', cat: 'face', isNew: false, desc: 'Fresh and hydrating, made with aloe vera.' },
    { id: 'set3', name: 'Trio gift set', price: 12, color: '#d9c7ee', cat: 'sets', isNew: false, desc: 'Three of our favorite bars in a gift box.' }
  ];
  products.forEach(function (p, i) { p.order = i; p.imgs = []; });
  var TITLES = { all: 'All Soaps', 'new': 'New Arrivals', face: 'Face Soaps', body: 'Body Soaps', sets: 'Gift Sets' };
  var IMG_STYLE = 'width:100%;height:100%;object-fit:cover;display:block';

  function probe(src) { return new Promise(function (r) { var i = new Image(); i.onload = function () { r(src); }; i.onerror = function () { r(null); }; i.src = src; }); }
  function inner(p, i) {
    return p.imgs.length ? '<img src="' + esc(p.imgs[i || 0]) + '" alt="' + esc(p.name) + '" style="' + IMG_STYLE + '">'
      : '<div class="bar" style="--c:' + esc(p.color) + '" role="img" aria-label="' + esc(p.name) + '"></div>';
  }
  function find(id) { return products.filter(function (p) { return p.id === id; })[0]; }

  /* ---------- Hero video ---------- */
  var heroBox = $('#heroBox'), hv = $('#heroVideo');
  hv.addEventListener('playing', function () { heroBox.classList.add('has-video'); });
  hv.addEventListener('error', function () { heroBox.classList.remove('has-video'); });
  hv.src = window.matchMedia('(max-width:960px)').matches ? 'hero.mp4' : 'hero-pc.mp4';
  var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {});

  /* ---------- Photo slideshow ---------- */
  var items = $$('#photoShow .show-item'), cur = 0, timer;
  items.forEach(function (it, i) {
    probe('foto' + (i + 1) + '.jpg').then(function (src) {
      if (!src) return;
      var img = new Image(); img.src = src; img.alt = ''; img.className = 'show-img';
      var b = $('.bar', it); if (b) b.remove(); it.appendChild(img);
    });
  });
  function goShow(n) { items[cur].classList.remove('is-on'); cur = (n + items.length) % items.length; items[cur].classList.add('is-on'); }
  function restart() { clearInterval(timer); timer = setInterval(function () { goShow(cur + 1); }, 4500); }
  $('.show-prev').addEventListener('click', function () { goShow(cur - 1); restart(); });
  $('.show-next').addEventListener('click', function () { goShow(cur + 1); restart(); });
  restart();

  /* ---------- Cart ---------- */
  var cart = LS.get('sabila_cart', []);
  function count() { return cart.reduce(function (s, x) { return s + x.qty; }, 0); }
  function total() { return cart.reduce(function (s, x) { var p = find(x.id); return s + (p ? p.price * x.qty : 0); }, 0); }
  function save() {
    LS.set('sabila_cart', cart);
    var c = $('#cartCount'); c.textContent = count(); c.hidden = !count();
  }
  function addToCart(id) {
    var f = cart.filter(function (x) { return x.id === id; })[0];
    if (f) f.qty++; else cart.push({ id: id, qty: 1 });
    save();
  }
  function renderCart() {
    var box = $('#cart');
    cart = cart.filter(function (x) { return find(x.id); });
    if (!cart.length) {
      box.className = 'cart';
      box.innerHTML = '<h1>Your cart</h1><p>Your cart is empty.</p><a class="btn" href="#/shop/all">Continue shopping</a>';
      return;
    }
    box.className = 'cart has-items';
    box.innerHTML = '<div class="cart-full"><h1>Your cart</h1><ul class="cart-list">' + cart.map(function (x) {
      var p = find(x.id);
      return '<li class="cart-row" data-id="' + esc(p.id) + '"><a class="cart-thumb" href="#/product/' + esc(p.id) + '">' + inner(p) + '</a>' +
        '<div class="cart-info"><a href="#/product/' + esc(p.id) + '">' + esc(p.name) + '</a><small>' + money(p.price) + '</small></div>' +
        '<div class="qty"><button type="button" data-a="dec" aria-label="Less">−</button><span>' + x.qty + '</span><button type="button" data-a="inc" aria-label="More">+</button></div>' +
        '<span class="cart-price">' + money(p.price * x.qty) + '</span><button type="button" class="cart-del" data-a="del" aria-label="Remove">✕</button></li>';
    }).join('') + '</ul><div class="cart-total"><b>Total</b><b>' + money(total()) + '</b></div>' +
      (count() >= 3 ? '<p class="form-msg">Free shipping applied 🎉</p>' : '<p class="form-msg">Add ' + (3 - count()) + ' more for free shipping.</p>') +
      '<div class="cart-actions"><a class="link" href="#/shop/all">Continue shopping</a><button class="btn" type="button" data-a="pay">Order via WhatsApp</button></div>' +
      '<p class="form-msg" id="cartMsg" role="status" aria-live="polite"></p></div>';
  }
  $('#cart').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'pay') {
      if (!WHATSAPP) { $('#cartMsg').textContent = 'Set your WhatsApp number in script.js (WHATSAPP variable).'; return; }
      var txt = 'Hello, I would like to order:\n' + cart.map(function (x) { var p = find(x.id); return '- ' + x.qty + ' x ' + p.name + ' (' + money(p.price * x.qty) + ')'; }).join('\n') + '\nTotal: ' + money(total());
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      return;
    }
    var row = b.closest('.cart-row'); if (!row) return;
    var it = cart.filter(function (x) { return x.id === row.dataset.id; })[0];
    if (a === 'inc') it.qty++; else if (a === 'dec') it.qty = Math.max(1, it.qty - 1); else cart.splice(cart.indexOf(it), 1);
    save(); renderCart();
  });

  /* ---------- Listing ---------- */
  var filter = 'all';
  function renderList() {
    $('#listTitle').textContent = TITLES[filter] || 'All Soaps';
    var list = products.filter(function (p) { return filter === 'all' || (filter === 'new' ? p.isNew : p.cat === filter); });
    var s = $('#sort').value;
    if (s === 'newest') list.sort(function (a, b) { return (b.isNew - a.isNew) || (b.order - a.order); });
    else if (s === 'low') list.sort(function (a, b) { return a.price - b.price; });
    else if (s === 'high') list.sort(function (a, b) { return b.price - a.price; });
    $('#grid').innerHTML = list.map(function (p) {
      return '<a class="card" href="#/product/' + esc(p.id) + '"><div class="card-img"><div class="slide is-on">' + inner(p) + '</div></div>' +
        '<span class="card-name">' + esc(p.name) + '</span><span class="card-price">' + money(p.price) + '</span></a>';
    }).join('');
    $('#empty').hidden = list.length > 0;
  }
  $('#sort').addEventListener('change', renderList);

  /* ---------- Product page ---------- */
  var gi = 0, cp = null;
  function renderProduct(id) {
    var p = cp = find(id), box = $('#productView');
    if (!p) { box.innerHTML = '<p class="empty">Product not found. <a href="#/shop/all">Back to shop</a></p>'; return; }
    gi = 0;
    var n = Math.max(1, p.imgs.length), many = p.imgs.length > 1, slides = '', thumbs = '';
    for (var i = 0; i < n; i++) {
      slides += '<div class="gslide' + (i === 0 ? ' is-on' : '') + '">' + inner(p, i) + '</div>';
      thumbs += '<button type="button" class="thumb' + (i === 0 ? ' is-cur' : '') + '" data-a="thumb" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '">' + inner(p, i) + '</button>';
    }
    box.innerHTML = '<div class="crumbs"><a href="#/">Home</a> / <a href="#/shop/all">All soaps</a> / <span class="cur">' + esc(p.name) + '</span></div>' +
      '<div class="pgrid"><div><div class="gal-stage">' + slides +
      (many ? '<button type="button" class="gal-arrow gal-p" data-a="prev" aria-label="Previous">&#8249;</button><button type="button" class="gal-arrow gal-n" data-a="next" aria-label="Next">&#8250;</button>' : '') +
      '</div>' + (many ? '<div class="thumbs">' + thumbs + '</div>' : '') + '</div>' +
      '<div><h1 class="ptitle">' + esc(p.name) + '</h1><p class="pprice">' + money(p.price) + '</p>' +
      '<button type="button" class="atc" data-a="add">Add to cart</button><p class="pdesc">' + esc(p.desc) + '</p></div></div>';
  }
  function gallery(n) {
    var s = $$('#productView .gslide'), t = $$('#productView .thumb');
    gi = (n + s.length) % s.length;
    s.forEach(function (x, i) { x.classList.toggle('is-on', i === gi); });
    t.forEach(function (x, i) { x.classList.toggle('is-cur', i === gi); });
  }
  $('#productView').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b || !cp) return;
    var a = b.dataset.a;
    if (a === 'prev') gallery(gi - 1);
    else if (a === 'next') gallery(gi + 1);
    else if (a === 'thumb') gallery(+b.dataset.i);
    else if (a === 'add') {
      addToCart(cp.id); b.textContent = 'Added ✓';
      setTimeout(function () { b.textContent = 'Add to cart'; }, 1200);
    }
  });

  /* ---------- Forms ---------- */
  var okEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  $('#regForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = $('#rFirst').value.trim(), l = $('#rLast').value.trim(), em = $('#rEmail').value.trim(), pw = $('#rPass').value, m = $('#regMsg');
    if (!f || !l) { m.textContent = 'Please enter your first and last name.'; return; }
    if (!okEmail(em)) { m.textContent = 'Please enter a valid email.'; return; }
    if (pw.length < 6) { m.textContent = 'Password must be at least 6 characters.'; return; }
    LS.set('sabila_user', { first: f, last: l, email: em });
    m.textContent = 'Welcome, ' + f + '! Your account was created.';
    this.reset();
  });
  $('#newsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('#nEmail').value.trim(), m = $('#newsMsg');
    if (!okEmail(v)) { m.textContent = 'Please enter a valid email.'; return; }
    m.textContent = 'Thanks for subscribing!'; this.reset();
  });

  /* ---------- Menu ---------- */
  var nav = $('#nav'), mb = $('#menuBtn');
  mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); } });

  /* ---------- Router ---------- */
  var V = { home: $('#home'), products: $('#products'), productView: $('#productView'), cart: $('#cart'), about: $('#about'), register: $('#register') };
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/'), name = 'home';
    if (parts[0] === 'shop') { name = 'products'; filter = TITLES[parts[1]] ? parts[1] : 'all'; renderList(); }
    else if (parts[0] === 'product') { name = 'productView'; renderProduct(parts[1]); }
    else if (parts[0] === 'cart') { name = 'cart'; renderCart(); }
    else if (parts[0] === 'about') name = 'about';
    else if (parts[0] === 'account') name = 'register';
    Object.keys(V).forEach(function (k) { V[k].hidden = k !== name; });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  save(); route();
  /* Cargar fotos de los jabones si existen */
  products.forEach(function (p, i) {
    var n = i + 1;
    Promise.all(['jabon' + n + '.jpg', 'jabon' + n + '-2.jpg', 'jabon' + n + '-3.jpg'].map(probe)).then(function (r) {
      p.imgs = r.filter(Boolean);
      if (p.imgs.length) route();
    });
  });
})();