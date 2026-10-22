(function () {
  const S = window.STORE;
  const $ = (q, el = document) => el.querySelector(q);

  const SA_REGIONS = ["الرياض","مكة المكرمة","المدينة المنورة","المنطقة الشرقية","القصيم","عسير","تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف"];
  const GOVS = ["القاهرة","الجيزة","الإسكندرية","القليوبية","الشرقية","الدقهلية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء"];

  // رسومات المنتجات لحد ما الصور الحقيقية تجهز
  const ICONS = {
    monocular: `<svg viewBox="0 0 240 240" aria-hidden="true"><defs>
      <linearGradient id="mb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A524E"/><stop offset=".45" stop-color="#1E2522"/><stop offset="1" stop-color="#2C3430"/></linearGradient>
      <linearGradient id="mr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F08A4B"/><stop offset="1" stop-color="#B8440F"/></linearGradient>
      <radialGradient id="mg" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#E4F1F3"/><stop offset=".5" stop-color="#5D8C93"/><stop offset="1" stop-color="#173238"/></radialGradient></defs>
      <g transform="rotate(-14 120 112)">
        <rect x="46" y="88" width="120" height="50" rx="20" fill="url(#mb)"/>
        <g stroke="#5B645F" stroke-width="2.4"><path d="M78 90v46M86 90v46M94 90v46M102 90v46M110 90v46"/></g>
        <rect x="160" y="78" width="36" height="70" rx="16" fill="url(#mb)"/>
        <rect x="156" y="80" width="8" height="66" rx="3" fill="url(#mr)"/>
        <ellipse cx="194" cy="113" rx="12" ry="31" fill="url(#mg)"/>
        <ellipse cx="190" cy="102" rx="3" ry="8" fill="#fff" opacity=".75"/>
        <rect x="26" y="98" width="26" height="30" rx="10" fill="#2C3430"/>
        <rect x="47" y="95" width="6" height="36" rx="3" fill="url(#mr)"/>
      </g>
      <path d="M112 144v34M112 178l-26 18M112 178l26 18M112 178v20" stroke="#D7DCD6" stroke-width="5" stroke-linecap="round" fill="none"/>
    </svg>`,
    endoscope: `<svg viewBox="0 0 240 240" aria-hidden="true"><defs>
      <linearGradient id="ep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A524E"/><stop offset="1" stop-color="#1E2522"/></linearGradient>
      <linearGradient id="es" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6E9FA6"/><stop offset="1" stop-color="#173238"/></linearGradient></defs>
      <rect x="40" y="36" width="76" height="148" rx="16" fill="url(#ep)"/>
      <rect x="47" y="48" width="62" height="120" rx="8" fill="url(#es)"/>
      <circle cx="78" cy="108" r="24" fill="none" stroke="#E4F1F3" stroke-width="2" opacity=".75"/>
      <path d="M78 95v26M65 108h26" stroke="#E4F1F3" stroke-width="2" opacity=".75"/>
      <rect x="70" y="175" width="16" height="4" rx="2" fill="#8A938E"/>
      <path d="M78 184c0 14 10 18 26 18 30 0 40-26 66-26 22 0 30 14 22 30" fill="none" stroke="#F08A4B" stroke-width="6" stroke-linecap="round"/>
      <path d="M140 30c-10 22 10 34 30 40s34 22 20 44" fill="none" stroke="#F08A4B" stroke-width="6" stroke-linecap="round"/>
      <rect x="180" y="110" width="20" height="30" rx="6" fill="#1E2522" transform="rotate(12 190 125)"/>
      <circle cx="192" cy="142" r="6" fill="#FFF1D6"/><circle cx="192" cy="142" r="12" fill="#FFF1D6" opacity=".3"/>
    </svg>`
  };
  const SVG = {
    cash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
    truck: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9.5h4l3 3.5V16h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
    swap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18.5l1.2-3.6A7.5 7.5 0 1 1 8.6 18z"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
  };
  const TAG = (cls = "") => `<span class="tag ${cls}" aria-hidden="true"><b>OPS'S</b><i>STORE</i></span>`;
  const perks = () => `<span>${SVG.cash}الدفع عند الاستلام</span><span>${SVG.truck}${CC === "SA" ? "شحن مجاني لكل المناطق" : "شحن مجاني لكل المحافظات"}</span><span>${SVG.swap}استبدال خلال 14 يوم</span>`;

  // ---------- الدولة ----------
  const CC = (() => {
    let c = null;
    try { c = (new URLSearchParams(location.search).get("c") || "").toUpperCase(); } catch (e) {}
    if (!S.countries[c]) { try { c = sessionStorage.getItem("cc"); } catch (e) {} }
    if (!S.countries[c]) c = S.defaultCountry;
    try { sessionStorage.setItem("cc", c); } catch (e) {}
    return c;
  })();
  const C = S.countries[CC];
  const priceOf = p => CC === "SA" ? p.priceSA : p.price;
  const available = p => !!priceOf(p);
  const money = n => Number(n).toLocaleString("ar-EG") + " " + C.currency;
  const waLink = (text, number = S.whatsapp) => "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
  const product = id => S.products.find(p => p.id === id);
  const media = (p, cls = "") => p.images && p.images.length
    ? `<img src="${p.images[0]}" alt="${p.name}" class="${cls}" loading="lazy">`
    : (ICONS[p.icon] || "");
  const chips = p => (p.specs || []).map(x => `<span class="chip">${x}</span>`).join("");
  // تقدير مدة التوصيل حسب المحافظة/المنطقة (من config.js)
  const etaFor = region => {
    const e = (S.eta || {})[CC]; if (!e) return S.deliveryDays;
    return (e.fast || []).includes(region) ? e.fastText : e.text;
  };

  // ---------- مصدر الزيارة (للإعلانات) ----------
  try {
    const u = new URLSearchParams(location.search);
    const src = ["utm_source","utm_campaign","utm_content"].map(k => u.get(k)).filter(Boolean).join("|");
    if (src) sessionStorage.setItem("src", src);
  } catch (e) {}
  const source = () => { try { return sessionStorage.getItem("src") || document.referrer.split("/")[2] || "direct"; } catch (e) { return "direct"; } };

  // ---------- Pixels ----------
  function initPixels() {
    if (S.metaPixelId) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', S.metaPixelId); fbq('track', 'PageView');
    }
    if (S.tiktokPixelId) {
      !function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(S.tiktokPixelId);ttq.page();}(window, document, 'ttq');
    }
  }
  const track = (ev, data) => {
    try { if (window.fbq) fbq('track', ev, data); } catch (e) {}
    try { if (window.ttq) ttq.track(ev === "Purchase" ? "CompletePayment" : ev, data); } catch (e) {}
  };

  // ---------- Header / footer ----------
  function chrome() {
    document.title = document.title.replace("{store}", S.name);
    const top = document.createElement("div");
    top.className = "topbar"; top.textContent = C.shippingNote;
    const h = document.createElement("header"); h.className = "site";
    h.innerHTML = `<div class="wrap"><a class="logo" href="index.html" aria-label="${S.name}">${TAG()}<span class="ar">${S.nameAr || ""}</span></a>
      <nav class="nav" aria-label="أقسام الموقع"><a href="index.html#products">المنتجات</a><a href="index.html#how">إزاي بتطلب</a><a href="index.html#faq">أسئلة</a></nav>
      <span class="hdr-r">${Object.keys(S.countries).length > 1 ? `<select id="ccsel" aria-label="الدولة">${Object.entries(S.countries).map(([k, v]) => `<option value="${k}" ${k === CC ? "selected" : ""}>${v.flag} ${v.name}</option>`).join("")}</select>` : ""}
      <a class="wa-link" href="${waLink("السلام عليكم، عندي سؤال")}" target="_blank" rel="noopener">${SVG.chat}<span>واتساب</span></a></span></div>`;
    document.body.prepend(h); document.body.prepend(top);
    const sel = document.getElementById("ccsel");
    if (sel) sel.onchange = () => { const u = new URL(location.href); u.searchParams.set("c", sel.value.toLowerCase()); location.href = u.toString(); };
    const f = document.createElement("footer"); f.className = "site";
    f.innerHTML = `<div class="wrap">
      <div>${TAG("on-dark")}<p style="margin-top:12px;max-width:36ch">${S.tagline}</p></div>
      <div><h4>الطلب والتوصيل</h4><p>التوصيل ${S.deliveryDays}</p><p>الدفع عند الاستلام</p><p>${S.returnPolicy}</p></div>
      <div><h4>كلمنا</h4><p><a href="${waLink("السلام عليكم")}" target="_blank" rel="noopener">واتساب</a></p><p>${S.founders || ""}</p></div>
      <div class="base"><span>© ${new Date().getFullYear()} ${S.name}</span><span>${C.flag} ${C.name}</span></div></div>`;
    document.body.append(f);
  }

  // ---------- Home ----------
  function renderHome() {
    $("#store-tagline").textContent = S.tagline;
    $("#assure").innerHTML = perks() + `<span>${SVG.chat}بنرد على واتساب</span>`;
    $("#faq-days").textContent = "عادةً " + S.deliveryDays + " من تأكيد الطلب.";
    $("#faq-return").textContent = S.returnPolicy;
    const list = S.products.filter(available);
    $("#hero-lens").innerHTML = (list.length ? media(list[0]) : ICONS.monocular) + (list.length && list[0].specs ? `<span class="spec">${list[0].specs[0]}</span>` : "");
    if (!list.length) { $("#products").innerHTML = `<p style="color:var(--muted);text-align:center">المنتجات هتنزل في ${C.name} قريب.</p>`; return; }
    $("#products").innerHTML = list.map(p => `
      <a class="pcard" href="product.html?p=${p.id}">
        <div class="mat">${media(p)}</div>
        <div class="body">
          <h3>${p.name}</h3><div class="sub">${p.subtitle}</div>
          <div class="chips">${chips(p)}</div>
          <div class="buy"><span class="price">${money(priceOf(p))}${p.oldPrice && CC === "EG" ? `<s>${money(p.oldPrice)}</s>` : ""}</span><span class="btn btn-primary">اطلب دلوقتي</span></div>
        </div>
      </a>`).join("");
  }

  // ---------- Product ----------
  function renderProduct() {
    const id = new URLSearchParams(location.search).get("p");
    const p = product(id) || S.products[0];
    document.title = p.name + " | " + S.name;
    $("#crumb").textContent = p.name;
    if (!available(p)) {
      $("#pp").innerHTML = `<div class="panel" style="grid-column:1/-1;text-align:center"><h1>${p.name}</h1><p>المنتج ده مش متاح في ${C.name} دلوقتي.</p><a class="btn btn-primary" href="index.html">شوف باقي المنتجات</a></div>`;
      $("#order").remove(); $("#buybar").remove(); return;
    }
    const imgs = p.images || [];
    $("#pp").innerHTML = `
      <div class="gallery">
        <div class="mat" id="mainimg">${media(p)}</div>
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, i) => `<img src="${s}" data-i="${i}" class="${i ? "" : "on"}" alt="">`).join("")}</div>` : ""}
      </div>
      <div class="pinfo">
        <h1>${p.name}</h1><div class="sub">${p.subtitle}</div>
        <div class="chips">${chips(p)}</div>
        <div class="pricebox"><span class="price">${money(priceOf(p))}${p.oldPrice && CC === "EG" ? `<s>${money(p.oldPrice)}</s>` : ""}</span><span class="cod-note">${SVG.cash} تدفع لما تستلم • شحن مجاني</span></div>
        <ul class="bullets">${p.bullets.map(b => `<li>${b}</li>`).join("")}</ul>
        ${p.honest ? `<div class="honest">${p.honest}</div>` : ""}
        <a href="#order" class="btn btn-primary btn-full">اطلب دلوقتي</a>
        <div class="perks">${perks()}</div>
      </div>`;
    $("#extra").innerHTML = `
      <div class="duo">
        <div class="panel"><h2>في العلبة</h2><ul class="inbox">${p.inBox.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <div class="panel faq"><h2>أسئلة عن المنتج</h2>${p.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
      </div>`;
    document.querySelectorAll(".thumbs img").forEach(t => t.onclick = () => {
      document.querySelectorAll(".thumbs img").forEach(x => x.classList.remove("on")); t.classList.add("on");
      $("#mainimg").innerHTML = `<img src="${t.src}" alt="">`;
    });
    setupForm(p);
    const bar = $("#buybar");
    bar.querySelector(".bb-price").textContent = money(priceOf(p));
    const io = new IntersectionObserver(([e]) => bar.classList.toggle("on", !e.isIntersecting && window.scrollY > 300));
    io.observe($("#order"));
    window.addEventListener("scroll", () => { if (window.scrollY < 300) bar.classList.remove("on"); }, { passive: true });
    document.body.classList.add("has-buybar");
    track("ViewContent", { content_ids: [p.id], content_name: p.name, value: priceOf(p), currency: CC === "SA" ? "SAR" : "EGP" });
  }

  // ---------- Order form ----------
  function setupForm(p) {
    const f = $("#orderform");
    const price = priceOf(p), cur = CC === "SA" ? "SAR" : "EGP";
    $("#gov").innerHTML = `<option value="">اختار ${C.regionLabel}</option>` + (CC === "SA" ? SA_REGIONS : GOVS).map(g => `<option>${g}</option>`).join("");
    document.querySelector("label[for=gov]").textContent = C.regionLabel;
    f.elements.phone.placeholder = C.phoneHint;
    let qty = 1, withAddon = false;
    const offers = (p.offers && p.offers[CC]) || {};
    const totalFor = q => offers[q] || price * q;
    const opts = [1, ...Object.keys(offers).map(Number).filter(q => q > 1).sort((a, b) => a - b)];
    if (opts.length === 1) opts.push(2);
    $("#offers").innerHTML = opts.map(q => {
      const t = totalFor(q), save = price * q - t;
      return `<label class="offer"><input type="radio" name="qtyopt" value="${q}" ${q === 1 ? "checked" : ""}>
        <span class="o-q">${q === 1 ? "قطعة واحدة" : q === 2 ? "قطعتين" : q + " قطع"}</span>
        <span class="o-p">${money(t)}${save > 0 ? `<em>وفّر ${money(save)}</em>` : ""}</span></label>`;
    }).join("");
    const a = p.addon, aPrice = a ? (CC === "SA" ? a.priceSA : a.price) : null;
    if (a && aPrice) { $("#bump").hidden = false; $("#bumptxt").innerHTML = `ضيف <b>${a.name}</b> لنفس الشحنة بـ ${money(aPrice)} بس`; }
    const total = () => totalFor(qty) + (withAddon ? aPrice : 0);
    const upd = () => { $("#total").textContent = money(total()); };
    document.querySelectorAll("input[name=qtyopt]").forEach(r => r.onchange = () => { qty = +r.value; upd(); });
    if ($("#bumpcb")) $("#bumpcb").onchange = e => { withAddon = e.target.checked; upd(); };
    upd();
    const etaBox = $("#eta");
    const showEta = () => { if (etaBox) etaBox.innerHTML = `${SVG.clock}<span>التوصيل المتوقع: <b>${etaFor(f.elements.gov.value)}</b> من تأكيد الطلب</span>`; };
    f.elements.gov.addEventListener("change", showEta); showEta();
    // حفظ الرقم لو العميل كتبه ومكمّلش
    let leadSent = "";
    f.elements.phone.addEventListener("blur", () => {
      const ph = normPhone(f.elements.phone.value);
      if (!S.supabaseUrl || ph === leadSent || !(CC === "SA" ? /^05[0-9]{8}$/ : /^01[0125][0-9]{8}$/).test(ph)) return;
      leadSent = ph;
      fetch(S.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/save_lead", { method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: S.supabaseAnonKey, Authorization: "Bearer " + S.supabaseAnonKey },
        body: JSON.stringify({ p_phone: ph, p_name: f.elements.name.value, p_product_id: p.id, p_country: CC, p_source: source() }) }).catch(() => {});
    });

    const rules = {
      name: v => v.trim().length >= 3 || "اكتب اسمك بالكامل",
      phone: v => (CC === "SA" ? /^05[0-9]{8}$/ : /^01[0125][0-9]{8}$/).test(normPhone(v)) || (CC === "SA" ? "رقم جوال سعودي صحيح (10 أرقام يبدأ بـ 05)" : "رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)"),
      gov: v => !!v || "اختار " + C.regionLabel,
      city: v => v.trim().length >= 2 || "اكتب المدينة أو المنطقة",
      address: v => v.trim().length >= 5 || "اكتب العنوان بالتفصيل"
    };
    const check = name => {
      const el = f.elements[name], wrap = el.closest(".field"), r = rules[name](el.value);
      wrap.classList.toggle("bad", r !== true); if (r !== true) wrap.querySelector(".err").textContent = r;
      return r === true;
    };
    Object.keys(rules).forEach(n => f.elements[n].addEventListener("blur", () => check(n)));
    let started = false;
    f.addEventListener("input", () => { if (!started) { started = true; track("InitiateCheckout", { content_ids: [p.id], value: price, currency: cur }); } });

    f.onsubmit = async e => {
      e.preventDefault();
      const msg = $("#formmsg"); msg.className = "formmsg";
      if (f.elements.website.value) return;                       // honeypot
      const ok = Object.keys(rules).map(check).every(Boolean);
      if (!ok) { f.querySelector(".bad input, .bad select")?.focus(); return; }
      const data = {
        p_product_id: p.id, p_qty: qty,
        p_name: f.elements.name.value, p_phone: normPhone(f.elements.phone.value),
        p_governorate: f.elements.gov.value, p_city: f.elements.city.value,
        p_address: f.elements.address.value, p_notes: f.elements.notes.value, p_source: source(), p_country: CC,
        p_landmark: f.elements.landmark.value, p_addon: withAddon ? a.id : null
      };
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "جاري تسجيل الطلب…";
      try {
        let orderNo;
        if (S.supabaseUrl && S.supabaseAnonKey) {
          const res = await fetch(S.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/place_order", {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: S.supabaseAnonKey, Authorization: "Bearer " + S.supabaseAnonKey },
            body: JSON.stringify(data)
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error((body && body.message) || "SERVER");
          orderNo = body;
        } else {
          // وضع التجربة: من غير قاعدة بيانات — الطلب يتبعت واتساب
          orderNo = "WA-" + Date.now().toString().slice(-6);
          window.open(waLink(`طلب جديد ${orderNo}\n${p.name} × ${qty}${withAddon ? " + " + a.name : ""} = ${total()} ${C.currency}\nالاسم: ${data.p_name}\nالموبايل: ${data.p_phone}\nالعنوان: ${data.p_governorate} - ${data.p_city} - ${data.p_address}${data.p_landmark ? " (" + data.p_landmark + ")" : ""}\nملاحظات: ${data.p_notes || "-"}`), "_blank");
        }
        track("Purchase", { content_ids: [p.id], value: total(), currency: cur });
        try { sessionStorage.setItem("lastOrder", JSON.stringify({ no: orderNo, name: p.name + " × " + qty + (withAddon ? " + " + a.name : ""), qty, total: total(), cname: data.p_name })); } catch (e) {}
        location.href = "thanks.html?o=" + encodeURIComponent(orderNo);
      } catch (err) {
        const map = { BAD_PHONE: "رقم الموبايل مش صحيح.", BAD_COUNTRY: "حصلت مشكلة في اختيار الدولة. حدّث الصفحة.", TOO_MANY_ORDERS: "اتسجلت طلبات كتير من الرقم ده. كلمنا واتساب وهنكمّل معاك.", PRODUCT_UNAVAILABLE: "المنتج مش متاح دلوقتي.", MISSING_FIELDS: "كمّل كل البيانات من فضلك." };
        msg.textContent = map[err.message] || "حصلت مشكلة في تسجيل الطلب. جرب تاني أو اطلب على واتساب.";
        msg.classList.add("show", "error");
        btn.disabled = false; btn.textContent = "تأكيد الطلب";
      }
    };
  }
  function normPhone(v) {
    let d = String(v || "").replace(/[٠-٩]/g, c => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/\D/g, "");
    if (CC === "SA") {
      if (d.startsWith("966") && d.length === 12) d = "0" + d.slice(3);
      if (d.length === 9 && d.startsWith("5")) d = "0" + d;
      return d;
    }
    if (d.startsWith("20") && d.length === 12) d = "0" + d.slice(2);
    if (d.length === 10 && d.startsWith("1")) d = "0" + d;
    return d;
  }

  // ---------- Thanks ----------
  function renderThanks() {
    const no = new URLSearchParams(location.search).get("o") || "";
    let o = {}; try { o = JSON.parse(sessionStorage.getItem("lastOrder") || "{}"); } catch (e) {}
    $("#ono").textContent = no;
    $("#odetails").textContent = o.name ? `${o.name} — الإجمالي ${money(o.total)} (تدفعه عند الاستلام)` : "";
    $("#confirmwa").href = waLink(`السلام عليكم، أنا ${o.cname || ""} وعايز أأكد طلبي رقم ${no}${o.name ? ` (${o.name})` : ""}`);
    $("#days").textContent = S.deliveryDays;
  }

  document.addEventListener("DOMContentLoaded", () => {
    chrome(); initPixels();
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    if (page === "product") renderProduct();
    if (page === "thanks") renderThanks();
  });
})();
