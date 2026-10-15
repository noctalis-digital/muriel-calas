/*!
 * Muriel Calas — interactions du site (JavaScript natif, sans dépendance).
 * Chaque bloc ne s’active que si l’élément concerné est présent dans la page.
 */

/* ---------------------------------------------------------------------------
 * Formulaire de contact : envoi par l’API Noctalis.
 * Le destinataire est configuré côté API (identifiant de site ci-dessous) :
 * il n’apparaît jamais dans le site, et aucun secret n’y figure.
 * ------------------------------------------------------------------------- */
var CONTACT_API = "https://api.noctalis.digital/v1/emails/send";
var CONTACT_SITE_ID = "muriel-calas";

(function () {
  "use strict";

  var d = document;
  var root = d.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || d).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); };

  /* Mémorise / applique les classes d’un élément et de ses descendants (états visuels) */
  function snapshot(el) {
    return [el].concat($$("*", el)).map(function (n) { return n.getAttribute("class"); });
  }
  function applySnapshot(el, snap) {
    [el].concat($$("*", el)).forEach(function (n, i) {
      if (snap[i] == null) n.removeAttribute("class");
      else n.setAttribute("class", snap[i]);
    });
  }
  function setInert(el, value) {
    if (value) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* -------------------------------------------------------------------------
   * 0. Apparitions en cascade : [data-stagger="80"] répartit les délais de ses enfants
   * ----------------------------------------------------------------------- */
  $$("[data-stagger]").forEach(function (group) {
    var step = parseInt(group.getAttribute("data-stagger"), 10) || 80;
    var base = parseInt(group.getAttribute("data-stagger-base"), 10) || 0;
    $$("[data-reveal]", group).forEach(function (el, i) {
      if (!el.style.getPropertyValue("--delay")) el.style.setProperty("--delay", base + i * step + "ms");
    });
  });

  /* -------------------------------------------------------------------------
   * 1. Apparitions au scroll, parallaxe légère, traits de progression
   * ----------------------------------------------------------------------- */
  var reveals = $$("[data-reveal]");
  var progressRoots = $$("[data-progress]");

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
    progressRoots.forEach(function (el) { el.style.setProperty("--progress", "1"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -7% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });

    var parallax = $$("[data-parallax]");
    var frame = 0;
    var update = function () {
      frame = 0;
      var vh = window.innerHeight;
      var desktop = window.innerWidth >= 768;
      parallax.forEach(function (el) {
        if (!desktop) { el.style.transform = ""; return; }
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.06;
        var shift = Math.max(-48, Math.min(48, -(r.top + r.height / 2 - vh / 2) * speed));
        el.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
      });
      progressRoots.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var distance = Math.max(r.height, vh * 0.25) + vh * 0.2;
        var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / distance));
        el.style.setProperty("--progress", p.toFixed(3));
      });
    };
    var onScroll = function () { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  /* -------------------------------------------------------------------------
   * 2. En-tête : barre flottante au scroll, masquée en descente, visible en remontée
   *    + trait de progression de lecture
   * ----------------------------------------------------------------------- */
  var header = $("[data-header]");
  var progressBar = $("[data-scroll-progress]");
  var menuOpen = false;
  if (header || progressBar) {
    var last = window.scrollY;
    var ticking = false;
    var headerUpdate = function () {
      ticking = false;
      var y = window.scrollY;
      if (header) {
        header.setAttribute("data-scrolled", y > 24 ? "true" : "false");
        if (Math.abs(y - last) > 6) {
          header.setAttribute("data-hidden", y > last && y > 480 && !menuOpen ? "true" : "false");
          last = y;
        }
      }
      if (progressBar) {
        var max = d.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.setProperty("--scroll", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
      }
    };
    headerUpdate();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(headerUpdate); }
    }, { passive: true });
    window.addEventListener("resize", headerUpdate);
  }

  /* -------------------------------------------------------------------------
   * 2 bis. Interactions au pointeur (souris uniquement, jamais au toucher)
   *   [data-magnetic]  → le bouton est légèrement attiré par le curseur
   *   [data-spotlight] → halo lumineux qui suit le curseur dans la carte
   *   [data-pointer]   → expose --px / --py (−1 → 1) pour une parallaxe douce
   * ----------------------------------------------------------------------- */
  if (finePointer && !reduce) {
    $$("[data-magnetic]").forEach(function (el) {
      var raf = 0;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          var x = (e.clientX - (r.left + r.width / 2)) * 0.18;
          var y = (e.clientY - (r.top + r.height / 2)) * 0.28;
          el.style.setProperty("--mx", Math.max(-8, Math.min(8, x)).toFixed(1) + "px");
          el.style.setProperty("--my", Math.max(-6, Math.min(6, y)).toFixed(1) + "px");
        });
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });

    $$("[data-spotlight]").forEach(function (el) {
      var raf = 0;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          el.style.setProperty("--sx", (e.clientX - r.left).toFixed(0) + "px");
          el.style.setProperty("--sy", (e.clientY - r.top).toFixed(0) + "px");
        });
      });
    });

    $$("[data-pointer]").forEach(function (el) {
      var raf = 0;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          el.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          el.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        });
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--px", "0");
        el.style.setProperty("--py", "0");
      });
    });
  }

  /* -------------------------------------------------------------------------
   * 3. Menu mobile plein écran (focus piégé, Échap, verrouillage du scroll)
   * ----------------------------------------------------------------------- */
  var toggle = $('[aria-controls="menu-mobile"]');
  var panel = d.getElementById("menu-mobile");
  if (toggle && panel) {
    var closeBtn = $("[data-menu-close]", panel);
    var focusables = function () { return $$("a[href], button:not([disabled])", panel); };
    var onKey = function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeMenu(true); }
      if (e.key === "Tab") {
        var items = focusables();
        var first = items[0];
        var lastItem = items[items.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); lastItem.focus(); }
        else if (!e.shiftKey && d.activeElement === lastItem) { e.preventDefault(); first.focus(); }
      }
    };
    var closeTimer = 0;
    var openMenu = function () {
      clearTimeout(closeTimer);
      panel.classList.remove("is-closing");
      menuOpen = true;
      panel.hidden = false;
      panel.style.animation = reduce ? "" : "menu-in 0.7s var(--ease-out) both";
      toggle.setAttribute("aria-expanded", "true");
      root.style.overflow = "hidden";
      if (header) header.setAttribute("data-hidden", "false");
      requestAnimationFrame(function () { (closeBtn || focusables()[0]).focus(); });
      d.addEventListener("keydown", onKey);
    };
    var closeMenu = function (restoreFocus) {
      menuOpen = false;
      toggle.setAttribute("aria-expanded", "false");
      root.style.overflow = "";
      d.removeEventListener("keydown", onKey);
      var finish = function () {
        panel.hidden = true;
        panel.style.animation = "";
        panel.classList.remove("is-closing");
      };
      if (reduce) finish();
      else {
        // Le panneau se replie vers le haut avant d’être masqué
        panel.classList.add("is-closing");
        closeTimer = setTimeout(finish, 480);
      }
      if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", function () { closeMenu(true); });
    panel.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) closeMenu(false);
    });
  }

  /* -------------------------------------------------------------------------
   * 4. Barre d’action collante (mobile)
   * ----------------------------------------------------------------------- */
  var bar = $("[data-mobile-cta]");
  if (bar) {
    var pastHero = false;
    var blocked = false;
    var render = function () {
      var show = pastHero && !blocked;
      bar.classList.toggle("translate-y-0", show);
      bar.classList.toggle("translate-y-[140%]", !show);
      bar.setAttribute("aria-hidden", show ? "false" : "true");
      setInert(bar, !show);
    };
    var onBarScroll = function () {
      var next = window.scrollY > window.innerHeight * 0.85;
      if (next !== pastHero) { pastHero = next; render(); }
    };
    window.addEventListener("scroll", onBarScroll, { passive: true });
    if ("IntersectionObserver" in window) {
      var visible = [];
      var barIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var i = visible.indexOf(e.target);
          if (e.isIntersecting && i === -1) visible.push(e.target);
          if (!e.isIntersecting && i !== -1) visible.splice(i, 1);
        });
        blocked = visible.length > 0;
        render();
      });
      $$("[data-hide-cta]").forEach(function (t) { barIo.observe(t); });
    }
    onBarScroll();
    render();
  }

  /* -------------------------------------------------------------------------
   * 5. Onglets « Pour qui ? »
   * ----------------------------------------------------------------------- */
  $$("[data-tabs]").forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute("aria-controls")); });
    if (tabs.length < 2) return;
    var active = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });
    if (active < 0) active = 0;
    var onState = snapshot(tabs[active]);
    var offState = snapshot(tabs[active === 0 ? 1 : 0]);

    var select = function (i, focus) {
      if (i === active) { if (focus) tabs[i].focus(); return; }
      tabs.forEach(function (tab, j) {
        var on = j === i;
        applySnapshot(tab, on ? onState : offState);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        var p = panels[j];
        if (!p) return;
        p.classList.toggle("visible", on);
        p.classList.toggle("opacity-100", on);
        p.classList.toggle("invisible", !on);
        p.classList.toggle("opacity-0", !on);
        p.setAttribute("aria-hidden", on ? "false" : "true");
        setInert(p, !on);
        var img = $("img", p);
        if (img) { img.classList.toggle("scale-100", on); img.classList.toggle("scale-[1.06]", !on); }
      });
      active = i;
      if (focus) tabs[i].focus();
    };

    var hover = window.matchMedia("(hover: hover)").matches;
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      if (hover) tab.addEventListener("mouseenter", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        var lastIndex = tabs.length - 1;
        var map = {
          ArrowRight: active === lastIndex ? 0 : active + 1,
          ArrowDown: active === lastIndex ? 0 : active + 1,
          ArrowLeft: active === 0 ? lastIndex : active - 1,
          ArrowUp: active === 0 ? lastIndex : active - 1,
          Home: 0,
          End: lastIndex,
        };
        if (e.key in map) { e.preventDefault(); select(map[e.key], true); }
      });
    });
  });

  /* -------------------------------------------------------------------------
   * 6. Accordéons (FAQ) : un seul panneau ouvert
   * ----------------------------------------------------------------------- */
  $$("[data-accordion]").forEach(function (acc) {
    var items = $$("button[aria-controls]", acc).map(function (btn) {
      return { btn: btn, region: d.getElementById(btn.getAttribute("aria-controls")) };
    });
    if (!items.length) return;
    var parts = function (it) { return [it.btn].concat($$("*", it.btn), [it.region]); };
    var read = function (it) { return parts(it).map(function (n) { return n.getAttribute("class"); }); };
    var write = function (it, s) { parts(it).forEach(function (n, i) { n.setAttribute("class", s[i]); }); };
    var openItem = items.find(function (it) { return it.btn.getAttribute("aria-expanded") === "true"; });
    var closedItem = items.find(function (it) { return it.btn.getAttribute("aria-expanded") !== "true"; });
    if (!openItem || !closedItem) return;
    var openState = read(openItem);
    var closedState = read(closedItem);

    items.forEach(function (it) {
      it.btn.addEventListener("click", function () {
        var willOpen = it.btn.getAttribute("aria-expanded") !== "true";
        items.forEach(function (other) {
          var on = other === it && willOpen;
          write(other, on ? openState : closedState);
          other.btn.setAttribute("aria-expanded", on ? "true" : "false");
          setInert(other.region, !on);
        });
      });
    });
  });

  /* -------------------------------------------------------------------------
   * 7. Carrousel de témoignages (défilement natif + flèches + clavier)
   * ----------------------------------------------------------------------- */
  $$("[data-slider]").forEach(function (slider) {
    var track = $("[data-slider-track]", slider);
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var count = slides.length;
    var index = 0;
    var current = $("[data-slider-current]", slider);
    var barEl = $("[data-slider-bar]", slider);
    var live = $("[data-slider-live]", slider);

    // La hauteur suit le témoignage affiché : pas de vide sous les avis courts
    var fit = function () { track.style.height = slides[index].offsetHeight + "px"; };
    var render = function () {
      if (current) current.textContent = String(index + 1).padStart(2, "0");
      if (barEl) barEl.style.width = ((index + 1) / count) * 100 + "%";
      if (live) live.textContent = "Témoignage " + (index + 1) + " sur " + count;
      slides.forEach(function (s, i) {
        var img = $("img", s);
        if (img) { img.classList.toggle("scale-100", i === index); img.classList.toggle("scale-105", i !== index); }
      });
      fit();
    };
    fit();
    window.addEventListener("resize", fit);
    var go = function (to) {
      var target = (to + count) % count;
      var slide = slides[target];
      var left = track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({ left: left, behavior: reduce ? "auto" : "smooth" });
    };
    // Témoignage courant déduit du défilement horizontal (chaque diapositive fait la largeur du rail)
    var sraf = 0;
    track.addEventListener("scroll", function () {
      if (sraf) return;
      sraf = requestAnimationFrame(function () {
        sraf = 0;
        var i = Math.max(0, Math.min(count - 1, Math.round(track.scrollLeft / track.clientWidth)));
        if (i !== index) { index = i; render(); }
      });
    }, { passive: true });
    var prev = $("[data-slider-prev]", slider);
    var next = $("[data-slider-next]", slider);
    if (prev) prev.addEventListener("click", function () { go(index - 1); });
    if (next) next.addEventListener("click", function () { go(index + 1); });
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    });
  });

  /* -------------------------------------------------------------------------
   * 8. Blog : filtre par catégorie
   * ----------------------------------------------------------------------- */
  $$("[data-blog]").forEach(function (blog) {
    var buttons = $$("[data-filter]", blog);
    var items = $$("[data-cats]", blog);
    var empty = $("[data-blog-empty]", blog);
    var pressed = buttons.find(function (b) { return b.getAttribute("aria-pressed") === "true"; }) || buttons[0];
    var other = buttons.find(function (b) { return b !== pressed; });
    if (!pressed || !other) return;
    var onState = pressed.getAttribute("class");
    var offState = other.getAttribute("class");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          var on = b === btn;
          b.setAttribute("class", on ? onState : offState);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        var shownPosts = 0;
        items.forEach(function (it) {
          var match = !cat || it.getAttribute("data-cats").split("|").indexOf(cat) !== -1;
          it.hidden = !match;
          if (match && !it.closest("aside")) shownPosts++;
        });
        if (empty) empty.hidden = shownPosts > 0;
      });
    });
  });

  /* -------------------------------------------------------------------------
   * 9. Formulaire de contact
   * ----------------------------------------------------------------------- */

  /* Adresse e-mail : validation stricte (elle sert aussi d’adresse de réponse) */
  function isEmail(value) {
    var v = String(value || "").trim();
    if (v.length > 254 || /\.\./.test(v)) return false;
    return /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(v);
  }

  /* Échappement de toute valeur saisie avant insertion dans l’e-mail HTML */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Texte multiligne : échappé, puis retours à la ligne conservés */
  function multiline(value) {
    return escapeHtml(String(value || "").replace(/\r\n?/g, "\n").trim()).replace(/\n/g, "<br>");
  }

  function readContact(f) {
    var v = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
    return {
      firstName: v("firstName"),
      lastName: v("lastName"),
      email: v("email"),
      phone: v("phone"),
      profile: v("profile"),
      subject: v("subject"),
      message: (f.elements.message && f.elements.message.value) || "",
    };
  }

  /* E-mail reçu par Muriel : tableaux, styles en ligne, aux couleurs du site */
  function buildContactEmail(c) {
    var ink = "#0d1b2a", muted = "#4a5b6d", clay = "#a8552f", paper = "#faf7f2", line = "#e6e0d6";
    var serif = "Georgia, 'Times New Roman', serif";
    var sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    var name = (c.firstName + " " + c.lastName).trim();
    var row = function (label, html) {
      return '<tr><td style="padding:14px 0;border-top:1px solid ' + line + ';font-family:' + sans + ';font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:' + muted + ';width:34%;vertical-align:top;">' + label + '</td>' +
        '<td style="padding:14px 0;border-top:1px solid ' + line + ';font-family:' + sans + ';font-size:15px;line-height:1.5;color:' + ink + ';vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">' + html + '</td></tr>';
    };
    var phoneDigits = c.phone.replace(/[^\d+]/g, "");
    var rows =
      row("Nom", escapeHtml(name)) +
      row("E-mail", '<a href="mailto:' + escapeHtml(c.email) + '" style="color:' + ink + ';">' + escapeHtml(c.email) + "</a>") +
      (c.phone ? row("Téléphone", phoneDigits ? '<a href="tel:' + escapeHtml(phoneDigits) + '" style="color:' + ink + ';">' + escapeHtml(c.phone) + "</a>" : escapeHtml(c.phone)) : "") +
      (c.profile ? row("Profil", escapeHtml(c.profile)) : "") +
      (c.subject ? row("Sujet", escapeHtml(c.subject)) : "");

    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nouvelle demande de contact</title></head>' +
      '<body style="margin:0;padding:0;background:' + paper + ';">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + paper + ';"><tr><td align="center" style="padding:28px 12px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ' + line + ';border-radius:8px;">' +
      '<tr><td style="padding:28px 32px 22px;border-bottom:3px solid ' + clay + ';">' +
      '<div style="font-family:' + serif + ';font-size:22px;color:' + ink + ';">Muriel Calas</div>' +
      '<div style="font-family:' + sans + ';font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:' + muted + ';margin-top:4px;">Préparatrice mentale</div></td></tr>' +
      '<tr><td style="padding:28px 32px 8px;">' +
      '<div style="font-family:' + sans + ';font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:' + clay + ';">Nouvelle demande de contact</div>' +
      '<h1 style="margin:10px 0 18px;font-family:' + serif + ';font-weight:400;font-size:26px;line-height:1.2;word-break:break-word;color:' + ink + ';">' + escapeHtml(name) + "</h1>" +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + rows + "</table></td></tr>" +
      '<tr><td style="padding:12px 32px 28px;">' +
      '<div style="font-family:' + sans + ';font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:' + muted + ';margin-bottom:10px;">Message</div>' +
      '<div style="font-family:' + sans + ';font-size:15px;line-height:1.65;color:' + ink + ';background:' + paper + ';border-left:3px solid ' + clay + ';padding:16px 18px;border-radius:4px;word-break:break-word;overflow-wrap:anywhere;">' + multiline(c.message) + "</div></td></tr>" +
      '<tr><td style="padding:18px 32px 26px;border-top:1px solid ' + line + ';font-family:' + sans + ';font-size:13px;line-height:1.5;color:' + muted + ';">' +
      "Pour répondre, utilisez simplement « Répondre » : votre réponse partira à " + escapeHtml(c.email) + ".<br>" +
      "Message envoyé depuis le formulaire de contact de www.muriel-calas.fr. La personne a accepté le traitement de ses données pour cette demande.</td></tr>" +
      "</table></td></tr></table></body></html>";
  }

  /* Contenu exact envoyé à l’API : identifiant de site, objet, HTML et adresse de réponse */
  function contactPayload(c) {
    var name = (c.firstName + " " + c.lastName).replace(/[\r\n]+/g, " ").trim();
    var topic = c.subject ? c.subject.replace(/[\r\n]+/g, " ") + " · " : "";
    var payload = {
      siteId: CONTACT_SITE_ID,
      subject: "Nouvelle demande de contact · " + topic + name,
      html: buildContactEmail(c),
    };
    if (isEmail(c.email)) payload.replyTo = c.email.trim();
    return payload;
  }
  var form = $("[data-contact-form]");
  if (form) {
    var messages = {
      firstName: "Indiquez votre prénom.",
      lastName: "Indiquez votre nom.",
      email: "Indiquez votre adresse e-mail.",
      emailInvalid: "Cette adresse e-mail ne semble pas valide.",
      message: "Quelques mots sur votre situation (10 caractères minimum).",
      consent: "Merci d’accepter le traitement de vos données pour que je puisse vous répondre.",
    };
    var setError = function (name, text) {
      var field = form.elements[name];
      if (!field) return;
      var id = name + "-error";
      var existing = d.getElementById(id);
      if (text) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", id);
        if (!existing) {
          existing = d.createElement("p");
          existing.id = id;
          existing.className = "field-error";
          var container = field.closest(".field");
          container.appendChild(existing);
        }
        existing.textContent = text;
      } else {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
        if (existing) existing.remove();
      }
    };
    var validate = function () {
      var v = function (n) { return (form.elements[n] && form.elements[n].value || "").trim(); };
      var errors = {};
      if (!v("firstName")) errors.firstName = messages.firstName;
      if (!v("lastName")) errors.lastName = messages.lastName;
      if (!v("email")) errors.email = messages.email;
      else if (!isEmail(v("email"))) errors.email = messages.emailInvalid;
      if (v("message").length < 10) errors.message = messages.message;
      if (!form.elements.consent.checked) errors.consent = messages.consent;
      ["firstName", "lastName", "email", "message", "consent"].forEach(function (n) { setError(n, errors[n]); });
      return errors;
    };

    var submit = $('button[type="submit"]', form);
    var submitLabel = submit ? $("span", submit) : null;
    var submitText = submitLabel ? submitLabel.textContent : "";
    var status = $('[aria-live="polite"]', form);
    var local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var sending = false;

    var success = function () {
      var box = d.createElement("div");
      box.setAttribute("role", "status");
      box.className = "rounded-[var(--radius-card)] border border-line bg-paper p-8 md:p-12";
      box.innerHTML =
        '<span class="grid h-12 w-12 place-items-center rounded-full bg-navy text-paper" aria-hidden="true">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>' +
        '<h3 class="display-sm mt-6 text-ink">Merci, votre message est bien parti.</h3>' +
        '<p class="mt-4 max-w-md text-muted">Je vous réponds personnellement dans les meilleurs délais. Si c’est urgent, n’hésitez pas à m’appeler au 06 22 06 44 59.</p>';
      form.replaceWith(box);
      box.setAttribute("tabindex", "-1");
      box.focus();
    };
    var fail = function (text) {
      if (!status) return;
      status.innerHTML = '<span class="field-error"></span>';
      status.firstChild.textContent = text + " Vous pouvez aussi appeler le 06 22 06 44 59.";
    };
    var setSending = function (on) {
      sending = on;
      if (submit) {
        submit.disabled = on;
        submit.setAttribute("aria-busy", on ? "true" : "false");
        submit.classList.toggle("opacity-70", on);
      }
      if (submitLabel) submitLabel.textContent = on ? "Envoi en cours…" : submitText;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return; // évite les doubles envois
      if (status) status.textContent = "";
      var errors = validate();
      var first = Object.keys(errors)[0];
      if (first) { form.elements[first].focus(); return; }
      // Piège à robots rempli : on fait comme si tout allait bien, sans rien envoyer
      if (form.elements.website && form.elements.website.value) { success(); return; }

      var payload = contactPayload(readContact(form));
      // Aperçu local (fichier ou localhost) : origine non autorisée par l’API, rien n’est envoyé
      if (local) {
        if (window.console) console.info("Aperçu local : message non envoyé.", payload);
        success();
        return;
      }

      setSending(true);
      fetch(CONTACT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (result) {
            if (!res.ok || (result && result.success === false)) {
              throw new Error((result && result.error && result.error.message) || "Unable to send email");
            }
          });
        })
        .then(success)
        .catch(function () {
          setSending(false);
          fail("L’envoi n’a pas abouti.");
        });
    });
  }
})();
