/* ============================================================
   admin.js — Admin panel: stats, users, designs, orders,
              categories, menu, theme, content, blog, faq, tickets
   ============================================================ */

const Admin = {
  _currentTab: 'stats',

  // ─── Guard ────────────────────────────────────────────────
  async load() {
    if (!State.user || State.user.role !== 'admin') {
      toast(t('unauthorized'), 'error');
      Router.navigate('home'); return;
    }
    Admin.translateTabs();
    Admin.showTab('stats');
  },

  translateTabs() {
    const titleEl = document.querySelector('#page-admin .section-title');
    if (titleEl) titleEl.textContent = t('adminPanel');

    const tabKeys = ['statsTab','mediaTab','usersTab','designsTab','ordersTab','categoriesTab','menuTab','themeTab','contentTab','blogTab','faqTab','ticketsTab'];
    document.querySelectorAll('.admin-tabs .tab-btn').forEach((btn, i) => {
      if (tabKeys[i]) btn.textContent = t(tabKeys[i]);
    });
  },

  // ─── Tab switcher ─────────────────────────────────────────
  showTab(tab) {
    Admin._currentTab = tab;
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    const idx = ['stats','media','users','designs','orders','design-categories','menu','theme','content','blog','faq','tickets','stock','agent','payment'].indexOf(tab);
    const btns = document.querySelectorAll('.admin-tabs .tab-btn');
    if (btns[idx]) btns[idx].classList.add('active');

    const content = document.getElementById('admin-content');
    if (!content) return;
    content.innerHTML = '<div class="flex-center py-4"><div class="spinner"></div></div>';

    switch(tab) {
      case 'stats':      Admin.renderStats();      break;
      case 'media':      Admin.renderMedia();      break;
      case 'users':      Admin.renderUsers();      break;
      case 'designs':    Admin.renderDesigns();    break;
      case 'orders':     Admin.renderOrders();     break;
      case 'categories': Admin.renderCategories(); break;
      case 'design-categories': Admin.renderDesignCategories(); break;
      case 'menu':       Admin.renderMenu();       break;
      case 'theme':      Admin.renderTheme();      break;
      case 'content':    Admin.renderContent();    break;
      case 'blog':       Admin.renderBlog();       break;
      case 'faq':        Admin.renderFaq();        break;
      case 'tickets':    Admin.renderTickets();    break;
      case 'agent':      Agent.render();          break;
      case 'payment':    Agent.renderPayment();    break;
      case 'stock':      Admin.renderStockPrices(); break;
    }
  },

  // ═══════════════════════════════════════
  //  STATS
  // ═══════════════════════════════════════
  async renderStats() {
    const el = document.getElementById('admin-content');
    try {
      const [
        { count: totalUsers },
        { count: totalOrders },
        { count: totalDesigns },
        { count: guestOrders },
        { data: roleBreak }
      ] = await Promise.all([
        supabase.from('users').select('*', { count:'exact', head:true }),
        supabase.from('orders').select('*', { count:'exact', head:true }),
        supabase.from('designs').select('*', { count:'exact', head:true }),
        supabase.from('orders').select('*', { count:'exact', head:true }).eq('is_guest', true),
        supabase.from('users').select('role')
      ]);

      const roles = (roleBreak||[]).reduce((acc,u) => { acc[u.role]=(acc[u.role]||0)+1; return acc; }, {});

      el.innerHTML = `
        <h3 style="margin-bottom:1.5rem">${t('overallStats')}</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem">
          ${[
            [t('totalUsers'), totalUsers||0, '👥'],
            [t('totalOrdersLabel'), totalOrders||0, '📦'],
            [t('totalDesignsLabel'), totalDesigns||0, '🎨'],
            [t('guestOrdersLabel'), guestOrders||0, '👤'],
          ].map(([label, val, icon]) => `
            <div class="stat-card glass">
              <div class="stat-number" style="font-size:2rem">${icon} ${toFarsiNum(val)}</div>
              <div class="stat-label">${label}</div>
            </div>
          `).join('')}
        </div>
        <div>
          <h4 style="margin-bottom:1rem">${t('roleBreakdown')}</h4>
          ${[
            [t('admin'), roles.admin||0, 'badge-danger'],
            [t('designer'), roles.designer||0, 'badge-info'],
            [t('printer'), roles.printer||0, 'badge-success'],
          ].map(([label, val, cls]) => `
            <div class="flex-between" style="padding:0.75rem;border-bottom:1px solid var(--border)">
              <span>${label}</span>
              <span class="badge ${cls}">${toFarsiNum(val)}</span>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
  },

  // ═══════════════════════════════════════
  //  MEDIA (logo + banner)
  // ═══════════════════════════════════════
  async renderMedia() {
    const el = document.getElementById('admin-content');
    // Load current values from DB
    let currentLogo = '', currentBanner = '', claudeKey = '';
    try {
      const { data } = await supabase.from('settings').select('key,value')
        .in('key', ['logo_url','banner_url','gemini_api_key']);
      (data||[]).forEach(s => {
        if (s.key==='logo_url')       currentLogo   = s.value||'';
        if (s.key==='banner_url')     currentBanner = s.value||'';
        if (s.key==='gemini_api_key') claudeKey     = s.value||'';
      });
    } catch (err) { console.warn(err); }

    el.innerHTML = `
      <h3 style="margin-bottom:1.5rem">📁 ${t('mediaTab')}</h3>
      <div style="display:flex;flex-direction:column;gap:1.5rem">

        <!-- CLAUDE API KEY -->
        <div class="dash-card glass">
          <h4 style="margin-bottom:0.75rem">🤖 ${State.lang==='fa' ? 'کلید Gemini API (برای Content Agent — رایگان)' : 'Gemini API Key (for Content Agent — Free)'}</h4>
          <p style="font-size:0.8rem;color:var(--c-text-2);margin-bottom:1rem">
            ${State.lang==='fa'
              ? 'این کلید برای واردکردن خودکار مطالب به بلاگ استفاده می‌شود. رایگان از aistudio.google.com دریافت کنید.'
              : 'Used by Content Agent to auto-import blog posts. Get it free from aistudio.google.com'}
          </p>
          <div style="display:flex;gap:0.75rem;align-items:center">
            <input type="password" id="claude-key-input" class="input" style="flex:1;direction:ltr"
              placeholder="sk-ant-..." value="${claudeKey ? '●'.repeat(20) : ''}"
              onfocus="if(this.value.includes('●'))this.value=''" />
            <button class="btn btn-primary btn-sm" onclick="Admin.saveClaudeKey()">
              ${State.lang==='fa' ? 'ذخیره' : 'Save'}
            </button>
          </div>
          ${claudeKey ? `
            <p style="font-size:0.75rem;color:var(--c-ok);margin-top:0.5rem">
              ✓ ${State.lang==='fa' ? 'کلید ذخیره شده' : 'Key saved'}
            </p>
          ` : ''}
        </div>

        <!-- LOGO -->
        <div class="dash-card glass">
          <h4 style="margin-bottom:1rem">🏷️ ${t('siteLogo')}</h4>
          ${currentLogo ? `
            <div style="margin-bottom:1rem;padding:1rem;background:var(--c-surface);border-radius:var(--r-md);text-align:center">
              <img src="${currentLogo}" alt="logo" style="max-height:60px;max-width:180px;object-fit:contain" />
              <div style="font-size:0.75rem;color:var(--c-text-2);margin-top:0.5rem">${t('currentLogo')}</div>
            </div>
          ` : `<div style="padding:1rem;background:var(--c-surface);border-radius:var(--r-md);text-align:center;margin-bottom:1rem;color:var(--c-text-2);font-size:0.85rem">${State.lang === 'fa' ? 'هنوز لوگویی آپلود نشده' : 'No logo uploaded yet'}</div>`}
          <label class="label">${t('uploadNewLogo')} (PNG/SVG — ${State.lang === 'fa' ? 'حداکثر ۲MB' : 'max 2MB'})</label>
          <div style="display:flex;gap:0.75rem;align-items:center">
            <input type="file" id="logo-file" class="input" accept="image/*" style="flex:1" />
            <button class="btn btn-primary btn-sm" onclick="Admin.uploadLogo()">${t('upload')}</button>
          </div>
          <p style="font-size:0.78rem;color:var(--c-text-2);margin-top:0.5rem">
            ⓘ ${State.lang === 'fa' ? 'پس از آپلود، لوگو بلافاصله در هدر سایت نمایش داده می‌شود.' : 'After upload, the logo immediately appears in the site header.'}
          </p>
        </div>

        <!-- BANNER -->
        <div class="dash-card glass">
          <h4 style="margin-bottom:1rem">🖼️ ${t('homeBanner')}</h4>
          ${currentBanner ? `
            <div style="margin-bottom:1rem;border-radius:var(--r-md);overflow:hidden">
              <img src="${currentBanner}" alt="banner" style="width:100%;height:120px;object-fit:cover" />
              <div style="font-size:0.75rem;color:var(--c-text-2);margin-top:0.5rem;text-align:center">${t('currentBanner')}</div>
            </div>
          ` : `<div style="padding:1rem;background:var(--c-surface);border-radius:var(--r-md);text-align:center;margin-bottom:1rem;color:var(--c-text-2);font-size:0.85rem">${State.lang === 'fa' ? 'هنوز بنری آپلود نشده' : 'No banner uploaded yet'}</div>`}
          <label class="label">${t('uploadNewBanner')} (JPG/PNG — 1200×400px)</label>
          <div style="display:flex;gap:0.75rem;align-items:center">
            <input type="file" id="banner-file" class="input" accept="image/*" style="flex:1" />
            <button class="btn btn-primary btn-sm" onclick="Admin.uploadBanner()">${t('upload')}</button>
          </div>
          <div style="display:flex;gap:0.75rem;margin-top:0.75rem">
            <button class="btn btn-outline btn-sm" onclick="Router.navigate('home')">${t('viewInHome')}</button>
            ${currentBanner ? `<button class="btn btn-danger btn-sm" onclick="Admin.removeBanner()">${t('removeBanner')}</button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  async saveClaudeKey() {
    const input = document.getElementById('claude-key-input');
    const key = input?.value?.trim();
    if (!key || key.includes('●')) {
      toast(State.lang==='fa' ? 'لطفاً کلید را وارد کنید' : 'Please enter the key', 'warning');
      return;
    }
    try {
      await DB.upsert('settings', { key: 'gemini_api_key', value: key }, 'key');
      // ذخیره در sessionStorage برای استفاده فوری agent
      sessionStorage.setItem('nash_gemini_key', key);
      toast(State.lang==='fa' ? '✓ کلید Gemini API ذخیره شد' : '✓ Gemini API key saved', 'success');
      input.value = '●'.repeat(20);
    } catch(err) {
      toast(err.message, 'error');
    }
  },

  async uploadLogo() {
    const file = document.getElementById('logo-file')?.files[0];
    if (!file) { toast(t('selectFileWarning'), 'warning'); return; }
    if (file.size > 5 * 1024 * 1024) { toast(t('fileTooLarge'), 'error'); return; }
    showLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const url = await DB.uploadFile('logos', `logo.${ext}`, file);
      await DB.upsert('settings', { key:'logo_url', value: url }, 'key');
      const logo = document.getElementById('site-logo');
      if (logo) { logo.src = url; logo.style.display = 'block'; }
      toast(t('logoUploadSuccess'), 'success');
      Admin.renderMedia();
    } catch (err) { toast(err.message, 'error'); }
    finally { showLoading(false); }
  },

  async uploadBanner() {
    const file = document.getElementById('banner-file')?.files[0];
    if (!file) { toast(t('selectFileWarning'), 'warning'); return; }
    showLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const url = await DB.uploadFile('banners', `banner.${ext}`, file);
      await DB.upsert('settings', { key:'banner_url', value: url }, 'key');
      const img = document.getElementById('hero-img');
      if (img) { img.src = url; img.style.display = 'block'; }
      toast(t('bannerUploadSuccess'), 'success');
      Admin.renderMedia();
    } catch (err) { toast(err.message, 'error'); }
    finally { showLoading(false); }
  },

  async removeBanner() {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await DB.upsert('settings', { key:'banner_url', value: '' }, 'key');
      const img = document.getElementById('hero-img');
      if (img) { img.src = ''; img.style.display = 'none'; }
      toast(t('bannerRemoved'), 'info');
      Admin.renderMedia();
    } catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  USERS
  // ═══════════════════════════════════════
  async renderUsers() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>${t('manageUsersTitle')} (${toFarsiNum(data?.length||0)})</h3>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr>
              <th>${t('nameCol')}</th><th>${t('emailCol')}</th><th>${t('roleCol')}</th><th>${t('joinDateCol')}</th><th>${t('statusCol')}</th><th>${t('actionsCol')}</th>
            </tr></thead>
            <tbody>
              ${(data||[]).map(u => `<tr>
                <td>${u.name || '—'}</td>
                <td style="direction:ltr;text-align:right">${u.email}</td>
                <td>
                  <select class="input select" style="padding:0.3rem 0.5rem;font-size:0.8rem"
                    onchange="Admin.changeRole('${u.id}',this.value)">
                    ${['admin','designer','printer'].map(r =>
                      `<option value="${r}" ${u.role===r?'selected':''}>${t(r)}</option>`
                    ).join('')}
                  </select>
                </td>
                <td>${formatDate(u.created_at)}</td>
                <td><span class="badge ${u.is_active ? 'badge-success':'badge-danger'}">${u.is_active?t('activeStatus'):t('inactiveStatus')}</span></td>
                <td style="display:flex;gap:0.5rem;flex-wrap:wrap">
                  ${u.role === 'designer' ? `<button class="btn btn-sm btn-outline" onclick="Portfolio.viewPublic('${u.id}')">🎨 ${State.lang === 'fa' ? 'پورتفولیو' : 'Portfolio'}</button>` : ''}
                  <button class="btn btn-sm btn-ghost" onclick="Admin.toggleUser('${u.id}',${u.is_active})">${u.is_active?t('deactivateBtn'):t('activateBtn')}</button>
                  <button class="btn btn-sm btn-danger" onclick="Admin.deleteUser('${u.id}')">${t('delete')}</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  async changeRole(userId, role) {
    try {
      await DB.update('users', userId, { role });
      toast(t('roleChanged'), 'success');
    } catch (err) { toast(err.message, 'error'); }
  },

  async toggleUser(userId, current) {
    try {
      await DB.update('users', userId, { is_active: !current });
      toast(t('saveSuccess'), 'success');
      Admin.renderUsers();
    } catch (err) { toast(err.message, 'error'); }
  },

  async deleteUser(userId) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await DB.delete('users', userId);
      toast(t('userDeleted'), 'success');
      Admin.renderUsers();
    } catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  DESIGNS
  // ═══════════════════════════════════════
  async renderDesigns() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('designs').select('*').order('created_at', { ascending: false });
      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>${t('manageDesignsTitle')}</h3>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-sm btn-ghost" onclick="Admin._filterDesigns('all')">${t('allFilter')}</button>
            <button class="btn btn-sm btn-ghost" onclick="Admin._filterDesigns('pending')">${t('pendingFilter')}</button>
            <button class="btn btn-sm btn-ghost" onclick="Admin._filterDesigns('approved')">${t('approvedFilter')}</button>
            <button class="btn btn-sm btn-ghost" onclick="Admin._filterDesigns('rejected')">${t('rejectedFilter')}</button>
          </div>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="designs-admin-table">
            <thead><tr>
              <th>${t('imageCol')}</th><th>${t('titleCol')}</th><th>${t('designerCol')}</th><th>${t('priceCol')}</th><th>${t('statusCol')}</th><th>${t('salesCol')}</th><th>${t('actionsCol')}</th>
            </tr></thead>
            <tbody>
              ${(data||[]).map(d => `<tr data-status="${d.status}">
                <td>${d.thumbnail_url ? `<img src="${d.thumbnail_url}" style="width:48px;height:48px;object-fit:cover;border-radius:6px" />` : '🎨'}</td>
                <td>${d.title||'—'}</td>
                <td>${d.designer_name||'—'}</td>
                <td>${formatPrice(d.price||0)}</td>
                <td><span class="design-status status-${d.status}">${t(d.status)}</span></td>
                <td>${toFarsiNum(d.sales_count||0)}</td>
                <td style="display:flex;gap:0.4rem;flex-wrap:wrap">
                  ${d.status!=='approved' ? `<button class="btn btn-sm btn-success" onclick="Admin.approveDesign('${d.id}')">✅</button>` : ''}
                  ${d.status!=='rejected' ? `<button class="btn btn-sm btn-danger" onclick="Admin.rejectDesign('${d.id}')">❌</button>` : ''}
                  <button class="btn btn-sm btn-ghost" onclick="Marketplace.openDesign('${d.id}')">👁️</button>
                  <button class="btn btn-sm btn-danger" onclick="Admin.deleteDesign('${d.id}')">🗑️</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  _filterDesigns(status) {
    document.querySelectorAll('#designs-admin-table tbody tr').forEach(row => {
      row.style.display = (status === 'all' || row.getAttribute('data-status') === status) ? '' : 'none';
    });
  },

  async approveDesign(id) {
    try {
      await DB.update('designs', id, { status: 'approved', updated_at: new Date().toISOString() });
      toast(t('designApproved'), 'success');
      if (Admin._currentTab === 'designs') Admin.renderDesigns();
      Modal.close('design');
    } catch (err) { toast(err.message, 'error'); }
  },

  async rejectDesign(id) {
    try {
      await DB.update('designs', id, { status: 'rejected', updated_at: new Date().toISOString() });
      toast(t('designRejected'), 'info');
      if (Admin._currentTab === 'designs') Admin.renderDesigns();
      Modal.close('design');
    } catch (err) { toast(err.message, 'error'); }
  },

  async deleteDesign(id) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await DB.delete('designs', id);
      toast(t('deleteSuccess'), 'success');
      Modal.close('design');
      if (Admin._currentTab === 'designs') Admin.renderDesigns();
    } catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  ORDERS
  // ═══════════════════════════════════════
  async renderOrders() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      Admin._ordersData = data || [];

      const platformLabels = { telegram: '✈️ ' + t('telegram'), bale: '🔵 ' + t('bale'), rubika: '🟣 ' + t('rubika') };

      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>${t('manageOrdersTitle')} (${toFarsiNum(data?.length||0)})</h3>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-sm btn-ghost" onclick="Admin._filterOrders('all')">${t('allFilter')}</button>
            <button class="btn btn-sm btn-ghost" onclick="Admin._filterOrders('pending_review')">${t('pending_review')}</button>
          </div>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="orders-admin-table">
            <thead><tr>
              <th>${t('trackingCol')}</th><th>${t('nameCol')}</th><th>${t('phoneCol')}</th><th>${t('amountCol')}</th><th>${t('statusCol')}</th><th>${t('contactPlatform')}</th><th>${t('typeCol')}</th><th>${t('dateCol')}</th><th>${t('actionsCol')}</th>
            </tr></thead>
            <tbody>
              ${(data||[]).map(o => `<tr data-status="${o.status}">
                <td style="font-size:0.8rem">${o.tracking_code||o.id.slice(0,8)}</td>
                <td>${o.user_name||o.guest_name||'—'}</td>
                <td style="direction:ltr;text-align:right">${o.user_phone||'—'}</td>
                <td>${formatPrice(o.final_amount||o.total_amount||0)}</td>
                <td>
                  ${o.status === 'pending_review' ? `
                    <span class="design-status status-pending_review">${t('pending_review')}</span>
                  ` : `
                    <select class="input select" style="padding:0.3rem 0.5rem;font-size:0.78rem"
                      onchange="Admin.changeOrderStatus('${o.id}',this.value)">
                      ${['contacted','processing','shipped','delivered','cancelled'].map(s =>
                        `<option value="${s}" ${o.status===s?'selected':''}>${t(s)}</option>`
                      ).join('')}
                    </select>
                  `}
                </td>
                <td>${o.contact_platform ? `<span class="badge badge-info">${platformLabels[o.contact_platform] || o.contact_platform}</span>` : '—'}</td>
                <td>${o.is_guest ? `<span class="badge badge-info">${t('guestType')}</span>` : `<span class="badge badge-success">${t('memberType')}</span>`}</td>
                <td style="font-size:0.8rem">${formatDate(o.created_at)}</td>
                <td style="display:flex;gap:0.4rem;flex-wrap:wrap">
                  ${o.status === 'pending_review' ? `
                    <button class="btn btn-sm btn-primary" onclick="Admin.openApproveOrder('${o.id}')">✅ ${t('approveAndContact')}</button>
                  ` : ''}
                  <button class="btn btn-sm btn-danger" onclick="Admin.deleteOrder('${o.id}')">🗑️</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- Approve + contact platform inline panel -->
        <div id="approve-order-panel" class="hidden" style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:1.25rem;margin-top:1.25rem">
          <h4 style="margin-bottom:1rem">${t('selectContactPlatform')}</h4>
          <input type="hidden" id="approve-order-id" value="" />
          <div class="role-select" style="margin-bottom:1rem">
            <button class="role-btn" data-platform="telegram" onclick="Admin.selectContactPlatform('telegram')">✈️ ${t('telegram')}</button>
            <button class="role-btn" data-platform="bale" onclick="Admin.selectContactPlatform('bale')">🔵 ${t('bale')}</button>
            <button class="role-btn" data-platform="rubika" onclick="Admin.selectContactPlatform('rubika')">🟣 ${t('rubika')}</button>
          </div>
          <label class="label">${t('contactNote')}</label>
          <textarea id="approve-order-note" class="input" rows="2" placeholder="${t('contactNotePlaceholder')}"></textarea>
          <div style="display:flex;gap:0.5rem;margin-top:1rem">
            <button class="btn btn-success btn-sm" onclick="Admin.confirmApproveOrder()">✅ ${t('confirm')}</button>
            <button class="btn btn-ghost btn-sm" onclick="Admin.closeApproveOrder()">${t('cancel')}</button>
          </div>
        </div>
      `;
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  _filterOrders(status) {
    document.querySelectorAll('#orders-admin-table tbody tr').forEach(row => {
      row.style.display = (status === 'all' || row.getAttribute('data-status') === status) ? '' : 'none';
    });
  },

  _selectedContactPlatform: null,

  openApproveOrder(orderId) {
    document.getElementById('approve-order-id').value = orderId;
    document.getElementById('approve-order-note').value = '';
    Admin._selectedContactPlatform = null;
    document.querySelectorAll('#approve-order-panel .role-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('approve-order-panel').classList.remove('hidden');
    document.getElementById('approve-order-panel').scrollIntoView({ behavior:'smooth', block:'nearest' });
  },

  closeApproveOrder() {
    document.getElementById('approve-order-panel').classList.add('hidden');
  },

  selectContactPlatform(platform) {
    Admin._selectedContactPlatform = platform;
    document.querySelectorAll('#approve-order-panel .role-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-platform') === platform);
    });
  },

  async confirmApproveOrder() {
    const orderId = document.getElementById('approve-order-id').value;
    const note     = document.getElementById('approve-order-note').value.trim();
    const platform = Admin._selectedContactPlatform;

    if (!platform) { toast(t('selectContactPlatform'), 'warning'); return; }

    showLoading(true);
    try {
      await DB.update('orders', orderId, {
        status: 'contacted',
        contact_platform: platform,
        contact_note: note,
        updated_at: new Date().toISOString()
      });

      // Now that the order is approved, increment sales_count for any
      // marketplace designs included in this order (deferred from checkout).
      const order = (Admin._ordersData || []).find(o => o.id === orderId);
      if (order?.items) {
        const designItems = order.items.filter(i => i.type === 'design');
        for (const item of designItems) {
          try {
            const { data: d } = await supabase.from('designs').select('sales_count').eq('id', item.id).single();
            await supabase.from('designs').update({ sales_count: (d?.sales_count || 0) + 1 }).eq('id', item.id);
          } catch (err) { console.warn(err); }
        }
      }

      toast(t('orderStatusChanged'), 'success');
      Admin.closeApproveOrder();
      Admin.renderOrders();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      showLoading(false);
    }
  },

  async changeOrderStatus(id, status) {
    try {
      await DB.update('orders', id, { status, updated_at: new Date().toISOString() });
      toast(t('orderStatusChanged'), 'success');
    } catch (err) { toast(err.message, 'error'); }
  },

  async deleteOrder(id) {
    if (!confirm(t('confirmDelete'))) return;
    try { await DB.delete('orders', id); toast(t('deleteSuccess'), 'success'); Admin.renderOrders(); }
    catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  CATEGORIES
  // ═══════════════════════════════════════
  async renderCategories() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('categories').select('*').order('name');
      Admin._catData = data || [];
      const parentOptions = (data||[]).filter(c=>!c.parent_id)
        .map(c=>`<option value="${c.id}">${c.name}</option>`).join('');

      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>${t('categoriesTitle')} (${toFarsiNum(data?.length||0)})</h3>
          <button class="btn btn-primary btn-sm" onclick="Admin.showCatForm()">${t('addNewCategory')}</button>
        </div>

        <!-- فرم افزودن / ویرایش -->
        <div id="cat-form" class="hidden" style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:1.25rem;margin-bottom:1.25rem">
          <h4 id="cat-form-title" style="margin-bottom:1rem;font-size:0.95rem">${t('addNewCategory')}</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">
            <div>
              <label class="label">${t('categoryNameLabel')}</label>
              <input id="cat-name" type="text" class="input" placeholder="${State.lang === 'fa' ? 'مثال: چاپ دیجیتال' : 'e.g. Digital Print'}" />
            </div>
            <div>
              <label class="label">${t('basePriceLabel')}</label>
              <input id="cat-base-price" type="number" class="input" placeholder="${State.lang === 'fa' ? 'مثال: 500000' : 'e.g. 500000'}" />
            </div>
            <div>
              <label class="label">${t('parentCategoryLabel')}</label>
              <select id="cat-parent" class="input select">
                <option value="">${t('noOption')}</option>
                ${parentOptions}
              </select>
            </div>
            <div>
              <label class="label">${t('optionalDesc')}</label>
              <input id="cat-desc" type="text" class="input" placeholder="${t('shortDescPlaceholder')}" />
            </div>
          </div>
          <input type="hidden" id="cat-edit-id" value="" />
          <div style="display:flex;gap:0.75rem">
            <button class="btn btn-success btn-sm" onclick="Admin.saveCategory()">💾 ${t('save')}</button>
            <button class="btn btn-ghost btn-sm" onclick="Admin.closeCatForm()">${t('cancel')}</button>
          </div>
        </div>

        <!-- جدول دسته‌بندی‌ها -->
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>${t('categoryNameCol')}</th>
                <th>${t('parentCol')}</th>
                <th>${t('basePriceLabel')}</th>
                <th>${t('subcatsCol')}</th>
                <th>${t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody>
              ${(data||[]).map(c => {
                const parent   = data.find(p => p.id === c.parent_id);
                const children = data.filter(ch => ch.parent_id === c.id).length;
                return `<tr id="cat-row-${c.id}">
                  <td style="font-weight:600">${c.name}</td>
                  <td>${parent?.name || `<span style="color:var(--text-secondary)">${t('mainCategoryLabel')}</span>`}</td>
                  <td style="color:var(--accent);font-weight:700">${c.base_price ? formatPrice(c.base_price) : '—'}</td>
                  <td>${children ? `<span class="badge badge-info">${toFarsiNum(children)} ${t('subcatLabel')}</span>` : '—'}</td>
                  <td style="display:flex;gap:0.4rem;flex-wrap:wrap">
                    <button class="btn btn-sm btn-outline" onclick="Admin.editCategory('${c.id}')">✏️ ${t('edit')}</button>
                    ${!c.parent_id ? `<button class="btn btn-sm btn-ghost" onclick="Admin.openCategorySamples('${c.id}')">🖼️ ${t('sampleImage')}</button>` : ''}
                    <button class="btn btn-sm btn-danger"  onclick="Admin.deleteCategory('${c.id}')">🗑️</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  showCatForm(title) {
    document.getElementById('cat-form').classList.remove('hidden');
    document.getElementById('cat-form-title').textContent = title || t('addNewCategory');
    document.getElementById('cat-form').scrollIntoView({ behavior:'smooth', block:'nearest' });
  },

  closeCatForm() {
    document.getElementById('cat-form').classList.add('hidden');
    document.getElementById('cat-edit-id').value  = '';
    document.getElementById('cat-name').value      = '';
    document.getElementById('cat-base-price').value= '';
    document.getElementById('cat-parent').value    = '';
    document.getElementById('cat-desc').value      = '';
  },

  editCategory(id) {
    const c = (Admin._catData||[]).find(x => x.id === id);
    if (!c) return;
    Admin.showCatForm(t('editCategoryTitle'));
    document.getElementById('cat-edit-id').value   = c.id;
    document.getElementById('cat-name').value      = c.name       || '';
    document.getElementById('cat-base-price').value= c.base_price || '';
    document.getElementById('cat-parent').value    = c.parent_id  || '';
    document.getElementById('cat-desc').value      = c.description|| '';
  },

  async saveCategory() {
    const name       = document.getElementById('cat-name').value.trim();
    const base_price = parseFloat(document.getElementById('cat-base-price').value) || 0;
    const parent_id  = document.getElementById('cat-parent').value || null;
    const description= document.getElementById('cat-desc').value.trim();
    const editId     = document.getElementById('cat-edit-id').value;

    if (!name) { toast(t('categoryNameRequired'), 'warning'); return; }

    showLoading(true);
    try {
      if (editId) {
        await DB.update('categories', editId, { name, base_price, parent_id, description });
        toast(t('categoryEditSuccess'), 'success');
      } else {
        await DB.insert('categories', { name, base_price, parent_id, description, created_at: new Date().toISOString() });
        toast(t('categoryAddSuccess'), 'success');
      }
      Admin.closeCatForm();
      Admin.renderCategories();
    } catch (err) { toast(err.message, 'error'); }
    finally { showLoading(false); }
  },

  async deleteCategory(id) {
    const c = (Admin._catData||[]).find(x => x.id === id);
    const children = (Admin._catData||[]).filter(x => x.parent_id === id).length;
    if (children > 0) {
      toast(t('categoryHasChildren'), 'warning');
      return;
    }
    if (!confirm(`${t('confirmCategoryDelete')} (${c?.name})`)) return;
    try {
      await DB.delete('categories', id);
      toast(t('deleteSuccess'), 'success');
      Admin.renderCategories();
    } catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  CATEGORY SAMPLE IMAGES (به ازای دسته اصلی + تعداد رنگ)
  // ═══════════════════════════════════════
  async openCategorySamples(categoryId) {
    const cat = (Admin._catData||[]).find(c => c.id === categoryId);
    if (!cat) return;
    Admin._sampleCategoryId = categoryId;

    const el = document.getElementById('admin-content');
    let images = [];
    try {
      const { data } = await supabase.from('category_color_images').select('*').eq('category_id', categoryId);
      images = data || [];
    } catch (err) { console.warn(err); }

    const defaultLabel = cc => cc === 4 ? t('fullColor') : `${cc} ${t('colorUnit')}`;

    el.innerHTML = `
      <button class="btn btn-ghost btn-sm" style="margin-bottom:1rem" onclick="Admin.renderCategories()">← ${t('back')}</button>
      <h3 style="margin-bottom:0.25rem">🖼️ ${t('sampleImagesFor')} «${cat.name}»</h3>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem">
        ${t('sampleImageDesc')}
      </p>
      <div class="category-samples-grid">
        ${[1,2,3,4,5,6,7,8].map(cc => {
          const existing = images.find(img => img.color_count === cc);
          const label = existing?.label || defaultLabel(cc);
          const extraPrice = existing?.extra_price || 0;
          return `
            <div class="dash-card glass">
              <input type="text" id="sample-label-${cc}" class="input" style="margin-bottom:0.5rem;font-weight:700"
                     value="${label}" placeholder="${t('colorLabelPlaceholder')||'برچسب (مثلاً ۲ رنگ)'}" />
              ${existing ? `
                <img src="${existing.image_url}" alt="${label}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius);margin-bottom:0.75rem" />
              ` : `
                <div style="width:100%;aspect-ratio:4/3;background:var(--bg-secondary);border-radius:var(--radius);margin-bottom:0.75rem;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:0.85rem">
                  ${t('noImage')}
                </div>
              `}
              <label class="label" style="font-size:0.75rem">${t('extraPrice')||'قیمت اضافه (تومان)'}</label>
              <input type="number" id="sample-price-${cc}" class="input" style="margin-bottom:0.5rem" value="${extraPrice}" min="0" />
              <input type="file" id="sample-file-${cc}" class="input" accept="image/*" style="margin-bottom:0.5rem" />
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-primary btn-sm" style="flex:1" onclick="Admin.uploadCategorySample(${cc})">${t('save')||t('upload')}</button>
                ${existing ? `<button class="btn btn-danger btn-sm" onclick="Admin.deleteCategorySample('${existing.id}', ${cc})">🗑️</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async uploadCategorySample(colorCount) {
    const fileEl  = document.getElementById(`sample-file-${colorCount}`);
    const labelEl = document.getElementById(`sample-label-${colorCount}`);
    const priceEl = document.getElementById(`sample-price-${colorCount}`);
    const file = fileEl?.files[0];
    const categoryId = Admin._sampleCategoryId;

    const payload = {
      category_id: categoryId,
      color_count: colorCount,
      label: labelEl?.value?.trim() || null,
      extra_price: parseFloat(priceEl?.value) || 0,
    };

    showLoading(true);
    try {
      if (file) {
        if (file.size > 5 * 1024 * 1024) { toast(t('thumbTooLarge'), 'error'); showLoading(false); return; }
        const ext = file.name.split('.').pop();
        const path = `${categoryId}/color-${colorCount}.${ext}`;
        payload.image_url = await DB.uploadFile('category-samples', path, file);
      } else {
        // اگه عکس جدید انتخاب نشده، عکس فعلی رو حفظ کن (در صورت وجود)
        const { data: existing } = await supabase
          .from('category_color_images').select('image_url')
          .eq('category_id', categoryId).eq('color_count', colorCount).maybeSingle();
        if (existing?.image_url) payload.image_url = existing.image_url;
        else { toast(t('selectFileWarning'), 'warning'); showLoading(false); return; }
      }

      await DB.upsert('category_color_images', payload, 'category_id,color_count');
      toast(t('saveSuccess'), 'success');
      Admin.openCategorySamples(categoryId);
    } catch (err) { toast(err.message, 'error'); }
    finally { showLoading(false); }
  },

  async deleteCategorySample(id, colorCount) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await DB.delete('category_color_images', id);
      toast(t('deleteSuccess'), 'success');
      Admin.openCategorySamples(Admin._sampleCategoryId);
    } catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  DESIGN CATEGORIES (Supabase-based)
  // ═══════════════════════════════════════
  _dcHeaders() {
    var key = (typeof SUPABASE_ANON !== 'undefined') ? SUPABASE_ANON : '';
    return {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };
  },
  _dcUrl: 'https://yeuyhsbzbrjxrxdulaiq.supabase.co/rest/v1/',

  async _dcGet(table, query) {
    var url = this._dcUrl + table + '?' + (query || 'select=*');
    var res = await fetch(url, { headers: this._dcHeaders() });
    if (!res.ok) throw new Error('DB error: ' + res.status);
    return await res.json();
  },

  async _dcPost(table, data) {
    var res = await fetch(this._dcUrl + table, {
      method: 'POST',
      headers: this._dcHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('DB error: ' + res.status);
    return await res.json();
  },

  async _dcPatch(table, data, filter) {
    var url = this._dcUrl + table + '?' + filter;
    var res = await fetch(url, {
      method: 'PATCH',
      headers: this._dcHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('DB error: ' + res.status);
    return await res.json();
  },

  async _dcDelete(table, filter) {
    var url = this._dcUrl + table + '?' + filter;
    var res = await fetch(url, {
      method: 'DELETE',
      headers: this._dcHeaders()
    });
    if (!res.ok) throw new Error('DB error: ' + res.status);
  },

  async _getDesignCats() {
    var base = this._dcUrl;
    var headers = this._dcHeaders();
    var [cats, subs, execs] = await Promise.all([
      this._dcGet('design_categories', 'select=*&order=sort_order'),
      this._dcGet('design_subcategories', 'select=*&order=sort_order'),
      this._dcGet('design_exec_methods', 'select=*&order=sort_order')
    ]);
    return cats.map(function(cat) {
      return {
        id: cat.id, name: cat.name, basePrice: cat.base_price || 0,
        sampleImage: cat.sample_image || '',
        subcategories: subs.filter(function(s) { return s.category_id === cat.id; }).map(function(sub) {
          var colorCounts = sub.color_counts;
          if (typeof colorCounts === 'string') { try { colorCounts = JSON.parse(colorCounts); } catch(e) { colorCounts = [1,2,3,4]; } }
          var colorPrices = sub.color_prices;
          if (typeof colorPrices === 'string') { try { colorPrices = JSON.parse(colorPrices); } catch(e) { colorPrices = {}; } }
          var colorImages = sub.color_images;
          if (typeof colorImages === 'string') { try { colorImages = JSON.parse(colorImages); } catch(e) { colorImages = {}; } }
          return {
            id: sub.id, name: sub.name, basePrice: sub.base_price || 0,
            sampleImage: sub.sample_image || '',
            colorCounts: colorCounts || [1,2,3,4],
            colorPrices: colorPrices || {},
            colorImages: colorImages || {},
            execMethods: execs.filter(function(e) { return e.subcategory_id === sub.id; }).map(function(em) {
              return { id: em.id, name: em.name, sampleImage: em.sample_image || '' };
            })
          };
        })
      };
    });
  },

  // ─── IMAGE UPLOAD HELPER ────────────────────────────
  _uploadSampleImage: function(file, callback) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('حجم عکس حداکثر ۵ مگابایت باشد', 'error'); return; }
    toast('در حال آپلود...', 'info');

    var path = 'design-samples/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    var bucket = 'design-samples';

    // Use XMLHttpRequest for reliable upload via REST API
    var xhr = new XMLHttpRequest();
    var supabaseUrl = 'https://yeuyhsbzbrjxrxdulaiq.supabase.co';
    var anonKey = (typeof supabase !== 'undefined' && supabase.supabaseKey) || '';

    // Try to get the key from the supabase client
    if (!anonKey) {
      // Fallback: read from config.js global
      try { anonKey = window.SUPABASE_ANON || ''; } catch(e) {}
    }
    if (!anonKey) {
      toast('کلید API یافت نشد', 'error');
      return;
    }

    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        var pct = Math.round((e.loaded / e.total) * 100);
        toast('آپلود: ' + pct + '%', 'info');
      }
    };
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 201) {
        var publicUrl = supabaseUrl + '/storage/v1/object/public/' + bucket + '/' + path;
        console.log('[Upload] success:', publicUrl);
        toast('عکس آپلود شد ✓', 'success');
        if (callback) callback(publicUrl);
      } else {
        console.error('[Upload] HTTP', xhr.status, xhr.responseText);
        toast('خطا در آپلود: ' + xhr.status, 'error');
      }
    };
    xhr.onerror = function() {
      console.error('[Upload] network error');
      toast('خطای شبکه در آپلود', 'error');
    };

    // Build FormData
    var fd = new FormData();
    fd.append('file', file, file.name);
    var uploadUrl = supabaseUrl + '/storage/v1/object/' + bucket + '/' + path;
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('Authorization', 'Bearer ' + anonKey);
    xhr.send(fd);
  },

  _makeUploadBtn: function(inputId, targetInputId) {
    return '<label for="' + inputId + '" class="btn btn-sm btn-ghost" style="cursor:pointer;font-size:0.8rem">📷 آپلود</label>' +
      '<input id="' + inputId + '" type="file" accept="image/*" style="display:none" onchange="Admin._handleUpload(this, \'' + targetInputId + '\')" />';
  },

  _handleUpload: function(fileInput, targetId) {
    var file = fileInput.files[0];
    if (!file) return;
    Admin._uploadSampleImage(file, function(url) {
      var el = document.getElementById(targetId);
      if (el) el.value = url;
    });
  },

  async _seedDesignCats() {
    var existing = await this._getDesignCats();
    if (existing.length > 0) return;
    var defaults = [
      {
        id: 'flexo', name: 'چاپ فلکسو', sampleImage: '',
        subcategories: [{
          id: 'packaging', name: 'بسته‌بندی', basePrice: 500000, colorCounts: [1,2,3,4],
          execMethods: [
            { id: 'from-photo', name: 'از روی عکس', sampleImage: '' },
            { id: 'from-sketch', name: 'از روی اتود', sampleImage: '' }
          ]
        }]
      },
      {
        id: 'offset', name: 'چاپ افست', sampleImage: '',
        subcategories: [{
          id: 'catalog', name: 'کاتالوگ', basePrice: 600000, colorCounts: [1,2,3,4],
          execMethods: [
            { id: 'from-photo', name: 'از روی عکس', sampleImage: '' },
            { id: 'from-sketch', name: 'از روی اتود', sampleImage: '' }
          ]
        }]
      },
      {
        id: 'digital', name: 'چاپ دیجیتال', sampleImage: '',
        subcategories: [{
          id: 'business-card', name: 'کارت ویزیت', basePrice: 300000, colorCounts: [1,2,3,4],
          execMethods: [
            { id: 'from-photo', name: 'از روی عکس', sampleImage: '' },
            { id: 'from-sketch', name: 'از روی اتود', sampleImage: '' }
          ]
        }]
      },
      {
        id: 'graphic-design', name: 'طراحی گرافیک', sampleImage: '',
        subcategories: [{
          id: 'logo', name: 'لوگو', basePrice: 800000, colorCounts: [1,2,3,4],
          execMethods: [
            { id: 'from-photo', name: 'از روی عکس', sampleImage: '' },
            { id: 'from-sketch', name: 'از روی اتود', sampleImage: '' }
          ]
        }]
      }
    ];
    for (var i = 0; i < defaults.length; i++) {
      var cat = defaults[i];
      await this._dcPost('design_categories', {
        id: cat.id, name: cat.name, sample_image: cat.sampleImage,
        base_price: 0, sort_order: i + 1
      });
      for (var j = 0; j < cat.subcategories.length; j++) {
        var sub = cat.subcategories[j];
        await this._dcPost('design_subcategories', {
          id: sub.id, category_id: cat.id, name: sub.name,
          base_price: sub.basePrice, color_counts: sub.colorCounts,
          color_prices: {}, color_images: {},
          sample_image: '', sort_order: j + 1
        });
        for (var k = 0; k < sub.execMethods.length; k++) {
          var em = sub.execMethods[k];
          await this._dcPost('design_exec_methods', {
            id: em.id, subcategory_id: sub.id, name: em.name,
            sample_image: em.sampleImage, sort_order: k + 1
          });
        }
      }
    }
  },

  async renderDesignCategories() {
    await Admin._seedDesignCats();
    if (typeof Dashboard !== 'undefined') Dashboard._designCatsCache = null;
    var el = document.getElementById('admin-content');
    var cats = await Admin._getDesignCats();

    var html = '<div style="margin-bottom:1.5rem">' +
      '<h3 style="margin-bottom:0.5rem">🎨 مدیریت دسته‌بندی طراحی</h3>' +
      '<p style="font-size:0.82rem;color:var(--text-secondary)">دسته‌بندی‌ها و زیرمجموعه‌ها را مدیریت کنید. تغییرات بلافاصله برای مشتریان اعمال می‌شود.</p>' +
      '</div>';

    html += '<div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap">' +
      '<button class="btn btn-primary btn-sm" onclick="Admin.addDesignCat()">+ دسته‌بندی جدید</button>' +
      '<button class="btn btn-outline btn-sm" onclick="Admin._seedDesignCats();Admin.renderDesignCategories()">🔄 بازنشانی پیش‌فرض</button>' +
      '</div>';

    html += '<div id="dc-add-form" class="hidden" style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:1.25rem;margin-bottom:1.25rem">' +
      '<h4 id="dc-form-title" style="margin-bottom:1rem;font-size:0.95rem">افزودن دسته‌بندی</h4>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div><label class="label">نام دسته‌بندی</label><input id="dc-name" type="text" class="input" placeholder="مثال: چاپ فلکسو" /></div>' +
        '<div><label class="label">آدرس تصویر نمونه (اختیاری)</label><input id="dc-sample-img" type="text" class="input" placeholder="https://..." style="direction:ltr;text-align:left" /></div>' +
      '</div>' +
      '<input type="hidden" id="dc-edit-id" value="" />' +
      '<div style="display:flex;gap:0.75rem">' +
        '<button class="btn btn-success btn-sm" onclick="Admin.saveDesignCat()">💾 ذخیره</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="Admin.closeDesignCatForm()">انصراف</button>' +
      '</div>' +
    '</div>';

    cats.forEach(function(cat) {
      var catId = cat.id;
      html += '<div class="dash-card glass" style="margin-bottom:1rem;padding:1.25rem">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem">';
      html += '<div style="display:flex;align-items:center;gap:0.75rem">';
      if (cat.sampleImage) {
        html += '<img src="' + cat.sampleImage + '" style="width:48px;height:48px;object-fit:cover;border-radius:8px" onerror="this.style.display=\'none\'" />';
      }
      html += '<div><h4 style="margin:0;font-size:1.05rem">' + cat.name + '</h4>';
      html += '<span style="font-size:0.78rem;color:var(--text-secondary)">' + (cat.subcategories||[]).length + ' زیرمجموعه</span></div>';
      html += '</div>';
      html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap">';
      html += '<button class="btn btn-sm btn-outline" onclick="Admin.editDesignCat(\'' + catId + '\')">✏️ ویرایش</button>';
      html += '<button class="btn btn-sm btn-success" onclick="Admin.addDesignSubcat(\'' + catId + '\')">+ زیرمجموعه</button>';
      html += '<button class="btn btn-sm btn-danger" onclick="Admin.deleteDesignCat(\'' + catId + '\')">🗑️</button>';
      html += '</div></div>';

      // Subcategories
      (cat.subcategories || []).forEach(function(sub) {
        var subId = sub.id;
        html += '<div style="background:var(--bg-secondary,rgba(255,255,255,0.03));border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem;border-right:3px solid var(--accent,#E06C2A)">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;flex-wrap:wrap;gap:0.5rem">';
        html += '<div>';
        html += '<strong style="font-size:0.95rem">' + sub.name + '</strong>';
        html += ' <span style="font-size:0.78rem;color:var(--accent)">قیمت پایه: ' + formatPrice(sub.basePrice || 0) + '</span>';
        html += '</div>';
        html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap">';
        html += '<button class="btn btn-sm btn-outline" onclick="Admin.editDesignSubcat(\'' + catId + '\',\'' + subId + '\')">✏️</button>';
        html += '<button class="btn btn-sm btn-danger" onclick="Admin.deleteDesignSubcat(\'' + catId + '\',\'' + subId + '\')">🗑️</button>';
        html += '</div></div>';

        // Sub-sub form for editing subcat (hidden by default)
        html += '<div id="dsc-form-' + catId + '-' + subId + '" class="hidden" style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem">';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">';
        html += '<div><label class="label">نام زیرمجموعه</label><input id="dsc-name-' + catId + '-' + subId + '" type="text" class="input" value="' + (sub.name||'') + '" /></div>';
        html += '<div><label class="label">قیمت پایه (تومان)</label><input id="dsc-price-' + catId + '-' + subId + '" type="number" class="input" value="' + (sub.basePrice||0) + '" /></div>';
        html += '<div style="grid-column:1/-1"><label class="label">تصویر نمونه کلی</label><div style="display:flex;gap:0.4rem;align-items:center"><input id="dsc-img-' + catId + '-' + subId + '" type="text" class="input" value="' + (sub.sampleImage||'') + '" style="direction:ltr;text-align:left;flex:1" placeholder="URL یا آپلود" />' + Admin._makeUploadBtn('up-gen-' + catId + '-' + subId, 'dsc-img-' + catId + '-' + subId) + '</div></div>';
        // Per-color images + prices
        var colorImgs = sub.colorImages || {};
        var colorPrices = sub.colorPrices || {};
        var colorCounts = sub.colorCounts || [1,2,3,4];
        html += '<div style="grid-column:1/-1"><label class="label" style="font-size:0.85rem">🎨 تصاویر و قیمت به ازای هر رنگ</label>';
        html += '<div style="display:grid;grid-template-columns:1fr;gap:0.5rem;margin-top:0.3rem">';
        colorCounts.forEach(function(cc) {
          var imgVal = colorImgs[cc] || '';
          var priceVal = colorPrices[cc] || '';
          var inputId = 'dsc-cimg-' + catId + '-' + subId + '-' + cc;
          var priceId = 'dsc-cprice-' + catId + '-' + subId + '-' + cc;
          var upId = 'up-c' + catId + '-' + subId + '-' + cc;
          html += '<div style="display:flex;align-items:center;gap:0.4rem;background:var(--glass-bg,rgba(255,255,255,0.03));border:1px solid var(--glass-border,rgba(255,255,255,0.1));border-radius:8px;padding:0.4rem 0.5rem">';
          html += '<span style="font-size:0.8rem;color:var(--accent);white-space:nowrap;min-width:45px;font-weight:bold">' + cc + ' رنگ:</span>';
          // Price input
          html += '<input id="' + priceId + '" type="number" class="input" value="' + priceVal + '" style="font-size:0.8rem;direction:ltr;text-align:left;padding:0.3rem;width:110px" placeholder="قیمت (تومان)" />';
          // Image input
          html += '<input id="' + inputId + '" type="text" class="input" value="' + imgVal + '" style="font-size:0.75rem;direction:ltr;text-align:left;padding:0.3rem;flex:1;min-width:0" placeholder="URL عکس" />';
          html += '<label for="' + upId + '" style="cursor:pointer;font-size:0.85rem;padding:0.3rem 0.5rem;background:var(--accent);border-radius:4px;color:#000;cursor:pointer">📷</label>';
          html += '<input id="' + upId + '" type="file" accept="image/*" style="display:none" onchange="Admin._handleUpload(this, \'' + inputId + '\')" />';
          html += '</div>';
        });
        html += '</div></div>';
        html += '</div>';
        html += '<div style="display:flex;gap:0.5rem;margin-top:0.75rem">';
        html += '<button class="btn btn-success btn-sm" onclick="Admin.saveDesignSubcat(\'' + catId + '\',\'' + subId + '\')">💾 ذخیره</button>';
        html += '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'dsc-form-' + catId + '-' + subId + '\').classList.add(\'hidden\')">انصراف</button>';
        html += '</div></div>';

        // Exec methods
        html += '<div style="margin-bottom:0.5rem"><span style="font-size:0.8rem;color:var(--text-secondary);margin-left:0.5rem">نحوه اجرا:</span>';
        html += '<button class="btn btn-sm btn-ghost" style="font-size:0.75rem" onclick="Admin.addDesignExecMethod(\'' + catId + '\',\'' + subId + '\')">+ افزودن</button></div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem">';
        (sub.execMethods || []).forEach(function(em) {
          html += '<span style="display:inline-flex;align-items:center;gap:0.4rem;background:var(--glass-bg,rgba(255,255,255,0.05));border:1px solid var(--glass-border,rgba(255,255,255,0.1));border-radius:20px;padding:0.3rem 0.7rem;font-size:0.8rem">';
          html += (em.sampleImage ? '<img src="' + em.sampleImage + '" style="width:16px;height:16px;border-radius:4px;object-fit:cover" onerror="this.style.display=\'none\'" />' : '📋');
          html += '<span>' + em.name + '</span>';
          html += '<button style="background:none;border:none;color:var(--danger,#ff4444);cursor:pointer;font-size:0.75rem;padding:0 2px" onclick="Admin.removeDesignExecMethod(\'' + catId + '\',\'' + subId + '\',\'' + em.id + '\')">✕</button>';
          html += '</span>';
        });
        html += '</div>';

        // Exec method add form (hidden)
        html += '<div id="dem-form-' + catId + '-' + subId + '" class="hidden" style="display:flex;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap">';
        html += '<input id="dem-name-' + catId + '-' + subId + '" type="text" class="input" placeholder="نام نحوه اجرا" style="flex:1;min-width:140px" />';
        html += '<input id="dem-img-' + catId + '-' + subId + '" type="text" class="input" placeholder="تصویر نمونه (URL)" style="flex:1;min-width:140px;direction:ltr" />';
        html += '<button class="btn btn-sm btn-success" onclick="Admin.saveDesignExecMethod(\'' + catId + '\',\'' + subId + '\')">✓</button>';
        html += '<button class="btn btn-sm btn-ghost" onclick="document.getElementById(\'dem-form-' + catId + '-' + subId + '\').classList.add(\'hidden\')">✕</button>';
        html += '</div>';

        // Color counts
        html += '<div style="margin-bottom:0.25rem"><span style="font-size:0.8rem;color:var(--text-secondary);margin-left:0.5rem">تعداد رنگ‌ها:</span>';
        html += '<button class="btn btn-sm btn-ghost" style="font-size:0.75rem" onclick="Admin.addDesignColorCount(\'' + catId + '\',\'' + subId + '\')">+ افزودن</button></div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:0.4rem">';
        (sub.colorCounts || []).forEach(function(cc) {
          html += '<span style="display:inline-flex;align-items:center;gap:0.3rem;background:var(--glass-bg,rgba(255,255,255,0.05));border:1px solid var(--glass-border,rgba(255,255,255,0.1));border-radius:20px;padding:0.3rem 0.6rem;font-size:0.8rem">';
          html += '<span>' + (cc === 4 ? '۴ رنگ (فول کالر)' : cc + ' رنگ') + '</span>';
          html += '<button style="background:none;border:none;color:var(--danger,#ff4444);cursor:pointer;font-size:0.75rem;padding:0 2px" onclick="Admin.removeDesignColorCount(\'' + catId + '\',\'' + subId + '\',' + cc + ')">✕</button>';
          html += '</span>';
        });
        html += '</div>';

        html += '</div>'; // end sub
      });

      html += '</div>'; // end card
    });

    el.innerHTML = html;
  },

  addDesignCat() {
    document.getElementById('dc-add-form').classList.remove('hidden');
    document.getElementById('dc-form-title').textContent = 'افزودن دسته‌بندی';
    document.getElementById('dc-name').value = '';
    document.getElementById('dc-sample-img').value = '';
    document.getElementById('dc-edit-id').value = '';
    document.getElementById('dc-add-form').scrollIntoView({ behavior:'smooth', block:'nearest' });
  },

  closeDesignCatForm() {
    document.getElementById('dc-add-form').classList.add('hidden');
    document.getElementById('dc-edit-id').value = '';
  },

  async editDesignCat(catId) {
    var cats = await Admin._getDesignCats();
    var cat = cats.find(function(c) { return c.id === catId; });
    if (!cat) return;
    document.getElementById('dc-add-form').classList.remove('hidden');
    document.getElementById('dc-form-title').textContent = 'ویرایش دسته‌بندی';
    document.getElementById('dc-name').value = cat.name || '';
    document.getElementById('dc-sample-img').value = cat.sampleImage || '';
    document.getElementById('dc-edit-id').value = catId;
  },

  async saveDesignCat() {
    var name = document.getElementById('dc-name').value.trim();
    var sampleImg = document.getElementById('dc-sample-img').value.trim();
    var editId = document.getElementById('dc-edit-id').value;
    if (!name) { toast('لطفاً نام دسته‌بندی را وارد کنید', 'warning'); return; }

    if (editId) {
      await Admin._dcPatch('design_categories',
        { name: name, sample_image: sampleImg },
        'id=eq.' + encodeURIComponent(editId)
      );
    } else {
      var slug = name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-]/g, '') || ('cat-' + Date.now());
      var existing = await Admin._dcGet('design_categories', 'select=sort_order&order=sort_order.desc&limit=1');
      var maxOrder = (existing.length > 0) ? (existing[0].sort_order || 0) + 1 : 1;
      await Admin._dcPost('design_categories', {
        id: slug, name: name, sample_image: sampleImg,
        base_price: 0, sort_order: maxOrder
      });
    }
    toast(editId ? 'دسته‌بندی ویرایش شد ✓' : 'دسته‌بندی اضافه شد ✓', 'success');
    Admin.closeDesignCatForm();
    Admin.renderDesignCategories();
  },

  async deleteDesignCat(catId) {
    var cats = await Admin._getDesignCats();
    var cat = cats.find(function(c) { return c.id === catId; });
    if (!confirm('حذف دسته‌بندی «' + (cat?.name || '') + '»؟')) return;
    for (var i = 0; i < (cat.subcategories || []).length; i++) {
      var sub = cat.subcategories[i];
      await Admin._dcDelete('design_exec_methods', 'subcategory_id=eq.' + encodeURIComponent(sub.id));
      await Admin._dcDelete('design_subcategories', 'id=eq.' + encodeURIComponent(sub.id));
    }
    await Admin._dcDelete('design_categories', 'id=eq.' + encodeURIComponent(catId));
    toast('حذف شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  async addDesignSubcat(catId) {
    var cats = await Admin._getDesignCats();
    var cat = cats.find(function(c) { return c.id === catId; });
    if (!cat) return;
    var name = prompt('نام زیرمجموعه جدید:');
    if (!name || !name.trim()) return;
    var slug = name.trim().replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-]/g, '') || ('sub-' + Date.now());
    var existingSubs = await Admin._dcGet('design_subcategories',
      'select=sort_order&category_id=eq.' + encodeURIComponent(catId) + '&order=sort_order.desc&limit=1');
    var maxOrder = (existingSubs.length > 0) ? (existingSubs[0].sort_order || 0) + 1 : 1;
    await Admin._dcPost('design_subcategories', {
      id: slug, category_id: catId, name: name.trim(), base_price: 0,
      color_counts: [1,2,3,4], color_prices: {}, color_images: {},
      sample_image: '', sort_order: maxOrder
    });
    await Admin._dcPost('design_exec_methods', {
      id: 'from-photo-' + slug, subcategory_id: slug, name: 'از روی عکس',
      sample_image: '', sort_order: 1
    });
    await Admin._dcPost('design_exec_methods', {
      id: 'from-sketch-' + slug, subcategory_id: slug, name: 'از روی اتود',
      sample_image: '', sort_order: 2
    });
    toast('زیرمجموعه اضافه شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  editDesignSubcat(catId, subId) {
    var formEl = document.getElementById('dsc-form-' + catId + '-' + subId);
    if (formEl) {
      var isHidden = formEl.classList.contains('hidden');
      // Hide all other forms first
      document.querySelectorAll('[id^="dsc-form-"]').forEach(function(f) { f.classList.add('hidden'); });
      if (isHidden) formEl.classList.remove('hidden');
    }
  },

  async saveDesignSubcat(catId, subId) {
    var name = document.getElementById('dsc-name-' + catId + '-' + subId).value.trim();
    var priceVal = (document.getElementById('dsc-price-' + catId + '-' + subId).value || '').replace(/[۰-۹]/g, function(d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); });
    var basePrice = parseInt(priceVal) || 0;
    var sampleImg = document.getElementById('dsc-img-' + catId + '-' + subId).value.trim();
    // Gather per-color images and prices from current sub
    var cats = await Admin._getDesignCats();
    var cat = cats.find(function(c) { return c.id === catId; });
    var sub = cat && (cat.subcategories || []).find(function(s) { return s.id === subId; });
    var colorImgs = {};
    var colorPrices = {};
    var ccList = (sub && sub.colorCounts) || [1,2,3,4];
    ccList.forEach(function(cc) {
      var imgEl = document.getElementById('dsc-cimg-' + catId + '-' + subId + '-' + cc);
      if (imgEl && imgEl.value.trim()) colorImgs[cc] = imgEl.value.trim();
      var priceEl = document.getElementById('dsc-cprice-' + catId + '-' + subId + '-' + cc);
      if (priceEl && priceEl.value) {
        var pv = (priceEl.value || '').replace(/[۰-۹]/g, function(d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); });
        colorPrices[cc] = parseInt(pv) || 0;
      }
    });
    var updateData = { base_price: basePrice, sample_image: sampleImg, color_prices: colorPrices, color_images: colorImgs };
    if (name) updateData.name = name;
    await Admin._dcPatch('design_subcategories', updateData, 'id=eq.' + encodeURIComponent(subId));
    toast('زیرمجموعه ذخیره شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  async deleteDesignSubcat(catId, subId) {
    if (!confirm('حذف این زیرمجموعه؟')) return;
    await Admin._dcDelete('design_exec_methods', 'subcategory_id=eq.' + encodeURIComponent(subId));
    await Admin._dcDelete('design_subcategories', 'id=eq.' + encodeURIComponent(subId));
    toast('حذف شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  addDesignExecMethod(catId, subId) {
    var formEl = document.getElementById('dem-form-' + catId + '-' + subId);
    if (formEl) formEl.classList.toggle('hidden');
  },

  async saveDesignExecMethod(catId, subId) {
    var name = document.getElementById('dem-name-' + catId + '-' + subId).value.trim();
    var sampleImg = document.getElementById('dem-img-' + catId + '-' + subId).value.trim();
    if (!name) { toast('نام نحوه اجرا را وارد کنید', 'warning'); return; }
    var slug = name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-]/g, '') || ('em-' + Date.now());
    var existingEms = await Admin._dcGet('design_exec_methods',
      'select=sort_order&subcategory_id=eq.' + encodeURIComponent(subId) + '&order=sort_order.desc&limit=1');
    var maxOrder = (existingEms.length > 0) ? (existingEms[0].sort_order || 0) + 1 : 1;
    await Admin._dcPost('design_exec_methods', {
      id: slug, subcategory_id: subId, name: name,
      sample_image: sampleImg, sort_order: maxOrder
    });
    toast('نحوه اجرا اضافه شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  async removeDesignExecMethod(catId, subId, emId) {
    await Admin._dcDelete('design_exec_methods', 'id=eq.' + encodeURIComponent(emId));
    toast('حذف شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  async addDesignColorCount(catId, subId) {
    var count = parseInt(prompt('تعداد رنگ جدید (مثلاً 5):'));
    if (!count || count < 1 || count > 16) { toast('تعداد رنگ باید بین ۱ تا ۱۶ باشد', 'warning'); return; }
    var cats = await Admin._getDesignCats();
    var cat = cats.find(function(c) { return c.id === catId; });
    var sub = cat && (cat.subcategories || []).find(function(s) { return s.id === subId; });
    if (!sub) return;
    var currentCounts = sub.colorCounts || [];
    if (currentCounts.indexOf(count) !== -1) { toast('این تعداد رنگ قبلاً اضافه شده', 'warning'); return; }
    var newCounts = currentCounts.concat([count]).sort(function(a, b) { return a - b; });
    await Admin._dcPatch('design_subcategories', { color_counts: newCounts }, 'id=eq.' + encodeURIComponent(subId));
    toast('تعداد رنگ اضافه شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  async removeDesignColorCount(catId, subId, count) {
    var cats = await Admin._getDesignCats();
    var cat = cats.find(function(c) { return c.id === catId; });
    var sub = cat && (cat.subcategories || []).find(function(s) { return s.id === subId; });
    if (!sub) return;
    var newCounts = (sub.colorCounts || []).filter(function(c) { return c !== count; });
    await Admin._dcPatch('design_subcategories', { color_counts: newCounts }, 'id=eq.' + encodeURIComponent(subId));
    toast('حذف شد ✓', 'success');
    Admin.renderDesignCategories();
  },

  // ═══════════════════════════════════════
  //  MENU
  // ═══════════════════════════════════════
  async renderMenu() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('menu').select('*').order('order_index');
      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>${t('menuManagement')}</h3>
          <button class="btn btn-primary btn-sm" onclick="Admin.addMenuItem()">${t('newMenuItem')}</button>
        </div>
        <div id="add-menu-form" class="hidden" style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:1rem;margin-bottom:1rem;display:flex;gap:0.75rem;flex-wrap:wrap">
          <input id="menu-label-fa" type="text" class="input" placeholder="${t('titleFaLabel')}" style="flex:1;min-width:140px" />
          <input id="menu-label-en" type="text" class="input" placeholder="${t('titleEnLabel')}" style="flex:1;min-width:140px" />
          <input id="menu-page"     type="text" class="input" placeholder="${t('pageLabel')}" style="width:180px" />
          <input id="menu-order"    type="number" class="input" placeholder="${t('orderLabel')}" style="width:80px" value="99" />
          <button class="btn btn-success btn-sm" onclick="Admin.saveMenuItem()">${t('save')}</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('add-menu-form').classList.add('hidden')">${t('cancel')}</button>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>${t('titleFaLabel')}</th><th>${t('titleEnLabel')}</th><th>${t('pageLabel')}</th><th>${t('orderLabel')}</th><th>${t('actionsCol')}</th></tr></thead>
            <tbody>
              ${(data||[]).map(m => `<tr>
                <td>${m.label_fa||m.label||'—'}</td>
                <td>${m.label_en||'—'}</td>
                <td>${m.page||'—'}</td>
                <td>${m.order_index||0}</td>
                <td><button class="btn btn-sm btn-danger" onclick="Admin.deleteMenuItem('${m.id}')">🗑️</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  addMenuItem() { document.getElementById('add-menu-form').classList.remove('hidden'); },

  async saveMenuItem() {
    const label_fa    = document.getElementById('menu-label-fa').value.trim();
    const label_en    = document.getElementById('menu-label-en').value.trim();
    const page        = document.getElementById('menu-page').value.trim();
    const order_index = parseInt(document.getElementById('menu-order').value) || 99;
    if (!label_fa || !page) { toast(t('fillRequired'), 'warning'); return; }
    try {
      await DB.insert('menu', { label_fa, label_en, page, order_index, created_at: new Date().toISOString() });
      toast(t('saveSuccess'), 'success');
      Admin.renderMenu();
      App.buildNav();
    } catch (err) { toast(err.message, 'error'); }
  },

  async deleteMenuItem(id) {
    try { await DB.delete('menu', id); toast(t('deleteSuccess'), 'success'); Admin.renderMenu(); App.buildNav(); }
    catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  THEME
  // ═══════════════════════════════════════
  async renderTheme() {
    const el = document.getElementById('admin-content');
    // Load current theme setting
    let currentTheme = State.theme;
    try {
      const { data } = await supabase.from('settings').select('value').eq('key','theme').single();
      if (data?.value) currentTheme = data.value;
    } catch (err) { console.warn(err); }

    el.innerHTML = `
      <h3 style="margin-bottom:1.5rem">${t('themeManagement')}</h3>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem">${t('currentTheme')} <strong style="color:var(--accent)">${currentTheme}</strong></p>

      <div class="theme-grid">
        ${[
          { key:'dark',   label:t('darkTheme'),   colors:['#0a0a0a','#1a1a1a','#E06C2A'], desc:t('modernDarkDesc') },
          { key:'light',  label:t('lightTheme'),  colors:['#f5f5f5','#ffffff','#E06C2A'], desc:t('minimalLightDesc') },
          { key:'orange', label:t('orangeTheme'), colors:['#0d0905','#1f1508','#ff7a2f'], desc:t('orangeDesc') },
        ].map(th => `
          <div class="theme-card ${currentTheme===th.key?'active':''}" onclick="Admin.applyThemeAdmin('${th.key}')">
            <div class="theme-preview" style="background:linear-gradient(135deg,${th.colors[0]} 30%,${th.colors[1]} 60%,${th.colors[2]} 100%)"></div>
            <div style="font-weight:700;margin-bottom:0.25rem">${th.label}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary)">${th.desc}</div>
            ${currentTheme===th.key ? `<div class="badge badge-accent" style="margin-top:0.5rem">${t('activeLabel')}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-top:2rem;padding:1.5rem;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius)">
        <h4 style="margin-bottom:1rem">${t('uploadCustomTheme')}</h4>
        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
          <input type="file" id="theme-file" class="input" accept=".css" style="flex:1;min-width:200px" />
          <button class="btn btn-outline" onclick="Admin.uploadCustomTheme()">${t('uploadAndApply')}</button>
          <button class="btn btn-ghost" onclick="Admin.resetTheme()">${t('backToDefault')}</button>
        </div>
      </div>
    `;
  },

  async applyThemeAdmin(theme) {
    try {
      applyTheme(theme);
      await DB.upsert('settings', { key:'theme', value: theme }, 'key');
      toast(`${theme} ${t('themeApplied')}`, 'success');
      Admin.renderTheme();
    } catch (err) { toast(err.message, 'error'); }
  },

  async uploadCustomTheme() {
    const file = document.getElementById('theme-file').files[0];
    if (!file) { toast(t('selectCssFile'), 'warning'); return; }
    showLoading(true);
    try {
      const url = await DB.uploadFile('themes', `custom_${Date.now()}.css`, file);
      await DB.upsert('settings', { key:'custom_theme_url', value: url }, 'key');
      await DB.upsert('settings', { key:'theme', value: 'custom' }, 'key');
      applyTheme('custom', url);
      toast(t('customThemeApplied'), 'success');
      Admin.renderTheme();
    } catch (err) { toast(err.message, 'error'); }
    finally { showLoading(false); }
  },

  async resetTheme() {
    try {
      await DB.upsert('settings', { key:'theme', value:'dark' }, 'key');
      applyTheme('dark');
      toast(t('defaultThemeRestored'), 'success');
      Admin.renderTheme();
    } catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  CONTENT (About, Hero, Features, Footer)
  // ═══════════════════════════════════════
  async renderContent() {
    const el = document.getElementById('admin-content');
    try {
      const { data: settings } = await supabase.from('settings').select('*');
      const get = key => settings?.find(s=>s.key===key)?.value || '';

      el.innerHTML = `
        <h3 style="margin-bottom:1.5rem">${t('editContent')}</h3>
        <div style="display:flex;flex-direction:column;gap:1.5rem">

          <div class="dash-card glass">
            <h4 style="margin-bottom:1rem">${t('heroSection')}</h4>
            <label class="label">${t('mainTitleFa')}</label>
            <input id="content-hero-title-fa" type="text" class="input" value="${get('hero_title_fa')}" />
            <label class="label mt-1">${t('mainTitleEn')}</label>
            <input id="content-hero-title-en" type="text" class="input" value="${get('hero_title_en')}" />
            <label class="label mt-1">${t('subtitleFa')}</label>
            <input id="content-hero-sub-fa" type="text" class="input" value="${get('hero_subtitle_fa')}" />
            <label class="label mt-1">${t('subtitleEn')}</label>
            <input id="content-hero-sub-en" type="text" class="input" value="${get('hero_subtitle_en')}" />
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap">
              <button class="btn btn-primary btn-sm" onclick="Admin.saveHero()">${t('save')}</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.clearHeroText()">${State.lang === 'fa' ? '🗑️ حذف کامل متن روی بنر' : '🗑️ Remove Hero Text'}</button>
            </div>
            <p style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.5rem">
              ${State.lang === 'fa' ? 'اگر فیلدها را خالی بگذارید و «ذخیره» بزنید، متن پیش‌فرض دوباره نمایش داده می‌شود. برای حذف کامل از دکمه قرمز استفاده کنید.' : 'Leaving fields empty and saving will show default text again. Use the red button to fully remove.'}
            </p>
          </div>

          <div class="dash-card glass">
            <h4 style="margin-bottom:1rem">${t('aboutUsContent')}</h4>
            <label class="label">${t('textFa')}</label>
            <textarea id="content-about-fa" class="input" rows="5">${get('about_text_fa')}</textarea>
            <label class="label mt-1">${t('textEn')}</label>
            <textarea id="content-about-en" class="input" rows="5">${get('about_text_en')}</textarea>
            <button class="btn btn-primary btn-sm mt-2" onclick="Admin.saveAbout()">${t('save')}</button>
          </div>

          <div class="dash-card glass">
            <h4 style="margin-bottom:1rem">${t('footerTextLabel')}</h4>
            <input id="content-footer-fa" type="text" class="input" placeholder="${t('footerFaPlaceholder')}" value="${get('footer_text_fa')}" />
            <input id="content-footer-en" type="text" class="input mt-1" placeholder="${t('footerEnPlaceholder')}" value="${get('footer_text_en')}" />
            <button class="btn btn-primary btn-sm mt-2" onclick="Admin.saveFooter()">${t('save')}</button>
          </div>
        </div>
      `;
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  async saveHero() {
    const updates = [
      { key:'hero_title_fa',    value: document.getElementById('content-hero-title-fa').value },
      { key:'hero_title_en',    value: document.getElementById('content-hero-title-en').value },
      { key:'hero_subtitle_fa', value: document.getElementById('content-hero-sub-fa').value },
      { key:'hero_subtitle_en', value: document.getElementById('content-hero-sub-en').value },
    ];
    try {
      for (const u of updates) await DB.upsert('settings', u, 'key');
      // Mark as explicitly set so empty values stick (no fallback to default)
      await DB.upsert('settings', { key:'hero_text_customized', value: 'true' }, 'key');
      App.loadHeroContent();
      toast(t('saveSuccess'), 'success');
    } catch (err) { toast(err.message, 'error'); }
  },

  async clearHeroText() {
    if (!confirm(State.lang === 'fa' ? 'متن روی بنر کاملاً حذف شود؟' : 'Completely remove hero text?')) return;
    showLoading(true);
    try {
      const updates = [
        { key:'hero_title_fa',    value: '' },
        { key:'hero_title_en',    value: '' },
        { key:'hero_subtitle_fa', value: '' },
        { key:'hero_subtitle_en', value: '' },
        { key:'hero_text_customized', value: 'true' },
      ];
      for (const u of updates) await DB.upsert('settings', u, 'key');
      ['content-hero-title-fa','content-hero-title-en','content-hero-sub-fa','content-hero-sub-en'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      App.loadHeroContent();
      toast(State.lang === 'fa' ? 'متن بنر حذف شد' : 'Hero text removed', 'success');
    } catch (err) { toast(err.message, 'error'); }
    finally { showLoading(false); }
  },

  async saveAbout() {
    const updates = [
      { key:'about_text_fa', value: document.getElementById('content-about-fa').value },
      { key:'about_text_en', value: document.getElementById('content-about-en').value },
    ];
    try {
      for (const u of updates) await DB.upsert('settings', u, 'key');
      toast(t('saveSuccess'), 'success');
    } catch (err) { toast(err.message, 'error'); }
  },

  async saveFooter() {
    const updates = [
      { key:'footer_text_fa', value: document.getElementById('content-footer-fa').value },
      { key:'footer_text_en', value: document.getElementById('content-footer-en').value },
    ];
    try {
      for (const u of updates) await DB.upsert('settings', u, 'key');
      App.loadFooterContent();
      toast(t('saveSuccess'), 'success');
    } catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  BLOG
  // ═══════════════════════════════════════
  async renderBlog() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('blog').select('*').order('created_at', { ascending: false });
      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>${t('blogManagement')}</h3>
          <button class="btn btn-primary btn-sm" onclick="Admin.showBlogForm()">${t('newArticleBtn')}</button>
        </div>
        <div id="blog-admin-form" class="hidden" style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:1.25rem;margin-bottom:1.5rem">
          <input id="blog-title" type="text" class="input" placeholder="${t('articleTitlePlaceholder')}" />
          <textarea id="blog-content" class="input mt-1" rows="6" placeholder="${t('articleContentPlaceholder')}"></textarea>
          <input id="blog-excerpt" type="text" class="input mt-1" placeholder="${t('excerptPlaceholder')}" />
          <input id="blog-id-edit" type="hidden" value="" />
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <button class="btn btn-success btn-sm" onclick="Admin.saveBlogPost()">${t('save')}</button>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('blog-admin-form').classList.add('hidden')">${t('cancel')}</button>
          </div>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>${t('titleCol')}</th><th>${t('dateCol')}</th><th>${t('actionsCol')}</th></tr></thead>
            <tbody>
              ${(data||[]).map(p=>`<tr>
                <td>${p.title}</td>
                <td>${formatDate(p.created_at)}</td>
                <td style="display:flex;gap:0.4rem">
                  <button class="btn btn-sm btn-ghost" onclick="Admin.editBlogPost('${p.id}')">✏️</button>
                  <button class="btn btn-sm btn-danger" onclick="Admin.deleteBlogPost('${p.id}')">🗑️</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
      Admin._blogData = data || [];
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  showBlogForm(id = '') {
    document.getElementById('blog-admin-form').classList.remove('hidden');
    document.getElementById('blog-id-edit').value = id;
    if (!id) {
      document.getElementById('blog-title').value   = '';
      document.getElementById('blog-content').value = '';
      document.getElementById('blog-excerpt').value = '';
    }
  },

  editBlogPost(id) {
    const post = (Admin._blogData||[]).find(p => p.id === id);
    if (!post) return;
    Admin.showBlogForm(id);
    document.getElementById('blog-title').value   = post.title   || '';
    document.getElementById('blog-content').value = post.content || '';
    document.getElementById('blog-excerpt').value = post.excerpt || '';
  },

  async saveBlogPost() {
    const title   = document.getElementById('blog-title').value.trim();
    const content = document.getElementById('blog-content').value.trim();
    const excerpt = document.getElementById('blog-excerpt').value.trim();
    const editId  = document.getElementById('blog-id-edit').value;
    if (!title || !content) { toast(t('fillRequired'), 'warning'); return; }
    try {
      if (editId) {
        await DB.update('blog', editId, { title, content, excerpt, updated_at: new Date().toISOString() });
      } else {
        await DB.insert('blog', { title, content, excerpt, author_id: State.user.id, created_at: new Date().toISOString() });
      }
      toast(t('saveSuccess'), 'success');
      Admin.renderBlog();
    } catch (err) { toast(err.message, 'error'); }
  },

  async deleteBlogPost(id) {
    if (!confirm(t('confirmDelete'))) return;
    try { await DB.delete('blog', id); toast(t('deleteSuccess'), 'success'); Admin.renderBlog(); }
    catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  FAQ
  // ═══════════════════════════════════════
  async renderFaq() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('faq').select('*').order('order_index');
      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>${t('faqManagement')}</h3>
          <button class="btn btn-primary btn-sm" onclick="Admin.showFaqForm()">${t('newQuestionBtn')}</button>
        </div>
        <div id="faq-admin-form" class="hidden" style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:1.25rem;margin-bottom:1.5rem">
          <input id="faq-question" type="text" class="input" placeholder="${t('questionPlaceholder')}" />
          <textarea id="faq-answer" class="input mt-1" rows="4" placeholder="${t('answerPlaceholder')}"></textarea>
          <input id="faq-id-edit" type="hidden" value="" />
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <button class="btn btn-success btn-sm" onclick="Admin.saveFaqItem()">${t('save')}</button>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('faq-admin-form').classList.add('hidden')">${t('cancel')}</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          ${(data||[]).map(f=>`
            <div class="ticket-item" style="display:flex;align-items:flex-start;gap:1rem">
              <div style="flex:1">
                <div style="font-weight:600">${f.question}</div>
                <div style="color:var(--text-secondary);font-size:0.88rem;margin-top:0.25rem">${f.answer}</div>
              </div>
              <div style="display:flex;gap:0.4rem;flex-shrink:0">
                <button class="btn btn-sm btn-ghost" onclick="Admin.editFaqItem('${f.id}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="Admin.deleteFaqItem('${f.id}')">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      Admin._faqData = data || [];
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  showFaqForm(id='') {
    document.getElementById('faq-admin-form').classList.remove('hidden');
    document.getElementById('faq-id-edit').value = id;
    if (!id) { document.getElementById('faq-question').value=''; document.getElementById('faq-answer').value=''; }
  },

  editFaqItem(id) {
    const f = (Admin._faqData||[]).find(x=>x.id===id);
    if (!f) return;
    Admin.showFaqForm(id);
    document.getElementById('faq-question').value = f.question||'';
    document.getElementById('faq-answer').value   = f.answer  ||'';
  },

  async saveFaqItem() {
    const question = document.getElementById('faq-question').value.trim();
    const answer   = document.getElementById('faq-answer').value.trim();
    const editId   = document.getElementById('faq-id-edit').value;
    if (!question || !answer) { toast(t('fillRequired'), 'warning'); return; }
    try {
      if (editId) await DB.update('faq', editId, { question, answer });
      else        await DB.insert('faq', { question, answer, order_index: 99, created_at: new Date().toISOString() });
      toast(t('saveSuccess'), 'success');
      Admin.renderFaq();
    } catch (err) { toast(err.message, 'error'); }
  },

  async deleteFaqItem(id) {
    if (!confirm(t('confirmDelete'))) return;
    try { await DB.delete('faq', id); toast(t('deleteSuccess'), 'success'); Admin.renderFaq(); }
    catch (err) { toast(err.message, 'error'); }
  },

  // ═══════════════════════════════════════
  //  TICKETS
  // ═══════════════════════════════════════
  async renderTickets() {
    const el = document.getElementById('admin-content');
    try {
      const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      el.innerHTML = `
        <h3 style="margin-bottom:1rem">${t('supportTickets')} (${toFarsiNum(data?.length||0)})</h3>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          ${(data||[]).map(tk=>`
            <div class="ticket-item">
              <div class="flex-between">
                <div>
                  <span class="ticket-subject">${tk.subject}</span>
                  <span style="margin-right:0.75rem;font-size:0.8rem;color:var(--text-secondary)">${tk.name} — ${tk.email}</span>
                </div>
                <span class="badge ${tk.status==='open'?'badge-info':'badge-success'}">${tk.status==='open'?t('openStatus'):t('closedStatus')}</span>
              </div>
              <p style="font-size:0.88rem;color:var(--text-secondary);margin-top:0.5rem">${tk.message}</p>
              ${tk.reply ? `<div style="margin-top:0.5rem;padding:0.5rem;background:var(--accent-light);border-radius:var(--radius);font-size:0.85rem"><strong>${t('adminReply')}</strong> ${tk.reply}</div>` : ''}
              <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap">
                <input id="reply-${tk.id}" type="text" class="input" placeholder="${t('replyPlaceholder')}" style="flex:1;min-width:200px" value="${tk.reply||''}" />
                <button class="btn btn-sm btn-primary" onclick="Admin.replyTicket('${tk.id}')">${t('send')}</button>
                <button class="btn btn-sm btn-ghost" onclick="Admin.closeTicket('${tk.id}')">${tk.status==='open'?t('closeTicketBtn'):t('openTicketBtn')}</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) { el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
  },

  async replyTicket(id) {
    const reply = document.getElementById(`reply-${id}`)?.value.trim();
    if (!reply) return;
    try {
      await DB.update('tickets', id, { reply, status:'closed' });
      toast(t('replySent'), 'success');
      Admin.renderTickets();
    } catch (err) { toast(err.message,'error'); }
  },

  async closeTicket(id) {
    try {
      const { data: tk } = await supabase.from('tickets').select('status').eq('id',id).single();
      await DB.update('tickets', id, { status: tk?.status==='open'?'closed':'open' });
      Admin.renderTickets();
    } catch (err) { toast(err.message,'error'); }
  },

  // ═══════════════════════════════════════
  //  STOCK IMAGE PRICE EDITOR
  // ═══════════════════════════════════════
  async renderStockPrices() {
    const el = document.getElementById('admin-content');
    try {
      const { data, error } = await supabase.from('stock_images').select('id,title,category,price,preview_url,thumbnail_url').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      Admin._stockData = data || [];
      el.innerHTML = `
        <div class="flex-between" style="margin-bottom:1rem">
          <h3>💰 قیمت تصاویر استوک (${toFarsiNum(Admin._stockData.length)})</h3>
          <input id="stock-admin-search" class="input" style="max-width:240px" placeholder="جستجو..." oninput="Admin._filterStockAdmin()" />
        </div>
        <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:1rem">قیمت ۰ = رایگان (دانلود مستقیم). عدد بزرگ‌تر از ۰ = پولی (افزودن به سبد خرید).</p>
        <div class="admin-table-wrap">
          <table class="admin-table" id="stock-admin-table">
            <thead><tr>
              <th>پیش‌نمایش</th><th>عنوان</th><th>دسته</th><th>قیمت (تومان)</th><th>ذخیره</th>
            </tr></thead>
            <tbody>
              ${(data||[]).map(img => `
                <tr data-id="${img.id}" data-title="${(img.title||'').toLowerCase()}" data-cat="${(img.category||'').toLowerCase()}">
                  <td><img src="${img.thumbnail_url||img.preview_url||''}" style="width:60px;height:60px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'" /></td>
                  <td style="font-size:0.82rem;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${img.title||''}">${img.title||'—'}</td>
                  <td><span class="badge badge-info">${img.category||'—'}</span></td>
                  <td><input type="number" min="0" class="input stock-price-input" value="${img.price||0}" style="width:120px;direction:ltr" /></td>
                  <td><button class="btn btn-sm btn-primary" onclick="Admin.saveStockPrice('${img.id}')">💾 ذخیره</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
  },

  _filterStockAdmin() {
    const q = (document.getElementById('stock-admin-search')?.value || '').toLowerCase().trim();
    document.querySelectorAll('#stock-admin-table tbody tr').forEach(row => {
      const t = row.getAttribute('data-title') || '';
      const c = row.getAttribute('data-cat') || '';
      row.style.display = (!q || t.indexOf(q) >= 0 || c.indexOf(q) >= 0) ? '' : 'none';
    });
  },

  async saveStockPrice(id) {
    const row = document.querySelector(`#stock-admin-table tr[data-id="${id}"]`);
    const input = row?.querySelector('.stock-price-input');
    if (!input) return;
    const price = parseInt(input.value, 10) || 0;
    try {
      const { error } = await supabase.from('stock_images').update({ price }).eq('id', id);
      if (error) throw error;
      toast(price === 0 ? '✓ رایگان شد' : `✓ قیمت ${toFarsiNum(price)} تومان ذخیره شد`, 'success');
      // Update marketplace cache
      if (typeof Marketplace !== 'undefined' && Marketplace._stockImages) {
        var img = Marketplace._stockImages.find(function(i) { return i.id === id; });
        if (img) img.price = price;
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  },

};

