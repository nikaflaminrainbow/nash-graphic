/* ============================================================
   marketplace.js — Design grid, detail modal, upload, wishlist, comments
   ============================================================ */

const Marketplace = {
  _designs: [],
  _filtered: [],
  _categories: [],

  // ─── LOAD MARKETPLACE ──────────────────────────────────────
  async load() {
    showLoading(true);
    try {
      await Promise.all([
        Marketplace.loadCategories(),
        Marketplace.loadDesigns()
      ]);
    } finally {
      showLoading(false);
    }
  },

  // ─── LOAD CATEGORIES ───────────────────────────────────────
  async loadCategories() {
    try {
      const data = await DB.get('categories', { order: 'name', asc: true });
      Marketplace._categories = data || [];
      const sel = document.getElementById('category-filter');
      if (sel) {
        sel.innerHTML = `<option value="">${t('allCategories')}</option>` +
          data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }
      // Also populate upload design category select
      const dSel = document.getElementById('design-category');
      if (dSel) {
        dSel.innerHTML = `<option value="">${t('selectCategory')}</option>` +
          data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }
    } catch {}
  },

  // ─── LOAD DESIGNS ──────────────────────────────────────────
  async loadDesigns() {
    const grid    = document.getElementById('designs-grid');
    const loading = document.getElementById('designs-loading');
    if (!grid) return;

    grid.innerHTML = '';
    loading?.classList.remove('hidden');

    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      Marketplace._designs  = data || [];
      Marketplace._filtered = [...Marketplace._designs];
      Marketplace.renderGrid();
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">${err.message}</div>`;
    } finally {
      loading?.classList.add('hidden');
    }

    // Set up search/filter listeners
    const searchEl = document.getElementById('search-input');
    const catEl    = document.getElementById('category-filter');
    const sortEl   = document.getElementById('sort-filter');

    if (searchEl) {
      searchEl.placeholder = t('searchInDesigns');
      searchEl.oninput = Marketplace.filter.bind(Marketplace);
    }
    if (catEl)    catEl.onchange   = Marketplace.filter.bind(Marketplace);
    if (sortEl) {
      sortEl.innerHTML = `
        <option value="newest">${t('newest')}</option>
        <option value="popular">${t('mostPopular')}</option>
        <option value="cheap">${t('cheapest')}</option>
        <option value="expensive">${t('mostExpensive')}</option>
      `;
      sortEl.onchange = Marketplace.filter.bind(Marketplace);
    }
  },

  // ─── FILTER & SORT ─────────────────────────────────────────
  filter() {
    const q    = (document.getElementById('search-input')?.value || '').toLowerCase();
    const cat  = document.getElementById('category-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'newest';

    let result = Marketplace._designs.filter(d => {
      const matchQ   = !q || d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.tags?.join(' ').toLowerCase().includes(q);
      const matchCat = !cat || d.category === cat;
      return matchQ && matchCat;
    });

    switch(sort) {
      case 'popular':   result.sort((a,b) => (b.sales_count||0) - (a.sales_count||0)); break;
      case 'cheap':     result.sort((a,b) => a.price - b.price); break;
      case 'expensive': result.sort((a,b) => b.price - a.price); break;
      default:          result.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }

    Marketplace._filtered = result;
    Marketplace.renderGrid();
  },

  // ─── RENDER GRID ───────────────────────────────────────────
  renderGrid() {
    const grid = document.getElementById('designs-grid');
    const none = document.getElementById('no-designs');
    if (!grid) return;

    if (!Marketplace._filtered.length) {
      grid.innerHTML = '';
      if (none) { none.textContent = t('noDesignsFound'); none.classList.remove('hidden'); }
      return;
    }
    none?.classList.add('hidden');

    grid.innerHTML = Marketplace._filtered.map(d => `
      <div class="design-card" onclick="Marketplace.openDesign('${d.id}')">
        ${d.thumbnail_url
          ? `<img class="design-thumb" src="${d.thumbnail_url}" alt="${d.title}" loading="lazy" />`
          : `<div class="design-thumb-placeholder">🎨</div>`
        }
        <div class="design-info">
          <div class="design-title">${d.title || t('noTitle')}</div>
          <div class="design-designer">👨‍🎨 ${d.designer_name || '—'}</div>
          <div class="design-footer">
            <span class="design-price">${formatPrice(d.price || 0)}</span>
            <span class="design-rating">⭐ ${toFarsiNum((d.avg_rating || 0).toFixed(1))} (${toFarsiNum(d.sales_count || 0)})</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  // ─── OPEN DESIGN DETAIL ────────────────────────────────────
  async openDesign(designId) {
    const el = document.getElementById('design-detail-content');
    if (!el) return;
    el.innerHTML = '<div class="flex-center py-4"><div class="spinner"></div></div>';
    Modal.open('design');

    try {
      // Fetch design
      const { data: d, error } = await supabase.from('designs').select('*').eq('id', designId).single();
      if (error || !d) throw error || new Error(t('notFound'));

      // Fetch comments
      const { data: comments } = await supabase.from('comments')
        .select('*').eq('design_id', designId).order('created_at', { ascending: false });

      // Check if user purchased this design
      let purchased = false;
      if (State.user) {
        const { data: ord } = await supabase.from('orders')
          .select('items').eq('user_id', State.user.id).eq('status', 'pending');
        // simplified check: look through orders
        if (ord) {
          purchased = ord.some(o => JSON.stringify(o.items).includes(designId));
        }
      }

      // Check wishlist
      let inWishlist = false;
      if (State.user) {
        const { data: wl } = await supabase.from('wishlist')
          .select('id').eq('user_id', State.user.id).eq('design_id', designId).single();
        inWishlist = !!wl;
      } else {
        const { data: wl } = await supabase.from('wishlist')
          .select('id').eq('guest_session_id', State.guestSessionId).eq('design_id', designId).single();
        inWishlist = !!wl;
      }

      el.innerHTML = `
        <div class="design-detail">
          <div>
            ${d.thumbnail_url
              ? `<img class="design-detail-img" src="${d.thumbnail_url}" alt="${d.title}" />`
              : `<div class="design-detail-img" style="display:flex;align-items:center;justify-content:center;font-size:5rem;background:var(--bg-secondary)">🎨</div>`
            }
            <div style="margin-top:1rem;display:flex;gap:0.75rem;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="Cart.addDesign(${JSON.stringify(d).replace(/"/g,'&quot;')})">
                🛒 ${t('addToCart')}
              </button>
              <button class="btn ${inWishlist ? 'btn-danger' : 'btn-outline'}" onclick="Marketplace.toggleWishlist('${d.id}', this)">
                ${inWishlist ? t('removeFromWishlist') : t('addToWishlist')}
              </button>
              ${purchased
                ? `<a href="${d.file_url}" target="_blank" class="btn btn-success">⬇️ ${t('download')}</a>`
                : ''
              }
            </div>
            <!-- License selection -->
            <div style="margin-top:1rem">
              <label class="label">${t('licenseType')}</label>
              <select class="input select" onchange="Marketplace.updateLicensePrice(this, ${d.price})">
                <option value="standard">${t('standardLicense')} — ${formatPrice(d.price)}</option>
                <option value="exclusive">${t('exclusiveLicense')} — ${formatPrice(d.price * 3)}</option>
              </select>
            </div>
          </div>
          <div class="design-detail-info">
            <div class="detail-title">${d.title}</div>
            <div style="color:var(--text-secondary);font-size:0.85rem">
              ${t('designerLabel')}: ${d.designer_id
                ? `<a href="#" onclick="Portfolio.viewPublic('${d.designer_id}');return false;" style="color:var(--accent);font-weight:600">${d.designer_name || '—'} 🔗</a>`
                : (d.designer_name || '—')}
            </div>
            <div class="detail-price" id="detail-price-display">${formatPrice(d.price)}</div>
            <div style="display:flex;gap:1rem;font-size:0.85rem;color:var(--text-secondary)">
              <span>⭐ ${toFarsiNum((d.avg_rating||0).toFixed(1))}</span>
              <span>🔥 ${toFarsiNum(d.sales_count||0)} ${t('soldCount')}</span>
            </div>
            <div class="detail-desc">${d.description || t('noDescription')}</div>
            ${d.tags?.length ? `
              <div class="detail-tags">
                ${d.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
              </div>
            ` : ''}
            <!-- Comments -->
            <div class="comments-section">
              <h4>${t('comments')} (${toFarsiNum(comments?.length || 0)})</h4>
              <div id="comments-list">
                ${(comments || []).map(c => `
                  <div class="comment-item">
                    <div class="flex-between">
                      <span class="comment-author">${c.user_name || c.guest_name || t('guest')}</span>
                      <span style="color:var(--warning)">${'⭐'.repeat(c.rating || 0)}</span>
                    </div>
                    <div class="comment-text">${c.text}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem">${formatDate(c.created_at)}</div>
                  </div>
                `).join('')}
                ${!comments?.length ? `<p style="color:var(--text-secondary);font-size:0.9rem">${t('noCommentsYet')}</p>` : ''}
              </div>
              <!-- Add Comment -->
              <div class="add-comment" id="add-comment-form">
                <div class="stars" id="star-rating" onclick="Marketplace.setRating(event)">
                  ${[1,2,3,4,5].map(i => `<span class="star" data-val="${i}">★</span>`).join('')}
                </div>
                <input type="hidden" id="selected-rating" value="0" />
                <input id="comment-name" type="text" class="input" placeholder="${t('yourName')}" value="${State.user?.name || ''}" />
                <textarea id="comment-text" class="input" rows="3" placeholder="${t('yourComment')}"></textarea>
                <button class="btn btn-outline" onclick="Marketplace.submitComment('${d.id}')">${t('submitComment')}</button>
              </div>
            </div>
            <!-- Admin actions -->
            ${State.user?.role === 'admin' ? `
              <div style="margin-top:1.5rem;display:flex;gap:0.75rem;flex-wrap:wrap">
                <button class="btn btn-success btn-sm" onclick="Admin.approveDesign('${d.id}')">✅ ${t('approve')}</button>
                <button class="btn btn-danger btn-sm" onclick="Admin.rejectDesign('${d.id}')">❌ ${t('reject')}</button>
                <button class="btn btn-ghost btn-sm" onclick="Admin.deleteDesign('${d.id}')">🗑️ ${t('delete')}</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  },

  updateLicensePrice(sel, basePrice) {
    const mul = sel.value === 'exclusive' ? 3 : 1;
    const el  = document.getElementById('detail-price-display');
    if (el) el.textContent = formatPrice(basePrice * mul);
  },

  // ─── STAR RATING ───────────────────────────────────────────
  setRating(e) {
    const star = e.target.closest('.star');
    if (!star) return;
    const val = parseInt(star.getAttribute('data-val'));
    document.getElementById('selected-rating').value = val;
    document.querySelectorAll('#star-rating .star').forEach((s, i) => {
      s.classList.toggle('active', i < val);
    });
  },

  // ─── SUBMIT COMMENT ────────────────────────────────────────
  async submitComment(designId) {
    const rating = parseInt(document.getElementById('selected-rating').value);
    const text   = document.getElementById('comment-text').value.trim();
    const name   = document.getElementById('comment-name').value.trim();

    if (!text || !rating) { toast(t('commentRatingRequired'), 'warning'); return; }

    showLoading(true);
    try {
      await DB.insert('comments', {
        design_id:  designId,
        user_id:    State.user?.id || null,
        guest_name: !State.user ? name : null,
        user_name:  State.user?.name || name,
        rating, text,
        is_guest:   !State.user,
        created_at: new Date().toISOString()
      });

      // Update average rating
      const { data: allComments } = await supabase.from('comments').select('rating').eq('design_id', designId);
      if (allComments?.length) {
        const avg = allComments.reduce((s, c) => s + c.rating, 0) / allComments.length;
        await supabase.from('designs').update({ avg_rating: avg }).eq('id', designId);
      }

      toast(t('saveSuccess'), 'success');
      Marketplace.openDesign(designId); // refresh
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  // ─── TOGGLE WISHLIST ───────────────────────────────────────
  async toggleWishlist(designId, btn) {
    try {
      const key = State.user ? { user_id: State.user.id, design_id: designId }
                              : { guest_session_id: State.guestSessionId, design_id: designId };

      let q = supabase.from('wishlist').select('id');
      Object.entries(key).forEach(([k,v]) => q = q.eq(k, v));
      const { data: existing } = await q.single();

      if (existing) {
        await DB.delete('wishlist', existing.id);
        btn.innerHTML = t('addToWishlist');
        btn.className = 'btn btn-outline';
        toast(t('deleteSuccess'), 'info');
      } else {
        await DB.insert('wishlist', {
          ...key, is_guest: !State.user, created_at: new Date().toISOString()
        });
        btn.innerHTML = t('removeFromWishlist');
        btn.className = 'btn btn-danger';
        toast(t('saveSuccess'), 'success');
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  },

  // ─── OPEN UPLOAD MODAL ────────────────────────────────────
  openUpload() {
    if (!checkUploadPermission()) return;
    Modal.open('upload');
    Marketplace.loadCategories();
    Marketplace.translateUploadForm();
  },

  translateUploadForm() {
    const map = {
      'design-title':     t('designTitle'),
      'design-price':     `${t('price')} (${t('toman')})`,
      'design-desc':      t('description'),
      'design-tags':      t('tags'),
    };
    Object.entries(map).forEach(([id, ph]) => {
      const el = document.getElementById(id);
      if (el) el.placeholder = ph;
    });
  },

  // ─── UPLOAD DESIGN ────────────────────────────────────────
  async uploadDesign() {
    if (!checkUploadPermission()) return;

    const title    = document.getElementById('design-title').value.trim();
    const category = document.getElementById('design-category').value;
    const price    = parseFloat(document.getElementById('design-price').value);
    const desc     = document.getElementById('design-desc').value.trim();
    const tags     = document.getElementById('design-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const fileEl   = document.getElementById('design-file');
    const thumbEl  = document.getElementById('design-thumbnail');

    if (!title || !category || !price || !fileEl.files[0] || !thumbEl.files[0]) {
      toast(t('fillRequired'), 'warning'); return;
    }

    const file  = fileEl.files[0];
    const thumb = thumbEl.files[0];

    if (file.size > 20 * 1024 * 1024)  { toast(t('fileTooLarge'), 'error'); return; }
    if (thumb.size > 5 * 1024 * 1024)  { toast(t('thumbTooLarge'), 'error'); return; }

    // Show progress
    const prog = document.getElementById('upload-progress');
    const fill = document.getElementById('progress-fill');
    prog?.classList.remove('hidden');

    showLoading(true);
    try {
      const userId = State.user.id;
      const ts     = Date.now();

      if (fill) fill.style.width = '30%';
      const thumbUrl = await DB.uploadFile('designs', `${userId}/thumb_${ts}.${thumb.name.split('.').pop()}`, thumb);

      if (fill) fill.style.width = '70%';
      const fileUrl  = await DB.uploadFile('designs', `${userId}/file_${ts}.${file.name.split('.').pop()}`, file);

      if (fill) fill.style.width = '90%';
      await DB.insert('designs', {
        title, category, price, description: desc, tags,
        designer_id:   userId,
        designer_name: State.user.name,
        status:        'pending',
        thumbnail_url: thumbUrl,
        file_url:      fileUrl,
        sales_count:   0, avg_rating: 0,
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString()
      });

      if (fill) fill.style.width = '100%';
      toast(t('pendingApproval'), 'success');
      Modal.close('upload');
      prog?.classList.add('hidden');
      if (fill) fill.style.width = '0';

      // Clear form
      ['design-title','design-price','design-desc','design-tags'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      ['design-file','design-thumbnail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      // Refresh designer dashboard
      if (Router.current === 'designer-dashboard') Dashboard.loadDesigner();
    } catch (err) {
      toast(err.message || t('error'), 'error');
      prog?.classList.add('hidden');
    } finally {
      showLoading(false);
    }
  }
};

console.log('✅ marketplace.js loaded');
