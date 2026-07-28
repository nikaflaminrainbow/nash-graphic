/* ============================================================
   auth.js — Authentication, role detection, session management
   ============================================================ */

const Auth = {
  _selectedRole: 'designer',

  // ─── Show auth tab (login / register / forgot) ───────────
  showTab(tab) {
    ['login', 'register', 'forgot'].forEach(id => {
      const el = document.getElementById(`${id}-form`);
      el?.classList.toggle('hidden', id !== tab);
    });
    document.querySelectorAll('#auth-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim() === (tab === 'login' ? t('login') : t('register')));
    });
    Auth.translateForms();
  },

  showForgot() {
    Auth.showTab('forgot');
  },

  selectRole(role) {
    Auth._selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-role') === role);
    });
  },

  // ─── TRANSLATE AUTH FORMS ─────────────────────────────────
  translateForms() {
    const map = {
      'login-email':     t('email'),
      'login-password':  t('password'),
      'reg-name':        t('fullName'),
      'reg-email':       t('email'),
      'reg-phone':       `${t('phone')} (${State.lang === 'fa' ? 'الزامی' : 'required'})`,
      'reg-password':    t('password'),
      'reg-confirm':     t('confirmPassword'),
      'forgot-email':    t('email'),
    };
    Object.entries(map).forEach(([id, ph]) => {
      const el = document.getElementById(id);
      if (el) el.placeholder = ph;
    });

    // Headings
    const loginH3  = document.querySelector('#login-form h3');
    const regH3    = document.querySelector('#register-form h3');
    const forgotH3 = document.querySelector('#forgot-form h3');
    if (loginH3)  loginH3.textContent  = t('loginToAccount');
    if (regH3)    regH3.textContent    = t('registerNew');
    if (forgotH3) forgotH3.textContent = t('resetPassword');

    // Buttons
    const loginBtn    = document.querySelector('#login-form .btn-primary');
    const guestBtn     = document.querySelector('#login-form .btn-outline');
    const forgotLink   = document.querySelector('#login-form .auth-links a');
    const regBtn       = document.querySelector('#register-form .btn-primary');
    const resetBtn      = document.querySelector('#forgot-form .btn-primary');
    const backBtn        = document.querySelector('#forgot-form .btn-ghost');
    if (loginBtn)  loginBtn.textContent  = t('login');
    if (guestBtn)  guestBtn.textContent  = '👤 ' + t('loginAsGuest');
    if (forgotLink) forgotLink.textContent = t('forgotPassword');
    if (regBtn)    regBtn.textContent    = t('register');
    if (resetBtn)  resetBtn.textContent  = t('sendResetLink');
    if (backBtn)   backBtn.textContent   = t('back');

    // Role buttons
    const designerBtn = document.querySelector('.role-btn[data-role="designer"]');
    const printerBtn  = document.querySelector('.role-btn[data-role="printer"]');
    if (designerBtn) designerBtn.textContent = '👨‍🎨 ' + t('designer');
    if (printerBtn)  printerBtn.textContent  = '🖨️ ' + t('printer');

    // Tab buttons
    document.querySelectorAll('#auth-tabs .tab-btn')[0] && (document.querySelectorAll('#auth-tabs .tab-btn')[0].textContent = t('login'));
    document.querySelectorAll('#auth-tabs .tab-btn')[1] && (document.querySelectorAll('#auth-tabs .tab-btn')[1].textContent = t('register'));
  },

  // ─── LOGIN ───────────────────────────────────────────────
  async login() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) { toast(t('fillRequired'), 'warning'); return; }

    showLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const profile = await Auth._fetchProfile(data.user.id, email);
      State.user    = profile;
      State.isGuest = false;

      toast(t('loginSuccess'), 'success');
      Modal.close('auth');
      Auth._redirectByRole(profile.role);
      App.updateHeader();
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  // ─── REGISTER ────────────────────────────────────────────
  async register() {
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const phone    = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;
    const role     = Auth._selectedRole;

    if (!name || !email || !phone || !password || !confirm) { toast(t('fillRequired'), 'warning'); return; }
    if (phone.replace(/\D/g,'').length < 8) { toast(t('phoneRequired'), 'warning'); return; }
    if (password !== confirm) { toast(t('passwordMismatch'), 'error'); return; }
    if (password.length < 6)  { toast(State.lang === 'fa' ? 'رمز عبور باید حداقل ۶ کاراکتر باشد' : 'Password must be at least 6 characters', 'warning'); return; }

    showLoading(true);
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const userId = data.user.id;

      // Insert profile into users table
      await DB.insert('users', { id: userId, email, role, name, phone, is_active: true });

      State.user    = { id: userId, email, role, name, phone, avatar: null };
      State.isGuest = false;

      toast(t('registerSuccess'), 'success');
      Modal.close('auth');
      Auth._redirectByRole(role);
      App.updateHeader();
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  // ─── GUEST LOGIN ────────────────────────────────────────
  loginAsGuest() {
    State.user    = null;
    State.isGuest = true;
    toast(State.lang === 'fa' ? 'به عنوان مهمان وارد شدید. برای آپلود فایل ثبت‌نام کنید.' : 'Logged in as guest. Register to upload files.', 'info');
    Modal.close('auth');
    App.updateHeader();
    Router.navigate('home');
  },

  // ─── RESET PASSWORD ──────────────────────────────────────
  async resetPassword() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { toast(t('fillRequired'), 'warning'); return; }
    showLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href
      });
      if (error) throw error;
      toast(t('resetEmailSent'), 'success');
      Auth.showTab('login');
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  // ─── LOGOUT ──────────────────────────────────────────────
  async logout() {
    showLoading(true);
    try {
      await supabase.auth.signOut();
      State.user    = null;
      State.isGuest = false;
      State.cart    = [];
      localStorage.removeItem('nika_cart');
      Cart.updateCount();
      toast(t('logoutSuccess'), 'success');
      App.updateHeader();
      Router.navigate('home');
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  // ─── FETCH PROFILE ───────────────────────────────────────
  async _fetchProfile(userId, email) {
    try {
      const { data, error } = await supabase
        .from('users').select('*').eq('id', userId).single();
      if (error || !data) {
        // Admin fallback: detect by email
        const role = email === 'nikadesigningco@gmail.com' ? 'admin' : 'designer';
        return { id: userId, email, role, name: email, phone: '', avatar: null };
      }
      return data;
    } catch {
      return { id: userId, email, role: 'designer', name: email, phone: '', avatar: null };
    }
  },

  // ─── REDIRECT BY ROLE ────────────────────────────────────
  _redirectByRole(role) {
    switch(role) {
      case 'admin':    Router.navigate('admin');              break;
      case 'designer': Router.navigate('designer-dashboard'); break;
      case 'printer':  Router.navigate('home');               break;
      default:         Router.navigate('home');
    }
  },

  // ─── RESTORE SESSION ON LOAD ─────────────────────────────
  async restoreSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await Auth._fetchProfile(session.user.id, session.user.email);
        State.user    = profile;
        State.isGuest = false;
        return profile;
      }
    } catch (err) {
      console.warn('Session restore failed:', err);
    }
    return null;
  },

  // ─── AUTH STATE LISTENER ─────────────────────────────────
  listen() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        State.user    = null;
        State.isGuest = false;
        App.updateHeader();
      }
      if (event === 'PASSWORD_RECOVERY') {
        const newPwd = prompt(State.lang === 'fa' ? 'رمز عبور جدید را وارد کنید:' : 'Enter new password:');
        if (newPwd) {
          const { error } = await supabase.auth.updateUser({ password: newPwd });
          if (error) toast(error.message, 'error');
          else toast(t('passwordChanged'), 'success');
        }
      }
    });
  }
};

// ─── PROFILE MODULE ──────────────────────────────────────────
const Profile = {
  async load() {
    if (!State.user) { Router.navigate('home'); return; }
    const u = State.user;
    const avatar = document.getElementById('profile-avatar');
    if (u.avatar) avatar.src = u.avatar;
    document.getElementById('profile-name').value  = u.name  || '';
    document.getElementById('profile-email').value = u.email || '';
    document.getElementById('profile-phone').value = u.phone || '';
    // Load address from orders or extended profile
    try {
      const { data } = await supabase.from('users').select('*').eq('id', u.id).single();
      if (data?.address) document.getElementById('profile-address').value = data.address;
    } catch {}
    Profile.translatePage();
    Profile.loadOrders();
    Profile.loadWishlist();
  },

  translatePage() {
    const titleEl = document.querySelector('#page-profile .section-title');
    if (titleEl) titleEl.textContent = t('profile');

    const labels = document.querySelectorAll('#page-profile .label');
    const labelKeys = ['fullName','email','phone','address'];
    labels.forEach((el, i) => { if (labelKeys[i]) el.textContent = t(labelKeys[i]); });

    const uploadBtn = document.getElementById('upload-avatar-btn');
    if (uploadBtn) uploadBtn.textContent = t('changePhoto');

    const newPwdEl     = document.getElementById('new-password');
    const confirmPwdEl = document.getElementById('confirm-password');
    if (newPwdEl)     newPwdEl.placeholder     = t('newPasswordLabel');
    if (confirmPwdEl) confirmPwdEl.placeholder = t('confirmPassword');

    document.querySelectorAll('#page-profile .dash-card h3').forEach(h3 => {
      const txt = h3.textContent.trim();
      if (txt.includes('رمز') || txt.toLowerCase().includes('password')) h3.textContent = t('changePasswordBtn');
      if (txt.includes('تاریخچه') || txt.toLowerCase().includes('order history')) h3.textContent = t('orderHistory');
      if (txt.includes('علاقه') || txt.toLowerCase().includes('wishlist')) h3.textContent = t('wishlist');
    });

    const saveBtn = document.querySelector('#page-profile .profile-form .btn-primary');
    if (saveBtn) saveBtn.textContent = t('saveChanges');
    const changePwdBtn = document.querySelector('#page-profile .btn-outline');
    if (changePwdBtn) changePwdBtn.textContent = t('changePasswordBtn');
  },

  async save() {
    if (!State.user) return;
    const name    = document.getElementById('profile-name').value.trim();
    const phone   = document.getElementById('profile-phone').value.trim();
    const address = document.getElementById('profile-address').value.trim();

    if (!phone) { toast(t('phoneRequired'), 'warning'); return; }
    if (phone.replace(/\D/g,'').length < 8) { toast(t('phoneRequired'), 'warning'); return; }

    showLoading(true);
    try {
      await DB.update('users', State.user.id, { name, phone, address, updated_at: new Date().toISOString() });
      State.user.name  = name;
      State.user.phone = phone;
      toast(t('saveSuccess'), 'success');
      App.updateHeader();
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  async changePassword() {
    const newPwd  = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    if (!newPwd || !confirm) { toast(t('fillRequired'), 'warning'); return; }
    if (newPwd !== confirm)   { toast(t('passwordMismatch'), 'error'); return; }
    showLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast(t('passwordChanged'), 'success');
      document.getElementById('new-password').value  = '';
      document.getElementById('confirm-password').value = '';
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  async uploadAvatar() {
    if (!checkUploadPermission()) return;
    const file = document.getElementById('avatar-input').files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast(t('thumbTooLarge'), 'error'); return; }
    showLoading(true);
    try {
      const path = `${State.user.id}/avatar.${file.name.split('.').pop()}`;
      const url  = await DB.uploadFile('avatars', path, file);
      await DB.update('users', State.user.id, { avatar: url });
      State.user.avatar = url;
      document.getElementById('profile-avatar').src = url;
      toast(t('uploadSuccess'), 'success');
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  async loadOrders() {
    const el = document.getElementById('order-history');
    if (!el || !State.user) return;
    try {
      const { data } = await supabase.from('orders')
        .select('*').eq('user_id', State.user.id)
        .order('created_at', { ascending: false }).limit(20);
      if (!data?.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noOrdersYet')}</p>`; return; }
      el.innerHTML = data.map(o => `
        <div class="ticket-item">
          <div class="flex-between">
            <span class="ticket-subject">${t('order')} #${o.tracking_code || o.id.slice(0,8)}</span>
            <span class="design-status status-${o.status}">${t(o.status) || o.status}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.3rem">
            ${formatDate(o.created_at)} — ${formatPrice(o.final_amount || o.total_amount)}
          </div>
        </div>
      `).join('');
    } catch (err) {
      el.innerHTML = `<p style="color:var(--danger)">${t('error')}</p>`;
    }
  },

  async loadWishlist() {
    const el = document.getElementById('wishlist-items');
    if (!el) return;
    try {
      let q = supabase.from('wishlist').select('*, designs(title, thumbnail_url, price)');
      if (State.user) q = q.eq('user_id', State.user.id);
      else q = q.eq('guest_session_id', State.guestSessionId);
      const { data } = await q.limit(20);
      if (!data?.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noWishlistYet')}</p>`; return; }
      el.innerHTML = data.map(w => {
        const d = w.designs;
        return `<div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${d?.title || '—'}</div>
            <div class="cart-item-price">${formatPrice(d?.price || 0)}</div>
          </div>
          <button class="cart-item-remove" onclick="Marketplace.openDesign('${w.design_id}')">👁️</button>
          <button class="cart-item-remove" onclick="Profile.removeWishlist('${w.id}')">🗑️</button>
        </div>`;
      }).join('');
    } catch {}
  },

  async removeWishlist(id) {
    try {
      await DB.delete('wishlist', id);
      toast(t('deleteSuccess'), 'success');
      Profile.loadWishlist();
    } catch (err) {
      toast(err.message, 'error');
    }
  }
};

// ─── SUPPORT MODULE ──────────────────────────────────────────
const Support = {
  async load() {
    Support.translatePage();
    Support.loadMyTickets();
    // Prefill if logged in
    if (State.user) {
      const name  = document.getElementById('ticket-name');
      const email = document.getElementById('ticket-email');
      if (name)  name.value  = State.user.name  || '';
      if (email) email.value = State.user.email || '';
    }
  },

  translatePage() {
    const titleEl = document.querySelector('#page-support .section-title');
    if (titleEl) titleEl.textContent = t('supportTitle');

    const h3s = document.querySelectorAll('#page-support .dash-card h3');
    if (h3s[0]) h3s[0].textContent = t('newTicketTitle');
    if (h3s[1]) h3s[1].textContent = t('myTicketsTitle');

    const map = {
      'ticket-name':    t('yourName'),
      'ticket-email':   t('email'),
      'ticket-subject': t('subject'),
      'ticket-message': t('yourMessage'),
    };
    Object.entries(map).forEach(([id, ph]) => {
      const el = document.getElementById(id);
      if (el) el.placeholder = ph;
    });

    const sendBtn = document.querySelector('#page-support .btn-primary');
    if (sendBtn) sendBtn.textContent = t('sendTicketBtn');
  },

  async submitTicket() {
    const name    = document.getElementById('ticket-name').value.trim();
    const email   = document.getElementById('ticket-email').value.trim();
    const subject = document.getElementById('ticket-subject').value.trim();
    const message = document.getElementById('ticket-message').value.trim();
    if (!name || !email || !subject || !message) { toast(t('fillRequired'), 'warning'); return; }
    showLoading(true);
    try {
      await DB.insert('tickets', {
        user_id: State.user?.id || null,
        guest_email: State.isGuest ? email : null,
        name, email, subject, message,
        status: 'open',
        created_at: new Date().toISOString()
      });
      toast(t('ticketSubmitted'), 'success');
      ['ticket-name','ticket-email','ticket-subject','ticket-message'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      Support.loadMyTickets();
    } catch (err) {
      toast(err.message || t('error'), 'error');
    } finally {
      showLoading(false);
    }
  },

  async loadMyTickets() {
    const el = document.getElementById('my-tickets');
    if (!el) return;
    try {
      let q = supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(10);
      if (State.user) q = q.eq('user_id', State.user.id);
      // guests see nothing without user_id (can track by email separately)
      const { data } = await q;
      if (!data?.length) { el.innerHTML = `<p style="color:var(--text-secondary)">${t('noTicketsYet')}</p>`; return; }
      el.innerHTML = data.map(tk => `
        <div class="ticket-item">
          <div class="flex-between">
            <span class="ticket-subject">${tk.subject}</span>
            <span class="badge ${tk.status === 'open' ? 'badge-info' : 'badge-success'}">${tk.status === 'open' ? t('openStatus') : t('closedStatus')}</span>
          </div>
          ${tk.reply ? `<div style="margin-top:0.5rem;padding:0.5rem;background:var(--accent-light);border-radius:var(--radius);font-size:0.85rem"><strong>${t('adminReply')}</strong> ${tk.reply}</div>` : ''}
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem">${formatDate(tk.created_at)}</div>
        </div>
      `).join('');
    } catch {}
  }
};

// ─── TRACKING MODULE ─────────────────────────────────────────
const Tracking = {
  async search() {
    const code = document.getElementById('tracking-code-input').value.trim();
    if (!code) { toast(State.lang === 'fa' ? 'کد پیگیری را وارد کنید' : 'Please enter a tracking code', 'warning'); return; }
    const el = document.getElementById('tracking-result');
    el.innerHTML = '<div class="spinner-sm"></div>';
    try {
      const { data, error } = await supabase
        .from('orders').select('*').eq('tracking_code', code).single();
      if (error || !data) { el.innerHTML = `<div class="empty-state">${t('orderNotFound')}</div>`; return; }

      const steps = ['pending_review','contacted','processing','shipped','delivered'];
      const curIdx = steps.indexOf(data.status);
      const isCancelled = data.status === 'cancelled';

      el.innerHTML = `
        <div class="dash-card glass" style="margin-top:1.5rem">
          <div class="flex-between" style="margin-bottom:1.5rem">
            <h3>${t('order')} #${data.tracking_code}</h3>
            <span class="design-status status-${data.status}">${t(data.status)}</span>
          </div>
          ${isCancelled ? '' : `
            <div class="tracking-steps">
              ${steps.map((s, i) => `
                <div class="tracking-step ${i <= curIdx ? 'done' : ''}">
                  <div class="step-dot ${i <= curIdx ? 'active' : ''}"></div>
                  <div class="step-label">${t(s)}</div>
                </div>
              `).join('')}
            </div>
          `}
          <div style="margin-top:1.5rem;padding:1rem;background:var(--bg-secondary);border-radius:var(--radius)">
            <p><strong>${t('nameLabel')}</strong> ${data.user_name || data.guest_name || '—'}</p>
            <p><strong>${t('registerDate')}</strong> ${formatDate(data.created_at)}</p>
            <p><strong>${t('amountLabel')}</strong> ${formatPrice(data.final_amount || data.total_amount)}</p>
            ${data.contact_platform ? `<p><strong>${t('contactedViaLabel')}:</strong> ${t(data.contact_platform)}</p>` : ''}
          </div>
        </div>`;

      // Real-time subscription
      supabase.channel(`order-${data.id}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'orders',
          filter: `id=eq.${data.id}`
        }, (payload) => {
          toast(`${t('statusUpdated')} ${t(payload.new.status)}`, 'info');
          Tracking.search();
        })
        .subscribe();
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  },

  translatePage() {
    const titleEl = document.querySelector('#page-tracking .section-title');
    if (titleEl) titleEl.textContent = t('trackingTitle');
    const inputEl = document.getElementById('tracking-code-input');
    if (inputEl) inputEl.placeholder = t('enterTrackingCode');
    const btnEl = document.querySelector('#page-tracking .btn-primary');
    if (btnEl) btnEl.textContent = t('searchBtn');
  }
};

console.log('✅ auth.js loaded');
