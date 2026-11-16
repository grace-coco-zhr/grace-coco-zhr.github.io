/* 张浩然 · 项目展示 — 交互
   原则：正文直接可读；JS 负责进场、数字、复制、灯箱、截图标签页和目录高亮。 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 平时常显；仅陪驾轮播占据视口时收起，进入 / 离开使用不同阈值。
  var nav = document.querySelector(".nav");
  if (nav) {
    var root = document.documentElement;
    var navGallery = document.querySelector('[data-carousel]');
    var galleryDominant = false, navFrame = 0;
    function updateNav() {
      navFrame = 0;
      root.classList.toggle("is-nav-hidden", galleryDominant && !nav.contains(document.activeElement));
    }
    function queueNav() { if (!navFrame) navFrame = requestAnimationFrame(updateNav); }
    function updateGallery(ratio) {
      if (ratio >= 0.55) galleryDominant = true;
      else if (ratio <= 0.35) galleryDominant = false;
      updateNav();
    }
    root.classList.remove("is-nav-hidden");
    if (navGallery && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        updateGallery(entries[0].intersectionRatio);
      }, { threshold: [0, 0.35, 0.55, 1] }).observe(navGallery);
    }
    nav.addEventListener("focusin", updateNav);
    nav.addEventListener("focusout", queueNav);
    window.addEventListener("pageshow", function () {
      // 包括浏览器后退恢复滚动位置；不等待一次新的滚动或焦点事件。
      if (navGallery && "IntersectionObserver" in window) {
        var rect = navGallery.getBoundingClientRect();
        var visible = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        updateGallery(rect.height ? visible / rect.height : 0);
      } else updateNav();
    });
  }

  // 页面进场：挂 class，让 CSS 接管首屏的交错显现
  window.addEventListener("load", function () {
    document.documentElement.classList.add("is-loaded");
  });

  // 滚动显现
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  // 数字滚动：data-count="9803" data-decimals="1"
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var dur = 1400, start = null;
    function fmt(v) {
      var s = v.toFixed(decimals);
      var parts = s.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }
    if (reduce) { el.textContent = fmt(target); return; }
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  // 复制联系方式
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.classList.add("is-done");
        var label = btn.querySelector("[data-copy-label]");
        var old = label ? label.textContent : "";
        if (label) label.textContent = "已复制";
        setTimeout(function () { btn.classList.remove("is-done"); if (label) label.textContent = old; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
      } else { fallback(text); done(); }
    });
  });
  function fallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  // 截图标签页：点击、左右方向键、Home / End；Tab 进入当前面板
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    var tabList = group.querySelector('[role="tablist"]');
    var rail = group.querySelector('.demo-tabs__rail');
    function updateScrollHint() {
      if (rail) rail.classList.toggle('has-more', tabList.scrollWidth - tabList.clientWidth - tabList.scrollLeft > 2);
    }
    tabList.addEventListener('scroll', updateScrollHint, { passive: true });
    window.addEventListener('resize', updateScrollHint);
    if ('ResizeObserver' in window) new ResizeObserver(updateScrollHint).observe(tabList);
    document.fonts.ready.then(updateScrollHint);
    updateScrollHint();
    function selectTab(current, focus) {
      tabs.forEach(function (tab) {
        var selected = tab === current;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) current.focus({ preventScroll: true });
      var list = current.parentElement;
      var left = current.offsetLeft - list.offsetLeft;
      if (left < list.scrollLeft) list.scrollLeft = left;
      else if (left + current.offsetWidth > list.scrollLeft + list.clientWidth) {
        list.scrollLeft = left + current.offsetWidth - list.clientWidth;
      }
      updateScrollHint();
    }
    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { selectTab(tab, false); });
      tab.addEventListener("keydown", function (event) {
        var next;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectTab(tabs[next], true);
      });
    });
  });

  // 陪驾轮播：保留原图与文案，位置由 CSS 插值；连续操作只排队最后一次意图。
  document.querySelectorAll("[data-carousel]").forEach(function (group) {
    var tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute("aria-controls")); });
    var images = panels.map(function (panel) { return panel.querySelector("img"); });
    var shots = panels.map(function (panel) { return panel.querySelector(".shot"); });
    var list = group.querySelector('[role="tablist"]');
    var indicator = group.querySelector('.demo-carousel__indicator');
    var rail = group.querySelector(".demo-tabs__rail");
    var stage = group.querySelector(".demo-carousel__stage");
    var captions = group.querySelector(".demo-carousel__captions");
    var prev = group.querySelector(".demo-carousel__arrow--prev");
    var next = group.querySelector(".demo-carousel__arrow--next");
    var count = group.querySelector(".demo-carousel__count");
    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var active = 0, desired = 0, busy = false, swipe = null, suppressClickUntil = 0;
    var captionEls = panels.map(function (panel, index) {
      var caption = document.createElement("div");
      var title = document.createElement("h3");
      var text = document.createElement("p");
      caption.className = "demo-carousel__caption";
      title.textContent = tabs[index].textContent;
      text.textContent = panel.querySelector("figcaption").textContent;
      caption.append(title, text);
      captions.appendChild(caption);
      panel.hidden = false;
      panel.tabIndex = -1;
      // aria-label 提供页码和名称；aria-labelledby 会覆盖它，因此只在页签上保留关联。
      panel.removeAttribute("aria-labelledby");
      panel.setAttribute("aria-roledescription", "slide");
      panel.setAttribute("aria-label", "第 " + (index + 1) + " 页，共 " + panels.length + " 页：" + title.textContent);
      shots[index].setAttribute("role", "button");
      shots[index].setAttribute("aria-label", "放大查看" + title.textContent);
      images[index].loading = "eager";
      images[index].draggable = false;
      images[index].addEventListener("load", function () { if (index === active) resizeStage(); });
      return caption;
    });

    function updateRail() {
      rail.classList.toggle("has-more", list.scrollWidth - list.clientWidth - list.scrollLeft > 2);
    }
    function resizeStage() {
      group.style.setProperty('--content-left', group.parentElement.getBoundingClientRect().left + 'px');
      var desktop = window.matchMedia('(min-width: 641px)').matches;
      var maxWidth = desktop ? stage.clientWidth * .78 : stage.clientWidth - 24;
      var maxHeight = Infinity;
      if (desktop) {
        var surfaceStyle = getComputedStyle(group.querySelector('.demo-carousel__surface'));
        var captionStyle = getComputedStyle(captions);
        var countStyle = getComputedStyle(count);
        // 48px 舞台阴影留白 + 48px 视口上下留白；其余按字体与换行后的实际高度。
        var chrome = rail.offsetHeight + parseFloat(surfaceStyle.paddingTop) + captions.offsetHeight +
          parseFloat(captionStyle.marginBottom) + count.offsetHeight + parseFloat(countStyle.marginTop) + 96;
        group.style.setProperty('--carousel-chrome', chrome + 'px');
        maxHeight = Math.max(1, window.innerHeight - chrome);
      } else {
        group.style.removeProperty('--carousel-chrome');
      }
      var activeWidth = maxWidth;
      images.forEach(function (image, index) {
        var w = image.naturalWidth || Number(image.getAttribute('width')) || 2000;
        var h = image.naturalHeight || Number(image.getAttribute('height')) || 1093;
        var fittedWidth = Math.min(maxWidth, maxHeight * w / h);
        panels[index].style.setProperty('--slide-width', fittedWidth + 'px');
        if (index === active) activeWidth = fittedWidth;
      });
      group.style.setProperty('--active-slide-width', activeWidth + 'px');
      var img = images[active];
      var width = img.naturalWidth || Number(img.getAttribute("width")) || 2000;
      var height = img.naturalHeight || Number(img.getAttribute("height")) || 1093;
      stage.style.height = (activeWidth * height / width + (desktop ? 48 : 56)) + "px";
      var tab = tabs[active];
      indicator.style.width = tab.offsetWidth + 'px';
      indicator.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
    function sync() {
      tabs.forEach(function (tab, index) {
        var current = index === active;
        var distance = index - active;
        tab.setAttribute("aria-selected", String(current));
        tab.tabIndex = current ? 0 : -1;
        panels[index].style.setProperty("--slide-x", (Math.sign(distance) * 94) + "%");
        panels[index].classList.toggle("is-current", current);
        panels[index].classList.toggle("is-neighbor", Math.abs(distance) === 1);
        panels[index].setAttribute("aria-hidden", String(!current));
        shots[index].tabIndex = current ? 0 : -1;
        captionEls[index].classList.toggle("is-current", current);
        captionEls[index].setAttribute("aria-hidden", String(!current));
      });
      [prev, next].forEach(function (button, index) {
        var unavailable = index === 0 ? active === 0 : active === panels.length - 1;
        button.setAttribute("aria-disabled", String(unavailable));
        button.tabIndex = unavailable ? -1 : 0;
        // 隐藏边界箭头时把焦点交回当前页签，避免焦点留在不可见按钮上。
        if (unavailable && document.activeElement === button) tabs[active].focus({ preventScroll: true });
      });
      count.firstChild.textContent = (active + 1) + " / " + panels.length;
      count.querySelector("span").textContent = " · " + tabs[active].textContent;
      // 只滚动页签轨道，不让页面或整张画廊跟着滚动。
      var tab = tabs[active], left = tab.offsetLeft;
      if (left < list.scrollLeft + 5 || left + tab.offsetWidth > list.scrollLeft + list.clientWidth - 5) {
        list.scrollTo({ left: Math.max(0, left - (list.clientWidth - tab.offsetWidth) / 2), behavior: motion.matches ? 'instant' : 'smooth' });
      }
      updateRail();
      resizeStage();
    }
    async function go(index, focusTab) {
      desired = Math.max(0, Math.min(panels.length - 1, index));
      if (focusTab) tabs[desired].focus({ preventScroll: true });
      if (busy || desired === active) return;
      busy = true;
      var target = desired;
      // 目标解码后才启动，避免第一次访问某页时出现空白图片。
      try { await images[target].decode(); } catch (error) { /* 加载异常仍保留图片的替代文本。 */ }
      var old = active;
      var oldShotFocused = document.activeElement === shots[old];
      if (motion.matches) {
        // 减少动态效果时保留静态侧边预览，主图在原位交叉淡入淡出。
        var outgoing = shots[old].cloneNode(true);
        outgoing.classList.add("demo-carousel__fadeout");
        outgoing.removeAttribute("role");
        outgoing.setAttribute("aria-hidden", "true");
        outgoing.setAttribute("inert", "");
        outgoing.tabIndex = -1;
        // 下一页可能按高度缩窄，淡出副本保留离场时的原尺寸。
        var outgoingWidth = panels[old].getBoundingClientRect().width;
        outgoing.style.width = outgoingWidth + "px";
        outgoing.style.left = "calc((100% - " + outgoingWidth + "px) / 2)";
        stage.appendChild(outgoing);
        outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }).finished.then(function () { outgoing.remove(); });
      }
      panels[old].classList.add("is-departing");
      active = target;
      sync();
      if (oldShotFocused) shots[active].focus({ preventScroll: true });
      window.setTimeout(function () {
        panels[old].classList.remove("is-departing");
        busy = false;
        if (desired !== active) go(desired, false);
      }, motion.matches ? 250 : 600);
    }
    tabs.forEach(function (tab, index) { tab.addEventListener("click", function () { go(index, false); }); });
    prev.addEventListener("click", function () { if (prev.getAttribute("aria-disabled") !== "true") go(desired - 1, false); });
    next.addEventListener("click", function () { if (next.getAttribute("aria-disabled") !== "true") go(desired + 1, false); });
    group.addEventListener("keydown", function (event) {
      if (document.querySelector(".lightbox.is-open") || event.altKey || event.ctrlKey || event.metaKey) return;
      var target;
      if (event.key === "ArrowRight") target = desired + 1;
      else if (event.key === "ArrowLeft") target = desired - 1;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = panels.length - 1;
      else if ((event.key === "Enter" || event.key === " ") && event.target === shots[active]) {
        event.preventDefault(); shots[active].click(); return;
      } else return;
      event.preventDefault();
      go(target, event.target.getAttribute("role") === "tab");
    });
    // 在捕获阶段拦下预览与滑动产生的点击，避免冒泡给原有灯箱。
    stage.addEventListener("click", function (event) {
      var panel = event.target.closest(".demo-tabs__panel");
      if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); return; }
      if (!panel) return;
      var index = panels.indexOf(panel);
      if (index !== active) {
        event.preventDefault(); event.stopPropagation();
        if (Math.abs(index - active) === 1) go(index, false);
      }
    }, true);
    stage.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" || !event.isPrimary) return;
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }, { passive: true });
    stage.addEventListener("pointerup", function (event) {
      if (!swipe || swipe.id !== event.pointerId) return;
      var dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
      suppressClickUntil = performance.now() + 400;
      go(desired + (dx < 0 ? 1 : -1), false);
    }, { passive: true });
    stage.addEventListener("pointercancel", function () { swipe = null; }, { passive: true });
    list.addEventListener("scroll", updateRail, { passive: true });
    var resizeFrame = 0;
    function queueResize() {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(function () { resizeFrame = 0; resizeStage(); updateRail(); });
    }
    if ("ResizeObserver" in window) {
      var resizeObserver = new ResizeObserver(queueResize);
      [group.parentElement, rail, captions].forEach(function (el) { resizeObserver.observe(el); });
    }
    window.addEventListener("resize", queueResize);
    document.fonts.ready.then(function () { resizeStage(); updateRail(); });
    var zoomHint = document.createElement('p');
    zoomHint.className = 'demo-carousel__hint';
    zoomHint.textContent = '点击图片放大 · 左右滑动切换';
    count.after(zoomHint);
    group.classList.add("is-ready");
    sync();
    // 全宽舞台进入视口时让正文侧目录退场，留出完整的展示空间。
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        group.closest('.proj-body').classList.toggle('is-gallery-visible', entries[0].isIntersecting);
      }, { threshold: 0 }).observe(group);
    }
  });

  // 原生 details 的语义与无脚本回退不变；展开和收起都按内容实际高度过渡。
  document.querySelectorAll('.project-details').forEach(function (details) {
    var summary = details.querySelector('summary');
    var animation = null, expanded = details.open;
    summary.addEventListener('click', function (event) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      event.preventDefault();
      var start = details.getBoundingClientRect().height;
      if (animation) animation.cancel();
      expanded = !expanded;
      details.open = true;
      details.style.overflow = 'hidden';
      var end = expanded ? details.scrollHeight : summary.getBoundingClientRect().height;
      var current = details.animate([{height:start+'px'}, {height:end+'px'}], {
        duration:350, easing:'cubic-bezier(0.22,1,0.36,1)'
      });
      animation = current;
      current.finished.then(function () {
        if (animation !== current) return;
        details.open = expanded;
        details.style.overflow = '';
        animation = null;
      }, function () {});
    });
  });

  // 灯箱
  var shots = document.querySelectorAll(".shot, .proj-cover");
  if (shots.length) {
    var lb = document.createElement("figure");
    lb.className = "lightbox";
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '截图预览');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = '<div class="lightbox__viewport" tabindex="0" aria-label="图片区域，放大后可滚动查看"><img alt="" draggable="false"></div><figcaption><span></span><button class="lightbox__zoom" type="button" aria-pressed="false">放大细节</button></figcaption><button class="lightbox__close" type="button" aria-label="关闭图片预览">×</button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption span");
    var viewport = lb.querySelector('.lightbox__viewport'), zoomButton = lb.querySelector('.lightbox__zoom');
    var returnFocus, oldOverflow, inertSiblings = [], drag = null, dragged = false;
    function close() {
      if (!lb.classList.contains('is-open')) return;
      lb.classList.remove('is-open', 'is-zoomed');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = oldOverflow;
      inertSiblings.forEach(function (el) { el.inert = false; });
      inertSiblings = [];
      if (returnFocus) returnFocus.focus({ preventScroll: true });
    }
    function toggleZoom() {
      var zoomed = lb.classList.toggle('is-zoomed');
      lb.style.setProperty('--zoom-width', Math.max(lbImg.naturalWidth, viewport.clientWidth * 2) + 'px');
      zoomButton.setAttribute('aria-pressed', String(zoomed));
      zoomButton.textContent = zoomed ? '适应屏幕' : '放大细节';
      viewport.scrollTo(0, 0);
    }
    shots.forEach(function (s) {
      if (!s.hasAttribute('role')) s.setAttribute('role', 'button');
      if (!s.hasAttribute('tabindex')) s.tabIndex = 0;
      if (!s.hasAttribute('aria-label')) s.setAttribute('aria-label', '放大查看：' + s.querySelector('img').alt);
      if (!s.closest('[data-carousel]')) s.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); s.click(); }
      });
      s.addEventListener("click", function () {
        var img = s.querySelector("img");
        var fig = s.closest("figure");
        var cap = fig ? fig.querySelector("figcaption") : null;
        lbImg.src = img.getAttribute("data-full") || img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = cap ? cap.textContent : img.alt;
        returnFocus = s;
        oldOverflow = document.body.style.overflow;
        lb.classList.remove('is-zoomed');
        zoomButton.textContent = '放大细节';
        zoomButton.setAttribute('aria-pressed', 'false');
        viewport.scrollTo(0, 0);
        lb.classList.add("is-open");
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = "hidden";
        inertSiblings = Array.from(document.body.children).filter(function (el) { return el !== lb && !el.inert; });
        inertSiblings.forEach(function (el) { el.inert = true; });
        lb.querySelector('.lightbox__close').focus({ preventScroll: true });
      });
    });
    zoomButton.addEventListener('click', toggleZoom);
    lbImg.addEventListener('click', function () { if (!dragged) toggleZoom(); });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    viewport.addEventListener('pointerdown', function (e) {
      dragged = false;
      if (e.pointerType !== 'mouse' || !lb.classList.contains('is-zoomed') || e.button !== 0) return;
      drag = { x:e.clientX, y:e.clientY, left:viewport.scrollLeft, top:viewport.scrollTop };
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('is-dragging');
      e.preventDefault();
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) dragged = true;
      viewport.scrollLeft = drag.left + drag.x - e.clientX;
      viewport.scrollTop = drag.top + drag.y - e.clientY;
    });
    function endDrag() { drag = null; viewport.classList.remove('is-dragging'); }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key !== 'Tab') return;
      var targets = [viewport, zoomButton, lb.querySelector('.lightbox__close')];
      var index = targets.indexOf(document.activeElement);
      e.preventDefault();
      targets[(index + (e.shiftKey ? 2 : 1)) % targets.length].focus({ preventScroll: true });
    });
  }

  // 项目页目录高亮
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
          var a = map[e.target.id]; if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) tio.observe(el); });
  }

  // 首页导航高亮
  var navLinks = document.querySelectorAll(".nav__links a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var nmap = {};
    navLinks.forEach(function (a) { nmap[a.getAttribute("href").slice(1)] = a; });
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove("is-active"); });
          var a = nmap[e.target.id]; if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    Object.keys(nmap).forEach(function (id) { var el = document.getElementById(id); if (el) nio.observe(el); });
  }
})();
