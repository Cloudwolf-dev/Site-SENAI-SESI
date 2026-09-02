/**
 * Novo Template SESI/SENAI Amapá — comportamento compartilhado
 * Mega-menu, busca, acessibilidade e menu mobile (offcanvas).
 */
(function () {
  "use strict";

  function closeAllMegaMenus(except) {
    document.querySelectorAll(".mainnav-menu > li.open").forEach(function (li) {
      if (li !== except) {
        li.classList.remove("open");
        var toggle = li.querySelector(":scope > a");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function closeSearchPanel(except) {
    document.querySelectorAll(".nav-search.open").forEach(function (el) {
      if (el !== except) el.classList.remove("open");
    });
  }

  function closeAccessibilityMenu(except) {
    document.querySelectorAll(".accessibility-dropdown.open").forEach(function (el) {
      if (el !== except) el.classList.remove("open");
    });
  }

  function closeTopbarMenu(except) {
    document.querySelectorAll(".topbar-menu.open").forEach(function (el) {
      if (el !== except) {
        el.classList.remove("open");
        var toggle = el.querySelector(".topbar-toggler");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* ---------------- Mega-menu ---------------- */
    document.querySelectorAll(".mainnav-menu > li").forEach(function (li) {
      var toggle = li.querySelector(":scope > a");
      var panel = li.querySelector(".mega-panel");
      if (!panel || !toggle) return;

      toggle.setAttribute("aria-haspopup", "true");
      toggle.setAttribute("aria-expanded", "false");

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        var isOpen = li.classList.contains("open");
        closeAllMegaMenus();
        closeSearchPanel();
        if (!isOpen) {
          li.classList.add("open");
          toggle.setAttribute("aria-expanded", "true");
        }
      });
    });

    /* ---------------- Abas de navegação -> painéis de acesso rápido ---------------- */
    var navTabs = document.querySelectorAll(".navtab");
    var quickPanels = document.querySelectorAll(".shortcuts-grid[data-panel]");

    if (navTabs.length && quickPanels.length) {
      function activatePanel(panelId) {
        navTabs.forEach(function (btn) {
          var isMatch = btn.getAttribute("data-panel") === panelId;
          btn.classList.toggle("active", isMatch);
          btn.setAttribute("aria-selected", String(isMatch));
        });
        quickPanels.forEach(function (panel) {
          panel.classList.toggle("active", panel.getAttribute("data-panel") === panelId);
        });
      }

      navTabs.forEach(function (btn) {
        btn.addEventListener("click", function () {
          activatePanel(btn.getAttribute("data-panel"));
          if (typeof closeMobileMenu === "function") closeMobileMenu();
        });
      });
    }

    /* ---------------- Busca (mega-panel) ---------------- */
    var searchWrap = document.querySelector(".nav-search");
    if (searchWrap) {
      var searchToggle = searchWrap.querySelector(".nav-search-toggle");
      searchToggle.addEventListener("click", function (e) {
        e.preventDefault();
        var isOpen = searchWrap.classList.contains("open");
        closeAllMegaMenus();
        closeSearchPanel();
        if (!isOpen) {
          searchWrap.classList.add("open");
          var input = searchWrap.querySelector("input[type='search'], input[type='text']");
          if (input) setTimeout(function () { input.focus(); }, 50);
        }
      });
    }

    /* ---------------- Fechar ao clicar fora ---------------- */
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".mainnav-menu > li")) closeAllMegaMenus();
      if (!e.target.closest(".nav-search")) closeSearchPanel();
      if (!e.target.closest(".accessibility-dropdown")) closeAccessibilityMenu();
      if (!e.target.closest(".topbar-menu")) closeTopbarMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeAllMegaMenus();
        closeSearchPanel();
        closeAccessibilityMenu();
        closeTopbarMenu();
        closeMobileMenu();
      }
    });

    /* ---------------- Acessibilidade ---------------- */
    var accWrap = document.querySelector(".accessibility-dropdown");
    if (accWrap) {
      var accToggle = accWrap.querySelector(".accessibility-toggle");
      accToggle.addEventListener("click", function (e) {
        e.preventDefault();
        var isOpen = accWrap.classList.contains("open");
        closeAccessibilityMenu();
        accWrap.classList.toggle("open", !isOpen);
      });
    }

    /* ---------------- Topbar institucional (mobile) ---------------- */
    var topbarWrap = document.querySelector(".topbar-menu");
    if (topbarWrap) {
      var topbarToggle = topbarWrap.querySelector(".topbar-toggler");
      topbarToggle.addEventListener("click", function (e) {
        e.preventDefault();
        var isOpen = topbarWrap.classList.contains("open");
        closeTopbarMenu();
        topbarWrap.classList.toggle("open", !isOpen);
        topbarToggle.setAttribute("aria-expanded", String(!isOpen));
      });
    }

    var fontStep = 0; // 0 = normal, 1 = font-lg, 2 = font-xl
    var fontClasses = ["", "font-lg", "font-xl"];
    function applyFontStep() {
      document.body.classList.remove("font-lg", "font-xl");
      if (fontClasses[fontStep]) document.body.classList.add(fontClasses[fontStep]);
    }
    var incBtn = document.querySelector("[data-action='font-increase']");
    var decBtn = document.querySelector("[data-action='font-decrease']");
    if (incBtn) incBtn.addEventListener("click", function () {
      fontStep = Math.min(fontStep + 1, fontClasses.length - 1);
      applyFontStep();
    });
    if (decBtn) decBtn.addEventListener("click", function () {
      fontStep = Math.max(fontStep - 1, 0);
      applyFontStep();
    });

    var contrastBtn = document.querySelector("[data-action='contrast']");
    if (contrastBtn) contrastBtn.addEventListener("click", function () {
      document.body.classList.toggle("high-contrast");
    });

    /* ---------------- Menu mobile (offcanvas) ---------------- */
    var mobileToggle = document.querySelector(".mainnav-toggler");
    var mobileMenu = document.querySelector(".mainnav-menu");
    var backdrop = document.querySelector(".nav-backdrop");

    window.closeMobileMenu = function () {
      if (mobileMenu) mobileMenu.classList.remove("open");
      if (backdrop) backdrop.classList.remove("open");
      if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
    };

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener("click", function () {
        var isOpen = mobileMenu.classList.contains("open");
        if (isOpen) {
          closeMobileMenu();
        } else {
          mobileMenu.classList.add("open");
          if (backdrop) backdrop.classList.add("open");
          mobileToggle.setAttribute("aria-expanded", "true");
        }
      });
    }
    if (backdrop) backdrop.addEventListener("click", closeMobileMenu);

    /* ---------------- Banner em accordion ---------------- */
    document.querySelectorAll(".hero-accordion").forEach(function (group) {
      var cards = group.querySelectorAll(".accordion-card");
      function activate(card) {
        cards.forEach(function (c) {
          var isTarget = c === card;
          c.classList.toggle("active", isTarget);
          c.setAttribute("aria-expanded", isTarget ? "true" : "false");
        });
      }
      cards.forEach(function (card) {
        card.addEventListener("click", function () {
          if (!card.classList.contains("active")) activate(card);
        });
        card.addEventListener("keydown", function (e) {
          if ((e.key === "Enter" || e.key === " ") && !card.classList.contains("active")) {
            e.preventDefault();
            activate(card);
          }
        });
      });
    });

    /* ---------------- Carrossel "Por que estudar" ---------------- */
    document.querySelectorAll(".reasons-carousel-block").forEach(function (block) {
      var track = block.querySelector(".reasons-track");
      var cards = track ? track.querySelectorAll(".reason-card") : [];
      var prevBtn = block.querySelector(".reasons-nav.prev");
      var nextBtn = block.querySelector(".reasons-nav.next");
      var dotsWrap = block.querySelector(".reasons-dots");
      if (!track || !cards.length) return;

      dotsWrap.innerHTML = "";
      cards.forEach(function (card, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Ir para o motivo " + (i + 1));
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", function () {
          card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        });
        dotsWrap.appendChild(dot);
      });
      var dots = dotsWrap.querySelectorAll("button");

      function cardStep() {
        var style = getComputedStyle(track);
        var gap = parseFloat(style.columnGap || style.gap || 0) || 0;
        return cards[0].getBoundingClientRect().width + gap;
      }

      if (prevBtn) prevBtn.addEventListener("click", function () {
        track.scrollBy({ left: -cardStep(), behavior: "smooth" });
      });
      if (nextBtn) nextBtn.addEventListener("click", function () {
        track.scrollBy({ left: cardStep(), behavior: "smooth" });
      });

      var scrollTimeout;
      track.addEventListener("scroll", function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function () {
          var index = Math.round(track.scrollLeft / cardStep());
          index = Math.max(0, Math.min(index, dots.length - 1));
          dots.forEach(function (d, i) { d.classList.toggle("active", i === index); });
        }, 80);
      });
    });
  });
})();
