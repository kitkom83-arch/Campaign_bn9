(function () {
  "use strict";

  var SCRIPT_STATE = {};

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
      profileUrl: widget.profileUrl || "",
      post: widget.post || "",
      channel: widget.channel || "",
      commentsLimit: widget.commentsLimit || 5,
      height: widget.height || 420,
      dark: widget.dark !== false,
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
      btn.href = "https://x.com/intent/follow?screen_name=" + encodeURIComponent(w.username);
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
      btn.href = "https://twitter.com/intent/tweet?screen_name=" + encodeURIComponent(w.username);
      return btn;
    }
    if (w.platform === "x" && w.type === "hashtag") {
      var hashtagUrl = "https://twitter.com/intent/tweet?button_hashtag=" + encodeURIComponent(w.hashtags || "");
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
      btn.href = w.href || ("https://t.me/" + encodeURIComponent(w.channel));
      return btn;
    }
    if (w.platform === "telegram" && w.type === "loginPlaceholder") {
      btn.href = "javascript:void(0)";
      btn.setAttribute("aria-disabled", "true");
      return btn;
    }

    if (w.href) {
      btn.href = w.href;
      return btn;
    }
    return null;
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

  function buildEmbedCard(widget) {
    var w = normalizeWidget(widget);
    if (!w || !w.enabled) {
      return null;
    }
    var isEmbedType =
      (w.platform === "x" && (w.type === "embeddedPost" || w.type === "timeline")) ||
      (w.platform === "telegram" && (w.type === "post" || w.type === "discussion"));

    if (!isEmbedType) {
      return null;
    }

    var card = document.createElement("section");
    card.className = "embed-card";
    var label = document.createElement("p");
    label.className = "embed-label";
    label.textContent = w.label || "Widget";
    var slot = document.createElement("div");
    slot.className = "embed-slot";
    slot.setAttribute("data-platform", w.platform);
    slot.setAttribute("data-type", w.type);
    slot.setAttribute("data-payload", JSON.stringify(w));

    card.appendChild(label);
    card.appendChild(slot);
    return card;
  }

  function renderXEmbed(slot, widget) {
    var w = normalizeWidget(widget);
    if (w.type === "embeddedPost") {
      slot.innerHTML =
        '<blockquote class="twitter-tweet" data-theme="dark"><a href="' +
        escapeHtml(w.postUrl) +
        '"></a></blockquote>';
      return;
    }
    if (w.type === "timeline") {
      slot.innerHTML =
        '<a class="twitter-timeline" data-theme="dark" data-height="' +
        escapeHtml(w.height) +
        '" href="' +
        escapeHtml(w.profileUrl) +
        '">Timeline</a>';
    }
  }

  function renderTelegramEmbed(slot, widget) {
    var w = normalizeWidget(widget);
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-width", "100%");
    if (w.dark) {
      script.setAttribute("data-dark", "1");
    }

    if (w.type === "post") {
      script.setAttribute("data-telegram-post", w.post);
    } else if (w.type === "discussion") {
      script.setAttribute("data-telegram-discussion", w.post);
      script.setAttribute("data-comments-limit", String(w.commentsLimit));
      script.setAttribute("data-height", String(w.height));
    }

    script.onerror = function () {
      addFallback(slot, "Telegram widget โหลดไม่สำเร็จ โปรดตรวจ connection หรือค่าโพสต์ใน PAGE_CONFIG");
    };

    slot.appendChild(script);
    window.setTimeout(function () {
      if (!slot.querySelector("iframe")) {
        addFallback(slot, "ไม่พบ Telegram widget หลังโหลด โปรดตรวจว่าโพสต์เป็น public และค่า post ถูกต้อง");
      }
    }, 6000);
  }

  function hydrateEmbedWidgets(root, hasXWidgets) {
    var slots = root.querySelectorAll(".embed-slot");
    if (!slots.length) {
      if (hasXWidgets) {
        loadScriptOnce("x-widgets", "https://platform.x.com/widgets.js", 7000).then(function (ok) {
          if (!ok) {
            var row = root.querySelector("#widget-row-slot") || root.querySelector("#widget-top-slot");
            addFallback(row, "X widget script โหลดไม่สำเร็จ โปรดตรวจ connection หรือปิด script blocker");
          }
        });
      }
      return;
    }

    var requireX = hasXWidgets === true;
    slots.forEach(function (slot) {
      if (slot.getAttribute("data-platform") === "x") {
        requireX = true;
      }
    });

    slots.forEach(function (slot) {
      var payload = slot.getAttribute("data-payload");
      if (!payload) {
        return;
      }
      var widget = JSON.parse(payload);
      if (widget.platform === "x") {
        renderXEmbed(slot, widget);
      } else if (widget.platform === "telegram") {
        renderTelegramEmbed(slot, widget);
      }
    });

    if (requireX) {
      loadScriptOnce("x-widgets", "https://platform.x.com/widgets.js", 7000).then(function (ok) {
        if (!ok) {
          var hasXEmbed = false;
          slots.forEach(function (slot) {
            if (slot.getAttribute("data-platform") === "x") {
              hasXEmbed = true;
              addFallback(slot, "X widget โหลดไม่สำเร็จ โปรดตรวจ connection หรือปิด script blocker");
            }
          });
          if (!hasXEmbed) {
            var row = root.querySelector("#widget-row-slot") || root.querySelector("#widget-top-slot");
            addFallback(row, "X widget script โหลดไม่สำเร็จ โปรดตรวจ connection หรือปิด script blocker");
          }
        }
      });
    }
  }

  function renderCampaignPage(config) {
    applySeo(config && config.seo);

    var root = document.getElementById("campaign-root");
    if (!root) {
      return;
    }

    var brand = (config && config.brand) || {};
    var topWidget = normalizeWidget(config && config.topWidget);
    var subWidgets = Array.isArray(config && config.subWidgets) ? config.subWidgets : [];
    var embedWidgets = Array.isArray(config && config.embedWidgets) ? config.embedWidgets : [];
    var bullets = (config && config.bulletBox && Array.isArray(config.bulletBox.items)) ? config.bulletBox.items : [];
    var bulletEnabled = Boolean(config && config.bulletBox && config.bulletBox.enabled);
    var hero = (config && config.hero) || {};
    var cta = (config && config.cta) || {};

    root.innerHTML =
      '<header class="campaign-top">' +
      '<img class="campaign-logo" src="' + escapeHtml(brand.logoSrc || "") + '" alt="' + escapeHtml(brand.logoAlt || "logo") + '">' +
      '<div class="widget-top-slot" id="widget-top-slot"></div>' +
      "</header>" +
      '<div class="campaign-divider"></div>' +
      (bulletEnabled && bullets.length
        ? '<section class="bullet-box"><ul class="bullet-list">' +
          bullets.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") +
          "</ul></section>"
        : "") +
      '<section class="campaign-content">' +
      '<h1 class="campaign-title">' + escapeHtml(hero.title || "") + "</h1>" +
      '<div id="campaign-body-slot"></div>' +
      '<div class="widget-row" id="widget-row-slot"></div>' +
      '<div class="embed-grid" id="embed-grid-slot"></div>' +
      "</section>";

    var topSlot = root.querySelector("#widget-top-slot");
    var topButton = buildWidgetButton(topWidget);
    if (topButton) {
      topSlot.appendChild(topButton);
    }

    var bodySlot = root.querySelector("#campaign-body-slot");
    bodySlot.appendChild(buildBody(config && config.campaignBody));

    var rowSlot = root.querySelector("#widget-row-slot");
    subWidgets.forEach(function (widget) {
      var button = buildWidgetButton(widget);
      if (button) {
        rowSlot.appendChild(button);
      }
    });

    var embedSlot = root.querySelector("#embed-grid-slot");
    embedWidgets.forEach(function (widget) {
      var card = buildEmbedCard(widget);
      if (card) {
        embedSlot.appendChild(card);
      }
    });

    var oldCta = document.querySelector(".floating-cta");
    if (oldCta) {
      oldCta.remove();
    }
    var ctaBtn = document.createElement("a");
    ctaBtn.className = "floating-cta";
    ctaBtn.textContent = cta.text || "";
    ctaBtn.href = cta.href || "#";
    if (!cta.enabled) {
      ctaBtn.hidden = true;
    }
    ctaBtn.target = "_blank";
    ctaBtn.rel = "noopener";
    document.body.appendChild(ctaBtn);

    var allWidgets = [];
    if (topWidget && topWidget.enabled) {
      allWidgets.push(topWidget);
    }
    subWidgets.forEach(function (widget) {
      var normalized = normalizeWidget(widget);
      if (normalized && normalized.enabled) {
        allWidgets.push(normalized);
      }
    });
    embedWidgets.forEach(function (widget) {
      var normalizedEmbed = normalizeWidget(widget);
      if (normalizedEmbed && normalizedEmbed.enabled) {
        allWidgets.push(normalizedEmbed);
      }
    });

    var hasXWidgets = allWidgets.some(function (widget) {
      return widget.platform === "x";
    });

    hydrateEmbedWidgets(root, hasXWidgets);
  }

  window.renderCampaignPage = renderCampaignPage;
})();
