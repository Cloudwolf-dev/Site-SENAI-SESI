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

    /* ---------------- Filtros de cursos (página /cursos) ----------------
       Cada grupo (status / modalidade / oferta) filtra numa dimensão própria;
       os grupos combinam entre si (E lógico), então dá pra usar os filtros
       de cima e o painel lateral ao mesmo tempo. */
    var coursesGrid = document.getElementById("coursesGrid");
    if (coursesGrid) {
      var courseCards = Array.prototype.slice.call(coursesGrid.querySelectorAll(".course-card"));
      var facetControls = document.querySelectorAll("[data-facet-group]");
      var coursesCountEl = document.getElementById("coursesCount");
      var coursesEmptyEl = document.getElementById("coursesEmpty");
      var activeFacets = {};

      var cardHasFacet = function (card, facet) {
        return (card.getAttribute("data-facets") || "").split(" ").indexOf(facet) !== -1;
      };
      var countFor = function (facet) {
        if (facet === "all") return courseCards.length;
        return courseCards.filter(function (card) { return cardHasFacet(card, facet); }).length;
      };
      var applyFilters = function () {
        var groups = Object.keys(activeFacets);
        var visible = 0;
        courseCards.forEach(function (card) {
          var match = groups.every(function (group) { return cardHasFacet(card, activeFacets[group]); });
          card.classList.toggle("is-hidden", !match);
          if (match) visible++;
        });
        if (coursesCountEl) coursesCountEl.textContent = visible;
        if (coursesEmptyEl) coursesEmptyEl.classList.toggle("is-visible", visible === 0);
      };
      var syncGroupButtons = function (group) {
        facetControls.forEach(function (el) {
          if (el.getAttribute("data-facet-group") !== group) return;
          var elFacet = el.getAttribute("data-facet");
          var isActive = elFacet === "all" ? !activeFacets[group] : activeFacets[group] === elFacet;
          el.classList.toggle("is-active", isActive);
        });
      };
      var setGroupFacet = function (group, facet) {
        if (facet === "all") {
          delete activeFacets[group];
        } else {
          activeFacets[group] = facet;
        }
        syncGroupButtons(group);
        applyFilters();
      };

      facetControls.forEach(function (el) {
        var count = el.querySelector(".count");
        if (count) count.textContent = "(" + countFor(el.getAttribute("data-facet")) + ")";
      });

      document.addEventListener("click", function (e) {
        if (e.target.closest("[data-reset-filters]")) {
          e.preventDefault();
          activeFacets = {};
          facetControls.forEach(function (el) {
            el.classList.toggle("is-active", el.getAttribute("data-facet") === "all");
          });
          if (areaDropdown) {
            areaToggleText.textContent = "Área";
            areaDropdown.classList.remove("has-selection");
          }
          applyFilters();
          return;
        }

        var chip = e.target.closest("[data-facet-group]");
        if (!chip) return;
        e.preventDefault();
        var group = chip.getAttribute("data-facet-group");
        var facet = chip.getAttribute("data-facet");

        if (facet === "all") {
          setGroupFacet(group, "all");
          return;
        }
        var isSame = activeFacets[group] === facet;
        setGroupFacet(group, isSame ? "all" : facet);
      });

      applyFilters();

      /* ---------------- Dropdown de área ---------------- */
      var areaDropdown = document.getElementById("areaDropdown");
      if (areaDropdown) {
        var areaToggle = areaDropdown.querySelector(".course-area-toggle");
        var areaToggleText = areaDropdown.querySelector(".course-area-toggle-text");
        var areaMenu = areaDropdown.querySelector(".course-area-menu");

        var closeAreaDropdown = function () {
          areaDropdown.classList.remove("is-open");
          areaToggle.setAttribute("aria-expanded", "false");
        };

        areaToggle.addEventListener("click", function (e) {
          e.stopPropagation();
          var isOpen = areaDropdown.classList.toggle("is-open");
          areaToggle.setAttribute("aria-expanded", String(isOpen));
        });

        areaMenu.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-facet]");
          if (!btn) return;
          areaToggleText.textContent = btn.getAttribute("data-label") || "Área";
          areaDropdown.classList.toggle("has-selection", btn.getAttribute("data-facet") !== "all");
          closeAreaDropdown();
        });

        document.addEventListener("click", function (e) {
          if (!areaDropdown.contains(e.target)) closeAreaDropdown();
        });
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape") closeAreaDropdown();
        });
      }
    }
  });
})();
