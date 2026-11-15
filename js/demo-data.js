/* demo-data.js - the public DEMO copy only (never part of the real system).
   window.PS_DEMO.seed(): the example products, prices and sales the demo starts with (dates are relative to today).
   ALL products and prices below are only examples: the real system starts with NO products and the owner adds her own. */
(function () {
  'use strict';

  /* [section, English, Arabic, price, unit] */
  var PRODUCTS = [
    ['clothing',    'Classic black abaya',   'عباية سوداء كلاسيك',   28,   'piece'],
    ['clothing',    'Embroidered abaya',     'عباية مطرزة',          45,   'piece'],
    ['clothing',    'Kaftan dress',          'فستان قفطان',          35,   'piece'],
    ['clothing',    'Shaila (scarf)',        'شيلة',                 6.5,  'piece'],
    ['jewellery',   'Gold beaded necklace',  'قلادة خرز ذهبي',       12,   'piece'],
    ['jewellery',   'Pearl bracelet',        'إسورة لؤلؤ',           8.5,  'piece'],
    ['jewellery',   'Beaded earrings',       'حلق خرز',              5,    'pair'],
    ['jewellery',   'Beaded ring',           'خاتم خرز',             3.5,  'piece'],
    ['jewellery',   'Prayer beads',          'مسبحة',                7,    'piece'],
    ['accessories', 'Evening clutch bag',    'حقيبة سهرة',           18,   'piece'],
    ['accessories', 'Hair clip set',         'طقم مشابك شعر',        4,    'set'],
    ['accessories', 'Brooch',                'بروش',                 3,    'piece'],
    ['gifts',       'Gift box',              'علبة هدية',            2,    'box'],
    ['gifts',       'Gift wrapping',         'تغليف هدية',           1,    'piece']
  ];

  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  function dayAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var r3 = function (n) { return Math.round((n + Number.EPSILON) * 1000) / 1000; };

  function seed() {
    var s = Catalog.defaultSettings();
    var services = PRODUCTS.map(function (r, i) { return { id: 's' + (i + 1), cat: r[0], n: r[1], a: r[2], price: r[3], unit: r[4], ob: false }; });
    var byName = {}; services.forEach(function (x) { byName[x.n] = x; });

    // [days ago, sale type, customer, [[product, qty, size / colour]...], discount, paid share (0..1), method, note, delivery address]
    // No phone numbers on purpose (demo data).
    var plan = [
      [12, 'store', '', [['Classic black abaya', 1, 'Size 56'], ['Shaila (scarf)', 1, 'Black']], 0, 1, 'cash', '', ''],
      [11, 'store', 'مريم', [['Gold beaded necklace', 1, ''], ['Beaded earrings', 1, 'Gold'], ['Gift box', 1, '']], 1, 1, 'card', '', ''],
      [10, 'delivery', 'شيخة', [['Embroidered abaya', 1, 'Size 58 - navy']], 0, 1, 'transfer', 'Instagram order', 'Al Khoudh, Muscat'],
      [9, 'store', '', [['Pearl bracelet', 2, 'White'], ['Beaded ring', 1, 'Size 7']], 0, 1, 'cash', '', ''],
      [8, 'store', 'ريم', [['Kaftan dress', 1, 'M - beige'], ['Evening clutch bag', 1, 'Gold']], 3, 1, 'card', '', ''],
      [7, 'delivery', 'نوف', [['Prayer beads', 2, 'Amber'], ['Gift wrapping', 2, '']], 0, 0.5, 'transfer', 'Rest on delivery', 'Nizwa'],
      [6, 'store', '', [['Hair clip set', 2, ''], ['Brooch', 1, 'Pearl']], 0, 1, 'cash', '', ''],
      [5, 'store', 'فاطمة', [['Classic black abaya', 2, 'Size 54 / 56'], ['Shaila (scarf)', 2, 'Black']], 4, 1, 'card', '', ''],
      [4, 'store', '', [['Gold beaded necklace', 1, ''], ['Gift box', 1, '']], 0, 1, 'cash', '', ''],
      [3, 'delivery', 'عائشة', [['Embroidered abaya', 1, 'Size 52 - black'], ['Beaded earrings', 1, 'Silver']], 0, 0, 'cash', 'Pay on delivery', 'Seeb'],
      [2, 'store', 'خلود', [['Kaftan dress', 1, 'L - olive']], 0, 1, 'card', '', ''],
      [1, 'store', '', [['Pearl bracelet', 1, 'Rose'], ['Beaded ring', 2, 'Size 6']], 0, 1, 'cash', '', ''],
      [0, 'store', 'منى', [['Evening clutch bag', 1, 'Black'], ['Gift wrapping', 1, '']], 0, 1, 'card', '', ''],
      [0, 'store', '', [['Shaila (scarf)', 3, 'Black, beige, grey']], 0, 1, 'cash', '', '']
    ];

    var invoices = [];
    plan.forEach(function (p, i) {
      var no = i + 1, date = dayAgo(p[0]);
      var items = p[3].map(function (l) {
        var sv = byName[l[0]];
        return { sid: sv.id, cat: sv.cat, n: sv.n, a: sv.a, v: l[2] || '', unit: sv.unit, ob: false, price: sv.price, q: l[1] };
      });
      var office = r3(items.reduce(function (t, it) { return t + r3(it.price * it.q); }, 0)), disc = Math.min(p[4], office), total = r3(office - disc);
      var paid = r3(total * p[5]);
      invoices.push({
        id: String(no), no: no, number: s.prefix + '-' + String(no).padStart(5, '0'), created: Math.floor(Date.now() / 1000) - p[0] * 86400, createdBy: 'Example',
        date: date, time: pad(10 + (i * 2) % 11) + ':' + pad((i * 17) % 60),
        customerName: p[2] || 'عميل نقدي', customerPhone: '', customerVat: '', customerAddr: p[1] === 'delivery' ? p[8] : '',
        orderType: p[1], table: '',
        items: items, discount: r3(disc), vatPct: 0, vat: 0, office: office, behalf: 0, total: total,
        payments: paid > 0 ? [{ date: date, amount: paid, method: p[6] }] : [],
        job: 'done', note: p[7], void: false, cr: s.cr, vatNo: ''
      });
    });
    return { settings: s, services: services, customers: [], invoices: invoices, counter: invoices.length };
  }

  window.PS_DEMO = { seed: seed };
})();
