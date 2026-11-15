/* catalog.js - product sections, units, sale types and the starting settings.
   The real system starts with NO products and NO prices: the owner adds her own on the Products page
   (an item without a price asks for the amount when it is added to a bill). */
(function () {
  'use strict';

  var CATS = [
    { id: 'clothing',    en: 'Clothing & Abayas',    ar: 'ملابس وعبايات',       ic: '👗', ob: false },
    { id: 'jewellery',   en: 'Jewellery & Beads',    ar: 'مجوهرات وخرز',        ic: '📿', ob: false },
    { id: 'accessories', en: 'Accessories & Bags',   ar: 'إكسسوارات وحقائب',    ic: '👜', ob: false },
    { id: 'gifts',       en: 'Gifts & Wrapping',     ar: 'هدايا وتغليف',        ic: '🎁', ob: false },
    { id: 'other',       en: 'Other',                ar: 'أخرى',                ic: '🧾', ob: false }
  ];

  var UNITS = [
    { id: 'piece', en: 'piece', ar: 'قطعة' },
    { id: 'set',   en: 'set',   ar: 'طقم' },
    { id: 'pair',  en: 'pair',  ar: 'زوج' },
    { id: 'metre', en: 'metre', ar: 'متر' },
    { id: 'gram',  en: 'gram',  ar: 'غرام' },
    { id: 'box',   en: 'box',   ar: 'علبة' }
  ];

  /* The owner's own sections and units live in the settings (customCats / customUnits).
     setCustom() rebuilds the two shared lists in place, so every screen that reads
     Catalog.CATS / Catalog.UNITS / Catalog.cat() / Catalog.unit() sees them automatically. */
  var BASE_CATS = CATS.length, BASE_UNITS = UNITS.length;
  function setCustom(settings) {
    CATS.length = BASE_CATS; UNITS.length = BASE_UNITS;
    ((settings && settings.customCats) || []).forEach(function (x) {
      if (x && x.id) CATS.push({ id: x.id, en: x.en || x.ar, ar: x.ar || x.en, ic: x.ic || '🗂️', ob: false, custom: true });
    });
    ((settings && settings.customUnits) || []).forEach(function (x) {
      if (x && x.id) UNITS.push({ id: x.id, en: x.en || x.ar, ar: x.ar || x.en, custom: true });
    });
  }

  var ORDER_TYPES = [
    { id: 'store',    en: 'In the shop', ar: 'من المحل', ic: '🛍️' },
    { id: 'delivery', en: 'Delivery',    ar: 'توصيل',    ic: '🚚' }
  ];

  function defaultSettings() {
    return {
      name: 'GOLDEN BEADS COLLECTION', nameAr: 'جولدن بيدز كوليكشن',
      addr: 'Sultanate of Oman',
      addrAr: 'سلطنة عمان',
      phone: '', email: '',
      cr: '', vatNo: '', vatOn: false, vatPct: 5,
      prefix: 'GB', paper: '80',
      lang: 'ar', theme: 'light',
      footer: 'Thank you for shopping with us  |  شكراً لتسوقكم معنا',
      customCats: [], customUnits: [],
      terms: '',
      bank: ''
    };
  }

  /* No starting products: a boutique's pieces are her own. */
  function defaultServices() { return []; }

  window.Catalog = {
    CATS: CATS, UNITS: UNITS, ORDER_TYPES: ORDER_TYPES,
    defaultSettings: defaultSettings, defaultServices: defaultServices,
    setCustom: setCustom,
    cat: function (id) { return CATS.filter(function (c) { return c.id === id; })[0] || CATS.filter(function (c) { return c.id === 'other'; })[0]; },
    unit: function (id) { return UNITS.filter(function (u) { return u.id === id; })[0] || UNITS[0]; },
    order: function (id) { return ORDER_TYPES.filter(function (d) { return d.id === id; })[0] || ORDER_TYPES[0]; }
  };
})();
