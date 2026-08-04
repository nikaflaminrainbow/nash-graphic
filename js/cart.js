/* ============================================================
   cart.js — Shopping cart, checkout, order submission
   ============================================================ */

const Cart = {
  // ─── INIT ──────────────────────────────────────────────────
  init() {
    const saved = localStorage.getItem('nika_cart');
    State.cart = saved ? JSON.parse(saved) : [];
    Cart.updateCount();
  },

  _save() {
    localStorage.setItem('nika_cart', JSON.stringify(State.cart));
    Cart.updateCount();
  },

  // ─── ADD ITEM ──────────────────────────────────────────────
  addItem(item) {
    // item = { id, type, name, price, qty:1, meta:{} }
    const existing = State.cart.find(c => c.id === item.id && c.type === item.type);
    if (existing) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
    } else {
      State.cart.push({ ...item, qty: item.qty || 1 });
    }
    Cart._save();
    toast(`«${item.name}» — ${t('addToCart')}`, 'success');
  },

  // ─── ADD DESIGN ────────────────────────────────────────────
  addDesign(design, licenseType = 'standard') {
    if (State.isGuest) {
      toast(State.lang === 'fa' ? 'برای خرید طرح، ابتدا ثبت‌نام کنید یا وارد شوید' : 'Please login or register to buy designs', 'warning');
      Modal.open('auth');
      return;
    }
    Cart.addItem({
      id: design.id,
      type: 'design',
      name: design.title,
      price: design.price,
      qty: 1,
      meta: { thumbnail: design.thumbnail_url, designer: design.designer_name, licenseType }
    });
  },

  // ─── ADD PACKAGE ───────────────────────────────────────────
  getPackages() {
    var defaults = [
      { id: 'bronze',  name: 'پکیج برنزی',   price: 30000000, desc: 'مناسب برای چاپخانه‌های کوچک', color: '#cd7f32' },
      { id: 'silver',  name: 'پکیج نقره‌ای',  price: 50000000, desc: 'مناسب برای چاپخانه‌های متوسط', color: '#c0c0c0' },
      { id: 'gold',    name: 'پکیج طلایی',    price: 70000000, desc: 'مناسب برای چاپخانه‌های بزرگ', color: '#ffd700' },
      { id: 'special', name: 'پکیج ویژه',     price: 8000000,  desc: 'سفارش آزمایشی ویژه', color: '#9c27b0' }
    ];
    try {
      var stored = JSON.parse(localStorage.getItem('packages') || 'null');
      return (stored && stored.length) ? stored : defaults;
    } catch(e) { return defaults; }
  },

  savePackages: function(pkgs) {
    localStorage.setItem('packages', JSON.stringify(pkgs));
  },

  renderPackages: function() {
    var grid = document.getElementById('packages-grid');
    if (!grid) return;
    var pkgs = Cart.getPackages();
    var isAdmin = (typeof State !== 'undefined' && State.user && State.user.role === 'admin');
    grid.innerHTML = pkgs.map(function(pkg) {
      var priceFa = (pkg.price || 0).toLocaleString('fa-IR');
      var editBtn = isAdmin
        ? '<button class="btn btn-outline btn-sm mt-1" onclick="Cart.editPackage(\'' + pkg.id + '\')">✏️ ادیت</button> '
        : '';
      return '<div class="package-card glass" style="border-top:3px solid ' + (pkg.color || '#c8a96e') + '">' +
        '<div class="pkg-title">' + pkg.name + '</div>' +
        '<div class="pkg-price">' + priceFa + ' تومان</div>' +
        '<div class="pkg-desc">' + (pkg.desc || '') + '</div>' +
        '<button class="btn btn-primary btn-sm pkg-buy-btn mt-1" onclick="Cart.addPackage(\'' + pkg.id + '\')">افزودن به سبد</button> ' +
        editBtn +
      '</div>';
    }).join('');
    if (isAdmin) {
      grid.innerHTML += '<div class="package-card glass" style="border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;min-height:200px;cursor:pointer" onclick="Cart.editPackage()">' +
        '<div style="text-align:center;color:var(--text-secondary)"><div style="font-size:2rem">+</div><div>افزودن پکیج جدید</div></div>' +
      '</div>';
    }
  },

  editPackage: function(id) {
    var pkgs = Cart.getPackages();
    var pkg = id ? pkgs.find(function(p) { return p.id === id; }) : { id: '', name: '', price: 0, desc: '', color: '#c8a96e' };
    var isNew = !id;
    var title = isNew ? 'افزودن پکیج جدید' : 'ادیت پکیج: ' + pkg.name;
    
    var html = '<div style="padding:1rem">' +
      '<h3>' + title + '</h3>' +
      '<div style="margin-top:1rem">' +
        '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin-bottom:0.3rem">شناسه (انگلیسی)</label>' +
        '<input id="pkg-id" class="input" value="' + (pkg.id || '') + '" placeholder="bronze, silver, ..." ' + (isNew ? '' : 'disabled') + ' />' +
        '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin:0.75rem 0 0.3rem">نام پکیج</label>' +
        '<input id="pkg-name" class="input" value="' + (pkg.name || '') + '" placeholder="پکیج برنزی" />' +
        '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin:0.75rem 0 0.3rem">قیمت (تومان)</label>' +
        '<input id="pkg-price" class="input" type="number" value="' + (pkg.price || 0) + '" style="direction:ltr" />' +
        '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin:0.75rem 0 0.3rem">توضیحات</label>' +
        '<input id="pkg-desc" class="input" value="' + (pkg.desc || '') + '" placeholder="مناسب برای..." />' +
        '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin:0.75rem 0 0.3rem">رنگ حاشیه</label>' +
        '<input id="pkg-color" type="color" value="' + (pkg.color || '#c8a96e') + '" style="width:60px;height:35px;border:none;cursor:pointer" />' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;margin-top:1.5rem">' +
        '<button class="btn btn-primary" onclick="Cart.savePackageEdit()">💾 ذخیره</button>' +
        (isNew ? '' : '<button class="btn btn-danger" onclick="Cart.deletePackage(\'' + pkg.id + '\')">🗑️ حذف</button>') +
        '<button class="btn btn-outline" onclick="Modal.close(\'pkg-edit\')">انصراف</button>' +
      '</div>' +
    '</div>';
    
    document.getElementById('design-detail-content').innerHTML = html;
    document.getElementById('modal-design').classList.remove('hidden');
  },

  savePackageEdit: function() {
    var id = document.getElementById('pkg-id').value.trim();
    var name = document.getElementById('pkg-name').value.trim();
    var price = parseInt(document.getElementById('pkg-price').value) || 0;
    var desc = document.getElementById('pkg-desc').value.trim();
    var color = document.getElementById('pkg-color').value;
    if (!id || !name) { toast('شناسه و نام الزامیه', 'error'); return; }
    var pkgs = Cart.getPackages();
    var idx = pkgs.findIndex(function(p) { return p.id === id; });
    var pkg = { id: id, name: name, price: price, desc: desc, color: color };
    if (idx >= 0) { pkgs[idx] = pkg; } else { pkgs.push(pkg); }
    Cart.savePackages(pkgs);
    Cart.renderPackages();
    Modal.close('design-detail');
    toast('پکیج ذخیره شد ✅', 'success');
  },

  deletePackage: function(id) {
    if (!confirm('از حذف پکیج مطمئنی؟')) return;
    var pkgs = Cart.getPackages().filter(function(p) { return p.id !== id; });
    Cart.savePackages(pkgs);
    Cart.renderPackages();
    Modal.close('design-detail');
    toast('پکیج حذف شد', 'success');
  },

  addPackage(type) {
    if (State.isGuest) {
      toast(State.lang === 'fa' ? 'برای خرید پکیج، ابتدا ثبت‌نام کنید یا وارد شوید' : 'Please login or register to purchase packages', 'warning');
      Modal.open('auth');
      return;
    }
    var pkg = Cart.getPackages().find(function(p) { return p.id === type; });
    if (!pkg) return;
    Cart.addItem({ id: 'pkg-' + pkg.id, type: 'package', name: pkg.name, price: pkg.price, qty: 1, meta: {} });
  },

  // ─── ADD ORDER ITEM (printer dashboard) ────────────────────
  addOrderItem(item) {
    if (State.isGuest) {
      toast(State.lang === 'fa' ? 'برای ثبت سفارش، ابتدا ثبت‌نام کنید یا وارد شوید' : 'Please login or register to place orders', 'warning');
      Modal.open('auth');
      return;
    }
    Cart.addItem({ ...item, type: 'order' });
  },

  // ─── REMOVE ITEM ───────────────────────────────────────────
  removeItem(id, type) {
    State.cart = State.cart.filter(c => !(c.id === id && c.type === type));
    Cart._save();
    Cart.renderItems();
  },

  // ─── CHANGE QTY ────────────────────────────────────────────
  changeQty(id, type, delta) {
    const item = State.cart.find(c => c.id === id && c.type === type);
    if (!item) return;
    item.qty = Math.max(1, (item.qty || 1) + delta);
    Cart._save();
    Cart.renderItems();
  },

  // ─── UPDATE COUNT IN HEADER ────────────────────────────────
  updateCount() {
    const total = State.cart.reduce((s, c) => s + (c.qty || 1), 0);
    const el = document.getElementById('cart-count');
    if (el) el.textContent = toFarsiNum(total);
  },

  // ─── TOTAL PRICE ───────────────────────────────────────────
  getTotal() {
    return State.cart.reduce((s, c) => s + (c.price * (c.qty || 1)), 0);
  },

  // ─── OPEN CART ────────────────────────────────────────────
  open() {
    const titleEl = document.querySelector('#modal-cart h3');
    if (titleEl) titleEl.textContent = '🛒 ' + t('cart');
    Cart.renderItems();
    Modal.open('cart');
  },

  // ─── RENDER ITEMS ─────────────────────────────────────────
  renderItems() {
    const el = document.getElementById('cart-items');
    if (!el) return;

    if (!State.cart.length) {
      el.innerHTML = `<div class="empty-state">${t('emptyCart')}</div>`;
      document.getElementById('cart-total').textContent = formatPrice(0);
      return;
    }

    el.innerHTML = State.cart.map(item => `
      <div class="cart-item">
        ${item.meta?.thumbnail ? `<img src="${item.meta.thumbnail}" style="width:60px;height:60px;object-fit:cover;border-radius:8px" />` : '<div style="width:60px;height:60px;background:var(--bg-secondary);border-radius:8px;display:flex;align-items:center;justify-content:center">🛍️</div>'}
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.3rem">
            <button class="btn btn-sm btn-ghost" onclick="Cart.changeQty('${item.id}','${item.type}',-1)">−</button>
            <span>${toFarsiNum(item.qty || 1)}</span>
            <button class="btn btn-sm btn-ghost" onclick="Cart.changeQty('${item.id}','${item.type}',1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.removeItem('${item.id}','${item.type}')">🗑️</button>
      </div>
    `).join('');

    document.getElementById('cart-total').textContent = formatPrice(Cart.getTotal());

    const totalLabel = document.querySelector('#modal-cart .cart-total');
    if (totalLabel) {
      const span = totalLabel.querySelector('span');
      totalLabel.innerHTML = `${t('total')}: <span id="cart-total">${formatPrice(Cart.getTotal())}</span>`;
    }
    const payBtn = document.querySelector('#modal-cart .cart-footer .btn-primary');
    if (payBtn) payBtn.textContent = t('payAndOrder');
  },

  // ─── CHECKOUT ─────────────────────────────────────────────
  checkout() {
    if (!State.cart.length) { toast(t('emptyCart'), 'warning'); return; }
    // Pre-fill checkout form
    if (State.user) {
      const name  = document.getElementById('checkout-name');
      const phone = document.getElementById('checkout-phone');
      if (name)  name.value  = State.user.name  || '';
      if (phone) phone.value = State.user.phone || '';
    }
    // Show total amount
    const amountEl = document.getElementById('payment-amount');
    if (amountEl) amountEl.textContent = formatPrice(Cart.getTotal());
    // Populate card info from config
    if (typeof PAYMENT_CONFIG !== 'undefined') {
      const cardEl = document.getElementById('payment-card-number');
      const holderEl = document.getElementById('payment-card-holder');
      const bankEl = document.getElementById('payment-bank');
      if (cardEl) cardEl.textContent = PAYMENT_CONFIG.card_number;
      if (holderEl) holderEl.textContent = PAYMENT_CONFIG.card_holder;
      if (bankEl) bankEl.textContent = PAYMENT_CONFIG.bank_name;
    }
    Cart.translateCheckout();
    Modal.close('cart');
    Modal.open('checkout');
  },

  translateCheckout() {
    const titleEl = document.getElementById('checkout-modal-title');
    if (titleEl) titleEl.textContent = t('completeOrder');

    const nameEl    = document.getElementById('checkout-name');
    const phoneEl   = document.getElementById('checkout-phone');
    const addressEl = document.getElementById('checkout-address');
    if (nameEl)    nameEl.placeholder    = t('fullName');
    if (phoneEl)   phoneEl.placeholder   = `${t('phone')} (${State.lang === 'fa' ? 'الزامی' : 'required'})`;
    if (addressEl) addressEl.placeholder = `${t('deliveryAddress')} (${State.lang === 'fa' ? 'اختیاری' : 'optional'})`;

    const disclaimerEl = document.getElementById('checkout-disclaimer');
    if (disclaimerEl) disclaimerEl.textContent = t('orderRequestSentDesc');

    const submitBtn = document.getElementById('checkout-submit-btn');
    if (submitBtn) submitBtn.textContent = t('requestOrder');

    const printBtn = document.getElementById('receipt-print-btn');
    if (printBtn) printBtn.textContent = t('printReceipt');
  },

  // ─── SUBMIT ORDER ─────────────────────────────────────────
  async submitOrder() {
    const nameEl  = document.getElementById('checkout-name');  const name    = nameEl ? nameEl.value.trim() : '';
    const phoneEl = document.getElementById('checkout-phone'); const phone   = phoneEl ? phoneEl.value.trim() : '';
    const addrEl = document.getElementById('checkout-address'); const address = addrEl ? addrEl.value.trim() : '';

    if (!name || !phone) { toast(t('fillRequired'), 'warning'); return; }
    if (phone.replace(/\D/g,'').length < 8) { toast(t('phoneRequired'), 'warning'); return; }
    if (!State.cart.length) { toast(t('emptyCart'), 'warning'); return; }

    showLoading(true);
    try {
      const trackingCode = generateTrackingCode();
      const total = Cart.getTotal();

      const orderPayload = {
        user_id:        State.user?.id   || null,
        guest_email:    State.isGuest ? phone : null,
        guest_name:     State.isGuest ? name  : null,
        is_guest:       !State.user,
        user_name:      name,
        user_phone:     phone,
        user_address:   address,
        items:          State.cart,
        total_amount:   total,
        discount_amount:0,
        final_amount:   total,
        status:         'pending_review',
        tracking_code:  trackingCode,
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      };

      // Handle receipt upload
      const receiptInput = document.getElementById('checkout-receipt');
      if (receiptInput && receiptInput.files.length > 0) {
        const file = receiptInput.files[0];
        const reader = new FileReader();
        reader.onload = async function(e) {
          orderPayload.receipt_image = e.target.result;
          await DB.update('orders', order.id, { receipt_image: e.target.result });
        };
        reader.readAsDataURL(file);
      }
      
      const order = await DB.insert('orders', orderPayload);

      // Notify admin
      try {
        await DB.insert('notifications', {
          type:       'new_order',
          title:      `${State.lang === 'fa' ? 'درخواست سفارش جدید از' : 'New order request from'} ${name}`,
          message:    `${t('amountLabel')} ${formatPrice(total)}`,
          order_id:   order.id,
          is_read:    false,
          created_at: new Date().toISOString()
        });
      } catch (err) { console.warn(err); }

      // NOTE: sales_count for designs is intentionally NOT incremented here.
      // It only increments once the admin reviews & approves the order
      // (see Admin.approveOrder in admin.js), since this is a request, not a final sale.

      toast(t('orderRequestSent'), 'success');

      // Show receipt
      Cart.showReceipt(order, trackingCode);

      // Clear cart
      State.cart = [];
      Cart._save();
      Modal.close('checkout');
      Modal.open('receipt');

    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  // ─── SHOW RECEIPT ─────────────────────────────────────────
  showReceipt(order, trackingCode) {
    const el = document.getElementById('receipt-content');
    if (!el) return;

    const itemsHtml = (order.items || []).map(item => `
      <div class="receipt-row">
        <span>${item.name} ${item.qty > 1 ? `× ${toFarsiNum(item.qty)}` : ''}</span>
        <span>${formatPrice(item.price * item.qty)}</span>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="receipt">
        <h3>✅ ${t('orderRequestSent')}</h3>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.5rem;margin-bottom:1rem;line-height:1.7">
          ${t('orderRequestSentDesc')}
        </p>
        <div class="divider"></div>
        <h4 style="font-size:0.9rem;margin-bottom:0.5rem;color:var(--text-secondary)">${t('orderSummary')}</h4>
        ${itemsHtml}
        <div class="divider"></div>
        ${[
          [t('order') + ' #', trackingCode],
          [t('fullName'), order.user_name],
          [t('phone'), order.user_phone],
          [t('statusCol'), `<span class="design-status status-pending">${t('pending_review')}</span>`],
          [t('finalAmount'), formatPrice(order.final_amount)],
        ].map(([k,v]) => `<div class="receipt-row"><span>${k}</span><span>${v}</span></div>`).join('')}
        <div class="tracking-code">
          🔍 ${t('trackingCodeLabel')}: ${trackingCode}
        </div>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:1rem;text-align:center">
          ${t('saveOrPrintReceipt')}
        </p>
      </div>
    `;
    const printBtn = document.getElementById('receipt-print-btn');
    if (printBtn) printBtn.textContent = t('printReceipt');
  }
};

