/* services.js - the Products page: add, edit, delete products; own sections and units. */
(function () {
  'use strict';

  var editing = null, catFilter = 'all', busy = false;

  function t(k, v) { return I18N.t(k, v); }

  function render() {
    var q = $('svSearch').value.toLowerCase().trim();
    var pills = '<button type="button" data-cat="all" class="' + (catFilter === 'all' ? 'active' : '') + '">' + esc(t('all')) + '</button>' +
      Catalog.CATS.map(function (c) {
        return '<button type="button" data-cat="' + esc(c.id) + '" class="' + (catFilter === c.id ? 'active' : '') + '">' + c.ic + ' ' + esc(I18N.pick(c.en, c.ar)) + '</button>';
      }).join('');
    $('svCats').innerHTML = pills;

    var list = Store.s.services.filter(function (s) {
      return (catFilter === 'all' || s.cat === catFilter) && (!q || (s.n + ' ' + s.a).toLowerCase().indexOf(q) !== -1);
    });
    if (!list.length) {
      $('svBody').innerHTML = '<tr><td colspan="5"><div class="blank"><span class="em">&#127869;</span><b>' + esc(t('no_services')) + '</b></div></td></tr>';
      return;
    }
    $('svBody').innerHTML = list.map(function (s) {
      var c = Catalog.cat(s.cat), u = Catalog.unit(s.unit);
      return '<tr data-id="' + esc(s.id) + '">' +
        '<td data-l="' + esc(t('category')) + '"><span class="chip c-brand">' + c.ic + ' ' + esc(I18N.pick(c.en, c.ar)) + '</span></td>' +
        '<td data-l="' + esc(t('item')) + '" class="svname"><b>' + esc(I18N.pick(s.n, s.a)) + '</b><div class="mini">' + esc(I18N.pick(s.a, s.n)) + '</div></td>' +
        '<td data-l="' + esc(t('unit')) + '">' + esc(I18N.pick(u.en, u.ar)) + '</td>' +
        '<td class="money num" data-l="' + esc(t('price')) + '">' + (s.price > 0 ? f3(s.price) : '<span class="chip c-gold">' + esc(t('price_on_invoice')) + '</span>') + '</td>' +
        '<td data-l=""><div class="acts"><button class="iconbtn" data-act="edit" title="' + esc(t('edit')) + '">&#9998;</button>' +
        '<button class="iconbtn d" data-act="del" title="' + esc(t('delete')) + '">&#128465;</button></div></td></tr>';
    }).join('');
  }

  function fillSelects() {
    $('smCat').innerHTML = Catalog.CATS.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(I18N.pick(c.en, c.ar)) + '</option>'; }).join('') +
      '<option value="__new">' + esc(t('opt_new_section')) + '</option>';
    $('smUnit').innerHTML = Catalog.UNITS.map(function (u) { return '<option value="' + esc(u.id) + '">' + esc(I18N.pick(u.en, u.ar)) + '</option>'; }).join('') +
      '<option value="__new">' + esc(t('opt_new_unit')) + '</option>';
  }
  function showNew() {
    $('smNewCatWrap').hidden = $('smCat').value !== '__new';
    $('smNewUnitWrap').hidden = $('smUnit').value !== '__new';
  }
  function openForm(id) {
    editing = id ? Store.serviceById(id) : null;
    var s = editing || { cat: catFilter === 'all' ? 'tikka' : catFilter, unit: 'plate', price: '' };
    fillSelects();
    $('smTitle').textContent = t(editing ? 'edit_service' : 'add_service');
    $('smEn').value = s.n || ''; $('smAr').value = s.a || '';
    $('smCat').value = s.cat; $('smUnit').value = s.unit; $('smPrice').value = s.price > 0 ? f3(s.price) : '';
    $('smErr').textContent = '';
    ['smNewCatEn', 'smNewCatAr', 'smNewUnitEn', 'smNewUnitAr'].forEach(function (id) { $(id).value = ''; });
    showNew();
    App.openModal('svcModal');
    setTimeout(function () { $('smAr').focus(); }, 50);
  }
  function sameName(list, en, ar) {
    var e = en.toLowerCase(), r = ar.toLowerCase();
    return list.filter(function (x) { return (e && (x.en || '').toLowerCase() === e) || (r && (x.ar || '').toLowerCase() === r) || (e && (x.ar || '').toLowerCase() === e); })[0];
  }
  function saveForm() {
    if (busy) return;
    var en = $('smEn').value.trim(), ar = $('smAr').value.trim();
    if (!en && !ar) { $('smErr').textContent = t('err_desc'); return; }
    var price = $('smPrice').value.trim() === '' ? 0 : num($('smPrice').value);
    if (price < 0) { $('smErr').textContent = t('err_amount'); return; }

    var catId = $('smCat').value, unitId = $('smUnit').value;
    var customCats = (Store.s.settings.customCats || []).slice(), customUnits = (Store.s.settings.customUnits || []).slice();
    var changedLists = false;

    if (catId === '__new') {
      var ce = $('smNewCatEn').value.trim(), ca = $('smNewCatAr').value.trim();
      if (!ce && !ca) { $('smErr').textContent = t('err_new_section'); return; }
      if (sameName(Catalog.CATS, ce, ca)) { $('smErr').textContent = t('err_section_exists'); return; }
      var newCat = { id: uid('cc'), en: ce || ca, ar: ca || ce, ic: '🍽️', ob: false };
      customCats.push(newCat); catId = newCat.id; changedLists = true;
    }
    if (unitId === '__new') {
      var ue = $('smNewUnitEn').value.trim(), ua = $('smNewUnitAr').value.trim();
      if (!ue && !ua) { $('smErr').textContent = t('err_new_unit'); return; }
      if (sameName(Catalog.UNITS, ue, ua)) { $('smErr').textContent = t('err_unit_exists'); return; }
      var newUnit = { id: uid('cu'), en: ue || ua, ar: ua || ue };
      customUnits.push(newUnit); unitId = newUnit.id; changedLists = true;
    }

    var doc = {
      id: editing ? editing.id : uid('s'), cat: catId, n: en || ar, a: ar || en,
      unit: unitId, price: r3(price), ob: false
    };
    busy = true;
    var chain = changedLists ? Store.saveSettings({ customCats: customCats, customUnits: customUnits }) : Promise.resolve();
    chain.then(function () { return Store.saveService(doc); }).then(function () {
      App.closeModal('svcModal'); toast(t('saved'));
      if (catFilter !== 'all' && changedLists) catFilter = doc.cat;
      render(); NewInvoice.refresh();
    }).catch(function (e) { $('smErr').textContent = App.errText(e); }).then(function () { busy = false; });
  }

  /* ------------------------------------------------ manage the owner's own sections & units */
  function usage() {
    var cats = {}, units = {};
    Store.s.services.forEach(function (x) { cats[x.cat] = (cats[x.cat] || 0) + 1; units[x.unit] = (units[x.unit] || 0) + 1; });
    Store.s.invoices.forEach(function (inv) { (inv.items || []).forEach(function (it) { cats[it.cat] = (cats[it.cat] || 0) + 1; units[it.unit] = (units[it.unit] || 0) + 1; }); });
    return { cats: cats, units: units };
  }
  function renderManage() {
    var u = usage(), set = Store.s.settings;
    function rows(list, used, kind) {
      if (!list.length) return '<div class="mgempty">' + esc(t('none_custom')) + '</div>';
      return list.map(function (x) {
        var n = used[x.id] || 0;
        return '<div class="mgrow"><b>' + (x.ic ? esc(x.ic) + ' ' : '') + esc(I18N.pick(x.en, x.ar)) + '<span class="mini"> &middot; ' + esc(I18N.pick(x.ar, x.en)) + '</span></b>' +
          (n ? '<span class="chip c-mut mini">' + esc(t('in_use', { n: n })) + '</span>' : '') +
          '<button type="button" class="iconbtn d" data-kind="' + kind + '" data-id="' + esc(x.id) + '"' + (n ? ' disabled style="opacity:.35;cursor:not-allowed"' : '') + ' title="' + esc(t('delete')) + '">&#128465;</button></div>';
      }).join('');
    }
    $('mgCats').innerHTML = rows(set.customCats || [], u.cats, 'cat');
    $('mgUnits').innerHTML = rows(set.customUnits || [], u.units, 'unit');
  }
  function removeCustom(kind, id) {
    var set = Store.s.settings, key = kind === 'cat' ? 'customCats' : 'customUnits';
    var item = (set[key] || []).filter(function (x) { return x.id === id; })[0]; if (!item) return;
    if (!confirm(t(kind === 'cat' ? 'confirm_del_section' : 'confirm_del_unit', { name: I18N.pick(item.en, item.ar) }))) return;
    var patch = {}; patch[key] = (set[key] || []).filter(function (x) { return x.id !== id; });
    Store.saveSettings(patch).then(function () {
      if (kind === 'cat' && catFilter === id) catFilter = 'all';
      toast(t('deleted')); renderManage(); render(); NewInvoice.refresh();
    }).catch(function (e) { toast(App.errText(e), 'bad'); });
  }

  function remove(id) {
    var s = Store.serviceById(id); if (!s) return;
    if (!confirm(t('confirm_del_service', { name: I18N.pick(s.n, s.a) }))) return;
    Store.removeService(id).then(function () { toast(t('deleted')); render(); NewInvoice.refresh(); })
      .catch(function (e) { toast(App.errText(e), 'bad'); });
  }

  function init() {
    $('svSearch').addEventListener('input', render);
    $('svCats').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { catFilter = b.dataset.cat; render(); } });
    $('svAdd').addEventListener('click', function () { openForm(null); });
    $('smSave').addEventListener('click', saveForm);
    $('smCat').addEventListener('change', function () { showNew(); if ($('smCat').value === '__new') $('smNewCatEn').focus(); });
    $('smUnit').addEventListener('change', function () { showNew(); if ($('smUnit').value === '__new') $('smNewUnitEn').focus(); });
    $('svManage').addEventListener('click', function () { renderManage(); App.openModal('manageModal'); });
    $('manageModal').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-kind]'); if (b && !b.disabled) removeCustom(b.dataset.kind, b.dataset.id);
    });
    $('svBody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var id = b.closest('tr').dataset.id;
      if (b.dataset.act === 'edit') openForm(id); else remove(id);
    });
  }
  window.Services = { init: init, refresh: render };
})();
