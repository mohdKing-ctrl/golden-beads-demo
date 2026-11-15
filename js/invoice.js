/* invoice.js - the "New sale" screen: in the shop or delivery (+ address), pick products, size / colour, price, take payment. */
(function () {
  'use strict';

  var cart = [];            // {sid, cat, n, a, v (size / colour), unit, ob, price, q}
  var otype = 'store';
  var curCat = 'all';
  var payTouched = false;
  var saving = false;
  var saveKey = null, saveFp = '';      // one-time key of the bill being saved (kept while a save is being retried)

  function t(k, v) { return I18N.t(k, v); }
  function S() { return Store.s; }
  function nm(o) { return I18N.pick(o.n, o.a); }
  function nm2(o) { return I18N.pick(o.a, o.n); }

  /* ------------------------------------------------ render */
  function renderType() {
    $('nvType').innerHTML = Catalog.ORDER_TYPES.map(function (d) {
      return '<button type="button" data-type="' + d.id + '" class="' + (d.id === otype ? 'active' : '') + '">' + d.ic + ' ' + esc(I18N.pick(d.en, d.ar)) + '</button>';
    }).join('');
    $('nvAddrWrap').style.display = otype === 'delivery' ? '' : 'none';
  }
  function renderCats() {
    var html = '<button type="button" data-cat="all" class="' + (curCat === 'all' ? 'active' : '') + '">' + esc(t('all')) + '</button>';
    Catalog.CATS.forEach(function (c) {
      html += '<button type="button" data-cat="' + esc(c.id) + '" class="' + (curCat === c.id ? 'active' : '') + '">' + c.ic + ' ' + esc(I18N.pick(c.en, c.ar)) + '</button>';
    });
    $('nvCats').innerHTML = html;
  }
  function renderGrid() {
    var q = $('nvSearch').value.trim().toLowerCase();
    var list = S().services.filter(function (s) {
      if (curCat !== 'all' && s.cat !== curCat) return false;
      if (q && (s.n + ' ' + s.a).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    $('nvCount').textContent = t('n_items', { n: list.length });
    var html = !S().services.length ? '<div class="blank noprod"><span class="em">&#128717;</span><b>' + esc(t('no_products_yet')) + '</b><small>' + esc(t('no_products_yet_s')) + '</small></div>' : '';
    html += list.map(function (s) {
      var cat = Catalog.cat(s.cat), u = Catalog.unit(s.unit);
      return '<button type="button" class="svc" data-sid="' + esc(s.id) + '">' +
        '<span class="plus">+</span>' +
        '<span class="cc">' + cat.ic + ' ' + esc(I18N.pick(cat.en, cat.ar)) + '</span>' +
        '<span class="n">' + esc(nm(s)) + '</span>' +
        '<span class="n2">' + esc(nm2(s)) + '</span>' +
        (s.price > 0
          ? '<span class="p">' + f3(s.price) + '<small>' + esc(t('omr')) + ' / ' + esc(I18N.pick(u.en, u.ar)) + '</small></span>'
          : '<span class="p var">' + esc(t('price_on_invoice')) + '</span>') +
        '</button>';
    }).join('');
    html += '<button type="button" class="svc custom" data-custom="1"><span class="em">&#10133;</span><b>' + esc(t('custom_service')) + '</b><span class="n2">' + esc(t('custom_service_s')) + '</span></button>';
    $('nvGrid').innerHTML = html;
  }
  function renderCart() {
    if (!cart.length) {
      $('nvCart').innerHTML = '<div class="blank"><span class="em">&#128717;</span><b>' + esc(t('cart_empty')) + '</b><small>' + esc(t('cart_empty_s')) + '</small></div>';
    } else {
      $('nvCart').innerHTML = cart.map(function (it, i) {
        var u = Catalog.unit(it.unit);
        return '<div class="ci" data-i="' + i + '">' +
          '<div class="nm">' + esc(nm(it)) +
            '<small>' + esc(I18N.pick(Catalog.cat(it.cat).en, Catalog.cat(it.cat).ar)) + ' &middot; ' + esc(t('per')) + ' ' + esc(I18N.pick(u.en, u.ar)) + '</small></div>' +
          '<button type="button" class="x" data-act="del" title="' + esc(t('remove')) + '">&#10006;</button>' +
          '<input class="var" type="text" data-f="v" maxlength="60" value="' + esc(it.v || '') + '" placeholder="' + esc(t('size_colour_ph')) + '" aria-label="' + esc(t('size_colour')) + '" autocomplete="off">' +
          '<div class="row2">' +
            '<div class="stepper"><button type="button" data-act="dec">&minus;</button>' +
              '<input type="number" inputmode="decimal" min="0" step="any" data-f="q" value="' + esc(it.q) + '" aria-label="' + esc(t('qty')) + '">' +
              '<button type="button" data-act="inc">+</button></div>' +
            '<span class="times">&times;</span>' +
            '<input class="pr" type="number" inputmode="decimal" min="0" step="0.001" data-f="price" value="' + (it.price ? f3(it.price) : '') + '" placeholder="0.000" aria-label="' + esc(t('price')) + '">' +
            '<span class="lt num" data-lt>' + f3(Calc.line(it)) + '</span>' +
          '</div></div>';
      }).join('');
    }
    calc();
  }

  /* ------------------------------------------------ maths */
  function calc() {
    var s = S().settings;
    var tt = Calc.totals(cart, $('nvDisc').value, s.vatOn, s.vatPct);
    $('nvOffice').textContent = f3(tt.office);
    $('nvVatRow').style.display = s.vatOn ? 'flex' : 'none';
    $('nvVatPct').textContent = s.vatPct;
    $('nvVatAmt').textContent = f3(tt.vat);
    $('nvTotal').innerHTML = f3(tt.total) + ' <small>' + esc(t('omr')) + '</small>';
    if (!payTouched) $('nvPaid').value = tt.total > 0 ? f3(tt.total) : '';
    var paid = Math.min(num($('nvPaid').value), tt.total);
    var bal = r3(tt.total - paid);
    var b = $('nvBalance');
    b.className = 'balance' + (bal > 0.0004 ? ' due' : '');
    b.innerHTML = '<span>' + esc(bal > 0.0004 ? t('balance_due') : t('fully_paid')) + '</span><span class="num">' + f3(bal) + ' ' + esc(t('omr')) + '</span>';
    $('nvNo').textContent = I18N.t('next_no') + ' ' + nextNumber();
    $('nvBar').hidden = !cart.length;
    $('nvBarTxt').textContent = t('n_items', { n: r3(cart.reduce(function (a, x) { return a + num(x.q); }, 0)) }) + '  ·  ' + f3(tt.total) + ' ' + t('omr');
    return tt;
  }
  function nextNumber() { return (S().settings.prefix || 'INV') + '-' + String((S().counter || 0) + 1).padStart(5, '0'); }

  /* ------------------------------------------------ cart actions */
  function addService(id) {
    var s = Store.serviceById(id); if (!s) return;
    var ex = cart.filter(function (x) { return x.sid === id; })[0];
    if (ex && !ex.v) ex.q = num(ex.q) + 1;              // a line with its own size / colour stays as it is: a new line is added
    else { ex = null; cart.push({ sid: s.id, cat: s.cat, n: s.n, a: s.a, v: '', unit: s.unit, ob: false, price: s.price, q: 1 }); }
    renderCart();
    if (!(s.price > 0)) {                                   // price not set yet: jump to the price box
      var box = $('nvCart').querySelectorAll('.ci');
      var last = ex ? box[cart.indexOf(ex)] : box[box.length - 1];
      var inp = last && last.querySelector('[data-f=price]');
      if (inp) { inp.focus(); inp.select(); }
    }
  }

  /* ------------------------------------------------ custom line modal */
  function openCustom() {
    $('clName').value = ''; $('clAmount').value = ''; $('clQty').value = '1'; $('clErr').textContent = '';
    App.openModal('customModal');
    setTimeout(function () { $('clName').focus(); }, 50);
  }
  function addCustom() {
    var name = $('clName').value.trim(), amount = num($('clAmount').value), q = num($('clQty').value) || 1;
    if (!name) { $('clErr').textContent = t('err_desc'); return; }
    if (!(amount > 0)) { $('clErr').textContent = t('err_amount'); return; }
    cart.push({ sid: null, cat: 'other', n: name, a: name, v: '', unit: 'piece', ob: false, price: amount, q: q });
    App.closeModal('customModal'); renderCart();
  }

  /* ------------------------------------------------ save */
  function build() {
    var s = S().settings, tt = calc();
    var items = cart.map(function (it) {
      return { sid: it.sid, cat: it.cat, n: it.n, a: it.a, v: String(it.v || '').trim(), unit: it.unit, ob: false, price: r3(num(it.price)), q: num(it.q) };
    });
    var paid = Math.min(r3(num($('nvPaid').value)), tt.total);
    var d = new Date();
    var date = $('nvDate').value || ymd(d);
    return {
      date: date, time: hm(d),
      customerName: $('nvName').value.trim() || t('walk_in'),
      customerPhone: $('nvPhone').value.trim(),
      customerAddr: otype === 'delivery' ? $('nvAddr').value.trim() : '',
      orderType: otype, table: '',
      items: items, discount: tt.disc, vatPct: tt.vatPct, vat: tt.vat, office: tt.office, behalf: 0, total: tt.total,
      payments: paid > 0 ? [{ date: date, amount: paid, method: $('nvPay').value }] : [],
      job: 'done', note: $('nvNote').value.trim(), void: false,
      cr: s.cr, vatNo: s.vatNo
    };
  }
  function save(print) {
    if (saving) return;
    if (!cart.length) { toast(t('err_no_items'), 'bad'); return; }
    var missing = cart.filter(function (it) { return !(num(it.price) > 0) || !(num(it.q) > 0); })[0];
    if (missing) { toast(t('err_enter_price', { name: nm(missing) }), 'bad'); return; }
    if (S().settings.vatOn && !S().settings.vatNo) { toast(t('err_vat_no'), 'bad'); return; }

    var inv = build();
    var fp = JSON.stringify([inv.items, inv.customerName, inv.customerPhone, inv.customerAddr, inv.orderType, inv.date, inv.total, inv.payments, inv.discount, inv.note]);
    if (!saveKey || fp !== saveFp) { saveKey = uid('k'); saveFp = fp; }     // edited since the failed attempt = a different bill
    inv.clientKey = saveKey;
    saving = true; setBusy(true);
    Store.createInvoice(inv).then(function (saved) {
      saveKey = null; saveFp = '';
      toast(t('invoice_saved', { no: saved.number }));
      reset(true);
      App.updateBadge();
      if (print) Print.invoice(saved);
    }).catch(function (e) { toast(App.errText(e), 'bad'); })
      .then(function () { saving = false; setBusy(false); });
  }
  function setBusy(b) { document.querySelectorAll('#view-new .btn').forEach(function (x) { x.disabled = b; }); }

  function reset(silent) {
    if (!silent && cart.length && !confirm(t('confirm_clear'))) return;
    cart = []; payTouched = false; saveKey = null; saveFp = '';
    ['nvName', 'nvPhone', 'nvAddr', 'nvNote'].forEach(function (id) { $(id).value = ''; });
    $('nvDisc').value = '';
    $('nvDate').value = ymd(); $('nvPay').value = 'cash'; otype = 'store';
    renderType(); renderCart();
  }

  /* ------------------------------------------------ wiring */
  function init() {
    $('nvType').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; otype = b.dataset.type; renderType();
    });
    $('nvCats').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; curCat = b.dataset.cat; renderCats(); renderGrid();
    });
    $('nvSearch').addEventListener('input', renderGrid);
    $('nvGrid').addEventListener('click', function (e) {
      var b = e.target.closest('.svc'); if (!b) return;
      if (b.dataset.custom) openCustom(); else addService(b.dataset.sid);
    });
    $('nvCart').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var row = b.closest('.ci'), i = Number(row.dataset.i), it = cart[i]; if (!it) return;
      if (b.dataset.act === 'del') cart.splice(i, 1);
      else if (b.dataset.act === 'inc') it.q = num(it.q) + 1;
      else if (b.dataset.act === 'dec') { it.q = num(it.q) - 1; if (it.q <= 0) cart.splice(i, 1); }
      renderCart();
    });
    $('nvCart').addEventListener('input', function (e) {
      var f = e.target.dataset.f; if (!f) return;
      var row = e.target.closest('.ci'), it = cart[Number(row.dataset.i)]; if (!it) return;
      if (f === 'v') { it.v = e.target.value; return; }
      it[f] = e.target.value === '' ? 0 : num(e.target.value);
      row.querySelector('[data-lt]').textContent = f3(Calc.line(it));
      calc();
    });
    $('nvDisc').addEventListener('input', calc);
    $('nvPaid').addEventListener('input', function () { payTouched = true; calc(); });
    $('nvPayFull').addEventListener('click', function () { payTouched = false; calc(); });
    $('nvPayNone').addEventListener('click', function () { payTouched = true; $('nvPaid').value = '0.000'; calc(); });
    $('nvSave').addEventListener('click', function () { save(true); });
    $('nvSaveOnly').addEventListener('click', function () { save(false); });
    $('nvClear').addEventListener('click', function () { reset(false); });
    $('clAdd').addEventListener('click', addCustom);
    $('clName').addEventListener('keydown', function (e) { if (e.key === 'Enter') addCustom(); });
    $('nvBar').addEventListener('click', function () { document.querySelector('#view-new .panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('nvDate').value = ymd();
  }

  function refresh() {
    renderType(); renderCats(); renderGrid(); renderCart();
    $('nvDate').max = ymd();
  }
  function focusSearch() { $('nvSearch').focus(); }

  window.NewInvoice = { init: init, refresh: refresh, calc: calc, focusSearch: focusSearch, hasItems: function () { return cart.length > 0; } };
})();
