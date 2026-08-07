/* ============================================================
   dashboard.js — Designer dashboard & Printer dashboard
   ============================================================ */

const Dashboard = {

  // ══════════════════════════════════════════════════════════
  //  DESIGNER DASHBOARD
  // ══════════════════════════════════════════════════════════
  async loadDesigner() {
    if (!State.user || (State.user.role !== 'designer' && State.user.role !== 'admin')) {
      Router.navigate('home'); return;
    }
    Dashboard.translateDesignerPage();
    await Promise.all([
      Dashboard.loadMyDesigns(),
      Dashboard.loadSalesStats(),
      Dashboard.loadReceivedOrders(),
      Dashboard.loadStockImages()
    ]);
  },

  translateDesignerPage() {
    const titleEl = document.querySelector('#page-designer-dashboard .section-title');
    if (titleEl) titleEl.textContent = t('designerDashboard');

    const h3s = document.querySelectorAll('#page-designer-dashboard .dash-card h3');
    if (h3s[0]) h3s[0].textContent = t('myDesigns');
    if (h3s[1]) h3s[1].textContent = t('salesStats');
    if (h3s[2]) h3s[2].textContent = t('receivedOrders');

    const newBtn = document.getElementById('new-design-btn');
    if (newBtn) newBtn.textContent = t('newDesignBtn');

    // Portfolio promo card
    const promoTitle = document.getElementById('portfolio-promo-title');
    const promoDesc  = document.getElementById('portfolio-promo-desc');
    const promoView  = document.getElementById('portfolio-promo-view-btn');
    const promoEdit  = document.getElementById('portfolio-promo-manage-btn');
    if (promoTitle) promoTitle.textContent = t('portfolioAndResume');
    if (promoDesc)  promoDesc.textContent  = t('portfolioDesc');
    if (promoView)  promoView.textContent  = '👁️ ' + t('viewPublicPage');
    if (promoEdit)  promoEdit.textContent  = '✏️ ' + t('managePortfolio');
  },

  // ─── My Designs list ───────────────────────────────────────
  async loadMyDesigns() {
    const el = document.getElementById('my-designs-list');
    if (!el) return;
    el.innerHTML = '<div class="spinner-sm"></div>';
    try {
      const { data } = await supabase
        .from('designs').select('*')
        .eq('designer_id', State.user.id)
        .order('created_at', { ascending: false });

      if (!data?.length) {
        el.innerHTML = `<p style="color:var(--text-secondary)">${t('noDesignsUploaded')}</p>`;
        return;
      }
      el.innerHTML = data.map(d => `
        <div class="ticket-item" style="margin-bottom:0.75rem">
          <div class="flex-between">
            <span style="font-weight:600">${d.title}</span>
            <span class="design-status status-${d.status}">${t(d.status)}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">
            ${formatPrice(d.price)} — ${toFarsiNum(d.sales_count||0)} ${t('soldCount')} — ⭐${toFarsiNum((d.avg_rating||0).toFixed(1))}
          </div>
          <div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap">
            <button class="btn btn-sm btn-outline" onclick="Marketplace.openDesign('${d.id}')">👁️ ${t('view')}</button>
            <button class="btn btn-sm btn-ghost"   onclick="Dashboard.editDesign('${d.id}')">✏️ ${t('edit')}</button>
            <button class="btn btn-sm btn-danger"  onclick="Dashboard.deleteMyDesign('${d.id}')">🗑️ ${t('delete')}</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
  },

  // ─── Sales stats ───────────────────────────────────────────
  async loadSalesStats() {
    const el = document.getElementById('sales-stats');
    if (!el) return;
    try {
      const { data } = await supabase
        .from('designs').select('title,sales_count,avg_rating,price')
        .eq('designer_id', State.user.id).eq('status', 'approved');

      if (!data?.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noStatsYet')}</p>`; return; }

      const totalSales   = data.reduce((s,d) => s + (d.sales_count||0), 0);
      const totalRevenue = data.reduce((s,d) => s + (d.price||0) * (d.sales_count||0), 0);
      const avgRating    = data.reduce((s,d) => s + (d.avg_rating||0), 0) / data.length;

      el.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <div class="stat-card glass" style="padding:1rem;text-align:center">
            <div class="stat-number" style="font-size:1.75rem">${toFarsiNum(totalSales)}</div>
            <div class="stat-label">${t('totalSalesLabel')}</div>
          </div>
          <div class="stat-card glass" style="padding:1rem;text-align:center">
            <div class="stat-number" style="font-size:1.25rem">${formatPrice(totalRevenue)}</div>
            <div class="stat-label">${t('totalRevenue')}</div>
          </div>
          <div class="stat-card glass" style="padding:1rem;text-align:center">
            <div class="stat-number" style="font-size:1.75rem">${toFarsiNum(data.length)}</div>
            <div class="stat-label">${t('activeDesigns')}</div>
          </div>
          <div class="stat-card glass" style="padding:1rem;text-align:center">
            <div class="stat-number" style="font-size:1.75rem">⭐ ${toFarsiNum(avgRating.toFixed(1))}</div>
            <div class="stat-label">${t('avgRating')}</div>
          </div>
        </div>
        <h4 style="margin-bottom:0.75rem;font-size:0.9rem;color:var(--text-secondary)">${t('designDetails')}:</h4>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr>
              <th>${t('titleCol')}</th><th>${t('priceCol')}</th><th>${t('salesCol')}</th><th>${t('rating')}</th>
            </tr></thead>
            <tbody>
              ${data.map(d => `<tr>
                <td>${d.title}</td>
                <td>${formatPrice(d.price)}</td>
                <td>${toFarsiNum(d.sales_count||0)}</td>
                <td>⭐ ${toFarsiNum((d.avg_rating||0).toFixed(1))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
  },

  // ─── Received orders (for designer's designs) ─────────────
  async loadReceivedOrders() {
    const el = document.getElementById('received-orders');
    if (!el) return;
    try {
      // Get orders that include this designer's designs
      const { data: myDesigns } = await supabase
        .from('designs').select('id').eq('designer_id', State.user.id);
      if (!myDesigns?.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noOrdersReceived')}</p>`; return; }

      const myIds = myDesigns.map(d => d.id);
      const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20);

      const relevant = (orders || []).filter(o => {
        try {
          return JSON.stringify(o.items).match(new RegExp(myIds.join('|')));
        } catch { return false; }
      });

      if (!relevant.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noOrdersReceived')}</p>`; return; }
      el.innerHTML = relevant.map(o => `
        <div class="ticket-item">
          <div class="flex-between">
            <span>#${o.tracking_code || o.id.slice(0,8)}</span>
            <span class="design-status status-${o.status}">${t(o.status)}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">
            ${o.user_name || o.guest_name || '—'} — ${formatDate(o.created_at)}
          </div>
        </div>
      `).join('');
    } catch (err) { console.warn(err); }
  },

  // ─── Edit designer's own design ────────────────────────────
  async editDesign(id) {
    const { data: d } = await supabase.from('designs').select('*').eq('id', id).single();
    if (!d) return;
    // Verify ownership
    if (d.designer_id !== State.user.id && State.user.role !== 'admin') {
      toast(t('unauthorized'), 'error'); return;
    }
    // Populate upload modal
    document.getElementById('design-title').value    = d.title || '';
    document.getElementById('design-price').value    = d.price || '';
    document.getElementById('design-desc').value     = d.description || '';
    document.getElementById('design-tags').value     = (d.tags||[]).join(', ');
    document.getElementById('design-category').value = d.category || '';

    Marketplace.translateUploadForm();

    // Change upload button to update
    const btn = document.querySelector('#modal-upload .btn-primary');
    if (btn) {
      btn.textContent = t('saveChanges');
      btn.onclick = () => Dashboard.saveDesignEdit(id, btn);
    }
    Modal.open('upload');
  },

  async saveDesignEdit(id, btn) {
    const title    = document.getElementById('design-title').value.trim();
    const category = document.getElementById('design-category').value;
    const price    = parseFloat(document.getElementById('design-price').value);
    const desc     = document.getElementById('design-desc').value.trim();
    const tags     = document.getElementById('design-tags').value.split(',').map(x => x.trim()).filter(Boolean);
    if (!title || !price) { toast(t('fillRequired'), 'warning'); return; }

    showLoading(true);
    try {
      await DB.update('designs', id, { title, category, price, description: desc, tags, updated_at: new Date().toISOString() });
      toast(t('saveSuccess'), 'success');
      Modal.close('upload');
      // Restore btn
      if (btn) { btn.textContent = t('upload'); btn.onclick = Marketplace.uploadDesign.bind(Marketplace); }
      Dashboard.loadMyDesigns();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      showLoading(false);
    }
  },

  // ─── Delete designer's own design ─────────────────────────
  async deleteMyDesign(id) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const { data: d } = await supabase.from('designs').select('designer_id').eq('id', id).single();
      if (d?.designer_id !== State.user.id && State.user.role !== 'admin') {
        toast(t('unauthorized'), 'error'); return;
      }
      await DB.delete('designs', id);
      toast(t('deleteSuccess'), 'success');
      Dashboard.loadMyDesigns();
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  // ══════════════════════════════════════════════════════════
  //  PRINTER DASHBOARD
  // ══════════════════════════════════════════════════════════
  async loadPrinter() {
    Dashboard.translatePrinterPage();

    const isGuest = State.isGuest || (!State.user && !State.isGuest === false);

    // بنر مهمان
    const banner = document.getElementById('printer-guest-banner');
    if (banner) banner.classList.toggle('hidden', !State.isGuest);

    // دکمه‌های خرید: فعال برای همه غیر مهمان
    const addOrderBtn = document.querySelector('#page-printer-dashboard .dash-card.full-width .btn-primary:not(.pkg-buy-btn)');
    if (addOrderBtn) {
      addOrderBtn.disabled = State.isGuest;
      addOrderBtn.title = State.isGuest
        ? (State.lang === 'fa' ? 'برای سفارش ابتدا وارد شوید' : 'Login to place orders') : '';
    }
    document.querySelectorAll('#page-printer-dashboard .pkg-buy-btn').forEach(btn => {
      btn.disabled = State.isGuest;
      btn.title = State.isGuest
        ? (State.lang === 'fa' ? 'برای خرید ابتدا وارد شوید' : 'Login to purchase') : '';
    });

    // دسته‌بندی‌ها برای همه لود میشه
    await Dashboard.loadMainCategories();

    // رندر پکیج‌ها (داینامیک)
    if (typeof Cart !== 'undefined' && Cart.renderPackages) Cart.renderPackages();

    // سفارش‌ها و تاریخچه فقط برای کاربران لاگین‌شده
    if (State.user) {
      await Promise.all([
        Dashboard.loadPrinterOrders(),
        Dashboard.loadPurchaseHistory(),
      ]);
    } else {
      // پیام راهنما برای مهمان
      const ordersEl = document.getElementById('printer-orders-list');
      const historyEl = document.getElementById('purchase-history');
      const msg = `<p style="color:var(--text-secondary);font-size:0.9rem">${State.lang === 'fa' ? 'برای مشاهده سفارش‌ها وارد شوید' : 'Login to see your orders'}</p>`;
      if (ordersEl) ordersEl.innerHTML = msg;
      if (historyEl) historyEl.innerHTML = msg;
    }
  },

  translatePrinterPage() {
    const titleEl = document.querySelector('#page-printer-dashboard .section-title');
    if (titleEl) titleEl.textContent = t('printerDashboard');

    const labels = document.querySelectorAll('#page-printer-dashboard .order-form-grid .label');
    const labelKeys = ['mainCategory','productType','execMethod','colorCount','orderQty','basePrice'];
    labels.forEach((el, i) => { if (labelKeys[i]) el.textContent = t(labelKeys[i]); });

    const sampleLabel = document.querySelector('#category-sample-box .label');
    if (sampleLabel) sampleLabel.textContent = t('sampleImage');

    const orderFormH3 = document.querySelector('#page-printer-dashboard .dash-card.full-width h3');
    if (orderFormH3) orderFormH3.textContent = t('submitDesignOrder');

    const addOrderBtn = document.querySelector('#page-printer-dashboard .dash-card.full-width .btn-primary');
    if (addOrderBtn) addOrderBtn.textContent = t('addToCart');

    const h3s = document.querySelectorAll('#page-printer-dashboard .dash-card h3');
    h3s.forEach(h3 => {
      const txt = h3.textContent.trim();
      if (txt.includes('پکیج') || txt.toLowerCase().includes('package')) h3.textContent = t('bulkPackages');
      if (txt.includes('سفارش‌های من') || txt.toLowerCase().includes('my order')) h3.textContent = t('myOrders');
      if (txt.includes('تاریخچه خرید') || txt.toLowerCase().includes('purchase')) h3.textContent = t('purchaseHistory');
    });

    // Package cards
    const pkgCards = document.querySelectorAll('.package-card');
    const pkgData = [
      { titleKey:'bronzePkg', descKey:'suitableSmall' },
      { titleKey:'silverPkg', descKey:'suitableMedium' },
      { titleKey:'goldPkg',   descKey:'suitableLarge' },
      { titleKey:'specialPkg',descKey:'trialOrder' },
    ];
    pkgCards.forEach((card, i) => {
      const titleEl = card.querySelector('.pkg-title');
      const descEl  = card.querySelector('.pkg-desc');
      if (titleEl && pkgData[i]) titleEl.textContent = t(pkgData[i].titleKey);
      if (descEl  && pkgData[i]) descEl.textContent  = t(pkgData[i].descKey);
    });
  },

  // ─── Load top-level categories from localStorage ─────────
  _getDesignCats() {
    try { return JSON.parse(localStorage.getItem('design_categories') || '[]'); }
    catch { return []; }
  },

  loadMainCategories() {
    // Seed defaults if empty
    var existing = Dashboard._getDesignCats();
    if (existing.length === 0) {
      // Trigger seed via Admin if available, otherwise seed inline
      if (typeof Admin !== 'undefined' && Admin._seedDesignCats) {
        Admin._seedDesignCats();
      } else {
        var defaults = [
          { id:'flexo', name:'چاپ فلکسو', sampleImage:'', subcategories:[
            { id:'packaging', name:'بسته‌بندی', basePrice:500000, colorCounts:[1,2,3,4], execMethods:[
              { id:'from-photo', name:'از روی عکس', sampleImage:'' },
              { id:'from-sketch', name:'از روی اتود', sampleImage:'' }
            ]}
          ]},
          { id:'offset', name:'چاپ افست', sampleImage:'', subcategories:[
            { id:'catalog', name:'کاتالوگ', basePrice:600000, colorCounts:[1,2,3,4], execMethods:[
              { id:'from-photo', name:'از روی عکس', sampleImage:'' },
              { id:'from-sketch', name:'از روی اتود', sampleImage:'' }
            ]}
          ]},
          { id:'digital', name:'چاپ دیجیتال', sampleImage:'', subcategories:[
            { id:'business-card', name:'کارت ویزیت', basePrice:300000, colorCounts:[1,2,3,4], execMethods:[
              { id:'from-photo', name:'از روی عکس', sampleImage:'' },
              { id:'from-sketch', name:'از روی اتود', sampleImage:'' }
            ]}
          ]},
          { id:'graphic-design', name:'طراحی گرافیک', sampleImage:'', subcategories:[
            { id:'logo', name:'لوگو', basePrice:800000, colorCounts:[1,2,3,4], execMethods:[
              { id:'from-photo', name:'از روی عکس', sampleImage:'' },
              { id:'from-sketch', name:'از روی اتود', sampleImage:'' }
            ]}
          ]}
        ];
        localStorage.setItem('design_categories', JSON.stringify(defaults));
        existing = defaults;
      }
      existing = Dashboard._getDesignCats();
    }

    const sel = document.getElementById('main-cat');
    if (!sel) return;
    sel.innerHTML = `<option value="">${t('selectOption')}</option>` +
      existing.map(c => `<option value="${c.id}" data-price="0">${c.name}</option>`).join('');
  },

  onMainCatChange() {
    const mainId = document.getElementById('main-cat').value;
    const typeSel = document.getElementById('product-type');
    if (!typeSel) return;
    typeSel.innerHTML = `<option value="">${t('selectOption')}</option>`;
    document.getElementById('exec-method').innerHTML = `<option value="">${t('selectOption')}</option>`;
    document.getElementById('color-count').innerHTML = `<option value="">${t('selectOption')}</option>`;
    Dashboard.updateBasePrice();
    Dashboard._currentMainCatId = mainId || null;
    Dashboard._currentSubcat = null;
    Dashboard._currentExecMethod = null;
    Dashboard.updateCategorySample();
    if (!mainId) return;

    const cats = Dashboard._getDesignCats();
    const cat = cats.find(c => c.id === mainId);
    if (!cat || !cat.subcategories) return;
    typeSel.innerHTML = `<option value="">${t('selectOption')}</option>` +
      cat.subcategories.map(c => `<option value="${c.id}" data-price="${c.basePrice||0}">${c.name}</option>`).join('');
  },

  onProductTypeChange() {
    const typeId  = document.getElementById('product-type').value;
    const execSel = document.getElementById('exec-method');
    if (!execSel) return;
    execSel.innerHTML = `<option value="">${t('selectOption')}</option>`;
    document.getElementById('color-count').innerHTML = `<option value="">${t('selectOption')}</option>`;
    Dashboard.updateBasePrice();
    Dashboard._currentExecMethod = null;
    Dashboard.updateCategorySample();

    if (!typeId) { Dashboard._currentSubcat = null; return; }

    const cats = Dashboard._getDesignCats();
    const mainCat = cats.find(c => c.id === Dashboard._currentMainCatId);
    const subcat = mainCat && mainCat.subcategories ? mainCat.subcategories.find(s => s.id === typeId) : null;
    Dashboard._currentSubcat = subcat || null;

    if (!subcat) return;

    if (subcat.execMethods && subcat.execMethods.length) {
      execSel.innerHTML = `<option value="">${t('selectOption')}</option>` +
        subcat.execMethods.map(em => `<option value="${em.id}" data-sample="${em.sampleImage||''}">${em.name}</option>`).join('');
    } else {
      execSel.innerHTML = `<option value="">${t('noExecMethodNeeded')}</option>`;
      Dashboard._loadColorsFromSubcat(subcat);
    }
  },

  onExecMethodChange() {
    const execId = document.getElementById('exec-method').value;
    Dashboard.updateBasePrice();

    // Update sample image from exec method
    const execSel = document.getElementById('exec-method');
    if (execSel?.value) {
      const opt = execSel.options[execSel.selectedIndex];
      Dashboard._currentExecMethod = {
        id: execSel.value,
        name: opt.text,
        sampleImage: opt.getAttribute('data-sample') || ''
      };
    } else {
      Dashboard._currentExecMethod = null;
    }

    Dashboard.updateCategorySample();
    Dashboard._loadColorsFromSubcat(Dashboard._currentSubcat);
  },

  _loadColorsFromSubcat(subcat) {
    const colorSel = document.getElementById('color-count');
    if (!colorSel) return;
    colorSel.innerHTML = `<option value="">${t('selectOption')}</option>`;
    if (!subcat || !subcat.colorCounts) return;

    const colorNames = { 1: '۱ رنگ', 2: '۲ رنگ', 3: '۳ رنگ', 4: '۴ رنگ (فول کالر)' };
    colorSel.innerHTML = `<option value="">${t('selectOption')}</option>` +
      subcat.colorCounts.map(n => `<option value="${n}" data-extra="0">${colorNames[n] || (n + ' ' + t('colorUnit'))}</option>`).join('');
  },

  onColorCountChange() {
    Dashboard.updateBasePrice();
    Dashboard.updateCategorySample();
  },

  // ─── Sample image for selected category + exec method ────
  updateCategorySample() {
    const box = document.getElementById('category-sample-box');
    const img = document.getElementById('category-sample-img');
    if (!box || !img) return;

    var sampleUrl = '';
    var selectedColor = (document.getElementById('color-count') || {}).value;

    // 1. Per-color image (highest priority)
    if (selectedColor && Dashboard._currentSubcat && Dashboard._currentSubcat.colorImages && Dashboard._currentSubcat.colorImages[selectedColor]) {
      sampleUrl = Dashboard._currentSubcat.colorImages[selectedColor];
    }
    // 2. Exec method sample image
    else if (Dashboard._currentExecMethod && Dashboard._currentExecMethod.sampleImage) {
      sampleUrl = Dashboard._currentExecMethod.sampleImage;
    }
    // 3. Subcategory general sample image
    else if (Dashboard._currentSubcat && Dashboard._currentSubcat.sampleImage) {
      sampleUrl = Dashboard._currentSubcat.sampleImage;
    }
    // 4. Main category sample image
    else if (Dashboard._currentMainCatId) {
      const cats = Dashboard._getDesignCats();
      const mainCat = cats.find(c => c.id === Dashboard._currentMainCatId);
      if (mainCat && mainCat.sampleImage) sampleUrl = mainCat.sampleImage;
    }

    if (sampleUrl) {
      img.src = sampleUrl;
      box.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
      img.src = '';
    }
  },

  updateBasePrice() {
    var total = 0;
    var colorEl = document.getElementById('color-count');
    var colorVal = colorEl ? String(colorEl.value) : '';

    // 1. Check per-color price (highest priority)
    if (colorVal && Dashboard._currentSubcat && Dashboard._currentSubcat.colorPrices && Dashboard._currentSubcat.colorPrices[colorVal]) {
      total = Dashboard._currentSubcat.colorPrices[colorVal];
    }
    // 2. Subcategory base price × color count
    else if (Dashboard._currentSubcat && Dashboard._currentSubcat.basePrice) {
      total = Dashboard._currentSubcat.basePrice;
      var cv = parseInt(colorVal) || 1;
      if (cv > 1) total = total * cv;
    }
    // 3. Main category base price
    else if (Dashboard._currentMainCatId) {
      var cats = Dashboard._getDesignCats();
      var mc = cats.find(function(c) { return c.id === Dashboard._currentMainCatId; });
      if (mc && mc.basePrice) total = mc.basePrice;
    }

    var el = document.getElementById('base-price');
    if (el) el.textContent = formatPrice(total) + ' تومان';
    Dashboard._currentBasePrice = total;
  },

  addOrderToCart() {
    const mainCat  = document.getElementById('main-cat');
    const prodType = document.getElementById('product-type');
    const execMeth = document.getElementById('exec-method');
    const colorCnt = document.getElementById('color-count');
    const qty      = parseInt(document.getElementById('order-qty').value) || 1;

    if (!mainCat?.value) { toast(State.lang === 'fa' ? 'لطفاً دسته اصلی را انتخاب کنید' : 'Please select a main category', 'warning'); return; }

    const mainName = mainCat.options[mainCat.selectedIndex].text;
    const typeName = prodType?.value ? prodType.options[prodType.selectedIndex].text : '';
    const execName = execMeth?.value ? execMeth.options[execMeth.selectedIndex].text : '';
    const colors   = colorCnt?.value ? `${colorCnt.options[colorCnt.selectedIndex].text}` : '';
    const name     = [mainName, typeName, execName, colors].filter(Boolean).join(' / ');
    const price    = (Dashboard._currentBasePrice || 0) * qty;

    Cart.addOrderItem({
      id:    `order-${Date.now()}`,
      name,
      price: Dashboard._currentBasePrice || 0,
      qty,
      meta:  { mainCat: mainCat.value, productType: prodType?.value, execMethod: execMeth?.value, colors: colorCnt?.value }
    });
  },

  // ─── Printer's orders ─────────────────────────────────────
  async loadPrinterOrders() {
    const el = document.getElementById('printer-orders-list');
    if (!el || !State.user) return;
    try {
      const { data } = await supabase
        .from('orders').select('*')
        .eq('user_id', State.user.id)
        .order('created_at', { ascending: false }).limit(10);
      if (!data?.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noOrdersYet')}</p>`; return; }
      el.innerHTML = data.map(o => `
        <div class="ticket-item">
          <div class="flex-between">
            <span style="font-weight:600">#${o.tracking_code || o.id.slice(0,8)}</span>
            <span class="design-status status-${o.status}">${t(o.status)}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.3rem">
            ${formatPrice(o.final_amount || o.total_amount)} — ${formatDate(o.created_at)}
          </div>
          <button class="btn btn-sm btn-ghost" style="margin-top:0.4rem"
            onclick="document.getElementById('tracking-code-input').value='${o.tracking_code}';Router.navigate('tracking');setTimeout(Tracking.search,300)">
            🔍 ${t('track')}
          </button>
        </div>
      `).join('');
    } catch (err) { console.warn(err); }
  },

  // ─── Purchase history (marketplace designs) ───────────────
  async loadPurchaseHistory() {
    const el = document.getElementById('purchase-history');
    if (!el || !State.user) return;
    try {
      const { data } = await supabase
        .from('orders').select('*')
        .eq('user_id', State.user.id)
        .in('status', ['contacted','processing','shipped','delivered'])
        .order('created_at', { ascending: false }).limit(20);
      if (!data?.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noPurchasesYet')}</p>`; return; }
      el.innerHTML = data.map(o => `
        <div class="ticket-item">
          <div class="flex-between">
            <span>#${o.tracking_code || o.id.slice(0,8)}</span>
            <span class="design-status status-${o.status}">${t(o.status)}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">
            ${formatPrice(o.final_amount || o.total_amount)} — ${formatDate(o.created_at)}
          </div>
        </div>
      `).join('');
    } catch (err) { console.warn(err); }
  }
};

  
  /* ═══════════════════════════════════════════════════
     STOCK IMAGES for Designer Dashboard
  ════════════════════════════════════════════════════ */
  var _stockImages = [];
  var _stockFiltered = [];
  async function loadStockImages() {
    const grid = document.getElementById('stock-images-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="dash-skeleton"></div>'.repeat(4);
    
    try {
      const { data, error } = await supabase
        .from('stock_images')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        grid.innerHTML = '<p class="empty-state">هنوز تصویری در دسترس نیست — مدیر به‌زودی اضافه می‌کند</p>';
        return;
      }
      
      _stockImages = data || [];
      _stockFiltered = [..._stockImages];
      _renderStockGrid();
      
    } catch (err) {
      console.warn('Stock images load error:', err);
      grid.innerHTML = '<p class="empty-state">خطا در بارگذاری تصاویر</p>';
    }
  }
  
  function filterStock(category, btn) {
    if (btn) {
      btn.closest('.stock-filters').querySelectorAll('.stock-filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    }
    var search = (document.getElementById('dash-stock-search') || {}).value || '';
    search = search.toLowerCase();
    var cat = category || 'all';
    _stockFiltered = _stockImages.filter(function(img) {
      var matchCat = cat === 'all' || (img.category || '').toLowerCase() === cat;
      var matchSearch = !search || (img.title || '').toLowerCase().indexOf(search) >= 0 || (img.category || '').toLowerCase().indexOf(search) >= 0;
      return matchCat && matchSearch;
    });
    _renderStockGrid();
  }

  function _renderStockGrid() {
    var grid = document.getElementById('stock-images-grid');
    if (!grid) return;
    var data = _stockFiltered;
    if (!data || data.length === 0) {
      grid.innerHTML = '<p class="empty-state">تصویری یافت نشد</p>';
      return;
    }
    grid.innerHTML = data.map(function(img) {
      return '<div class="stock-card" data-id="' + img.id + '">' +
        '<div class="stock-preview">' +
          '<img src="' + (img.preview_url || img.thumbnail_url) + '" alt="' + (img.title || '') + '" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-sm)" />' +
        '</div>' +
        '<h4 class="stock-title">' + (img.title || '').slice(0, 40) + '</h4>' +
        '<div class="stock-meta">' +
          '<span class="stock-price">' + (img.price || 100000).toLocaleString('fa-IR') + ' تومان</span>' +
          '' +
        '</div>' +
        '<div class="stock-actions">' +
          (img.price === 0 || !img.price) ? '<a href="' + (img.download_url || '#') + '" download class="btn btn-success btn-sm" style="flex:1;text-decoration:none;text-align:center">⬇️ دانلود رایگان</a>' : '<button class="btn btn-primary btn-sm" style="flex:1" onclick="StockImages.buy(\'' + img.id + '\')">🛒 خرید</button>' +
        '</div>' +
      '</div>';
    }).join('');
    var countEl = document.getElementById('stock-images-count');
    if (countEl) countEl.textContent = '(' + data.length + ')';
  }

  function buyStockImage(id) {
    if (typeof Cart === 'undefined') return;
    var imgData = _stockImages.find(function(i) { return i.id === id; }) || {};
    Cart.addItem({
      id: 'stock_' + id,
      type: 'stock_image',
      name: imgData.title || 'تصویر استوک',
      price: imgData.price || 0,
      thumbnail_url: imgData.thumbnail_url || '',
    });
    toast('افزودن به سبد خرید ✅', 'success');
    Router.navigate('cart');
  }
  
  function downloadStockOriginal(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    // Admin only can see original download
    const btn = card.querySelector('.stock-actions .btn-outline');
    if (btn) {
      btn.textContent = '⏳ در حال آماده‌سازی...';
      // Simulate download
      setTimeout(() => { toast('دانلود شروع شد 📥', 'success'); btn.textContent = '⬇️ فایل اصلی'; }, 2000);
    }
  }
  
  // Make stock functions accessible as Dashboard methods
  Dashboard.loadStockImages = loadStockImages;
  Dashboard.buyStockImage = buyStockImage;
  Dashboard.downloadStockOriginal = downloadStockOriginal;
  
  window.StockImages = { load: loadStockImages, buy: buyStockImage, download: downloadStockOriginal, filter: filterStock };
  
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof Router !== 'undefined') {
      const origNavigate = Router.navigate.bind(Router);
      Router.navigate = function(page, params) {
        origNavigate(page, params);
        if (page === 'designer-dashboard') {
          setTimeout(() => Dashboard.loadStockImages(), 500);
        }
      };
    }
  });
