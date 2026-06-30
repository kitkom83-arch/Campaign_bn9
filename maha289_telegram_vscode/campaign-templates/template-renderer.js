(function () {
  "use strict";

  var SCRIPT_STATE = {};
  var ACTION_ICON_MAP = {
    reply: "\u21a9",
    like: "\u2661",
    repost: "\u21bb",
    link: "\ud83d\udd17"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureMeta(selector, attrName, attrValue) {
    var tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attrName, attrValue);
      document.head.appendChild(tag);
    }
    return tag;
  }

  function applySeo(seo) {
    if (!seo) {
      return;
    }
    if (seo.title) {
      document.title = seo.title;
    }
    if (seo.description) {
      ensureMeta('meta[name="description"]', "name", "description").setAttribute("content", seo.description);
    }
    if (seo.keywords) {
      ensureMeta('meta[name="keywords"]', "name", "keywords").setAttribute("content", seo.keywords);
    }
    if (seo.ogTitle) {
      ensureMeta('meta[property="og:title"]', "property", "og:title").setAttribute("content", seo.ogTitle);
    }
    if (seo.ogDescription) {
      ensureMeta('meta[property="og:description"]', "property", "og:description").setAttribute("content", seo.ogDescription);
    }
    if (seo.ogImage) {
      ensureMeta('meta[property="og:image"]', "property", "og:image").setAttribute("content", seo.ogImage);
    }
  }

  function addFallback(holder, message) {
    if (!holder || holder.querySelector(".widget-fallback")) {
      return;
    }
    var fallback = document.createElement("div");
    fallback.className = "widget-fallback";
    fallback.textContent = message;
    holder.appendChild(fallback);
  }

  function loadScriptOnce(key, src, timeoutMs) {
    if (SCRIPT_STATE[key]) {
      return SCRIPT_STATE[key];
    }
    SCRIPT_STATE[key] = new Promise(function (resolve) {
      var existing = document.querySelector('script[data-widget-script="' + key + '"]');
      if (existing && existing.getAttribute("data-loaded") === "true") {
        resolve(true);
        return;
      }

      var script = existing || document.createElement("script");
      var settled = false;
      var timeoutId = setTimeout(function () {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, timeoutMs || 7000);

      script.async = true;
      script.src = src;
      script.setAttribute("data-widget-script", key);
      script.onload = function () {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          script.setAttribute("data-loaded", "true");
          resolve(true);
        }
      };
      script.onerror = function () {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          resolve(false);
        }
      };

      if (!existing) {
        document.body.appendChild(script);
      }
    });
    return SCRIPT_STATE[key];
  }

  function normalizeWidget(widget) {
    if (!widget) {
      return null;
    }
    return {
      enabled: widget.enabled === true,
      platform: widget.platform || "",
      type: widget.type || "",
      label: widget.label || "",
      href: widget.href || "",
      username: widget.username || "",
      text: widget.text || "",
      url: widget.url || "",
      hashtags: widget.hashtags || "",
      via: widget.via || "",
      postUrl: widget.postUrl || "",
      profileUrl: widget.profileUrl || widget.listUrl || "",
      embedUrl: widget.embedUrl || "",
      post: widget.post || "",
      channel: widget.channel || "",
      commentsLimit: widget.commentsLimit || 5,
      height: widget.height || 420,
      dark: widget.dark !== false
    };
  }

  function buildWidgetButton(widget) {
    var w = normalizeWidget(widget);
    if (!w || !w.enabled) {
      return null;
    }

    var btn = document.createElement("a");
    btn.className = "widget-btn";
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.textContent = w.label || "Open";

    if (w.platform === "x" && w.type === "follow") {
      btn.href = "https://x.com/intent/follow?screen_name=" + encodeURIComponent(w.username || "");
      return btn;
    }
    if (w.platform === "x" && w.type === "share") {
      var shareUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(w.text || "");
      if (w.url) {
        shareUrl += "&url=" + encodeURIComponent(w.url);
      }
      if (w.hashtags) {
        shareUrl += "&hashtags=" + encodeURIComponent(w.hashtags);
      }
      if (w.via) {
        shareUrl += "&via=" + encodeURIComponent(w.via);
      }
      btn.href = shareUrl;
      return btn;
    }
    if (w.platform === "x" && w.type === "mention") {
      var mentionUrl = "https://twitter.com/intent/tweet?screen_name=" + encodeURIComponent(w.username || "");
      if (w.text) {
        mentionUrl += "&text=" + encodeURIComponent(w.text);
      }
      if (w.url) {
        mentionUrl += "&url=" + encodeURIComponent(w.url);
      }
      btn.href = mentionUrl;
      return btn;
    }
    if (w.platform === "x" && w.type === "hashtag") {
      var hashtagUrl = "https://twitter.com/intent/tweet?button_hashtag=" + encodeURIComponent(w.hashtags || "");
      if (w.text) {
        hashtagUrl += "&text=" + encodeURIComponent(w.text);
      }
      if (w.url) {
        hashtagUrl += "&url=" + encodeURIComponent(w.url);
      }
      btn.href = hashtagUrl;
      return btn;
    }
    if (w.platform === "telegram" && w.type === "share") {
      var tgShareUrl = "https://t.me/share/url?url=" + encodeURIComponent(w.url || "");
      if (w.text) {
        tgShareUrl += "&text=" + encodeURIComponent(w.text);
      }
      btn.href = tgShareUrl;
      return btn;
    }
    if (w.platform === "telegram" && w.type === "contact") {
      btn.href = w.href || ("https://t.me/" + encodeURIComponent(w.channel || ""));
      return btn;
    }
    if (w.platform === "telegram" && w.type === "loginPlaceholder") {
      btn.href = "javascript:void(0)";
      btn.setAttribute("aria-disabled", "true");
      return btn;
    }

    btn.href = w.href || w.url || "#";
    return btn;
  }

  function buildBody(bodyItems) {
    var box = document.createElement("p");
    box.className = "campaign-body";
    var items = Array.isArray(bodyItems) ? bodyItems : [];

    items.forEach(function (item) {
      if (!item || !item.type) {
        return;
      }
      if (item.type === "lineBreak") {
        box.appendChild(document.createElement("br"));
        return;
      }
      if (item.type === "text") {
        box.appendChild(document.createTextNode(item.value || ""));
        return;
      }
      if (item.type === "bold") {
        var strong = document.createElement("strong");
        strong.textContent = item.value || "";
        box.appendChild(strong);
        return;
      }
      if (item.type === "light") {
        var light = document.createElement("span");
        light.className = "campaign-light";
        light.textContent = item.value || "";
        box.appendChild(light);
        return;
      }
      if (item.type === "link") {
        var link = document.createElement("a");
        link.className = "campaign-link";
        link.href = item.href || "#";
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = item.text || item.href || "";
        box.appendChild(link);
      }
    });

    return box;
  }

  function buildActionIcons(actions) {
    var wrap = document.createElement("div");
    wrap.className = "campaign-actions";
    var list = [];

    if (Array.isArray(actions)) {
      actions.forEach(function (item) {
        if (typeof item === "string") {
          list.push({ type: item, href: "" });
          return;
        }
        if (item && item.type) {
          list.push(item);
        }
      });
    } else if (actions && typeof actions === "object") {
      ["reply", "like", "repost", "link"].forEach(function (key) {
        var conf = actions[key];
        if (!conf) {
          return;
        }
        list.push({
          type: key,
          href: conf.href || "",
          enabled: conf.enabled !== false
        });
      });
    }

    list.forEach(function (action) {
      var key = String(action.type || "").toLowerCase();
      if (!ACTION_ICON_MAP[key]) {
        return;
      }
      if (action.enabled === false) {
        return;
      }

      var token = action.href ? document.createElement("a") : document.createElement("span");
      token.className = "campaign-action";
      token.textContent = ACTION_ICON_MAP[key];
      token.setAttribute("title", key);
      if (action.href) {
        token.href = action.href;
        token.target = "_blank";
        token.rel = "noopener";
      }
      wrap.appendChild(token);
    });
    return wrap;
  }

  function normalizeNav(nav) {
    var config = nav || {};
    return {
      backHref: config.backHref || "./index.html",
      backText: config.backText || "\u2190 \u0e01\u0e25\u0e31\u0e1a\u0e40\u0e21\u0e19\u0e39",
      prevHref: config.prevHref || "",
      nextHref: config.nextHref || "",
      prevText: config.prevText || "\u0e2b\u0e19\u0e49\u0e32\u0e01\u0e48\u0e2d\u0e19\u0e2b\u0e19\u0e49\u0e32",
      nextText: config.nextText || "\u0e2b\u0e19\u0e49\u0e32\u0e16\u0e31\u0e14\u0e44\u0e1b"
    };
  }

  function renderPageNav(config) {
    var shell = document.querySelector(".campaign-page");
    if (!shell) {
      return;
    }
    var nav = normalizeNav(config && config.nav);

    var existing = shell.querySelector(".campaign-nav");
    if (existing) {
      existing.remove();
    }

    var navWrap = document.createElement("nav");
    navWrap.className = "campaign-nav";

    var left = document.createElement("div");
    left.className = "campaign-nav-left";
    var back = document.createElement("a");
    back.className = "nav-btn";
    back.href = nav.backHref;
    back.textContent = nav.backText;
    left.appendChild(back);

    var right = document.createElement("div");
    right.className = "campaign-nav-right";

    var prev = document.createElement("a");
    prev.className = "nav-btn";
    prev.href = nav.prevHref || "#";
    prev.textContent = nav.prevText;
    if (!nav.prevHref) {
      prev.hidden = true;
    }

    var next = document.createElement("a");
    next.className = "nav-btn";
    next.href = nav.nextHref || "#";
    next.textContent = nav.nextText;
    if (!nav.nextHref) {
      next.hidden = true;
    }

    right.appendChild(prev);
    right.appendChild(next);
    navWrap.appendChild(left);
    navWrap.appendChild(right);
    shell.insertBefore(navWrap, shell.firstChild);
  }

  function normalizeEmbedBalloon(item) {
    var w = normalizeWidget(item);
    if (!w) {
      return null;
    }
    return {
      enabled: w.enabled,
      type: w.type,
      label: w.label || "Embed Balloon",
      theme: item.theme || "dark",
      mediaMaxWidth: item.mediaMaxWidth || 0,
      postUrl: w.postUrl,
      profileUrl: w.profileUrl,
      embedUrl: w.embedUrl,
      height: w.height,
      dark: w.dark
    };
  }

  function getEmbedZone(config) {
    var zone = config && config.embedZone ? config.embedZone : {};
    var fromOld = Array.isArray(config && config.embedWidgets) ? config.embedWidgets : [];
    var source = Array.isArray(zone.items)
      ? zone.items
      : (Array.isArray(zone.balloons) ? zone.balloons : fromOld);
    var limit = Number(zone.maxItems || 2);
    if (!Number.isFinite(limit) || limit <= 0) {
      limit = 2;
    }

    return {
      enabled: zone.enabled !== false,
      maxItems: limit,
      introText: zone.introText || "ในตรงนี้ เลือกใช้ได้",
      bullets: Array.isArray(zone.bullets) ? zone.bullets : ["Embedded Video", "Embedded Post", "Embedded Timeline", "Embedded Broadcast"],
      footerText: zone.footerText || zone.outroText || "1 หน้า 2 โพส สูงสุดในตรงนี้",
      items: source.map(normalizeEmbedBalloon).filter(Boolean).slice(0, limit)
    };
  }

  function buildEmbedBalloon(balloon) {
    if (!balloon || !balloon.enabled) {
      return null;
    }
    var allow = {
      embeddedVideo: true,
      embeddedPost: true,
      embeddedTimeline: true,
      embeddedBroadcast: true
    };
    if (!allow[balloon.type]) {
      return null;
    }

    var card = document.createElement("section");
    card.className = "embed-card";
    var label = document.createElement("p");
    label.className = "embed-label";
    label.textContent = balloon.label;
    var slot = document.createElement("div");
    slot.className = "embed-slot";
    slot.setAttribute("data-type", balloon.type);
    slot.setAttribute("data-payload", JSON.stringify(balloon));

    card.appendChild(label);
    card.appendChild(slot);
    return card;
  }

  function renderEmbedSlot(slot, balloon) {
    if (balloon.type === "embeddedBroadcast") {
      addFallback(slot, "Embedded Broadcast placeholder: เพิ่มโค้ด/URL จริงใน PAGE_CONFIG");
      return;
    }

    if (balloon.type === "embeddedVideo") {
      if (!balloon.postUrl) {
        addFallback(slot, "ยังไม่ได้ตั้ง postUrl ใน PAGE_CONFIG");
        return;
      }
      slot.innerHTML = '<blockquote class="twitter-tweet" data-theme="' + escapeHtml(balloon.theme || "dark") + '" data-width="' + escapeHtml(balloon.mediaMaxWidth || "") + '"><a href="' + escapeHtml(balloon.postUrl) + '"></a></blockquote>';
      return;
    }

    if (balloon.type === "embeddedPost") {
      if (!balloon.postUrl) {
        addFallback(slot, "ยังไม่ได้ตั้ง postUrl ใน PAGE_CONFIG");
        return;
      }
      slot.innerHTML = '<blockquote class="twitter-tweet" data-theme="' + escapeHtml(balloon.theme || "dark") + '" data-width="' + escapeHtml(balloon.mediaMaxWidth || "") + '"><a href="' + escapeHtml(balloon.postUrl) + '"></a></blockquote>';
      return;
    }

    if (balloon.type === "embeddedTimeline") {
      if (!balloon.profileUrl) {
        addFallback(slot, "ยังไม่ได้ตั้ง profileUrl/listUrl ใน PAGE_CONFIG");
        return;
      }
      slot.innerHTML = '<a class="twitter-timeline" data-theme="' + escapeHtml(balloon.theme || "dark") + '" data-height="' + escapeHtml(balloon.height || 420) + '" href="' + escapeHtml(balloon.profileUrl) + '">Timeline</a>';
    }
  }

  function hydrateEmbedSlots(root) {
    var slots = root.querySelectorAll(".embed-slot");
    var requireX = false;

    slots.forEach(function (slot) {
      var payload = slot.getAttribute("data-payload");
      if (!payload) {
        return;
      }
      var balloon = JSON.parse(payload);
      if (balloon.type === "embeddedPost" || balloon.type === "embeddedTimeline") {
        requireX = true;
      }
      renderEmbedSlot(slot, balloon);
    });

    if (!requireX) {
      return;
    }

    loadScriptOnce("x-widgets", "https://platform.x.com/widgets.js", 7000).then(function (ok) {
      if (!ok) {
        slots.forEach(function (slot) {
          var payload = slot.getAttribute("data-payload");
          if (!payload) {
            return;
          }
          var balloon = JSON.parse(payload);
          if (balloon.type === "embeddedPost" || balloon.type === "embeddedTimeline") {
            addFallback(slot, "X widget โหลดไม่สำเร็จ โปรดตรวจ connection หรือปิด script blocker");
          }
        });
      }
    });
  }

  function renderCampaignPage(config) {
    try {
      applySeo(config && config.seo);

      var root = document.getElementById("campaign-root");
      if (!root) {
        return;
      }

      renderPageNav(config);

      var brand = (config && config.brand) || {};
      var topButton = normalizeWidget((config && config.topButton) || (config && config.topWidget));
      var subButtons = Array.isArray(config && config.subButtons)
        ? config.subButtons
        : (Array.isArray(config && config.subWidgets) ? config.subWidgets : []);
      var embedZone = getEmbedZone(config);
      var campaign = (config && config.campaign) || {};
      var cta = (config && config.cta) || {};

      root.innerHTML =
        '<header class="campaign-top">' +
        '<div class="campaign-brand">' +
        '<img class="campaign-logo" id="campaign-logo" src="' + escapeHtml(brand.logoSrc || "") + '" alt="' + escapeHtml(brand.logoAlt || "BN9.ONE") + '">' +
        '<span class="campaign-logo-fallback" id="campaign-logo-fallback" hidden>' + escapeHtml(brand.logoAlt || "BN9.ONE") + "</span>" +
        "</div>" +
        '<div class="widget-top-slot" id="widget-top-slot"></div>' +
        "</header>" +
        '<div class="campaign-divider"></div>' +
        '<section class="hero-box">' +
        '<p class="hero-intro">' + escapeHtml(embedZone.introText) + "</p>" +
        '<ul class="bullet-list">' +
        embedZone.bullets.map(function (item) { return "<li>" + escapeHtml(item || "") + "</li>"; }).join("") +
        "</ul>" +
        '<p class="hero-outro">' + escapeHtml(embedZone.footerText) + "</p>" +
        '<div class="embed-grid" id="embed-grid-slot"></div>' +
        "</section>" +
        '<div class="campaign-divider"></div>' +
        '<section class="campaign-content">' +
        '<h1 class="campaign-title">' + escapeHtml(campaign.title || "") + "</h1>" +
        '<div class="campaign-actions" id="campaign-actions-slot"></div>' +
        '<p class="campaign-subtitle">' + escapeHtml(campaign.subtitle || "") + "</p>" +
        '<div id="campaign-body-slot"></div>' +
        '<div class="widget-row" id="widget-row-slot"></div>' +
        "</section>";

      var logo = root.querySelector("#campaign-logo");
      var logoFallback = root.querySelector("#campaign-logo-fallback");
      if (logo) {
        logo.onerror = function () {
          logo.hidden = true;
          if (logoFallback) {
            logoFallback.hidden = false;
          }
        };
        if (!logo.getAttribute("src")) {
          logo.hidden = true;
          if (logoFallback) {
            logoFallback.hidden = false;
          }
        }
      }

      var topSlot = root.querySelector("#widget-top-slot");
      var topBtnNode = buildWidgetButton(topButton);
      if (topBtnNode) {
        topSlot.appendChild(topBtnNode);
      }

      var embedGrid = root.querySelector("#embed-grid-slot");
      if (embedZone.enabled) {
        embedZone.items.forEach(function (balloon) {
          var card = buildEmbedBalloon(balloon);
          if (card) {
            embedGrid.appendChild(card);
          }
        });
      }

      var actionSlot = root.querySelector("#campaign-actions-slot");
      actionSlot.replaceWith(buildActionIcons(campaign.actions));

      var bodySlot = root.querySelector("#campaign-body-slot");
      bodySlot.appendChild(buildBody(campaign.body));

      var rowSlot = root.querySelector("#widget-row-slot");
      subButtons.forEach(function (buttonConfig) {
        var button = buildWidgetButton(buttonConfig);
        if (button) {
          rowSlot.appendChild(button);
        }
      });

      var oldCta = root.querySelector(".floating-cta");
      if (oldCta) {
        oldCta.remove();
      }
      var ctaBtn = document.createElement("a");
      ctaBtn.className = "floating-cta";
      ctaBtn.textContent = (cta.text || "ส่งกิจกรรม") + " \u2192";
      ctaBtn.href = cta.href || "#";
      if (!cta.enabled) {
        ctaBtn.hidden = true;
      }
      ctaBtn.target = "_blank";
      ctaBtn.rel = "noopener";
      root.appendChild(ctaBtn);

      hydrateEmbedSlots(root);
    } catch (error) {
      var rootFallback = document.getElementById("campaign-root");
      if (rootFallback) {
        rootFallback.innerHTML = '<section class="campaign-content"><h1 class="campaign-title">BN9.ONE</h1><p class="campaign-subtitle">ไม่สามารถเรนเดอร์หน้าเทมเพลตได้ โปรดตรวจ PAGE_CONFIG</p><p class="campaign-body">' + escapeHtml(error && error.message ? error.message : "Unknown error") + "</p></section>";
      }
    }
  }

  window.renderCampaignPage = renderCampaignPage;
})();
