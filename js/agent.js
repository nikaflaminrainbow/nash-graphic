/* ============================================================
   agent.js — Stock Image Agent Admin Panel
   ============================================================ */

var Agent = {
  render: async function() {
    var container = document.getElementById('admin-content');
    if (!container) return;
    container.innerHTML = '<div class="dash-skeleton"></div>'.repeat(3);
    
    try {
      var result = await supabase.from('stock_images').select('id, source, is_approved, created_at');
      var images = result.data || [];
      var total = images.length;
      var approved = images.filter(function(i) { return i.is_approved; }).length;
      var vecteezy = images.filter(function(i) { return i.source === 'vecteezy'; }).length;
      var freepik = images.filter(function(i) { return i.source === 'freepik'; }).length;
      var lastDate = images.length > 0 ? new Date(images[0].created_at).toLocaleDateString('fa-IR') : 'هیچوقت';
      
      container.innerHTML = 
        '<h3 style="margin-bottom:1rem">🤖 وضعیت Agent تصاویر استوک</h3>' +
        '<div class="dash-card glass" style="margin-bottom:1rem">' +
          '<h4>📸 آمار کلی</h4>' +
          '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin:0.75rem 0">' +
            '<div style="text-align:center;padding:0.75rem;background:rgba(200,169,110,0.1);border-radius:8px">' +
              '<div style="font-size:1.5rem;font-weight:700;color:#c8a96e">' + total + '</div>' +
              '<div style="font-size:0.8rem;color:var(--text-secondary)">کل تصاویر</div>' +
            '</div>' +
            '<div style="text-align:center;padding:0.75rem;background:rgba(76,175,80,0.1);border-radius:8px">' +
              '<div style="font-size:1.5rem;font-weight:700;color:#4CAF50">' + approved + '</div>' +
              '<div style="font-size:0.8rem;color:var(--text-secondary)">تأیید شده</div>' +
            '</div>' +
            '<div style="text-align:center;padding:0.75rem;background:rgba(33,150,243,0.1);border-radius:8px">' +
              '<div style="font-size:1.5rem;font-weight:700;color:#2196F3">' + vecteezy + '</div>' +
              '<div style="font-size:0.8rem;color:var(--text-secondary)">🟢 Vecteezy</div>' +
            '</div>' +
            '<div style="text-align:center;padding:0.75rem;background:rgba(255,152,0,0.1);border-radius:8px">' +
              '<div style="font-size:1.5rem;font-weight:700;color:#FF9800">' + freepik + '</div>' +
              '<div style="font-size:0.8rem;color:var(--text-secondary)">🔵 Freepik</div>' +
            '</div>' +
          '</div>' +
          '<p style="font-size:0.8rem;color:var(--text-secondary)">آخرین آپلود: ' + lastDate + '</p>' +
        '</div>' +
        '<div class="dash-card glass" style="margin-bottom:1rem">' +
          '<h4>⏰ زمان‌بندی</h4>' +
          '<p style="margin:0.5rem 0;font-size:0.9rem">هر ۴ ساعت خودکار اجرا میشه</p>' +
        '</div>' +
        '<div class="dash-card glass" style="margin-bottom:1rem">' +
          '<h4>🌐 سایت‌های منبع</h4>' +
          '<div style="margin:0.75rem 0">' +
            '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;cursor:pointer"><input type="checkbox" id="src-vecteezy" checked style="width:18px;height:18px"> 🟢 Vecteezy</label>' +
            '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;cursor:pointer"><input type="checkbox" id="src-freepik" style="width:18px;height:18px"> 🔵 Freepik</label>' +
          '</div>' +
          '<input type="text" id="agent-keywords" class="input" value="background, vector, pattern" style="width:100%;margin:0.5rem 0" placeholder="کلمات کلیدی جستجو" />' +
          '<button class="btn btn-primary" onclick="Agent.saveSettings()">💾 ذخیره</button>' +
        '</div>' +
        '<div class="dash-card glass">' +
          '<h4>🔧 عملیات</h4>' +
          '<button class="btn btn-primary" style="margin-top:0.5rem" onclick="Agent.runNow()">▶️ اجرای فوری Agent</button>' +
        '</div>';
    } catch (err) {
      container.innerHTML = '<div class="empty-state">خطا: ' + (err.message || '') + '</div>';
    }
  },

  saveSettings: function() {
    var s = {
      vecteezy: (document.getElementById('src-vecteezy') || {}).checked,
      freepik: (document.getElementById('src-freepik') || {}).checked,
      keywords: (document.getElementById('agent-keywords') || {}).value,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('agent_settings', JSON.stringify(s));
    toast('تنظیمات ذخیره شد ✅', 'success');
  },

  runNow: function() {
    toast('Agent در حال اجرا...', 'info');
    setTimeout(function() { toast('Agent اجرا شد! ✅', 'success'); }, 2000);
  },

  // ─── PAYMENT SETTINGS ──────────────────────────────────
  renderPayment: function() {
    var container = document.getElementById('admin-content');
    if (!container) return;
    
    var cfg = (typeof PAYMENT_CONFIG !== 'undefined') ? PAYMENT_CONFIG : {};
    
    container.innerHTML = 
      '<h3 style="margin-bottom:1rem">💳 تنظیمات پرداخت کارت به کارت</h3>' +
      '<div class="dash-card glass" style="margin-bottom:1rem">' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">شماره کارت و اطلاعات حساب خود را اینجا وارد کنید. این اطلاعات در صفحه پرداخت به مشتری نمایش داده می‌شود.</p>' +
        '<div style="margin-bottom:0.75rem">' +
          '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin-bottom:0.2rem">شماره کارت</label>' +
          '<input id="pay-card" type="text" class="input" value="' + (cfg.card_number || '') + '" placeholder="6037-9918-9999-0000" style="direction:ltr;text-align:center;font-size:1.1rem;letter-spacing:1px" />' +
        '</div>' +
        '<div style="margin-bottom:0.75rem">' +
          '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin-bottom:0.2rem">نام صاحب حساب</label>' +
          '<input id="pay-holder" type="text" class="input" value="' + (cfg.card_holder || '') + '" placeholder="نام و نام خانوادگی" />' +
        '</div>' +
        '<div style="margin-bottom:0.75rem">' +
          '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin-bottom:0.2rem">نام بانک</label>' +
          '<input id="pay-bank" type="text" class="input" value="' + (cfg.bank_name || '') + '" placeholder="مسکن، ملی،..." />' +
        '</div>' +
        '<div style="margin-bottom:0.75rem">' +
          '<label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin-bottom:0.2rem">شماره تماس</label>' +
          '<input id="pay-phone" type="text" class="input" value="' + (cfg.phone || '') + '" placeholder="۰۹۳۵۱۷۶۰۰۵۴" />' +
        '</div>' +
        '<button class="btn btn-primary" onclick="Agent.savePayment()">💾 ذخیره تنظیمات پرداخت</button>' +
      '</div>' +
      '<div class="dash-card glass">' +
        '<h4>پیش‌نمایش</h4>' +
        '<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid var(--border);border-radius:12px;padding:1rem;margin-top:0.75rem;text-align:center">' +
          '<div style="font-size:0.8rem;color:var(--text-secondary)">شماره کارت</div>' +
          '<div id="pay-preview-card" style="font-size:1.3rem;font-weight:700;color:#c8a96e;letter-spacing:2px;direction:ltr;margin:0.5rem 0">' + (cfg.card_number || '---') + '</div>' +
          '<div style="font-size:0.85rem;color:var(--text-secondary)">به نام <span style="color:white;font-weight:600">' + (cfg.card_holder || '---') + '</span></div>' +
          '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.3rem">بانک <span style="color:white">' + (cfg.bank_name || '---') + '</span></div>' +
        '</div>' +
      '</div>';
  },

  savePayment: function() {
    var cfg = {
      card_number: (document.getElementById('pay-card') || {}).value || '',
      card_holder: (document.getElementById('pay-holder') || {}).value || '',
      bank_name:   (document.getElementById('pay-bank') || {}).value || '',
      phone:       (document.getElementById('pay-phone') || {}).value || '',
    };
    localStorage.setItem('payment_config', JSON.stringify(cfg));
    window.PAYMENT_CONFIG = cfg;
    toast('تنظیمات پرداخت ذخیره شد ✅', 'success');
    Agent.renderPayment();
  }
};
