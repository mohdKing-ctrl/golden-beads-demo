/* demo-mode.js - the public DEMO copy only: a banner with a Reset button, a note about what the real system adds, and wording that fits a demo. */
(function () {
  'use strict';

  var KEY = 'goldenbeads_pos_demo';
  var D = I18N.dict;
  function add(k, en, ar) { D.en[k] = en; D.ar[k] = ar; }

  add('demo_banner', 'DEMO - example data, saved only in this browser', 'نسخة تجريبية - بيانات مثال تُحفظ في هذا المتصفح فقط');
  add('mode_demo', 'Demo version', 'نسخة تجريبية');
  add('mode_demo_s', 'Everything you do here is saved only in this browser (nothing is sent to a server). Use "Reset demo" in the menu to start again.', 'كل ما تفعلينه هنا يُحفظ في هذا المتصفح فقط (لا يُرسل شيء إلى سيرفر). استخدمي زر «إعادة ضبط التجربة» في القائمة للبدء من جديد.');
  add('demo_bar', 'DEMO VERSION - try everything. The products, prices and sales are examples saved only on your device. Your real system starts empty and you add your own products and prices.', 'نسخة تجريبية - جرّبي كل شيء. المنتجات والأسعار والمبيعات أمثلة تُحفظ على جهازك فقط. نظامك الحقيقي يبدأ فارغاً وتضيفين منتجاتك وأسعارك بنفسك.');
  add('demo_reset', 'Reset demo', 'إعادة ضبط التجربة');
  add('demo_reset_confirm', 'Reset the demo? Your test sales are removed and the example sales come back.', 'إعادة ضبط التجربة؟ ستُحذف مبيعاتك التجريبية وتعود المبيعات المثال.');
  add('demo_real_title', 'What the real system adds', 'ما يضيفه النظام الحقيقي');
  add('demo_real_body', 'On your own website: a private login for the owner, your data kept safely on your server with a daily backup, your own address, phone and C.R. number on the invoices, and no example data.', 'على موقعك الخاص: تسجيل دخول خاص للمالكة، وبياناتك محفوظة بأمان على سيرفرك مع نسخة احتياطية يومية، وعنوانك وهاتفك ورقم السجل التجاري على الفواتير، وبدون بيانات مثال.');

  add('e_demo_limit', 'This demo is limited to 5 sales. Press Reset demo to try again, or ask for the full version.', 'هذه النسخة التجريبية محدودة بـ ٥ عمليات بيع. اضغطي «إعادة ضبط التجربة» للمحاولة من جديد، أو اطلبي النسخة الكاملة.');

  /* The demo stops after 5 sales made by the visitor (the example sales do not count). */
  var LIMIT = 5, realCreate = Store.createInvoice;
  Store.createInvoice = function (inv) {
    var mine = Store.s.invoices.filter(function (i) { return i.createdBy !== 'Example'; }).length;
    if (mine >= LIMIT) { var e = new Error('demo_limit'); e.code = 'demo_limit'; return Promise.reject(e); }
    return realCreate(inv);
  };

  function reset() {
    if (!confirm(I18N.t('demo_reset_confirm'))) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    location.reload();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var main = document.querySelector('main'), first = main && main.querySelector('.topbar');
    if (first) {
      var bar = document.createElement('div');
      bar.className = 'demobar2';
      bar.innerHTML = '<span class="grow" data-i18n="demo_bar"></span><button type="button" id="demoReset" data-i18n="demo_reset"></button>';
      first.insertAdjacentElement('afterend', bar);
    }
    var side = document.querySelector('.side-b');
    if (side) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sidebtn'; b.id = 'demoReset2'; b.innerHTML = '&#8634; <span data-i18n="demo_reset"></span>';
      side.insertBefore(b, side.querySelector('.who'));
      b.addEventListener('click', reset);
    }
    document.addEventListener('click', function (e) { if (e.target.closest('#demoReset')) reset(); });
    var set = document.getElementById('view-settings');
    if (set) {
      var card = document.createElement('div');
      card.className = 'card setcard demonote';
      card.innerHTML = '<div class="chead"><h3>&#10024; <span data-i18n="demo_real_title"></span></h3></div><p class="hint" style="margin-top:0" data-i18n="demo_real_body"></p>';
      set.appendChild(card);
    }
    I18N.apply();
  });
})();
