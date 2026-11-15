/* customers.js - the Customers page: who buys, how often, how much, what each one still owes;
   add / edit / delete, her bills, statement of account. A customer is saved from a sale
   ("Save as a new customer") or added here, and fills herself in on the next sale. */
(function () {
  'use strict';

  var editing = null;
  var busy = false;

  function t(k, v) { return I18N.t(k, v); }

  function invoicesOf(c) {
    var nm = c.name.toLowerCase();
    return Store.s.invoices.filter(function (i) {
      return !i.void && (i.customerId === c.id || i.customerName.toLowerCase() === nm);   // by name too: bills made before she was saved
    });
  }
  function figures(c) {
    var billed = 0, paid = 0, last = '', list = invoicesOf(c);
    list.forEach(function (i) { billed += i.total; paid += Calc.paid(i); if (i.date > last) last = i.date; });
    return { n: list.length, billed: r3(billed), paid: r3(paid), bal: r3(billed - paid), last: last };
  }

  function render() {
    var q = $('cuSearch').value.toLowerCase().trim();
    var all = Store.s.customers.map(function (c) { return { c: c, f: figures(c) }; });
    var owed = 0, billed = 0;
    all.forEach(function (r) { owed += r.f.bal; billed += r.f.billed; });
    $('cuStats').innerHTML =
      '<div class="stat"><div class="ic c-info">&#128101;</div><div><div class="l">' + esc(t('s_customers')) + '</div><div class="v">' + all.length + '</div></div></div>' +
      '<div class="stat"><div class="ic c-brand">&#128176;</div><div><div class="l">' + esc(t('s_bought')) + '</div><div class="v num">' + f3(billed) + ' <small>' + esc(t('omr')) + '</small></div></div></div>' +
      '<div class="stat"><div class="ic c-bad">&#9203;</div><div><div class="l">' + esc(t('s_outstanding')) + '</div><div class="v num">' + f3(owed) + ' <small>' + esc(t('omr')) + '</small></div></div></div>';

    var list = all.filter(function (r) {
      var c = r.c;
      return !q || (c.name + ' ' + (c.phone || '') + ' ' + (c.addr || '') + ' ' + (c.notes || '')).toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) { return b.f.bal - a.f.bal || (b.f.last > a.f.last ? 1 : b.f.last < a.f.last ? -1 : 0) || a.c.name.localeCompare(b.c.name); });

    if (!list.length) {
      $('cuBody').innerHTML = '<tr><td colspan="7"><div class="blank"><span class="em">&#128101;</span><b>' + esc(t('no_customers')) + '</b><small>' + esc(t('no_customers_s')) + '</small></div></td></tr>';
      return;
    }
    var canWrite = Store.canWrite();
    $('cuBody').innerHTML = list.map(function (r) {
      var c = r.c, f = r.f;
      return '<tr data-id="' + esc(c.id) + '">' +
        '<td data-l="' + esc(t('customer')) + '"><div><b>' + esc(c.name) + '</b>' +
          (c.addr ? '<div class="mini">' + esc(c.addr) + '</div>' : '') + (c.notes ? '<div class="mini">' + esc(c.notes) + '</div>' : '') + '</div></td>' +
        '<td data-l="' + esc(t('phone')) + '"><span class="ltr">' + esc(c.phone || '-') + '</span></td>' +
        '<td class="num" data-l="' + esc(t('s_invoices')) + '">' + f.n + '</td>' +
        '<td data-l="' + esc(t('last_purchase')) + '">' + (f.last ? fdate(f.last) : '-') + '</td>' +
        '<td class="money num" data-l="' + esc(t('s_bought')) + '">' + f3(f.billed) + '</td>' +
        '<td class="money num" data-l="' + esc(t('balance')) + '" style="color:' + (f.bal > 0.0004 ? 'var(--bad)' : 'var(--ok)') + '">' + f3(f.bal) + '</td>' +
        '<td data-l=""><div class="acts">' +
          '<button class="iconbtn" data-act="invoices" title="' + esc(t('view_invoices')) + '">&#128203;</button>' +
          '<button class="iconbtn" data-act="statement" title="' + esc(t('statement')) + '">&#128424;</button>' +
          (canWrite ? '<button class="iconbtn" data-act="edit" title="' + esc(t('edit')) + '">&#9998;</button>' +
            '<button class="iconbtn d" data-act="del" title="' + esc(t('delete')) + '">&#128465;</button>' : '') +
        '</div></td></tr>';
    }).join('');
  }

  function openForm(id) {
    editing = id ? Store.customerById(id) : null;
    var c = editing || {};
    $('cmTitle').textContent = t(editing ? 'edit_customer' : 'add_customer');
    $('cmName').value = c.name || ''; $('cmPhone').value = c.phone || '';
    $('cmAddr').value = c.addr || ''; $('cmNotes').value = c.notes || '';
    $('cmErr').textContent = '';
    App.openModal('custModal');
    setTimeout(function () { $('cmName').focus(); }, 50);
  }
  function saveForm() {
    if (busy) return;
    var name = $('cmName').value.trim();
    if (!name) { $('cmErr').textContent = t('err_name'); return; }
    var dup = Store.s.customers.filter(function (x) { return x.name.toLowerCase() === name.toLowerCase() && (!editing || x.id !== editing.id); })[0];
    if (dup) { $('cmErr').textContent = t('err_dup_customer'); return; }
    var doc = {
      id: editing ? editing.id : uid('c'), name: name, phone: $('cmPhone').value.trim(), vatNo: '',
      addr: $('cmAddr').value.trim(), notes: $('cmNotes').value.trim()
    };
    busy = true;
    Store.saveCustomer(doc).then(function () {
      App.closeModal('custModal'); toast(t('saved')); render(); NewInvoice.refresh();
    }).catch(function (e) { $('cmErr').textContent = App.errText(e); }).then(function () { busy = false; });
  }
  function remove(id) {
    var c = Store.customerById(id); if (!c) return;
    if (!confirm(t('confirm_del_customer', { name: c.name }))) return;
    Store.removeCustomer(id).then(function () { toast(t('deleted')); render(); NewInvoice.refresh(); })
      .catch(function (e) { toast(App.errText(e), 'bad'); });
  }

  function init() {
    $('cuSearch').addEventListener('input', render);
    $('cuAdd').addEventListener('click', function () { openForm(null); });
    $('cmSave').addEventListener('click', saveForm);
    $('cmName').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveForm(); });
    $('cuBody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var id = b.closest('tr').dataset.id, c = Store.customerById(id); if (!c) return;
      if (b.dataset.act === 'edit') openForm(id);
      else if (b.dataset.act === 'del') remove(id);
      else if (b.dataset.act === 'statement') Print.statement(c, invoicesOf(c));
      else if (b.dataset.act === 'invoices') { Invoices.showFor(c.name); App.show('invoices'); }
    });
  }
  window.Customers = { init: init, refresh: render, invoicesOf: invoicesOf };
})();
