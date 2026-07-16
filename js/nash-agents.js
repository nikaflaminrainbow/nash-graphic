/* ============================================================
   nash-agents.js  —  v4.0
   ① Content Agent  — وارد کردن مطالب به بلاگ با AI رایگان
   ② Support Agent  — چت پشتیبانی هوشمند

   AI از طریق Supabase Edge Function proxy صدا زده می‌شود —
   یعنی برای همه کاربران (حتی بدون VPN در ایران) کار می‌کند،
   چون درخواست از سمت سرور Supabase می‌رود نه از مرورگر کاربر.
   ✅ بدون سرور اختصاصی  |  ✅ GitHub Pages  |  ✅ Supabase
   ============================================================ */

(function () {
  'use strict';

  const SB_URL  = 'https://yeuyhsbzbrjxrxdulaiq.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldXloc2J6YnJqeHJ4ZHVsYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Nzk1MTksImV4cCI6MjA5NzM1NTUxOX0.kFMQXIw4BKqNyvNmnWChXQhYjBAnXTCl_VYw18Lgswc';
  const AI_PROXY_URL = `${SB_URL}/functions/v1/ai-proxy`;

  /* ── AI caller — از طریق Edge Function proxy ──────────── */
  async function callAI({ system, userMsg, maxTokens = 800 }) {
    const res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SB_ANON}`,
        apikey: SB_ANON,
      },
      body: JSON.stringify({ system, userMsg, maxTokens }),
    });

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok || data.error) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data.text || '';
  }

  // برای backward compat — دیگر نیازی به کلید در مرورگر نیست
  const APIKey = { exists: () => true, load: async () => 'proxy', get: () => 'proxy', set: () => {} };
  const GeminiKey = APIKey;

  // wrapper برای Support Chat که history داره
  async function callAIWithHistory({ system, messages }) {
    const historyText = messages.map(m =>
      `${m.role === 'user' ? 'کاربر' : 'دستیار'}: ${m.content}`
    ).join('\n');
    return callAI({ system, userMsg: historyText });
  }

  /* ── Supabase: fetch user orders ──────────────────────── */
  async function fetchOrders() {
    const uid = (typeof State !== 'undefined') ? State.user?.id : null;
    if (!uid) return [];
    try {
      const res = await fetch(
        `${SB_URL}/rest/v1/orders?user_id=eq.${uid}&order=created_at.desc&limit=4` +
        `&select=id,tracking_code,status,created_at,final_amount`,
        { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } }
      );
      return res.ok ? (await res.json()) : [];
    } catch { return []; }
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ════════════════════════════════════════════════════════
     SHARED CSS
  ════════════════════════════════════════════════════════ */
  const CSS = `
    #na-s-btn {
      position:fixed;bottom:24px;left:24px;z-index:9100;
      width:52px;height:52px;border-radius:50%;
      background:linear-gradient(135deg,#c8a96e,#a07840);
      border:none;cursor:pointer;font-size:22px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 18px rgba(200,169,110,.45);
      transition:transform .2s,box-shadow .2s;
    }
    #na-s-btn:hover{transform:scale(1.09);box-shadow:0 6px 26px rgba(200,169,110,.6);}
    #na-s-badge{
      position:absolute;top:-2px;right:-2px;width:14px;height:14px;
      background:#ef5350;border-radius:50%;border:2px solid #0f0f0f;
      animation:na-pulse 2s infinite;
    }
    #na-s-panel{
      position:fixed;bottom:86px;left:24px;z-index:9101;
      width:332px;max-width:calc(100vw - 32px);
      height:470px;max-height:calc(100vh - 110px);
      background:#161616;border:1px solid #2a2a2a;
      border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.65);
      display:flex;flex-direction:column;overflow:hidden;
      font-family:'Vazirmatn','Segoe UI',Tahoma,sans-serif;
      transform:scale(.92) translateY(12px);opacity:0;pointer-events:none;
      transition:transform .22s cubic-bezier(.34,1.56,.64,1),opacity .18s ease;
    }
    #na-s-panel.na-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}
    .na-s-head{
      background:linear-gradient(135deg,#1e1a14,#2a2218);
      padding:12px 14px;display:flex;align-items:center;gap:10px;
      border-bottom:1px solid #2a2a2a;flex-shrink:0;
    }
    .na-s-avatar{
      width:34px;height:34px;border-radius:50%;
      background:linear-gradient(135deg,#c8a96e,#a07840);
      display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;
    }
    .na-s-name{font-size:13px;font-weight:700;color:#e8e8e8;}
    .na-s-status{font-size:11px;color:#4caf50;display:flex;align-items:center;gap:4px;}
    .na-s-status::before{
      content:'';width:6px;height:6px;border-radius:50%;
      background:#4caf50;display:inline-block;animation:na-pulse 2s infinite;
    }
    .na-x-btn{background:none;border:none;color:#666;font-size:17px;cursor:pointer;padding:4px;margin-right:auto;}
    #na-s-ctx{
      background:#1a1510;border-bottom:1px solid #2a2a2a;
      padding:6px 14px;font-size:11px;color:#c8a96e;
      display:none;align-items:center;gap:6px;flex-shrink:0;
    }
    #na-s-ctx.na-vis{display:flex;}

    /* key prompt */
    #na-key-prompt{
      flex:1;display:none;flex-direction:column;align-items:center;
      justify-content:center;padding:22px 18px;gap:10px;text-align:center;
    }
    #na-key-prompt.na-vis{display:flex;}
    #na-key-prompt p{font-size:12.5px;color:#aaa;line-height:1.65;margin:0;}
    #na-key-prompt small{font-size:11px;color:#555;}
    #na-key-prompt input{
      width:100%;background:#111;border:1px solid #333;border-radius:8px;
      padding:8px 12px;color:#e8e8e8;font-size:12px;outline:none;
      font-family:inherit;direction:ltr;box-sizing:border-box;
    }
    #na-key-prompt input:focus{border-color:rgba(200,169,110,.5);}
    .na-kp-save{
      width:100%;padding:9px;background:linear-gradient(135deg,#c8a96e,#a07840);
      border:none;border-radius:8px;color:#000;font-size:13px;font-weight:700;
      cursor:pointer;font-family:inherit;margin-top:2px;
    }
    .na-kp-skip{
      width:100%;padding:7px;background:none;border:1px solid #333;
      color:#666;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;
    }

    /* chat ui */
    #na-s-chatui{
      flex:1;display:none;flex-direction:column;overflow:hidden;
    }
    #na-s-chatui.na-vis{display:flex;}
    .na-msgs{
      flex:1;overflow-y:auto;padding:12px;
      display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth;
    }
    .na-msgs::-webkit-scrollbar{width:3px;}
    .na-msgs::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
    .na-msg{
      max-width:87%;padding:8px 12px;border-radius:12px;
      font-size:12.5px;line-height:1.6;animation:na-fin .18s ease;
    }
    .na-msg.bot{background:#222;color:#e0e0e0;border-bottom-right-radius:4px;align-self:flex-end;}
    .na-msg.user{
      background:rgba(200,169,110,.11);border:1px solid rgba(200,169,110,.2);
      color:#e8e8e8;border-bottom-left-radius:4px;align-self:flex-start;
    }
    .na-msg-t{font-size:10px;color:#555;margin-top:2px;}
    .na-typing{
      display:flex;gap:4px;align-items:center;padding:9px 13px;
      background:#222;border-radius:12px;align-self:flex-end;
      max-width:55px;animation:na-fin .18s ease;
    }
    .na-typing span{
      width:5px;height:5px;border-radius:50%;background:#c8a96e;
      animation:na-bounce 1.2s infinite;
    }
    .na-typing span:nth-child(2){animation-delay:.2s;}
    .na-typing span:nth-child(3){animation-delay:.4s;}
    .na-qrs{display:flex;flex-wrap:wrap;gap:5px;padding:0 12px 6px;flex-shrink:0;}
    .na-qr{
      background:#1e1e1e;border:1px solid #333;border-radius:18px;
      padding:4px 11px;font-size:11px;color:#c8a96e;cursor:pointer;
      transition:background .14s;font-family:inherit;white-space:nowrap;
    }
    .na-qr:hover{background:rgba(200,169,110,.14);border-color:rgba(200,169,110,.4);}
    .na-inp-row{
      padding:9px 11px;border-top:1px solid #222;
      display:flex;gap:7px;flex-shrink:0;
    }
    .na-inp{
      flex:1;background:#1e1e1e;border:1px solid #2a2a2a;border-radius:20px;
      padding:7px 13px;color:#e8e8e8;font-size:12.5px;outline:none;
      font-family:inherit;direction:rtl;transition:border-color .14s;
    }
    .na-inp:focus{border-color:rgba(200,169,110,.4);}
    .na-send-btn{
      width:34px;height:34px;border-radius:50%;
      background:linear-gradient(135deg,#c8a96e,#a07840);
      border:none;cursor:pointer;display:flex;align-items:center;
      justify-content:center;font-size:15px;transition:transform .14s;flex-shrink:0;
    }
    .na-send-btn:hover{transform:scale(1.08);}

    /* content agent */
    #na-c-btn{
      position:fixed;bottom:24px;right:24px;z-index:9100;
      width:52px;height:52px;border-radius:50%;
      background:linear-gradient(135deg,#6e8ec8,#405ea0);
      border:none;cursor:pointer;font-size:20px;
      display:none;align-items:center;justify-content:center;
      box-shadow:0 4px 18px rgba(110,142,200,.4);transition:transform .2s;
    }
    #na-c-btn:hover{transform:scale(1.09);}
    #na-c-panel{
      position:fixed;bottom:86px;right:24px;z-index:9101;
      width:340px;max-width:calc(100vw - 32px);
      max-height:calc(100vh - 110px);
      background:#161616;border:1px solid #2a2a2a;
      border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.65);
      display:flex;flex-direction:column;overflow:hidden;
      font-family:'Vazirmatn','Segoe UI',Tahoma,sans-serif;
      transform:scale(.92) translateY(12px);opacity:0;pointer-events:none;
      transition:transform .22s cubic-bezier(.34,1.56,.64,1),opacity .18s ease;
    }
    #na-c-panel.na-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}
    .na-c-head{
      background:linear-gradient(135deg,#141820,#1e2430);
      padding:12px 14px;display:flex;align-items:center;gap:10px;
      border-bottom:1px solid #2a2a2a;flex-shrink:0;
    }
    .na-c-title{font-size:13px;font-weight:700;color:#e8e8e8;flex:1;}
    .na-c-body{overflow-y:auto;padding:14px;flex:1;}
    .na-c-body::-webkit-scrollbar{width:3px;}
    .na-c-body::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
    .na-lbl{font-size:11px;color:#888;margin-bottom:4px;display:block;}
    .na-fld{
      width:100%;background:#111;border:1px solid #2a2a2a;border-radius:7px;
      padding:7px 10px;color:#e8e8e8;font-size:12.5px;box-sizing:border-box;
      outline:none;font-family:inherit;direction:ltr;
      transition:border-color .14s;margin-bottom:10px;
    }
    .na-fld:focus{border-color:rgba(110,142,200,.5);}
    select.na-fld{cursor:pointer;}
    .na-key-row{display:flex;gap:6px;margin-bottom:10px;}
    .na-key-row input{
      flex:1;background:#111;border:1px solid #2a2a2a;border-radius:7px;
      padding:7px 10px;color:#e8e8e8;font-size:12px;outline:none;
      font-family:inherit;direction:ltr;
    }
    .na-key-row input:focus{border-color:rgba(110,142,200,.5);}
    .na-key-row button{
      padding:7px 10px;border:none;border-radius:7px;
      background:#4a70c0;color:#fff;font-size:11px;cursor:pointer;white-space:nowrap;
    }
    .na-btn{
      width:100%;padding:9px;border:none;border-radius:8px;font-size:13px;
      font-weight:700;cursor:pointer;font-family:inherit;
      display:flex;align-items:center;justify-content:center;
      gap:6px;transition:opacity .15s;
    }
    .na-btn:disabled{opacity:.45;cursor:not-allowed;}
    .na-btn-blue{background:#4a70c0;color:#fff;}
    .na-btn-green{background:#3d9e4a;color:#fff;margin-top:8px;}
    .na-prog-wrap{height:5px;background:#2a2a2a;border-radius:3px;overflow:hidden;margin:8px 0;display:none;}
    .na-prog-fill{height:100%;background:#6e8ec8;border-radius:3px;transition:width .4s ease;width:0%;}
    .na-art-list{max-height:155px;overflow-y:auto;margin:8px 0;}
    .na-art-list::-webkit-scrollbar{width:3px;}
    .na-art-list::-webkit-scrollbar-thumb{background:#2a2a2a;}
    .na-art-item{
      display:flex;align-items:center;gap:8px;padding:7px 5px;
      border-radius:6px;cursor:pointer;font-size:11.5px;color:#ccc;transition:background .13s;
    }
    .na-art-item:hover{background:#1e1e1e;}
    .na-art-item.sel{background:rgba(110,142,200,.12);color:#e8e8e8;}
    .na-art-cb{
      width:14px;height:14px;border-radius:3px;flex-shrink:0;
      border:2px solid #444;background:transparent;
      display:flex;align-items:center;justify-content:center;
      transition:all .13s;font-size:9px;color:#000;
    }
    .na-art-item.sel .na-art-cb{background:#6e8ec8;border-color:#6e8ec8;}
    .na-log{
      background:#111;border-radius:8px;padding:10px;
      max-height:120px;overflow-y:auto;margin-top:10px;
      font-size:11px;color:#777;font-family:monospace;display:none;
    }
    .na-log::-webkit-scrollbar{width:3px;}
    .na-log::-webkit-scrollbar-thumb{background:#2a2a2a;}
    .na-ll{margin-bottom:3px;animation:na-fin .15s ease;line-height:1.4;}
    .na-ok{color:#4caf50;}.na-err{color:#ef5350;}.na-warn{color:#ff9800;}

    @keyframes na-pulse{0%,100%{opacity:1;}50%{opacity:.45;}}
    @keyframes na-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-4px);}}
    @keyframes na-fin{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
  `;

  /* ════════════════════════════════════════════════════════
     SUPPORT AGENT
  ════════════════════════════════════════════════════════ */
  const Support = (() => {
    let isOpen = false;
    let history = [];
    let ctx = {};
    let useAI = false;
    let skipKey = false;

    const STATUS_FA = {
      pending_review:'در انتظار بررسی ⏳', contacted:'ادمین تماس گرفته ✅',
      processing:'در حال آماده‌سازی 🔧', shipped:'ارسال شده 🚚',
      delivered:'تحویل شده ✅', cancelled:'لغو شده ❌',
    };

    /* decision tree fallback */
    const TREE = {
      root:{msg:'سلام! 👋 به پشتیبانی Nash Graphic خوش اومدی. چطور کمکت کنم؟',
        opts:[{l:'🛒 فرآیند سفارش',n:'order'},{l:'📦 پیگیری سفارش',n:'track'},
              {l:'💰 قیمت و پرداخت',n:'pay'},{l:'📞 تماس با ادمین',n:'contact'}]},
      order:{msg:'فرآیند سفارش:\n۱. طرح رو به سبد اضافه کن\n۲. فرم سفارش رو پر کن\n۳. ادمین بررسی می‌کنه\n۴. از طریق تلگرام/بله/روبیکا تماس می‌گیریم\n۵. پرداخت و ارسال',
        opts:[{l:'⏱ زمان تحویل',n:'time'},{l:'📄 فایل مورد نیاز',n:'file'},{l:'🔙 برگشت',n:'root'}]},
      track:{msg:null,dyn:'orders',opts:[{l:'🔙 برگشت',n:'root'}]},
      pay:{msg:'پرداخت پس از توافق با ادمین انجام میشه.\nروش‌ها: کارت به کارت / آنلاین / نقدی\nهیچ مبلغی قبل از تأیید دریافت نمیشه.',opts:[{l:'🔙 برگشت',n:'root'}]},
      contact:{msg:'برای تماس مستقیم از صفحه «پشتیبانی» تیکت ثبت کن.\nمعمولاً ۲–۴ ساعت پاسخ داده میشه.',
        opts:[{l:'📝 ثبت تیکت',a:'support'},{l:'🔙 برگشت',n:'root'}]},
      time:{msg:'زمان تحویل:\n• طرح گرافیکی: ۲–۵ روز\n• چاپ ساده: ۳–۷ روز\n• پکیج عمده: ۷–۱۴ روز',opts:[{l:'🔙 برگشت',n:'root'}]},
      file:{msg:'فرمت‌های قابل قبول: AI، PDF، PSD، PNG (300 DPI)\nرنگ: CMYK برای چاپ',opts:[{l:'🔙 برگشت',n:'root'}]},
    };

    async function goNode(key) {
      const node = TREE[key]; if (!node) return;
      await wait(500); hideTyping();
      if (node.dyn === 'orders') {
        const orders = await fetchOrders();
        addMsg(!orders.length
          ? 'سفارشی یافت نشد. با کد پیگیری از صفحه «پیگیری سفارش» وضعیت رو چک کن.'
          : orders.map(o =>
              `🔹 ${o.tracking_code||o.id.slice(0,8)}\n   ${STATUS_FA[o.status]||o.status} | ${new Date(o.created_at).toLocaleDateString('fa-IR')}`
            ).join('\n\n')
        );
      } else {
        addMsg(node.msg);
      }
      renderOpts(node.opts);
    }

    function treeFallback(text) {
      showTyping();
      if (/سفارش|خرید/i.test(text))         goNode('order');
      else if (/پیگیری|وضعیت/i.test(text))  goNode('track');
      else if (/قیمت|پرداخت/i.test(text))   goNode('pay');
      else if (/تماس|ادمین/i.test(text))    goNode('contact');
      else { hideTyping(); addMsg('لطفاً از گزینه‌های زیر انتخاب کن:'); goNode('root'); }
    }

    /* AI */
    async function aiReply(userText) {
      history.push({ role:'user', content: userText });
      showTyping();
      try {
        const ordersTxt = ctx.orders?.length
          ? '\n\nسفارش‌های اخیر کاربر:\n' + ctx.orders.map(o =>
              `#${o.tracking_code||o.id.slice(0,8)}: ${STATUS_FA[o.status]||o.status} (${new Date(o.created_at).toLocaleDateString('fa-IR')})`
            ).join('\n')
          : '';
        const system =
            `تو دستیار پشتیبانی Nash Graphic (نش گرافیک) هستی — پلتفرم ایرانی طراحی و چاپ.` +
            (ctx.product ? `\nمحصول فعلی: ${JSON.stringify(ctx.product)}` : '') +
            (ctx.step==='checkout' ? '\nکاربر در مرحله ثبت سفارش است.' : '') +
            ordersTxt +
            `\n\nقوانین:\n- فقط فارسی پاسخ بده\n- پاسخ‌ها کوتاه و کاربردی (حداکثر ۳ جمله)\n` +
            `- اگر سوال درباره قیمت دقیق است، بگو ادمین تماس می‌گیرد\n` +
            `- فرآیند: سفارش → بررسی ادمین → تماس → پرداخت → ارسال`;
        const reply = await callAIWithHistory({ system, messages: history.slice(-10) });
        hideTyping();
        history.push({ role:'assistant', content: reply });
        addMsg(reply);
      } catch (e) {
        hideTyping();
        // اگه AI در دسترس نبود، به decision tree برگرد
        useAI = false;
        addMsg('در حال حاضر هوش مصنوعی در دسترس نیست. از منوی راهنما استفاده کن:');
        showTyping(); goNode('root');
      }
    }

    /* DOM */
    const hhmm = () => new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});

    function addMsg(text, who='bot') {
      const el = document.getElementById('na-s-msgs'); if (!el) return;
      const d = document.createElement('div');
      d.className = `na-msg ${who}`;
      d.innerHTML = text.replace(/\n/g,'<br>') + `<div class="na-msg-t">${hhmm()}</div>`;
      el.appendChild(d); el.scrollTop = el.scrollHeight;
    }
    function showTyping() {
      const el = document.getElementById('na-s-msgs'); if (!el) return;
      if (document.getElementById('na-s-typ')) return;
      const d = document.createElement('div');
      d.className='na-typing'; d.id='na-s-typ';
      d.innerHTML='<span></span><span></span><span></span>';
      el.appendChild(d); el.scrollTop = el.scrollHeight;
    }
    function hideTyping() { document.getElementById('na-s-typ')?.remove(); }
    function renderOpts(opts=[]) {
      const c = document.getElementById('na-s-qrs'); if (!c) return; c.innerHTML='';
      opts.forEach(o => {
        const b = document.createElement('button');
        b.className='na-qr'; b.textContent=o.l;
        b.onclick = () => {
          c.innerHTML=''; addMsg(o.l,'user');
          if (o.a==='support') { closePanel(); if(typeof Router!=='undefined') Router.navigate('support'); }
          else if (o.n) { showTyping(); goNode(o.n); }
        };
        c.appendChild(b);
      });
    }

    function showKeyPrompt() {
      document.getElementById('na-key-prompt').classList.add('na-vis');
      document.getElementById('na-s-chatui').classList.remove('na-vis');
    }
    function showChatUI() {
      document.getElementById('na-key-prompt').classList.remove('na-vis');
      document.getElementById('na-s-chatui').classList.add('na-vis');
    }

    function activateAI(key) {
      APIKey.set(key); useAI = true; showChatUI();
      history = [];
      addMsg(ctx.step==='checkout'
        ? 'سلام! 👋 می‌بینم که داری سفارش می‌دی. سوالی داری؟'
        : 'سلام! 👋 به پشتیبانی Nash Graphic خوش اومدی. چطور کمکت کنم؟');
    }
    function activateFallback() {
      skipKey=true; useAI=false; showChatUI();
      showTyping(); goNode('root');
    }

    function openPanel() {
      isOpen=true;
      document.getElementById('na-s-panel').classList.add('na-open');
      document.getElementById('na-s-badge').style.display='none';
      const msgs = document.getElementById('na-s-msgs');
      if (!msgs || msgs.children.length > 0) return;
      // همیشه با AI شروع کن — بدون key prompt
      useAI = true; showChatUI(); history = [];
      addMsg(ctx.step==='checkout'
        ? 'سلام! 👋 می‌بینم که داری سفارش می‌دی. سوالی داری؟'
        : 'سلام! 👋 به پشتیبانی Nash Graphic خوش اومدی. چطور کمکت کنم؟');
    }
    function closePanel() { isOpen=false; document.getElementById('na-s-panel').classList.remove('na-open'); }
    const togglePanel = () => isOpen ? closePanel() : openPanel();

    function sendUser() {
      const inp = document.getElementById('na-s-inp');
      const text = inp.value.trim(); if (!text) return;
      inp.value=''; addMsg(text,'user');
      document.getElementById('na-s-qrs').innerHTML='';
      if (useAI) aiReply(text); else treeFallback(text);
    }

    function init() {
      document.body.insertAdjacentHTML('beforeend', `
        <button id="na-s-btn" title="پشتیبانی">🎨<span id="na-s-badge"></span></button>
        <div id="na-s-panel" dir="rtl">
          <div class="na-s-head">
            <div class="na-s-avatar">🤖</div>
            <div><div class="na-s-name">دستیار Nash Graphic</div><div class="na-s-status">آنلاین</div></div>
            <button class="na-x-btn" id="na-s-close">✕</button>
          </div>
          <div id="na-s-ctx"><span>📦</span><span id="na-s-ctx-txt"></span></div>
          <div id="na-key-prompt">
            <span style="font-size:32px">🔑</span>
            <p>برای چت با هوش مصنوعی کلید Claude API رو وارد کن<br><small>(از console.anthropic.com بگیر)</small></p>
            <input id="na-s-key-inp" type="password" placeholder="sk-ant-..." />
            <button class="na-kp-save" id="na-s-key-save" style="margin-top:8px">✅ فعال‌سازی AI</button>
            <button class="na-kp-skip" id="na-s-skip" style="margin-top:6px">بدون AI ادامه بده</button>
          </div>
          <div id="na-s-chatui">
            <div class="na-msgs" id="na-s-msgs"></div>
            <div class="na-qrs" id="na-s-qrs"></div>
            <div class="na-inp-row">
              <input class="na-inp" id="na-s-inp" placeholder="پیام بنویسید..." />
              <button class="na-send-btn" id="na-s-send">➤</button>
            </div>
          </div>
        </div>
      `);
      document.getElementById('na-s-btn').onclick      = togglePanel;
      document.getElementById('na-s-close').onclick    = closePanel;
      document.getElementById('na-s-send').onclick     = sendUser;
      document.getElementById('na-s-inp').addEventListener('keydown', e => {
        if (e.key==='Enter') { e.preventDefault(); sendUser(); }
      });
      document.getElementById('na-s-key-save').onclick = () => {
        const k = document.getElementById('na-s-key-inp').value.trim();
        if (k) activateAI(k); else alert('کلید را وارد کنید');
      };
      document.getElementById('na-s-skip').onclick = activateFallback;
    }

    async function openWithContext({ step, product } = {}) {
      ctx.step = step;
      if (product) ctx.product = product;
      if (step==='tracking' || step==='checkout') ctx.orders = await fetchOrders();
      const bar=document.getElementById('na-s-ctx'), txt=document.getElementById('na-s-ctx-txt');
      if (bar && txt && (product||step)) {
        txt.textContent = product
          ? `محصول: ${product.name||product.title||''}`
          : step==='checkout' ? 'راهنمای ثبت سفارش' : 'پیگیری سفارش';
        bar.classList.add('na-vis');
      }
      openPanel();
    }

    return { init, open: openPanel, close: closePanel, toggle: togglePanel, openWithContext };
  })();

  /* ════════════════════════════════════════════════════════
     CONTENT AGENT
  ════════════════════════════════════════════════════════ */
  const Content = (() => {
    let articles=[], selected=new Set();

    async function proxyFetch(url) {
      const attempts = [
        // allorigins — JSON با فیلد contents
        async () => {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) throw new Error('allorigins http ' + res.status);
          const data = await res.json();
          if (!data.contents) throw new Error('allorigins empty');
          return data.contents;
        },
        // codetabs — متن خام HTML برمی‌گردونه
        async () => {
          const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) throw new Error('codetabs http ' + res.status);
          const text = await res.text();
          if (!text || text.length < 50) throw new Error('codetabs empty');
          return text;
        },
        // corsproxy.io — متن خام HTML برمی‌گردونه
        async () => {
          const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) throw new Error('corsproxy http ' + res.status);
          const text = await res.text();
          if (!text || text.length < 50) throw new Error('corsproxy empty');
          return text;
        },
        // jina.ai reader — تبدیل به markdown ولی برای HTML extraction هم کار می‌کنه
        async () => {
          const res = await fetch(`https://r.jina.ai/${url}`, { signal: AbortSignal.timeout(12000) });
          if (!res.ok) throw new Error('jina http ' + res.status);
          const text = await res.text();
          if (!text || text.length < 50) throw new Error('jina empty');
          // jina متن/markdown میده نه HTML خام — به شکل ساده به HTML تبدیلش می‌کنیم
          return `<html><body><pre>${text.replace(/</g,'&lt;')}</pre></body></html>`;
        },
      ];

      const errors = [];
      for (const attempt of attempts) {
        try {
          return await attempt();
        } catch (e) {
          errors.push(e.message);
        }
      }
      throw new Error('همه proxy‌ها fail شدند: ' + errors.join(' | '));
    }
    function extractLinks(html, base) {
      const doc=new DOMParser().parseFromString(html,'text/html'), seen=new Set(), out=[];
      doc.querySelectorAll('a[href]').forEach(a => {
        const t=a.textContent.trim(); if (t.length<15) return;
        try {
          const url=new URL(a.getAttribute('href'),base).href;
          if (!seen.has(url)&&url.startsWith('http')) { seen.add(url); out.push({url,title:t.slice(0,100)}); }
        } catch {}
      });
      return out.slice(0,14);
    }
    function extractContent(html, baseUrl) {
      const doc=new DOMParser().parseFromString(html,'text/html');
      ['script','style','nav','header','footer','aside'].forEach(s=>doc.querySelectorAll(s).forEach(e=>e.remove()));
      const title=doc.querySelector('h1')?.textContent?.trim()||doc.querySelector('title')?.textContent?.trim()||'';
      const content=(doc.querySelector('article')?.innerText||doc.querySelector('main')?.innerText||
        doc.querySelector('.content,.post-content,.entry-content')?.innerText||doc.body?.innerText||'').trim().slice(0,3500);
      // استخراج تصویر cover
      let imageUrl = '';
      const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      const firstImg = doc.querySelector('article img, .post-content img, main img')?.getAttribute('src');
      const raw = ogImg || firstImg || '';
      if (raw) {
        try { imageUrl = new URL(raw, baseUrl).href; } catch { imageUrl = raw; }
      }
      return {title, content, imageUrl};
    }
    async function processArticle(title, content, mode) {
      const prompts = {
        translate:`این مقاله را به فارسی ترجمه کن. فقط JSON برگردان بدون markdown:\n{"title":"...","content":"...","excerpt":"یک جمله خلاصه فارسی"}`,
        rewrite:`این مقاله را برای بلاگ Nash Graphic (پلتفرم طراحی و چاپ ایرانی) بازنویسی کن. فقط JSON:\n{"title":"...","content":"...","excerpt":"یک جمله"}`,
        summarize:`خلاصه جذاب این مقاله را برای طراحان و چاپخانه‌داران بنویس. فقط JSON:\n{"title":"...","content":"...","excerpt":"یک جمله"}`,
      };
      const raw = await callAI({
        system: `تو ویراستار محتوای Nash Graphic هستی. ${prompts[mode]}`,
        userMsg: `عنوان: ${title}\n\nمتن:\n${content}`,
        maxTokens: 1000,
      });
      const cleaned = raw.replace(/```json|```/g,'').trim();
      // پیدا کردن JSON داخل متن
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) return { title, content, excerpt: '' };
      return JSON.parse(match[0]);
    }
    async function saveToBlog(post, imageUrl, sourceUrl) {
      const payload = {
        title:      post.title   || 'بدون عنوان',
        content:    post.content || '',
        excerpt:    post.excerpt || '',
        image_url:  imageUrl     || null,
        source_url: sourceUrl    || null,
        author_id: (typeof State !== 'undefined' && State.user?.id) ? State.user.id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('blog').insert(payload).select();
      if (error) {
        throw new Error(`Insert ناموفق (${error.code || '?'}): ${error.message}`);
      }
      if (!data || !data.length) {
        throw new Error('Insert بدون خطا برگشت ولی هیچ رکوردی ساخته نشد — احتمالاً RLS policy مانع شده');
      }
      return data[0];
    }

    function log(msg, type='') {
      const el=document.getElementById('na-c-log'); if (!el) return;
      el.style.display='block';
      const d=document.createElement('div');
      d.className=`na-ll${type?' na-'+type:''}`;
      d.textContent=`${new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} ${msg}`;
      el.appendChild(d); el.scrollTop=el.scrollHeight;
    }
    function renderList() {
      const list=document.getElementById('na-c-list'),wrap=document.getElementById('na-c-articles'),cnt=document.getElementById('na-c-count');
      if (!articles.length){wrap.style.display='none';return;}
      wrap.style.display='block'; cnt.textContent=`${articles.length} مقاله یافت شد`; list.innerHTML='';
      articles.forEach((a,i)=>{
        const d=document.createElement('div');
        d.className='na-art-item'+(selected.has(i)?' sel':'');
        d.innerHTML=`<div class="na-art-cb">${selected.has(i)?'✓':''}</div><span>${a.title.slice(0,75)}</span>`;
        d.onclick=()=>{selected.has(i)?selected.delete(i):selected.add(i);renderList();};
        list.appendChild(d);
      });
    }
    function setProgress(done,total) {
      const wrap=document.getElementById('na-c-prog-wrap'),fill=document.getElementById('na-c-prog-fill');
      wrap.style.display=total?'block':'none';
      fill.style.width=total?`${Math.round(done/total*100)}%`:'0%';
    }
    async function scan() {
      const url=document.getElementById('na-c-url').value.trim(); if (!url) return;
      document.getElementById('na-c-scan').disabled=true;
      log('در حال اسکن '+url+' ...');
      try {
        const html=await proxyFetch(url);
        articles=extractLinks(html,url); selected=new Set(articles.map((_,i)=>i));
        renderList(); log(`${articles.length} مقاله پیدا شد`,'ok');
      } catch(e){log('خطا: '+e.message,'err');}
      document.getElementById('na-c-scan').disabled=false;
    }
    async function process() {
      if (!selected.size) return;
      const mode=document.getElementById('na-c-mode').value;
      const toProcess=articles.filter((_,i)=>selected.has(i));
      document.getElementById('na-c-process').disabled=true;
      setProgress(0,toProcess.length);
      log(`شروع پردازش ${toProcess.length} مقاله با AI...`);
      let done=0;
      for (const art of toProcess) {
        try {
          log(`دریافت: ${art.title.slice(0,50)}...`);
          const html=await proxyFetch(art.url);
          const {title,content,imageUrl}=extractContent(html, art.url);
          if (!content||content.length<80){log('محتوا ناکافی، رد شد','warn');done++;setProgress(done,toProcess.length);continue;}
          log(`پردازش با Gemini: ${(title||art.title).slice(0,45)}...`);
          const processed=await processArticle(title||art.title,content,mode);
          await saveToBlog(processed, imageUrl, art.url);
          done++;setProgress(done,toProcess.length);
          log(`ذخیره شد: ${processed.title?.slice(0,50)}`,'ok');
          await wait(1500);
        } catch(e){done++;setProgress(done,toProcess.length);log(`خطا: ${e.message}`,'err');}
      }
      log(`✅ تمام! ${done}/${toProcess.length} مقاله ذخیره شد.`,'ok');
      document.getElementById('na-c-process').disabled=false;
      if (typeof Router!=='undefined'&&Router.current==='blog') App?.loadBlog?.();
    }

    function syncBtn() {
      const btn=document.getElementById('na-c-btn'); if (!btn) return;
      btn.style.display=((typeof State!=='undefined')&&State.user?.role==='admin')?'flex':'none';
    }

    function init() {
      document.body.insertAdjacentHTML('beforeend', `
        <button id="na-c-btn" title="Content Agent">📥</button>
        <div id="na-c-panel" dir="rtl">
          <div class="na-c-head">
            <span style="font-size:18px">📥</span>
            <span class="na-c-title">Content Agent — بلاگ خودکار</span>
            <button class="na-x-btn" id="na-c-close">✕</button>
          </div>
          <div class="na-c-body">
            <label class="na-lbl">URL سایت منبع</label>
            <input class="na-fld" id="na-c-url" type="url" placeholder="https://creativebloq.com/graphic-design" />
            <label class="na-lbl">نوع پردازش</label>
            <select class="na-fld" id="na-c-mode">
              <option value="translate">🌐 ترجمه به فارسی</option>
              <option value="rewrite">✍️ بازنویسی برای Nash</option>
              <option value="summarize">📝 خلاصه + بهبود</option>
            </select>
            <button class="na-btn na-btn-blue" id="na-c-scan">🔍 اسکن سایت</button>
            <div id="na-c-articles" style="display:none;margin-top:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-size:11px;color:#888" id="na-c-count"></span>
                <button style="font-size:10px;color:#6e8ec8;background:none;border:none;cursor:pointer" id="na-c-toggle-all">انتخاب همه</button>
              </div>
              <div class="na-art-list" id="na-c-list"></div>
              <div class="na-prog-wrap" id="na-c-prog-wrap"><div class="na-prog-fill" id="na-c-prog-fill"></div></div>
              <button class="na-btn na-btn-green" id="na-c-process">✨ پردازش با AI و ذخیره در بلاگ</button>
            </div>
            <div class="na-log" id="na-c-log"></div>
          </div>
        </div>
      `);
      syncBtn();
      document.getElementById('na-c-btn').onclick       = ()=>document.getElementById('na-c-panel').classList.toggle('na-open');
      document.getElementById('na-c-close').onclick     = ()=>document.getElementById('na-c-panel').classList.remove('na-open');
      document.getElementById('na-c-scan').onclick      = scan;
      document.getElementById('na-c-process').onclick   = process;
      document.getElementById('na-c-toggle-all').onclick= ()=>{
        selected.size===articles.length?selected.clear():articles.forEach((_,i)=>selected.add(i)); renderList();
      };
      // sync دکمه با تغییرات auth
      const origUH=typeof App!=='undefined'?App.updateHeader?.bind(App):null;
      if (origUH) App.updateHeader=function(){origUH();syncBtn();};
    }
    return {init, syncBtn, scan, process};
  })();

  /* ════════════════════════════════════════════════════════
     SCHEDULE: run Content agent based on admin settings
     (client-side scheduler — runs when an admin has the site open)
  ════════════════════════════════════════════════════════ */
  Content._scheduler = (() => {
    let lastRuns = {}; // key: timestr -> YYYY-MM-DD
    async function loadSettings() {
      try {
        const res = await fetch(`${SB_URL}/rest/v1/settings?select=key,value&key=in.(content_agent_enabled,content_agent_schedule,content_agent_source,content_agent_mode)`, {
          headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` }
        });
        if (!res.ok) return {};
        const rows = await res.json();
        const map = {};
        (rows||[]).forEach(r => map[r.key]=r.value);
        return map;
      } catch { return {}; }
    }

    function matchesNow(spec) {
      if (!spec) return false;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      const cur = `${hh}:${mm}`;
      const parts = spec.split(',').map(s=>s.trim()).filter(Boolean);
      return parts.includes(cur);
    }

    async function tick() {
      try {
        const s = await loadSettings();
        if (!s.content_agent_enabled || s.content_agent_enabled !== 'true') return;
        const sched = s.content_agent_schedule || '';
        if (!matchesNow(sched)) return;
        // avoid running multiple times in the same day-minute
        const key = sched + '|' + new Date().toISOString().slice(0,16); // YYYY-MM-DDTHH:MM
        if (lastRuns[key]) return;
        lastRuns[key] = true;
        // set source and mode into UI and run scan+process
        if (s.content_agent_source) document.getElementById('na-c-url').value = s.content_agent_source;
        if (s.content_agent_mode)   document.getElementById('na-c-mode').value = s.content_agent_mode;
        // open panel for visual feedback
        document.getElementById('na-c-panel')?.classList.add('na-open');
        log('اجرای زمان‌بندی‌شده: شروع اسکن و پردازش');
        if (typeof Content.scan === 'function') await Content.scan();
        if (typeof Content.process === 'function') await Content.process();
        log('اجرای زمان‌بندی‌شده: پایان', 'ok');
      } catch (e) { console.warn('Content scheduler error', e); }
    }

    function start() {
      // check every 30 seconds
      setInterval(tick, 30*1000);
      // also run one immediate tick shortly after init
      setTimeout(tick, 5000);
    }

    return { start };
  })();

  /* ════════════════════════════════════════════════════════
     HOOK: Cart.checkout → open support
  ════════════════════════════════════════════════════════ */
  function hookCart() {
    if (typeof Cart==='undefined') return;
    const orig=Cart.checkout.bind(Cart);
    Cart.checkout=function(){
      orig();
      setTimeout(()=>window.NashSupport?.openWithContext({step:'checkout'}), 900);
    };
  }

  /* ════════════════════════════════════════════════════════
     BOOT
  ════════════════════════════════════════════════════════ */
  function boot() {
    const s=document.createElement('style');
    s.textContent=CSS; document.head.appendChild(s);
    Support.init();
    Content.init();
    // start client-side scheduler (executes only if admin enabled in settings)
    try { Content._scheduler.start(); } catch (e) { console.warn('Scheduler not started', e); }
    hookCart();
    window.NashSupport = Support;
    window.NashContent = Content;
    console.log('✅ nash-agents.js v2 loaded');
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
