/* لوحة تحكم Ops's Store — v2
   الأقسام: الرئيسية، الطلبات، الفورمات الناقصة، العملاء، المنتجات، الأقسام، الأرباح، الإعلانات، الإعدادات */
(function () {
  "use strict";
  const S = window.STORE, $ = (q, el = document) => el.querySelector(q), $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const STATUS = { new: "جديد", confirmed: "متأكد", shipped: "اتشحن", delivered: "اتسلم", returned: "مرتجع", cancelled: "ملغي" };
  const CUR = { EGP: "ج", SAR: "ر.س" };
  const CC_CUR = { EG: "EGP", SA: "SAR" };
  const FLAG = { refuser: "⛔ رفض قبل كده", duplicate: "⚠ عنده طلب مفتوح" };
  const FIELD = { status: "الحالة", assigned_to: "المسؤول", customer_name: "الاسم", phone: "الموبايل", governorate: "المحافظة", city: "المدينة", address: "العنوان", landmark: "علامة مميزة", notes: "ملاحظات العميل", admin_note: "ملاحظة داخلية", qty: "الكمية", total: "الإجمالي", taager_order_no: "رقم أوردر تاجر", tracking: "رقم التتبع" };
  const PLAT = { facebook: "فيسبوك", instagram: "إنستجرام", tiktok: "تيك توك", snapchat: "سناب شات", google: "جوجل", other: "تاني" };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = n => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const money = (n, c = "EGP") => num(n) + " " + (CUR[c] || c);
  const multi = obj => { const e = Object.entries(obj).filter(([, v]) => v); return e.length ? e.map(([c, v]) => money(v, c)).join(" + ") : "0"; };
  const dt = d => { d = new Date(d); return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }); };
  const intl = (phone, cc) => cc === "SA" ? "966" + String(phone).replace(/^0/, "") : "2" + phone;
  const toast = msg => { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 2600); };
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };

  $("#title").textContent = "لوحة التحكم — " + S.name;
  if (!S.supabaseUrl || !S.supabaseAnonKey) { $("#setup").hidden = false; return; }
  const sb = supabase.createClient(S.supabaseUrl, S.supabaseAnonKey);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("admin-sw.js").catch(() => {});

  // ================= الدخول =================
  const hp = new URLSearchParams(location.hash.replace(/^#/, ""));
  const linkType = (location.hash.match(/type=(invite|recovery|signup|magiclink)/) || [])[1];
  const linkToken = hp.get("access_token"), linkRefresh = hp.get("refresh_token"), linkErr = hp.get("error_description");

  const D = { me: "", admins: [], orders: [], leads: [], products: [], offers: [], costs: [], cats: [], black: [], spend: [] };
  const F = { cc: ls.get("f_cc") || "", days: +(ls.get("f_days") || 30) };
  let section = (location.hash.match(/^#\/(\w+)/) || [])[1] || "home";

  async function boot() {
    if (linkErr) { $("#loginbox").hidden = false; const m = $("#loginmsg"); m.textContent = "اللينك ده انتهى أو اتستخدم قبل كده. اكتب إيميلك ودوس «نسيت كلمة السر» تاني."; m.classList.add("show"); history.replaceState(null, "", location.pathname); return; }
    if (linkToken && linkType) { history.replaceState(null, "", location.pathname); $("#setpw").hidden = false; return; }
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { $("#loginbox").hidden = false; return; }
    D.me = (session.user.email || "").toLowerCase();
    if (lockEnabled()) showLock();
    $("#app").hidden = false; $("#logout").hidden = false; $("#refresh").hidden = false; $("#bell").hidden = false;
    bellLabel();
    await loadAll();
    route();
    setInterval(pollOrders, 30000);
  }
  $("#loginform").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, m = $("#loginmsg"); m.classList.remove("show");
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    if (error) { m.textContent = "الإيميل أو كلمة السر غلط."; m.classList.add("show"); return; }
    sessionStorage.setItem("unlocked", "1"); location.reload();
  };
  $("#pwform").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, m = $("#pwmsg"); m.classList.remove("show");
    if (f.p1.value !== f.p2.value) { m.textContent = "الكلمتين مش زي بعض."; m.classList.add("show"); return; }
    const btn = f.querySelector("button"); btn.disabled = true;
    let ok = false, msg = "";
    if (linkToken) {
      const r = await fetch(S.supabaseUrl.replace(/\/$/, "") + "/auth/v1/user", { method: "PUT",
        headers: { "Content-Type": "application/json", apikey: S.supabaseAnonKey, Authorization: "Bearer " + linkToken }, body: JSON.stringify({ password: f.p1.value }) });
      ok = r.ok; if (!ok) { const j = await r.json().catch(() => ({})); msg = j.msg || j.message || j.error_description || r.status; }
      if (ok && linkRefresh) { try { await sb.auth.setSession({ access_token: linkToken, refresh_token: linkRefresh }); } catch (e) {} }
    } else { const { error } = await sb.auth.updateUser({ password: f.p1.value }); ok = !error; msg = error && error.message; }
    btn.disabled = false;
    if (!ok) { m.textContent = "مقدرتش أحفظ: " + msg + " — اطلب لينك جديد من «نسيت كلمة السر»."; m.classList.add("show"); return; }
    location.replace(location.pathname);
  };
  $("#forgot").onclick = async e => {
    e.preventDefault();
    const email = $("#loginform").email.value.trim(), m = $("#loginmsg");
    if (!email) { m.textContent = "اكتب إيميلك فوق الأول."; m.classList.add("show"); return; }
    await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    m.style.background = "#e7f2ee"; m.style.color = "var(--brand)";
    m.textContent = "لو الإيميل ده مسجل، هيوصلك لينك تختار منه كلمة السر. شوف الـ Inbox والـ Spam."; m.classList.add("show");
  };
  $("#logout").onclick = async () => { await sb.auth.signOut(); sessionStorage.removeItem("unlocked"); location.reload(); };
  $("#refresh").onclick = async () => { await loadAll(); route(); toast("اتحدّث ✓"); };

  // ================= قفل البصمة / Face ID (WebAuthn على الجهاز ده) =================
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const lockEnabled = () => !!ls.get("ops_lock_id") && !!window.PublicKeyCredential;
  function showLock() { if (sessionStorage.getItem("unlocked")) return; $("#lock").hidden = false; }
  async function tryUnlock() {
    try {
      await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rpId: location.hostname,
        allowCredentials: [{ type: "public-key", id: unb64(ls.get("ops_lock_id")) }], userVerification: "required", timeout: 60000 } });
      sessionStorage.setItem("unlocked", "1"); $("#lock").hidden = true;
    } catch (e) { toast("مقدرتش أتأكد من البصمة — جرب تاني"); }
  }
  $("#unlock").onclick = tryUnlock;
  $("#lockpw").onclick = async e => { e.preventDefault(); await sb.auth.signOut(); sessionStorage.removeItem("unlocked"); location.reload(); };
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hiddenAt = Date.now();
    else {
      unseen = 0; document.title = "لوحة التحكم";
      if (lockEnabled() && hiddenAt && Date.now() - hiddenAt > 5 * 60000) { sessionStorage.removeItem("unlocked"); showLock(); }
    }
  });
  async function enableLock() {
    if (!window.PublicKeyCredential) { toast("الجهاز ده مش بيدعم القفل بالبصمة"); return false; }
    try {
      const cred = await navigator.credentials.create({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: "Ops's Store Admin", id: location.hostname },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: D.me, displayName: D.me },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" }, timeout: 60000 } });
      ls.set("ops_lock_id", b64(cred.rawId)); sessionStorage.setItem("unlocked", "1"); toast("القفل بالبصمة اتفعّل ✓"); return true;
    } catch (e) { toast("ملغي أو الجهاز مش بيدعمه"); return false; }
  }

  // ================= التنبيهات =================
  let lastId = null, unseen = 0, actx = null;
  const notifOn = () => "Notification" in window && Notification.permission === "granted";
  const bellLabel = () => { $("#bell").textContent = notifOn() ? "🔔" : "🔕"; $("#bell").title = notifOn() ? "التنبيه شغال" : "فعّل التنبيه"; };
  $("#bell").onclick = async () => {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); await actx.resume(); } catch (e) {}
    if ("Notification" in window && Notification.permission !== "granted") { try { await Notification.requestPermission(); } catch (e) {} }
    bellLabel(); ding(); toast(notifOn() ? "التنبيه شغال ✓ — هيرن مع كل طلب جديد" : "الإشعارات مقفولة من المتصفح — الصوت بس هيشتغل");
  };
  function ding() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18, 0.36].forEach((t, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = [880, 1175, 1568][i]; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.0001, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.3, actx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.25); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.3); });
    } catch (e) {}
  }
  async function notify(o) {
    const title = "طلب جديد " + (o.country === "SA" ? "🇸🇦" : "🇪🇬") + " " + o.order_no, body = `${o.product_name} × ${o.qty} — ${money(o.total, o.currency)}\n${o.governorate || ""}`;
    try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) { reg.showNotification(title, { body, tag: o.order_no, icon: "ops-icon-192.png" }); return; } } catch (e) {}
    try { new Notification(title, { body, tag: o.order_no }); } catch (e) {}
  }
  function checkNew() {
    const maxId = D.orders.reduce((m, o) => Math.max(m, o.id || 0), 0);
    if (lastId !== null && maxId > lastId) {
      const fresh = D.orders.filter(o => o.id > lastId);
      unseen += fresh.length; ding(); document.title = `(${unseen}) طلب جديد`;
      if (notifOn()) fresh.forEach(notify);
      toast(`🛒 ${fresh.length} طلب جديد`);
    }
    if (lastId === null || maxId > lastId) lastId = maxId;
  }
  async function pollOrders() {
    const { data } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(5000);
    if (!data) return;
    const before = D.orders.length; D.orders = data; checkNew();
    if (data.length !== before && !$(".ov")) route();
  }

  // ================= تحميل البيانات =================
  async function loadAll() {
    const q = (t, f = x => x) => f(sb.from(t).select("*")).then(r => { if (r.error) console.warn(t, r.error.message); return r.data || []; });
    const [orders, leads, products, offers, costs, cats, black, spend, admins] = await Promise.all([
      q("orders", x => x.order("created_at", { ascending: false }).limit(5000)),
      q("leads", x => x.eq("converted", false).order("created_at", { ascending: false }).limit(1000)),
      q("products", x => x.order("sort")), q("product_offers"), q("product_costs"), q("categories", x => x.order("sort")),
      q("blacklist"), q("ad_spend", x => x.order("day", { ascending: false }).limit(3000)), q("admins")]);
    Object.assign(D, { orders, leads, products, offers, costs, cats, black, spend, admins });
    if (!admins.length && !orders.length) { $("#view").innerHTML = `<div class="empty">مش قادر أجيب البيانات. اتأكد إن إيميلك متضاف في جدول admins.</div>`; }
    const me = admins.find(a => a.email.toLowerCase() === D.me);
    $("#me").textContent = me && me.name ? "أهلاً " + me.name : D.me;
    checkNew();
  }

  // ================= أدوات حسابية =================
  const since = () => F.days >= 3650 ? 0 : Date.now() - F.days * 864e5;
  const inCC = x => !F.cc || x.country === F.cc;
  const ordersInView = () => D.orders.filter(o => inCC(o) && new Date(o.created_at) >= since());
  const nameOf = email => { if (!email) return ""; const a = D.admins.find(x => x.email.toLowerCase() === String(email).toLowerCase()); return a && a.name ? a.name : String(email).split("@")[0]; };
  const costRow = id => D.costs.find(c => c.product_id === id) || {};
  const prodName = id => (D.products.find(p => p.id === id) || {}).name || id;
  const isBlack = phone => D.black.some(b => b.phone === phone);
  function costsOf(o) {
    const c = costRow(o.product_id), sa = o.country === "SA";
    return { unit: o.unit_cost ?? (sa ? c.cost_sa : c.cost_eg), ship: o.ship_cost ?? (sa ? c.ship_sa : c.ship_eg) ?? 0, ret: o.return_cost ?? (sa ? c.return_sa : c.return_eg) ?? 0 };
  }
  // صافي ربح الطلب: اتسلم = الإجمالي - التكلفة - الشحن ، مرتجع = - تكلفة المرتجع ، غير كده = 0
  function profitOf(o) {
    const c = costsOf(o);
    if (o.status === "delivered") return c.unit == null ? null : o.total - c.unit * o.qty - c.ship;
    if (o.status === "returned") return -(c.ret || c.ship || 0);
    return 0;
  }
  function expectedOf(o) { const c = costsOf(o); return c.unit == null ? null : o.total - c.unit * o.qty - c.ship; }
  const srcParts = s => { const p = String(s || "").split("|"); return { src: (p[0] || "direct").toLowerCase(), camp: p[1] || "" }; };
  const srcLabel = s => ({ facebook: "فيسبوك", fb: "فيسبوك", instagram: "إنستجرام", ig: "إنستجرام", tiktok: "تيك توك", snapchat: "سناب شات", google: "جوجل", whatsapp: "واتساب", direct: "مباشر" })[s] || s;
  const platGroup = s => ({ fb: "facebook", ig: "facebook", instagram: "facebook", facebook: "facebook" })[s] || s;

  // ================= التنقل =================
  const NAV = [
    ["home", "🏠", "الرئيسية"], ["orders", "📦", "الطلبات"], ["leads", "📝", "فورمات ناقصة"], ["customers", "👥", "العملاء"],
    ["products", "🛍️", "المنتجات"], ["cats", "🗂️", "الأقسام"], ["profit", "💰", "الأرباح"], ["ads", "📣", "الإعلانات"], ["settings", "⚙️", "الإعدادات"]];
  function navHTML() {
    const newN = D.orders.filter(o => o.status === "new").length, leadN = D.leads.length;
    return NAV.map(([k, i, t], idx) => (idx === 4 ? `<div class="grp">المتجر</div>` : idx === 6 ? `<div class="grp">الفلوس</div>` : "") +
      `<a href="#/${k}" class="${section === k ? "on" : ""}"><i>${i}</i>${t}${k === "orders" && newN ? `<span class="badge">${newN}</span>` : ""}${k === "leads" && leadN ? `<span class="badge">${leadN}</span>` : ""}</a>`).join("");
  }
  window.addEventListener("hashchange", () => { section = (location.hash.match(/^#\/(\w+)/) || [])[1] || "home"; route(); window.scrollTo(0, 0); });
  function filtersHTML(extra = "") {
    return `<div class="filters">
      <select id="fcc"><option value="">🌍 كل الدول</option><option value="EG" ${F.cc === "EG" ? "selected" : ""}>🇪🇬 مصر</option><option value="SA" ${F.cc === "SA" ? "selected" : ""}>🇸🇦 السعودية</option></select>
      <select id="fdays">${[[1, "النهارده"], [7, "آخر 7 أيام"], [30, "آخر 30 يوم"], [90, "آخر 90 يوم"], [3650, "كل الوقت"]].map(([v, t]) => `<option value="${v}" ${F.days === v ? "selected" : ""}>${t}</option>`).join("")}</select>${extra}</div>`;
  }
  function bindFilters() {
    const a = $("#fcc"), b = $("#fdays");
    if (a) a.onchange = () => { F.cc = a.value; ls.set("f_cc", F.cc); route(); };
    if (b) b.onchange = () => { F.days = +b.value; ls.set("f_days", F.days); route(); };
  }
  function route() {
    $("#nav").innerHTML = navHTML();
    const fn = { home: vHome, orders: vOrders, leads: vLeads, customers: vCustomers, products: vProducts, cats: vCats, profit: vProfit, ads: vAds, settings: vSettings }[section] || vHome;
    fn(); bindFilters();
  }

  // ================= رسم بياني بسيط (أعمدة) =================
  function barChart(points, cur) {
    const W = 640, H = 170, pad = 22, n = points.length, max = Math.max(1, ...points.map(p => p.v));
    const bw = (W - pad) / n, step = Math.ceil(n / 8);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H + 22}" role="img"><line x1="0" x2="${W}" y1="${H}" y2="${H}"/>`;
    points.forEach((p, i) => {
      const h = Math.round(p.v / max * (H - 16)), x = W - (i + 1) * bw + 2;
      s += `<rect class="b" x="${x.toFixed(1)}" y="${H - h}" width="${Math.max(2, bw - 4).toFixed(1)}" height="${Math.max(h, p.v ? 2 : 0)}" rx="3"><title>${p.label}: ${cur ? money(p.v, cur) : p.v}</title></rect>`;
      if (i % step === 0) s += `<text x="${(x + bw / 2 - 2).toFixed(1)}" y="${H + 15}" text-anchor="middle">${p.short}</text>`;
    });
    return s + `<text x="${W}" y="10" text-anchor="end">${cur ? money(max, cur) : max}</text></svg>`;
  }
  function daily(list, days, val) {
    const out = [], today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d0 = new Date(today - i * 864e5), d1 = new Date(+d0 + 864e5);
      const v = list.filter(o => { const t = new Date(o.created_at); return t >= d0 && t < d1; }).reduce((a, o) => a + val(o), 0);
      out.push({ v, label: d0.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "short" }), short: d0.getDate() + "/" + (d0.getMonth() + 1) });
    }
    return out;
  }
  const hbars = (rows, fmt = v => v) => { const max = Math.max(1, ...rows.map(r => r[1])); return rows.map(([k, v]) => `<div class="hbar"><span class="nm" title="${esc(k)}">${esc(k)}</span><span class="tr"><span class="fl" style="width:${(v / max * 100).toFixed(1)}%"></span></span><b>${fmt(v)}</b></div>`).join("") || `<div class="meta">مفيش بيانات لسه.</div>`; };
  const rateCell = (d, r) => { if (!(d + r)) return "—"; const v = Math.round(d / (d + r) * 100); return `<span class="rt ${v >= 75 ? "good" : v >= 60 ? "mid" : "bad"}">${v}%</span>`; };

  // ================= الرئيسية =================
  function vHome() {
    const V = ordersInView(), real = V.filter(o => o.status !== "cancelled");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const all = D.orders.filter(inCC);
    const todayN = all.filter(o => new Date(o.created_at) >= today).length;
    const del = real.filter(o => o.status === "delivered"), ret = real.filter(o => o.status === "returned");
    const rev = {}, prof = {}; let missing = 0;
    del.forEach(o => { rev[o.currency] = (rev[o.currency] || 0) + o.total; });
    real.forEach(o => { const p = profitOf(o); if (p == null) { missing++; return; } prof[o.currency] = (prof[o.currency] || 0) + p; });
    const spend = {}; D.spend.filter(s => inCC(s) && new Date(s.day) >= new Date(since() - 864e5)).forEach(s => spend[s.currency] = (spend[s.currency] || 0) + +s.amount);
    const net = {}; new Set([...Object.keys(prof), ...Object.keys(spend)]).forEach(c => net[c] = (prof[c] || 0) - (spend[c] || 0));
    const open = all.filter(o => ["new", "confirmed", "shipped"].includes(o.status));
    // محتاج منك
    const now = Date.now(), H = 36e5;
    const attn = [];
    const unassigned = all.filter(o => o.status === "new" && !o.assigned_to);
    if (unassigned.length) attn.push(`<li><a href="#/orders" data-preset="unassigned">${unassigned.length} طلب جديد محدش ماسكه</a></li>`);
    const oldNew = all.filter(o => o.status === "new" && now - new Date(o.created_at) > 6 * H);
    if (oldNew.length) attn.push(`<li><a href="#/orders" data-preset="new">${oldNew.length} طلب جديد بقاله أكتر من 6 ساعات من غير تأكيد</a></li>`);
    const notShipped = all.filter(o => o.status === "confirmed" && now - new Date(o.status_updated_at) > 24 * H);
    if (notShipped.length) attn.push(`<li><a href="#/orders" data-preset="confirmed">${notShipped.length} طلب متأكد ومتشحنش من أكتر من يوم</a></li>`);
    const late = all.filter(o => o.status === "shipped" && now - new Date(o.status_updated_at) > 7 * 24 * H);
    if (late.length) attn.push(`<li><a href="#/orders" data-preset="shipped">${late.length} طلب اتشحن من أكتر من 7 أيام ولسه متسلمش</a></li>`);
    const noCost = D.products.filter(p => p.active && !p.is_addon && costRow(p.id)[p.price_sa && !p.price ? "cost_sa" : "cost_eg"] == null);
    if (noCost.length) attn.push(`<li><a href="#/products">${noCost.length} منتج من غير سعر تكلفة — الأرباح مش هتتحسب صح</a></li>`);
    if (D.leads.filter(inCC).length) attn.push(`<li><a href="#/leads">${D.leads.filter(inCC).length} فورم ناقص محتاج متابعة</a></li>`);

    const chartDays = Math.min(Math.max(F.days, 7), 30);
    const ccs = F.cc ? [F.cc] : ["EG", "SA"].filter(c => all.some(o => o.country === c));
    const charts = ccs.map(c => `<div class="card"><h3>${c === "SA" ? "🇸🇦" : "🇪🇬"} الطلبات يوم بيوم <span class="meta">(آخر ${chartDays} يوم)</span></h3>${barChart(daily(all.filter(o => o.country === c && o.status !== "cancelled"), chartDays, () => 1))}</div>`).join("") || `<div class="card"><div class="meta">لسه مفيش طلبات.</div></div>`;
    const byProd = {}; real.forEach(o => byProd[o.product_name] = (byProd[o.product_name] || 0) + 1);
    const byGov = {}; real.forEach(o => { const k = (o.country === "SA" ? "🇸🇦 " : "") + o.governorate; byGov[k] = (byGov[k] || 0) + 1; });
    const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const mine = all.filter(o => o.assigned_to && o.assigned_to.toLowerCase() === D.me && ["new", "confirmed", "shipped"].includes(o.status)).length;

    $("#view").innerHTML = `<h1 class="sec">الرئيسية</h1>${filtersHTML()}
      <div class="kpis">
        <div class="kpi"><small>طلبات النهارده</small><b>${todayN}</b></div>
        <div class="kpi"><small>مستني تأكيد</small><b>${all.filter(o => o.status === "new").length}</b><div class="sub">مفتوح كله: ${open.length}</div></div>
        <div class="kpi"><small>طلبات الفترة</small><b>${real.length}</b><div class="sub">ملغي: ${V.length - real.length}</div></div>
        <div class="kpi"><small>نسبة التسليم</small><b>${rateCell(del.length, ret.length)}</b><div class="sub">اتسلم ${del.length} • مرتجع ${ret.length}</div></div>
        <div class="kpi"><small>مبيعات اتسلمت</small><b>${multi(rev)}</b></div>
        <div class="kpi"><small>صافي الربح (بعد الإعلانات)</small><b class="${Object.values(net).some(v => v < 0) ? "neg" : "pos"}">${multi(net)}</b>${missing ? `<div class="sub">⚠ ${missing} طلب من غير تكلفة</div>` : ""}</div>
        <div class="kpi"><small>طلبات ماسكها إنت</small><b>${mine}</b></div>
      </div>
      ${attn.length ? `<div class="card"><h3>⚡ محتاج منك</h3><ul class="attn">${attn.join("")}</ul></div>` : `<div class="card"><h3>✅ كله تمام</h3><div class="meta">مفيش حاجة متأخرة دلوقتي.</div></div>`}
      ${charts}
      <div class="grid2c"><div class="card"><h3>أكتر منتجات بتتطلب</h3>${hbars(top(byProd))}</div><div class="card"><h3>أكتر محافظات / مناطق</h3>${hbars(top(byGov))}</div></div>`;
    $$("[data-preset]").forEach(a => a.onclick = () => { ordersState.tab = a.dataset.preset === "unassigned" ? "new" : a.dataset.preset; ordersState.who = a.dataset.preset === "unassigned" ? "none" : ""; });
  }

  // ================= الطلبات =================
  const ordersState = { tab: "new", who: "", q: "" };
  function waConfirm(o) {
    return `أهلاً ${o.customer_name} 👋\nمعاك ${S.name}. بنأكد طلبك رقم ${o.order_no}:\n${o.product_name} × ${o.qty}\nالإجمالي ${num(o.total)} ${CUR[o.currency] || ""} (الدفع عند الاستلام)${o.addon_name ? "\n+ " + o.addon_name : ""}\nالعنوان: ${o.governorate} - ${o.city} - ${o.address}\nلو البيانات مظبوطة رد بـ «تمام» ونشحنلك على طول.`;
  }
  function assignSel(o) {
    return `<select class="who" title="مين ماسك الطلب"><option value="">👤 محدش ماسكه</option>${D.admins.map(a => `<option value="${esc(a.email)}" ${o.assigned_to && o.assigned_to.toLowerCase() === a.email.toLowerCase() ? "selected" : ""}>👤 ${esc(a.name || a.email)}</option>`).join("")}</select>`;
  }
  function vOrders() {
    const V = ordersInView(), st = ordersState;
    const byWho = o => !st.who || (st.who === "none" ? !o.assigned_to : st.who === "me" ? (o.assigned_to || "").toLowerCase() === D.me : (o.assigned_to || "").toLowerCase() === st.who);
    const base = V.filter(byWho);
    const counts = {}; base.forEach(o => counts[o.status] = (counts[o.status] || 0) + 1);
    const phoneCount = {}; D.orders.forEach(o => phoneCount[o.phone] = (phoneCount[o.phone] || 0) + 1);
    const q = st.q.trim();
    const rows = base.filter(o => (st.tab === "all" || o.status === st.tab) && (!q || [o.customer_name, o.phone, o.order_no, o.taager_order_no, o.city, o.product_name].some(x => String(x || "").includes(q))));
    $("#view").innerHTML = `<h1 class="sec">الطلبات <span class="sp"></span><button class="btn-s" id="xlsx">⬇ Excel</button><button class="btn-s" id="ttext">📋 نسخ للشحن</button></h1>
      ${filtersHTML(`<select id="fwho"><option value="">👥 الكل</option><option value="me" ${st.who === "me" ? "selected" : ""}>👤 بتوعي</option><option value="none" ${st.who === "none" ? "selected" : ""}>❔ محدش ماسكها</option>${D.admins.map(a => `<option value="${esc(a.email.toLowerCase())}" ${st.who === a.email.toLowerCase() ? "selected" : ""}>👤 ${esc(a.name || a.email)}</option>`).join("")}</select><input id="fq" placeholder="بحث: اسم، موبايل، رقم طلب، رقم تاجر…" value="${esc(st.q)}">`)}
      <div class="tabs">${[["all", "الكل", base.length], ...Object.entries(STATUS).map(([k, v]) => [k, v, counts[k] || 0])].map(([k, v, c]) => `<button class="tab ${st.tab === k ? "on" : ""}" data-t="${k}">${v}<i>${c}</i></button>`).join("")}</div>
      <div id="olist">${rows.length ? rows.map(o => orderCard(o, phoneCount)).join("") : `<div class="empty">مفيش طلبات هنا.</div>`}</div>`;
    $$(".tab").forEach(b => b.onclick = () => { st.tab = b.dataset.t; vOrders(); bindFilters(); });
    $("#fwho").onchange = e => { st.who = e.target.value; vOrders(); bindFilters(); };
    $("#fq").oninput = e => { st.q = e.target.value; clearTimeout(vOrders.t); vOrders.t = setTimeout(() => { vOrders(); bindFilters(); const i = $("#fq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
    $("#xlsx").onclick = () => exportXlsx(rows, "orders-" + st.tab);
    $("#ttext").onclick = () => copyShipping(rows);
    bindOrderCards();
  }
  function orderCard(o, phoneCount) {
    const mine = o.assigned_to && o.assigned_to.toLowerCase() === D.me;
    return `<div class="ord" data-id="${o.id}">
      <div>
        <div class="no" data-open>${o.country === "SA" ? "🇸🇦" : "🇪🇬"} ${esc(o.order_no)} <span class="st st-${o.status}">${STATUS[o.status]}</span>
          ${o.assigned_to ? `<span class="pill ${mine ? "me" : ""}">👤 ${esc(nameOf(o.assigned_to))}</span>` : ""}
          ${(o.flags || []).map(f => `<span class="flag">${FLAG[f] || f}</span>`).join(" ")}
          ${isBlack(o.phone) ? `<span class="flag">⛔ بلاك ليست</span>` : ""}
          ${phoneCount[o.phone] > 1 && !(o.flags || []).includes("duplicate") ? `<span class="flag">⚠ ${phoneCount[o.phone]} طلبات من الرقم ده</span>` : ""}</div>
        <div>${esc(o.product_name)} × ${o.qty}${o.addon_name ? ` <span class="meta">+ ${esc(o.addon_name)}</span>` : ""} — <b>${money(o.total, o.currency)}</b></div>
        <div class="meta">${dt(o.created_at)} • ${esc(srcLabel(srcParts(o.source).src))}${srcParts(o.source).camp ? " / " + esc(srcParts(o.source).camp) : ""}${o.taager_order_no ? " • تاجر: " + esc(o.taager_order_no) : ""}</div>
      </div>
      <div>
        <div><b>${esc(o.customer_name)}</b> — <span dir="ltr">${esc(o.phone)}</span></div>
        <div class="meta">${esc(o.governorate)} • ${esc(o.city)} • ${esc(o.address)}</div>
        ${o.landmark ? `<div class="meta">📍 ${esc(o.landmark)}</div>` : ""}${o.notes ? `<div class="meta">📝 ${esc(o.notes)}</div>` : ""}
        <input class="note" placeholder="ملاحظة داخلية…" value="${esc(o.admin_note || "")}">
      </div>
      <div class="acts">
        <a class="wa" href="https://wa.me/${intl(o.phone, o.country)}?text=${encodeURIComponent(waConfirm(o))}" target="_blank" rel="noopener">واتساب</a>
        <a href="tel:${esc(o.phone)}">اتصال</a>
        <select class="stsel">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === o.status ? "selected" : ""}>${v}</option>`).join("")}</select>
        ${assignSel(o)}
        <button data-open>تفاصيل</button>
      </div></div>`;
  }
  function bindOrderCards(root = document) {
    $$(".ord[data-id]", root).forEach(el => {
      const id = +el.dataset.id;
      el.querySelector(".stsel").onchange = e => saveOrder(id, { status: e.target.value });
      el.querySelector(".who").onchange = e => saveOrder(id, { assigned_to: e.target.value || null });
      el.querySelector(".note").onchange = e => saveOrder(id, { admin_note: e.target.value });
      $$("[data-open]", el).forEach(b => b.onclick = () => openOrder(id));
    });
  }
  async function saveOrder(id, patch, quiet) {
    const { error } = await sb.from("orders").update(patch).eq("id", id);
    if (error) { alert("مقدرتش أحفظ: " + error.message); return false; }
    Object.assign(D.orders.find(x => x.id === id), patch, { updated_by: D.me });
    if (!quiet) { toast("اتحفظ ✓"); if (!$(".ov")) route(); }
    return true;
  }

  // ---------- تفاصيل الطلب ----------
  function drawer(title, body, onMount, actions = "") {
    const ov = document.createElement("div"); ov.className = "ov";
    ov.innerHTML = `<div class="drawer"><div class="dh"><b>${title}</b>${actions}<button class="btn-s" data-x>✕</button></div><div class="db">${body}</div></div>`;
    ov.onclick = e => { if (e.target === ov) close(); };
    const close = () => { ov.remove(); document.body.style.overflow = ""; route(); };
    $("[data-x]", ov).onclick = close;
    document.body.append(ov); document.body.style.overflow = "hidden";
    onMount && onMount(ov, close);
    return ov;
  }
  const field = (k, label, val, type = "text", extra = "") => `<div class="f ${extra}"><label>${label}</label>${type === "textarea" ? `<textarea name="${k}">${esc(val)}</textarea>` : `<input name="${k}" type="${type}" value="${esc(val ?? "")}" ${type === "tel" ? 'dir="ltr"' : ""}>`}</div>`;
  async function openOrder(id) {
    const o = D.orders.find(x => x.id === id); if (!o) return;
    const c = costsOf(o), exp = expectedOf(o), prof = profitOf(o);
    const others = D.orders.filter(x => x.phone === o.phone && x.id !== o.id);
    const ov = drawer(`${o.country === "SA" ? "🇸🇦" : "🇪🇬"} ${esc(o.order_no)}`, `
      <div class="card"><h3>الطلب <span class="st st-${o.status}">${STATUS[o.status]}</span></h3>
        <div>${esc(o.product_name)} × ${o.qty}${o.addon_name ? " + " + esc(o.addon_name) : ""}</div>
        <div class="meta">${dt(o.created_at)} • المصدر: ${esc(o.source || "مباشر")}${o.updated_by ? " • آخر تعديل: " + esc(nameOf(o.updated_by)) : ""}</div>
        <div class="kpis" style="margin:12px 0 0">
          <div class="kpi"><small>مبلغ التحصيل</small><b>${money(o.total, o.currency)}</b></div>
          <div class="kpi"><small>التكلفة + الشحن</small><b>${c.unit == null ? "—" : money(c.unit * o.qty + c.ship, o.currency)}</b>${c.unit == null ? `<div class="sub">حط سعر التكلفة من المنتجات</div>` : ""}</div>
          <div class="kpi"><small>${["delivered", "returned"].includes(o.status) ? "صافي الربح" : "الربح المتوقع"}</small><b class="${(["delivered", "returned"].includes(o.status) ? prof : exp) < 0 ? "neg" : "pos"}">${(["delivered", "returned"].includes(o.status) ? prof : exp) == null ? "—" : money(["delivered", "returned"].includes(o.status) ? prof : exp, o.currency)}</b></div>
        </div>
      </div>
      <form class="card" id="of"><h3>البيانات <span class="sp"></span><button class="btn-s pri">حفظ التعديلات</button></h3>
        <div class="fgrid">
          <div class="f"><label>الحالة</label><select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === o.status ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="f"><label>مين ماسكه</label><select name="assigned_to"><option value="">محدش</option>${D.admins.map(a => `<option value="${esc(a.email)}" ${(o.assigned_to || "").toLowerCase() === a.email.toLowerCase() ? "selected" : ""}>${esc(a.name || a.email)}</option>`).join("")}</select></div>
          ${field("customer_name", "الاسم", o.customer_name)}${field("phone", "الموبايل", o.phone, "tel")}
          ${field("governorate", o.country === "SA" ? "المنطقة" : "المحافظة", o.governorate)}${field("city", "المدينة / المنطقة", o.city)}
          ${field("address", "العنوان", o.address, "text", "full")}${field("landmark", "علامة مميزة", o.landmark)}${field("notes", "ملاحظات العميل", o.notes)}
          ${field("qty", "الكمية", o.qty, "number")}${field("total", "مبلغ التحصيل", o.total, "number")}
          ${field("taager_order_no", "رقم الأوردر على تاجر", o.taager_order_no)}${field("tracking", "رقم التتبع / شركة الشحن", o.tracking)}
          ${field("admin_note", "ملاحظة داخلية (مش بتظهر للعميل)", o.admin_note, "textarea", "full")}
        </div></form>
      <div class="card"><h3>العميل ${isBlack(o.phone) ? `<span class="flag">⛔ في البلاك ليست</span>` : ""}</h3>
        <div class="acts">
          <a class="wa" href="https://wa.me/${intl(o.phone, o.country)}?text=${encodeURIComponent(waConfirm(o))}" target="_blank" rel="noopener">واتساب تأكيد</a>
          <a href="tel:${esc(o.phone)}">اتصال</a>
          <button id="cpy">📋 نسخ البيانات لتاجر</button>
          <button id="bl">${isBlack(o.phone) ? "شيله من البلاك ليست" : "⛔ ضيفه للبلاك ليست"}</button>
        </div>
        ${others.length ? `<div class="meta" style="margin-top:10px">طلبات تانية من نفس الرقم:</div><ul class="timeline">${others.map(x => `<li><b>${esc(x.order_no)}</b> <span class="st st-${x.status}">${STATUS[x.status]}</span> — ${esc(x.product_name)} — ${money(x.total, x.currency)}<small>${dt(x.created_at)}</small></li>`).join("")}</ul>` : `<div class="meta" style="margin-top:10px">أول طلب من الرقم ده.</div>`}
      </div>
      <div class="card"><h3>سجل التعديلات</h3><ul class="timeline" id="hist"><li class="meta">بيحمّل…</li></ul></div>`);
    $("#of", ov).onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target), patch = {};
      for (const [k, v] of fd.entries()) {
        let val = v.trim(); if (k === "qty" || k === "total") val = +val; if (val === "" && k !== "qty" && k !== "total") val = null;
        if ((o[k] ?? null) !== val && String(o[k] ?? "") !== String(val ?? "")) patch[k] = val;
      }
      if (!Object.keys(patch).length) { toast("مفيش تعديل"); return; }
      if (await saveOrder(id, patch, true)) { toast("اتحفظ ✓"); ov.remove(); document.body.style.overflow = ""; openOrder(id); }
    };
    $("#cpy", ov).onclick = () => copyShipping([o]);
    $("#bl", ov).onclick = async () => {
      if (isBlack(o.phone)) { await sb.from("blacklist").delete().eq("phone", o.phone); D.black = D.black.filter(b => b.phone !== o.phone); toast("اتشال من البلاك ليست"); }
      else { const reason = prompt("السبب؟ (مثلاً: رفض الاستلام مرتين)") ?? ""; const { error } = await sb.from("blacklist").insert({ phone: o.phone, reason }); if (error) { alert(error.message); return; } D.black.push({ phone: o.phone, reason }); toast("اتضاف للبلاك ليست"); }
      ov.remove(); document.body.style.overflow = ""; openOrder(id);
    };
    const { data: ev } = await sb.from("order_events").select("*").eq("order_id", id).order("at", { ascending: false });
    const show = (f, v) => f === "status" ? (STATUS[v] || v) : f === "assigned_to" ? (nameOf(v) || "محدش") : (v || "—");
    $("#hist", ov).innerHTML = (ev || []).map(e => `<li>${esc(nameOf(e.actor) || e.actor)} غيّر <b>${FIELD[e.field] || e.field}</b>: ${esc(show(e.field, e.old_value))} ← ${esc(show(e.field, e.new_value))}<small>${dt(e.at)}</small></li>`).join("") + `<li>الطلب اتعمل من الموقع<small>${dt(o.created_at)}</small></li>`;
  }
  function copyShipping(list) {
    if (!list.length) { toast("مفيش طلبات"); return; }
    const txt = list.map(o => [`طلب ${o.order_no}`, `الاسم: ${o.customer_name}`, `الموبايل: ${o.phone}`, `${o.country === "SA" ? "المنطقة" : "المحافظة"}: ${o.governorate}`, `المدينة: ${o.city}`, `العنوان: ${o.address}${o.landmark ? " — " + o.landmark : ""}`, `المنتج: ${o.product_name} × ${o.qty}${o.addon_name ? " + " + o.addon_name : ""}`, `مبلغ التحصيل: ${o.total} ${CUR[o.currency] || ""}`, o.notes ? `ملاحظات: ${o.notes}` : ""].filter(Boolean).join("\n")).join("\n\n—————\n\n");
    navigator.clipboard.writeText(txt).then(() => toast(`اتنسخ ${list.length} طلب ✓`), () => { prompt("انسخ من هنا:", txt); });
  }
  // ---------- Excel ----------
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"; s.onload = res; s.onerror = rej; document.head.append(s); });
  }
  async function exportXlsx(list, name, rowsFn) {
    if (!list.length) { toast("مفيش حاجة تتصدر"); return; }
    try { await loadXLSX(); } catch (e) { alert("مقدرتش أحمّل Excel — جرب تاني"); return; }
    const rows = rowsFn ? rowsFn(list) : list.map(o => ({ "الدولة": o.country === "SA" ? "السعودية" : "مصر", "رقم الطلب": o.order_no, "التاريخ": new Date(o.created_at).toLocaleString("en-GB"), "الحالة": STATUS[o.status], "المسؤول": nameOf(o.assigned_to),
      "اسم العميل": o.customer_name, "الموبايل": o.phone, "المحافظة/المنطقة": o.governorate, "المدينة": o.city, "العنوان": o.address, "علامة مميزة": o.landmark || "",
      "المنتج": o.product_name + (o.addon_name ? " + " + o.addon_name : ""), "الكمية": o.qty, "مبلغ التحصيل": o.total, "العملة": o.currency, "ملاحظات العميل": o.notes || "",
      "ملاحظة داخلية": o.admin_note || "", "رقم تاجر": o.taager_order_no || "", "التتبع": o.tracking || "", "المصدر": o.source || "" }));
    const ws = XLSX.utils.json_to_sheet(rows), wb = XLSX.utils.book_new();
    ws["!cols"] = Object.keys(rows[0]).map(k => ({ wch: Math.min(40, Math.max(10, k.length + 2, ...rows.slice(0, 200).map(r => String(r[k] ?? "").length))) }));
    XLSX.utils.book_append_sheet(wb, ws, "Data"); wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.writeFile(wb, `${name}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ================= الفورمات الناقصة =================
  function vLeads() {
    const rows = D.leads.filter(l => inCC(l));
    $("#view").innerHTML = `<h1 class="sec">الفورمات الناقصة</h1>${filtersHTML()}
      <p class="meta" style="margin:0 0 10px">ناس كتبوا رقمهم ومكمّلوش الطلب. ابعتلهم رسالة واحدة بس — متزنّش.</p>
      ${rows.length ? rows.map(l => {
        const p = D.products.find(x => x.id === l.product_id);
        const msg = `أهلاً${l.name ? " " + l.name : ""} 👋 معاك ${S.name}. لاحظنا إنك كنت بتطلب ${p ? p.name : "منتج"} ومكمّلتش. لو عندك أي سؤال أو حابب نكمّل الطلب معاك هنا، إحنا موجودين.`;
        return `<div class="ord" style="grid-template-columns:1.5fr auto"><div><b>${esc(l.name || "بدون اسم")}</b> — <span dir="ltr">${esc(l.phone)}</span> ${isBlack(l.phone) ? `<span class="flag">⛔</span>` : ""}<div class="meta">${p ? esc(p.name) : esc(l.product_id || "")} • ${dt(l.created_at)} • ${esc(l.source || "-")}</div></div>
          <div class="acts"><a class="wa" href="https://wa.me/${intl(l.phone, l.country)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">واتساب متابعة</a><button data-lead="${l.id}">تم ✓</button></div></div>`;
      }).join("") : `<div class="empty">مفيش فورمات ناقصة 👌</div>`}`;
    $$("[data-lead]").forEach(a => a.onclick = async () => { const id = +a.dataset.lead; await sb.from("leads").update({ converted: true }).eq("id", id); D.leads = D.leads.filter(x => x.id !== id); route(); });
  }

  // ================= العملاء =================
  const custState = { q: "", sort: "orders" };
  function vCustomers() {
    const g = {};
    D.orders.filter(inCC).forEach(o => {
      const c = g[o.phone] || (g[o.phone] = { phone: o.phone, country: o.country, name: o.customer_name, gov: o.governorate, n: 0, d: 0, r: 0, x: 0, spent: 0, cur: o.currency, last: o.created_at });
      c.n++; if (o.status === "delivered") { c.d++; c.spent += o.total; } if (o.status === "returned") c.r++; if (o.status === "cancelled") c.x++;
      if (new Date(o.created_at) > new Date(c.last)) { c.last = o.created_at; c.name = o.customer_name; }
    });
    let rows = Object.values(g); const q = custState.q.trim();
    if (q) rows = rows.filter(c => [c.name, c.phone, c.gov].some(x => String(x || "").includes(q)));
    const sorters = { orders: (a, b) => b.n - a.n, spent: (a, b) => b.spent - a.spent, last: (a, b) => new Date(b.last) - new Date(a.last), returns: (a, b) => b.r - a.r };
    rows.sort(sorters[custState.sort]);
    const repeat = Object.values(g).filter(c => c.d >= 2).length;
    $("#view").innerHTML = `<h1 class="sec">العملاء <span class="sp"></span><button class="btn-s" id="cx">⬇ Excel</button></h1>
      ${filtersHTML(`<select id="csort"><option value="orders">الأكتر طلبات</option><option value="spent" ${custState.sort === "spent" ? "selected" : ""}>الأكتر شراء</option><option value="last" ${custState.sort === "last" ? "selected" : ""}>الأحدث</option><option value="returns" ${custState.sort === "returns" ? "selected" : ""}>الأكتر مرتجعات</option></select><input id="cq" placeholder="بحث بالاسم أو الموبايل" value="${esc(custState.q)}">`)}
      <div class="kpis"><div class="kpi"><small>عدد العملاء</small><b>${Object.keys(g).length}</b></div><div class="kpi"><small>رجعوا اشتروا تاني</small><b>${repeat}</b></div><div class="kpi"><small>في البلاك ليست</small><b>${D.black.length}</b></div></div>
      <div class="card scroll"><table class="t"><thead><tr><th>العميل</th><th>الموبايل</th><th>المكان</th><th>طلبات</th><th>اتسلم</th><th>مرتجع</th><th>ملغي</th><th>اشترى بـ</th><th>آخر طلب</th><th></th></tr></thead><tbody>
      ${rows.slice(0, 500).map(c => `<tr><td><b>${esc(c.name)}</b> ${isBlack(c.phone) ? `<span class="flag">⛔</span>` : ""}${c.r >= 2 ? ` <span class="flag">رافض ${c.r}</span>` : ""}</td><td dir="ltr">${esc(c.phone)}</td><td>${c.country === "SA" ? "🇸🇦 " : ""}${esc(c.gov)}</td><td>${c.n}</td><td>${c.d}</td><td>${c.r}</td><td>${c.x}</td><td>${money(c.spent, c.cur)}</td><td class="meta">${dt(c.last)}</td>
        <td class="acts"><a class="wa" href="https://wa.me/${intl(c.phone, c.country)}" target="_blank" rel="noopener">واتساب</a><button data-co="${esc(c.phone)}">طلباته</button><button data-bl="${esc(c.phone)}">${isBlack(c.phone) ? "شيل ⛔" : "⛔"}</button></td></tr>`).join("") || `<tr><td colspan="10" class="empty">لسه مفيش عملاء.</td></tr>`}
      </tbody></table></div>`;
    $("#csort").onchange = e => { custState.sort = e.target.value; route(); };
    $("#cq").oninput = e => { custState.q = e.target.value; clearTimeout(vCustomers.t); vCustomers.t = setTimeout(() => { route(); const i = $("#cq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
    $$("[data-co]").forEach(b => b.onclick = () => { ordersState.q = b.dataset.co; ordersState.tab = "all"; ordersState.who = ""; F.days = 3650; location.hash = "#/orders"; });
    $$("[data-bl]").forEach(b => b.onclick = async () => {
      const phone = b.dataset.bl;
      if (isBlack(phone)) { await sb.from("blacklist").delete().eq("phone", phone); D.black = D.black.filter(x => x.phone !== phone); }
      else { const reason = prompt("السبب؟") ?? ""; const { error } = await sb.from("blacklist").insert({ phone, reason }); if (error) { alert(error.message); return; } D.black.push({ phone, reason }); }
      route();
    });
    $("#cx").onclick = () => exportXlsx(rows, "customers", l => l.map(c => ({ "العميل": c.name, "الموبايل": c.phone, "الدولة": c.country, "المكان": c.gov, "طلبات": c.n, "اتسلم": c.d, "مرتجع": c.r, "ملغي": c.x, "اشترى بـ": c.spent, "العملة": c.cur, "آخر طلب": new Date(c.last).toLocaleDateString("en-GB"), "بلاك ليست": isBlack(c.phone) ? "أيوه" : "" })));
  }

  // ================= المنتجات =================
  const prodState = { cat: "", cc: "" };
  const offerOf = (id, cc) => (D.offers.find(o => o.product_id === id && o.country === cc && o.qty === 2) || {}).total;
  function vProducts() {
    const sold = {}; D.orders.filter(o => o.status !== "cancelled").forEach(o => { sold[o.product_id] = (sold[o.product_id] || 0) + o.qty; });
    let list = D.products.filter(p => !p.is_addon);
    if (prodState.cat) list = list.filter(p => (p.category_id || "") === prodState.cat);
    if (prodState.cc) list = list.filter(p => prodState.cc === "EG" ? p.price : p.price_sa);
    $("#view").innerHTML = `<h1 class="sec">المنتجات <span class="sp"></span><button class="btn-s pri" id="newp">＋ منتج جديد</button></h1>
      <div class="filters"><select id="pcat"><option value="">🗂️ كل الأقسام</option>${D.cats.map(c => `<option value="${c.id}" ${prodState.cat === c.id ? "selected" : ""}>${c.icon || ""} ${esc(c.name)}</option>`).join("")}<option value="" disabled>──</option></select>
        <select id="pcc"><option value="">🌍 كل الدول</option><option value="EG" ${prodState.cc === "EG" ? "selected" : ""}>🇪🇬 مصر</option><option value="SA" ${prodState.cc === "SA" ? "selected" : ""}>🇸🇦 السعودية</option></select></div>
      <div class="pgrid">${list.map(p => {
        const d = p.data || {}, c = costRow(p.id), cat = D.cats.find(x => x.id === p.category_id);
        const line = (cc, price, cost, ship) => price ? `<div class="row"><span>${cc === "SA" ? "🇸🇦" : "🇪🇬"} ${money(price, CC_CUR[cc])}${offerOf(p.id, cc) ? ` <span class="meta">(2 بـ ${num(offerOf(p.id, cc))})</span>` : ""}</span><span>${cost == null ? `<span class="flag">من غير تكلفة</span>` : `ربح القطعة <b class="${price - cost - (ship || 0) < 0 ? "neg" : "pos"}">${num(price - cost - (ship || 0))}</b>`}</span></div>` : "";
        return `<div class="pc ${p.active ? "" : "off"}" data-id="${esc(p.id)}"><div class="im" data-edit>${(d.images || [])[0] ? `<img src="${esc(d.images[0])}" loading="lazy" alt="">` : ""}${cat ? `<span class="pill">${cat.icon || ""} ${esc(cat.name)}</span>` : `<span class="pill">من غير قسم</span>`}</div>
          <div class="bd"><h4>${esc(p.name)}</h4>${line("EG", p.price, c.cost_eg, c.ship_eg)}${line("SA", p.price_sa, c.cost_sa, c.ship_sa)}
          <div class="row meta"><span>اتباع: ${sold[p.id] || 0} قطعة</span><span>${d.video ? "▶ فيديو" : `<span class="flag">مفيش فيديو</span>`}</span></div>
          <div class="row" style="margin-top:auto;align-items:center"><label style="display:flex;gap:8px;align-items:center;font-size:13px"><span class="switch"><input type="checkbox" data-act ${p.active ? "checked" : ""}><span></span></span>${p.active ? "ظاهر في الموقع" : "مخفي"}</label><button class="btn-s" data-edit>تعديل</button></div></div></div>`;
      }).join("") || `<div class="empty">مفيش منتجات هنا.</div>`}</div>`;
    $("#pcat").onchange = e => { prodState.cat = e.target.value; route(); };
    $("#pcc").onchange = e => { prodState.cc = e.target.value; route(); };
    $("#newp").onclick = () => editProduct(null);
    $$(".pc").forEach(el => {
      const id = el.dataset.id;
      $$("[data-edit]", el).forEach(b => b.onclick = () => editProduct(id));
      $("[data-act]", el).onchange = async e => {
        const { error } = await sb.from("products").update({ active: e.target.checked, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) { alert(error.message); e.target.checked = !e.target.checked; return; }
        D.products.find(p => p.id === id).active = e.target.checked; toast(e.target.checked ? "المنتج ظاهر في الموقع ✓" : "المنتج اتخفى من الموقع"); route();
      };
    });
  }
  const lines = a => (a || []).join("\n");
  const pairs = a => (a || []).map(x => x.join(" | ")).join("\n");
  const toLines = s => String(s || "").split("\n").map(x => x.trim()).filter(Boolean);
  const toPairs = s => toLines(s).map(x => { const i = x.indexOf("|"); return i < 0 ? [x, ""] : [x.slice(0, i).trim(), x.slice(i + 1).trim()]; });
  async function upload(file, prefix) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }
  function editProduct(id) {
    const isNew = !id, p = isNew ? { id: "", name: "", active: false, data: {} } : D.products.find(x => x.id === id);
    const d = p.data || {}, c = isNew ? { ship_eg: 100, ship_sa: 28, return_eg: 100, return_sa: 28, supplier: "taager" } : costRow(id);
    let images = [...(d.images || [])];
    const ov = drawer(isNew ? "منتج جديد" : esc(p.name), `
      <form id="pf">
        <div class="card"><h3>الأساسي</h3><div class="fgrid">
          ${field("name", "اسم المنتج", p.name, "text", "full")}
          ${field("subtitle", "جملة تحت الاسم", d.subtitle, "text", "full")}
          <div class="f"><label>القسم</label><select name="category_id"><option value="">من غير قسم</option>${D.cats.map(x => `<option value="${x.id}" ${p.category_id === x.id ? "selected" : ""}>${x.icon || ""} ${esc(x.name)}</option>`).join("")}</select></div>
          <div class="f"><label>الموسم</label><select name="season"><option value="">طول السنة</option><option value="winter" ${p.season === "winter" ? "selected" : ""}>❄ شتوي</option><option value="summer" ${p.season === "summer" ? "selected" : ""}>☀ صيفي</option></select></div>
          ${field("specs", "مميزات قصيرة على الكارت (كل سطر واحدة)", lines(d.specs), "textarea")}
          ${field("bullets", "نقط تحت السعر (كل سطر واحدة)", lines(d.bullets), "textarea")}
          ${isNew ? `${field("pid", "كود المنتج (إنجليزي من غير مسافات — اختياري)", "", "text")}` : ""}
          <div class="f"><label>ترتيب الظهور</label><input name="sort" type="number" value="${p.sort ?? ""}"></div>
        </div></div>
        <div class="card"><h3>السعر 🇪🇬 مصر <span class="meta">(سيبه فاضي لو مش هيتباع في مصر)</span></h3><div class="fgrid">
          ${field("price", "سعر القطعة (شامل الشحن)", p.price, "number")}${field("offer_eg", "سعر قطعتين (اختياري)", offerOf(p.id, "EG"), "number")}
          ${field("cost_eg", "سعر التكلفة (تاجر / المورد)", c.cost_eg, "number")}${field("ship_eg", "الشحن اللي بيتخصم", c.ship_eg, "number")}
          ${field("return_eg", "تكلفة المرتجع", c.return_eg, "number")}</div></div>
        <div class="card"><h3>السعر 🇸🇦 السعودية <span class="meta">(سيبه فاضي لو مش هيتباع في السعودية)</span></h3><div class="fgrid">
          ${field("price_sa", "سعر القطعة (شامل الشحن)", p.price_sa, "number")}${field("offer_sa", "سعر قطعتين (اختياري)", offerOf(p.id, "SA"), "number")}
          ${field("cost_sa", "سعر التكلفة (تاجر / المورد)", c.cost_sa, "number")}${field("ship_sa", "الشحن اللي بيتخصم", c.ship_sa, "number")}
          ${field("return_sa", "تكلفة المرتجع", c.return_sa, "number")}</div></div>
        <div class="card"><h3>المورد</h3><div class="fgrid">
          <div class="f"><label>المورد</label><select name="supplier">${[["taager", "تاجر"], ["local", "تاجر جملة محلي"], ["stock", "مخزون عندنا"], ["other", "تاني"]].map(([v, t]) => `<option value="${v}" ${(c.supplier || "taager") === v ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          ${field("supplier_ref", "كود المنتج عند المورد (مثلاً: EG 12438)", c.supplier_ref || d.taager)}</div></div>
        <div class="card"><h3>الصور والفيديو <span class="meta">(قاعدتنا: لازم فيديو حقيقي)</span></h3>
          <div class="f"><label>الصور (أول صورة هي الأساسية)</label><div class="thumbs" id="thumbs"></div>
            <div class="acts" style="margin-top:8px"><label class="btn-s">📷 رفع صور<input type="file" accept="image/*" multiple hidden id="upi"></label><button type="button" class="btn-s" id="addurl">＋ لينك صورة</button></div></div>
          <div class="f" style="margin-top:12px"><label>الفيديو</label><input name="video" value="${esc(d.video || "")}" dir="ltr" placeholder="لينك الفيديو">
            <div class="acts" style="margin-top:8px"><label class="btn-s">🎬 رفع فيديو<input type="file" accept="video/*" hidden id="upv"></label><span class="meta" id="vst"></span></div></div>
        </div>
        <div class="card"><h3>صفحة المنتج</h3><div class="fgrid">
          ${field("highlights", "أهم 3 مميزات — كل سطر: العنوان | الشرح", pairs(d.highlights), "textarea", "full")}
          ${field("specTable", "جدول المواصفات — كل سطر: الاسم | القيمة", pairs(d.specTable), "textarea", "full")}
          ${field("inBox", "في العلبة (كل سطر حاجة)", lines(d.inBox), "textarea")}
          ${field("honest", "كلام بصراحة عن المنتج (حدوده)", d.honest, "textarea")}
          ${field("faq", "أسئلة — كل سطر: السؤال | الإجابة", pairs(d.faq), "textarea", "full")}
        </div></div>
        <div class="acts" style="justify-content:flex-start"><button class="btn-s pri" style="font-size:16px;padding:12px 22px">💾 حفظ المنتج</button>${!isNew ? `<a class="btn-s" href="product.html?p=${encodeURIComponent(p.id)}&c=${p.price ? "EG" : "SA"}" target="_blank">👁 شوفه في الموقع</a>` : ""}<span class="meta">${isNew ? "المنتج الجديد بيتحفظ مخفي — افتحه من زرار «ظاهر في الموقع» لما تخلص." : ""}</span></div>
      </form>`);
    const drawThumbs = () => {
      $("#thumbs", ov).innerHTML = images.map((u, i) => `<div class="th"><img src="${esc(u)}" alt=""><button type="button" data-rm="${i}">✕</button>${i ? `<button type="button" data-first="${i}" style="left:auto;right:2px">★</button>` : ""}</div>`).join("") || `<span class="meta">مفيش صور لسه.</span>`;
      $$("[data-rm]", ov).forEach(b => b.onclick = () => { images.splice(+b.dataset.rm, 1); drawThumbs(); });
      $$("[data-first]", ov).forEach(b => b.onclick = () => { const [x] = images.splice(+b.dataset.first, 1); images.unshift(x); drawThumbs(); });
    };
    drawThumbs();
    $("#addurl", ov).onclick = () => { const u = prompt("حط لينك الصورة:"); if (u && /^https?:\/\//.test(u.trim())) { images.push(u.trim()); drawThumbs(); } };
    $("#upi", ov).onchange = async e => {
      const files = [...e.target.files]; if (!files.length) return; toast("بيرفع " + files.length + " صورة…");
      for (const f of files) { try { images.push(await upload(f, "img")); drawThumbs(); } catch (err) { alert("مقدرتش أرفع " + f.name + ": " + err.message); } }
      toast("الصور اترفعت ✓");
    };
    $("#upv", ov).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 50 * 1024 * 1024) { alert("الفيديو أكبر من 50 ميجا — صغّره الأول"); return; }
      $("#vst", ov).textContent = "بيرفع الفيديو…";
      try { $("[name=video]", ov).value = await upload(f, "vid"); $("#vst", ov).textContent = "اترفع ✓"; } catch (err) { $("#vst", ov).textContent = ""; alert("مقدرتش أرفع الفيديو: " + err.message); }
    };
    $("#pf", ov).onsubmit = async e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      const n = k => fd[k] === "" || fd[k] == null ? null : Math.round(+fd[k]);
      if (!fd.name.trim()) { alert("اكتب اسم المنتج"); return; }
      if (!n("price") && !n("price_sa")) { alert("لازم سعر في مصر أو السعودية على الأقل"); return; }
      if (!images.length) { alert("ضيف صورة واحدة على الأقل"); return; }
      if (!fd.video.trim() && !confirm("المنتج من غير فيديو، وقاعدتنا إن كل منتج يبقى ليه فيديو. تحفظه برضه؟")) return;
      let pid = p.id;
      if (isNew) {
        pid = (fd.pid || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "p-" + Date.now().toString(36);
        if (D.products.some(x => x.id === pid)) { alert("الكود ده مستخدم قبل كده — اختار كود تاني"); return; }
      }
      const data = Object.assign({}, d, { subtitle: fd.subtitle.trim(), specs: toLines(fd.specs), bullets: toLines(fd.bullets), images, video: fd.video.trim(),
        highlights: toPairs(fd.highlights), specTable: toPairs(fd.specTable), inBox: toLines(fd.inBox), honest: fd.honest.trim(), faq: toPairs(fd.faq) });
      if (fd.supplier === "taager" && fd.supplier_ref) data.taager = fd.supplier_ref.trim();
      const maxSort = Math.max(0, ...D.products.map(x => x.sort || 0));
      const row = { id: pid, name: fd.name.trim(), price: n("price"), price_sa: n("price_sa"), category_id: fd.category_id || null, season: fd.season || null,
        sort: n("sort") ?? (isNew ? maxSort + 10 : p.sort), data, updated_at: new Date().toISOString() };
      if (isNew) row.active = false;
      const r1 = await sb.from("products").upsert(row); if (r1.error) { alert("مقدرتش أحفظ المنتج: " + r1.error.message); return; }
      const r2 = await sb.from("product_costs").upsert({ product_id: pid, cost_eg: n("cost_eg"), cost_sa: n("cost_sa"), ship_eg: n("ship_eg"), ship_sa: n("ship_sa"), return_eg: n("return_eg"), return_sa: n("return_sa"), supplier: fd.supplier, supplier_ref: (fd.supplier_ref || "").trim() || null, updated_at: new Date().toISOString() });
      if (r2.error) alert("المنتج اتحفظ بس التكلفة لأ: " + r2.error.message);
      for (const [cc, k, price] of [["EG", "offer_eg", row.price], ["SA", "offer_sa", row.price_sa]]) {
        const v = n(k);
        if (v && price) await sb.from("product_offers").upsert({ product_id: pid, country: cc, qty: 2, total: v });
        else await sb.from("product_offers").delete().eq("product_id", pid).eq("country", cc).eq("qty", 2);
      }
      await loadAll(); toast(isNew ? "المنتج اتضاف (مخفي لحد ما تظهره) ✓" : "اتحفظ ✓ — الموقع اتحدث");
      ov.remove(); document.body.style.overflow = ""; route();
    };
  }

  // ================= الأقسام =================
  function vCats() {
    const cnt = id => D.products.filter(p => p.category_id === id && !p.is_addon).length;
    $("#view").innerHTML = `<h1 class="sec">الأقسام <span class="sp"></span><button class="btn-s pri" id="newc">＋ قسم جديد</button></h1>
      <p class="meta" style="margin:0 0 12px">الأقسام بتظهر في الصفحة الرئيسية للموقع كفلتر. القسم اللي مفيهوش منتجات ظاهرة مش بيبان.</p>
      <div class="card scroll"><table class="t"><thead><tr><th>الأيقونة</th><th>الاسم</th><th>الترتيب</th><th>منتجات</th><th>ظاهر</th><th></th></tr></thead><tbody>
      ${D.cats.map(c => `<tr data-id="${esc(c.id)}"><td><input class="ci" value="${esc(c.icon || "")}" style="width:56px;font:inherit;font-size:18px;text-align:center;border:1.5px solid var(--line);border-radius:8px;padding:4px"></td>
        <td><input class="cn" value="${esc(c.name)}" style="font:inherit;border:1.5px solid var(--line);border-radius:8px;padding:6px 8px;width:100%;min-width:140px"></td>
        <td><input class="cs" type="number" value="${c.sort}" style="width:70px;font:inherit;border:1.5px solid var(--line);border-radius:8px;padding:6px"></td>
        <td>${cnt(c.id)}</td><td><span class="switch"><input type="checkbox" class="ca" ${c.active ? "checked" : ""}><span></span></span></td>
        <td class="acts"><button class="csave">حفظ</button><button class="cdel">مسح</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty">مفيش أقسام.</td></tr>`}</tbody></table></div>`;
    $("#newc").onclick = async () => {
      const name = prompt("اسم القسم الجديد؟"); if (!name || !name.trim()) return;
      const icon = prompt("أيقونة (إيموجي) — اختياري", "🛍️") || "";
      const id = "c-" + Date.now().toString(36);
      const { error } = await sb.from("categories").insert({ id, name: name.trim(), icon, sort: Math.max(0, ...D.cats.map(c => c.sort)) + 10 });
      if (error) { alert(error.message); return; } await loadAll(); route(); toast("القسم اتضاف ✓");
    };
    $$("tr[data-id]").forEach(tr => {
      const id = tr.dataset.id;
      $(".csave", tr).onclick = async () => {
        const { error } = await sb.from("categories").update({ name: $(".cn", tr).value.trim(), icon: $(".ci", tr).value.trim(), sort: +$(".cs", tr).value || 0, active: $(".ca", tr).checked }).eq("id", id);
        if (error) { alert(error.message); return; } await loadAll(); route(); toast("اتحفظ ✓");
      };
      $(".ca", tr).onchange = () => $(".csave", tr).click();
      $(".cdel", tr).onclick = async () => {
        if (cnt(id)) { alert("القسم ده فيه منتجات — انقلهم لقسم تاني الأول، أو اقفله بدل ما تمسحه."); return; }
        if (!confirm("تمسح القسم ده؟")) return;
        const { error } = await sb.from("categories").delete().eq("id", id); if (error) { alert(error.message); return; } await loadAll(); route();
      };
    });
  }

  // ================= الأرباح =================
  function vProfit() {
    const V = ordersInView(), sinceD = new Date(since() - 864e5);
    const curs = F.cc ? [CC_CUR[F.cc]] : ["EGP", "SAR"].filter(c => V.some(o => o.currency === c) || D.spend.some(s => s.currency === c));
    const spendIn = D.spend.filter(s => inCC(s) && new Date(s.day) >= sinceD);
    const block = cur => {
      const L = V.filter(o => o.currency === cur), del = L.filter(o => o.status === "delivered"), ret = L.filter(o => o.status === "returned");
      let rev = 0, cogs = 0, ship = 0, rets = 0, miss = 0;
      del.forEach(o => { const c = costsOf(o); rev += o.total; ship += c.ship || 0; if (c.unit == null) miss++; else cogs += c.unit * o.qty; });
      ret.forEach(o => { const c = costsOf(o); rets += c.ret || c.ship || 0; });
      const ads = spendIn.filter(s => s.currency === cur).reduce((a, s) => a + +s.amount, 0);
      const net = rev - cogs - ship - rets - ads;
      const pipe = L.filter(o => ["new", "confirmed", "shipped"].includes(o.status)).reduce((a, o) => a + (expectedOf(o) || 0), 0);
      return `<div class="card"><h3>${cur === "SAR" ? "🇸🇦 السعودية" : "🇪🇬 مصر"} <span class="meta">(${money(0, cur).split(" ")[1]})</span></h3>
        <div class="kpis">
          <div class="kpi"><small>مبيعات اتسلمت (${del.length})</small><b>${money(rev, cur)}</b></div>
          <div class="kpi"><small>تكلفة البضاعة</small><b>${money(cogs, cur)}</b>${miss ? `<div class="sub flag">⚠ ${miss} طلب من غير تكلفة</div>` : ""}</div>
          <div class="kpi"><small>الشحن</small><b>${money(ship, cur)}</b></div>
          <div class="kpi"><small>المرتجعات (${ret.length})</small><b>${money(rets, cur)}</b></div>
          <div class="kpi"><small>الإعلانات</small><b>${money(ads, cur)}</b></div>
          <div class="kpi"><small>صافي الربح</small><b class="${net < 0 ? "neg" : "pos"}">${money(net, cur)}</b></div>
          <div class="kpi"><small>ربح متوقع من الطلبات المفتوحة</small><b>${money(pipe, cur)}</b><div class="sub">لو كلها اتسلمت</div></div>
        </div>
        ${barChart(daily(del, Math.min(Math.max(F.days, 7), 30), o => profitOf(o) || 0).map(p => Object.assign(p, { v: Math.max(0, p.v) })), cur)}
        <div class="meta" style="margin-top:4px">ربح الطلبات المتسلمة يوم بيوم (حسب يوم الطلب، قبل الإعلانات)</div></div>`;
    };
    const byProd = {};
    V.forEach(o => { const k = o.product_id + "|" + o.currency; const r = byProd[k] || (byProd[k] = { name: o.product_name, cur: o.currency, n: 0, d: 0, r: 0, rev: 0, profit: 0, miss: 0 });
      if (o.status !== "cancelled") r.n++; if (o.status === "delivered") { r.d++; r.rev += o.total; } if (o.status === "returned") r.r++;
      const p = profitOf(o); if (p == null) r.miss++; else r.profit += p; });
    const camp = s => s.campaign || "";
    const adsByProd = {}; spendIn.forEach(s => { const k = camp(s) + "|" + s.currency; adsByProd[k] = (adsByProd[k] || 0) + +s.amount; });
    $("#view").innerHTML = `<h1 class="sec">الأرباح <span class="sp"></span><button class="btn-s pri" id="addsp">＋ سجّل مصاريف إعلان</button></h1>${filtersHTML()}
      <p class="meta" style="margin:0 0 12px">الربح = مبلغ الطلب المتسلم − سعر التكلفة × الكمية − الشحن − تكلفة المرتجعات − الإعلانات. الملغي والطلبات المفتوحة مش داخلين. التكلفة بتتحط من صفحة المنتجات.</p>
      ${curs.map(block).join("") || `<div class="card"><div class="meta">مفيش بيانات في الفترة دي.</div></div>`}
      <div class="card scroll"><h3>حسب المنتج</h3><table class="t"><thead><tr><th>المنتج</th><th>طلبات</th><th>اتسلم</th><th>مرتجع</th><th>التسليم</th><th>مبيعات</th><th>ربح قبل الإعلان</th><th>إعلانات</th><th>الصافي</th></tr></thead><tbody>
      ${Object.entries(byProd).sort((a, b) => b[1].profit - a[1].profit).map(([k, r]) => { const ads = adsByProd[k.split("|")[0] + "|" + r.cur] || 0, net = r.profit - ads;
        return `<tr><td>${esc(r.name)}${r.miss ? ` <span class="flag">⚠</span>` : ""}</td><td>${r.n}</td><td>${r.d}</td><td>${r.r}</td><td>${rateCell(r.d, r.r)}</td><td>${money(r.rev, r.cur)}</td><td>${money(r.profit, r.cur)}</td><td>${money(ads, r.cur)}</td><td class="${net < 0 ? "neg" : "pos"}">${money(net, r.cur)}</td></tr>`; }).join("") || `<tr><td colspan="9" class="empty">مفيش طلبات.</td></tr>`}
      </tbody></table></div>
      ${spendTable(spendIn)}`;
    $("#addsp").onclick = addSpend; bindSpend();
  }
  function spendTable(list) {
    return `<div class="card scroll"><h3>مصاريف الإعلانات المسجلة <span class="sp"></span><button class="btn-s" id="addsp2">＋ سجّل</button></h3><table class="t"><thead><tr><th>اليوم</th><th>المنصة</th><th>الحملة / المنتج</th><th>الدولة</th><th>المبلغ</th><th>سجّلها</th><th></th></tr></thead><tbody>
      ${list.map(s => `<tr><td>${esc(s.day)}</td><td>${PLAT[s.platform] || s.platform}</td><td>${esc(s.campaign ? prodName(s.campaign) : "—")}</td><td>${s.country === "SA" ? "🇸🇦" : "🇪🇬"}</td><td>${money(s.amount, s.currency)}</td><td class="meta">${esc(nameOf(s.created_by))}</td><td><button class="btn-s danger" data-dsp="${s.id}">مسح</button></td></tr>`).join("") || `<tr><td colspan="7" class="meta">لسه مفيش مصاريف متسجلة. سجّل اللي صرفته كل يوم أو كل أسبوع عشان الربح يطلع صح.</td></tr>`}
      </tbody></table></div>`;
  }
  function bindSpend() {
    const b2 = $("#addsp2"); if (b2) b2.onclick = addSpend;
    $$("[data-dsp]").forEach(b => b.onclick = async () => { if (!confirm("تمسح المصروف ده؟")) return; await sb.from("ad_spend").delete().eq("id", +b.dataset.dsp); D.spend = D.spend.filter(s => s.id !== +b.dataset.dsp); route(); });
  }
  function addSpend() {
    const ov = drawer("سجّل مصاريف إعلان", `<form class="card" id="spf"><div class="fgrid">
      ${field("day", "اليوم", new Date().toISOString().slice(0, 10), "date")}
      <div class="f"><label>المنصة</label><select name="platform">${Object.entries(PLAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="f"><label>الدولة</label><select name="country"><option value="EG">🇪🇬 مصر (جنيه)</option><option value="SA">🇸🇦 السعودية (ريال)</option></select></div>
      <div class="f"><label>المنتج / الحملة</label><select name="campaign"><option value="">عام (كل المنتجات)</option>${D.products.filter(p => !p.is_addon && p.active).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select><div class="hint">لازم يطابق utm_campaign في لينك الإعلان (إحنا بنحط فيه كود المنتج)</div></div>
      ${field("amount", "المبلغ اللي اتصرف", "", "number")}${field("note", "ملاحظة", "")}
      </div><button class="btn-s pri" style="margin-top:12px">حفظ</button></form>`);
    $("#spf", ov).onsubmit = async e => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target).entries());
      if (!(+fd.amount > 0)) { alert("اكتب المبلغ"); return; }
      const row = { day: fd.day, platform: fd.platform, country: fd.country, currency: CC_CUR[fd.country], campaign: fd.campaign || null, amount: +fd.amount, note: fd.note || null };
      const { data, error } = await sb.from("ad_spend").insert(row).select().single(); if (error) { alert(error.message); return; }
      D.spend.unshift(data); toast("اتسجل ✓"); ov.remove(); document.body.style.overflow = ""; route();
    };
  }

  // ================= الإعلانات =================
  function vAds() {
    const V = ordersInView(), sinceD = new Date(since() - 864e5), spendIn = D.spend.filter(s => inCC(s) && new Date(s.day) >= sinceD);
    const g = {};
    const key = (plat, camp, cur) => plat + "|" + camp + "|" + cur;
    V.forEach(o => { const s = srcParts(o.source), k = key(platGroup(s.src), s.camp, o.currency);
      const r = g[k] || (g[k] = { plat: platGroup(s.src), camp: s.camp, cur: o.currency, n: 0, x: 0, d: 0, r: 0, rev: 0, profit: 0, spend: 0 });
      if (o.status === "cancelled") r.x++; else r.n++; if (o.status === "delivered") { r.d++; r.rev += o.total; } if (o.status === "returned") r.r++; r.profit += profitOf(o) || 0; });
    spendIn.forEach(s => { const k = key(platGroup(s.platform), s.campaign || "", s.currency); const r = g[k] || (g[k] = { plat: platGroup(s.platform), camp: s.campaign || "", cur: s.currency, n: 0, x: 0, d: 0, r: 0, rev: 0, profit: 0, spend: 0 }); r.spend += +s.amount; });
    const rows = Object.values(g).sort((a, b) => b.n - a.n);
    $("#view").innerHTML = `<h1 class="sec">أداء الإعلانات <span class="sp"></span><button class="btn-s pri" id="addsp">＋ سجّل مصاريف</button></h1>${filtersHTML()}
      <p class="meta" style="margin:0 0 12px">كل طلب بيتسجل معاه مصدره من لينك الإعلان (utm_source = المنصة، utm_campaign = كود المنتج). سجّل المصاريف عشان تعرف الأوردر كلّفك كام وكل حملة كسبت ولا خسرت. فيسبوك وإنستجرام محسوبين مع بعض (Meta).</p>
      <div class="card scroll"><table class="t"><thead><tr><th>المنصة</th><th>الحملة / المنتج</th><th>طلبات</th><th>ملغي</th><th>اتسلم</th><th>مرتجع</th><th>التسليم</th><th>المصاريف</th><th>تكلفة الطلب</th><th>تكلفة المتسلم</th><th>الربح بعد الإعلان</th></tr></thead><tbody>
      ${rows.map(r => { const net = r.profit - r.spend; return `<tr><td>${esc(r.plat === "facebook" ? "Meta (فيسبوك/إنستجرام)" : srcLabel(r.plat))}</td><td>${esc(r.camp ? prodName(r.camp) : "—")}</td><td>${r.n}</td><td>${r.x}</td><td>${r.d}</td><td>${r.r}</td><td>${rateCell(r.d, r.r)}</td><td>${money(r.spend, r.cur)}</td><td>${r.n && r.spend ? money(r.spend / r.n, r.cur) : "—"}</td><td>${r.d && r.spend ? money(r.spend / r.d, r.cur) : "—"}</td><td class="${net < 0 ? "neg" : "pos"}">${money(net, r.cur)}</td></tr>`; }).join("") || `<tr><td colspan="11" class="empty">لسه مفيش طلبات جاية من إعلانات.</td></tr>`}
      </tbody></table></div>
      ${spendTable(spendIn)}`;
    $("#addsp").onclick = addSpend; bindSpend();
  }

  // ================= الإعدادات =================
  function vSettings() {
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    $("#view").innerHTML = `<h1 class="sec">الإعدادات</h1>
      <div class="card"><h3>📱 لوحة التحكم كتطبيق على الموبايل</h3>${standalone ? `<p>✅ إنت فاتحها كتطبيق دلوقتي.</p>` : `
        <p><b>أندرويد (Chrome):</b> افتح اللينك ده في Chrome ← النقط التلاتة ⋮ ← <b>Add to Home screen / تثبيت التطبيق</b>.</p>
        <p><b>آيفون (Safari):</b> افتح اللينك في Safari ← زرار المشاركة ⬆ ← <b>Add to Home Screen</b>.</p>
        <p class="meta">لو كنت نزّلتها قبل كده وبتفتح الموقع بتاع العملاء، امسح الأيقونة القديمة ونزّلها تاني من هنا.</p>`}</div>
      <div class="card"><h3>🔒 القفل بالبصمة / Face ID</h3>
        <p class="meta">لما يتفعّل، اللوحة بتطلب بصمتك أو وشك كل ما تفتحها، أو لو سبتها أكتر من 5 دقايق. ده على الجهاز ده بس — كل جهاز بيتفعّل لوحده. لو البصمة مشتغلتش تقدر تدخل بكلمة السر.</p>
        <div class="acts">${lockEnabled() ? `<span class="pill me">✓ متفعّل على الجهاز ده</span><button id="lockoff">إلغاء القفل</button><button id="locktest">جرّب القفل</button>` : `<button class="btn-s pri" id="lockon">فعّل القفل بالبصمة</button>`}</div></div>
      <div class="card"><h3>🔔 الإشعارات</h3>
        <p><b>على الموبايل حتى لو مقفول (ntfy):</b> نزّل تطبيق <b>ntfy</b> ← اضغط ＋ ← اكتب <code dir="ltr">ops-orders-dbffa8f9f448adc5</code> ← Subscribe. أي طلب جديد هيوصلك فيه المنتج والمبلغ والمحافظة.</p>
        <p><b>جوه اللوحة:</b> ${notifOn() ? "✅ شغالة — صوت وإشعار مع كل طلب جديد طول ما اللوحة مفتوحة." : `<button class="btn-s" id="belln">فعّل الصوت والإشعار</button>`}</p></div>
      <div class="card"><h3>👥 الأدمن</h3><table class="t"><thead><tr><th>الاسم</th><th>الإيميل</th><th>ماسك دلوقتي</th></tr></thead><tbody>
        ${D.admins.map(a => `<tr><td><b>${esc(a.name || "—")}</b>${a.email.toLowerCase() === D.me ? ` <span class="pill me">إنت</span>` : ""}</td><td dir="ltr">${esc(a.email)}</td><td>${D.orders.filter(o => (o.assigned_to || "").toLowerCase() === a.email.toLowerCase() && ["new", "confirmed", "shipped"].includes(o.status)).length} طلب مفتوح</td></tr>`).join("")}
      </tbody></table><p class="meta">إضافة أدمن جديد بتتعمل من Supabase (جدول admins + دعوة من Authentication).</p></div>
      <div class="card"><h3>🔗 لينكات</h3><div class="acts"><a class="btn-s" href="./" target="_blank">🛍️ الموقع</a><a class="btn-s" href="https://supabase.com/dashboard/project/nxrnfjwatgpcavesoyhs" target="_blank" rel="noopener">🗄️ Supabase</a><a class="btn-s" href="https://taager.com" target="_blank" rel="noopener">📦 تاجر</a></div></div>`;
    const on = $("#lockon"), off = $("#lockoff"), tst = $("#locktest"), bn = $("#belln");
    if (on) on.onclick = async () => { if (await enableLock()) route(); };
    if (off) off.onclick = () => { ls.set("ops_lock_id", null); toast("القفل اتلغى"); route(); };
    if (tst) tst.onclick = () => { sessionStorage.removeItem("unlocked"); showLock(); };
    if (bn) bn.onclick = () => { $("#bell").click(); setTimeout(route, 800); };
  }

  boot();
})();
