/**
 * Conceito 2 — navegação em dois níveis, com o topo reorganizado
 *
 * O estado é um par (menu, atalho) dentro de um público. O nível 1 — as abas
 * do navbar — troca o conjunto de atalhos da barra de baixo; o nível 2 é o
 * atalho escolhido dentro daquele conjunto; e o público, na aba do topbar,
 * troca a superfície do navbar e o CTA.
 *
 * Os rótulos não estão aqui: quantos atalhos cada menu tem e como se chamam
 * está no HTML, em <ul class="submenu" data-de="...">. Acrescentar um menu é
 * acrescentar um <li> no nível 1 e um <ul> no nível 2 — o script lê os dois.
 *
 * A URL guarda o estado inteiro como #publico/menu/atalho, então recarregar,
 * voltar no histórico ou compartilhar o link cai no mesmo lugar.
 *
 * Muda em relação ao conceito/: a marca vive no topbar, o topbar também é
 * fixo (então há três alturas a encaixar, não uma) e o público é um toggle
 * de duas posições em vez de um botão que alterna.
 *
 * O resto do comportamento da página — busca, acessibilidade, links
 * institucionais e o banner em accordion — continua vindo de
 * assets/js/main.js, que é o mesmo do site.
 */
(function () {
  "use strict";

  /* --------------------------------------------------------------------
     Público — "Para você" / "Para empresa"
     As duas opções ficam à vista no toggle; o script só marca qual está
     apertada. Não há mais rótulo nem ícone a reescrever.
     -------------------------------------------------------------------- */
  var PUBLICOS = {
    voce: {
      nome: "Para você",
      cta: { rotulo: "Cursos Disponíveis", href: "../para-voce/cursos/index.html", icone: "fa-book-open" }
    },
    empresa: {
      nome: "Para empresa",
      cta: { rotulo: "Agende uma consulta", href: "#", icone: "fa-calendar-check" }
    }
  };

  var toggle = document.querySelector(".publico-toggle");
  var opcoesPublico = toggle ? toggle.querySelectorAll("[data-publico]") : [];
  var cta = document.getElementById("navCta");
  var tabCta = document.getElementById("tabCta");
  var publicoMenu = document.querySelector(".publico-menu");
  var publicoBotao = publicoMenu ? publicoMenu.querySelector(".publico-menu-toggle") : null;
  var publicoAtual = publicoMenu ? publicoMenu.querySelector(".publico-menu-atual") : null;
  var nivel1 = document.getElementById("menuNivel1");
  var subbar = document.querySelector(".subbar");
  var navbar = document.querySelector(".mainnav");
  var marca = document.querySelector(".mainnav-brand");
  var crumbRaiz = document.querySelector(".breadcrumb-modern a[data-menu]");
  var crumbMenu = document.getElementById("navCrumbMenu");
  var crumbSub = document.getElementById("navCrumbSub");

  if (!nivel1 || !subbar) return;

  var conjuntos = subbar.querySelectorAll(".submenu[data-de]");
  // As abas do navbar e as da barra de baixo, no celular, são o mesmo nível
  // 1: marcadas juntas, para quem gira a tela não cair num menu sem destaque.
  var abas = document.querySelectorAll("#menuNivel1 a[data-menu], .mobile-tabbar a[data-menu]");
  var MENU_RAIZ = "inicio";

  var publico = document.body.getAttribute("data-publico") || "voce";
  var menu = MENU_RAIZ;
  var atalho = null;

  var tituloCamada = document.getElementById("nivel2Titulo");
  var voltarCamada = subbar.querySelector(".nivel2-voltar");
  var camadaAberta = false;

  function conjuntoDe(id) {
    return subbar.querySelector('.submenu[data-de="' + id + '"]');
  }

  function rotuloMenu(id) {
    var aba = nivel1.querySelector('a[data-menu="' + id + '"]');
    return aba ? aba.textContent.trim() : "";
  }

  function marcar(links, valor, attr) {
    Array.prototype.forEach.call(links, function (link) {
      // aria-current em vez de uma classe: o estado é informação, não
      // decoração, e o CSS pinta a partir do próprio atributo.
      link.setAttribute("aria-current", link.getAttribute(attr) === valor ? "true" : "false");
    });
  }

  function escreverHash() {
    var partes = [publico, menu];
    if (atalho) partes.push(atalho);
    history.replaceState(null, "", "#" + partes.join("/"));
  }

  /* --------------------------------------------------------------------
     Público
     -------------------------------------------------------------------- */
  function trocarPublico(id, gravarHash) {
    if (!PUBLICOS[id]) id = "voce";
    publico = id;
    document.body.setAttribute("data-publico", id);

    var def = PUBLICOS[id];
    // aria-pressed, e não uma classe: num par de botões que se excluem, é o
    // atributo que diz ao leitor de tela qual está acionado — e é dele que
    // o CSS tira a cor da opção escolhida.
    Array.prototype.forEach.call(opcoesPublico, function (op) {
      op.setAttribute("aria-pressed", op.getAttribute("data-publico") === id ? "true" : "false");
    });
    if (cta) {
      cta.textContent = def.cta.rotulo;
      cta.setAttribute("href", def.cta.href);
    }
    // O botão central da barra de baixo é o mesmo CTA, com ícone.
    if (tabCta) {
      tabCta.setAttribute("href", def.cta.href);
      var rotuloTab = tabCta.querySelector(".tab-cta-label");
      var iconeTab = tabCta.querySelector(".tab-cta-circle i");
      if (rotuloTab) rotuloTab.textContent = def.cta.rotulo;
      if (iconeTab) iconeTab.className = "fa-solid " + def.cta.icone;
    }
    if (crumbRaiz) crumbRaiz.textContent = def.nome;
    if (publicoAtual) publicoAtual.textContent = def.nome;

    if (gravarHash !== false) escreverHash();
  }

  if (toggle) {
    toggle.addEventListener("click", function (e) {
      var opcao = e.target.closest("[data-publico]");
      if (!opcao) return;
      trocarPublico(opcao.getAttribute("data-publico"));
      // No celular o toggle é o painel do dropdown: escolher fecha.
      abrirPublicoMenu(false);
    });
  }

  /* --------------------------------------------------------------------
     Dropdown do público (só no celular)
     No desktop o botão não aparece e a classe não muda nada; no celular
     ela é o que mostra o toggle, como painel sob o botão.
     -------------------------------------------------------------------- */
  function abrirPublicoMenu(abrir) {
    if (!publicoMenu || !publicoBotao) return;
    publicoMenu.classList.toggle("aberto", abrir);
    publicoBotao.setAttribute("aria-expanded", abrir ? "true" : "false");
  }

  if (publicoBotao) {
    publicoBotao.addEventListener("click", function () {
      abrirPublicoMenu(!publicoMenu.classList.contains("aberto"));
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".publico-menu")) abrirPublicoMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && publicoMenu.classList.contains("aberto")) {
        abrirPublicoMenu(false);
        publicoBotao.focus();
      }
    });
  }

  /* --------------------------------------------------------------------
     Níveis 1 e 2
     -------------------------------------------------------------------- */
  function sincronizarCaminho() {
    if (!crumbMenu || !crumbSub) return;
    // Na raiz o degrau do menu seria "Início > Início": some.
    crumbMenu.hidden = menu === MENU_RAIZ;
    if (!crumbMenu.hidden) crumbMenu.textContent = rotuloMenu(menu);

    var conjunto = conjuntoDe(menu);
    var link = conjunto && conjunto.querySelector('a[data-sub="' + atalho + '"]');
    crumbSub.hidden = !link;
    if (link) crumbSub.textContent = link.textContent.trim();
  }

  function ativar(idMenu, idAtalho, gravarHash) {
    var conjunto = conjuntoDe(idMenu);
    if (!conjunto) return;

    // Nenhum atalho vem marcado por padrão. Eles são acesso rápido, não
    // seções da página: destacar o primeiro só porque é o primeiro diria
    // que o visitante está nele, o que não é verdade.
    var opcoes = conjunto.querySelectorAll("a[data-sub]");
    var escolhido = null;
    Array.prototype.forEach.call(opcoes, function (op) {
      if (op.getAttribute("data-sub") === idAtalho) escolhido = idAtalho;
    });

    menu = idMenu;
    atalho = escolhido;
    document.body.setAttribute("data-menu", menu);

    marcar(abas, menu, "data-menu");
    if (marca) marca.setAttribute("aria-current", menu === MENU_RAIZ ? "true" : "false");

    Array.prototype.forEach.call(conjuntos, function (c) {
      c.classList.toggle("ativo", c.getAttribute("data-de") === menu);
    });
    marcar(opcoes, atalho, "data-sub");

    var ativo = atalho && conjunto.querySelector('a[aria-current="true"]');
    if (ativo) {
      // A barra rola na horizontal e o atalho ativo pode nascer fora da
      // vista. A conta é feita em rects, e não com scrollIntoView, porque
      // este último também mexe na rolagem vertical da página.
      var caixa = conjunto.getBoundingClientRect();
      var item = ativo.getBoundingClientRect();
      conjunto.scrollLeft += (item.left - caixa.left) - (caixa.width - item.width) / 2;
    }

    sincronizarCaminho();
    if (gravarHash !== false) escreverHash();
  }

  /* --------------------------------------------------------------------
     Camada do nível 2 (celular)
     No celular a faixa de atalhos não fica sob o navbar: a aba da barra de
     baixo abre o nível 2 como uma camada de tela cheia por cima do
     conteúdo — o passo seguinte, como nos apps —, com a lista vertical e
     um voltar. Escolher um atalho conclui o passo e fecha a camada.

     A camada é a própria .subbar, restilizada pelo CSS a partir da classe
     no body. No desktop a classe nunca é posta, porque só as abas do
     rodapé a abrem.
     -------------------------------------------------------------------- */
  function abrirCamada(abrir) {
    if (tituloCamada) tituloCamada.textContent = rotuloMenu(menu);
    if (camadaAberta === abrir) return;
    camadaAberta = abrir;
    document.body.classList.toggle("nivel2-aberto", abrir);
    // A camada reaproveita a rolagem da lista: abrir sempre no topo dela.
    if (abrir) {
      var conjunto = conjuntoDe(menu);
      if (conjunto) conjunto.scrollTop = 0;
      if (voltarCamada) voltarCamada.focus({ preventScroll: true });
    }
  }

  if (voltarCamada) {
    voltarCamada.addEventListener("click", function () { abrirCamada(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && camadaAberta) abrirCamada(false);
  });

  document.addEventListener("click", function (e) {
    var alvo = e.target.closest("a[data-menu], a[data-sub]");
    if (!alvo) return;
    var destinoMenu = alvo.getAttribute("data-menu");
    if (destinoMenu) {
      if (!conjuntoDe(destinoMenu)) return;
      e.preventDefault();
      var daBarraDeAbas = !!alvo.closest(".mobile-tabbar");
      // Tocar de novo na aba da camada aberta fecha, como nos apps de abas.
      if (daBarraDeAbas && camadaAberta && destinoMenu === menu) {
        abrirCamada(false);
        return;
      }
      // Reabrir pela aba o menu em que já se está preserva o atalho
      // escolhido, para ele aparecer marcado na lista.
      ativar(destinoMenu, daBarraDeAbas && destinoMenu === menu ? atalho : null);
      abrirCamada(daBarraDeAbas);
      return;
    }
    // Num atalho, o menu é o da barra em que ele está — não o atual, que
    // seria o mesmo mas por acidente.
    var barra = alvo.closest(".submenu[data-de]");
    e.preventDefault();
    ativar(barra ? barra.getAttribute("data-de") : menu, alvo.getAttribute("data-sub"));
    abrirCamada(false);
  });

  /* --------------------------------------------------------------------
     As três barras são fixas e param empilhadas: o topbar em 0, o navbar
     logo abaixo dele e a faixa de atalhos abaixo dos dois. As alturas mudam
     com a largura da tela — no celular o topbar quebra em duas linhas e o
     navbar também —, então elas são medidas em vez de escritas à mão.
     -------------------------------------------------------------------- */
  var topbar = document.querySelector(".topbar");

  // function encaixarBarras() {
  //   var alturaTopo = topbar ? topbar.offsetHeight : 0;
  //   if (navbar) navbar.style.top = alturaTopo + "px";
  //   subbar.style.top = alturaTopo + (navbar ? navbar.offsetHeight : 0) + "px";
  // }
  function encaixarBarras() {
    if (navbar) navbar.style.top = "0px";
    if (subbar) subbar.style.top = (navbar ? navbar.offsetHeight : 0) + "px";
  }
  window.addEventListener("resize", encaixarBarras);

  /* --------------------------------------------------------------------
     Estado inicial e histórico
     -------------------------------------------------------------------- */
  function daUrl(gravarHash) {
    var m = location.hash.match(/^#(?:(voce|empresa)\/)?([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/) || [];
    // O público entra antes do menu: quem ativa o menu já grava o hash
    // inteiro, e gravaria o público errado se viesse depois.
    trocarPublico(m[1] || publico, false);
    ativar(conjuntoDe(m[2]) ? m[2] : MENU_RAIZ, m[3] || null, gravarHash);
  }

  window.addEventListener("popstate", function () { abrirCamada(false); daUrl(false); });
  window.addEventListener("hashchange", function () { abrirCamada(false); daUrl(false); });

  encaixarBarras();
  daUrl(false);
})();
