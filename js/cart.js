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
  addPackage(type) {
    if (State.isGuest) {
      toast(State.lang === 'fa' ? 'برای خرید پکیج، ابتدا ثبت‌نام کنید یا وارد شوید' : 'Please login or register to purchase packages', 'warning');
      Modal.open('auth');
      return;
    }
    const packages = {
      bronze:  { name: t('bronzePkg'), price: 30_000_000 },
      silver:  { name: t('silverPkg'), price: 50_000_000 },
      gold:    { name: t('goldPkg'),   price: 70_000_000 },
      special: { name: t('specialPkg'),price:  8_000_000 }
    };
    const pkg = packages[type];
    if (!pkg) return;
    Cart.addItem({ id: `pkg-${type}`, type: 'package', name: pkg.name, price: pkg.price, qty: 1, meta: {} });
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
    const name    = document.getElementById('checkout-name').value.trim();
    const phone   = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();

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
      } catch {}

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

console.log('✅ cart.js loaded');
