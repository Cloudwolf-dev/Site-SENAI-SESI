/**
 * SENAI Amapá — Navegação em 2 níveis (alternativa)
 *
 * Um site só para os dois públicos. O estado da navegação é um par
 * (contexto, seção): o nível 1 escolhe o contexto — Institucional, Para você,
 * Para a indústria, Já sou aluno —, o nível 2 lista as seções DAQUELE
 * contexto e o <main> mostra a seção escolhida. Como no Vivaldi, trocar de
 * aba no nível 1 troca a barra inteira do nível 2.
 *
 * Toda a definição vive no HTML, não aqui: cada contexto é um
 * `<ul class="l2-menu" data-ctx="..." data-ctx-label="..." data-cta-*>` e
 * cada seção é um `<section class="nav-page" data-page="...">`. Acrescentar
 * um contexto ou renomear uma seção é mexer só no HTML — e é o que permite
 * uma mesma seção (Eventos, Programas) aparecer em dois contextos sem ser
 * duplicada no documento.
 *
 * A URL guarda o par como `#contexto/secao`, então recarregar, voltar no
 * histórico ou compartilhar o link cai no mesmo lugar.
 */
(function () {
  "use strict";

  var l2Menus = document.querySelectorAll(".l2-menu[data-ctx]");
  if (!l2Menus.length) return;

  var ctxOrder = [];
  var ctxDef = {};

  Array.prototype.forEach.call(l2Menus, function (menu) {
    var id = menu.getAttribute("data-ctx");
    var pages = [];
    Array.prototype.forEach.call(menu.querySelectorAll("a[data-page]"), function (link) {
      pages.push({ id: link.getAttribute("data-page"), label: link.textContent.trim() });
    });
    ctxOrder.push(id);
    ctxDef[id] = {
      menu: menu,
      label: menu.getAttribute("data-ctx-label") || id,
      pages: pages,
      cta: {
        label: menu.getAttribute("data-cta-label") || "",
        // Na barra de baixo cabem ~10 caracteres: "Agende uma consulta" vira
        // "Consultoria" e só o rótulo do topo fica por extenso.
        short: menu.getAttribute("data-cta-short") || menu.getAttribute("data-cta-label") || "",
        href: menu.getAttribute("data-cta-href") || "#",
        icon: menu.getAttribute("data-cta-icon") || ""
      }
    };
  });

  var raizCtx = ctxOrder[0];
  var cta = document.getElementById("navCta");
  var ctaMobile = document.getElementById("navCtaMobile");
  var crumbCtx = document.getElementById("navCrumbCtx");
  var crumbPage = document.getElementById("navCrumbPage");

  var ctx = raizCtx;
  var page = ctxDef[raizCtx].pages.length ? ctxDef[raizCtx].pages[0].id : "";

  function pageExists(c, p) {
    return ctxDef[c] && ctxDef[c].pages.some(function (item) { return item.id === p; });
  }

  /* `#contexto/secao`; um contexto sozinho cai na primeira seção dele. */
  function fromHash() {
    var parts = decodeURIComponent(location.hash.slice(1)).split("/");
    var c = ctxDef[parts[0]] ? parts[0] : raizCtx;
    var p = pageExists(c, parts[1]) ? parts[1] : ctxDef[c].pages[0].id;
    return { ctx: c, page: p };
  }

  function sectionOf(id) {
    return document.querySelector('.nav-page[data-page="' + id + '"]');
  }

  function syncCta() {
    var def = ctxDef[ctx].cta;
    if (cta) {
      cta.textContent = def.label;
      cta.setAttribute("href", def.href);
    }
    if (ctaMobile) {
      ctaMobile.setAttribute("href", def.href);
      var icon = ctaMobile.querySelector(".tab-cta-circle i");
      var label = ctaMobile.querySelector(".tab-cta-label");
      if (icon && def.icon) icon.className = def.icon;
      if (label) label.textContent = def.short;
      ctaMobile.setAttribute("aria-label", def.label);
    }
  }

  function syncCrumb() {
    if (!crumbCtx || !crumbPage) return;
    var def = ctxDef[ctx];
    var atual = def.pages.filter(function (item) { return item.id === page; })[0];
    crumbCtx.textContent = def.label;
    // Na primeira seção do contexto o caminho pararia em "Para você > Visão
    // geral", que não informa nada — aí o último degrau some.
    var repetido = !atual || (def.pages[0] && atual.id === def.pages[0].id);
    crumbPage.hidden = repetido;
    if (!repetido) crumbPage.textContent = atual.label;
  }

  function syncActive() {
    document.querySelectorAll("[data-ctx]").forEach(function (el) {
      if (el.classList.contains("l2-menu")) return;
      el.classList.toggle("is-active", el.getAttribute("data-ctx") === ctx);
    });
    Array.prototype.forEach.call(l2Menus, function (menu) {
      menu.classList.toggle("is-active", menu.getAttribute("data-ctx") === ctx);
    });
    document.querySelectorAll("a[data-page]").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-page") === page &&
        link.closest(".l2-menu") === ctxDef[ctx].menu);
    });
    document.body.setAttribute("data-ctx", ctx);
    syncCta();
    syncCrumb();
  }

  function activate(nextCtx, nextPage, pushHistory) {
    if (!ctxDef[nextCtx]) return;
    if (!pageExists(nextCtx, nextPage)) nextPage = ctxDef[nextCtx].pages[0].id;

    if (nextPage !== page) {
      var atual = sectionOf(page);
      var proxima = sectionOf(nextPage);
      if (atual) atual.classList.remove("is-active");
      if (proxima) proxima.classList.add("is-active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    ctx = nextCtx;
    page = nextPage;
    syncActive();

    if (pushHistory !== false) history.pushState(null, "", "#" + ctx + "/" + page);
  }

  document.addEventListener("click", function (e) {
    var alvo = e.target.closest("[data-ctx], a[data-page]");
    if (!alvo || alvo.classList.contains("l2-menu")) return;
    // Link de nível 2 que aponta para outra página do site segue o href.
    if (alvo.hasAttribute("data-external")) return;

    var destinoCtx = alvo.getAttribute("data-ctx");
    var destinoPage = alvo.getAttribute("data-page");
    // Num link de seção o contexto é o da barra em que ele está, e não o
    // atributo — assim "Eventos" leva ao Eventos do contexto certo.
    if (destinoPage && !destinoCtx) {
      var barra = alvo.closest(".l2-menu");
      destinoCtx = barra ? barra.getAttribute("data-ctx") : ctx;
    }
    if (!ctxDef[destinoCtx]) return;

    e.preventDefault();
    activate(destinoCtx, destinoPage, true);
  });

  function fromUrl() {
    var estado = fromHash();
    activate(estado.ctx, estado.page, false);
  }

  window.addEventListener("popstate", fromUrl);
  // O CTA e os links vindos de outras páginas do site são href comuns, não
  // passam pelo handler de clique acima — quem os aplica é o hashchange.
  window.addEventListener("hashchange", fromUrl);

  /* Estado inicial: respeita o #hash sem animar nem empilhar histórico. */
  var inicial = fromHash();
  ctx = inicial.ctx;
  page = inicial.page;
  document.querySelectorAll(".nav-page").forEach(function (sec) {
    sec.classList.toggle("is-active", sec.getAttribute("data-page") === page);
  });
  syncActive();
})();
