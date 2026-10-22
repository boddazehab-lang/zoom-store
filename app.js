(function () {
  const S = window.STORE;
  const $ = (q, el = document) => el.querySelector(q);

  const SA_REGIONS = ["الرياض","مكة المكرمة","المدينة المنورة","المنطقة الشرقية","القصيم","عسير","تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف"];
  const GOVS = ["القاهرة","الجيزة","الإسكندرية","القليوبية","الشرقية","الدقهلية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء"];

  const ICONS = {
    monocular: '<svg viewBox="0 0 200 150" width="62%" aria-hidden="true"><rect x="40" y="52" width="110" height="46" rx="18" fill="#0f5c4d"/><rect x="145" y="44" width="30" height="62" rx="12" fill="#15181d"/><circle cx="175" cy="75" r="22" fill="#9fd3c7"/><circle cx="175" cy="75" r="13" fill="#e8f1ee"/><rect x="18" y="60" width="26" height="30" rx="8" fill="#15181d"/><rect x="70" y="98" width="8" height="34" fill="#5c6470"/><path d="M74 132 L52 146 M74 132 L96 146" stroke="#5c6470" stroke-width="6" stroke-linecap="round"/></svg>',
    endoscope: '<svg viewBox="0 0 200 150" width="62%" aria-hidden="true"><rect x="22" y="40" width="44" height="76" rx="10" fill="#15181d"/><rect x="28" y="48" width="32" height="56" rx="4" fill="#9fd3c7"/><path d="M66 78 C110 78 90 30 140 34 S170 92 150 110" fill="none" stroke="#0f5c4d" stroke-width="7" stroke-linecap="round"/><rect x="140" y="104" width="22" height="16" rx="5" fill="#15181d" transform="rotate(30 151 112)"/><circle cx="160" cy="122" r="7" fill="#f2b134"/></svg>'
  };

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
    h.innerHTML = `<div class="wrap"><a class="logo" href="index.html">${S.name.replace(/(\S+)$/, "<span>$1</span>")}</a>
      <span class="hdr-r">${Object.keys(S.countries).length > 1 ? `<select id="ccsel" aria-label="الدولة">${Object.entries(S.countries).map(([k, v]) => `<option value="${k}" ${k === CC ? "selected" : ""}>${v.flag} ${v.name}</option>`).join("")}</select>` : ""}
      <a class="wa-link" href="${waLink("السلام عليكم، عندي سؤال")}" target="_blank" rel="noopener">💬 واتساب</a></span></div>`;
    document.body.prepend(h); document.body.prepend(top);
    const sel = document.getElementById("ccsel");
    if (sel) sel.onchange = () => { const u = new URL(location.href); u.searchParams.set("c", sel.value.toLowerCase()); location.href = u.toString(); };
    const f = document.createElement("footer"); f.className = "site";
    f.innerHTML = `<div class="wrap">${S.name} • ${S.returnPolicy}<br>التوصيل ${S.deliveryDays} • © ${new Date().getFullYear()}</div>`;
    document.body.append(f);
  }

  // ---------- Home ----------
  function renderHome() {
    $("#store-tagline").textContent = S.tagline;
    const list = S.products.filter(available);
    if (!list.length) { $("#grid").innerHTML = `<p style="color:var(--muted)">قريباً في ${C.name} 👀</p>`; return; }
    $("#grid").innerHTML = list.map(p => `
      <a class="pcard" href="product.html?p=${p.id}">
        <div class="media">${media(p)}</div>
        <div class="body"><h3>${p.name}</h3><p>${p.subtitle}</p>
          <div class="price">${money(priceOf(p))}${p.oldPrice && CC === "EG" ? `<s>${money(p.oldPrice)}</s>` : ""}</div>
          <span class="btn btn-primary">اطلب دلوقتي</span></div>
      </a>`).join("");
  }

  // ---------- Product ----------
  function renderProduct() {
    const id = new URLSearchParams(location.search).get("p");
    const p = product(id) || S.products[0];
    document.title = p.name + " | " + S.name;
    if (!available(p)) {
      $("#pp").innerHTML = `<div class="section" style="grid-column:1/-1;text-align:center"><h1>${p.name}</h1><p>المنتج ده مش متاح في ${C.name} دلوقتي.</p><a class="btn btn-primary" href="index.html">شوف باقي المنتجات</a></div>`;
      $("#order").remove(); $("#buybar").remove(); return;
    }
    const imgs = p.images || [];
    $("#pp").innerHTML = `
      <div class="gallery">
        <div class="main" id="mainimg">${media(p)}</div>
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, i) => `<img src="${s}" data-i="${i}" class="${i ? "" : "on"}" alt="">`).join("")}</div>` : ""}
      </div>
      <div class="pinfo">
        <h1>${p.name}</h1><div class="sub">${p.subtitle}</div>
        <div class="price">${money(priceOf(p))}${p.oldPrice && CC === "EG" ? `<s>${money(p.oldPrice)}</s>` : ""}</div>
        <div class="badges"><span class="badge">🚚 شحن مجاني</span><span class="badge">💵 الدفع عند الاستلام</span><span class="badge">🔁 استبدال 14 يوم</span></div>
        <ul class="bullets">${p.bullets.map(b => `<li>${b}</li>`).join("")}</ul>
        ${p.honest ? `<div class="honest">ℹ️ ${p.honest}</div>` : ""}
        <p><a href="#order" class="btn btn-primary" style="width:100%">اطلب دلوقتي — ادفع لما تستلم</a></p>
      </div>`;
    $("#extra").innerHTML = `
      <div class="section"><h2>في العلبة</h2><ul class="inbox">${p.inBox.map(x => `<li>${x}</li>`).join("")}</ul></div>
      <div class="section"><h2>أسئلة بتتسأل كتير</h2>${p.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`;
    document.querySelectorAll(".thumbs img").forEach(t => t.onclick = () => {
      document.querySelectorAll(".thumbs img").forEach(x => x.classList.remove("on")); t.classList.add("on");
      $("#mainimg").innerHTML = `<img src="${t.src}" alt="">`;
    });
    setupForm(p);
    // sticky buy bar
    const bar = $("#buybar");
    bar.querySelector(".bb-price").textContent = money(priceOf(p));
    const formEl = $("#order");
    const io = new IntersectionObserver(([e]) => bar.classList.toggle("on", !e.isIntersecting && window.scrollY > 300));
    io.observe(formEl);
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
