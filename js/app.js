/* ============================================================
   app.js — Main init, header/nav builder, home page,
            blog, faq, legal, realtime subscriptions
   ============================================================ */

const App = {

  // ─── BOOTSTRAP ───────────────────────────────────────────
  async init() {
    // 1. Apply saved lang & theme
    applyLang(State.lang);
    applyTheme(State.theme);

    // 2. Load theme from Supabase (override local)
    await App.loadThemeFromDB();

    // 3. Restore session
    await Auth.restoreSession();
    Auth.listen();

    // 4. Load cart from localStorage
    Cart.init();

    // 5. Build navigation
    await App.buildNav();

    // 6. Build header user chip
    App.updateHeader();

    // 7. Setup lang toggle
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      const newLang = State.lang === 'fa' ? 'en' : 'fa';
      applyLang(newLang);
      // Re-render everything
      App.buildNav();
      App.updateHeader();
      App.translateStaticHTML();
      Router.loadPage(Router.current);
    });

    // 8. Setup cart button
    document.getElementById('cart-btn')?.addEventListener('click', Cart.open.bind(Cart));

    // 9. Mobile menu
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      const nav = document.getElementById('mobile-nav');
      nav?.classList.toggle('hidden');
    });

    // 10. Logo click → home
    document.querySelector('.header-logo')?.addEventListener('click', () => Router.navigate('home'));

    // 11. Hero CTA
    document.getElementById('hero-cta')?.addEventListener('click', () => {
      Modal.open('auth');
    });

    // 12. Upload design button
    document.getElementById('upload-design-btn')?.addEventListener('click', () => {
      Marketplace.openUpload();
    });

    // 13. Avatar upload
    document.getElementById('upload-avatar-btn')?.addEventListener('click', () => {
      if (!checkUploadPermission()) return;
      document.getElementById('avatar-input').click();
    });
    document.getElementById('avatar-input')?.addEventListener('change', Profile.uploadAvatar.bind(Profile));

    // 14. Upload design btn in header (dynamic)
    // handled via nav

    // 15. Setup realtime listeners
    App.setupRealtime();

    // 16. Translate all static HTML up front
    App.translateStaticHTML();

    // 17. Load home page
    await App.loadHome();
    Router.navigate('home');

    // 18. Hide loading overlay
    showLoading(false);

    console.log('✅ App initialized');
  },

  // ─── LOAD THEME FROM DB ──────────────────────────────────
  async loadThemeFromDB() {
    try {
      const { data } = await supabase.from('settings').select('key,value')
        .in('key', ['theme', 'custom_theme_url', 'logo_url']);
      if (!data?.length) return;
      const map = {};
      data.forEach(s => map[s.key] = s.value);
      if (map.theme) {
        applyTheme(map.theme, map.theme === 'custom' ? map.custom_theme_url : null);
      }
      if (map.logo_url) {
        const logo = document.getElementById('site-logo');
        if (logo) { logo.src = map.logo_url; logo.style.display = 'block'; }
      }
    } catch {}
  },

  // ─── BUILD NAVIGATION ────────────────────────────────────
  async buildNav() {
    const role = State.isGuest ? 'guest' : (State.user?.role || 'guest');

    // Default nav items (always shown)
    const defaultItems = [
      { label_fa: t('home'),        label_en: 'Home',          page: 'home' },
      { label_fa: t('marketplace'), label_en: 'Marketplace',   page: 'marketplace' },
      { label_fa: t('about'),       label_en: 'About',         page: 'about' },
      { label_fa: t('blog'),        label_en: 'Blog',          page: 'blog' },
      { label_fa: t('faq'),         label_en: 'FAQ',           page: 'faq' },
      { label_fa: t('legal'),       label_en: 'Legal',         page: 'legal' },
      { label_fa: t('support'),     label_en: 'Support',       page: 'support' },
      { label_fa: t('tracking'),    label_en: 'Order Tracking', page: 'tracking' },
    ];

    // Role-specific items
    const roleItems = {
      guest: [
        { label_fa: '🖨️ ' + t('printerDashboard'), label_en: '🖨️ Printer Dashboard', page: 'printer-dashboard' },
      ],
      admin: [
        { label_fa: '⚙️ ' + t('adminPanel'),         label_en: '⚙️ Admin Panel',          page: 'admin' },
        { label_fa: '🖨️ ' + t('printerDashboard'),  label_en: '🖨️ Printer Dashboard',    page: 'printer-dashboard' },
        { label_fa: '🎨 ' + t('designerDashboard'),  label_en: '🎨 Designer Dashboard',   page: 'designer-dashboard' },
      ],
      designer: [
        { label_fa: '🎨 ' + t('designerDashboard'), label_en: '🎨 Dashboard',             page: 'designer-dashboard' },
        { label_fa: '🖨️ ' + t('printerDashboard'), label_en: '🖨️ Printer Dashboard',    page: 'printer-dashboard' },
      ],
      printer: [
        { label_fa: '🖨️ ' + t('printerDashboard'), label_en: '🖨️ Dashboard',            page: 'printer-dashboard' },
      ],
    };

    // Try to load custom menu items from Supabase
    let customItems = [];
    try {
      const { data } = await supabase.from('menu').select('*').order('order_index');
      customItems = data || [];
    } catch {}

    const allItems = [
      ...defaultItems,
      ...(roleItems[role] || []),
      ...customItems
    ];

    const renderList = (listId) => {
      const ul = document.getElementById(listId);
      if (!ul) return;
      ul.innerHTML = allItems.map(item => `
        <li>
          <a href="#" data-page="${item.page}"
            class="${Router.current === item.page ? 'active' : ''}"
            onclick="Router.navigate('${item.page}'); document.getElementById('mobile-nav')?.classList.add('hidden'); return false;">
            ${State.lang === 'fa' ? (item.label_fa || item.label || '') : (item.label_en || item.label_fa || '')}
          </a>
        </li>
      `).join('');
    };

    renderList('nav-list');
    renderList('mobile-nav-list');
  },

  // ─── UPDATE HEADER USER AREA ─────────────────────────────
  updateHeader() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;

    const role = State.isGuest ? 'guest' : (State.user?.role || null);

    const roleLabels = {
      admin:    '⚙️ ' + t('admin'),
      designer: '🎨 ' + t('designer'),
      printer:  '🖨️ ' + t('printer'),
      guest:    '👤 ' + t('guest'),
    };

    if (!State.user && !State.isGuest) {
      // Not logged in
      userMenu.innerHTML = `
        <button class="btn-login-header" onclick="Modal.open('auth')">
          👤 ${t('login')} / ${t('register')}
        </button>
      `;
    } else {
      const displayName = State.isGuest
        ? t('guest')
        : (State.user.name || State.user.email?.split('@')[0] || '—');

      const roleLabel = roleLabels[role] || '👤';

      userMenu.innerHTML = `
        <div class="user-chip" onclick="App.toggleUserDropdown(this)">
          ${State.user?.avatar ? `<img src="${State.user.avatar}" style="width:24px;height:24px;border-radius:50%;object-fit:cover" />` : ''}
          <span>${displayName}</span>
          <span class="badge badge-accent" style="font-size:0.7rem">${roleLabel}</span>
          <span>▾</span>
        </div>
      `;
    }

    // Upload button visibility in marketplace
    const uploadBtn = document.getElementById('upload-design-btn');
    if (uploadBtn) {
      const canUpload = role === 'admin' || role === 'designer';
      uploadBtn.style.display = '';
      if (!canUpload) {
        uploadBtn.textContent = '🔒 ' + t('upload');
        uploadBtn.onclick = () => toast(t('uploadGuestMsg'), 'warning');
      } else {
        uploadBtn.textContent = '+ ' + t('upload');
        uploadBtn.onclick = Marketplace.openUpload.bind(Marketplace);
      }
    }

    App.buildNav();
  },

  toggleUserDropdown(chip) {
    const existing = document.querySelector('.user-dropdown');
    if (existing) { existing.remove(); return; }

    const role = State.isGuest ? 'guest' : (State.user?.role || null);
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';

    let items = [];

    if (State.isGuest) {
      items = [
        { label: `${t('login')} / ${t('register')}`, action: `Modal.open('auth')` },
      ];
    } else {
      items = [
        { label: '👤 ' + t('profile'), action: `Router.navigate('profile')` },
      ];
      if (role === 'admin') {
        items.push({ label: '⚙️ ' + t('adminPanel'), action: `Router.navigate('admin')` });
        items.push({ label: '🖨️ ' + t('printerDashboard'), action: `Router.navigate('printer-dashboard')` });
        items.push({ label: '🎨 ' + t('designerDashboard'), action: `Router.navigate('designer-dashboard')` });
      }
      if (role === 'designer') {
        items.push({ label: '🎨 ' + t('dashboard'), action: `Router.navigate('designer-dashboard')` });
      }
      if (role === 'printer') {
        items.push({ label: '🖨️ ' + t('dashboard'), action: `Router.navigate('printer-dashboard')` });
      }
      items.push({ label: '❤️ ' + t('wishlist'), action: `Router.navigate('profile')` });
      items.push({ divider: true });
      items.push({ label: '🚪 ' + t('logout'), action: `Auth.logout()`, danger: true });
    }

    dropdown.innerHTML = items.map(item =>
      item.divider
        ? '<div class="divider"></div>'
        : `<button onclick="${item.action};document.querySelector('.user-dropdown')?.remove()"
             style="${item.danger ? 'color:var(--danger)' : ''}">${item.label}</button>`
    ).join('');

    chip.closest('.user-menu').appendChild(dropdown);
  },

  // ─── HOME PAGE ────────────────────────────────────────────
  async loadHome() {
    await Promise.all([
      App.loadStats(),
      App.loadHeroContent(),
      App.loadFeatures(),
      App.loadFooterContent(),
    ]);
    App.translateHomeLabels();
  },

  translateHomeLabels() {
    const statLabels = document.querySelectorAll('#stats-grid .stat-label');
    const keys = ['statOrders','statDesigners','statPrinters','statDesigns'];
    statLabels.forEach((el, i) => { if (keys[i]) el.textContent = t(keys[i]); });

    const featuresTitle = document.querySelector('.features-section .section-title');
    if (featuresTitle) featuresTitle.textContent = t('ourFeatures');

    const heroCta = document.getElementById('hero-cta');
    if (heroCta) heroCta.textContent = t('marketplace') === t('marketplace') ? (State.lang === 'fa' ? 'ورود به بازارچه' : 'Enter Marketplace') : '';
  },

  async loadStats() {
    try {
      const [
        { count: orders },
        { count: designers },
        { count: printers },
        { count: designs }
      ] = await Promise.all([
        supabase.from('orders').select('*',  { count:'exact', head:true }),
        supabase.from('users').select('*',   { count:'exact', head:true }).eq('role','designer'),
        supabase.from('users').select('*',   { count:'exact', head:true }).eq('role','printer'),
        supabase.from('designs').select('*', { count:'exact', head:true }).eq('status','approved'),
      ]);
      App._animateCount('stat-orders',   orders   || 0);
      App._animateCount('stat-designers',designers || 0);
      App._animateCount('stat-printers', printers  || 0);
      App._animateCount('stat-designs',  designs   || 0);
    } catch {}
  },

  _animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const step = Math.ceil(target / 40) || 1;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = toFarsiNum(start.toLocaleString());
      if (start >= target) clearInterval(timer);
    }, 40);
  },

  async loadHeroContent() {
    try {
      const { data } = await supabase.from('settings').select('key,value')
        .in('key', ['hero_title_fa','hero_title_en','hero_subtitle_fa','hero_subtitle_en','banner_url','hero_text_customized']);
      const titleEl    = document.getElementById('hero-title');
      const subEl      = document.getElementById('hero-subtitle');
      const bannerEl   = document.getElementById('hero-img');

      if (!data?.length) {
        if (titleEl) titleEl.textContent = t('heroTitle');
        if (subEl)   subEl.textContent   = t('heroSubtitle');
        return;
      }
      const map = {};
      data.forEach(s => map[s.key] = s.value);

      const titleKey = `hero_title_${State.lang}`;
      const subKey   = `hero_subtitle_${State.lang}`;
      const isCustomized = map.hero_text_customized === 'true';

      // If admin has explicitly customized (even to empty), respect exact value.
      // Otherwise fall back to default placeholder text.
      if (titleEl) titleEl.textContent = isCustomized ? (map[titleKey] || '') : (map[titleKey] || t('heroTitle'));
      if (subEl)   subEl.textContent   = isCustomized ? (map[subKey]   || '') : (map[subKey]   || t('heroSubtitle'));

      if (bannerEl) {
        if (map.banner_url) {
          // تبدیل به slideshow — عکس با حرکت افقی
          const heroEl = bannerEl.closest('.hero-banner');
          if (heroEl) {
            bannerEl.style.display = 'none'; // مخفی کردن img اصلی
            // اگه slideshow قبلاً ساخته شده، فقط src رو آپدیت کن
            let slide = heroEl.querySelector('.hero-slide-img');
            if (!slide) {
              slide = document.createElement('div');
              slide.className = 'hero-slide-img';
              heroEl.insertBefore(slide, heroEl.firstChild);
            }
            slide.style.backgroundImage = `url('${map.banner_url}')`;
          } else {
            bannerEl.src = map.banner_url;
            bannerEl.style.display = 'block';
          }
        } else {
          bannerEl.src = '';
          bannerEl.style.display = 'none';
        }
      }
    } catch {
      const titleEl = document.getElementById('hero-title');
      const subEl   = document.getElementById('hero-subtitle');
      if (titleEl) titleEl.textContent = t('heroTitle');
      if (subEl)   subEl.textContent   = t('heroSubtitle');
    }
  },

  async loadFeatures() {
    const el = document.getElementById('features-grid');
    if (!el) return;

    // Default features (can be overridden from DB later)
    const defaults = [
      { icon: '🎨', title_fa: 'طرح‌های حرفه‌ای',    title_en: 'Pro Designs',     desc_fa: 'هزاران طرح آماده و اختصاصی از طراحان برتر ایران',        desc_en: 'Thousands of ready designs from top Iranian designers' },
      { icon: '🖨️', title_fa: 'چاپ باکیفیت',        title_en: 'Quality Print',   desc_fa: 'اتصال مستقیم به بهترین چاپخانه‌های کشور با گارانتی کیفیت',  desc_en: 'Direct connection to top print shops with quality guarantee' },
      { icon: '⚡',  title_fa: 'تحویل سریع',          title_en: 'Fast Delivery',   desc_fa: 'سفارش‌های شما در کمترین زمان ممکن پردازش و ارسال می‌شوند', desc_en: 'Your orders processed and delivered in the shortest time' },
      { icon: '🔐', title_fa: 'امنیت کامل',          title_en: 'Full Security',   desc_fa: 'حفاظت از حقوق مالکیت معنوی و امنیت تراکنش‌ها',            desc_en: 'Intellectual property rights protection and transaction security' },
      { icon: '💰', title_fa: 'قیمت منصفانه',        title_en: 'Fair Pricing',    desc_fa: 'بهترین قیمت‌ها با شفافیت کامل و بدون هزینه مخفی',          desc_en: 'Best prices with full transparency and no hidden fees' },
      { icon: '🌟', title_fa: 'پشتیبانی ۲۴/۷',      title_en: '24/7 Support',    desc_fa: 'تیم پشتیبانی آماده پاسخگویی به تمام سوالات شما',           desc_en: 'Support team ready to answer all your questions' },
    ];

    try {
      // Try to load from DB
      const { data } = await supabase.from('settings').select('value').eq('key','features').single();
      const features = data?.value ? JSON.parse(data.value) : defaults;
      App._renderFeatures(features);
    } catch {
      App._renderFeatures(defaults);
    }
  },

  _renderFeatures(features) {
    const el = document.getElementById('features-grid');
    if (!el) return;
    el.innerHTML = features.map(f => `
      <div class="feature-card glass">
        <div class="feature-icon">${f.icon}</div>
        <div class="feature-title">${State.lang === 'fa' ? (f.title_fa||f.title||'') : (f.title_en||f.title_fa||'')}</div>
        <div class="feature-desc">${State.lang === 'fa' ? (f.desc_fa||f.desc||'') : (f.desc_en||f.desc_fa||'')}</div>
      </div>
    `).join('');
  },

  async loadFooterContent() {
    try {
      const { data } = await supabase.from('settings').select('key,value')
        .in('key', ['footer_text_fa','footer_text_en']);
      const el = document.getElementById('footer-text');
      if (!el) return;
      if (!data?.length) { el.textContent = State.lang === 'fa' ? 'پلتفرم تخصصی طراحی و چاپ' : 'Professional Design & Print Platform'; return; }
      const map = {};
      data.forEach(s => map[s.key] = s.value);
      el.textContent = map[`footer_text_${State.lang}`] || (State.lang === 'fa' ? 'پلتفرم تخصصی طراحی و چاپ' : 'Professional Design & Print Platform');
    } catch {}

    // Translate footer links
    const footerLinks = document.querySelectorAll('.footer-links a');
    const linkKeys = ['about','blog','faq','legal','support'];
    footerLinks.forEach((a, i) => { if (linkKeys[i]) a.textContent = t(linkKeys[i]); });
  },

  // ─── ABOUT PAGE ───────────────────────────────────────────
  async loadAbout() {
    App.translateAboutPage();
    try {
      const key = `about_text_${State.lang}`;
      const { data } = await supabase.from('settings').select('value').eq('key', key).single();
      const el = document.getElementById('about-main-text');
      if (el) {
        el.textContent = data?.value || (State.lang === 'fa'
          ? 'نش گرافیک پلتفرم تخصصی طراحی و چاپ در ایران است. ما با اتصال طراحان حرفه‌ای به چاپخانه‌های معتبر، فرایند سفارش و تحویل طرح را ساده و سریع کرده‌ایم.'
          : 'Nash Graphic is Iran\'s professional design and print platform. By connecting professional designers with trusted print shops, we\'ve simplified the design ordering and delivery process.');
      }
    } catch {}
  },

  translateAboutPage() {
    const titleEl = document.querySelector('#page-about .about-content h2');
    if (titleEl) titleEl.textContent = t('aboutTitle');

    const sectionTitles = document.querySelectorAll('#page-about .section-title');
    if (sectionTitles[0]) sectionTitles[0].textContent = t('ourTeam');
    if (sectionTitles[1]) sectionTitles[1].textContent = t('contactInfo');

    // Team member roles
    const teamDescs = document.querySelectorAll('#team-grid .feature-desc');
    const teamRoles = State.lang === 'fa'
      ? ['مدیرعامل و بنیان‌گذار نش گرافیک', 'سرطراح و مدیر خلاقیت', 'توسعه‌دهنده ارشد فرانت‌اند']
      : ['CEO & Founder of Nash Graphic', 'Lead Designer & Creative Director', 'Senior Frontend Developer'];
    teamDescs.forEach((el, i) => { if (teamRoles[i]) el.textContent = teamRoles[i]; });
  },

  // ─── BLOG PAGE ───────────────────────────────────────────
  async loadBlog() {
    App.translateBlogPage();
    const el = document.getElementById('blog-list');
    if (!el) return;
    el.innerHTML = '<div class="flex-center py-4"><div class="spinner"></div></div>';
    try {
      const { data } = await supabase.from('blog').select('*').order('created_at', { ascending: false });
      if (!data?.length) {
        el.innerHTML = `<div class="empty-state">${t('noArticlesYet')}</div>`;
        return;
      }
      el.innerHTML = data.map(post => `
        <div class="blog-card" onclick="App.openBlogPost('${post.id}')">
          <div class="img-wrap">
            ${post.image_url
              ? `<img src="${post.image_url}" alt="${post.title}" loading="lazy" />`
              : `<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,var(--c-surface),var(--c-card));display:flex;align-items:center;justify-content:center;font-size:3rem">📝</div>`
            }
          </div>
          <div class="blog-info">
            <div class="blog-title">${post.title}</div>
            <div class="blog-date">${formatDate(post.created_at)}</div>
            ${post.excerpt ? `<div class="blog-excerpt">${post.excerpt}</div>` : ''}
          </div>
        </div>
      `).join('');
      setupScrollReveal();
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  },

  translateBlogPage() {
    const titleEl = document.querySelector('#page-blog .section-title');
    if (titleEl) titleEl.textContent = t('blogTitle');
  },

  async openBlogPost(id) {
    const el = document.getElementById('blog-post-content');
    if (!el) return;
    el.innerHTML = '<div class="spinner"></div>';
    Modal.open('blog');
    try {
      const { data } = await supabase.from('blog').select('*').eq('id', id).single();
      if (!data) throw new Error(t('notFound'));
      el.innerHTML = `
        ${data.image_url ? `<img src="${data.image_url}" alt="${data.title}" style="width:100%;border-radius:var(--r-lg,12px);margin-bottom:1.5rem;max-height:340px;object-fit:cover" />` : ''}
        <h2 style="margin-bottom:1rem">${data.title}</h2>
        <div style="color:var(--c-text-2,var(--text-secondary));font-size:0.85rem;margin-bottom:1.5rem">${formatDate(data.created_at)}</div>
        <div style="line-height:2;color:var(--c-text-2,var(--text-secondary))">${data.content?.replace(/\n/g,'<br>') || ''}</div>
        ${data.source_url ? `<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid var(--c-border,var(--border))"><a href="${data.source_url}" target="_blank" rel="noopener" style="font-size:0.8rem">${State.lang==='fa'?'منبع':'Source'} ↗</a></div>` : ''}
      `;
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  },

  // ─── FAQ PAGE ─────────────────────────────────────────────
  async loadFaq() {
    App.translateFaqPage();
    const el = document.getElementById('faq-list');
    if (!el) return;
    el.innerHTML = '<div class="flex-center py-4"><div class="spinner"></div></div>';
    try {
      const { data } = await supabase.from('faq').select('*').order('order_index');
      if (!data?.length) {
        el.innerHTML = `<div class="empty-state">${t('noQuestionsYet')}</div>`;
        return;
      }
      el.innerHTML = data.map(f => `
        <div class="faq-item">
          <button class="faq-question" onclick="App.toggleFaq(this)">
            <span>${f.question}</span>
            <span>▾</span>
          </button>
          <div class="faq-answer">${f.answer}</div>
        </div>
      `).join('');
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  },

  translateFaqPage() {
    const titleEl = document.querySelector('#page-faq .section-title');
    if (titleEl) titleEl.textContent = t('faqQuestions');
  },

  toggleFaq(btn) {
    btn.classList.toggle('open');
    const answer = btn.nextElementSibling;
    answer.classList.toggle('open');
  },

  // ─── LEGAL PAGE ───────────────────────────────────────────
  async loadLegal(type = 'terms') {
    App.translateLegalTabs();
    const el = document.getElementById('legal-content');
    if (!el) return;
    el.innerHTML = '<div class="flex-center py-4"><div class="spinner"></div></div>';

    // Update tab buttons
    document.querySelectorAll('.legal-tabs .tab-btn').forEach((btn, i) => {
      btn.classList.toggle('active', ['terms','privacy','return'][i] === type);
    });

    const keyMap = {
      terms:   `legal_terms_${State.lang}`,
      privacy: `legal_privacy_${State.lang}`,
      return:  `legal_return_${State.lang}`,
    };

    const defaults = {
      terms:   State.lang === 'fa'
        ? '<h2>شرایط استفاده</h2><p>استفاده از خدمات نش گرافیک به منزله پذیرش تمام شرایط و قوانین این پلتفرم است.</p>'
        : '<h2>Terms of Use</h2><p>Using Nash Graphic services means accepting all terms and conditions of this platform.</p>',
      privacy: State.lang === 'fa'
        ? '<h2>حریم خصوصی</h2><p>نش گرافیک متعهد است اطلاعات شخصی کاربران را محرمانه نگه دارد.</p>'
        : '<h2>Privacy Policy</h2><p>Nash Graphic is committed to keeping users\' personal information confidential.</p>',
      return:  State.lang === 'fa'
        ? '<h2>قوانین بازگشت</h2><p>در صورت عدم رضایت از محصول، ظرف ۷ روز امکان بازگشت وجود دارد.</p>'
        : '<h2>Return Policy</h2><p>If not satisfied with the product, return is possible within 7 days.</p>',
    };

    try {
      const { data } = await supabase.from('settings').select('value').eq('key', keyMap[type]).single();
      el.innerHTML = data?.value || defaults[type];
    } catch {
      el.innerHTML = defaults[type];
    }
  },

  translateLegalTabs() {
    const tabs = document.querySelectorAll('.legal-tabs .tab-btn');
    const keys = ['termsOfUse','privacyPolicy','returnPolicy'];
    tabs.forEach((btn, i) => { if (keys[i]) btn.textContent = t(keys[i]); });
  },

  // ─── TRANSLATE STATIC HTML ELEMENTS ─────────────────────
  translateStaticHTML() {
    const L = State.lang;

    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t(k);
      } else {
        el.textContent = t(k);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });

    // ── Header ──
    const cartBtnText = document.querySelector('#cart-btn');
    // (icon stays, no text to translate beyond count)

    // ── Hero CTA ──
    const heroCta = document.getElementById('hero-cta');
    if (heroCta) heroCta.textContent = L === 'fa' ? 'ورود به بازارچه' : 'Enter Marketplace';

    // ── Marketplace ──
    const mpTitle = document.querySelector('#page-marketplace .section-title');
    if (mpTitle) mpTitle.textContent = t('marketplace');

    const searchEl = document.getElementById('search-input');
    if (searchEl) searchEl.placeholder = t('searchInDesigns');

    const catFilter = document.getElementById('category-filter');
    if (catFilter && catFilter.options[0]) catFilter.options[0].text = t('allCategories');

    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
      [...sortFilter.options].forEach((opt, i) => {
        const keys = ['newest','popular','cheap','expensive'];
        const labelKeys = ['newest','mostPopular','cheapest','mostExpensive'];
        if (labelKeys[i]) opt.text = t(labelKeys[i]);
      });
    }

    // ── Checkout form (request-based, no payment) ──
    const checkoutTitleEl = document.getElementById('checkout-modal-title');
    if (checkoutTitleEl) checkoutTitleEl.textContent = t('completeOrder');
    const checkoutPhoneEl = document.getElementById('checkout-phone');
    if (checkoutPhoneEl) checkoutPhoneEl.placeholder = `${t('phone')} (${L === 'fa' ? 'الزامی' : 'required'})`;
    const checkoutAddressEl = document.getElementById('checkout-address');
    if (checkoutAddressEl) checkoutAddressEl.placeholder = `${t('deliveryAddress')} (${L === 'fa' ? 'اختیاری' : 'optional'})`;
    const checkoutDisclaimerEl = document.getElementById('checkout-disclaimer');
    if (checkoutDisclaimerEl) checkoutDisclaimerEl.textContent = t('orderRequestSentDesc');
    const checkoutSubmitEl = document.getElementById('checkout-submit-btn');
    if (checkoutSubmitEl) checkoutSubmitEl.textContent = t('requestOrder');
    const receiptPrintBtn = document.getElementById('receipt-print-btn');
    if (receiptPrintBtn) receiptPrintBtn.textContent = t('printReceipt');

    // ── Profile page ──
    const profileTitle = document.querySelector('#page-profile .section-title');
    if (profileTitle) profileTitle.textContent = t('profile');
    if (Router.current === 'profile') Profile.translatePage();

    // ── Ticket / Support form ──
    if (Router.current === 'support') Support.translatePage();

    // ── Tracking page ──
    Tracking.translatePage();

    // ── About page ──
    const aboutTitle = document.querySelector('#page-about .about-content h2');
    if (aboutTitle) aboutTitle.textContent = t('aboutTitle');
    const ourTeamTitle = document.querySelector('#page-about .features-section:first-of-type .section-title');
    if (ourTeamTitle) ourTeamTitle.textContent = t('ourTeam');
    const contactInfoTitle = document.querySelector('#page-about .features-section:last-of-type .section-title');
    if (contactInfoTitle) contactInfoTitle.textContent = t('contactInfo');

    // ── Blog, FAQ, Tracking, Support page titles ──
    const blogTitle = document.querySelector('#page-blog .section-title');
    if (blogTitle) blogTitle.textContent = t('blogTitle');
    const faqTitle = document.querySelector('#page-faq .section-title');
    if (faqTitle) faqTitle.textContent = t('faq');
    const trackingTitle = document.querySelector('#page-tracking .section-title');
    if (trackingTitle) trackingTitle.textContent = t('trackingTitle');
    const supportTitle = document.querySelector('#page-support .section-title');
    if (supportTitle) supportTitle.textContent = t('supportTitle');
    const newTicketTitle = document.querySelector('#page-support .dash-card:first-child h3');
    if (newTicketTitle) newTicketTitle.textContent = t('newTicketTitle');
    const myTicketsTitle = document.querySelector('#page-support .dash-card:last-child h3');
    if (myTicketsTitle) myTicketsTitle.textContent = t('myTicketsTitle');

    // ── Dashboards ──
    if (Router.current === 'designer-dashboard') Dashboard.translateDesignerPage();
    if (Router.current === 'printer-dashboard')  Dashboard.translatePrinterPage();

    // ── Portfolio ──
    if (Router.current === 'portfolio-edit') Portfolio.translateEditPageStatic();
    if (Router.current === 'portfolio-view') Portfolio.loadPublicView();

    // ── Admin ──
    if (Router.current === 'admin') Admin.translateTabs();

    // ── Footer ──
    App.loadFooterContent();
    const footerBottom = document.querySelector('.footer-bottom p');
    if (footerBottom) {
      footerBottom.textContent = L === 'fa'
        ? '© ۱۴۰۳ نش گرافیک - تمامی حقوق محفوظ است'
        : '© 2025 Nash Graphic - All rights reserved';
    }

    // ── 404 page ──
    const errTitle = document.querySelector('#page-404 h2');
    const errDesc  = document.querySelector('#page-404 p');
    const errBtn   = document.querySelector('#page-404 .btn-primary');
    if (errTitle) errTitle.textContent = t('pageNotFound');
    if (errDesc)  errDesc.textContent  = t('pageNotFoundDesc');
    if (errBtn)   errBtn.textContent   = t('backToHome');

    // ── Modal headings that are static ──
    const cartModalTitle = document.querySelector('#modal-cart h3');
    if (cartModalTitle) cartModalTitle.textContent = '🛒 ' + t('cart');

    const uploadModalTitle = document.querySelector('#modal-upload h3');
    if (uploadModalTitle) uploadModalTitle.textContent = t('uploadNewDesign');
    Marketplace.translateUploadForm();

    const uploadFileLabel  = document.querySelectorAll('#modal-upload .label');
    if (uploadFileLabel[0]) uploadFileLabel[0].textContent = `${t('mainFile')} (PSD/AI/EPS/PDF — ${L==='fa'?'حداکثر ۲۰MB':'max 20MB'})`;
    if (uploadFileLabel[1]) uploadFileLabel[1].textContent = `${t('previewImage')} (JPG/PNG)`;

    const uploadSubmitBtn = document.querySelector('#modal-upload .btn-primary');
    if (uploadSubmitBtn && uploadSubmitBtn.textContent.includes('آپلود طرح') || (uploadSubmitBtn && uploadSubmitBtn.textContent === 'Upload Design')) {
      uploadSubmitBtn.textContent = t('upload');
    }

    // ── Brand name (header logo + footer logo) ──
    const headerLogoText = document.getElementById('header-logo-text');
    const footerLogoText = document.getElementById('footer-logo-text');
    if (headerLogoText) headerLogoText.textContent = t('brandName');
    if (footerLogoText) footerLogoText.textContent = t('brandName');

    // Update document title
    document.title = L === 'fa' ? `${t('brandName')} | Nash Graphic` : `Nash Graphic | ${t('brandName')}`;

    // Auth modal (if open or about to open)
    Auth.translateForms();
  },

  // ─── REALTIME SUBSCRIPTIONS ──────────────────────────────
  setupRealtime() {
    // Real-time: cart count from orders (notifications)
    supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications'
      }, (payload) => {
        if (State.user?.role === 'admin') {
          toast(`🔔 ${payload.new.title}`, 'info');
        }
      })
      .subscribe();

    // Real-time: orders status change for logged-in user
    if (State.user) {
      supabase.channel('my-orders')
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'orders',
          filter: `user_id=eq.${State.user.id}`
        }, (payload) => {
          toast(`📦 ${t('statusUpdated')} «${t(payload.new.status)}»`, 'info');
        })
        .subscribe();
    }
  },
};

// ─── GLOBAL HELPERS (called from HTML onclick) ──────────────
function showLegal(type) {
  App.loadLegal(type);
}

// ─── TRACK STEPS CSS (add to page) ──────────────────────────
const trackingCSS = document.createElement('style');
trackingCSS.textContent = `
  .tracking-steps {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    position: relative;
    padding: 1rem 0;
  }
  .tracking-steps::before {
    content: '';
    position: absolute;
    top: 28px;
    right: 10%;
    left: 10%;
    height: 3px;
    background: var(--border);
  }
  .tracking-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
  }
  .step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 3px solid var(--border);
    transition: all 0.3s ease;
  }
  .step-dot.active {
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-light);
  }
  .tracking-step.done .step-dot {
    background: var(--success);
    border-color: var(--success);
  }
  .step-label {
    font-size: 0.78rem;
    color: var(--text-secondary);
    text-align: center;
    max-width: 70px;
  }
  .tracking-step.done .step-label { color: var(--success); }
`;
document.head.appendChild(trackingCSS);

// ─── SCROLL-TRIGGERED REVEAL ANIMATION ──────────────────────
function setupScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll(
    '.stat-card, .feature-card, .design-card, .blog-card, .dash-card, .package-card, .theme-card, .faq-item'
  ).forEach((el, i) => {
    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal');
      // delay staggered for grid items
      if (i % 4 === 1) el.classList.add('reveal-delay-1');
      if (i % 4 === 2) el.classList.add('reveal-delay-2');
      if (i % 4 === 3) el.classList.add('reveal-delay-3');
      observer.observe(el);
    }
  });
}

// ─── START APP ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init().then(() => {
    setupScrollReveal();
    // Re-run after each navigation so dynamically rendered cards reveal too
    const originalNavigate = Router.navigate.bind(Router);
    Router.navigate = (page) => {
      originalNavigate(page);
      setTimeout(setupScrollReveal, 150);
    };
  }).catch((err) => {
    // Surface init errors directly on-screen (useful for mobile debugging
    // where opening devtools isn't convenient).
    console.error('App.init() failed:', err);
    showLoading(false);
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#1a0000;color:#ff8080;padding:20px;font-family:monospace;font-size:13px;overflow:auto;direction:ltr;text-align:left;white-space:pre-wrap;';
    box.textContent = '⚠️ App initialization error:\n\n' + (err?.stack || err?.message || String(err));
    document.body.appendChild(box);
  });
});

console.log('✅ app.js loaded');
