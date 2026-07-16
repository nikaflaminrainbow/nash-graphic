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
    const idx = ['stats','media','users','designs','orders','categories','menu','theme','content','blog','faq','tickets'].indexOf(tab);
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
      case 'menu':       Admin.renderMenu();       break;
      case 'theme':      Admin.renderTheme();      break;
      case 'content':    Admin.renderContent();    break;
      case 'blog':       Admin.renderBlog();       break;
      case 'faq':        Admin.renderFaq();        break;
      case 'tickets':    Admin.renderTickets();    break;
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
    } catch {}

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
          <!-- Content Agent Settings -->
          <div class="dash-card glass">
            <h4 style="margin-bottom:1rem">🤖 ${State.lang==='fa' ? 'تنظیمات Content Agent' : 'Content Agent Settings'}</h4>
            <label class="label">${State.lang==='fa' ? 'URL پیش‌فرض سایت منبع' : 'Default source site URL'}</label>
            <input id="content-agent-source" type="url" class="input" placeholder="https://example.com" />
            <label class="label mt-1">${State.lang==='fa' ? 'حالت پردازش' : 'Processing mode'}</label>
            <select id="content-agent-mode" class="input select">
              <option value="translate">🌐 ${t('translate')}</option>
              <option value="rewrite">✍️ ${t('rewrite')}</option>
              <option value="summarize">📝 ${t('summarize')}</option>
            </select>
            <label class="label mt-1">${State.lang==='fa' ? 'زمان‌بندی (ساعت:دقیقه، جدا با کاما)' : 'Schedule (HH:MM, comma-separated)'}</label>
            <input id="content-agent-schedule" type="text" class="input" placeholder="09:00,15:30" />
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;align-items:center">
              <label style="display:flex;align-items:center;gap:8px"><input id="content-agent-enabled" type="checkbox" /> فعال</label>
              <button class="btn btn-primary btn-sm" onclick="Admin.saveContentAgentSettings()">💾 ${t('save')}</button>
            </div>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem">${State.lang==='fa' ? 'وقتی فعال باشد، مرورگر ادمین در زمان‌های مشخص اسکن و پردازش را اجرا می‌کند. برای اجرای بدون نیاز به مرورگر، از Supabase Edge Function یا cron سروری استفاده کنید.' : 'When enabled, the admin browser will run scheduled scans. For always-on execution use a Supabase Edge Function or server cron.'}</p>
          </div>
      `;
      // populate fields from DB
      try {
        const { data: sets } = await supabase.from('settings').select('*').in('key',['content_agent_source','content_agent_mode','content_agent_schedule','content_agent_enabled']);
        (sets||[]).forEach(s => {
          if (s.key==='content_agent_source') document.getElementById('content-agent-source').value = s.value || '';
          if (s.key==='content_agent_mode')   document.getElementById('content-agent-mode').value   = s.value || 'rewrite';
          if (s.key==='content_agent_schedule')document.getElementById('content-agent-schedule').value= s.value || '';
          if (s.key==='content_agent_enabled') document.getElementById('content-agent-enabled').checked = (s.value === 'true');
        });
      } catch {}
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
    if (file.size > 2 * 1024 * 1024) { toast(t('fileTooLarge'), 'error'); return; }
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

  async saveContentAgentSettings() {
    const source = document.getElementById('content-agent-source')?.value.trim() || '';
    const mode   = document.getElementById('content-agent-mode')?.value || 'rewrite';
    const sched  = document.getElementById('content-agent-schedule')?.value.trim() || '';
    const enabled= document.getElementById('content-agent-enabled')?.checked ? 'true' : 'false';
    try {
      await DB.upsert('settings', { key:'content_agent_source', value: source }, 'key');
      await DB.upsert('settings', { key:'content_agent_mode', value: mode }, 'key');
      await DB.upsert('settings', { key:'content_agent_schedule', value: sched }, 'key');
      await DB.upsert('settings', { key:'content_agent_enabled', value: enabled }, 'key');
      toast(t('saveSuccess'), 'success');
    } catch (err) { toast(err.message, 'error'); }
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
          } catch {}
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
    } catch {}

    // Support color counts 1..10 and per-color sample image + price
    const colorLabels = {
      1: t('oneColor'), 2: t('twoColor'), 3: t('threeColor'), 4: t('fullColor')
    };

    el.innerHTML = `
      <button class="btn btn-ghost btn-sm" style="margin-bottom:1rem" onclick="Admin.renderCategories()">← ${t('back')}</button>
      <h3 style="margin-bottom:0.25rem">🖼️ ${t('sampleImagesFor')} «${cat.name}»</h3>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem">
        ${t('sampleImageDesc')}
      </p>
      <div class="category-samples-grid">
        ${[1,2,3,4,5,6,7,8,9,10].map(cc => {
          const existing = images.find(img => img.color_count === cc);
          const label = colorLabels[cc] || (cc + ' ' + t('colors'));
          return `
            <div class="dash-card glass">
              <h4 style="margin-bottom:0.5rem">${label}</h4>
              ${existing ? `
                <img src="${existing.image_url}" alt="${label}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius);margin-bottom:0.5rem" />
              ` : `
                <div style="width:100%;aspect-ratio:4/3;background:var(--bg-secondary);border-radius:var(--radius);margin-bottom:0.5rem;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:0.85rem">
                  ${t('noImage')}
                </div>
              `}
              <label class="label" style="margin-bottom:0.25rem">${t('samplePriceLabel')}</label>
              <input id="sample-price-${cc}" type="number" class="input" placeholder="مثال: 20000" value="${existing?.price||''}" style="margin-bottom:0.5rem" />
              <input type="file" id="sample-file-${cc}" class="input" accept="image/*" style="margin-bottom:0.5rem" />
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-primary btn-sm" style="flex:1" onclick="Admin.uploadCategorySample(${cc})">${t('upload')}</button>
                ${existing ? `<button class="btn btn-danger btn-sm" onclick="Admin.deleteCategorySample('${existing.id}', ${cc})">🗑️</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top:1rem">
        <h4 style="margin-bottom:0.5rem">⚙️ ${t('execMethodPricesTitle')}</h4>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <div style="flex:1;min-width:160px">
            <label class="label">اجرا</label>
            <input id="exec-price-exec" type="number" class="input" placeholder="قیمت اجرا" />
          </div>
          <div style="flex:1;min-width:160px">
            <label class="label">اتود</label>
            <input id="exec-price-etude" type="number" class="input" placeholder="قیمت اتود" />
          </div>
          <div style="flex:1;min-width:160px">
            <label class="label">ویرایش</label>
            <input id="exec-price-edit" type="number" class="input" placeholder="قیمت ویرایش" />
          </div>
        </div>
        <div style="margin-top:0.75rem;display:flex;gap:0.5rem">
          <button class="btn btn-success btn-sm" onclick="Admin.saveExecPrices()">💾 ${t('save')}</button>
          <button class="btn btn-ghost btn-sm" onclick="Admin.renderCategories()">${t('cancel')}</button>
        </div>
      </div>
    `;

    // populate exec price inputs from DB
    try {
      const { data: execs } = await supabase.from('category_exec_prices').select('*').eq('category_id', categoryId);
      (execs||[]).forEach(e => {
        const el = document.getElementById(`exec-price-${e.method}`);
        if (el) el.value = e.price || '';
      });
    } catch {}
  },

  async uploadCategorySample(colorCount) {
    const fileEl = document.getElementById(`sample-file-${colorCount}`);
    const file = fileEl?.files[0];
    if (!file) { toast(t('selectFileWarning'), 'warning'); return; }
    if (file.size > 5 * 1024 * 1024) { toast(t('thumbTooLarge'), 'error'); return; }

    showLoading(true);
    try {
      const categoryId = Admin._sampleCategoryId;
      const ext = file.name.split('.').pop();
      const path = `${categoryId}/color-${colorCount}.${ext}`;
      const url = await DB.uploadFile('category-samples', path, file);
      const price = parseFloat(document.getElementById(`sample-price-${colorCount}`)?.value) || 0;

      await DB.upsert('category_color_images', {
        category_id: categoryId,
        color_count: colorCount,
        image_url: url,
        price
      }, 'category_id,color_count');

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

  async saveExecPrices() {
    const categoryId = Admin._sampleCategoryId;
    if (!categoryId) return;
    const execs = ['exec','etude','edit'];
    try {
      for (const m of execs) {
        const val = parseFloat(document.getElementById(`exec-price-${m}`)?.value) || 0;
        await DB.upsert('category_exec_prices', { category_id: categoryId, method: m, price: val }, 'category_id,method');
      }
      toast(t('saveSuccess'), 'success');
      Admin.openCategorySamples(categoryId);
    } catch (err) { toast(err.message, 'error'); }
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
    } catch {}

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
  }
};

console.log('✅ admin.js loaded');
