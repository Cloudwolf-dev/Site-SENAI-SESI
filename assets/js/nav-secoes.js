/**
 * SENAI Amapá — Navegação por seções
 * Menu em abas: cada item do menu troca a seção exibida no <main>.
 * O restante do comportamento (busca, acessibilidade, banner, filtros de
 * curso, menu mobile) continua vindo de assets/js/main.js.
 *
 * Funciona em dois modos, decididos pela presença de `.nav-page` no documento:
 *
 * - modo abas (para-voce/index.html, para-empresa/index.html): as seções vivem
 *   na mesma página e o clique nas abas troca qual está visível;
 * - modo página (para-voce/cursos/index.html): a página é um documento
 *   próprio, as abas são links normais e o script só marca/posiciona a aba
 *   atual, lida de `<body data-nav-current="...">`.
 *
 * As seções e seus rótulos saem do próprio menu, não de uma lista fixa aqui:
 * é o que permite o mesmo arquivo servir "Para você" (que tem Cursos) e
 * "Para empresas" (que tem Serviços), e acrescentar/renomear uma seção sem
 * mexer no JS. O rótulo usado no breadcrumb vem de `data-nav-label` quando
 * ele difere do texto da aba — caso de "Início", que no caminho é o nome do
 * público ("Para você" / "Para empresas").
 */
(function () {
  "use strict";

  var menu = document.getElementById("mainMenu");
  if (!menu) return;

  var order = [];
  var labels = {};
  Array.prototype.forEach.call(menu.querySelectorAll("a[data-nav]"), function (link) {
    var id = link.getAttribute("data-nav");
    if (!id || order.indexOf(id) !== -1) return;
    order.push(id);
    labels[id] = (link.getAttribute("data-nav-label") || link.textContent).trim();
  });
  if (!order.length) return;

  var pages = {};
  var hasPages = false;
  order.forEach(function (id) {
    pages[id] = document.querySelector('.nav-page[data-page="' + id + '"]');
    if (pages[id]) hasPages = true;
  });

  var indicator = menu.querySelector(".mainnav-tab-indicator");
  var crumb = document.getElementById("navCrumb");
  var crumbRoot = document.getElementById("navCrumbRoot");

  // A primeira aba do menu é a seção padrão (o "Início" de cada lado).
  var raiz = order[0];

  function fromHash() {
    var hash = location.hash.slice(1);
    return order.indexOf(hash) !== -1 ? hash : raiz;
  }

  var current = hasPages ? fromHash() : (document.body.getAttribute("data-nav-current") || "");

  function moveIndicator() {
    if (!indicator) return;
    var link = menu.querySelector('a[data-nav="' + current + '"]');
    // Sem link visível (menu recolhido no mobile) o indicador não faz sentido.
    if (!link || !link.offsetWidth) {
      indicator.style.opacity = "0";
      return;
    }
    // Medido por rect, não por offsetLeft: o <li> do template já é
    // position:relative, então offsetLeft do link seria sempre 0.
    var menuRect = menu.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();
    indicator.style.opacity = "1";
    indicator.style.width = linkRect.width + "px";
    indicator.style.transform = "translateX(" + (linkRect.left - menuRect.left) + "px)";
  }

  function syncCrumb() {
    if (!crumb || !crumbRoot) return;
    if (current === raiz) {
      crumb.hidden = true;
      crumbRoot.className = "current";
      crumbRoot.textContent = labels[raiz];
    } else {
      crumb.hidden = false;
      crumb.textContent = labels[current];
      crumbRoot.className = "";
      crumbRoot.innerHTML = '<a href="#' + raiz + '" data-nav="' + raiz + '">' +
                            labels[raiz] + "</a>";
    }
  }

  function syncActive() {
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-nav") === current);
    });
    moveIndicator();
    syncCrumb();
  }

  function activate(id, pushHistory) {
    if (!pages[id]) return;
    if (typeof window.closeMobileMenu === "function") window.closeMobileMenu();

    if (id !== current) {
      var dir = order.indexOf(id) > order.indexOf(current) ? 1 : -1;
      var next = pages[id];

      pages[current].classList.remove("is-active");
      next.classList.remove("from-left", "from-right");
      next.classList.add(dir > 0 ? "from-right" : "from-left");
      void next.offsetWidth; // aplica a posição inicial antes de animar
      next.classList.add("is-active");
      next.classList.remove("from-left", "from-right");

      current = id;
      syncActive();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (pushHistory !== false) history.pushState(null, "", "#" + id);
  }

  window.addEventListener("resize", moveIndicator);

  if (hasPages) {
    document.addEventListener("click", function (e) {
      var target = e.target.closest("[data-nav]");
      if (!target) return;
      e.preventDefault();
      activate(target.getAttribute("data-nav"));
    });

    window.addEventListener("popstate", function () {
      activate(fromHash(), false);
    });

    // Estado inicial: respeita o #hash da URL sem animar nem empilhar histórico.
    order.forEach(function (id) {
      pages[id].classList.toggle("is-active", id === current);
    });
  }

  syncActive();
  window.setTimeout(moveIndicator, 80);
})();
