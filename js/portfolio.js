/* ============================================================
   portfolio.js — Designer resume + portfolio (up to 20 items)
   Public viewing for everyone, edit access for owner + admin
   ============================================================ */

const Portfolio = {
  _categories: [],
  _items: [],
  _targetDesignerId: null, // whose portfolio is being edited (self or admin-managed)

  // ─── LOAD CATEGORIES (shared lookup) ───────────────────────
  async loadCategories() {
    if (Portfolio._categories.length) return Portfolio._categories;
    try {
      const { data } = await supabase.from('portfolio_categories').select('*').order('order_index');
      Portfolio._categories = data || [];
    } catch { Portfolio._categories = []; }
    return Portfolio._categories;
  },

  // ─── Translate static UI text on the edit page ─────────────
  translateEditPageStatic() {
    const viewBtn      = document.getElementById('portfolio-edit-view-public-btn');
    const resumeTitle  = document.getElementById('portfolio-resume-title');
    const resumeArea   = document.getElementById('portfolio-resume');
    const saveBtn      = document.getElementById('portfolio-save-resume-btn');
    const itemsTitle   = document.getElementById('portfolio-items-title');
    const addBtn       = document.getElementById('portfolio-add-btn');
    const countEl      = document.getElementById('portfolio-count');

    if (viewBtn)     viewBtn.textContent     = '👁️ ' + t('viewPublicPage');
    if (resumeTitle) resumeTitle.textContent = t('resumeAndBio');
    if (resumeArea)  resumeArea.placeholder  = t('resumePlaceholder');
    if (saveBtn)     saveBtn.textContent     = '💾 ' + t('saveResume');
    if (addBtn)       addBtn.textContent      = '+ ' + t('addPortfolioItem');

    if (itemsTitle) {
      const count = countEl ? countEl.textContent : '۰';
      itemsTitle.innerHTML = `${t('myPortfolioItems')} (<span id="portfolio-count">${count}</span>/۲۰)`;
    }
  },

  // ════════════════════════════════════════════════════════
  //  EDIT PAGE (designer's own management page, or admin managing any designer)
  // ════════════════════════════════════════════════════════
  async loadEditPage() {
    if (!State.user || (State.user.role !== 'designer' && State.user.role !== 'admin')) {
      toast(t('unauthorized'), 'error');
      Router.navigate('home');
      return;
    }

    Portfolio.translateEditPageStatic();

    // Designers always edit their own. Admins edit whichever designer they were
    // last viewing (set by Portfolio.viewPublic via the "Edit Portfolio" button),
    // falling back to their own account if none was set.
    if (State.user.role === 'admin') {
      Portfolio._targetDesignerId = State._viewingPortfolioId || State.user.id;
    } else {
      Portfolio._targetDesignerId = State.user.id;
    }

    const viewBtn = document.getElementById('portfolio-edit-view-public-btn');
    if (viewBtn) viewBtn.onclick = () => Portfolio.viewPublic(Portfolio._targetDesignerId);

    // Show whose portfolio is being edited when admin manages someone else
    const titleEl = document.querySelector('#page-portfolio-edit .section-title');
    if (titleEl) {
      if (State.user.role === 'admin' && Portfolio._targetDesignerId !== State.user.id) {
        try {
          const { data: targetUser } = await supabase.from('users').select('name').eq('id', Portfolio._targetDesignerId).single();
          titleEl.textContent = State.lang === 'fa'
            ? `مدیریت پورتفولیو — ${targetUser?.name || ''}`
            : `Managing Portfolio — ${targetUser?.name || ''}`;
        } catch {
          titleEl.textContent = t('managePortfolio');
        }
      } else {
        titleEl.textContent = t('managePortfolio');
      }
    }

    showLoading(true);
    try {
      // Load resume
      const { data: profile } = await supabase.from('users').select('resume').eq('id', Portfolio._targetDesignerId).single();
      const resumeEl = document.getElementById('portfolio-resume');
      if (resumeEl) resumeEl.value = profile?.resume || '';

      await Portfolio.loadCategories();
      await Portfolio.loadItems(Portfolio._targetDesignerId);
      Portfolio.renderEditGrid();
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  async loadItems(designerId) {
    try {
      const { data } = await supabase
        .from('portfolio_items')
        .select('*, portfolio_categories(name)')
        .eq('designer_id', designerId)
        .order('order_index', { ascending: true });
      Portfolio._items = data || [];
    } catch {
      Portfolio._items = [];
    }
  },

  async saveResume() {
    const resume = document.getElementById('portfolio-resume')?.value.trim();
    showLoading(true);
    try {
      await DB.update('users', Portfolio._targetDesignerId, { resume, updated_at: new Date().toISOString() });
      if (State.user.id === Portfolio._targetDesignerId) State.user.resume = resume;
      toast(t('saveSuccess'), 'success');
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  renderEditGrid() {
    const grid  = document.getElementById('portfolio-items-grid');
    const count = document.getElementById('portfolio-count');
    const addBtn = document.getElementById('portfolio-add-btn');
    if (!grid) return;

    if (count) count.textContent = toFarsiNum(Portfolio._items.length);
    if (addBtn) addBtn.disabled = Portfolio._items.length >= 20;
    if (addBtn) addBtn.style.opacity = Portfolio._items.length >= 20 ? '0.5' : '1';

    if (!Portfolio._items.length) {
      grid.innerHTML = `<div class="empty-state">${t('noPortfolioItemsYet')}</div>`;
      return;
    }

    grid.innerHTML = Portfolio._items.map(item => `
      <div class="portfolio-edit-card">
        <img src="${item.image_url}" alt="${item.title || ''}" loading="lazy" />
        <div class="portfolio-edit-card-info">
          <div class="portfolio-edit-card-title">${item.title || (t('noTitle'))}</div>
          ${item.portfolio_categories?.name ? `<span class="tag">${item.portfolio_categories.name}</span>` : ''}
        </div>
        <div class="portfolio-edit-card-actions">
          <button class="btn btn-sm btn-outline" onclick="Portfolio.openEditModal('${item.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="Portfolio.deleteItem('${item.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  // ─── ADD/EDIT MODAL ─────────────────────────────────────────
  // ─── Translate the add/edit item modal's static labels ─────
  translateModalLabels() {
    const map = {
      'portfolio-item-category-label': t('portfolioCategory'),
      'portfolio-item-title-label':    t('portfolioItemTitle'),
      'portfolio-item-desc-label':     t('description'),
      'portfolio-item-image-label':    t('portfolioImage'),
    };
    Object.entries(map).forEach(([id, txt]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    });
    const titleInput = document.getElementById('portfolio-item-title');
    const descInput  = document.getElementById('portfolio-item-desc');
    const saveBtn    = document.getElementById('portfolio-item-save-btn');
    if (titleInput) titleInput.placeholder = t('portfolioItemTitlePlaceholder');
    if (descInput)  descInput.placeholder  = t('portfolioItemDescPlaceholder');
    if (saveBtn)    saveBtn.textContent    = t('save');
  },

  async openAddModal() {
    if (Portfolio._items.length >= 20) {
      toast(t('portfolioLimitReached'), 'warning');
      return;
    }
    Portfolio.translateModalLabels();
    document.getElementById('portfolio-item-modal-title').textContent = t('addPortfolioItem');
    document.getElementById('portfolio-item-id').value = '';
    document.getElementById('portfolio-item-title').value = '';
    document.getElementById('portfolio-item-desc').value = '';
    document.getElementById('portfolio-item-file').value = '';
    document.getElementById('portfolio-item-preview-wrap').classList.add('hidden');
    await Portfolio.populateCategorySelect();
    Modal.open('portfolio-item');
  },

  async openEditModal(itemId) {
    const item = Portfolio._items.find(i => i.id === itemId);
    if (!item) return;
    Portfolio.translateModalLabels();
    document.getElementById('portfolio-item-modal-title').textContent = t('editPortfolioItem');
    document.getElementById('portfolio-item-id').value = item.id;
    document.getElementById('portfolio-item-title').value = item.title || '';
    document.getElementById('portfolio-item-desc').value = item.description || '';
    document.getElementById('portfolio-item-file').value = '';
    const previewWrap = document.getElementById('portfolio-item-preview-wrap');
    const preview = document.getElementById('portfolio-item-preview');
    if (item.image_url) {
      preview.src = item.image_url;
      previewWrap.classList.remove('hidden');
    } else {
      previewWrap.classList.add('hidden');
    }
    await Portfolio.populateCategorySelect(item.category_id);
    Modal.open('portfolio-item');
  },

  async populateCategorySelect(selectedId = '') {
    await Portfolio.loadCategories();
    const sel = document.getElementById('portfolio-item-category');
    if (!sel) return;
    sel.innerHTML = Portfolio._categories.map(c =>
      `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`
    ).join('');
  },

  async saveItem() {
    const id          = document.getElementById('portfolio-item-id').value;
    const categoryId  = document.getElementById('portfolio-item-category').value;
    const title       = document.getElementById('portfolio-item-title').value.trim();
    const description = document.getElementById('portfolio-item-desc').value.trim();
    const fileEl      = document.getElementById('portfolio-item-file');
    const file         = fileEl?.files[0];

    if (!id && !file) {
      toast(t('selectImageWarning'), 'warning');
      return;
    }
    if (file && file.size > 8 * 1024 * 1024) {
      toast(t('portfolioImageTooLarge'), 'error');
      return;
    }

    showLoading(true);
    try {
      let imageUrl = null;
      if (file) {
        const ext  = file.name.split('.').pop();
        const path = `${Portfolio._targetDesignerId}/${Date.now()}.${ext}`;
        imageUrl = await DB.uploadFile('portfolio', path, file);
      }

      if (id) {
        const payload = { category_id: categoryId || null, title, description, updated_at: new Date().toISOString() };
        if (imageUrl) payload.image_url = imageUrl;
        await DB.update('portfolio_items', id, payload);
        toast(t('saveSuccess'), 'success');
      } else {
        await DB.insert('portfolio_items', {
          designer_id: Portfolio._targetDesignerId,
          category_id: categoryId || null,
          title, description,
          image_url: imageUrl,
          order_index: Portfolio._items.length,
          created_at: new Date().toISOString()
        });
        toast(t('uploadSuccess'), 'success');
      }

      Modal.close('portfolio-item');
      await Portfolio.loadItems(Portfolio._targetDesignerId);
      Portfolio.renderEditGrid();
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  async deleteItem(itemId) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await DB.delete('portfolio_items', itemId);
      toast(t('deleteSuccess'), 'success');
      await Portfolio.loadItems(Portfolio._targetDesignerId);
      Portfolio.renderEditGrid();
    } catch (err) {
      toast(err.message || t('error'), 'error');
    }
  },

  // ════════════════════════════════════════════════════════
  //  PUBLIC VIEW PAGE (anyone can view any designer's portfolio)
  // ════════════════════════════════════════════════════════
  viewPublic(designerId) {
    if (!designerId) return;
    State._viewingPortfolioId = designerId;
    Router.navigate('portfolio-view');
  },

  async loadPublicView() {
    const designerId = State._viewingPortfolioId;
    const el = document.getElementById('portfolio-public-content');
    if (!el) return;

    if (!designerId) {
      el.innerHTML = `<div class="empty-state">${t('notFound')}</div>`;
      return;
    }

    el.innerHTML = '<div class="flex-center py-4"><div class="spinner"></div></div>';

    try {
      const { data: designer } = await supabase.from('users').select('*').eq('id', designerId).single();
      if (!designer) throw new Error(t('notFound'));

      const { data: items } = await supabase
        .from('portfolio_items')
        .select('*, portfolio_categories(name)')
        .eq('designer_id', designerId)
        .order('order_index', { ascending: true });

      const portfolioItems = items || [];

      // Designer sales/rating context (nice-to-have credibility signal)
      let designStats = { count: 0, avgRating: 0 };
      try {
        const { data: designs } = await supabase.from('designs').select('avg_rating,sales_count').eq('designer_id', designerId).eq('status','approved');
        if (designs?.length) {
          designStats.count = designs.length;
          designStats.avgRating = designs.reduce((s,d)=>s+(d.avg_rating||0),0) / designs.length;
        }
      } catch {}

      const canEdit = State.user && (State.user.id === designerId || State.user.role === 'admin');

      el.innerHTML = `
        <div class="portfolio-hero glass">
          <div class="portfolio-hero-avatar">
            ${designer.avatar ? `<img src="${designer.avatar}" alt="${designer.name}" />` : `<div class="portfolio-avatar-fallback">${(designer.name||'?')[0]}</div>`}
          </div>
          <div class="portfolio-hero-info">
            <h1>${designer.name || '—'}</h1>
            <span class="badge badge-accent">🎨 ${t('designer')}</span>
            ${designStats.count ? `
              <div class="portfolio-hero-stats">
                <span>⭐ ${toFarsiNum(designStats.avgRating.toFixed(1))}</span>
                <span>🎨 ${toFarsiNum(designStats.count)} ${t('designsInMarketplace')}</span>
              </div>
            ` : ''}
            ${designer.resume ? `<p class="portfolio-resume-text">${designer.resume.replace(/\n/g,'<br>')}</p>` : ''}
            ${canEdit ? `<button class="btn btn-outline btn-sm mt-2" onclick="Router.navigate('portfolio-edit')">✏️ ${t('managePortfolio')}</button>` : ''}
          </div>
        </div>

        <div class="portfolio-gallery-section">
          <h2 class="section-title">${t('portfolio')} (${toFarsiNum(portfolioItems.length)})</h2>
          ${!portfolioItems.length
            ? `<div class="empty-state">${t('noPortfolioYet')}</div>`
            : `<div class="portfolio-masonry">
                ${portfolioItems.map((item, i) => `
                  <div class="portfolio-masonry-item reveal-on-scroll" style="transition-delay:${(i % 6) * 0.07}s" onclick="Portfolio.openLightbox(${i})">
                    <img src="${item.image_url}" alt="${item.title || ''}" loading="lazy" />
                    <div class="portfolio-masonry-overlay">
                      ${item.portfolio_categories?.name ? `<span class="tag">${item.portfolio_categories.name}</span>` : ''}
                      <div class="portfolio-masonry-title">${item.title || ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>`
          }
        </div>
      `;

      Portfolio._publicItems = portfolioItems;
      setupScrollReveal();
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  },

  // ─── LIGHTBOX (click to view full image + description) ─────
  openLightbox(index) {
    const item = Portfolio._publicItems?.[index];
    if (!item) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="modal modal-xl glass" style="padding:0;overflow:hidden">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="z-index:10">✕</button>
        <img src="${item.image_url}" alt="${item.title||''}" style="width:100%;max-height:60vh;object-fit:contain;background:var(--bg-secondary)" />
        <div style="padding:1.5rem">
          ${item.portfolio_categories?.name ? `<span class="tag">${item.portfolio_categories.name}</span>` : ''}
          <h3 style="margin-top:0.75rem">${item.title || ''}</h3>
          ${item.description ? `<p style="color:var(--text-secondary);margin-top:0.5rem;line-height:1.8">${item.description}</p>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
};

console.log('✅ portfolio.js loaded');
