/* print.js - printable bills.
   Everything printed is bilingual (English + Arabic), as an Omani invoice should be,
   whichever language the screen is using. Sizes: A4, 80 mm receipt, 58 mm receipt (Settings -> Print size). */
(function () {
  'use strict';

  var PAYM = { cash: ['Cash', 'نقداً'], card: ['Card', 'بطاقة'], transfer: ['Bank transfer', 'تحويل بنكي'], cheque: ['Cheque', 'شيك'] };
  var logo = 'img/logo.jpg';

  function S() { return Store.s.settings; }
  function payName(m) { var p = PAYM[m] || [m, m]; return p[0] + ' / ' + p[1]; }

  function docType(inv) {
    if (!(inv.vatPct > 0)) return ['INVOICE', 'فاتورة'];
    if (inv.total < 500 && !inv.customerVat) return ['SIMPLIFIED TAX INVOICE', 'فاتورة ضريبية مبسطة'];
    return ['TAX INVOICE', 'فاتورة ضريبية'];
  }
  function row(en, ar, val) {
    if (val === '' || val === null || val === undefined) return '';
    return '<div class="row"><span>' + esc(en) + ' / ' + esc(ar) + '</span><b>' + val + '</b></div>';
  }
  function cell(v) { return '<b class="ltr">' + esc(v) + '</b>'; }
  function otypeText(inv) { var o = Catalog.order(inv.orderType); return o.en + ' / ' + o.ar; }

  /* ------------------------------------------------ A4 invoice */
  function a4(inv) {
    var s = S(), dt = docType(inv), tax = inv.vatPct > 0;
    var paid = Calc.paid(inv), bal = Calc.balance(inv);
    var cr = inv.cr || s.cr;

    var rows = inv.items.map(function (it, i) {
      var u = Catalog.unit(it.unit);
      var same = (it.n || '') === (it.a || '');
      return '<tr><td class="c">' + (i + 1) + '</td>' +
        '<td>' + esc(it.n) + (!same && it.a ? '<span class="ar">' + esc(it.a) + '</span>' : '') + (it.v ? '<span class="vr">' + esc(it.v) + '</span>' : '') + '</td>' +
        '<td class="c">' + esc(u.en) + ' / ' + esc(u.ar) + '</td>' +
        '<td class="c">' + esc(it.q) + '</td>' +
        '<td class="n">' + f3(it.price) + '</td><td class="n">' + f3(Calc.line(it)) + '</td></tr>';
    }).join('');

    var payRows = (inv.payments || []).map(function (p) {
      return '<div class="row"><span>' + fdate(p.date) + ' &middot; ' + esc(payName(p.method)) + '</span><b>' + f3(p.amount) + '</b></div>';
    }).join('');

    return '<div class="inv">' +
      '<div class="hd">' +
        '<div class="l"><h1>' + esc(s.name) + '</h1>' +
          '<div class="sm">' + esc(s.addr) + '</div>' +
          ((s.phone || s.email) ? '<div class="sm">' + (s.phone ? 'Tel: <span class="ltr">' + esc(s.phone) + '</span>' : '') + (s.phone && s.email ? ' &nbsp;|&nbsp; ' : '') + (s.email ? esc(s.email) : '') + '</div>' : '') +
          ((cr || tax) ? '<div class="sm">' + (cr ? 'C.R. No: <b class="ltr">' + esc(cr) + '</b>' : '') + (tax ? (cr ? ' &nbsp;|&nbsp; ' : '') + 'VATIN: <b class="ltr">' + esc(inv.vatNo || s.vatNo) + '</b>' : '') + '</div>' : '') + '</div>' +
        '<img src="' + logo + '" alt="">' +
        '<div class="r"><h1>' + esc(s.nameAr) + '</h1>' +
          '<div class="sm">' + esc(s.addrAr) + '</div>' +
          (s.phone ? '<div class="sm">هاتف: <span class="ltr">' + esc(s.phone) + '</span></div>' : '') +
          ((cr || tax) ? '<div class="sm">' + (cr ? 'السجل التجاري: <b class="ltr">' + esc(cr) + '</b>' : '') + (tax ? (cr ? ' &nbsp;|&nbsp; ' : '') + 'الرقم الضريبي: <b class="ltr">' + esc(inv.vatNo || s.vatNo) + '</b>' : '') + '</div>' : '') + '</div>' +
      '</div><div class="goldbar"></div>' +
      '<div class="doc">' + dt[0] + '<small>' + dt[1] + '</small>' + (inv.void ? '<div class="stamp">VOID / ملغاة</div>' : '') + '</div>' +
      '<div class="meta">' +
        '<div class="box"><div class="t"><span>Sale</span><span>البيع</span></div>' +
          row('Invoice No', 'رقم الفاتورة', cell(inv.number)) +
          row('Date', 'التاريخ', '<span class="ltr">' + fdate(inv.date) + ' ' + esc(inv.time || '') + '</span>') +
          row('Type', 'النوع', esc(otypeText(inv))) +
          '</div>' +
        '<div class="box"><div class="t"><span>Customer</span><span>العميل</span></div>' +
          row('Name', 'الاسم', esc(inv.customerName)) +
          row('Phone', 'الهاتف', inv.customerPhone ? cell(inv.customerPhone) : '') +
          row('Address', 'العنوان', esc(inv.customerAddr)) +
          row('Served by', 'أعدّها', esc(inv.createdBy || '')) + '</div>' +
      '</div>' +
      '<table><thead><tr><th class="c" style="width:28px">#</th><th>Item / الصنف</th><th class="c">Unit / الوحدة</th><th class="c">Qty / الكمية</th><th class="n">Price / السعر</th><th class="n">Amount / المبلغ (OMR)</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="bottom"><div>' +
        (inv.note ? '<div class="note"><b>Note / ملاحظة:</b> ' + esc(inv.note) + '</div>' : '') +
        (s.bank ? '<div class="note"><b>Bank / البنك:</b> ' + esc(s.bank).replace(/\n/g, '<br>') + '</div>' : '') +
        (payRows ? '<div class="box"><div class="t"><span>Payments received</span><span>الدفعات المستلمة</span></div>' + payRows + '</div>' : '') +
      '</div><div class="tot">' +
        row('Subtotal', 'المجموع', f3(inv.office != null ? inv.office : inv.total)) +
        (inv.discount > 0 ? row('Discount', 'الخصم', '-' + f3(inv.discount)) : '') +
        (tax ? row('Taxable amount', 'المبلغ الخاضع للضريبة', f3(inv.office - inv.discount)) + row('VAT ' + inv.vatPct + '%', 'ضريبة القيمة المضافة', f3(inv.vat)) : '') +
        '<div class="grand"><span>TOTAL / الإجمالي (OMR)</span><span>' + f3(inv.total) + '</span></div>' +
        row('Paid', 'المدفوع', f3(paid)) +
        (bal > 0.0004 ? '<div class="row" style="font-weight:800"><span style="color:#d6334d">Balance due / المتبقي</span><b style="color:#d6334d">' + f3(bal) + '</b></div>' : '') +
      '</div></div>' +
      '<div class="foot">' + esc(s.footer) + (s.terms ? '<br>' + esc(s.terms) : '') + '</div>' +
    '</div>';
  }

  /* ------------------------------------------------ receipt (80 mm / 58 mm) */
  function thermal(inv) {
    var s = S(), dt = docType(inv), tax = inv.vatPct > 0, paid = Calc.paid(inv), bal = Calc.balance(inv);
    var cr = inv.cr || s.cr;
    var rows = inv.items.map(function (it) {
      var same = (it.n || '') === (it.a || '');
      return '<tr><td>' + esc(it.n) + (!same && it.a ? '<br><span class="arh2">' + esc(it.a) + '</span>' : '') + (it.v ? '<br><span class="vr">' + esc(it.v) + '</span>' : '') + '</td><td style="text-align:center">' + esc(it.q) + '</td><td style="text-align:right">' + f3(Calc.line(it)) + '</td></tr>';
    }).join('');
    function l(a, b) { return b === '' || b == null ? '' : '<div class="l"><span>' + a + '</span><span>' + b + '</span></div>'; }
    return '<div class="rc">' +
      '<div style="text-align:center"><img src="' + logo + '" style="width:22mm;height:22mm;object-fit:contain" alt=""></div>' +
      '<h2>' + esc(s.name) + '</h2><div class="arh">' + esc(s.nameAr) + '</div>' +
      '<div class="sub">' + esc(s.addr) + '</div>' + (s.phone ? '<div class="sub">Tel: ' + esc(s.phone) + '</div>' : '') +
      ((cr || tax) ? '<div class="sub">' + (cr ? 'C.R.: ' + esc(cr) : '') + (tax ? (cr ? ' | ' : '') + 'VATIN: ' + esc(inv.vatNo || s.vatNo) : '') + '</div>' : '') +
      '<div class="doctype">' + dt[0] + ' / ' + dt[1] + (inv.void ? '<br>** VOID / ملغاة **' : '') + '</div>' +
      l('<b>No: ' + esc(inv.number) + '</b>', fdate(inv.date) + ' ' + esc(inv.time || '')) +
      l('Type / النوع', esc(otypeText(inv))) +
      (inv.customerName && inv.customerName !== I18N.t('walk_in') ? l('Customer:', esc(inv.customerName)) : '') + l('Phone:', esc(inv.customerPhone)) + l('Address:', esc(inv.customerAddr)) +
      '<hr><table><thead><tr><th>Item / الصنف</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>' + rows + '</tbody></table><hr>' +
      (inv.discount > 0 || tax ? l('Subtotal', f3(inv.office)) : '') + (inv.discount > 0 ? l('Discount', '-' + f3(inv.discount)) : '') +
      (tax ? l('VAT ' + inv.vatPct + '%', f3(inv.vat)) : '') +
      '<div class="grand"><span>TOTAL OMR</span><span>' + f3(inv.total) + '</span></div>' +
      l('Paid / المدفوع', f3(paid)) + (bal > 0.0004 ? l('<b>Balance / المتبقي</b>', '<b>' + f3(bal) + '</b>') : '') +
      (inv.note ? '<div class="sub" style="margin-top:4px">' + esc(inv.note) + '</div>' : '') +
      '<div class="ft">' + esc(s.footer) + '<br>- - - - - - - - - -</div></div>';
  }

  /* ------------------------------------------------ print engine */
  function run(html, paper) {
    $('printArea').innerHTML = html;
    $('printArea').className = paper === '58' ? 'p58' : '';
    $('pageStyle').textContent = paper === '80' ? '@page{size:80mm auto;margin:3mm}' : paper === '58' ? '@page{size:58mm auto;margin:2mm}' : '@page{size:A4;margin:11mm}';
    var imgs = Array.prototype.slice.call($('printArea').querySelectorAll('img'));
    var pending = imgs.filter(function (i) { return !i.complete; });
    var go = function () { setTimeout(function () { window.print(); }, 120); };
    if (!pending.length) return go();
    var left = pending.length, done = function () { if (--left <= 0) go(); };
    pending.forEach(function (i) { i.addEventListener('load', done); i.addEventListener('error', done); });
    setTimeout(go, 1500);
  }

  window.Print = {
    invoice: function (inv) {
      var p = S().paper; p = (p === '80' || p === '58') ? p : 'a4';
      run(p === 'a4' ? a4(inv) : thermal(inv), p);
    },
    html: function (inv) { var p = S().paper; return (p === '80' || p === '58') ? thermal(inv) : a4(inv); },
    PAYM: PAYM, docType: docType
  };
})();
